from typing import Optional
from sqlalchemy import Column, Index, Integer, String, DateTime, JSON, Boolean
from datetime import datetime, timezone, timedelta
from app.database import Base
from pydantic import BaseModel, EmailStr

mime_types = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
}

class Image(Base):
    __tablename__ = 'images'

    id = Column(String, primary_key=True, index=True)
    format = Column(String, nullable=False)
    filters = Column(JSON, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    protected = Column(Boolean, default=False)
    hashed_password = Column(String, nullable=True)
    status = Column(String, default="PROCESSING")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc) + timedelta(days=7))

    __table_args__ = (Index("ix_image_expires_at", "expires_at"),)


class User(Base):
    __tablename__ = 'users'

    email = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    registered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    verified = Column(Boolean, default=False)
    verification_code = Column(String, nullable=True)
    verification_expires_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc) + timedelta(minutes=15))

class ImageAccessRequest(BaseModel):
    password: Optional[str] = None

class ImageUploadRequest(BaseModel):
    format: str
    apply_resize: bool = False
    width: Optional[int] = None
    height: Optional[int] = None
    apply_grayscale: bool = False
    apply_color_inversion: bool = False
    apply_sepia: bool = False
    apply_blur: bool = False
    protected: bool = False
    password: Optional[str] = None


class UploadResponse(BaseModel):
    image_id: str
    message: str

class MessageResponse(BaseModel):
    message: str


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
