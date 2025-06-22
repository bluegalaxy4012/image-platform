from datetime import datetime, timedelta, timezone
import os
import dotenv
from fastapi import Depends, HTTPException
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi.security import OAuth2PasswordBearer

from app.database import SessionLocal
from app.models import User

dotenv.load_dotenv()

pass_context = CryptContext(schemes= ["bcrypt"], deprecated= "auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    return pass_context.hash(password)

def check_password(password: str, hashed_password: str) -> bool:
    return pass_context.verify(password, hashed_password)

def create_token(email: str):
    expiry = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data = {"sub": email, "exp": expiry}

    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded
    except jwt.JWTError:
        return None



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: SessionLocal = Depends(get_db)):
    try:
        decoded = decode_token(token)
        email = decoded.get("sub")
        if not email:
            raise JWTError("Email not found in token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid auth token")

    user = db.query(User).filter_by(email=email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
