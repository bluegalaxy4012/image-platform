from sqlalchemy import Column, Index, Integer, String, DateTime, JSON
from datetime import datetime, timezone, timedelta
from app.database import Base

class Image(Base):
    __tablename__ = 'images'

    id = Column(String, primary_key=True, index=True)
    format = Column(String, nullable=False)
    filters = Column(JSON, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    status = Column(String, default="PROCESSING")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, default=lambda: datetime.now(timezone.utc) + timedelta(days=7))

    __table_args__ = (Index("ix_image_expires_at", "expires_at"),)
