from io import BytesIO
import json
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form, Body, Query
from fastapi.responses import FileResponse, JSONResponse
import os
from PIL import Image
import secrets
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta, timezone
import logging

from app.auth import check_password, create_email_token, decode_verification_token, get_current_user, hash_password
from app.celery import process_image_task
from app.database import get_db
from app.models import Image as ImageModel, ImageAccessRequest, ImageUploadRequest, LoginRequest, PasswordResetEmailRequest, PasswordResetRequest, RegisterRequest, User, VerifyRequest, mime_types, MessageResponse, UploadResponse
from app.rate_limiter import limit
from app.email import send_password_reset_email, send_register_email
from app.validators import validate_email, validate_password, validate_username

RANDOM_IMAGES_LIMIT = 5

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/testauth", tags=["test"])
async def test(_: User = Depends(get_current_user)):
    return MessageResponse(message="Logged in")


@router.post("/images/{image_id}", tags=["images"])
async def get_image(image_id: str, data: ImageAccessRequest = Body(...), db: Session = Depends(get_db)):
    image_model = db.query(ImageModel).filter_by(id=image_id).first()
    if not image_model:
        raise HTTPException(status_code=404, detail="Image not found")

    if image_model.protected:
        if not data.password or not check_password(data.password, image_model.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid password to protected image")


    ext = image_model.format.lower().strip()
    image_path = os.path.join("storage", "processed", f"{image_id}.{ext}")

    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not processed yet")

    return FileResponse(path=image_path, media_type=mime_types.get(ext, "application/octet-stream"))

@router.get("/images/random", tags=["images"])
async def get_random_images(db: Session = Depends(get_db)):
    images = db.query(ImageModel).filter(ImageModel.protected == False, ImageModel.status == "COMPLETED").order_by(func.random()).limit(RANDOM_IMAGES_LIMIT).all()
    
    if not images or len(images) != RANDOM_IMAGES_LIMIT:
        raise HTTPException(status_code=404, detail="No images found")

    return [{"id": image.id} for image in images]

@router.post("/upload", tags=["upload"])
async def upload_image(
        file: UploadFile = File(...),
        options: str = Form(...),
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    limit(user.email)

    data = ImageUploadRequest(**json.loads(options))

    format = data.format
    apply_resize = data.apply_resize
    width = data.width
    height = data.height
    apply_grayscale = data.apply_grayscale
    apply_color_inversion = data.apply_color_inversion
    apply_sepia = data.apply_sepia
    apply_blur = data.apply_blur
    protected = data.protected
    password = data.password

    if protected and not password:
        raise HTTPException(status_code=400, detail="Password must be provided for protected images")

    if not apply_resize:
        width = None
        height = None

    if file.content_type not in ["image/jpg", "image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, and PNG files are allowed")
    
    if apply_resize and (width is None or height is None):
        raise HTTPException(status_code=400, detail="Width and height must be given for resizing")

    if apply_resize and (width < 32 or height < 32 or width > 2560 or height > 2560):
        raise HTTPException(status_code=400, detail="Resized dimensions must be between 32x32 and 2560x2560 pixels")

    if sum([apply_grayscale, apply_color_inversion, apply_sepia, apply_blur]) > 1:
        raise HTTPException(status_code=400, detail="Only one filter can be applied at a time")

    if format and format.lower() not in ["jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, and PNG files are allowed")
    elif not format:
        raise HTTPException(status_code=400, detail="Format must be specified")


    content = await file.read()
   
    if len(content) > 1000000:
        raise HTTPException(status_code=400, detail="File size exceeds 1MB limit")
   
    try:
        image = Image.open(BytesIO(content))
        image.verify()
        image = Image.open(BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file")
  

    width_image, height_image = image.size
    if width_image < 32 or height_image < 32 or width_image > 2560 or height_image > 2560:
        raise HTTPException(status_code=400, detail="Image dimensions must be between 32x32 and 2560x2560 pixels")

    image_id = secrets.token_urlsafe(6)
   

    ext = format.lower().strip()
    if ext in ["jpg", "jpeg"] and image.mode != "RGB":
        image = image.convert("RGB")

    try:
        path = os.path.join("storage", "originals", f"{image_id}.{ext}")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        save_format = "PNG" if ext == "png" else "JPEG"
        image.save(path, format=save_format)
    except OSError as e:
        logger.error(f"Failed to save original image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save image")


    filters = []
    if apply_grayscale:
        filters.append("grayscale")
    elif apply_color_inversion:
        filters.append("color_inversion")
    elif apply_sepia:
        filters.append("sepia")
    elif apply_blur:
        filters.append("blur")

    logger.info(f"Image ID: {image_id}, Filters: {filters}, Width: {width}, Height: {height} - Job sent to celery worker")

    process_image_task.apply_async(args=[image_id, filters, width or 0, height or 0], countdown=5)


    try:
        image_model = ImageModel(
            id=image_id,
            format=ext.upper(),
            filters=filters if filters else None,
            width=width if apply_resize else None,
            height=height if apply_resize else None,
            status="PROCESSING",
            protected=protected,
            hashed_password=hash_password(password) if protected else None,
        )

        db.add(image_model)
        db.commit()

    except SQLAlchemyError as db_e:
        logger.error(f"Database error: {db_e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

    return UploadResponse(image_id=image_id, message="Image uploaded and processing started")


##########

@router.post("/register", tags=["auth"])
async def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    email, username, password = data.email.strip(), data.username.strip(), data.password.strip()
    validate_email(email)
    validate_username(username)
    validate_password(password)

    try:
        # small project and db
        if db.query(User).filter_by(email=email).first() or db.query(User).filter_by(username=username).first():
            raise HTTPException(status_code=400, detail="User already registered")
        
        sent_email, verification_code = send_register_email(email, username)
        if not sent_email or not verification_code:
            raise HTTPException(status_code=400, detail="Failed to send verification email")

        user = User(
            email=email,
            username=username,
            hashed_password=hash_password(password),
            verification_code=verification_code,
            verification_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15)
        )

        db.add(user)
        db.commit()

        return MessageResponse(message="Registration successful. Please check your email to verify your account")

    except SQLAlchemyError as db_e:
        logger.error(f"Database error: {db_e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")


@router.post("/login", tags=["auth"])
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    email, password = data.email.strip(), data.password.strip()
    validate_email(email)
    validate_password(password)

    user = db.query(User).filter_by(email=email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.verified:
        raise HTTPException(status_code=401, detail="User not verified. Please check your email for verification link")

    if not user or not check_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_email_token(user.email)

    response = JSONResponse(content={"message": "Logged in"})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=3600,
    )

    return response


@router.post("/logout", tags=["auth"])
def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="strict",
        path="/",
    )

    return response



@router.get("/verify", tags=["auth"])
async def verify_account(data: VerifyRequest = Depends(), db: Session = Depends(get_db)):
    verification_token = data.token.strip()

    if not verification_token:
        raise HTTPException(status_code=400, detail="Verification token is required")
    
    decoded = decode_verification_token(verification_token)
    if not decoded:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    email = decoded.get("email")
    code = decoded.get("code")
    expiry = decoded.get("exp")

    if not email or not code or not expiry:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    user = db.query(User).filter_by(email=email).first()
    if not user:
        # should be 404 but no leaking if email is registered or not
        raise HTTPException(status_code=400, detail="Invalid verification token")

    if user.verified:
        raise HTTPException(status_code=400, detail="User is already verified")

    if not code or len(code) != 8 or user.verification_code != code:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    if user.verification_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification token expired")

    try:
        user.verified = True
        user.verification_code = None
        user.verification_expires_at = None

        db.commit()
    except SQLAlchemyError as db_e:
        logger.error(f"Database error: {db_e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")
    
    return MessageResponse(message="Account verified successfully")


    
# forgot password endpoint getting email and sending reset link
@router.post("/forgot-password", tags=["auth"])
async def forgot_password(data: PasswordResetEmailRequest, db: Session = Depends(get_db)):
    # always this message, to not leak if email is registered or not
    msg = "If this email is registered, a password reset link will be sent. Check the spam folder if you don't see it in your inbox"

    email = data.email.strip()
    validate_email(email)

    user = db.query(User).filter_by(email=email).first()
    if user:
        sent_email, verification_code = send_password_reset_email(email, user.username)

        if not sent_email or not verification_code:
            logger.error("Failed to send password reset email to user " + email)
        else:
            try:
                user.verification_code = verification_code
                user.verification_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
                db.commit()
            except SQLAlchemyError as db_e:
                logger.error(f"Database error: {db_e}")
                db.rollback()
                raise HTTPException(status_code=500, detail="Database error")

    return MessageResponse(message=msg)


@router.post("/reset-password/verify", tags=["auth"])
async def verify_reset_password_token(data: VerifyRequest, db: Session = Depends(get_db)):
    verification_token = data.token.strip()

    if not verification_token:
        raise HTTPException(status_code=400, detail="Verification token is required")
    
    decoded = decode_verification_token(verification_token)
    if not decoded:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    email = decoded.get("email")
    code = decoded.get("code")
    expiry = datetime.fromtimestamp(decoded.get("exp"), tz=timezone.utc)

    if not email or not code or not expiry:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    user = db.query(User).filter_by(email=email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    if not code or len(code) != 8 or user.verification_code != code:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    if expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification token expired")

    return MessageResponse(message=f"Verification token is valid")
    
@router.post("/reset-password", tags=["auth"])
async def reset_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    new_password = data.new_password.strip()
    validate_password(new_password)

    #recheck token to be sure
    verification_token = data.token.strip()
    if not verification_token:
        raise HTTPException(status_code=400, detail="Verification token is required")
    
    decoded = decode_verification_token(verification_token)
    if not decoded:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    email = decoded.get("email")
    code = decoded.get("code")
    expiry = datetime.fromtimestamp(decoded.get("exp"), tz=timezone.utc)

    if not email or not code or not expiry:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    user = db.query(User).filter_by(email=email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    if not code or len(code) != 8 or user.verification_code != code:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    if expiry < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification token expired")

    try:
        user.hashed_password = hash_password(new_password)
        user.verification_code = None
        user.verification_expires_at = None

        db.commit()
    except SQLAlchemyError as db_e:
        logger.error(f"Database error: {db_e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

    return MessageResponse(message="Password reset successfully")