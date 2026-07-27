from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Shipment(Base):
    __tablename__ = "shipment"

    shipment_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("shipment_order.order_id"), unique=True)
    vehicle_id: Mapped[str | None] = mapped_column(ForeignKey("vehicle.vehicle_id"), nullable=True)
    driver_id: Mapped[str | None] = mapped_column(ForeignKey("driver.driver_id"), nullable=True)
    route_id: Mapped[int | None] = mapped_column(ForeignKey("route.route_id"), nullable=True)
    track_id: Mapped[str | None] = mapped_column(ForeignKey("tracking.track_id"), nullable=True, unique=True)
    departure_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    arrival_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    shipment_status: Mapped[str] = mapped_column(String(120))

