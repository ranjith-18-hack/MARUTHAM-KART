"""
Phase 6 — Transport & Logistics Management API Routes.

Endpoints:
  GET    /api/v1/transport/dashboard
  GET    /api/v1/transport/queue
  GET    /api/v1/transport/queue/{order_id}
  GET    /api/v1/transport/vehicles
  POST   /api/v1/transport/vehicles
  GET    /api/v1/transport/vehicles/{vehicle_id}
  PATCH  /api/v1/transport/vehicles/{vehicle_id}
  GET    /api/v1/transport/drivers
  POST   /api/v1/transport/drivers
  GET    /api/v1/transport/drivers/{driver_id}
  PATCH  /api/v1/transport/drivers/{driver_id}
  POST   /api/v1/transport/orders/{order_id}/auto-allocate
  POST   /api/v1/transport/orders/{order_id}/assign
  POST   /api/v1/transport/orders/{order_id}/dispatch
  POST   /api/v1/transport/orders/{order_id}/out-for-delivery
  POST   /api/v1/transport/orders/{order_id}/deliver
  GET    /api/v1/transport/tracking/{order_id}
  GET    /api/v1/transport/logs
"""
from __future__ import annotations

import random
import string
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import (
    get_current_user,
    get_database_session,
    require_transport_or_admin,
    RoleChecker,
)
from app.core.events import (
    emit_event,
    EVENT_TRANSPORT_ASSIGNED,
    EVENT_DELIVERY_STARTED,
    EVENT_DELIVERY_COMPLETED,
)
from app.core.logistics import (
    auto_allocate_transport_for_order,
    calculate_order_cargo,
    get_eligible_vehicles_ranked,
    get_eligible_drivers_ranked,
)
from app.core.sla import (
    evaluate_order_sla_status,
    process_auto_assignment_for_order,
    calculate_operational_sla_metrics,
    handle_driver_unavailability,
    handle_vehicle_unavailability,
    TARGET_ASSIGNMENT_TIME_SECONDS,
)
from app.core.security import get_password_hash
from app.models.models import (
    AuditLog,
    Delivery,
    DeliveryOTP,
    Department,
    Driver,
    Employee,
    Godown,
    Order,
    OrderItem,
    OrderStatusHistory,
    PackingRecord,
    TransportAssignment,
    User,
    Vehicle,
)
from app.schemas.transport import (
    AutoAllocateResponse,
    DeliverOrderRequest,
    DeliveryTrackingResponse,
    DispatchOrderRequest,
    DriverCreateRequest,
    DriverListResponse,
    DriverResponse,
    DriverUpdateRequest,
    ManualAssignRequest,
    OutForDeliveryRequest,
    TransportAssignmentResponse,
    TransportAuditLogListResponse,
    TransportAuditLogResponse,
    TransportDashboardResponse,
    TransportQueueItemResponse,
    TransportQueueListResponse,
    SLADashboardResponse,
    VehicleCreateRequest,
    VehicleListResponse,
    VehicleResponse,
    VehicleUpdateRequest,
)

router = APIRouter(prefix="/transport", tags=["Transport & Logistics"])

# Staff allowed to perform transport management operations
require_transport_staff = RoleChecker(["TRANSPORT_MANAGER", "ADMIN", "EMPLOYEE", "DRIVER"])

