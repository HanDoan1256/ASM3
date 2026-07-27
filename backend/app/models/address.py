from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Address(Base):
    __tablename__ = "address"

    address_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[str | None] = mapped_column(ForeignKey("customer.customer_id"), nullable=True)
    receiver_name: Mapped[str] = mapped_column(Text)
    receiver_phone: Mapped[str] = mapped_column(String(32))
    street: Mapped[str] = mapped_column(Text)
    district: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(255))
    postal_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_default: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

