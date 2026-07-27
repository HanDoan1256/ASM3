from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.repositories.base import BaseRepository


class DriverRepository(BaseRepository[Driver]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Driver)
