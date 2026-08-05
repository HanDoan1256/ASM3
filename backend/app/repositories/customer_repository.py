from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.repositories.base import BaseRepository


class CustomerRepository(BaseRepository[Customer]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Customer)

    def get_by_email(self, email: str) -> Customer | None:
        return self.db.scalar(select(Customer).where(Customer.email == email))

    def update_profile(self, customer_id: str, update_data: dict) -> Optional[Customer]:
        customer = self.get_by_id(customer_id)
        if customer:
            for key, value in update_data.items():
                setattr(customer, key, value)
            self.db.commit()
            self.db.refresh(customer)
        return customer

    def delete_account(self, customer_id: str) -> bool:
        customer = self.get_by_id(customer_id)

        if not customer:
            return False

        customer.status = "Deleted"
        self.db.commit()
        self.db.refresh(customer)

        return True
