import asyncio
import logging
from pathlib import Path
import sys
import traceback
from typing import Any

from fastapi import APIRouter, WebSocket
from pydantic import BaseModel

from src.agents.research.agents import RephraseAgent
from src.agents.research.research_pipeline import ResearchPipeline
from src.api.utils.history import ActivityType, history_manager
from src.api.utils.task_id_manager import TaskIDManager
from src.logging import get_logger
from src.services.config import load_config_with_main
from src.services.llm import get_llm_config
from src.services.settings.interface_settings import get_ui_language

# Force stdout to use utf-8 to prevent encoding errors with emojis on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

router = APIRouter()


class CancelledException(Exception):
    """Exception raised when WebSocket connection is lost during processing"""
    pass


async def check_websocket_connected(websocket: WebSocket):
    """Check if WebSocket is still connected, raise CancelledException if not"""
    try:
        # Try to receive with immediate timeout to check connection status
        await asyncio.wait_for(websocket.receive_text(), timeout=0.001)
    except asyncio.TimeoutError:
        # Timeout is expected - connection is alive
        pass
    except Exception:
        # Any other exception means connection was lost
        raise CancelledException("WebSocket connection lost")


# Helper to load config (with main.yaml merge)
def load_config():
    project_root = Path(__file__).parent.parent.parent.parent
    return load_config_with_main("research_config.yaml", project_root)


# Initialize logger with config
config = load_config()
log_dir = config.get("paths", {}).get("user_log_dir") or config.get("logging", {}).get("log_dir")
logger = get_logger("ResearchAPI", log_dir=log_dir)


class OptimizeRequest(BaseModel):
    topic: str
    iteration: int = 0
    previous_result: dict[str, Any] | None = None
    kb_name: str | None = "ai_textbook"


@router.post("/optimize_topic")
async def optimize_topic(request: OptimizeRequest):
    try:
        config = load_config()
        config.setdefault("system", {})
        config["system"]["language"] = get_ui_language(
            default=config.get("system", {}).get("language", "en")
        )

        # Inject API keys
        try:
            llm_config = get_llm_config()
            api_key = llm_config.api_key
            base_url = llm_config.base_url
            binding = getattr(llm_config, "binding", "openai")
        except Exception as e:
            return {"error": f"LLM config error: {e!s}"}

        # Init Agent
        agent = RephraseAgent(config=config, api_key=api_key, base_url=base_url, binding=binding)

        # Process
        # If iteration > 0, topic is treated as feedback
        if request.iteration == 0:
            result = await agent.process(request.topic, iteration=0)
        else:
            result = await agent.process(
                request.topic, iteration=request.iteration, previous_result=request.previous_result
            )

        return result

    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}


