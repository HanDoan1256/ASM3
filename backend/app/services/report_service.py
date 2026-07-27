from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.report import Report
from app.models.shipment import Shipment
from app.models.shipment_order import ShipmentOrder
from app.models.vehicle import Vehicle
from app.repositories.report_repository import ReportRepository


class ReportService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.report_repository = ReportRepository(db)

    def list_reports(self):
        return self.report_repository.list_recent()

    def dashboard_overview(self) -> dict[str, int | float | list[str]]:
        total_orders = self.db.scalar(select(func.count()).select_from(ShipmentOrder)) or 0
        active_shipments = self.db.scalar(select(func.count()).select_from(Shipment)) or 0
        fleet_available = self.db.scalar(
            select(func.count()).select_from(Vehicle).where(Vehicle.status == "Available")
        ) or 0
        revenue = float(self.db.scalar(select(func.coalesce(func.sum(Payment.amount), 0)).select_from(Payment)) or 0)
        recent_order_ids = [
            row[0]
            for row in self.db.execute(
                select(ShipmentOrder.order_id).order_by(ShipmentOrder.created_at.desc()).limit(5)
            ).all()
        ]
        return {
            "total_orders": int(total_orders),
            "active_shipments": int(active_shipments),
            "fleet_available": int(fleet_available),
            "revenue": revenue,
            "recent_order_ids": recent_order_ids,
        }

    def generate_report(self, report_type: str) -> Report:
        raise NotImplementedError(f"TODO: Implement report generation for report type '{report_type}'.")
