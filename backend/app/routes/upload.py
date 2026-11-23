from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import MAX_UPLOAD_BYTES
from app.services.image_service import ImageValidationError, save_uploaded_image

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # Read at most one byte over the limit, so a huge upload can't fill RAM
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    try:
        return save_uploaded_image(data)
    except ImageValidationError as error:
        raise HTTPException(status_code=400, detail=str(error))