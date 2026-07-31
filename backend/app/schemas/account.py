from datetime import datetime

from pydantic import EmailStr

from app.schemas.common import ORMModel


class AddressBase(ORMModel):
    customer_id: str | None = None
    receiver_name: str
    receiver_phone: str
    street: str
    district: str
    city: str
    postal_code: str | None = None
    is_default: bool | None = None


class AddressCreate(AddressBase):
    pass


class AddressUpdate(ORMModel):
    receiver_name: str | None = None
    receiver_phone: str | None = None
    street: str | None = None
    district: str | None = None
    city: str | None = None
    postal_code: str | None = None
    is_default: bool | None = None


class AddressRead(AddressBase):
    address_id: int


class CustomerBase(ORMModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    status: str


class CustomerCreate(CustomerBase):
    password: str


class CustomerUpdate(ORMModel):
    full_name: str | None = None
    phone: str | None = None
    status: str | None = None


class CustomerRead(CustomerBase):
    customer_id: str
    created_at: datetime | None = None

class AccountHistoryRead(ORMModel):
    action: str
    created_at: datetime