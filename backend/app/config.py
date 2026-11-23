from pathlib import Path

# backend/ folder (this file is backend/app/config.py, so go up two levels)
BASE_DIR = Path(__file__).resolve().parent.parent

UPLOAD_DIR = BASE_DIR / "uploads"
GENERATED_DIR = BASE_DIR / "generated"

# Only these real image formats are accepted (checked from file content)
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

MAX_UPLOAD_MB = 15
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

# Reject tiny images (too little detail for a good redesign)
MIN_SIDE_PX = 512

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

# ---- ComfyUI (AI engine) ----
COMFYUI_URL = "http://127.0.0.1:8188"
WORKFLOW_PATH = BASE_DIR.parent / "comfyui" / "workflows" / "klein_image_edit_api.json"

# Node IDs inside klein_image_edit_api.json
WORKFLOW_NODES = {
    "image": "76",       # LoadImage: the photo to edit
    "prompt": "75:74",   # CLIPTextEncode: the edit instruction
    "seed": "75:73",     # RandomNoise: the random seed
    "output": "9",       # SaveImage: where the result is read from
    "unused": ["81"],    # leftover demo image loader, removed before sending
}

GENERATION_TIMEOUT_S = 300