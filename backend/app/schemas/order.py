from datetime import datetime
from typing import Literal
from pydantic import Field
from app.schemas.account import AddressCreate, AddressRead
from app.schemas.common import ORMModel
from app.schemas.service_option import ServiceOptionRead


PackageTypeEnum = Literal["Document", "Fragile", "Standard", "Heavy", "Cold/Fresh"]
InspectionPolicyEnum = Literal["No_Inspection", "Allow_Inspection", "Allow_Trial"]
SecurityLevelEnum = Literal["Standard", "Confidential", "High-Security"]


class PackageDetailsBase(ORMModel):
    weight: float = Field(..., gt=0, description="Weight in kg")
    height: float = Field(..., gt=0, description="Height in cm")
    length: float = Field(..., gt=0, description="Length in cm")
    width: float = Field(..., gt=0, description="Width in cm")
    package_type: PackageTypeEnum = "Standard"
    fragile: bool = False
    is_sealed: bool = False
    inspection_policy: InspectionPolicyEnum = "Allow_Inspection"
    security_level: SecurityLevelEnum = "Standard"
    declared_value: float = Field(default=0.0, ge=0)


class PackageDetailsCreate(PackageDetailsBase):
    pass


class PackageDetailsUpdate(ORMModel):
    weight: float | None = Field(default=None, gt=0)
    height: float | None = Field(default=None, gt=0)
    length: float | None = Field(default=None, gt=0)
    width: float | None = Field(default=None, gt=0)
    package_type: PackageTypeEnum | None = None
    fragile: bool | None = None
    is_sealed: bool | None = None
    inspection_policy: InspectionPolicyEnum | None = None
    security_level: SecurityLevelEnum | None = None
    declared_value: float | None = Field(default=None, ge=0)


class PackageDetailsRead(PackageDetailsBase):
    package_id: int


class ShipmentOrderBase(ORMModel):
    customer_id: str
    service_id: int | None = None
    sender_address_id: int | None = None
    receiver_address_id: int | None = None
    package_id: int | None = None
    approved_by: str | None = None
    total_price: float = Field(default=0.0, ge=0)
    order_status: str = "Pending"
    notes: str | None = None


class ShipmentOrderCreate(ORMModel):
    customer_id: str
    service_id: int
    
    # Support both existing address ID or new address object
    sender_address_id: int | None = None
    sender_address: AddressCreate | None = None
    
    receiver_address_id: int | None = None
    receiver_address: AddressCreate | None = None
    
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