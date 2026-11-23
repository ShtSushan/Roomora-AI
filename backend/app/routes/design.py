import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.config import GENERATED_DIR, UPLOAD_DIR
from app.services.comfyui_service import (
    ComfyUIBusy,
    ComfyUIError,
    ComfyUITimeout,
    ComfyUIUnavailable,
    generate_image,
)
from app.services.image_service import ImageValidationError, save_generated_image
from app.services.prompt_service import PromptError, build_prompt

router = APIRouter(prefix="/api", tags=["design"])

ID_PATTERN = re.compile(r"^[0-9a-f]{32}$")


class GenerateRequest(BaseModel):
    image_id: str = Field(pattern=r"^[0-9a-f]{32}$")
    room_type: str
    style: str
    palette: str
    prompt: str = Field(default="", max_length=500)


# A plain `def` (not `async def`): FastAPI runs it in a worker thread, so the
# 20-40 second generation does not freeze the rest of the server.
@router.post("/design/generate")
def generate_design(request: GenerateRequest):
    source = UPLOAD_DIR / f"{request.image_id}.png"
    if not source.is_file():
        raise HTTPException(status_code=404, detail="Uploaded image not found.")

    try:
        prompt = build_prompt(request.room_type, request.style, request.palette, request.prompt)
    except PromptError as error:
        raise HTTPException(status_code=400, detail=str(error))

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


@router.get("/generated/{generated_id}")
def get_generated_image(generated_id: str):
    if not ID_PATTERN.fullmatch(generated_id):
        raise HTTPException(status_code=404, detail="Image not found.")
    path = GENERATED_DIR / f"{generated_id}.png"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(path, media_type="image/png")