@router.websocket("/run")
async def websocket_research_run(websocket: WebSocket):
    await websocket.accept()

    # Get task ID manager
    task_manager = TaskIDManager.get_instance()

    pusher_task = None
    progress_pusher_task = None
    original_stdout = sys.stdout  # Save original stdout at the start

    try:
        # 1. Wait for config
        data = await websocket.receive_json()
        topic = data.get("topic")
        kb_name = data.get("kb_name", "ai_textbook")
        # New unified parameters
        plan_mode = data.get("plan_mode", "quick")  # quick, medium, deep, auto (default: quick for faster results)
        enabled_tools = data.get("enabled_tools", ["RAG"])  # RAG, Paper, Web
        skip_rephrase = data.get("skip_rephrase", False)
        # Legacy support
        preset = data.get("preset")  # For backward compatibility
        research_mode = data.get("research_mode")

        if not topic:
            await websocket.send_json({"type": "error", "content": "Topic is required"})
            return

        # Generate task ID
        task_key = f"research_{kb_name}_{hash(str(topic))}"
        task_id = task_manager.generate_task_id("research", task_key)

        # Send task ID to frontend
        await websocket.send_json({"type": "task_id", "task_id": task_id})

        # Use unified logger
        config = load_config()
        config.setdefault("system", {})
        config["system"]["language"] = get_ui_language(
            default=config.get("system", {}).get("language", "en")
        )
        try:
            # Get log_dir from config
            log_dir = config.get("paths", {}).get("user_log_dir") or config.get("logging", {}).get(
                "log_dir"
            )
            research_logger = get_logger("Research", log_dir=log_dir)
            research_logger.info(f"[{task_id}] Starting research flow: {topic[:50]}...")
        except Exception as e:
            logger.warning(f"Failed to initialize research logger: {e}")

        # 2. Initialize Pipeline
        # Initialize nested config structures from research.* (main.yaml structure)
        # This ensures all research module configs are properly inherited from main.yaml
        research_config = config.get("research", {})

        # Initialize planning config from research.planning
        if "planning" not in config:
            config["planning"] = research_config.get("planning", {}).copy()
        else:
            # Merge with research.planning defaults
            default_planning = research_config.get("planning", {})
            for key, value in default_planning.items():
                if key not in config["planning"]:
                    config["planning"][key] = value if not isinstance(value, dict) else value.copy()
                elif isinstance(value, dict) and isinstance(config["planning"][key], dict):
                    # Deep merge for nested dicts like decompose, rephrase
                    for k, v in value.items():
                        if k not in config["planning"][key]:
                            config["planning"][key][k] = v

        # Ensure decompose and rephrase exist
        if "decompose" not in config["planning"]:
            config["planning"]["decompose"] = {}
        if "rephrase" not in config["planning"]:
            config["planning"]["rephrase"] = {}

        # Initialize researching config from research.researching
        # This ensures execution_mode, max_parallel_topics etc. are properly inherited
        if "researching" not in config:
            config["researching"] = research_config.get("researching", {}).copy()
        else:
            # Merge with research.researching defaults (research.researching has lower priority)
            default_researching = research_config.get("researching", {})
            for key, value in default_researching.items():
                if key not in config["researching"]:
                    config["researching"][key] = value

        # Initialize reporting config from research.reporting
        # This ensures enable_citation_list, enable_inline_citations etc. are properly inherited
        if "reporting" not in config:
            config["reporting"] = research_config.get("reporting", {}).copy()
        else:
            # Merge with research.reporting defaults
            default_reporting = research_config.get("reporting", {})
            for key, value in default_reporting.items():
                if key not in config["reporting"]:
                    config["reporting"][key] = value

        # Initialize RAG config from research.rag
        # This ensures kb_name, default_mode, fallback_mode are properly inherited
        if "rag" not in config:
            config["rag"] = research_config.get("rag", {}).copy()
        else:
            # Merge with research.rag defaults
            default_rag = research_config.get("rag", {})
            for key, value in default_rag.items():
                if key not in config["rag"]:
                    config["rag"][key] = value

        # Apply plan_mode configuration (unified approach affecting both planning and researching)
        # Each mode defines:
        # - Planning: tree depth (subtopics count) and mode (manual/auto)
        # - Researching: max iterations per topic and iteration_mode (fixed/flexible)
        plan_mode_config = {
            "quick": {
                "planning": {"decompose": {"initial_subtopics": 2, "mode": "manual"}},
                "researching": {"max_iterations": 2, "iteration_mode": "fixed"},
                "description": "⚡ Quick mode: 2 subtopics, 2 iterations (~2-3 min)",
            },
            "medium": {
                "planning": {"decompose": {"initial_subtopics": 5, "mode": "manual"}},
                "researching": {"max_iterations": 4, "iteration_mode": "fixed"},
                "description": "⚙️ Medium mode: 5 subtopics, 4 iterations (~5-8 min)",
            },
            "deep": {
                "planning": {"decompose": {"initial_subtopics": 8, "mode": "manual"}},
                "researching": {"max_iterations": 7, "iteration_mode": "fixed"},
                "description": "🔬 Deep mode: 8 subtopics, 7 iterations (~15-20 min)",
            },
            "auto": {
                "planning": {"decompose": {"mode": "auto", "auto_max_subtopics": 8}},
                "researching": {"max_iterations": 6, "iteration_mode": "flexible"},
                "description": "🤖 Auto mode: Adaptive subtopics, 6 iterations (~10-15 min)",
            },
        }
        if plan_mode in plan_mode_config:
            mode_cfg = plan_mode_config[plan_mode]
            # Log the selected mode
            await websocket.send_json({
                "type": "log", 
                "content": f"📋 Research Mode: {mode_cfg.get('description', plan_mode)}\n"
            })
            # Apply planning configuration
            if "planning" in mode_cfg:
                for key, value in mode_cfg["planning"].items():
                    if key not in config["planning"]:
                        config["planning"][key] = {}
                    config["planning"][key].update(value)
            # Apply researching configuration
            if "researching" in mode_cfg:
                config["researching"].update(mode_cfg["researching"])

        # Legacy preset support (for backward compatibility)
        if preset and "presets" in config and preset in config["presets"]:
            preset_config = config["presets"][preset]
            for key, value in preset_config.items():
                if key in config and isinstance(value, dict):
                    config[key].update(value)

        # Apply enabled_tools configuration
        # RAG includes: rag_naive, rag_hybrid, query_item
        # Paper includes: paper_search
        # Web includes: web_search
        # run_code is always enabled
        config["researching"]["enable_rag_naive"] = "RAG" in enabled_tools
        config["researching"]["enable_rag_hybrid"] = "RAG" in enabled_tools
        config["researching"]["enable_query_item"] = "RAG" in enabled_tools
        config["researching"]["enable_paper_search"] = "Paper" in enabled_tools
        config["researching"]["enable_web_search"] = "Web" in enabled_tools
        config["researching"]["enable_run_code"] = True  # Always enabled

        # Store enabled_tools for prompt generation
        config["researching"]["enabled_tools"] = enabled_tools

        # Legacy research_mode support
        if research_mode:
            config["researching"]["research_mode"] = research_mode

        # If skip_rephrase is True, disable the internal rephrase step
        if skip_rephrase:
            config["planning"]["rephrase"]["enabled"] = False

        # Define unified output directory
        # Use project root directory user/research as unified output directory
        root_dir = Path(__file__).parent.parent.parent.parent
        output_base = root_dir / "data" / "user" / "research"

        # Update config with unified output paths
        if "system" not in config:
            config["system"] = {}

        config["system"]["output_base_dir"] = str(output_base / "cache")
        config["system"]["reports_dir"] = str(output_base / "reports")

        # Inject API keys from env if not in config
        try:
            llm_config = get_llm_config()
            api_key = llm_config.api_key
            base_url = llm_config.base_url
            api_version = getattr(llm_config, "api_version", None)
        except ValueError as e:
            await websocket.send_json({"error": f"LLM configuration error: {e!s}"})
            await websocket.close()
            return

        # 3. Setup Queues for log and progress
        log_queue = asyncio.Queue()
        progress_queue = asyncio.Queue()

        # Progress callback function
        def progress_callback(event: dict[str, Any]):
            """Progress callback function, puts progress events into queue"""
            try:
                asyncio.get_event_loop().call_soon_threadsafe(progress_queue.put_nowait, event)
            except Exception as e:
                logger.error(f"Progress callback error: {e}")

        pipeline = ResearchPipeline(
            config=config,
            api_key=api_key,
            base_url=base_url,
            api_version=api_version,
            research_id=task_id,
            kb_name=kb_name,
            progress_callback=progress_callback,
        )

        # 4. Background log pusher
        async def log_pusher():
            while True:
                try:
                    log = await log_queue.get()
                    if log is None:
                        break
                    # Check connection before sending
                    await check_websocket_connected(websocket)
                    await websocket.send_json({"type": "log", "content": log})
                    log_queue.task_done()
                except CancelledException:
                    logger.info(f"[{task_id}] Log pusher stopped: WebSocket disconnected")
                    break
                except Exception as e:
                    logger.error(f"Log pusher error: {e}")
                    break

        # 5. Background progress pusher
        async def progress_pusher():
            while True:
                try:
                    event = await progress_queue.get()
                    if event is None:
                        break
                    # Check connection before sending
                    await check_websocket_connected(websocket)
                    await websocket.send_json(event)
                    progress_queue.task_done()
                except CancelledException:
                    logger.info(f"[{task_id}] Progress pusher stopped: WebSocket disconnected")
                    break
                except Exception as e:
                    logger.error(f"Progress pusher error: {e}")
                    break

        pusher_task = asyncio.create_task(log_pusher())
        progress_pusher_task = asyncio.create_task(progress_pusher())

        # 5.5 WebSocket connection monitor
        pipeline_task = None
        cancellation_flag = {"cancelled": False}
        
        async def connection_monitor():
            """Monitor WebSocket connection and set cancellation flag if disconnected"""
            try:
                while not cancellation_flag["cancelled"]:
                    await asyncio.sleep(1)  # Check every second
                    await check_websocket_connected(websocket)
            except CancelledException:
                logger.info(f"[{task_id}] Connection lost, cancelling research...")
                cancellation_flag["cancelled"] = True
                if pipeline_task and not pipeline_task.done():
                    pipeline_task.cancel()
        
        monitor_task = asyncio.create_task(connection_monitor())

        # 6. Run Pipeline with stdout interception
        class ResearchStdoutInterceptor:
            def __init__(self, queue):
                self.queue = queue
                self.original_stdout = sys.stdout

            def write(self, message):
                # Write to terminal first to ensure terminal output is not blocked
                self.original_stdout.write(message)
                # Then try to send to frontend (non-blocking, failure doesn't affect terminal output)
                if message.strip():
                    try:
                        # Use call_soon_threadsafe for thread safety
                        loop = asyncio.get_event_loop()
                        loop.call_soon_threadsafe(self.queue.put_nowait, message)
                    except (asyncio.QueueFull, RuntimeError, AttributeError):
                        # Queue full, event loop closed, or no event loop, ignore error, doesn't affect terminal output
                        pass

            def flush(self):
                self.original_stdout.flush()

        sys.stdout = ResearchStdoutInterceptor(log_queue)

        try:
            await websocket.send_json(
                {"type": "status", "content": "started", "research_id": pipeline.research_id}
            )

            # Check WebSocket connection before starting expensive operation
            await check_websocket_connected(websocket)
            
            # Run pipeline in a task so we can monitor and cancel it
            pipeline_task = asyncio.create_task(pipeline.run(topic))
            result = await pipeline_task

            # Send final report content
            with open(result["final_report_path"], encoding="utf-8") as f:
                report_content = f.read()

            # Save to history
            history_manager.add_entry(
                activity_type=ActivityType.RESEARCH,
                title=topic,
                content={"topic": topic, "report": report_content, "kb_name": kb_name},
                summary=f"Research ID: {result['research_id']}",
            )

            await websocket.send_json(
                {
                    "type": "result",
                    "report": report_content,
                    "metadata": result["metadata"],
                    "research_id": result["research_id"],
                }
            )

            # Update task status to completed
            try:
                log_dir = config.get("paths", {}).get("user_log_dir") or config.get(
                    "logging", {}
                ).get("log_dir")
                research_logger = get_logger("Research", log_dir=log_dir)
                research_logger.success(f"[{task_id}] Research flow completed: {topic[:50]}...")
                task_manager.update_task_status(task_id, "completed")
            except Exception as e:
                logger.warning(f"Failed to log completion: {e}")

        finally:
            sys.stdout = original_stdout  # Safely restore using saved reference

    except CancelledException as e:
        logger.info(f"[{task_id if 'task_id' in locals() else 'unknown'}] Research cancelled: WebSocket disconnected")
        # Don't send error message as WebSocket is already closed
        try:
            if 'task_id' in locals():
                task_manager.update_task_status(task_id, "cancelled", error="User cancelled")
        except Exception:
            pass
    except asyncio.CancelledError:
        logger.info(f"[{task_id if 'task_id' in locals() else 'unknown'}] Research cancelled by user")
        try:
            if 'task_id' in locals():
                task_manager.update_task_status(task_id, "cancelled", error="User cancelled")
        except Exception:
            pass
    except Exception as e:
        await websocket.send_json({"type": "error", "content": str(e)})
        logging.error(f"Research error: {e}", exc_info=True)

        # Update task status to error
        try:
            log_dir = config.get("paths", {}).get("user_log_dir") or config.get("logging", {}).get(
                "log_dir"
            )
            research_logger = get_logger("Research", log_dir=log_dir)
            research_logger.error(f"[{task_id}] Research flow failed: {e}")
            task_manager.update_task_status(task_id, "error", error=str(e))
        except Exception as log_err:
            logger.warning(f"Failed to log error: {log_err}")
    finally:
        # Stop all background tasks
        if 'monitor_task' in locals() and monitor_task:
            monitor_task.cancel()
        if pusher_task:
            pusher_task.cancel()
        if progress_pusher_task:
            progress_pusher_task.cancel()
