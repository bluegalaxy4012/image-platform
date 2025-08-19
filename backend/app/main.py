from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
from app.database import init_db
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)


# only https
@app.middleware("http")
async def enforce_https(request: Request, call_next):
    if request.headers.get("x-forwarded-proto", "http") == "https":
        request.scope["scheme"] = "https"
    response = await call_next(request)
    return response


origins = [
       "https://rapidpic.marian.homes",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
