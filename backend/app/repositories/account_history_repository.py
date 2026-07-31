from sqlalchemy.orm import Session
from app.models.account_history import AccountHistory

class AccountHistoryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, customer_id: str, action: str) -> AccountHistory:
        history_record = AccountHistory(customer_id=customer_id, action=action)
        self.db.add(history_record)
        self.db.commit()
        self.db.refresh(history_record)
        return history_record

    def get_by_customer_id(self, customer_id: str) -> list[AccountHistory]:
        return (
            self.db.query(AccountHistory)
            .filter(AccountHistory.customer_id == customer_id)
            .order_by(AccountHistory.created_at.desc())
            .all()
        )