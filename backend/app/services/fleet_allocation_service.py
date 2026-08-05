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
from app.models.tracking_history import TrackingHistory
from app.models.vehicle import Vehicle
from app.repositories.address_repository import AddressRepository
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
        self.address_repository = AddressRepository(db)

    def list_branches(self):
        return self.branch_repository.list_all()

    def list_vehicles(self):
        return self.vehicle_repository.list_all()

    def create_vehicle(self, payload: VehicleCreate) -> Vehicle:
        data = payload.model_dump(exclude={"status"})
        vehicle = Vehicle(
            **data,
            status=RESOURCE_AVAILABLE,
        )
        return self.vehicle_repository.create(vehicle)

    def update_vehicle(self, vehicle_id: str, payload: VehicleUpdate) -> Vehicle | None:
        vehicle = self.vehicle_repository.get_by_id(vehicle_id)
        if not vehicle:
            return None
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(vehicle, key, value)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def list_drivers(self):
        return self.driver_repository.list_all()

    def create_driver(self, payload: DriverCreate) -> Driver:
        data = payload.model_dump(exclude={"status"})
        driver = Driver(
            **data,
            status=RESOURCE_AVAILABLE,
        )
        return self.driver_repository.create(driver)

    def update_driver(self, driver_id: str, payload: DriverUpdate) -> Driver | None:
        driver = self.driver_repository.get_by_id(driver_id)
        if not driver:
            return None
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(driver, key, value)
        self.db.commit()
        self.db.refresh(driver)
        return driver

    def list_allocations(self):
        shipments = self.shipment_repository.list_all()
        allocations = []
        for s in shipments:
            order = self.order_repository.get_by_id(s.order_id)
            allocations.append({
                "shipment_id": s.shipment_id,
                "order_id": s.order_id,
                "customer_id": order.customer_id if order else None,
                "vehicle_id": s.vehicle_id,
                "driver_id": s.driver_id,
                "shipment_status": s.shipment_status,
                "track_id": s.track_id,
            })
        return allocations

    def allocate_resources(self, order_id: str, branch_id: str | None = None) -> dict:
        order = self.order_repository.get_by_id(order_id)
        if not order:
            raise ValueError(f"Order '{order_id}' not found.")

        current_order_status = normalize_order_status(order.order_status)
        if current_order_status != ORDER_APPROVED:
            raise ValueError("Order must be approved before vehicle allocation.")

        shipment = self.shipment_repository.get_by_order_id(order_id)
        if not shipment:
            raise ValueError(f"Shipment for order '{order_id}' not found.")

        package_details = order.package_details if hasattr(order, "package_details") else None
        weight_tons = float(package_details.weight) / 1000.0 if package_details else 0.1

        # Find available vehicle with sufficient capacity
        available_vehicles = sorted(
            (
                v for v in self.db.scalars(
                    select(Vehicle).where(Vehicle.status == RESOURCE_AVAILABLE)
                ).all()
                if float(v.capacity or 0) >= weight_tons
            ),
            key=lambda v: float(v.capacity or 0),
        )
        if not available_vehicles:
            raise ValueError("No available vehicle with sufficient capacity.")
        vehicle = available_vehicles[0]

        # Find available driver
        available_driver = self.db.scalar(select(Driver).where(Driver.status == RESOURCE_AVAILABLE))
        if not available_driver:
            raise ValueError("No available driver.")

        # Update vehicle and driver status
        vehicle.status = RESOURCE_ASSIGNED
        available_driver.status = RESOURCE_ASSIGNED

        # Resolve current location from sender address
        current_location = "Origin Branch"
        if hasattr(order, "sender_address") and order.sender_address:
            addr_parts = [
                p for p in [order.sender_address.street, order.sender_address.district, order.sender_address.city] if p
            ]
            if addr_parts:
                current_location = ", ".join(addr_parts)

        # Resolve next location (Branch)
        next_location = "Central Transit Hub"
        if branch_id:
            branch = self.branch_repository.get_by_id(branch_id)
            if branch:
                next_location = branch.branch_name
        else:
            branches = self.branch_repository.list_all()
            if branches:
                next_location = branches[0].branch_name

        # 1. Ensure a Tracking record exists and is flushed to the database FIRST
      # 1. Generate or use track_id
        track_id = shipment.track_id or build_identifier("TRK")

        # 2. Force-create or update the Tracking record and flush it FIRST
        tracking = self.tracking_repository.get_by_id(track_id)
        if not tracking:
            tracking = Tracking(
                track_id=track_id,
                current_location=current_location,
                status=SHIPMENT_ASSIGNED,
            )
            self.db.add(tracking)
        else:
            tracking.current_location = current_location
            tracking.status = SHIPMENT_ASSIGNED
            self.db.add(tracking)

        # Force write the Tracking record to the DB so the PK exists immediately
        self.db.flush()

        # 3. Now it is 100% safe to assign the track_id and resources to the shipment
        shipment.track_id = track_id
        shipment.vehicle_id = vehicle.vehicle_id
        shipment.driver_id = available_driver.driver_id
        shipment.shipment_status = SHIPMENT_ASSIGNED

        # 4. Create initial tracking history record
        history_entry = TrackingHistory(
            track_id=track_id,
            current_location=current_location,
            next_location=next_location,
            status=SHIPMENT_ASSIGNED,
        )
        self.db.add(history_entry)
        self.db.flush()

        self.db.commit()
        self.db.refresh(shipment)

        return {
            "message": f"Successfully allocated vehicle {vehicle.vehicle_id} and driver {available_driver.driver_id} to order {order_id}.",
            "track_id": track_id,
        }

