from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.repositories.branch_repository import BranchRepository
from app.repositories.driver_repository import DriverRepository
from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.fleet import DriverCreate, DriverUpdate, VehicleCreate, VehicleUpdate


class FleetAllocationService:
    def __init__(self, db: Session) -> None:
        self.branch_repository = BranchRepository(db)
        self.driver_repository = DriverRepository(db)
        self.shipment_repository = ShipmentRepository(db)
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
        raise NotImplementedError("TODO: Implement order approval, route selection, and resource allocation.")

