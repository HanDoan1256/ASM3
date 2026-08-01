from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.statuses import (
    ORDER_APPROVED,
    RESOURCE_ASSIGNED,
    RESOURCE_AVAILABLE,
    SHIPMENT_ASSIGNED,
    SHIPMENT_CREATED,
    normalize_order_status,
)
from app.models.driver import Driver
from app.models.tracking import Tracking
from app.models.vehicle import Vehicle
from app.repositories.branch_repository import BranchRepository
from app.repositories.driver_repository import DriverRepository
from app.repositories.shipment_order_repository import ShipmentOrderRepository
from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.tracking_repository import TrackingRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.fleet import DriverCreate, DriverUpdate, VehicleCreate, VehicleUpdate
from app.utils.identifiers import build_identifier


class FleetAllocationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.branch_repository = BranchRepository(db)
        self.driver_repository = DriverRepository(db)
        self.order_repository = ShipmentOrderRepository(db)
        self.shipment_repository = ShipmentRepository(db)
        self.tracking_repository = TrackingRepository(db)
        self.vehicle_repository = VehicleRepository(db)

    def list_branches(self):
        return self.branch_repository.list_all()

    def list_vehicles(self):
        return self.vehicle_repository.list_all()

    def create_vehicle(self, payload: VehicleCreate):
        return self.vehicle_repository.create(Vehicle(**payload.model_dump()))

    def update_vehicle(self, vehicle_id: str, payload: VehicleUpdate):
        vehicle = self.vehicle_repository.get_by_id(vehicle_id)
        if not vehicle:
            return None
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(vehicle, field, value)
        return self.vehicle_repository.update(vehicle)

    def list_drivers(self):
        return self.driver_repository.list_all()

    def create_driver(self, payload: DriverCreate):
        return self.driver_repository.create(Driver(**payload.model_dump()))

    def update_driver(self, driver_id: str, payload: DriverUpdate):
        driver = self.driver_repository.get_by_id(driver_id)
        if not driver:
            return None
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(driver, field, value)
        return self.driver_repository.update(driver)

    def list_allocations(self):
        return self.shipment_repository.list_allocations()

    def allocate_resources(self, order_id: str):
        """Assign the first available, sufficiently-capacity vehicle and the first
        available driver to an approved order's shipment, and initialize tracking.

        Known limitation: allocation does not currently consider Branch/Route
        proximity (no reliable linkage between an order's addresses and a branch
        exists yet), nor does it compute real distances/ETAs. The first available
        resource meeting the capacity constraint is chosen; this is documented in
        PROJECT_STATUS.md as a known simplification.
        """
        order = self.order_repository.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        if normalize_order_status(order.order_status) != ORDER_APPROVED:
            raise ValueError(f"Order '{order_id}' must be Approved before fleet allocation.")

        shipment = self.shipment_repository.get_by_order_id(order_id)
        if not shipment:
            raise ValueError(f"No shipment found for order '{order_id}'.")

        if shipment.vehicle_id or shipment.driver_id or shipment.shipment_status != SHIPMENT_CREATED:
            raise ValueError(f"Order '{order_id}' has already been allocated.")

        # Package weight (kg) is looked up via the order's package_details relation so we
        # can filter vehicles by tonnage capacity.
        from app.repositories.package_details_repository import PackageDetailsRepository

        package_repository = PackageDetailsRepository(self.db)
        package_details = package_repository.get_by_id(order.package_id) if order.package_id else None
        weight_tons = float(package_details.weight) / 1000.0 if package_details else 0.0

        available_vehicles = sorted(
            (
                v
                for v in self.db.scalars(
                    select(Vehicle).where(Vehicle.status == RESOURCE_AVAILABLE)
                ).all()
                if float(v.capacity or 0) >= weight_tons
            ),
            key=lambda v: float(v.capacity or 0),
        )
        if not available_vehicles:
            raise ValueError("No available vehicle with sufficient capacity.")
        vehicle = available_vehicles[0]

        available_driver = self.db.scalar(select(Driver).where(Driver.status == RESOURCE_AVAILABLE))
        if not available_driver:
            raise ValueError("No available driver.")

        shipment.vehicle_id = vehicle.vehicle_id
        shipment.driver_id = available_driver.driver_id
        shipment.shipment_status = SHIPMENT_ASSIGNED

        vehicle.status = RESOURCE_ASSIGNED
        available_driver.status = RESOURCE_ASSIGNED

        if not shipment.track_id:
            tracking = Tracking(
                track_id=build_identifier("TRK"),
                current_location="Origin Branch",
                status=SHIPMENT_ASSIGNED,
            )
            self.db.add(tracking)
            self.db.flush()
            shipment.track_id = tracking.track_id

        self.db.commit()
        self.db.refresh(shipment)
        return shipment
