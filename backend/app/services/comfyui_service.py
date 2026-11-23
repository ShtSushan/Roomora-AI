import json
import random
import threading
import time
import uuid
from pathlib import Path

import requests

from app.config import (
    COMFYUI_URL,
    GENERATION_TIMEOUT_S,
    WORKFLOW_NODES,
    WORKFLOW_PATH,
)


class ComfyUIError(Exception):
    """Base class for all AI-engine problems."""


class ComfyUIUnavailable(ComfyUIError):
    """ComfyUI is not running or not reachable."""


class ComfyUIBusy(ComfyUIError):
    """Another generation is already running."""


class ComfyUITimeout(ComfyUIError):
    """The job did not finish in time."""


# The 6 GB GPU can only run one generation at a time.
_job_lock = threading.Lock()


def _upload_image(path: Path) -> str:
    with path.open("rb") as f:
        response = requests.post(
            f"{COMFYUI_URL}/upload/image",
            files={"image": (path.name, f, "image/png")},
            data={"overwrite": "true"},
            timeout=30,
        )
    response.raise_for_status()
    return response.json()["name"]


def _build_workflow(image_name: str, prompt: str) -> dict:
    workflow = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    for node_id in WORKFLOW_NODES["unused"]:
        workflow.pop(node_id, None)
    workflow[WORKFLOW_NODES["image"]]["inputs"]["image"] = image_name
    workflow[WORKFLOW_NODES["prompt"]]["inputs"]["text"] = prompt
    workflow[WORKFLOW_NODES["seed"]]["inputs"]["noise_seed"] = random.randint(0, 10**15)
    return workflow


def _queue_job(workflow: dict) -> str:
    response = requests.post(
        f"{COMFYUI_URL}/prompt",
        json={"prompt": workflow, "client_id": str(uuid.uuid4())},
        timeout=30,
    )
    if response.status_code != 200:
        raise ComfyUIError(f"ComfyUI rejected the job: {response.text}")
    return response.json()["prompt_id"]


def _wait_for_result(prompt_id: str) -> dict:
    started = time.time()
    while time.time() - started < GENERATION_TIMEOUT_S:
        response = requests.get(f"{COMFYUI_URL}/history/{prompt_id}", timeout=30)
        response.raise_for_status()
        history = response.json()
        if prompt_id in history:
            entry = history[prompt_id]
            if entry.get("status", {}).get("status_str") == "error":
                raise ComfyUIError(f"Generation failed: {entry['status']}")
            return entry
        time.sleep(1)
    raise ComfyUITimeout("The AI engine took too long to respond.")


def _download_result(entry: dict) -> bytes:
    info = entry["outputs"][WORKFLOW_NODES["output"]]["images"][0]
    response = requests.get(
        f"{COMFYUI_URL}/view",
        params={
            "filename": info["filename"],
            "subfolder": info["subfolder"],
            "type": info["type"],
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.content


def generate_image(source_path: Path, prompt: str) -> bytes:
    """Send one photo and one prompt through ComfyUI; return the PNG bytes."""
    if not _job_lock.acquire(blocking=False):
        raise ComfyUIBusy("The AI engine is busy with another request.")
    try:
        image_name = _upload_image(source_path)
        workflow = _build_workflow(image_name, prompt)
        prompt_id = _queue_job(workflow)
        entry = _wait_for_result(prompt_id)
        return _download_result(entry)
    except requests.ConnectionError:
        raise ComfyUIUnavailable("Cannot reach ComfyUI.")
    except requests.RequestException as error:
        raise ComfyUIError(f"Communication with ComfyUI failed: {error}")
    finally:
        _job_lock.release()