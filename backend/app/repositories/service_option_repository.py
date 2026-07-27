from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service_option import ServiceOption
from app.repositories.base import BaseRepository


class ServiceOptionRepository(BaseRepository[ServiceOption]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ServiceOption)

    def list_ordered(self) -> list[ServiceOption]:
        return list(self.db.scalars(select(ServiceOption).order_by(ServiceOption.service_name.asc())).all())

