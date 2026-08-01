from pydantic import BaseModel, EmailStr


class CustomerRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    message: str
    principal_id: str
    principal_type: str
    email: EmailStr
    role: str
    access_token: str
    token_type: str = "bearer"

