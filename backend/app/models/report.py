from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Report(Base):
    __tablename__ = "report"

    report_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    generated_by: Mapped[str | None] = mapped_column(ForeignKey("staff.staff_id"), nullable=True)
    report_type: Mapped[str] = mapped_column(String(120))
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

