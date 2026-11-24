from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_URL

# check_same_thread=False: FastAPI runs our endpoints in worker threads, and
# SQLite would otherwise refuse to be used from a different thread.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Every table class inherits from this."""


def get_db():
    """FastAPI dependency: one database session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.database import models  # noqa: F401  (importing registers the tables)

    Base.metadata.create_all(bind=engine)  # creates missing tables, never changes existing ones