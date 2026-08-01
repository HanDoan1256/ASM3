from datetime import datetime, timezone
import json

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.statuses import RESOURCE_AVAILABLE
from app.models.payment import Payment
from app.models.report import Report
from app.models.shipment import Shipment
from app.models.shipment_order import ShipmentOrder
from app.models.vehicle import Vehicle
from app.repositories.report_repository import ReportRepository

REPORT_TYPES = {"order_summary", "shipment_status", "revenue", "fleet_utilization"}


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

    def _build_order_summary(self) -> dict:
        rows = self.db.execute(
            select(ShipmentOrder.order_status, func.count(), func.coalesce(func.sum(ShipmentOrder.total_price), 0))
            .group_by(ShipmentOrder.order_status)
        ).all()
        by_status = [
            {"order_status": status, "count": int(count), "total_value": float(total)}
            for status, count, total in rows
        ]
        total_orders = sum(item["count"] for item in by_status)
        return {"by_status": by_status, "total_orders": total_orders}

    def _build_shipment_status_report(self) -> dict:
        rows = self.db.execute(
            select(Shipment.shipment_status, func.count()).group_by(Shipment.shipment_status)
        ).all()
        return {
            "by_status": [{"shipment_status": status, "count": int(count)} for status, count in rows],
        }

    def _build_revenue_report(self) -> dict:
        total_revenue = float(self.db.scalar(select(func.coalesce(func.sum(Payment.amount), 0))) or 0)
        rows = self.db.execute(
            select(Payment.payment_method, func.count(), func.coalesce(func.sum(Payment.amount), 0))
            .group_by(Payment.payment_method)
        ).all()
        return {
            "total_revenue": total_revenue,
            "by_payment_method": [
                {"payment_method": method, "count": int(count), "total": float(total)}
                for method, count, total in rows
            ],
        }

    def _build_fleet_utilization_report(self) -> dict:
        rows = self.db.execute(select(Vehicle.status, func.count()).group_by(Vehicle.status)).all()
        total_vehicles = sum(int(count) for _, count in rows)
        available = sum(int(count) for status, count in rows if status == RESOURCE_AVAILABLE)
        utilization_rate = round((total_vehicles - available) / total_vehicles, 4) if total_vehicles else 0.0
        return {
            "by_status": [{"status": status, "count": int(count)} for status, count in rows],
            "total_vehicles": total_vehicles,
            "utilization_rate": utilization_rate,
        }

    def generate_report(self, report_type: str, generated_by: str | None = None) -> Report:
        if report_type not in REPORT_TYPES:
            raise ValueError(
                f"Unknown report type '{report_type}'. Supported types: {sorted(REPORT_TYPES)}."
            )

        builders = {
            "order_summary": self._build_order_summary,
            "shipment_status": self._build_shipment_status_report,
            "revenue": self._build_revenue_report,
            "fleet_utilization": self._build_fleet_utilization_report,
        }
        content = builders[report_type]()

        report = Report(
            generated_by=generated_by,
            report_type=report_type,
            generated_at=datetime.now(timezone.utc),
            content=json.dumps(content),
        )
        return self.report_repository.create(report)

