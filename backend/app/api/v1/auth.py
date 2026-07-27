from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.account import CustomerRead
from app.schemas.auth import CustomerRegisterRequest, LoginRequest, LoginResponse
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def register(payload: CustomerRegisterRequest, db: Session = Depends(get_db)) -> CustomerRead:
    service = AuthService(db)
    try:
        return service.register_customer(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    service = AuthService(db)
    principal = service.login(payload)
    if not principal:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return principal


@router.post("/logout", response_model=MessageResponse)
def logout(db: Session = Depends(get_db)) -> MessageResponse:
    return MessageResponse(**AuthService(db).logout())
