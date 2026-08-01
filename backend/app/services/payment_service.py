from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.statuses import (
    PAYMENT_PENDING,
    PAYMENT_STATUSES,
    PAYMENT_TRANSITIONS,
    ensure_allowed_status,
    ensure_valid_transition,
    normalize_payment_status,
)
from app.models.payment import Payment
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment import PaymentCreate


class PaymentService:
    def __init__(self, db: Session) -> None:
        self.invoice_repository = InvoiceRepository(db)
        self.payment_repository = PaymentRepository(db)

    def list_invoices(self):
        return self.invoice_repository.list_all()

    def get_invoice(self, invoice_id: int):
        return self.invoice_repository.get_by_id(invoice_id)

    def get_invoice_by_order(self, order_id: str):
        return self.invoice_repository.get_by_order_id(order_id)

    def list_payments(self):
        return self.payment_repository.list_recent()

    def create_payment(self, payload: PaymentCreate):
        normalized_status = normalize_payment_status(payload.status) or PAYMENT_PENDING
        ensure_allowed_status("payment", normalized_status, PAYMENT_STATUSES)

        invoice = self.invoice_repository.get_by_id(payload.invoice_id)
        if invoice:
            current_invoice_status = normalize_payment_status(invoice.status)
            ensure_valid_transition("payment", current_invoice_status, normalized_status, PAYMENT_TRANSITIONS)
            invoice.status = normalized_status
            self.invoice_repository.update(invoice)

        payment = Payment(
            invoice_id=payload.invoice_id,
            payment_method=payload.payment_method,
            payment_date=payload.payment_date or datetime.now(timezone.utc),
            amount=payload.amount,
            status=normalized_status,
            transaction_code=payload.transaction_code,
        )
        return self.payment_repository.create(payment)
