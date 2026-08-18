"""
Pydantic schemas for authentication and user management.
All response schemas deliberately omit password_hash to prevent leakage.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Role constants ────────────────────────────────────────────────────────────

class UserRole:
    ADMIN               = "ADMIN"
    CUSTOMER            = "CUSTOMER"
    GODOWN_MANAGER      = "GODOWN_MANAGER"
    TRANSPORT_MANAGER   = "TRANSPORT_MANAGER"
    DRIVER              = "DRIVER"
    RECRUITMENT_OFFICER = "RECRUITMENT_OFFICER"
    EMPLOYEE            = "EMPLOYEE"
    HOTEL_BUSINESS      = "HOTEL_BUSINESS"

    ALL_ROLES = [
        ADMIN, CUSTOMER, GODOWN_MANAGER, TRANSPORT_MANAGER,
        DRIVER, RECRUITMENT_OFFICER, EMPLOYEE, HOTEL_BUSINESS,
    ]

    # Role → portal redirect path for the frontend
    PORTAL_MAP = {
        CUSTOMER:            "/home",
        GODOWN_MANAGER:      "/godown",
        TRANSPORT_MANAGER:   "/transport",
        DRIVER:              "/driver/dashboard",
        RECRUITMENT_OFFICER: "/recruitment",
        EMPLOYEE:            "/office/dashboard",
        HOTEL_BUSINESS:      "/business/dashboard",
        ADMIN:               "/office/dashboard",
    }


# ── Request schemas ───────────────────────────────────────────────────────────

class CustomerRegisterRequest(BaseModel):
    """Used by the public customer registration page."""
    name: str = Field(..., min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("phone", mode="before")
    @classmethod
    def phone_or_email_required(cls, v, info):
        # Handled at route level for cross-field validation
        return v


class LoginRequest(BaseModel):
    """
    Flexible login: accepts email, phone, employee_code, or farmer_code as
    the 'identifier' field. This avoids exposing which field was used.
    """
    identifier: str = Field(
        ...,
        description="Email, phone number, or employee/driver/farmer code",
        min_length=1,
    )
    password: str = Field(..., min_length=1, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=128)


# ── Recruitment account creation ──────────────────────────────────────────────

class RecruitmentAccountCreateRequest(BaseModel):
    """
    Used by Recruitment Officers to provision staff, driver, B2B partner,
    godown manager, etc. accounts.
    """
    name: str = Field(..., min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    role: str = Field(..., description="Must be one of UserRole.ALL_ROLES (excluding CUSTOMER)")
    department_name: Optional[str] = Field(
        None, description="Department the user belongs to (e.g. GODOWN, TRANSPORT)"
    )
    # Profile-specific fields (optional, used depending on role)
    location: Optional[str] = None
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    driver_type: Optional[str] = None  # Home Delivery Driver, Bulk Delivery Driver
    initial_password: str = Field(
        ..., min_length=6, max_length=128,
        description="Temporary password; user should change on first login",
    )

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        normalized = v.upper()
        if normalized == UserRole.CUSTOMER:
            raise ValueError("Customer accounts cannot be created by recruitment officers.")
        if normalized not in UserRole.ALL_ROLES:
            raise ValueError(
                f"Invalid role '{v}'. Must be one of: {', '.join(UserRole.ALL_ROLES)}"
            )
        return normalized


class AccountStatusUpdateRequest(BaseModel):
    """Used to approve or suspend a staff account."""
    status: str = Field(..., description="Active | Suspended | Pending")
    reason: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"Active", "Suspended", "Pending"}
        if v not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v


# ── Response schemas (no passwords) ──────────────────────────────────────────

class UserResponse(BaseModel):
    """Safe user representation — never includes password_hash."""
    id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    role: str
    status: str
    created_at: datetime

    # Computed portal redirect hint for frontend
    portal_redirect: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_portal(cls, user) -> "UserResponse":
        obj = cls.model_validate(user)
        obj.portal_redirect = UserRole.PORTAL_MAP.get(user.role.upper())
        return obj


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


class SendOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    purpose: str = Field(default="login")
    channel: Optional[str] = Field(default="auto")  # "sms" | "whatsapp" | "auto"


class VerifyOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=20)
    otp: str = Field(..., min_length=4, max_length=8)
    purpose: str = Field(default="login")
    name: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    access_token: Optional[str] = None
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None


class OTPResponse(BaseModel):
    message: str
    phone: str
    expires_in_seconds: int = 300
    purpose: str
    channel: str = "sms"
