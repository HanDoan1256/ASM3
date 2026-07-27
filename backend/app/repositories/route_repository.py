from sqlalchemy.orm import Session

from app.models.route import Route
from app.repositories.base import BaseRepository


class RouteRepository(BaseRepository[Route]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Route)

