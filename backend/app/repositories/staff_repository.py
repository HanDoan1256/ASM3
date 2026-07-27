from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.staff import Staff
from app.repositories.base import BaseRepository


class StaffRepository(BaseRepository[Staff]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Staff)

    def get_by_email(self, email: str) -> Staff | None:
        return self.db.scalar(select(Staff).where(Staff.email == email))

