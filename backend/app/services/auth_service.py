from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.repositories.customer_repository import CustomerRepository
from app.repositories.staff_repository import StaffRepository
from app.schemas.auth import CustomerRegisterRequest, LoginRequest, LoginResponse
from app.utils.identifiers import build_identifier
from app.utils.security import hash_password, verify_password




class AuthService:
    def __init__(self, db: Session) -> None:
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

    def login(self, payload: LoginRequest) -> LoginResponse | None:
        customer = self.customer_repository.get_by_email(payload.email)
        if customer and verify_password(payload.password, customer.password_hash):
            return LoginResponse(
                message="Login successful",
                principal_id=customer.customer_id,
                principal_type="customer",
                email=customer.email,
                role="customer",
            )

        staff = self.staff_repository.get_by_email(payload.email)
        if staff and verify_password(payload.password, staff.password_hash):
            return LoginResponse(
                message="Login successful",
                principal_id=staff.staff_id,
                principal_type="staff",
                email=staff.email,
                role=staff.role,
            )

        return None

    def logout(self) -> dict[str, str]:
        return {"message": "Logout successful"}

    def login(self, payload: LoginRequest) -> LoginResponse | None:
        print("=== LOGIN ===")
        print("Email:", payload.email)

        customer = self.customer_repository.get_by_email(payload.email)
        print("Customer:", customer)

        if customer:
            print("Stored hash:", customer.password_hash)
            print("Input hash :", hash_password(payload.password))
            print("Match:", verify_password(payload.password, customer.password_hash))

        if customer and verify_password(payload.password, customer.password_hash):
            return LoginResponse(
                message="Login successful",
                principal_id=customer.customer_id,
                principal_type="customer",
                email=customer.email,
                role="customer",
            )

        staff = self.staff_repository.get_by_email(payload.email)

        if staff:
            print("Staff:", staff)
            print("Staff match:", verify_password(payload.password, staff.password_hash))

        if staff and verify_password(payload.password, staff.password_hash):
            return LoginResponse(
                message="Login successful",
                principal_id=staff.staff_id,
                principal_type="staff",
                email=staff.email,
                role=staff.role,
            )

        print("Login failed")
        return None

