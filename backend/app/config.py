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