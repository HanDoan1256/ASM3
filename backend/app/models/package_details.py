from sqlalchemy import Boolean, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class PackageDetails(Base):
    __tablename__ = "package_details"

    package_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    weight: Mapped[float] = mapped_column(Numeric(12, 2))
    height: Mapped[float] = mapped_column(Numeric(12, 2))
    length: Mapped[float] = mapped_column(Numeric(12, 2))
    width: Mapped[float] = mapped_column(Numeric(12, 2))
    package_type: Mapped[str] = mapped_column(String(120))
    fragile: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_sealed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    inspection_policy: Mapped[str | None] = mapped_column(String(120), nullable=True)
    security_level: Mapped[str | None] = mapped_column(String(120), nullable=True)
    declared_value: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

