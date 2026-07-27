from sqlalchemy import Text, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Branch(Base):
    __tablename__ = "branch"

    branch_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    branch_name: Mapped[str] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

