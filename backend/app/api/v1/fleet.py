from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import Principal, get_current_principal, get_db, require_staff
from app.schemas.branch import BranchRead
from app.schemas.common import MessageResponse
from app.schemas.fleet import AllocationRead, DriverCreate, DriverRead, DriverUpdate, VehicleCreate, VehicleRead, VehicleUpdate
from app.services.fleet_allocation_service import FleetAllocationService

router = APIRouter()


@router.get("/branches", response_model=list[BranchRead])
def list_branches(
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> list[BranchRead]:
    return FleetAllocationService(db).list_branches()


@router.get("/vehicles", response_model=list[VehicleRead])
def list_vehicles(
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> list[VehicleRead]:
    return FleetAllocationService(db).list_vehicles()


@router.post("/vehicles", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> VehicleRead:
    return FleetAllocationService(db).create_vehicle(payload)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(
    vehicle_id: str,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> VehicleRead:
    vehicle = FleetAllocationService(db).update_vehicle(vehicle_id, payload)
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


@router.get("/drivers", response_model=list[DriverRead])
def list_drivers(
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> list[DriverRead]:
    return FleetAllocationService(db).list_drivers()


@router.post("/drivers", response_model=DriverRead, status_code=status.HTTP_201_CREATED)
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> DriverRead:
    return FleetAllocationService(db).create_driver(payload)


@router.put("/drivers/{driver_id}", response_model=DriverRead)
def update_driver(
    driver_id: str,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> DriverRead:
    driver = FleetAllocationService(db).update_driver(driver_id, payload)
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


@router.get("/allocations", response_model=list[AllocationRead])
def list_allocations(
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> list[AllocationRead]:
    return FleetAllocationService(db).list_allocations()


@router.post("/orders/{order_id}/allocate", response_model=MessageResponse)
def allocate_order(
    order_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> MessageResponse:
    try:
        FleetAllocationService(db).allocate_resources(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return MessageResponse(message=f"Order {order_id} allocated")
