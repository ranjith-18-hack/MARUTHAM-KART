"""
Pydantic schemas for Customer profile and address management.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class CustomerProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=20)


class CustomerAddressCreateRequest(BaseModel):
    recipient_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=10, max_length=20)
    address_label: Optional[str] = Field(default="Home", max_length=50)
    door_no: Optional[str] = Field(None, max_length=50)
    street_address: str = Field(..., min_length=3)
    area: str = Field(..., min_length=2, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    state: Optional[str] = Field(default="Tamil Nadu", max_length=100)
    postal_code: str = Field(..., min_length=5, max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: Optional[bool] = False


class CustomerAddressUpdateRequest(BaseModel):
    recipient_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    address_label: Optional[str] = Field(None, max_length=50)
    door_no: Optional[str] = Field(None, max_length=50)
    street_address: Optional[str] = Field(None, min_length=3)
    area: Optional[str] = Field(None, min_length=2, max_length=100)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=5, max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: Optional[bool] = None


class CustomerAddressResponse(BaseModel):
    id: UUID
    customer_id: UUID
    recipient_name: str
    phone: str
    address_label: str
    door_no: Optional[str] = None
    street_address: str
    area: str
    city: str
    state: str
    postal_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerOnboardingRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    door_no: Optional[str] = Field(None, max_length=50)
    street_address: str = Field(..., min_length=3)
    area: str = Field(..., min_length=2, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    state: Optional[str] = Field(default="Tamil Nadu", max_length=100)
    postal_code: str = Field(..., min_length=5, max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address_label: Optional[str] = Field(default="Home", max_length=50)


class CustomerProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    customer_code: str
    status: str
    created_at: datetime
    default_address: Optional[CustomerAddressResponse] = None
    addresses_count: int = 0
    assigned_godown: Optional[dict] = None

    model_config = {"from_attributes": True}
