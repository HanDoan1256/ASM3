from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.payment import InvoiceRead, PaymentCreate, PaymentRead, PaymentReceiptRead
from app.services.payment_service import PaymentService

router = APIRouter()


@router.get("/invoices", response_model=list[InvoiceRead])
def list_invoices(db: Session = Depends(get_db)) -> list[InvoiceRead]:
    return PaymentService(db).list_invoices()


@router.get("/invoices/{invoice_id}", response_model=InvoiceRead)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)) -> InvoiceRead:
    invoice = PaymentService(db).get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice


@router.get("/orders/{order_id}/invoice", response_model=InvoiceRead)
def get_invoice_by_order(order_id: str, db: Session = Depends(get_db)) -> InvoiceRead:
    invoice = PaymentService(db).get_invoice_by_order(order_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found for order")
    return invoice


@router.get("", response_model=list[PaymentRead])
def list_payments(db: Session = Depends(get_db)) -> list[PaymentRead]:
    return PaymentService(db).list_payments()


@router.post("", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)) -> PaymentRead:
    try:
        return PaymentService(db).create_payment(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
