import re

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import GENERATED_DIR, UPLOAD_DIR
from app.database.database import get_db
from app.database.models import Project, Version

router = APIRouter(prefix="/api/projects", tags=["projects"])

ID_PATTERN = re.compile(r"^[0-9a-f]{32}$")


def _iso(dt) -> str:
    return dt.isoformat() + "Z"  # stored as UTC; the Z tells the browser so


def _version_out(v: Version) -> dict:
    return {
        "generated_id": v.id,
        "parent_id": v.parent_id,
        "kind": v.kind,
        "prompt_used": v.prompt_used,
        "instruction": v.instruction,
        "settings": v.settings,
        "width": v.width,
        "height": v.height,
        "created_at": _iso(v.created_at),
    }


def _get_project_or_404(db: Session, project_id: str) -> Project:
    project = db.get(Project, project_id) if ID_PATTERN.fullmatch(project_id) else None
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project


@router.get("")
def list_projects(db: Session = Depends(get_db)):
    projects = db.scalars(select(Project).order_by(Project.updated_at.desc())).all()
    return [
        {
            "project_id": p.id,
            "name": p.name,
            "original_image_id": p.original_image_id,
            "latest_generated_id": p.versions[-1].id if p.versions else None,
            "version_count": len(p.versions),
            "created_at": _iso(p.created_at),
            "updated_at": _iso(p.updated_at),
        }
        for p in projects
    ]


@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    p = _get_project_or_404(db, project_id)
    return {
        "project_id": p.id,
        "name": p.name,
        "original_image_id": p.original_image_id,
        "created_at": _iso(p.created_at),
        "updated_at": _iso(p.updated_at),
        "versions": [_version_out(v) for v in p.versions],
    }


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    p = _get_project_or_404(db, project_id)
    version_ids = [v.id for v in p.versions]
    original_id = p.original_image_id

    db.delete(p)  # the cascade removes its versions too
    db.commit()

    # Files go after the database commit: if a file can't be removed we are left
    # with a harmless stray file, never a database row pointing at nothing.
    for version_id in version_ids:
        (GENERATED_DIR / f"{version_id}.png").unlink(missing_ok=True)
    (UPLOAD_DIR / f"{original_id}.png").unlink(missing_ok=True)

    return Response(status_code=204)