from app.schemas.common import ORMModel


class BranchBase(ORMModel):
    branch_name: str
    address: str
    phone: str | None = None


class BranchCreate(BranchBase):
    pass


class BranchUpdate(ORMModel):
    branch_name: str | None = None
    address: str | None = None
    phone: str | None = None


class BranchRead(BranchBase):
    branch_id: str

