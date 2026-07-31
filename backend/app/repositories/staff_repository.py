from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.staff import Staff
from app.repositories.base import BaseRepository

class StaffRepository(BaseRepository[Staff]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Staff)

    def get_by_email(self, email: str) -> Staff | None:
        return self.db.scalar(select(Staff).where(Staff.email == email))

    def update_profile(self, staff_id: str, update_data: dict) -> Optional[Staff]:
        staff = self.get_by_id(staff_id)
        if staff:
            for key, value in update_data.items():
                setattr(staff, key, value)
            self.db.commit()
            self.db.refresh(staff)
        return staff

    def delete_account(self, staff_id: str) -> bool:
        staff = self.get_by_id(staff_id)
        if staff:
            self.db.delete(staff)
            self.db.commit()
            return True
        return False