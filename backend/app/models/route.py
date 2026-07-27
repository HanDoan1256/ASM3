from sqlalchemy import Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Route(Base):
    __tablename__ = "route"

    route_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    origin: Mapped[str] = mapped_column(Text)
    destination: Mapped[str] = mapped_column(Text)
    distance: Mapped[float] = mapped_column(Numeric(12, 2))
    estimated_time: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

