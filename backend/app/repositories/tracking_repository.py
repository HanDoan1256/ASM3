from sqlalchemy.orm import Session

from app.models.tracking import Tracking
from app.repositories.base import BaseRepository


class TrackingRepository(BaseRepository[Tracking]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Tracking)

