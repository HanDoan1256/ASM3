from datetime import datetime

from app.schemas.common import ORMModel


class InvoiceBase(ORMModel):
    order_id: str
    subtotal: float
    tax: float
    total: float
    invoice_date: datetime
    status: str


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(ORMModel):
    subtotal: float | None = None
    tax: float | None = None
    total: float | None = None
    status: str | None = None


class InvoiceRead(InvoiceBase):
    invoice_id: int


class PaymentBase(ORMModel):
    invoice_id: int
    payment_method: str
    payment_date: datetime
    amount: float
    status: str
    transaction_code: str | None = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(ORMModel):
    payment_method: str | None = None
    payment_date: datetime | None = None
    amount: float | None = None
    status: str | None = None
    transaction_code: str | None = None


class PaymentRead(PaymentBase):
    payment_id: int


class PaymentReceiptRead(ORMModel):
    invoice: InvoiceRead
    payment: PaymentRead

