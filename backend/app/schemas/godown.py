"""
Phase 5 — Godown / Warehouse Operations Pydantic schemas.
"""
from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


# ── Godown Dashboard ──────────────────────────────────────────────────────────

class GodownDashboardResponse(BaseModel):
    godown_id: Optional[UUID]
    godown_name: Optional[str]
    godown_location: Optional[str]
    total_products: int
    low_stock_count: int
    out_of_stock_count: int
    pending_orders: int
    processing_orders: int
    picking_orders: int
    packing_orders: int
    ready_for_dispatch_orders: int
    unresolved_alerts: int
    recent_stock_movements: int


# ── Inventory ─────────────────────────────────────────────────────────────────

class ProductLocationResponse(BaseModel):
    rack: Optional[str] = None
    shelf: Optional[str] = None
    bin: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class InventoryItemResponse(BaseModel):
    product_id: UUID
    product_name: str
    category: str
    unit: str
    available_qty: Decimal
    status: str          # Active / Inactive
    availability: str    # Available / Low Stock / Out of Stock
    price: Decimal
    location: Optional[ProductLocationResponse] = None

    class Config:
        from_attributes = True


class InventoryListResponse(BaseModel):
    items: List[InventoryItemResponse]
    total: int
    skip: int
    limit: int


# ── Stock Adjustments ─────────────────────────────────────────────────────────

class StockAdjustmentRequest(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., description="Positive to add, negative to remove")
    movement_type: str = Field(
        ...,
        description="RECEIPT | ADJUSTMENT | DAMAGE | RETURN | TRANSFER",
    )
    reason: str = Field(..., min_length=3, max_length=500)
    min_stock_level: Optional[Decimal] = Field(None, ge=0, description="Update minimum stock level if provided")


class StockMovementResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    prev_qty: Decimal
    changed_qty: Decimal
    new_qty: Decimal
    reason: str
    type: str
    user_id: UUID
    date: datetime

    class Config:
        from_attributes = True


class StockMovementListResponse(BaseModel):
    items: List[StockMovementResponse]
    total: int
    skip: int
    limit: int


# ── Product Location Management ───────────────────────────────────────────────

class ProductLocationRequest(BaseModel):
    rack: Optional[str] = Field(None, max_length=50)
    shelf: Optional[str] = Field(None, max_length=50)
    bin: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


# ── Godown Order View ─────────────────────────────────────────────────────────

class GodownOrderItemResponse(BaseModel):
    order_item_id: UUID
    product_id: UUID
    product_name: str
    quantity: Decimal
    unit: str
    available_qty: Decimal  # current stock
    picking_status: Optional[str] = None  # Pending / Picked
    picked_qty: Optional[Decimal] = None

    class Config:
        from_attributes = True


class GodownOrderResponse(BaseModel):
    id: UUID
    order_code: str
    customer_name: str
    status: str
    total_amount: Decimal
    delivery_address: Optional[str] = None
    created_at: datetime
    items: List[GodownOrderItemResponse]
    packing: Optional["PackingRecordResponse"] = None

    class Config:
        from_attributes = True


class GodownOrderListResponse(BaseModel):
    items: List[GodownOrderResponse]
    total: int
    skip: int
    limit: int


# ── Picking ───────────────────────────────────────────────────────────────────

class PickItemRequest(BaseModel):
    order_item_id: UUID
    picked_qty: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class PickingRequest(BaseModel):
    items: List[PickItemRequest] = Field(..., min_length=1)
    notes: Optional[str] = None


class PickingRecordResponse(BaseModel):
    id: UUID
    order_id: UUID
    order_item_id: UUID
    product_id: UUID
    product_name: str
    required_qty: Decimal
    picked_qty: Decimal
    status: str
    picked_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# ── Packing ───────────────────────────────────────────────────────────────────

class PackingRequest(BaseModel):
    package_count: int = Field(1, ge=1)
    total_weight_kg: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None


class PackingRecordResponse(BaseModel):
    id: UUID
    order_id: UUID
    package_count: int
    total_weight_kg: Optional[Decimal] = None
    notes: Optional[str] = None
    packed_at: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True


# ── Alerts ────────────────────────────────────────────────────────────────────

class GodownAlertResponse(BaseModel):
    id: UUID
    godown_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    product_name: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    is_resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GodownAlertListResponse(BaseModel):
    items: List[GodownAlertResponse]
    total: int
    skip: int
    limit: int


# Update forward refs
GodownOrderResponse.model_rebuild()
