"""
Pydantic schemas for Orders and Order Items.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field


# Valid order status transitions (enforced server-side)
ORDER_STATUS_TRANSITIONS: dict[str, list[str]] = {
    "Pending":             ["Processing", "Cancelled"],
    "Processing":          ["Picking", "Cancelled"],
    "Picking":             ["Packing", "Cancelled"],
    "Packing":             ["Ready for Dispatch", "Cancelled"],
    "Ready for Dispatch":  ["Vehicle Assigned", "Driver Assigned", "Dispatched", "Cancelled"],
    "Vehicle Assigned":    ["Driver Assigned", "Dispatched", "Ready for Dispatch", "Cancelled"],
    "Driver Assigned":     ["Dispatched", "Out for Delivery", "Ready for Dispatch", "Cancelled"],
    "Dispatched":          ["Out for Delivery", "Delivered", "Cancelled"],
    "Out for Delivery":    ["Delivered", "Cancelled"],
    "Delivered":           [],
    "Cancelled":           [],
}


class PlaceOrderRequest(BaseModel):
    """Customer places an order from their cart."""
    delivery_address: str = Field(..., min_length=5, max_length=500)
    notes: Optional[str] = Field(None, max_length=500)


class OrderStatusUpdateRequest(BaseModel):
    """Godown / Transport manager updates order status."""
    status: str = Field(..., description="Target status to transition to")
    notes: Optional[str] = Field(None, max_length=500)

    def validate_transition(self, current_status: str) -> None:
        from fastapi import HTTPException, status as http_status
        allowed = ORDER_STATUS_TRANSITIONS.get(current_status, [])
        if self.status not in allowed:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot transition from '{current_status}' to '{self.status}'. "
                    f"Allowed transitions: {allowed or 'None (terminal state)'}"
                ),
            )


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    quantity: Decimal
    price: Decimal
    unit: str
    subtotal: Decimal

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: UUID
    order_code: str
    customer_id: UUID
    buyer_type: str
    status: str
    total_amount: Decimal
    delivery_charge: Decimal
    delivery_address: Optional[str]
    destination: str
    notes: Optional[str]
    items: list[OrderItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    skip: int
    limit: int


class TimelineEvent(BaseModel):
    status: str
    timestamp: datetime
    notes: Optional[str] = None


class CustomerOrderTrackingResponse(BaseModel):
    order_id: UUID
    order_code: str
    status: str
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    total_amount: Decimal
    delivery_charge: Decimal
    delivery_address: Optional[str] = None
    destination: str
    verified_weight_kg: Optional[Decimal] = None
    package_count: Optional[int] = None
    godown_name: Optional[str] = None
    driver_name: Optional[str] = None
    driver_id_code: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_code: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_capacity: Optional[str] = None
    eta: Optional[str] = None
    delivery_otp: Optional[str] = None
    payment_verified_at: Optional[datetime] = None
    driver_assigned_at: Optional[datetime] = None
    assignment_duration_seconds: Optional[float] = None
    assignment_sla_status: Optional[str] = None
    delay_reason: Optional[str] = None
    timeline: list[TimelineEvent] = []
    items: list[OrderItemResponse] = []
    created_at: datetime

