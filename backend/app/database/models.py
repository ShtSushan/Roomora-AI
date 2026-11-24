import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


def utcnow() -> datetime:
    # SQLite has no timezone support, so we always store UTC without tzinfo.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def new_id() -> str:
    return uuid.uuid4().hex


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(100))
    # unique=True: one project per uploaded photo, enforced by the database itself
    original_image_id: Mapped[str] = mapped_column(String(32), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    # Deleting a project deletes its versions too.
    versions: Mapped[list["Version"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="Version.created_at",
    )


class Version(Base):
    __tablename__ = "versions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # = generated_id
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), index=True)
    parent_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    kind: Mapped[str] = mapped_column(String(10))  # "redesign" or "edit"
    prompt_used: Mapped[str] = mapped_column(Text)
    instruction: Mapped[str | None] = mapped_column(Text, nullable=True)  # edits only
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # redesigns only
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    project: Mapped["Project"] = relationship(back_populates="versions")