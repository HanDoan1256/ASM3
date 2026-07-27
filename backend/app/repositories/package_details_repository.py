from sqlalchemy.orm import Session

from app.models.package_details import PackageDetails
from app.repositories.base import BaseRepository


class PackageDetailsRepository(BaseRepository[PackageDetails]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, PackageDetails)

