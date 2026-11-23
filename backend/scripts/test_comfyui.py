"""Phase 6, Step 3: standalone test of the ComfyUI API round trip.

Usage (from the backend folder, venv active, ComfyUI Desktop running):
    python scripts\\test_comfyui.py uploads\\<some-image>.png "Your edit prompt"
"""
import json
import random
import sys
import time
import uuid
from pathlib import Path

import requests

COMFY_URL = "http://127.0.0.1:8188"
BACKEND_DIR = Path(__file__).resolve().parents[1]
WORKFLOW_PATH = BACKEND_DIR.parent / "comfyui" / "workflows" / "klein_image_edit_api.json"
OUTPUT_DIR = BACKEND_DIR / "generated"

# Node IDs found in klein_image_edit_api.json
IMAGE_NODE = "76"
PROMPT_NODE = "75:74"
SEED_NODE = "75:73"
OUTPUT_NODE = "9"
UNUSED_NODE = "81"  # leftover demo image loader, not connected to anything

DEFAULT_PROMPT = (
    "Change the sofa to dark grey. "
    "Keep the walls, ceiling, windows, and room layout unchanged."
)


def upload_image(path: Path) -> str:
    """Step 1: copy the photo into ComfyUI's input folder via its API."""
    with path.open("rb") as f:
        response = requests.post(
            f"{COMFY_URL}/upload/image",
            files={"image": (path.name, f, "image/png")},
            data={"overwrite": "true"},
            timeout=30,
        )
    response.raise_for_status()
    return response.json()["name"]  # the filename ComfyUI now knows it by


def build_workflow(image_name: str, prompt: str) -> dict:
    """Step 2: load the saved workflow and fill in this request's values."""
    workflow = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    workflow.pop(UNUSED_NODE, None)
    workflow[IMAGE_NODE]["inputs"]["image"] = image_name
    workflow[PROMPT_NODE]["inputs"]["text"] = prompt
    # New random seed each time; identical inputs would be served from cache.
    workflow[SEED_NODE]["inputs"]["noise_seed"] = random.randint(0, 10**15)
    return workflow


def queue_job(workflow: dict) -> str:
    """Step 3: put the job in ComfyUI's queue and get its id."""
    response = requests.post(
        f"{COMFY_URL}/prompt",
        json={"prompt": workflow, "client_id": str(uuid.uuid4())},
        timeout=30,
    )
    if response.status_code != 200:
        # ComfyUI explains workflow problems in the response body.
        raise RuntimeError(f"ComfyUI rejected the job: {response.text}")
    return response.json()["prompt_id"]


def wait_for_result(prompt_id: str, timeout_s: int = 300) -> dict:
    """Step 4: poll until the job appears in ComfyUI's history."""
    started = time.time()
    while time.time() - started < timeout_s:
        response = requests.get(f"{COMFY_URL}/history/{prompt_id}", timeout=30)
        response.raise_for_status()
        history = response.json()
        if prompt_id in history:  # empty until the job has finished
            entry = history[prompt_id]
            status = entry.get("status", {}).get("status_str")
            if status == "error":
                raise RuntimeError(f"Generation failed: {entry['status']}")
            return entry
        print(f"  waiting... {time.time() - started:.0f}s")
        time.sleep(1)
    raise TimeoutError("ComfyUI did not finish in time.")


def download_result(entry: dict) -> Path:
    """Step 5: fetch the finished image and save it in backend/generated."""
    info = entry["outputs"][OUTPUT_NODE]["images"][0]
    response = requests.get(
        f"{COMFY_URL}/view",
        params={
            "filename": info["filename"],
            "subfolder": info["subfolder"],
            "type": info["type"],
        },
        timeout=60,
    )
    response.raise_for_status()
    OUTPUT_DIR.mkdir(exist_ok=True)
    out_path = OUTPUT_DIR / f"test_{uuid.uuid4().hex[:8]}.png"
    out_path.write_bytes(response.content)
    return out_path


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("Usage: python scripts\\test_comfyui.py <image path> [prompt]")
    image_path = Path(sys.argv[1])
    prompt = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_PROMPT

    started = time.time()
    print("1/5 Uploading image to ComfyUI...")
    image_name = upload_image(image_path)
    print(f"    ComfyUI file name: {image_name}")

    print("2/5 Building workflow...")
    workflow = build_workflow(image_name, prompt)

    print("3/5 Queueing job...")
    prompt_id = queue_job(workflow)
    print(f"    job id: {prompt_id}")

    print("4/5 Waiting for generation...")
    entry = wait_for_result(prompt_id)

    print("5/5 Downloading result...")
    out_path = download_result(entry)
    print(f"Done in {time.time() - started:.1f}s -> {out_path}")


if __name__ == "__main__":
    main()