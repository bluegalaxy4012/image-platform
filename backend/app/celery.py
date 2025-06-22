from datetime import datetime, timezone
import os
from PIL import Image
from celery import Celery
from celery.schedules import crontab
import dotenv

from app.database import SessionLocal
from app.models import Image as ImageModel

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

        for filter_name in filters:
            if filter_name == "grayscale":
                image = image.convert("L")
            elif filter_name == "color_inversion":
                image = Image.eval(image, lambda px: 255 - px)
            elif filter_name == "sepia":
                sepia_filter = Image.new("RGB", image.size)
                for x in range(image.width):
                    for y in range(image.height):
                        r, g, b = image.getpixel((x, y))
                        tr = int(0.393 * r + 0.769 * g + 0.189 * b)
                        tg = int(0.349 * r + 0.686 * g + 0.168 * b)
                        tb = int(0.272 * r + 0.534 * g + 0.131 * b)
                        sepia_filter.putpixel((x, y), (min(tr, 255), min(tg, 255), min(tb, 255)))
                image = sepia_filter


        os.makedirs("storage/processed", exist_ok=True)
        path = f"storage/processed/{image_id}.{ext}"

        image.save(path, format=save_format)
        image_model.status = "COMPLETED"
        if width > 0 and height > 0:
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
    'cleanup_expired_images': {
        'task': 'app.celery.cleanup_expired_images',
        'schedule': crontab(hour=0, minute=0),
    },
}

@celery_cleanup.task
def cleanup_expired_images():
    try:
        db = SessionLocal()
        expired_images = db.query(ImageModel).filter(ImageModel.expires_at < datetime.now(timezone.utc)).all()

        for img in expired_images:
            db.delete(img)

            if os.path.exists(f"storage/originals/{img.id}.png"):
                os.remove(f"storage/originals/{img.id}.png")

            if os.path.exists(f"storage/processed/{img.id}.png"):
                os.remove(f"storage/processed/{img.id}.png")

        db.commit()
        db.close()
        print(f"Cleaned up {len(expired_images)} expired images.")
    except Exception as e:
        print(f"Error during cleanup: {e}")
