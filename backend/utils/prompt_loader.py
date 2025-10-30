import os
import json
import yaml
from typing import List, Dict, Union

def load_prompts(file_path: str) -> List[Dict[str, Union[str, None]]]:
    """
    Load prompts from a .txt, .json, or .yaml file.
    Supports simple string lists or structured objects with title/description/prompt.
    Returns a list of dicts: {title, description, prompt}
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Prompts file not found at {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    def format_prompt_item(item):
        """Normalize any format to a dict with title, description, prompt."""
        if isinstance(item, str):
            return {"title": None, "description": None, "prompt": item.strip()}
        elif isinstance(item, dict):
            return {
                "title": item.get("title"),
                "description": item.get("description"),
                "prompt": item.get("prompt", "").strip(),
            }
        else:
            raise ValueError(f"Invalid prompt format: {item}")

    if ext == ".txt":
        with open(file_path, "r", encoding="utf-8") as f:
            return [format_prompt_item(line) for line in f if line.strip()]

    elif ext == ".json":
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    elif ext in (".yaml", ".yml"):
        with open(file_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

    # Normalize the data
    if isinstance(data, list):
        return [format_prompt_item(item) for item in data]
    elif isinstance(data, dict) and "prompts" in data:
        return [format_prompt_item(item) for item in data["prompts"]]
    else:
        raise ValueError("Invalid prompt file structure")


   