from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.order import (
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
def list_orders(db: Session = Depends(get_db)) -> list[ShipmentOrderListItem]:
    return OrderService(db).list_orders()


@router.post("/orders/estimate", response_model=OrderEstimateResponse)
def estimate_order(payload: OrderEstimateRequest, db: Session = Depends(get_db)) -> OrderEstimateResponse:
    try:
        return OrderEstimateResponse(**OrderService(db).estimate_order_total(payload.service_id, payload.weight))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/orders", response_model=ShipmentOrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: ShipmentOrderCreate, db: Session = Depends(get_db)) -> ShipmentOrderRead:
    try:
        return OrderService(db).create_order(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/orders/{order_id}", response_model=ShipmentOrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)) -> ShipmentOrderResponse:
    details = OrderService(db).get_order_details(order_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return ShipmentOrderResponse(**details)


@router.put("/orders/{order_id}", response_model=ShipmentOrderRead)
def update_order(order_id: str, payload: ShipmentOrderUpdate, db: Session = Depends(get_db)) -> ShipmentOrderRead:
    try:
        order = OrderService(db).update_order(order_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order