TRANSPORT_QUEUE_STATUSES = [
    "Ready for Dispatch",
    "Vehicle Assigned",
    "Driver Assigned",
    "Dispatched",
    "Out for Delivery",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _gen_vehicle_code(db: Session) -> str:
    for _ in range(20):
        suffix = "".join(random.choices(string.digits, k=4))
        code = f"MK-V-{suffix}"
        if not db.query(Vehicle).filter(Vehicle.vehicle_code == code).first():
            return code
    return f"MK-V-{uuid.uuid4().hex[:4].upper()}"


def _gen_driver_code(db: Session) -> str:
    for _ in range(20):
        suffix = "".join(random.choices(string.digits, k=3))
        code = f"MK-DRI-{suffix}"
        if not db.query(Driver).filter(Driver.driver_code == code).first():
            return code
    return f"MK-DRI-{uuid.uuid4().hex[:4].upper()}"


def _build_vehicle_response(v: Vehicle) -> VehicleResponse:
    assigned_driver = v.assigned_drivers[0] if v.assigned_drivers else None
    return VehicleResponse(
        id=v.id,
        vehicle_code=v.vehicle_code,
        number=v.number,
        type=v.type,
        max_weight=Decimal(str(v.max_weight)),
        max_volume=Decimal(str(v.max_volume)),
        capacity=v.capacity,
        status=v.status,
        service_status=v.service_status,
        insurance_status=v.insurance_status,
        fitness_status=v.fitness_status,
        assigned_driver_id=assigned_driver.id if assigned_driver else None,
        assigned_driver_name=assigned_driver.user.name if (assigned_driver and assigned_driver.user) else None,
    )


def _build_driver_response(d: Driver) -> DriverResponse:
    user = d.user
    vehicle = d.vehicle
    return DriverResponse(
        id=d.id,
        driver_code=d.driver_code,
        name=user.name if user else "Unknown Driver",
        email=user.email if user else None,
        phone=user.phone if user else None,
        type=d.type,
        availability=d.availability,
        workload=d.workload or 0,
        vehicle_id=vehicle.id if vehicle else None,
        vehicle_number=vehicle.number if vehicle else None,
        vehicle_type=vehicle.type if vehicle else None,
    )


def _get_or_create_transport_department(db: Session) -> Department:
    dept = db.query(Department).filter(Department.name == "Logistics & Transport").first()
    if not dept:
        dept = Department(name="Logistics & Transport")
        db.add(dept)
        db.flush()
    return dept


# ── 1. Transport Dashboard ───────────────────────────────────────────────────

@router.get(
    "/dashboard",
    response_model=TransportDashboardResponse,
    summary="Transport: dashboard fleet and queue metrics",
)
def transport_dashboard(
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    # Vehicle metrics
    total_v = db.query(Vehicle).count()
    avail_v = db.query(Vehicle).filter(Vehicle.status == "Available").count()
    assigned_v = db.query(Vehicle).filter(Vehicle.status == "Assigned").count()
    route_v = db.query(Vehicle).filter(Vehicle.status == "On Route").count()
    maint_v = db.query(Vehicle).filter(Vehicle.status == "Maintenance").count()

    # Driver metrics
    total_d = db.query(Driver).count()
    avail_d = db.query(Driver).filter(Driver.availability == "Available").count()
    assigned_d = db.query(Driver).filter(Driver.availability == "Assigned").count()
    route_d = db.query(Driver).filter(Driver.availability == "On Route").count()
    off_d = db.query(Driver).filter(Driver.availability == "Off Duty").count()

    # Queue counts
    def _count_status(st: str) -> int:
        return db.query(Order).filter(Order.status == st).count()

    ready = _count_status("Ready for Dispatch")
    veh_assigned = _count_status("Vehicle Assigned")
    dri_assigned = _count_status("Driver Assigned")
    dispatched = _count_status("Dispatched")
    out_for_del = _count_status("Out for Delivery")

    # Delivered today
    today_start = datetime.combine(date.today(), datetime.min.time())
    delivered_today = (
        db.query(OrderStatusHistory)
        .filter(
            OrderStatusHistory.status == "Delivered",
            OrderStatusHistory.timestamp >= today_start,
        )
        .count()
    )

    active_deliveries = veh_assigned + dri_assigned + dispatched + out_for_del

    return TransportDashboardResponse(
        total_vehicles=total_v,
        available_vehicles=avail_v,
        assigned_vehicles=assigned_v,
        on_route_vehicles=route_v,
        maintenance_vehicles=maint_v,
        total_drivers=total_d,
        available_drivers=avail_d,
        assigned_drivers=assigned_d,
        on_route_drivers=route_d,
        off_duty_drivers=off_d,
        queue_ready_count=ready,
        queue_vehicle_assigned_count=veh_assigned,
        queue_driver_assigned_count=dri_assigned,
        queue_dispatched_count=dispatched,
        queue_out_for_delivery_count=out_for_del,
        delivered_today_count=delivered_today,
        active_deliveries_count=active_deliveries,
    )


# ── 2. Transport Queue ────────────────────────────────────────────────────────

@router.get(
    "/queue",
    response_model=TransportQueueListResponse,
    summary="Transport: view active delivery orders queue",
)
def list_transport_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    order_status: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    statuses = [order_status] if order_status else TRANSPORT_QUEUE_STATUSES
    q = db.query(Order).filter(Order.status.in_(statuses))

    if search:
        q = q.filter(
            (Order.order_code.ilike(f"%{search}%"))
            | (Order.destination.ilike(f"%{search}%"))
        )

    total = q.count()
    orders = q.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for o in orders:
        weight, _ = calculate_order_cargo(o, db)
        packing = db.query(PackingRecord).filter(PackingRecord.order_id == o.id).first()

        # Find assigned transport / vehicle / driver if any
        assignment = (
            db.query(TransportAssignment)
            .filter(TransportAssignment.order_id == o.id)
            .order_by(TransportAssignment.assignment_time.desc())
            .first()
        )

        veh_resp = _build_vehicle_response(assignment.vehicle) if (assignment and assignment.vehicle) else None
        dri_resp = _build_driver_response(assignment.driver) if (assignment and assignment.driver) else None

        delivery_type = "Bulk Delivery" if (weight and weight >= 100) else "Home Delivery"
        sla_info = evaluate_order_sla_status(o)

        items.append(
            TransportQueueItemResponse(
                order_id=o.id,
                order_code=o.order_code,
                customer_name=o.customer.name if o.customer else "Customer",
                customer_phone=o.customer.phone if o.customer else None,
                destination=o.destination,
                cargo_weight=weight,
                package_count=packing.package_count if packing else 1,
                status=o.status,
                priority="High" if (weight and weight >= 50) else "Normal",
                delivery_type=delivery_type,
                created_at=o.created_at,
                vehicle=veh_resp,
                driver=dri_resp,
                sla_target_seconds=sla_info["target_seconds"],
                elapsed_seconds=sla_info["elapsed_seconds"],
                sla_status=sla_info["sla_status"],
                delay_reason=sla_info["delay_reason"],
                payment_verified_at=sla_info["payment_verified_at"],
                driver_assigned_at=sla_info["driver_assigned_at"],
                godown_name=o.assigned_godown.name if o.assigned_godown else None,
            )
        )

    return TransportQueueListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/queue/{order_id}",
    response_model=TransportQueueItemResponse,
    summary="Transport: get detailed transport queue item",
)
def get_transport_queue_item(
    order_id: UUID,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found in transport queue.")

    weight, _ = calculate_order_cargo(o, db)
    packing = db.query(PackingRecord).filter(PackingRecord.order_id == o.id).first()
    assignment = (
        db.query(TransportAssignment)
        .filter(TransportAssignment.order_id == o.id)
        .order_by(TransportAssignment.assignment_time.desc())
        .first()
    )

    veh_resp = _build_vehicle_response(assignment.vehicle) if (assignment and assignment.vehicle) else None
    dri_resp = _build_driver_response(assignment.driver) if (assignment and assignment.driver) else None

    delivery_type = "Bulk Delivery" if (weight and weight >= 100) else "Home Delivery"
    sla_info = evaluate_order_sla_status(o)

    return TransportQueueItemResponse(
        order_id=o.id,
        order_code=o.order_code,
        customer_name=o.customer.name if o.customer else "Customer",
        customer_phone=o.customer.phone if o.customer else None,
        destination=o.destination,
        cargo_weight=weight,
        package_count=packing.package_count if packing else 1,
        status=o.status,
        priority="High" if (weight and weight >= 50) else "Normal",
        delivery_type=delivery_type,
        created_at=o.created_at,
        vehicle=veh_resp,
        driver=dri_resp,
        sla_target_seconds=sla_info["target_seconds"],
        elapsed_seconds=sla_info["elapsed_seconds"],
        sla_status=sla_info["sla_status"],
        delay_reason=sla_info["delay_reason"],
        payment_verified_at=sla_info["payment_verified_at"],
        driver_assigned_at=sla_info["driver_assigned_at"],
        godown_name=o.assigned_godown.name if o.assigned_godown else None,
    )


# ── 3. Vehicles ───────────────────────────────────────────────────────────────

@router.get(
    "/vehicles",
    response_model=VehicleListResponse,
    summary="Transport: list fleet vehicles",
)
def list_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    vehicle_type: Optional[str] = Query(None, alias="type"),
    service_status: Optional[str] = Query(None),
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    q = db.query(Vehicle)
    if status:
        q = q.filter(Vehicle.status == status)
    if vehicle_type:
        q = q.filter(Vehicle.type == vehicle_type)
    if service_status:
        q = q.filter(Vehicle.service_status == service_status)

    total = q.count()
    vehicles = q.order_by(Vehicle.max_weight.asc()).offset(skip).limit(limit).all()

    return VehicleListResponse(
        items=[_build_vehicle_response(v) for v in vehicles],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/vehicles",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Transport: register a new vehicle",
)
def create_vehicle(
    body: VehicleCreateRequest,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    # Check duplicate number
    if db.query(Vehicle).filter(Vehicle.number == body.number).first():
        raise HTTPException(status_code=400, detail=f"Vehicle with number '{body.number}' already exists.")

    vehicle = Vehicle(
        vehicle_code=_gen_vehicle_code(db),
        number=body.number,
        type=body.type,
        max_weight=body.max_weight,
        max_volume=body.max_volume,
        capacity=body.capacity,
        status="Available",
        service_status=body.service_status or "Healthy",
    )
    db.add(vehicle)
    db.flush()

    # Link driver if provided
    if body.assigned_driver_id:
        driver = db.query(Driver).filter(Driver.id == body.assigned_driver_id).first()
        if driver:
            driver.vehicle_id = vehicle.id

    # Audit log
    dept = _get_or_create_transport_department(db)
    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Vehicle Registered",
        department_id=dept.id,
        entity_type="Vehicle",
        entity_id=str(vehicle.id),
        new_value={"number": vehicle.number, "type": vehicle.type, "capacity": vehicle.capacity},
    ))

    db.commit()
    db.refresh(vehicle)
    return _build_vehicle_response(vehicle)


@router.get(
    "/vehicles/{vehicle_id}",
    response_model=VehicleResponse,
    summary="Transport: view single vehicle details",
)
def get_vehicle(
    vehicle_id: UUID,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    return _build_vehicle_response(v)


@router.patch(
    "/vehicles/{vehicle_id}",
    response_model=VehicleResponse,
    summary="Transport: update vehicle details or status",
)
def update_vehicle(
    vehicle_id: UUID,
    body: VehicleUpdateRequest,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    old_status = v.status
    if body.type is not None:
        v.type = body.type
    if body.max_weight is not None:
        v.max_weight = body.max_weight
    if body.max_volume is not None:
        v.max_volume = body.max_volume
    if body.capacity is not None:
        v.capacity = body.capacity
    if body.status is not None:
        v.status = body.status
    if body.service_status is not None:
        v.service_status = body.service_status
    if body.insurance_status is not None:
        v.insurance_status = body.insurance_status
    if body.fitness_status is not None:
        v.fitness_status = body.fitness_status

    if body.assigned_driver_id is not None:
        # Clear existing assigned drivers for this vehicle
        existing_drivers = db.query(Driver).filter(Driver.vehicle_id == v.id).all()
        for ed in existing_drivers:
            ed.vehicle_id = None
        driver = db.query(Driver).filter(Driver.id == body.assigned_driver_id).first()
        if driver:
            driver.vehicle_id = v.id

    dept = _get_or_create_transport_department(db)
    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Vehicle Updated",
        department_id=dept.id,
        entity_type="Vehicle",
        entity_id=str(v.id),
        previous_value={"status": old_status},
        new_value={"status": v.status, "service_status": v.service_status},
    ))

    db.commit()
    db.refresh(v)

    # 2-Minute SLA: If vehicle became unavailable, reassign affected active orders
    if v.status in ("Maintenance", "Disabled") or v.service_status == "Maintenance":
        handle_vehicle_unavailability(db, v.id, "Vehicle status updated to maintenance/disabled")

    return _build_vehicle_response(v)


# ── 4. Drivers ────────────────────────────────────────────────────────────────

@router.get(
    "/drivers",
    response_model=DriverListResponse,
    summary="Transport: list drivers",
)
def list_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    availability: Optional[str] = Query(None),
    driver_type: Optional[str] = Query(None, alias="type"),
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    q = db.query(Driver)
    if availability:
        q = q.filter(Driver.availability == availability)
    if driver_type:
        q = q.filter(Driver.type == driver_type)

    total = q.count()
    drivers = q.offset(skip).limit(limit).all()

    return DriverListResponse(
        items=[_build_driver_response(d) for d in drivers],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/drivers",
    response_model=DriverResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Transport: register a new driver",
)
def create_driver(
    body: DriverCreateRequest,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    # Check email uniqueness if email provided
    if body.email and db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail=f"Email '{body.email}' already registered.")
    if body.phone and db.query(User).filter(User.phone == body.phone).first():
        raise HTTPException(status_code=400, detail=f"Phone '{body.phone}' already registered.")

    # Create User account with DRIVER role
    user = User(
        name=body.name,
        email=body.email or f"driver_{uuid.uuid4().hex[:6]}@maruthamkart.com",
        phone=body.phone,
        password_hash=get_password_hash("DriverPass@123"),
        role="DRIVER",
        status="Active",
    )
    db.add(user)
    db.flush()

    driver = Driver(
        id=user.id,
        driver_code=_gen_driver_code(db),
        vehicle_id=body.vehicle_id,
        type=body.type,
        availability="Available",
        workload=0,
    )
    db.add(driver)

    dept = _get_or_create_transport_department(db)
    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Driver Registered",
        department_id=dept.id,
        entity_type="Driver",
        entity_id=str(driver.id),
        new_value={"driver_code": driver.driver_code, "name": user.name, "type": driver.type},
    ))

    db.commit()
    db.refresh(driver)
    return _build_driver_response(driver)


