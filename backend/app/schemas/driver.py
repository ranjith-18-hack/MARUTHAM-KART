"""
Pydantic schemas for Driver Mobile / Companion Workflows.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DriverDashboardResponse(BaseModel):
    driver_id: UUID
    driver_code: str
    name: str
    phone: Optional[str] = None
    type: str
    availability: str
    workload: int
    assigned_vehicle_number: Optional[str] = None
    assigned_vehicle_type: Optional[str] = None
    total_deliveries_today: int
    completed_deliveries_today: int
    pending_deliveries: list[DriverDeliveryResponse]


class DriverDeliveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    order_code: str
    buyer_type: str
    destination: str
    delivery_address: Optional[str] = None
    customer_name: str
    customer_phone: Optional[str] = None
    quantity: str
    priority: str
    status: str  # Driver Assigned, On Route, Delivered
    eta: Optional[str] = None
    created_at: Optional[datetime] = None


class DriverLocationUpdateRequest(BaseModel):
    latitude: float
    longitude: float
    heading: Optional[float] = None
    speed_kmh: Optional[float] = None


class DriverOTPVerifyRequest(BaseModel):
    otp: str = Field(..., min_length=4, max_length=6, description="Customer delivery OTP (4 to 6 digits)")


class DriverTripActionResponse(BaseModel):
    delivery_id: UUID
    order_id: UUID
    status: str
    message: str
