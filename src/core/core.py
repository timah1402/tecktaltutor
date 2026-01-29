from src.core.core import load_config_with_main, get_agent_params

# Load main configuration (returns main.yaml content)
config = load_config_with_main("main.yaml", project_root) # pyright: ignore[reportUndefinedVariable]

# Load agent parameters (temperature, max_tokens)
params = get_agent_params("solve")
temperature = params["temperature"]
max_tokens = params["max_tokens"]