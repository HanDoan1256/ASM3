from app.schemas.common import ORMModel


class ServiceOptionBase(ORMModel):
    service_name: str
    description: str | None = None
    base_price: float
    estimated_days: int


class ServiceOptionCreate(ServiceOptionBase):
    pass


class ServiceOptionUpdate(ORMModel):
    service_name: str | None = None
    description: str | None = None
    base_price: float | None = None
    estimated_days: int | None = None


class ServiceOptionRead(ServiceOptionBase):
    service_id: int

