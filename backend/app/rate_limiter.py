import os
from fastapi import HTTPException
import redis
import dotenv
dotenv.load_dotenv()

REDIS_URL = os.getenv("REDIS_RATE_LIMIT_URL", "redis://localhost:6379/0")

redis_client = redis.Redis.from_url(REDIS_URL)

def is_limited(uid: str, limit: int = 3, period: int = 3600) -> bool:
    key = f"rate_limit:{uid}"
    current = redis_client.get(key)

    if current == 1:
        redis_client.expire(key, period)

    return current > limit if current else False

def limit(uid: str, limit: int = 100, period: int = 600) -> bool:
    if is_limited(uid, limit, period):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