@router.get(
    "/drivers/{driver_id}",
    response_model=DriverResponse,
    summary="Transport: view single driver details",
)
def get_driver(
    driver_id: UUID,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found.")
    return _build_driver_response(d)


@router.patch(
    "/drivers/{driver_id}",
    response_model=DriverResponse,
    summary="Transport: update driver availability or vehicle assignment",
)
def update_driver(
    driver_id: UUID,
    body: DriverUpdateRequest,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found.")

    if body.name and d.user:
        d.user.name = body.name
    if body.phone and d.user:
        d.user.phone = body.phone
    if body.type is not None:
        d.type = body.type
    if body.availability is not None:
        d.availability = body.availability
    if body.vehicle_id is not None:
        d.vehicle_id = body.vehicle_id

    dept = _get_or_create_transport_department(db)
    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Driver Updated",
        department_id=dept.id,
        entity_type="Driver",
        entity_id=str(d.id),
        new_value={"availability": d.availability, "vehicle_id": str(d.vehicle_id) if d.vehicle_id else None},
    ))

    db.commit()
    db.refresh(d)

    # 2-Minute SLA: If driver became unavailable, reassign affected active orders
    if d.availability in ("Off Duty", "Suspended", "Unavailable"):
        handle_driver_unavailability(db, d.id, "Driver availability updated to off duty/unavailable")

    return _build_driver_response(d)


