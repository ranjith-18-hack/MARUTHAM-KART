"""
Pydantic schemas for Farmer Portal & Procurement Workflows.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Farmer Profile & Metrics ──────────────────────────────────────────────────

class FarmerProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    farmer_code: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: str
    rating: float
    products_supplied: int
    verified: bool
    status: str


class FarmerProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None


class FarmerDashboardResponse(BaseModel):
    farmer_id: UUID
    farmer_code: str
    name: str
    location: str
    rating: float
    total_earnings: Decimal
    pending_payouts: Decimal
    total_batches_supplied: int
    active_pickup_requests: int
    products_count: int
    recent_batches: list[FarmerBatchResponse]
    recent_pickups: list[FarmerPickupResponse]
    recent_payouts: list[FarmerPayoutResponse]


# ── Farmer Batches ────────────────────────────────────────────────────────────

class FarmerBatchCreateRequest(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0)
    harvest_date: Optional[str] = None
    expiry_date: Optional[datetime] = None
    quality_status: str = Field("Good", description="Good, Average, Poor")
    storage_zone_id: Optional[UUID] = None


class FarmerBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    batch_code: str
    product_id: UUID
    product_name: str
    product_category: str
    quantity: Decimal
    unit: str
    received_date: Optional[datetime] = None
    harvest_date: Optional[str] = None
    expiry_date: Optional[datetime] = None
    status: str
    quality_status: str


class FarmerBatchListResponse(BaseModel):
    items: list[FarmerBatchResponse]
    total: int


# ── Farmer Pickups / Procurement ──────────────────────────────────────────────

class FarmerPickupCreateRequest(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0)
    unit: str = "kg"
    scheduled_date: Optional[datetime] = None
    pickup_location: str
    notes: Optional[str] = None


class FarmerPickupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pickup_code: str
    farmer_id: UUID
    product_id: UUID
    product_name: str
    quantity: Decimal
    unit: str
    scheduled_date: Optional[datetime] = None
    pickup_location: str
    status: str
    assigned_driver_id: Optional[UUID] = None
    assigned_driver_name: Optional[str] = None
    assigned_vehicle_number: Optional[str] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


class FarmerPickupListResponse(BaseModel):
    items: list[FarmerPickupResponse]
    total: int


# ── Farmer Earnings & Payouts ─────────────────────────────────────────────────

class FarmerPayoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    payout_code: str
    farmer_id: UUID
    amount: Decimal
    payment_method: str
    status: str
    reference_number: Optional[str] = None
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


class FarmerPayoutListResponse(BaseModel):
    items: list[FarmerPayoutResponse]
    total: int
    total_paid: Decimal
    total_pending: Decimal
