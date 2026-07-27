from sqlalchemy.orm import Session

from app.models.branch import Branch
from app.repositories.base import BaseRepository


class BranchRepository(BaseRepository[Branch]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Branch)

