from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class ShipmentOrder(Base):
    __tablename__ = "shipment_order"

    order_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("customer.customer_id"))
    service_id: Mapped[int | None] = mapped_column(ForeignKey("service_option.service_id"), nullable=True)
    sender_address_id: Mapped[int | None] = mapped_column(ForeignKey("address.address_id"), nullable=True)
    receiver_address_id: Mapped[int | None] = mapped_column(ForeignKey("address.address_id"), nullable=True)
    package_id: Mapped[int | None] = mapped_column(ForeignKey("package_details.package_id"), nullable=True, unique=True)
    approved_by: Mapped[str | None] = mapped_column(ForeignKey("staff.staff_id"), nullable=True)
    total_price: Mapped[float] = mapped_column(Numeric(12, 2))
    order_status: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

