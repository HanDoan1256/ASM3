from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from app.database.session import Base

class AccountHistory(Base):
    __tablename__ = "account_history"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))