from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.report import Report
from app.repositories.base import BaseRepository


class ReportRepository(BaseRepository[Report]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Report)

    def list_recent(self) -> list[Report]:
        return list(self.db.scalars(select(Report).order_by(Report.generated_at.desc())).all())
