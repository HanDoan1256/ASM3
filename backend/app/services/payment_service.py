from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.statuses import (
    PAYMENT_COMPLETED,
    PAYMENT_METHODS,
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
        """Confirm a payment against an existing invoice.

        Validates: invoice exists, invoice is not already Completed (rejects a
        duplicate confirmation), the payment method is a recognized value, and the
        submitted amount matches the invoice total (prevents partial/incorrect
        confirmations from silently completing an invoice).
        """
        invoice = self.invoice_repository.get_by_id(payload.invoice_id)
        if not invoice:
            raise ValueError("Invoice not found")

        if payload.payment_method not in PAYMENT_METHODS and payload.payment_method not in {"Cash", "Transfer", "COD"}:
            raise ValueError(f"Invalid payment method '{payload.payment_method}'.")

        if round(float(payload.amount), 2) != round(float(invoice.total), 2):
            raise ValueError(f"Payment amount {payload.amount} does not match invoice total {invoice.total}.")

        normalized_status = normalize_payment_status(payload.status) or PAYMENT_COMPLETED
        ensure_allowed_status("payment", normalized_status, PAYMENT_STATUSES)

        current_invoice_status = normalize_payment_status(invoice.status)
        if current_invoice_status == PAYMENT_COMPLETED:
            # Reject duplicate confirmation outright rather than treating "already
            # Completed -> Completed" as an idempotent no-op.
            raise ValueError(f"Invoice '{payload.invoice_id}' has already been paid.")
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
