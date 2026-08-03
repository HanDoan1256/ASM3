from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import Principal, get_current_principal, get_db

from app.schemas.account import AddressCreate, AddressRead, AddressUpdate, CustomerRead, CustomerUpdate, AccountHistoryRead
from app.services.account_service import AccountService

from app.schemas.account import StaffResponse
from app.services.account_service import AccountService 

router = APIRouter()


def _ensure_customer_self_or_staff(customer_id: str, principal: Principal) -> None:
    """Customers may only access their own account; staff may access any account."""
    if principal.principal_type == "staff":
        return
    if principal.principal_type == "customer" and principal.principal_id == customer_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another customer's data")


@router.get("/customers/{customer_id}", response_model=CustomerRead)
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> CustomerRead:
    _ensure_customer_self_or_staff(customer_id, principal)
    customer = AccountService(db).get_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer

@router.put("/customers/{customer_id}", response_model=CustomerRead)
def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> CustomerRead:
    _ensure_customer_self_or_staff(customer_id, principal)
    customer = AccountService(db).update_customer(customer_id, payload)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer

@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> Response:
    _ensure_customer_self_or_staff(customer_id, principal)
    deleted = AccountService(db).delete_customer(customer_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/customers/{customer_id}/addresses", response_model=list[AddressRead])
def list_addresses(
    customer_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> list[AddressRead]:
    _ensure_customer_self_or_staff(customer_id, principal)
    return AccountService(db).list_addresses(customer_id)

@router.post("/customers/{customer_id}/addresses", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_address(
    customer_id: str,
    payload: AddressCreate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> AddressRead:
    _ensure_customer_self_or_staff(customer_id, principal)
    return AccountService(db).create_address(customer_id, payload)

@router.put("/addresses/{address_id}", response_model=AddressRead)
def update_address(
    address_id: int,
    payload: AddressUpdate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> AddressRead:
    service = AccountService(db)
    existing = service.get_address(address_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    if existing.customer_id:
        _ensure_customer_self_or_staff(existing.customer_id, principal)
    address = service.update_address(address_id, payload)
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return address

@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> Response:
    service = AccountService(db)
    existing = service.get_address(address_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    if existing.customer_id:
        _ensure_customer_self_or_staff(existing.customer_id, principal)
    deleted = service.delete_address(address_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/customers/{customer_id}/history", response_model=list[AccountHistoryRead])
def get_customer_history(
    customer_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> list[AccountHistoryRead]:
    _ensure_customer_self_or_staff(customer_id, principal)
    return AccountService(db).get_account_history(customer_id)

@router.get("/staff/{staff_id}", response_model=StaffResponse)
def get_staff(
    staff_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> StaffResponse:
    staff = AccountService(db).get_staff(staff_id)
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff not found")
    return staff