# ── 5. Auto-Allocation & Manual Assignment ────────────────────────────────────

@router.post(
    "/orders/{order_id}/auto-allocate",
    response_model=AutoAllocateResponse,
    summary="Transport: calculate optimal vehicle and driver allocation for an order",
)
def auto_allocate_order(
    order_id: UUID,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    allocation = auto_allocate_transport_for_order(db, order)

    veh_resp = _build_vehicle_response(allocation["vehicle"]) if allocation["vehicle"] else None
    dri_resp = _build_driver_response(allocation["driver"]) if allocation["driver"] else None

    return AutoAllocateResponse(
        order_id=order.id,
        order_code=order.order_code,
        cargo_weight=allocation["cargo_weight"],
        cargo_volume=allocation["cargo_volume"],
        vehicle=veh_resp,
        driver=dri_resp,
        success=allocation["success"],
        reason=allocation["reason"],
    )


@router.post(
    "/orders/{order_id}/assign",
    response_model=TransportAssignmentResponse,
    summary="Transport: assign vehicle and driver to order with double-booking prevention",
)
def assign_transport(
    order_id: UUID,
    body: ManualAssignRequest,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).with_for_update().filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.status not in ("Ready for Dispatch", "Vehicle Assigned", "Driver Assigned"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot assign transport to order in '{order.status}' status.",
        )

    # 1. Lock and validate Vehicle
    vehicle = db.query(Vehicle).with_for_update().filter(Vehicle.id == body.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")

    if vehicle.status != "Available":
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle '{vehicle.number}' is not available (current status: {vehicle.status}).",
        )

    if vehicle.service_status == "Maintenance":
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle '{vehicle.number}' is currently in maintenance.",
        )

    # Validate weight capacity
    weight, _ = calculate_order_cargo(order, db)
    if Decimal(str(vehicle.max_weight)) < weight:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient vehicle capacity. Order weight is {weight} kg, "
                f"but vehicle max capacity is {vehicle.max_weight} kg."
            ),
        )

    # 2. Lock and validate Driver
    driver = db.query(Driver).with_for_update().filter(Driver.id == body.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")

    if driver.availability != "Available":
        raise HTTPException(
            status_code=400,
            detail=f"Driver '{driver.user.name if driver.user else driver.driver_code}' is not available (status: {driver.availability}).",
        )

    # 3. Prevent double assignment — update statuses atomically
    now = datetime.utcnow()
    vehicle.status = "Assigned"
    driver.availability = "Assigned"

    old_status = order.status
    order.status = "Driver Assigned"
    order.vehicle_assigned_at = now
    order.driver_assigned_at = now

    ref_start = order.payment_verified_at or order.order_confirmed_at or order.created_at or now
    payment_to_driver_sec = max(0.0, (now - ref_start).total_seconds())
    payment_to_vehicle_sec = max(0.0, (now - ref_start).total_seconds())
    
    godown_notified = order.godown_notified_at or ref_start
    ready_dispatch = order.ready_for_dispatch_at or now
    godown_to_transport_sec = max(0.0, (ready_dispatch - godown_notified).total_seconds())

    order.payment_to_driver_assignment_seconds = Decimal(str(round(payment_to_driver_sec, 2)))
    order.payment_to_vehicle_assignment_seconds = Decimal(str(round(payment_to_vehicle_sec, 2)))
    order.godown_to_transport_seconds = Decimal(str(round(godown_to_transport_sec, 2)))
    order.assignment_sla_status = "WITHIN_SLA" if payment_to_driver_sec <= TARGET_ASSIGNMENT_TIME_SECONDS else "EXCEEDED_SLA"
    order.assignment_delay_reason = None

    # Get or create employee record for assigned_by
    emp = db.query(Employee).filter(Employee.id == current_user.id).first()
    if not emp:
        dept = _get_or_create_transport_department(db)
        emp = Employee(
            id=current_user.id,
            employee_code=f"MK-EMP-{uuid.uuid4().hex[:4].upper()}",
            department_id=dept.id,
            role=current_user.role,
            location="Headquarters",
        )
        db.add(emp)
        db.flush()
    assigned_by_id = emp.id

    # Create TransportAssignment record
    assignment = TransportAssignment(
        order_id=order.id,
        vehicle_id=vehicle.id,
        driver_id=driver.id,
        assigned_by_id=assigned_by_id,
        assignment_time=now,
        payment_verified_at=order.payment_verified_at,
        assignment_duration_seconds=Decimal(str(round(payment_to_driver_sec, 2))),
        sla_status=order.assignment_sla_status,
        status="Assigned",
    )
    db.add(assignment)

    # Create or update Delivery record
    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    godown = db.query(Godown).first()
    if not godown:
        godown = Godown(name="Central Godown", location="Coimbatore", code=f"MK-GD-{uuid.uuid4().hex[:3].upper()}")
        db.add(godown)
        db.flush()
    godown_id = godown.id

    if not delivery:
        delivery = Delivery(
            order_id=order.id,
            type="Bulk Delivery" if weight >= 100 else "Home Delivery",
            source_godown_id=godown_id,
            destination=order.destination,
            quantity=f"{weight} kg",
            priority="High" if weight >= 50 else "Normal",
            status="Driver Assigned",
            assignment_sla_status=order.assignment_sla_status,
            vehicle_id=vehicle.id,
            driver_id=driver.id,
        )
        db.add(delivery)
    else:
        delivery.status = "Driver Assigned"
        delivery.assignment_sla_status = order.assignment_sla_status
        delivery.vehicle_id = vehicle.id
        delivery.driver_id = driver.id
        delivery.delay_reason = None

    # Update driver active workload
    driver.workload = (driver.workload or 0) + 1

    # Generate / Refresh Customer Delivery OTP
    raw_otp = "".join(random.choices(string.digits, k=4))
    otp_hash = get_password_hash(raw_otp)
    expires_at = datetime.utcnow() + timedelta(hours=24)
    otp_rec = db.query(DeliveryOTP).filter(DeliveryOTP.order_id == order.id).first()
    if not otp_rec:
        otp_rec = DeliveryOTP(
            order_id=order.id,
            otp_code=raw_otp,
            otp_hash=otp_hash,
            expires_at=expires_at,
            attempts=0,
            max_attempts=5,
        )
        db.add(otp_rec)
    else:
        otp_rec.otp_code = raw_otp
        otp_rec.otp_hash = otp_hash
        otp_rec.expires_at = expires_at
        otp_rec.attempts = 0

    # Record status history
    db.add(OrderStatusHistory(
        order_id=order.id,
        status="Driver Assigned",
        changed_by_id=current_user.id,
        notes=body.notes or f"Assigned to {vehicle.number} with driver {driver.user.name if driver.user else driver.driver_code}",
    ))

    # Audit log
    dept = _get_or_create_transport_department(db)
    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Transport Assigned",
        department_id=dept.id,
        entity_type="Order",
        entity_id=str(order.id),
        previous_value={"status": old_status},
        new_value={
            "status": "Driver Assigned",
            "vehicle_number": vehicle.number,
            "driver_name": driver.user.name if driver.user else driver.driver_code,
        },
        reason=body.notes,
    ))

    # Emit domain event
    driver_name = driver.user.name if driver.user else driver.driver_code
    emit_event(
        db=db,
        event_type=EVENT_TRANSPORT_ASSIGNED,
        aggregate_id=order.id,
        aggregate_type="ORDER",
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "driver_user_id": str(driver.id),
            "driver_name": driver_name,
            "vehicle_number": vehicle.number,
            "destination": order.delivery_address or order.destination,
        },
        performed_by=current_user.name,
    )

    db.commit()
    db.refresh(assignment)

    return TransportAssignmentResponse(
        id=assignment.id,
        order_id=order.id,
        order_code=order.order_code,
        vehicle_id=vehicle.id,
        vehicle_number=vehicle.number,
        vehicle_type=vehicle.type,
        driver_id=driver.id,
        driver_name=driver.user.name if driver.user else "Driver",
        assigned_by_id=assigned_by_id,
        assignment_time=assignment.assignment_time,
        status=assignment.status,
    )


