from typing import Sequence
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.shipment_order import ShipmentOrder
from app.models.package_details import PackageDetails
from app.models.address import Address
from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository[ShipmentOrder]):
    def __init__(self, db: Session):
        super().__init__(ShipmentOrder, db)

    def create_package_details(self, package_data: dict) -> PackageDetails:
        package = PackageDetails(**package_data)
        self.db.add(package)
        self.db.flush()
        return package

    def create_address(self, address_data: dict) -> Address:
        address = Address(**address_data)
        self.db.add(address)
        self.db.flush()
        return address

    def create_order(self, order_data: dict) -> ShipmentOrder:
        order = ShipmentOrder(**order_data)
        self.db.add(order)
        self.db.flush()
        self.db.commit()
        self.db.refresh(order)
        return order

    def get_by_customer_id(self, customer_id: str) -> Sequence[ShipmentOrder]:
        stmt = (
            select(ShipmentOrder)
            .where(ShipmentOrder.customer_id == customer_id)
            .order_by(ShipmentOrder.created_at.desc())
        )
        return self.db.scalars(stmt).all()