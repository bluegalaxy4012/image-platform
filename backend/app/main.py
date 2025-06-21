from fastapi import FastAPI
from app.api import router
from app.database import init_db
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)



@app.get("/")
def read_root():
    return "root"

app.include_router(router)