# ── 6. Dispatch & Delivery Lifecycle ──────────────────────────────────────────

@router.post(
    "/orders/{order_id}/dispatch",
    response_model=TransportQueueItemResponse,
    summary="Transport: dispatch order into transit",
)
def dispatch_order(
    order_id: UUID,
    body: DispatchOrderRequest,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).with_for_update().filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.status not in ("Ready for Dispatch", "Vehicle Assigned", "Driver Assigned"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot dispatch order in '{order.status}' status.",
        )

    # Find assignment
    assignment = (
        db.query(TransportAssignment)
        .filter(TransportAssignment.order_id == order.id)
        .order_by(TransportAssignment.assignment_time.desc())
        .first()
    )

    if assignment:
        assignment.status = "Dispatched"
        if assignment.vehicle:
            assignment.vehicle.status = "On Route"
        if assignment.driver:
            assignment.driver.availability = "On Route"

    # Update delivery record
    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    if delivery:
        delivery.status = "On Route"

    old_status = order.status
    order.status = "Dispatched"

    db.add(OrderStatusHistory(
        order_id=order.id,
        status="Dispatched",
        changed_by_id=current_user.id,
        notes=body.notes or "Order dispatched from godown into transit.",
    ))

    dept = _get_or_create_transport_department(db)
    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Order Dispatched",
        department_id=dept.id,
        entity_type="Order",
        entity_id=str(order.id),
        previous_value={"status": old_status},
        new_value={"status": "Dispatched"},
        reason=body.notes,
    ))

    db.commit()
    db.refresh(order)
    return get_transport_queue_item(order_id, current_user, db)


