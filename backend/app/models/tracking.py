from datetime import datetime
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Tracking(Base):
    __tablename__ = "tracking"

    track_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    current_location: Mapped[str] = mapped_column(Text)
    last_updated: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), 
        nullable=True, 
        server_default=func.now(), 
        onupdate=func.now()
    )
    status: Mapped[str | None] = mapped_column(Text, nullable=True, default="Pending")