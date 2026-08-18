"""
Phase 6 — Transport & Logistics Management Pydantic schemas.
"""
from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


# ── 1. Dashboard ──────────────────────────────────────────────────────────────

class TransportDashboardResponse(BaseModel):
    total_vehicles: int
    available_vehicles: int
    assigned_vehicles: int
    on_route_vehicles: int
    maintenance_vehicles: int

    total_drivers: int
    available_drivers: int
    assigned_drivers: int
    on_route_drivers: int
    off_duty_drivers: int

    queue_ready_count: int
    queue_vehicle_assigned_count: int
    queue_driver_assigned_count: int
    queue_dispatched_count: int
    queue_out_for_delivery_count: int
    delivered_today_count: int

    active_deliveries_count: int


# ── 2. Vehicles ───────────────────────────────────────────────────────────────

class VehicleCreateRequest(BaseModel):
    number: str = Field(..., min_length=4, max_length=50, description="License plate / registration number")
    type: str = Field(..., max_length=100, description="Two Wheeler, Mini Van, Mini Truck, Truck, Lorry")
    max_weight: Decimal = Field(..., gt=0, description="Maximum carrying weight in kg")
    max_volume: Decimal = Field(..., gt=0, description="Maximum volume in cubic meters")
    capacity: str = Field(..., max_length=50, description="Readable capacity, e.g. '500 kg'")
    service_status: Optional[str] = Field("Healthy", description="Healthy, Service Due, Maintenance")
    assigned_driver_id: Optional[UUID] = None


class VehicleUpdateRequest(BaseModel):
    type: Optional[str] = None
    max_weight: Optional[Decimal] = Field(None, gt=0)
    max_volume: Optional[Decimal] = Field(None, gt=0)
    capacity: Optional[str] = None
    status: Optional[str] = Field(None, description="Available, Assigned, On Route, Maintenance")
    service_status: Optional[str] = Field(None, description="Healthy, Service Due, Maintenance")
    insurance_status: Optional[str] = None
    fitness_status: Optional[str] = None
    assigned_driver_id: Optional[UUID] = None


class VehicleResponse(BaseModel):
    id: UUID
    vehicle_code: str
    number: str
    type: str
    max_weight: Decimal
    max_volume: Decimal
    capacity: str
    status: str
    service_status: str
    insurance_status: str
    fitness_status: str
    assigned_driver_id: Optional[UUID] = None
    assigned_driver_name: Optional[str] = None

    class Config:
        from_attributes = True


class VehicleListResponse(BaseModel):
    items: List[VehicleResponse]
    total: int
    skip: int
    limit: int


# ── 3. Drivers ────────────────────────────────────────────────────────────────

class DriverCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    type: str = Field(..., max_length=100, description="Home Delivery Driver, Bulk Delivery Driver")
    vehicle_id: Optional[UUID] = None


class DriverUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    type: Optional[str] = None
    availability: Optional[str] = Field(None, description="Available, Assigned, On Route, Off Duty")
    vehicle_id: Optional[UUID] = None


class DriverResponse(BaseModel):
    id: UUID
    driver_code: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    type: str
    availability: str
    workload: int
    vehicle_id: Optional[UUID] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None

    class Config:
        from_attributes = True


class DriverListResponse(BaseModel):
    items: List[DriverResponse]
    total: int
    skip: int
    limit: int


# ── 4. Allocation & Assignment ────────────────────────────────────────────────

class AutoAllocateResponse(BaseModel):
    order_id: UUID
    order_code: str
    cargo_weight: Decimal
    cargo_volume: Optional[Decimal] = None
    vehicle: Optional[VehicleResponse] = None
    driver: Optional[DriverResponse] = None
    success: bool
    reason: str


class ManualAssignRequest(BaseModel):
    vehicle_id: UUID
    driver_id: UUID
    notes: Optional[str] = Field(None, max_length=500)


class TransportAssignmentResponse(BaseModel):
    id: UUID
    order_id: UUID
    order_code: str
    vehicle_id: UUID
    vehicle_number: str
    vehicle_type: str
    driver_id: UUID
    driver_name: str
    assigned_by_id: UUID
    assignment_time: datetime
    status: str

    class Config:
        from_attributes = True


# ── 5. Dispatch & Tracking ────────────────────────────────────────────────────

class DispatchOrderRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=500)


class OutForDeliveryRequest(BaseModel):
    eta: Optional[str] = Field(None, description="Estimated time of arrival, e.g. '30 mins' or '2:00 PM'")
    notes: Optional[str] = Field(None, max_length=500)


class DeliverOrderRequest(BaseModel):
    otp: Optional[str] = Field(None, description="Delivery OTP if required")
    notes: Optional[str] = Field(None, max_length=500)


class DeliveryTrackingResponse(BaseModel):
    order_id: UUID
    order_code: str
    status: str
    delivery_address: str
    cargo_weight: Optional[Decimal] = None
    package_count: Optional[int] = None
    vehicle: Optional[VehicleResponse] = None
    driver: Optional[DriverResponse] = None
    eta: Optional[str] = None
    assignment_time: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    status_history: List[dict] = []


# ── 6. Transport Queue ────────────────────────────────────────────────────────

class TransportQueueItemResponse(BaseModel):
    order_id: UUID
    order_code: str
    customer_name: str
    customer_phone: Optional[str] = None
    destination: str
    cargo_weight: Optional[Decimal] = None
    package_count: Optional[int] = None
    status: str
    priority: str = "Normal"
    delivery_type: str = "Home Delivery"
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None
    driver: Optional[DriverResponse] = None
    sla_target_seconds: float = 120.0
    elapsed_seconds: Optional[float] = None
    sla_status: Optional[str] = "WITHIN_SLA"
    delay_reason: Optional[str] = None
    payment_verified_at: Optional[datetime] = None
    driver_assigned_at: Optional[datetime] = None
    godown_name: Optional[str] = None

    class Config:
        from_attributes = True


class TransportQueueListResponse(BaseModel):
    items: List[TransportQueueItemResponse]
    total: int
    skip: int
    limit: int


class SLADashboardResponse(BaseModel):
    target_assignment_time_seconds: float = 120.0
    total_orders: int
    assigned_orders_count: int
    within_sla_count: int
    exceeded_sla_count: int
    sla_compliance_rate_pct: float
    average_assignment_seconds: float
    median_assignment_seconds: float
    fastest_assignment_seconds: float
    slowest_assignment_seconds: float
    awaiting_vehicle_count: int
    awaiting_driver_count: int
    average_godown_processing_seconds: float
    items: List[TransportQueueItemResponse]
    generated_at: str


# ── 7. Transport Audit Logs ───────────────────────────────────────────────────

class TransportAuditLogResponse(BaseModel):
    id: UUID
    timestamp: datetime
    performed_by: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[dict] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True


class TransportAuditLogListResponse(BaseModel):
    items: List[TransportAuditLogResponse]
    total: int
    skip: int
    limit: int
