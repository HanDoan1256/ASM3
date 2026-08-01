from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.statuses import (
    ORDER_APPROVED,
    ORDER_PENDING,
    ORDER_STATUSES,
    ORDER_TRANSITIONS,
    PAYMENT_METHODS,
    PAYMENT_PENDING,
    SHIPMENT_CREATED,
    ensure_allowed_status,
    ensure_valid_transition,
    normalize_order_status,
)
from app.models.address import Address
from app.models.invoice import Invoice
from app.models.package_details import PackageDetails
from app.models.shipment import Shipment
from app.models.shipment_order import ShipmentOrder
from app.repositories.address_repository import AddressRepository
from app.repositories.customer_repository import CustomerRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.package_details_repository import PackageDetailsRepository
from app.repositories.service_option_repository import ServiceOptionRepository
from app.repositories.shipment_order_repository import ShipmentOrderRepository
from app.repositories.shipment_repository import ShipmentRepository
from app.schemas.order import ShipmentOrderCreate, ShipmentOrderUpdate
from app.services.pricing_service import PricingService
from app.utils.identifiers import build_identifier


class OrderService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.address_repository = AddressRepository(db)
        self.customer_repository = CustomerRepository(db)
        self.invoice_repository = InvoiceRepository(db)
        self.package_repository = PackageDetailsRepository(db)
        self.pricing_service = PricingService()
        self.service_option_repository = ServiceOptionRepository(db)
        self.shipment_order_repository = ShipmentOrderRepository(db)
        self.shipment_repository = ShipmentRepository(db)

    def list_service_options(self):
        return self.service_option_repository.list_ordered()

    def estimate_order_total(self, service_id: int, weight: float):
        if weight <= 0:
            raise ValueError("Weight must be greater than 0")

        service_option = self.service_option_repository.get_by_id(service_id)
        if not service_option:
            raise ValueError("Service option not found")

        estimated_total = self.pricing_service.calculate_total_for_weight(service_option, weight)
        return {
            "service_id": service_option.service_id,
            "base_price": float(service_option.base_price),
            "weight": float(weight),
            "estimated_total": estimated_total,
        }

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
        invoice = self.invoice_repository.get_by_order_id(order.order_id)
        return {
            "order": order,
            "service_option": service_option,
            "sender_address": sender_address,
            "receiver_address": receiver_address,
            "package_details": package_details,
            "invoice": invoice,
        }

    def create_order(self, payload: ShipmentOrderCreate):
        customer = self.customer_repository.get_by_id(payload.customer_id)
        if not customer:
            raise ValueError("Customer not found")

        service_option = self.service_option_repository.get_by_id(payload.service_id)
        if not service_option:
            raise ValueError("Service option not found")

        if payload.payment_method not in PAYMENT_METHODS:
            raise ValueError(f"Invalid payment method '{payload.payment_method}'.")

        # Sender address: reuse an existing saved address (verified to belong to the
        # requesting customer) or create a new one from the supplied details.
        if payload.sender_address_id is not None:
            sender_address = self.address_repository.get_by_id(payload.sender_address_id)
            if not sender_address:
                raise ValueError("Sender address not found")
            if sender_address.customer_id and sender_address.customer_id != payload.customer_id:
                raise ValueError("Sender address does not belong to this customer")
        elif payload.sender_address is not None:
            sender_address = Address(**payload.sender_address.model_dump())
            self.db.add(sender_address)
        else:
            raise ValueError("Sender address is required")

        if payload.receiver_address_id is not None:
            receiver_address = self.address_repository.get_by_id(payload.receiver_address_id)
            if not receiver_address:
                raise ValueError("Receiver address not found")
        elif payload.receiver_address is not None:
            receiver_address = Address(**payload.receiver_address.model_dump())
            self.db.add(receiver_address)
        else:
            raise ValueError("Receiver address is required")

        package_details = PackageDetails(**payload.package_details.model_dump())
        self.db.add(package_details)

        # Flush (without commit) so autoincrement IDs are assigned before we build the order.
        self.db.flush()

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
            order_status=ORDER_PENDING,
            created_at=datetime.now(timezone.utc),
            notes=payload.notes,
        )
        self.db.add(order)
        self.db.flush()

        # An invoice is created immediately at order-creation time to record the payment
        # responsibility (SENDER_COD / RECEIVER_COD / SENDER_TRANSFER) chosen by the customer.
        # It starts Pending; no Payment row is created here (COD must not be shown as
        # falsely "Completed"). A Payment row is only created when a real payment event
        # occurs, e.g. via POST /payments for a bank transfer confirmation.
        invoice = Invoice(
            order_id=order.order_id,
            subtotal=total_price,
            tax=0,
            total=total_price,
            invoice_date=datetime.now(timezone.utc),
            status=PAYMENT_PENDING,
            payment_method=payload.payment_method,
        )
        self.db.add(invoice)

        self.db.commit()
        self.db.refresh(order)
        return order

    def update_order(self, order_id: str, payload: ShipmentOrderUpdate):
        order = self.shipment_order_repository.get_by_id(order_id)
        if not order:
            return None

        update_data = payload.model_dump(exclude_none=True)
        next_status = update_data.get("order_status")
        if next_status is not None:
            normalized_current = normalize_order_status(order.order_status)
            normalized_next = normalize_order_status(next_status)
            ensure_allowed_status("order", normalized_next, ORDER_STATUSES)
            ensure_valid_transition("order", normalized_current, normalized_next, ORDER_TRANSITIONS)
            update_data["order_status"] = normalized_next

        for field, value in update_data.items():
            setattr(order, field, value)
        return self.shipment_order_repository.update(order)

    def approve_order(self, order_id: str, approved_by: str | None = None) -> ShipmentOrder:
        """Approve a Pending order: create its initial Shipment and move it to Approved.

        Re-approving an already-approved (or otherwise non-Pending) order is treated as
        a failure case rather than an idempotent no-op, since staff should not be able to
        silently double-approve an order.
        """
        order = self.shipment_order_repository.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        if normalize_order_status(order.order_status) != ORDER_PENDING:
            raise ValueError(f"Order '{order_id}' is not Pending and cannot be approved again.")

        order.order_status = ORDER_APPROVED
        order.approved_by = approved_by

        shipment = Shipment(
            order_id=order.order_id,
            vehicle_id=None,
            driver_id=None,
            route_id=None,
            track_id=None,
            shipment_status=SHIPMENT_CREATED,
        )
        self.db.add(shipment)
        self.db.commit()
        self.db.refresh(order)
        return order
