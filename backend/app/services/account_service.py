from sqlalchemy.orm import Session

from app.models.address import Address
from app.repositories.address_repository import AddressRepository
from app.repositories.customer_repository import CustomerRepository
from app.schemas.account import AddressCreate, AddressUpdate, CustomerUpdate


class AccountService:
    def __init__(self, db: Session) -> None:
        self.address_repository = AddressRepository(db)
        self.customer_repository = CustomerRepository(db)

    def get_customer(self, customer_id: str):
        return self.customer_repository.get_by_id(customer_id)

    def update_customer(self, customer_id: str, payload: CustomerUpdate):
        customer = self.customer_repository.get_by_id(customer_id)
        if not customer:
            return None
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(customer, field, value)
        return self.customer_repository.update(customer)

    def list_addresses(self, customer_id: str):
        return self.address_repository.list_by_customer_id(customer_id)

    def create_address(self, customer_id: str, payload: AddressCreate):
        address = Address(customer_id=customer_id, **payload.model_dump(exclude={"customer_id"}))
        return self.address_repository.create(address)

    def update_address(self, address_id: int, payload: AddressUpdate):
        address = self.address_repository.get_by_id(address_id)
        if not address:
            return None
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(address, field, value)
        return self.address_repository.update(address)

    def delete_address(self, address_id: int) -> bool:
        address = self.address_repository.get_by_id(address_id)
        if not address:
            return False
        self.address_repository.delete(address)
        return True

