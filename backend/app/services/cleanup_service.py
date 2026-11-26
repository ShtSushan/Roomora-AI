import re
import time
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import (
    COMFYUI_INPUT_DIR,
    COMFYUI_OUTPUT_DIR,
    COMFYUI_OUTPUT_PREFIX,
    GENERATED_DIR,
    UPLOAD_DIR,
)
from app.database.models import Project, Version

# Only files named like ones we created are ever considered.
UUID_PNG = re.compile(r"^[0-9a-f]{32}\.png$")
GENERATED_PATTERN = re.compile(r"^(?:[0-9a-f]{32}|test_[0-9a-f]{8})\.png$")
OUTPUT_PATTERN = re.compile(rf"^{re.escape(COMFYUI_OUTPUT_PREFIX)}_\d+_\.png$")


def _candidates(folder: Path, pattern, keep: set[str] | None, grace_s: float) -> list[Path]:
    """Files in `folder` that match our naming, are not in `keep`, and are old enough."""
    if not folder.is_dir():
        return []  # for example, ComfyUI is installed somewhere else
    found = []
    for path in folder.iterdir():
        if not path.is_file() or not pattern.fullmatch(path.name):
            continue
        if keep is not None and path.stem in keep:
            continue  # a project still uses it
        if time.time() - path.stat().st_mtime < grace_s:
            continue  # too new: might belong to a request in progress
        found.append(path)
    return found


def run_cleanup(db: Session, apply: bool = False, grace_hours: float = 24.0) -> dict:
    grace_s = grace_hours * 3600
    used_uploads = set(db.scalars(select(Project.original_image_id)))
    used_generated = set(db.scalars(select(Version.id)))

    groups = {
        "Uploads without a project": _candidates(UPLOAD_DIR, UUID_PNG, used_uploads, grace_s),
        "Generated images without a version": _candidates(GENERATED_DIR, GENERATED_PATTERN, used_generated, grace_s),
        "ComfyUI input copies": _candidates(COMFYUI_INPUT_DIR, UUID_PNG, None, grace_s),
        "ComfyUI outputs (roomora_*)": _candidates(COMFYUI_OUTPUT_DIR, OUTPUT_PATTERN, None, grace_s),
    }

    report = {}
    for name, files in groups.items():
        size = sum(f.stat().st_size for f in files)
        if apply:
            for f in files:
                f.unlink(missing_ok=True)
        report[name] = {"files": files, "bytes": size}
    return report