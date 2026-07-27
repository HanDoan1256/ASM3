from datetime import datetime, timezone

from sqlalchemy.orm import Session

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
        payment = Payment(
            invoice_id=payload.invoice_id,
            payment_method=payload.payment_method,
            payment_date=payload.payment_date or datetime.now(timezone.utc),
            amount=payload.amount,
            status=payload.status,
            transaction_code=payload.transaction_code,
        )
        return self.payment_repository.create(payment)

