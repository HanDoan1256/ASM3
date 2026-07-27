from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.report import DashboardOverview, ReportRead
from app.services.report_service import ReportService

router = APIRouter()


@router.get("", response_model=list[ReportRead])
def list_reports(db: Session = Depends(get_db)) -> list[ReportRead]:
    return ReportService(db).list_reports()


@router.get("/dashboard", response_model=DashboardOverview)
def dashboard_overview(db: Session = Depends(get_db)) -> DashboardOverview:
    return DashboardOverview(**ReportService(db).dashboard_overview())


@router.get("/{report_type}")
def generate_report(report_type: str, db: Session = Depends(get_db)):
    try:
        return ReportService(db).generate_report(report_type)
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