@router.post(
    "/orders/{order_id}/out-for-delivery",
    response_model=TransportQueueItemResponse,
    summary="Transport: mark order as Out for Delivery with ETA",
)
def mark_out_for_delivery(
    order_id: UUID,
    body: OutForDeliveryRequest,
    current_user: User = Depends(require_transport_staff),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).with_for_update().filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.status not in ("Driver Assigned", "Dispatched"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot mark Out for Delivery from status '{order.status}'.",
        )

    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    if delivery and body.eta:
        delivery.eta = body.eta
        delivery.status = "On Route"

    old_status = order.status
    order.status = "Out for Delivery"

    db.add(OrderStatusHistory(
        order_id=order.id,
        status="Out for Delivery",
        changed_by_id=current_user.id,
        notes=body.notes or (f"Out for delivery. ETA: {body.eta}" if body.eta else "Out for delivery"),
    ))

    dept = _get_or_create_transport_department(db)
    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Order Out for Delivery",
        department_id=dept.id,
        entity_type="Order",
        entity_id=str(order.id),
        previous_value={"status": old_status},
        new_value={"status": "Out for Delivery", "eta": body.eta},
        reason=body.notes,
    ))

    db.commit()
    db.refresh(order)
    return get_transport_queue_item(order_id, current_user, db)


