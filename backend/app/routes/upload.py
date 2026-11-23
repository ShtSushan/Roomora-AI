import re

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.config import MAX_UPLOAD_BYTES, UPLOAD_DIR
from app.services.image_service import ImageValidationError, save_uploaded_image

router = APIRouter(prefix="/api", tags=["upload"])

# Our ids are uuid4 hex strings: exactly 32 characters of 0-9 and a-f.
IMAGE_ID_PATTERN = re.compile(r"^[0-9a-f]{32}$")


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        return save_uploaded_image(data)
    except ImageValidationError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/images/{image_id}")
def get_uploaded_image(image_id: str):
    # Only accept ids shaped like the ones we generate. Without this check,
    # a crafted id could try to reach files outside the uploads folder.
    if not IMAGE_ID_PATTERN.fullmatch(image_id):
        raise HTTPException(status_code=404, detail="Image not found.")

    path = UPLOAD_DIR / f"{image_id}.png"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found.")

    return FileResponse(path, media_type="image/png")