from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.address import Address
from app.models.package_details import PackageDetails
from app.models.shipment_order import ShipmentOrder
from app.repositories.address_repository import AddressRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.package_details_repository import PackageDetailsRepository
from app.repositories.service_option_repository import ServiceOptionRepository
from app.repositories.shipment_order_repository import ShipmentOrderRepository
from app.schemas.order import ShipmentOrderCreate, ShipmentOrderUpdate
from app.services.pricing_service import PricingService
from app.utils.identifiers import build_identifier


class OrderService:
    def __init__(self, db: Session) -> None:
        self.address_repository = AddressRepository(db)
        self.customer_repository = CustomerRepository(db)
        self.package_repository = PackageDetailsRepository(db)
        self.pricing_service = PricingService()
        self.service_option_repository = ServiceOptionRepository(db)
        self.shipment_order_repository = ShipmentOrderRepository(db)

    def list_service_options(self):
        return self.service_option_repository.list_ordered()

    def list_orders(self):
        orders = self.shipment_order_repository.list_recent()
        summaries = []
        for order in orders:
            customer = self.customer_repository.get_by_id(order.customer_id)
            receiver_address = self.address_repository.get_by_id(order.receiver_address_id) if order.receiver_address_id else None
            service_option = self.service_option_repository.get_by_id(order.service_id) if order.service_id else None
            destination = None
            if receiver_address:
                destination = ", ".join(part for part in [receiver_address.street, receiver_address.city] if part)
            summaries.append(
                {
                    "order_id": order.order_id,
                    "customer_id": order.customer_id,
                    "customer_name": customer.full_name if customer else order.customer_id,
                    "service_name": service_option.service_name if service_option else None,
                    "receiver_name": receiver_address.receiver_name if receiver_address else None,
                    "destination": destination,
                    "total_price": float(order.total_price),
                    "order_status": order.order_status,
                    "created_at": order.created_at,
                }
            )
        return summaries

    def get_order(self, order_id: str):
        return self.shipment_order_repository.get_by_id(order_id)

    def get_order_details(self, order_id: str):
        order = self.get_order(order_id)
        if not order:
            return None
        service_option = self.service_option_repository.get_by_id(order.service_id) if order.service_id else None
        sender_address = self.address_repository.get_by_id(order.sender_address_id) if order.sender_address_id else None
        receiver_address = self.address_repository.get_by_id(order.receiver_address_id) if order.receiver_address_id else None
        package_details = self.package_repository.get_by_id(order.package_id) if order.package_id else None
        return {
            "order": order,
            "service_option": service_option,
            "sender_address": sender_address,
            "receiver_address": receiver_address,
            "package_details": package_details,
        }

    def create_order(self, payload: ShipmentOrderCreate):
        service_option = self.service_option_repository.get_by_id(payload.service_id)
        if not service_option:
            raise ValueError("Service option not found")

        sender_address = Address(**payload.sender_address.model_dump())
        receiver_address = Address(**payload.receiver_address.model_dump())
        package_details = PackageDetails(**payload.package_details.model_dump())

        sender_address = self.address_repository.create(sender_address)
        receiver_address = self.address_repository.create(receiver_address)
        package_details = self.package_repository.create(package_details)

        total_price = self.pricing_service.calculate_total(service_option, package_details)
        order = ShipmentOrder(
            order_id=build_identifier("ORD"),
            customer_id=payload.customer_id,
            service_id=payload.service_id,
            sender_address_id=sender_address.address_id,
            receiver_address_id=receiver_address.address_id,
            package_id=package_details.package_id,
            approved_by=None,
            total_price=total_price,
            order_status="Pending",
            created_at=datetime.now(timezone.utc),
            notes=payload.notes,
        )
        return self.shipment_order_repository.create(order)

    def update_order(self, order_id: str, payload: ShipmentOrderUpdate):
        order = self.shipment_order_repository.get_by_id(order_id)
        if not order:
            return None
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(order, field, value)
        return self.shipment_order_repository.update(order)