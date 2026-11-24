import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import GENERATED_DIR, UPLOAD_DIR
from app.database.database import get_db
from app.database.models import Project, Version, utcnow
from app.services.comfyui_service import (
    ComfyUIBusy,
    ComfyUIError,
    ComfyUITimeout,
    ComfyUIUnavailable,
    generate_image,
)
from app.services.image_service import ImageValidationError, save_generated_image
from app.services.prompt_service import (
    ROOM_TYPES,
    PromptError,
    build_edit_prompt,
    build_prompt,
)

router = APIRouter(prefix="/api", tags=["design"])

ID_PATTERN = re.compile(r"^[0-9a-f]{32}$")


class GenerateRequest(BaseModel):
    image_id: str = Field(pattern=r"^[0-9a-f]{32}$")
    room_type: str
    style: str
    palette: str
    prompt: str = Field(default="", max_length=500)


class EditRequest(BaseModel):
    generated_id: str = Field(pattern=r"^[0-9a-f]{32}$")
    instruction: str = Field(min_length=1, max_length=500)


def _run_generation(source: Path, prompt: str) -> dict:
    """Shared by generate and edit: run ComfyUI, save the result, map errors."""
    try:
        png_bytes = generate_image(source, prompt)
        result = save_generated_image(png_bytes)
    except ComfyUIBusy:
        raise HTTPException(status_code=429, detail="The AI is busy with another design. Please try again in a moment.")
    except ComfyUIUnavailable:
        raise HTTPException(status_code=503, detail="The AI engine is not running. Please start ComfyUI Desktop.")
    except ComfyUITimeout:
        raise HTTPException(status_code=504, detail="The AI took too long to respond. Please try again.")
    except (ComfyUIError, ImageValidationError) as error:
        print(f"Generation error: {error}")  # full detail stays in the server log
        raise HTTPException(status_code=502, detail="The AI engine failed to generate the design.")
    result["prompt_used"] = prompt
    return result


# Plain `def`: FastAPI runs it in a worker thread, so a 20-40 s generation
# does not freeze the rest of the server.
@router.post("/design/generate")
def generate_design(request: GenerateRequest, db: Session = Depends(get_db)):
    source = UPLOAD_DIR / f"{request.image_id}.png"
    if not source.is_file():
        raise HTTPException(status_code=404, detail="Uploaded image not found.")
    try:
        prompt = build_prompt(request.room_type, request.style, request.palette, request.prompt)
    except PromptError as error:
        raise HTTPException(status_code=400, detail=str(error))

    result = _run_generation(source, prompt)

    # A project is one uploaded photo: reuse it if it exists, otherwise create it.
    project = db.scalar(select(Project).where(Project.original_image_id == request.image_id))
    if project is None:
        project = Project(
            name=f"{ROOM_TYPES[request.room_type].capitalize()} redesign",
            original_image_id=request.image_id,
        )
        db.add(project)
    project.updated_at = utcnow()

    db.add(
        Version(
            id=result["generated_id"],
            project=project,
            kind="redesign",
            prompt_used=prompt,
            settings={
                "room_type": request.room_type,
                "style": request.style,
                "palette": request.palette,
                "custom_prompt": request.prompt.strip(),
            },
            width=result["width"],
            height=result["height"],
        )
    )
    db.commit()

    result["project_id"] = project.id
    return result


@router.post("/design/edit")
def edit_design(request: EditRequest, db: Session = Depends(get_db)):
    instruction = request.instruction.strip()
    if not instruction:
        raise HTTPException(status_code=400, detail="Please describe the change you want.")

    # The version must exist in the database, which also tells us its project.
    parent = db.get(Version, request.generated_id)
    if parent is None:
        raise HTTPException(status_code=404, detail="That design version was not found.")
    source = GENERATED_DIR / f"{parent.id}.png"
    if not source.is_file():
        raise HTTPException(status_code=404, detail="That design version was not found.")

    result = _run_generation(source, build_edit_prompt(instruction))

    parent.project.updated_at = utcnow()  # moves the project to the top of the list
    db.add(
        Version(
            id=result["generated_id"],
            project_id=parent.project_id,
            parent_id=parent.id,
            kind="edit",
            prompt_used=result["prompt_used"],
            instruction=instruction,
            width=result["width"],
            height=result["height"],
        )
    )
    db.commit()

    result["parent_id"] = parent.id
    result["project_id"] = parent.project_id
    return result


@router.get("/generated/{generated_id}")
def get_generated_image(generated_id: str):
    if not ID_PATTERN.fullmatch(generated_id):
        raise HTTPException(status_code=404, detail="Image not found.")
    path = GENERATED_DIR / f"{generated_id}.png"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(path, media_type="image/png")