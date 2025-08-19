from datetime import datetime, timezone
import os
from PIL import Image, ImageFilter
from celery import Celery
from celery.schedules import crontab
import dotenv
import numpy as np

from app.database import SessionLocal
from app.models import Image as ImageModel, User

dotenv.load_dotenv()

celery_app = Celery(
    "image_processing",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

@celery_app.task
def process_image_task(image_id: str, filters: list, width: int = 0, height: int = 0):
    try:
        db = SessionLocal()
        image_model = db.query(ImageModel).filter_by(id=image_id).first()
        if not image_model:
            raise ValueError(f"Image with ID {image_id} not found in db.")

        ext = image_model.format.lower().strip()
        save_format = "PNG" if ext == "png" else "JPEG"

        image = Image.open(f"storage/originals/{image_id}.{ext}")
        if width and height:
            image = image.resize((width, height))

        alpha = None
        if image.mode == "RGBA" and save_format == "PNG":
            alpha = image.split()[-1]
            image = image.convert("RGB")

        for filter_name in filters:
            if filter_name == "grayscale":
                image = image.convert("L")
            elif filter_name == "color_inversion":
                image_array = np.array(image)
                image_array = 255 - image_array
                image = Image.fromarray(image_array)
            elif filter_name == "sepia":
                image_array = np.array(image).astype(float)
                sepia_matrix = np.array([[0.393, 0.769, 0.189],
                                         [0.349, 0.686, 0.168],
                                         [0.272, 0.534, 0.131]])
                
                image_array = np.clip(image_array @ sepia_matrix.T, 0, 255).astype(np.uint8)
                image = Image.fromarray(image_array)
            elif filter_name == "blur":
                image = image.filter(ImageFilter.GaussianBlur(radius=6))

        if alpha:
            image = image.convert("RGBA")
            image.putalpha(alpha)

        os.makedirs("storage/processed", exist_ok=True)
        path = f"storage/processed/{image_id}.{ext}"

        image.save(path, format=save_format)
        image_model.status = "COMPLETED"
        if width and height and width > 0 and height > 0:
            image_model.width = width
            image_model.height = height
        db.commit()
        db.close()

        return {"image_id": image_id, "status": "COMPLETED", "message": "Image processed successfully."}

    except Exception as e:
        db.rollback()
        db.close()
        return {"image_id": image_id, "status": "FAILED", "message": str(e)}


celery_cleanup = Celery(
    "image_cleanup",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
)

celery_cleanup.conf.beat_schedule = {
    'cleanup_expired_data': {
        'task': 'app.celery.cleanup_expired_data',
        'schedule': crontab(minute="*/15"),
    },
}

@celery_cleanup.task
def cleanup_expired_data():
    try:
        db = SessionLocal()

        # expired images
        expired_images = db.query(ImageModel).filter(ImageModel.expires_at < datetime.now(timezone.utc)).all()

        for img in expired_images:
            db.delete(img)

            if os.path.exists(f"storage/originals/{img.id}.png"):
                os.remove(f"storage/originals/{img.id}.png")

            if os.path.exists(f"storage/processed/{img.id}.png"):
                os.remove(f"storage/processed/{img.id}.png")

        # expired users
        expired_unverified_users = db.query(User).filter(User.verified == False, User.verification_expires_at < datetime.now(timezone.utc)).all()
        for user in expired_unverified_users:
            db.delete(user)

        db.commit()
        print(f"Cleaned up {len(expired_images)} expired images and {len(expired_unverified_users)} expired unverified users.")
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")
        raise e
    finally:
        db.close()
