import io
import uuid

from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import (
    ALLOWED_FORMATS,
    GENERATED_DIR,
    MAX_UPLOAD_BYTES,
    MAX_UPLOAD_MB,
    MIN_SIDE_PX,
    UPLOAD_DIR,
)


class ImageValidationError(Exception):
    """Raised when an uploaded file is not an acceptable image."""


def save_uploaded_image(data: bytes) -> dict:
    if len(data) == 0:
        raise ImageValidationError("The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise ImageValidationError(f"File is too large. Maximum is {MAX_UPLOAD_MB} MB.")

    # Step 1: confirm it is really an image, using its content (not its name).
    try:
        with Image.open(io.BytesIO(data)) as probe:
            probe.verify()  # checks integrity; the object is unusable afterwards
        image = Image.open(io.BytesIO(data))  # so reopen it for real use
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError):
        raise ImageValidationError("The file is not a valid image.")

    if image.format not in ALLOWED_FORMATS:
        raise ImageValidationError("Unsupported format. Use JPG, PNG or WEBP.")

    # Step 2: phone photos often store rotation in metadata instead of in the
    # pixels. This applies that rotation so the room is not sideways later.
    image = ImageOps.exif_transpose(image)

    width, height = image.size
    if min(width, height) < MIN_SIDE_PX:
        raise ImageValidationError(
            f"Image is too small. Each side must be at least {MIN_SIDE_PX}px."
        )

    # Step 3: save under a random name. We never use the client's filename,
    # because names like "../../x.py" can be used to write outside the folder.
    image_id = uuid.uuid4().hex
    filename = f"{image_id}.png"
    # PNG is lossless, so we don't add JPEG compression before the AI sees it.
    image.convert("RGB").save(UPLOAD_DIR / filename, format="PNG")

    return {
        "image_id": image_id,
        "filename": filename,
        "width": width,
        "height": height,
    }


def save_generated_image(data: bytes) -> dict:
    # Confirm the AI engine really returned an image before storing it.
    try:
        with Image.open(io.BytesIO(data)) as image:
            width, height = image.size
    except (UnidentifiedImageError, OSError):
        raise ImageValidationError("The AI engine returned an invalid image.")

    generated_id = uuid.uuid4().hex
    # ComfyUI already produced a PNG, so write it unchanged (no re-compression).
    (GENERATED_DIR / f"{generated_id}.png").write_bytes(data)

    return {"generated_id": generated_id, "width": width, "height": height}