from io import BytesIO
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
import os
from PIL import Image
import secrets
from app.auth import check_password, create_token, get_current_user, hash_password
from app.celery import process_image_task
from app.database import SessionLocal, get_db
from app.models import Image as ImageModel, User, mime_types, MessageResponse, UploadResponse, AuthResponse
from sqlalchemy.orm import Session

from app.rate_limiter import limit
from app.validators import validate_email, validate_password, validate_username


router = APIRouter()

@router.get("/test/", tags=["test"])
async def test():
    return {"message": "test endpoint"}


@router.get("/images/{image_id}/", tags=["images"])
async def get_image(image_id: str, db: Session = Depends(get_db)):
    try:
        image_model = db.query(ImageModel).filter_by(id=image_id).first()
        if not image_model:
            # return {"error": "Image not found in database"}
            raise HTTPException(status_code=404, detail="Image not found")

        ext = image_model.format.lower().strip()
        image_path = os.path.join("storage", "processed", f"{image_id}.{ext}")

        if not os.path.exists(image_path):
            # return {"error": "Image not found on server"}
            raise HTTPException(status_code=404, detail="Image not found")
    except HTTPException as http_e:
        raise http_e
    except Exception as e:
        # return {"error": f"Database error: {str(e)}"}
        raise HTTPException(status_code=500, detail=f"Unexpected database error")

    return FileResponse(path=image_path, media_type=mime_types.get(ext, "application/octet-stream"))

@router.post("/upload/", tags=["upload"])
async def upload_image(
        file: UploadFile = File(...),
        format: Optional[str] = Form(None),
        apply_resize: bool = Form(False),
        width: Optional[int] = Form(None),
        height: Optional[int] = Form(None),
        apply_grayscale: bool = Form(False),
        apply_color_inversion: bool = Form(False),
        apply_sepia: bool = Form(False),
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    limit(user.email)

    if not apply_resize:
        width = None
        height = None

    if file.content_type not in ["image/jpg", "image/jpeg", "image/png"]:
        # return {"error": "Only JPG, JPEG, and PNG files are allowed."}
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, and PNG files are allowed.")
    
    if apply_resize and (width is None or height is None):
        # return {"error": "Width and height must be given for resizing."}
        raise HTTPException(status_code=400, detail="Width and height must be given for resizing.")

    if apply_resize and (width < 32 or height < 32 or width > 2560 or height > 2560):
        # return {"error": "Resized dimensions must be between 32x32 and 2560x2560 pixels."}
        raise HTTPException(status_code=400, detail="Resized dimensions must be between 32x32 and 2560x2560 pixels.")

    if sum([apply_grayscale, apply_color_inversion, apply_sepia]) > 1:
        # return {"error": "Only one filter can be applied at a time."}
        raise HTTPException(status_code=400, detail="Only one filter can be applied at a time.")

    if format and format.lower() not in ["jpg", "jpeg", "png"]:
        # return {"error": "Invalid format specified. Only JPG, JPEG, and PNG are allowed."}
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, and PNG files are allowed.")
    elif not format:
        # return {"error": "Format must be specified."}
        raise HTTPException(status_code=400, detail="Format must be specified.")


    content = await file.read()
   
    if len(content) > 1000000:
        # return {"error": "File size exceeds 1MB limit."}
        raise HTTPException(status_code=400, detail="File size exceeds 1MB limit.")
   
    try:
        image = Image.open(BytesIO(content))
        image.verify()
        image = Image.open(BytesIO(content))
    except Exception as e:
        # return {"error": f"Invalid image file: {str(e)}"}
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
  

    width_image, height_image = image.size
    if width_image < 32 or height_image < 32 or width_image > 2560 or height_image > 2560:
        # return {"error": "Image dimensions must be between 32x32 and 2560x2560 pixels."}
        raise HTTPException(status_code=400, detail="Image dimensions must be between 32x32 and 2560x2560 pixels.")

    image_id = secrets.token_urlsafe(6)
   

    ext = format.lower().strip()
    if ext in ["jpg", "jpeg"] and image.mode != "RGB":
        image = image.convert("RGB")

    path = os.path.join("storage", "originals", f"{image_id}.{ext}")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    save_format = "PNG" if ext == "png" else "JPEG"
    image.save(path, format=save_format)


    filters = []
    if apply_grayscale:
        filters.append("grayscale")
    elif apply_color_inversion:
        filters.append("color_inversion")
    elif apply_sepia:
        filters.append("sepia")

    print(f"Image ID: {image_id}, Filters: {filters}, Width: {width}, Height: {height} - Job sent to celery worker")

    process_image_task.apply_async(args=[image_id, filters, width, height], countdown=5)


    try:
        image_model = ImageModel(
            id=image_id,
            format=ext.upper(),
            filters=filters if filters else None,
            width=width if apply_resize else None,
            height=height if apply_resize else None,
            status="PROCESSING"
        )

        db.add(image_model)
        db.commit()
    except Exception as e:
        db.rollback()
        # return {"error": f"Database error: {str(e)}"}
        raise HTTPException(status_code=500, detail=f"Unexpected database error")

    # return {"image_id": image_id, "status": "PROCESSING", "message": "Image uploaded and processing started."}
    return UploadResponse(image_id=image_id, message="Image uploaded and processing started")


##########

@router.post("/register/", tags=["auth"])
async def register(
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    email, username, password = email.strip(), username.strip(), password.strip()
    validate_email(email)
    validate_username(username)
    validate_password(password)

    try:
        if db.query(User).filter_by(email=email).first():
            raise HTTPException(status_code=400, detail="User already registered")
        
        user = User(email=email, username=username, password=hash_password(password))
        db.add(user)
        db.commit()
        # return {"message": "User registered successfully"}
        return MessageResponse(message="User registered successfully")

    except Exception as e:
        db.rollback()
        # return {"error": f"Database error: {str(e)}"}
        raise HTTPException(status_code=500, detail=f"Unexpected database error")

@router.post("/login/", tags=["auth"])
async def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    email, password = email.strip(), password.strip()
    validate_email(email)
    validate_password(password)

    try:
        user = db.query(User).filter_by(email=email).first()
        if not user or not check_password(password, user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        token = create_token(user.email)
        # return {"access_token": token, "token_type": "bearer"}
        return AuthResponse(access_token=token, token_type="bearer")

    except Exception as e:
        # return {"error": f"Database error: {str(e)}"}
        raise HTTPException(status_code=500, detail=f"Unexpected database error")


