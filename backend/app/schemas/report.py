from datetime import datetime

from app.schemas.common import ORMModel


class ReportBase(ORMModel):
    generated_by: str | None = None
    report_type: str
    generated_at: datetime
    content: str | None = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(ORMModel):
    generated_by: str | None = None
    report_type: str | None = None
    content: str | None = None


class ReportRead(ReportBase):
    report_id: int


class DashboardOverview(ORMModel):
    total_orders: int
    active_shipments: int
    fleet_available: int
    revenue: float
    recent_order_ids: list[str]
