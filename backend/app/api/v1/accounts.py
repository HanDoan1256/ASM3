from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.account import AddressCreate, AddressRead, AddressUpdate, CustomerRead, CustomerUpdate
from app.services.account_service import AccountService

router = APIRouter()


@router.get("/customers/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: str, db: Session = Depends(get_db)) -> CustomerRead:
    customer = AccountService(db).get_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.put("/customers/{customer_id}", response_model=CustomerRead)
def update_customer(customer_id: str, payload: CustomerUpdate, db: Session = Depends(get_db)) -> CustomerRead:
    customer = AccountService(db).update_customer(customer_id, payload)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.get("/customers/{customer_id}/addresses", response_model=list[AddressRead])
def list_addresses(customer_id: str, db: Session = Depends(get_db)) -> list[AddressRead]:
    return AccountService(db).list_addresses(customer_id)


@router.post("/customers/{customer_id}/addresses", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_address(customer_id: str, payload: AddressCreate, db: Session = Depends(get_db)) -> AddressRead:
    return AccountService(db).create_address(customer_id, payload)


@router.put("/addresses/{address_id}", response_model=AddressRead)
def update_address(address_id: int, payload: AddressUpdate, db: Session = Depends(get_db)) -> AddressRead:
    address = AccountService(db).update_address(address_id, payload)
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return address


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(address_id: int, db: Session = Depends(get_db)) -> Response:
    deleted = AccountService(db).delete_address(address_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

