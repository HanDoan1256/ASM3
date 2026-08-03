from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.repositories.customer_repository import CustomerRepository
from app.repositories.staff_repository import StaffRepository
from app.schemas.auth import CustomerRegisterRequest, LoginRequest, LoginResponse
from app.utils.identifiers import build_identifier
from app.utils.security import create_access_token, hash_password, needs_rehash, verify_password


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.customer_repository = CustomerRepository(db)
        self.staff_repository = StaffRepository(db)

    def register_customer(self, payload: CustomerRegisterRequest) -> Customer:
        existing = self.customer_repository.get_by_email(payload.email)
        if existing:
            raise ValueError("Email already exists")

        customer = Customer(
            customer_id=build_identifier("CUS"),
            full_name=payload.full_name,
            email=payload.email,
            password_hash=hash_password(payload.password),
            phone=payload.phone,
            status="Active",
        )
        return self.customer_repository.create(customer)

    def _upgrade_hash_if_needed(self, entity, password: str) -> None:
        """Transparently upgrade legacy SHA-256 hashes to bcrypt after a successful login."""
        if needs_rehash(entity.password_hash):
            entity.password_hash = hash_password(password)
            self.db.commit()

    def login(self, payload: LoginRequest) -> LoginResponse:
        customer = self.customer_repository.get_by_email(payload.email)
        if customer:
            if customer.status == "Deleted":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This account has been deactivated or deleted."
                )
            
            if verify_password(payload.password, customer.password_hash):
                self._upgrade_hash_if_needed(customer, payload.password)
                token = create_access_token(customer.customer_id, "customer", "customer")
                return LoginResponse(
                    message="Login successful",
                    principal_id=customer.customer_id,
                    principal_type="customer",
                    email=customer.email,
                    role="customer",
                    access_token=token,
                )
            else:
                
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect password"
                )

   
        staff = self.staff_repository.get_by_email(payload.email)
        if staff:
           
            if verify_password(payload.password, staff.password_hash):
                self._upgrade_hash_if_needed(staff, payload.password)
                token = create_access_token(staff.staff_id, "staff", staff.role)
                return LoginResponse(
                    message="Login successful",
                    principal_id=staff.staff_id,
                    principal_type="staff",
                    email=staff.email,
                    role=staff.role,
                    access_token=token,
                )
            else:
            
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect password"
                )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    def logout(self) -> dict[str, str]:
        return {"message": "Logout successful"}