@router.post(
    "/orders/{order_id}/deliver",
    response_model=TransportQueueItemResponse,
    summary="Transport: complete delivery and release vehicle/driver",
)
def complete_delivery(
    order_id: UUID,
    body: DeliverOrderRequest,
    current_user: User = Depends(require_transport_staff),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).with_for_update().filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.status not in ("Dispatched", "Out for Delivery", "Driver Assigned"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete delivery for order in '{order.status}' status.",
        )

    # Release vehicle & driver
    assignment = (
        db.query(TransportAssignment)
        .filter(TransportAssignment.order_id == order.id)
        .order_by(TransportAssignment.assignment_time.desc())
        .first()
    )

    if assignment:
        assignment.status = "Completed"
        if assignment.vehicle:
            assignment.vehicle.status = "Available"
        if assignment.driver:
            assignment.driver.availability = "Available"
            assignment.driver.workload = (assignment.driver.workload or 0) + 1

    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    if delivery:
        delivery.status = "Delivered"

    old_status = order.status
    order.status = "Delivered"

    db.add(OrderStatusHistory(
        order_id=order.id,
        status="Delivered",
        changed_by_id=current_user.id,
        notes=body.notes or "Order successfully delivered to customer.",
    ))

    dept = _get_or_create_transport_department(db)
    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Order Delivered",
        department_id=dept.id,
        entity_type="Order",
        entity_id=str(order.id),
        previous_value={"status": old_status},
        new_value={"status": "Delivered"},
        reason=body.notes,
    ))

    db.commit()
    db.refresh(order)
    return get_transport_queue_item(order_id, current_user, db)


# ── 7. Delivery Tracking ──────────────────────────────────────────────────────

