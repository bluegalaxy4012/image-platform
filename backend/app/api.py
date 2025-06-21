from io import BytesIO
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse
import os
from PIL import Image
import secrets
from app.celery import process_image_task
from app.database import SessionLocal
from app.models import Image as ImageModel
from pydantic import NonNegativeFloat


router = APIRouter()

@router.get("/test/", tags=["test"])
async def test():
    return {"message": "test endpoint"}


@router.get("/images/{image_id}/", tags=["images"])
async def get_image(image_id: str):
    image_path = os.path.join("storage", "processed", f"{image_id}.png")
    if not os.path.exists(image_path):
        return {"error": "Image not found"}
    
    return FileResponse(image_path)

@router.post("/upload/", tags=["upload"])
async def upload_image(
        file: UploadFile = File(...),
        apply_resize: bool = Form(False),
        width: int = Form(None),
        height: int = Form(None),
        apply_grayscale: bool = Form(False),
        apply_color_inversion: bool = Form(False),
        apply_sepia: bool = Form(False)
):
    if file.content_type not in ["image/jpg", "image/jpeg", "image/png"]:
        return {"error": "Only JPG, JPEG, and PNG files are allowed."}
    
    content = await file.read()
   
    if len(content) > 1000000:
        return {"error": "File size exceeds 1MB limit."}
   
    try:
        image = Image.open(BytesIO(content))
        image.verify()
        image = Image.open(BytesIO(content))
    except Exception as e:
        return {"error": f"Invalid image file: {str(e)}"}
  

    width_image, height_image = image.size
    if width_image < 32 or height_image < 32 or width_image > 2560 or height_image > 2560:
        return {"error": "Image dimensions must be between 32x32 and 2560x2560 pixels."}

    image_id = secrets.token_urlsafe(6)
    
    path = os.path.join("storage", "originals", f"{image_id}.png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    image.save(path, format="PNG")

    if not apply_resize:
        width, height = 0, 0

    filters = []
    if apply_grayscale:
        filters.append("grayscale")
    if apply_color_inversion:
        filters.append("color_inversion")
    if apply_sepia:
        filters.append("sepia")

    print(f"Image ID: {image_id}, Filters: {filters}, Width: {width}, Height: {height} - Job sent to celery worker")
    # process_image_task(image_id, filters, width, height)

    process_image_task.apply_async(args=[image_id, filters, width, height], countdown=5)


    db = SessionLocal()
    image_model = ImageModel(
        id=image_id,
        filename=file.filename,
        format=file.content_type.split("/")[-1].upper(),
        filters=filters if filters else None,
        width=width if apply_resize else None,
        height=height if apply_resize else None,
        status="PROCESSING"
    )

    db.add(image_model)
    db.commit()
    db.close()

    return {"image_id": image_id, "status": "PROCESSING", "message": "Image uploaded and processing started."}
