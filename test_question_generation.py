#!/usr/bin/env python3
"""
Diagnostic script to test question generation workflow
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


async def test_question_generation():
    """Test the complete question generation flow"""
    print("=" * 60)
    print("Testing Question Generation Workflow")
    print("=" * 60)

    # Test 1: Check if KB exists
    print("\n[1] Checking Knowledge Base...")
    try:
        from src.knowledge.manager import KnowledgeBaseManager

        kb_manager = KnowledgeBaseManager(base_dir=str(project_root / "data" / "knowledge_bases"))
        available_kbs = kb_manager.list_knowledge_bases()
        print(f"✓ Available KBs: {available_kbs}")

        kb_name = "binary tree"
        if kb_name not in available_kbs:
            print(f"✗ KB '{kb_name}' not found!")
            return False

        kb_info = kb_manager.get_info(kb_name)
        print(f"✓ KB '{kb_name}' status: {kb_info.get('status')}")
        print(f"  RAG Provider: {kb_info.get('rag_provider', 'unknown')}")

    except Exception as e:
        print(f"✗ KB check failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test 2: Check RAG Service
    print("\n[2] Testing RAG Search...")
    try:
        from src.services.rag.service import RAGService

        service = RAGService()
        result = await service.search(
            kb_name=kb_name,
            query="What is a binary tree?",
            mode="hybrid"
        )

        if result and result.get("answer"):
            print(f"✓ RAG search successful")
            print(f"  Answer preview: {result['answer'][:100]}...")
        else:
            print(f"✗ RAG search returned empty result: {result}")
            return False

    except Exception as e:
        print(f"✗ RAG search failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test 3: Test RetrieveAgent
    print("\n[3] Testing RetrieveAgent...")
    try:
        from src.agents.question.agents.retrieve_agent import RetrieveAgent

        retrieve_agent = RetrieveAgent(
            kb_name=kb_name,
            rag_mode="hybrid",
            language="en"
        )

        requirement = {
            "knowledge_point": "Binary Tree Traversal",
            "difficulty": "medium",
            "question_type": "written"
        }

        retrieval_result = await retrieve_agent.process(
            requirement=requirement,
            num_queries=2
        )

        print(f"✓ RetrieveAgent completed")
        print(f"  Has content: {retrieval_result.get('has_content')}")
        print(f"  Queries: {retrieval_result.get('queries', [])}")

        if not retrieval_result.get("has_content"):
            print(f"✗ No content retrieved!")
            print(f"  Retrievals: {retrieval_result.get('retrievals', [])}")
            return False

    except Exception as e:
        print(f"✗ RetrieveAgent failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test 4: Test Full Question Generation
    print("\n[4] Testing Full Question Generation...")
    try:
        from src.agents.question import AgentCoordinator
        from src.services.llm.config import get_llm_config

        llm_config = get_llm_config()

        coordinator = AgentCoordinator(
            api_key=llm_config.api_key,
            base_url=llm_config.base_url,
            kb_name=kb_name,
            language="en",
            output_dir=str(project_root / "data" / "user" / "question")
        )

        requirement = {
            "knowledge_point": "Binary Tree Basics",
            "difficulty": "easy",
            "question_type": "written"
        }

        result = await coordinator.generate_question(requirement)

        if result.get("success"):
            print(f"✓ Question generation successful!")
            question = result.get("question", {})
            print(f"  Question: {question.get('question', 'N/A')[:100]}...")
            print(f"  Relevance: {result.get('validation', {}).get('relevance', 'N/A')}")
        else:
            print(f"✗ Question generation failed!")
            print(f"  Error: {result.get('error')}")
            print(f"  Message: {result.get('message')}")
            return False

    except Exception as e:
        print(f"✗ Question generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("\n" + "=" * 60)
    print("✓ All tests passed!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = asyncio.run(test_question_generation())
    sys.exit(0 if success else 1)