@router.get(
    "/tracking/{order_id}",
    response_model=DeliveryTrackingResponse,
    summary="Tracking: view real-time delivery tracking timeline",
)
def get_order_tracking(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # Customer permission check: customers can only track their own orders
    if current_user.role.upper() == "CUSTOMER" and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    weight, _ = calculate_order_cargo(order, db)
    packing = db.query(PackingRecord).filter(PackingRecord.order_id == order.id).first()
    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    assignment = (
        db.query(TransportAssignment)
        .filter(TransportAssignment.order_id == order.id)
        .order_by(TransportAssignment.assignment_time.desc())
        .first()
    )

    veh_resp = _build_vehicle_response(assignment.vehicle) if (assignment and assignment.vehicle) else None
    dri_resp = _build_driver_response(assignment.driver) if (assignment and assignment.driver) else None

    # Status history
    histories = (
        db.query(OrderStatusHistory)
        .filter(OrderStatusHistory.order_id == order.id)
        .order_by(OrderStatusHistory.timestamp.asc())
        .all()
    )
    history_items = [
        {
            "status": h.status,
            "timestamp": h.timestamp.isoformat() if h.timestamp else None,
            "notes": h.notes,
            "changed_by": h.changed_by.name if h.changed_by else "System",
        }
        for h in histories
    ]

    dispatched_entry = next((h for h in histories if h.status == "Dispatched"), None)
    delivered_entry = next((h for h in histories if h.status == "Delivered"), None)

    return DeliveryTrackingResponse(
        order_id=order.id,
        order_code=order.order_code,
        status=order.status,
        delivery_address=order.delivery_address or order.destination,
        cargo_weight=weight,
        package_count=packing.package_count if packing else 1,
        vehicle=veh_resp,
        driver=dri_resp,
        eta=delivery.eta if delivery else None,
        assignment_time=assignment.assignment_time if assignment else None,
        dispatched_at=dispatched_entry.timestamp if dispatched_entry else None,
        delivered_at=delivered_entry.timestamp if delivered_entry else None,
        status_history=history_items,
    )


# ── 8. Transport Activity & Audit Logs ────────────────────────────────────────

@router.get(
    "/logs",
    response_model=TransportAuditLogListResponse,
    summary="Transport: view chronological transport audit logs",
)
def list_transport_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    dept = _get_or_create_transport_department(db)
    q = db.query(AuditLog).filter(
        (AuditLog.department_id == dept.id)
        | (AuditLog.entity_type.in_(["Vehicle", "Driver", "TransportAssignment"]))
    )

    total = q.count()
    logs = q.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    items = [
        TransportAuditLogResponse(
            id=l.id,
            timestamp=l.timestamp,
            performed_by=l.performed_by,
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            details=l.new_value,
            reason=l.reason,
        )
        for l in logs
    ]

    return TransportAuditLogListResponse(items=items, total=total, skip=skip, limit=limit)


# ── 9. Transport SLA Dashboard & Automated Matching Triggers ─────────────────

@router.get(
    "/sla-dashboard",
    response_model=SLADashboardResponse,
    summary="Transport: view real-time 2-minute assignment SLA metrics and queue",
)
def get_transport_sla_dashboard(
    timeframe_hours: Optional[int] = Query(24, ge=1, le=720),
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    """
    Returns authoritative 2-minute Payment-to-Driver SLA analytics and live queue items.
    """
    metrics = calculate_operational_sla_metrics(db, timeframe_hours=timeframe_hours)

    # Fetch active transport queue items
    queue_orders = db.query(Order).filter(
        Order.status.in_(TRANSPORT_QUEUE_STATUSES)
    ).order_by(Order.created_at.desc()).limit(100).all()

    queue_items = []
    for o in queue_orders:
        weight, _ = calculate_order_cargo(o, db)
        packing = db.query(PackingRecord).filter(PackingRecord.order_id == o.id).first()
        assignment = (
            db.query(TransportAssignment)
            .filter(TransportAssignment.order_id == o.id)
            .order_by(TransportAssignment.assignment_time.desc())
            .first()
        )
        veh_resp = _build_vehicle_response(assignment.vehicle) if (assignment and assignment.vehicle) else None
        dri_resp = _build_driver_response(assignment.driver) if (assignment and assignment.driver) else None
        delivery_type = "Bulk Delivery" if (weight and weight >= 100) else "Home Delivery"
        sla_info = evaluate_order_sla_status(o)

        queue_items.append(
            TransportQueueItemResponse(
                order_id=o.id,
                order_code=o.order_code,
                customer_name=o.customer.name if o.customer else "Customer",
                customer_phone=o.customer.phone if o.customer else None,
                destination=o.destination,
                cargo_weight=weight,
                package_count=packing.package_count if packing else 1,
                status=o.status,
                priority="High" if (weight and weight >= 50) else "Normal",
                delivery_type=delivery_type,
                created_at=o.created_at,
                vehicle=veh_resp,
                driver=dri_resp,
                sla_target_seconds=sla_info["target_seconds"],
                elapsed_seconds=sla_info["elapsed_seconds"],
                sla_status=sla_info["sla_status"],
                delay_reason=sla_info["delay_reason"],
                payment_verified_at=sla_info["payment_verified_at"],
                driver_assigned_at=sla_info["driver_assigned_at"],
                godown_name=o.assigned_godown.name if o.assigned_godown else None,
            )
        )

    return SLADashboardResponse(
        target_assignment_time_seconds=metrics["target_assignment_time_seconds"],
        total_orders=metrics["total_orders"],
        assigned_orders_count=metrics["assigned_orders_count"],
        within_sla_count=metrics["within_sla_count"],
        exceeded_sla_count=metrics["exceeded_sla_count"],
        sla_compliance_rate_pct=metrics["sla_compliance_rate_pct"],
        average_assignment_seconds=metrics["average_assignment_seconds"],
        median_assignment_seconds=metrics["median_assignment_seconds"],
        fastest_assignment_seconds=metrics["fastest_assignment_seconds"],
        slowest_assignment_seconds=metrics["slowest_assignment_seconds"],
        awaiting_vehicle_count=metrics["awaiting_vehicle_count"],
        awaiting_driver_count=metrics["awaiting_driver_count"],
        average_godown_processing_seconds=metrics["average_godown_processing_seconds"],
        items=queue_items,
        generated_at=metrics["generated_at"],
    )


@router.post(
    "/orders/{order_id}/trigger-sla-assignment",
    summary="Transport: trigger real-time SLA matching and assignment for an order",
)
def trigger_order_sla_assignment(
    order_id: UUID,
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    """
    Executes automated vehicle & driver matching for an order ready for dispatch.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    res = process_auto_assignment_for_order(db, order, current_user)
    return res


@router.post(
    "/retry-unassigned",
    summary="Transport: scan and retry assignment for all awaiting/ready orders",
)
def retry_unassigned_orders(
    current_user: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    """
    Scans orders awaiting transport assignment and matches any newly available vehicles/drivers.
    """
    unassigned_orders = db.query(Order).filter(
        Order.status.in_(("Ready for Dispatch", "Awaiting Assignment")),
        Order.driver_assigned_at.is_(None)
    ).all()

    results = []
    for ord_item in unassigned_orders:
        res = process_auto_assignment_for_order(db, ord_item, current_user)
        results.append(res)

    assigned_now = sum(1 for r in results if r.get("success"))
    return {
        "processed_count": len(unassigned_orders),
        "assigned_count": assigned_now,
        "results": results,
    }
