from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import Principal, get_current_principal, get_db, require_staff
from app.schemas.payment import InvoiceRead, PaymentCreate, PaymentRead, PaymentReceiptRead
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService

router = APIRouter()


@router.get("/invoices", response_model=list[InvoiceRead])
def list_invoices(
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> list[InvoiceRead]:
    return PaymentService(db).list_invoices()


@router.get("/invoices/{invoice_id}", response_model=InvoiceRead)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> InvoiceRead:
    invoice = PaymentService(db).get_invoice(invoice_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    if principal.principal_type == "customer":
        order = OrderService(db).get_order(invoice.order_id)
        if not order or order.customer_id != principal.principal_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another customer's invoice")
    return invoice


@router.get("/orders/{order_id}/invoice", response_model=InvoiceRead)
def get_invoice_by_order(
    order_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> InvoiceRead:
    if principal.principal_type == "customer":
        order = OrderService(db).get_order(order_id)
        if not order or order.customer_id != principal.principal_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another customer's order")
    invoice = PaymentService(db).get_invoice_by_order(order_id)
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found for order")
    return invoice


@router.get("", response_model=list[PaymentRead])
def list_payments(
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> list[PaymentRead]:
    return PaymentService(db).list_payments()


@router.post("", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> PaymentRead:
    if principal.principal_type == "customer":
        invoice = PaymentService(db).get_invoice(payload.invoice_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
        order = OrderService(db).get_order(invoice.order_id)
        if not order or order.customer_id != principal.principal_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot pay another customer's invoice")
    try:
        return PaymentService(db).create_payment(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
