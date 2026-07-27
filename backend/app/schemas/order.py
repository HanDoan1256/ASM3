from datetime import datetime

from app.schemas.account import AddressCreate, AddressRead
from app.schemas.common import ORMModel
from app.schemas.service_option import ServiceOptionRead


class PackageDetailsBase(ORMModel):
    weight: float
    height: float
    length: float
    width: float
    package_type: str
    fragile: bool | None = None
    is_sealed: bool | None = None
    inspection_policy: str | None = None
    security_level: str | None = None
    declared_value: float | None = None


class PackageDetailsCreate(PackageDetailsBase):
    pass


class PackageDetailsUpdate(ORMModel):
    weight: float | None = None
    height: float | None = None
    length: float | None = None
    width: float | None = None
    package_type: str | None = None
    fragile: bool | None = None
    is_sealed: bool | None = None
    inspection_policy: str | None = None
    security_level: str | None = None
    declared_value: float | None = None


class PackageDetailsRead(PackageDetailsBase):
    package_id: int


class ShipmentOrderBase(ORMModel):
    customer_id: str
    service_id: int | None = None
    sender_address_id: int | None = None
    receiver_address_id: int | None = None
    package_id: int | None = None
    approved_by: str | None = None
    total_price: float
    order_status: str
    notes: str | None = None


class ShipmentOrderCreate(ORMModel):
    customer_id: str
    service_id: int
    sender_address: AddressCreate
    receiver_address: AddressCreate
    package_details: PackageDetailsCreate
    notes: str | None = None


class ShipmentOrderUpdate(ORMModel):
    service_id: int | None = None
    approved_by: str | None = None
    order_status: str | None = None
    notes: str | None = None


class ShipmentOrderRead(ShipmentOrderBase):
    order_id: str
    created_at: datetime


class ShipmentOrderListItem(ORMModel):
    order_id: str
    customer_id: str
    customer_name: str
    service_name: str | None = None
    receiver_name: str | None = None
    destination: str | None = None
    total_price: float
    order_status: str
    created_at: datetime


class ShipmentOrderResponse(ORMModel):
    order: ShipmentOrderRead
    service_option: ServiceOptionRead | None = None
    sender_address: AddressRead | None = None
    receiver_address: AddressRead | None = None
    package_details: PackageDetailsRead | None = None
