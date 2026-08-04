from sqlalchemy.orm import Session
from app.models.address import Address
from app.repositories.account_history_repository import AccountHistoryRepository
from app.repositories.address_repository import AddressRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.staff_repository import StaffRepository
from app.schemas.account import AddressCreate, AddressUpdate, CustomerUpdate


class AccountService:
    def __init__(self, db: Session) -> None:
        self.db = db  # <-- CRITICAL: Bind the database session here
        self.address_repository = AddressRepository(db)
        self.customer_repository = CustomerRepository(db)
        self.history_repository = AccountHistoryRepository(db)
        self.staff_repository = StaffRepository(db)

    def get_customer(self, customer_id: str):
        return self.customer_repository.get_by_id(customer_id)

    def update_customer(self, customer_id: str, payload: CustomerUpdate):
        customer = self.customer_repository.get_by_id(customer_id)
        if not customer:
            return None

        changes = []
        for field, value in payload.model_dump(exclude_none=True).items():
            old_value = getattr(customer, field, "")
            if str(old_value) != str(value):
                changes.append(f"{field} to '{value}'")
            setattr(customer, field, value)

        updated_customer = self.customer_repository.update(customer)

        if changes:
            action_text = "Updated: " + " | ".join(changes)
            self.history_repository.create(customer_id=customer_id, action=action_text)

        return updated_customer

    def delete_customer(self, customer_id: str) -> bool:
        customer = self.customer_repository.get_by_id(customer_id)
        if not customer:
            return False
        
        self.customer_repository.delete(customer)
        return True

    def list_addresses(self, customer_id: str):
        return self.address_repository.list_by_customer_id(customer_id)

    def create_address(self, customer_id: str, payload: AddressCreate):
        address = Address(customer_id=customer_id, **payload.model_dump(exclude={"customer_id"}))
        return self.address_repository.create(address)

    def get_address(self, address_id: int):
        """Retrieve a specific address by ID using the bound session"""
        return self.db.get(Address, address_id)

    def update_address(self, address_id: int, payload: dict | AddressUpdate):
        """Update address information safely"""
        address = self.get_address(address_id)
        if not address:
            return None
        
        data = payload.model_dump(exclude_none=True) if hasattr(payload, "model_dump") else payload
        for key, value in data.items():
            if value is not None:
                setattr(address, key, value)
                
        self.db.commit()
        self.db.refresh(address)
        return address

    def delete_address(self, address_id: int) -> bool:
        """Delete an address by ID"""
        address = self.get_address(address_id)
        if not address:
            return False
        
        self.db.delete(address)
        self.db.commit()
        return True

    def get_account_history(self, customer_id: str):
        return self.history_repository.get_by_customer_id(customer_id)

    def get_staff(self, staff_id: str):
        return self.staff_repository.get_by_id(staff_id)