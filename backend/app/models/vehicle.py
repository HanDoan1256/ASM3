from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Vehicle(Base):
    __tablename__ = "vehicle"

    vehicle_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    plate_number: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    vehicle_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    capacity: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[str | None] = mapped_column(Text, nullable=True)
    branch_id: Mapped[str | None] = mapped_column(ForeignKey("branch.branch_id"), nullable=True)
