from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import Principal, get_current_principal, get_db, require_staff
from app.schemas.order import (
    OrderApproveResponse,
    OrderEstimateRequest,
    OrderEstimateResponse,
    ShipmentOrderCreate,
    ShipmentOrderListItem,
    ShipmentOrderRead,
    ShipmentOrderResponse,
    ShipmentOrderUpdate,
)
from app.schemas.service_option import ServiceOptionRead
from app.services.order_service import OrderService

router = APIRouter()


@router.get("/service-options", response_model=list[ServiceOptionRead])
def list_service_options(db: Session = Depends(get_db)) -> list[ServiceOptionRead]:
    return OrderService(db).list_service_options()


@router.get("/orders", response_model=list[ShipmentOrderListItem])
def list_orders(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> list[ShipmentOrderListItem]:
    customer_id = principal.principal_id if principal.principal_type == "customer" else None
    return OrderService(db).list_orders(customer_id=customer_id)


@router.post("/orders/estimate", response_model=OrderEstimateResponse)
def estimate_order(payload: OrderEstimateRequest, db: Session = Depends(get_db)) -> OrderEstimateResponse:
    try:
        return OrderEstimateResponse(**OrderService(db).estimate_order_total(payload.service_id, payload.weight))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/orders", response_model=ShipmentOrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: ShipmentOrderCreate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> ShipmentOrderRead:
    # Customers may only create orders under their own identity; the authenticated
    # principal always wins over any client-supplied customer_id to prevent spoofing.
    if principal.principal_type == "customer":
        payload = payload.model_copy(update={"customer_id": principal.principal_id})
    try:
        return OrderService(db).create_order(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/orders/{order_id}", response_model=ShipmentOrderResponse)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> ShipmentOrderResponse:
    details = OrderService(db).get_order_details(order_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    order = details["order"]
    if principal.principal_type == "customer" and order.customer_id != principal.principal_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another customer's order")
    return ShipmentOrderResponse(**details)


@router.put("/orders/{order_id}", response_model=ShipmentOrderRead)
def update_order(
    order_id: str,
    payload: ShipmentOrderUpdate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> ShipmentOrderRead:
    try:
        order = OrderService(db).update_order(order_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/orders/{order_id}/approve", response_model=OrderApproveResponse)
def approve_order(
    order_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> OrderApproveResponse:
    service = OrderService(db)
    try:
        order = service.approve_order(order_id, approved_by=principal.principal_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    shipment = service.shipment_repository.get_by_order_id(order.order_id)
    if not shipment:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Shipment not found after approval")
    return OrderApproveResponse(order=order, shipment_id=shipment.shipment_id)
