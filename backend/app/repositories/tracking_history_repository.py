from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tracking_history import TrackingHistory
from app.repositories.base import BaseRepository


class TrackingHistoryRepository(BaseRepository[TrackingHistory]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, TrackingHistory)

    def list_by_track_id(self, track_id: str) -> list[TrackingHistory]:
        return list(
            self.db.scalars(
                select(TrackingHistory)
                .where(TrackingHistory.track_id == track_id)
                .order_by(TrackingHistory.recorded_at.asc())
            ).all()
        )
