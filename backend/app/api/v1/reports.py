from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import Principal, get_db, require_staff
from app.schemas.report import DashboardOverview, ReportRead
from app.services.report_service import ReportService

router = APIRouter()


@router.get("", response_model=list[ReportRead])
def list_reports(
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> list[ReportRead]:
    return ReportService(db).list_reports()


@router.get("/dashboard", response_model=DashboardOverview)
def dashboard_overview(
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> DashboardOverview:
    return DashboardOverview(**ReportService(db).dashboard_overview())


@router.get("/{report_type}", response_model=ReportRead)
def generate_report(
    report_type: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> ReportRead:
    try:
        return ReportService(db).generate_report(report_type, generated_by=principal.principal_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
