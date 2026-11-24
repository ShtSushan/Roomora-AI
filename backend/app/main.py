from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import init_db
from app.routes import design, projects, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()  # creates roomora.db and its tables on first start
    yield


app = FastAPI(title="Roomora AI API", lifespan=lifespan)

# CORS: browsers block a web page on one address (the React app on
# port 5173) from calling an API on another (this server on port 8000)
# unless the API explicitly allows it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(design.router)
app.include_router(projects.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "roomora-backend"}