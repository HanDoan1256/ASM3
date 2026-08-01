from collections.abc import Generator
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database.session import SessionLocal
from app.utils.security import decode_access_token


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@dataclass
class Principal:
    """The authenticated caller resolved from a JWT bearer token."""

    principal_id: str
    principal_type: str  # "customer" or "staff"
    role: str


_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> Principal:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

    principal_id = payload.get("sub")
    principal_type = payload.get("principal_type")
    role = payload.get("role")
    if not principal_id or not principal_type or not role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    return Principal(principal_id=principal_id, principal_type=principal_type, role=role)


def require_customer(principal: Principal = Depends(get_current_principal)) -> Principal:
    if principal.principal_type != "customer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer account required")
    return principal


def require_staff(principal: Principal = Depends(get_current_principal)) -> Principal:
    if principal.principal_type != "staff":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff account required")
    return principal


def require_self_customer(customer_id: str, principal: Principal = Depends(require_customer)) -> Principal:
    """Ensure the authenticated customer can only act on their own account/data."""
    if principal.principal_id != customer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another customer's data")
    return principal
