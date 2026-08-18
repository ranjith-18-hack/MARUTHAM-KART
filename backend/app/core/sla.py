"""
MARUTHAM KART — 2-Minute Payment-to-Driver Assignment SLA Core Engine

Operational Target: TARGET_ASSIGNMENT_TIME_SECONDS = 120 (2 minutes)
Measures and tracks:
- payment_verified_at
- order_confirmed_at
- godown_notified_at
- picking_started_at
- packing_completed_at
- ready_for_dispatch_at
- transport_queued_at
- vehicle_assigned_at
- driver_assigned_at
- payment_to_driver_assignment_seconds
- SLA compliance status: WITHIN_SLA (<120s), APPROACHING_SLA (90-119s), EXCEEDED_SLA (>=120s)
"""
from __future__ import annotations
import random
import string
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict, Any
from uuid import UUID
import uuid
import statistics

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import (
    Order, TransportAssignment, Delivery, DeliveryOTP, Vehicle, Driver,
    User, Employee, Department, AuditLog, OrderStatusHistory, Godown
)
from app.core.security import get_password_hash
from app.core.events import (
    emit_event,
    EVENT_TRANSPORT_ASSIGNED,
    EVENT_ORDER_READY_FOR_DISPATCH,
    EVENT_STATUS_TRANSITION
)
from app.core.logistics import (
    auto_allocate_transport_for_order,
    calculate_order_cargo,
)

# ── SLA Threshold Constants ───────────────────────────────────────────────────
TARGET_ASSIGNMENT_TIME_SECONDS = 120.0       # 2 minutes operational target
APPROACHING_SLA_THRESHOLD_SECONDS = 90.0     # 90-119 seconds warning window

SLA_STATUS_WITHIN = "WITHIN_SLA"
SLA_STATUS_APPROACHING = "APPROACHING_SLA"
SLA_STATUS_EXCEEDED = "EXCEEDED_SLA"
SLA_STATUS_PENDING = "PENDING"

DELAY_NO_ELIGIBLE_VEHICLE = "NO_ELIGIBLE_VEHICLE"
DELAY_NO_AVAILABLE_DRIVER = "NO_AVAILABLE_DRIVER"
DELAY_INVENTORY_SHORTAGE = "INVENTORY_SHORTAGE"
DELAY_DRIVER_REASSIGNMENT = "DRIVER_REASSIGNMENT_REQUIRED"
DELAY_VEHICLE_REASSIGNMENT = "VEHICLE_REASSIGNMENT_REQUIRED"

EVENT_NO_ELIGIBLE_VEHICLE = "NO_ELIGIBLE_VEHICLE"
EVENT_NO_AVAILABLE_DRIVER = "NO_AVAILABLE_DRIVER"
EVENT_DRIVER_REASSIGNMENT_REQUIRED = "DRIVER_REASSIGNMENT_REQUIRED"
EVENT_VEHICLE_REASSIGNMENT_REQUIRED = "VEHICLE_REASSIGNMENT_REQUIRED"


def evaluate_order_sla_status(
    order: Order,
    current_time: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Computes real-time SLA metrics for an order based on authoritative database timestamps.
    """
    now = current_time or datetime.utcnow()
    ref_start = order.payment_verified_at or order.order_confirmed_at or order.created_at

    if order.driver_assigned_at and order.payment_to_driver_assignment_seconds:
        elapsed_seconds = float(order.payment_to_driver_assignment_seconds)
        is_assigned = True
    elif order.driver_assigned_at and ref_start:
        elapsed_seconds = max(0.0, (order.driver_assigned_at - ref_start).total_seconds())
        is_assigned = True
    elif ref_start:
        elapsed_seconds = max(0.0, (now - ref_start).total_seconds())
        is_assigned = False
    else:
        elapsed_seconds = 0.0
        is_assigned = False

    if is_assigned:
        sla_status = SLA_STATUS_WITHIN if elapsed_seconds <= TARGET_ASSIGNMENT_TIME_SECONDS else SLA_STATUS_EXCEEDED
    else:
        if elapsed_seconds >= TARGET_ASSIGNMENT_TIME_SECONDS:
            sla_status = SLA_STATUS_EXCEEDED
        elif elapsed_seconds >= APPROACHING_SLA_THRESHOLD_SECONDS:
            sla_status = SLA_STATUS_APPROACHING
        else:
            sla_status = SLA_STATUS_WITHIN

    return {
        "order_id": order.id,
        "order_code": order.order_code,
        "is_assigned": is_assigned,
        "elapsed_seconds": round(elapsed_seconds, 1),
        "target_seconds": TARGET_ASSIGNMENT_TIME_SECONDS,
        "sla_status": sla_status,
        "delay_reason": order.assignment_delay_reason,
        "payment_verified_at": order.payment_verified_at,
        "driver_assigned_at": order.driver_assigned_at,
        "vehicle_assigned_at": order.vehicle_assigned_at,
    }


def process_auto_assignment_for_order(
    db: Session,
    order: Order,
    assigned_by_user: Optional[User] = None,
) -> Dict[str, Any]:
    """
    Executes automated vehicle & driver matching for an order ready for dispatch.
    Enforces the 2-minute SLA without falsifying data:
    - If suitable resources exist: creates assignment, calculates SLA duration, generates 4-digit OTP.
    - If NO eligible vehicle: marks NO_ELIGIBLE_VEHICLE, notifies Transport/Admin, keeps order ready for retry.
    - If NO available driver: marks NO_AVAILABLE_DRIVER, notifies Transport/Admin, keeps order ready for retry.
    """
    now = datetime.utcnow()

    # Ensure transport queue timestamp is recorded
    if not order.transport_queued_at:
        order.transport_queued_at = now

    weight, volume = calculate_order_cargo(order, db)
    allocation = auto_allocate_transport_for_order(db, order)

    vehicle: Optional[Vehicle] = allocation.get("vehicle")
    driver: Optional[Driver] = allocation.get("driver")

    # 1. No suitable vehicle
    if not vehicle or float(vehicle.max_weight) < float(weight) or vehicle.status != "Available":
        order.status = "Awaiting Assignment"
        order.assignment_delay_reason = DELAY_NO_ELIGIBLE_VEHICLE
        order.assignment_sla_status = SLA_STATUS_EXCEEDED if (now - (order.payment_verified_at or now)).total_seconds() >= TARGET_ASSIGNMENT_TIME_SECONDS else SLA_STATUS_APPROACHING

        # Update or create Delivery record
        delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
        if delivery:
            delivery.status = "Awaiting Assignment"
            delivery.delay_reason = DELAY_NO_ELIGIBLE_VEHICLE
            delivery.assignment_sla_status = order.assignment_sla_status

        emit_event(
            db=db,
            event_type=EVENT_NO_ELIGIBLE_VEHICLE,
            aggregate_id=order.id,
            aggregate_type="Order",
            payload={
                "order_code": order.order_code,
                "weight_kg": float(weight),
                "reason": allocation.get("reason", "No eligible vehicle with sufficient capacity available."),
            },
            performed_by="Transport SLA Orchestrator",
        )
        db.commit()
        return {
            "success": False,
            "reason": DELAY_NO_ELIGIBLE_VEHICLE,
            "message": f"Order {order.order_code} requires {weight} kg capacity. No eligible vehicle available.",
            "allocation": allocation,
        }

    # 2. No available driver
    if not driver or driver.availability != "Available":
        order.status = "Awaiting Assignment"
        order.assignment_delay_reason = DELAY_NO_AVAILABLE_DRIVER
        order.assignment_sla_status = SLA_STATUS_EXCEEDED if (now - (order.payment_verified_at or now)).total_seconds() >= TARGET_ASSIGNMENT_TIME_SECONDS else SLA_STATUS_APPROACHING

        delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
        if delivery:
            delivery.status = "Awaiting Assignment"
            delivery.delay_reason = DELAY_NO_AVAILABLE_DRIVER
            delivery.assignment_sla_status = order.assignment_sla_status

        emit_event(
            db=db,
            event_type=EVENT_NO_AVAILABLE_DRIVER,
            aggregate_id=order.id,
            aggregate_type="Order",
            payload={
                "order_code": order.order_code,
                "vehicle_number": vehicle.number,
                "reason": allocation.get("reason", "No available delivery driver in service area."),
            },
            performed_by="Transport SLA Orchestrator",
        )
        db.commit()
        return {
            "success": False,
            "reason": DELAY_NO_AVAILABLE_DRIVER,
            "message": f"Vehicle {vehicle.number} is ready, but no available driver could be allocated.",
            "allocation": allocation,
        }

    # 3. Both Vehicle & Driver Found — Perform Real Database Assignment
    vehicle.status = "Assigned"
    driver.availability = "Assigned"
    driver.workload = (driver.workload or 0) + 1

    order.vehicle_assigned_at = now
    order.driver_assigned_at = now
    order.status = "Driver Assigned"
    order.assignment_delay_reason = None

    # Calculate authoritative SLA durations
    ref_start = order.payment_verified_at or order.order_confirmed_at or order.created_at or now
    payment_to_driver_sec = max(0.0, (order.driver_assigned_at - ref_start).total_seconds())
    payment_to_vehicle_sec = max(0.0, (order.vehicle_assigned_at - ref_start).total_seconds())
    
    godown_notified = order.godown_notified_at or ref_start
    ready_dispatch = order.ready_for_dispatch_at or now
    godown_to_transport_sec = max(0.0, (ready_dispatch - godown_notified).total_seconds())

    order.payment_to_driver_assignment_seconds = Decimal(str(round(payment_to_driver_sec, 2)))
    order.payment_to_vehicle_assignment_seconds = Decimal(str(round(payment_to_vehicle_sec, 2)))
    order.godown_to_transport_seconds = Decimal(str(round(godown_to_transport_sec, 2)))

    order.assignment_sla_status = SLA_STATUS_WITHIN if payment_to_driver_sec <= TARGET_ASSIGNMENT_TIME_SECONDS else SLA_STATUS_EXCEEDED

    # Get / Create Employee Record for audit
    emp_user = assigned_by_user
    if not emp_user:
        emp_user = db.query(User).filter(User.role.in_(("TRANSPORT_MANAGER", "ADMIN", "OFFICE_STAFF"))).first()
    
    emp_id = emp_user.id if emp_user else driver.user.id if driver.user else vehicle.id
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        dept = db.query(Department).first()
        if not dept:
            dept = Department(
                name="TRANSPORT",
                code="MK-TRN",
                description="Transport & Logistics Department",
            )
            db.add(dept)
            db.flush()
        emp = Employee(
            id=emp_id,
            employee_code=f"MK-SYS-{uuid.uuid4().hex[:4].upper()}",
            department_id=dept.id,
            role="SYSTEM",
            location="Headquarters",
        )
        db.add(emp)
        db.flush()

    # Create TransportAssignment
    assignment = TransportAssignment(
        order_id=order.id,
        vehicle_id=vehicle.id,
        driver_id=driver.id,
        assigned_by_id=emp.id,
        assignment_time=now,
        payment_verified_at=order.payment_verified_at,
        assignment_duration_seconds=Decimal(str(round(payment_to_driver_sec, 2))),
        sla_status=order.assignment_sla_status,
        status="Assigned",
    )
    db.add(assignment)

    # Create or update Delivery
    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    godown = order.assigned_godown or db.query(Godown).first()
    if not godown:
        godown = Godown(name="Central Godown", location="Madurai", godown_code=f"MK-GD-{uuid.uuid4().hex[:3].upper()}")
        db.add(godown)
        db.flush()

    if not delivery:
        delivery = Delivery(
            order_id=order.id,
            type="Bulk Delivery" if weight >= 100 else "Home Delivery",
            source_godown_id=godown.id,
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

    # Generate 4-digit Doorstep Delivery Handshake OTP
    raw_otp = "".join(random.choices(string.digits, k=4))
    otp_hash = get_password_hash(raw_otp)
    expires_at = now + timedelta(hours=24)

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

    # Add status history
    db.add(OrderStatusHistory(
        order_id=order.id,
        status="Driver Assigned",
        changed_by_id=emp_user.id if emp_user else order.customer_id,
        notes=f"Auto-assigned to {vehicle.type} ({vehicle.number}) with driver {driver.user.name if driver.user else driver.driver_code} in {round(payment_to_driver_sec, 1)}s (SLA: {order.assignment_sla_status})",
    ))

    # Emit Domain Event
    driver_name = driver.user.name if driver.user else driver.driver_code
    emit_event(
        db=db,
        event_type=EVENT_TRANSPORT_ASSIGNED,
        aggregate_id=order.id,
        aggregate_type="Order",
        payload={
            "order_code": order.order_code,
            "vehicle_id": str(vehicle.id),
            "vehicle_code": vehicle.vehicle_code,
            "vehicle_number": vehicle.number,
            "vehicle_type": vehicle.type,
            "vehicle_capacity": vehicle.capacity,
            "driver_id": str(driver.id),
            "driver_code": driver.driver_code,
            "driver_name": driver_name,
            "assignment_duration_seconds": round(payment_to_driver_sec, 1),
            "sla_status": order.assignment_sla_status,
        },
        performed_by="Transport SLA Orchestrator",
    )

    db.commit()
    db.refresh(order)
    db.refresh(assignment)

    return {
        "success": True,
        "order_id": order.id,
        "order_code": order.order_code,
        "vehicle_code": vehicle.vehicle_code,
        "vehicle_number": vehicle.number,
        "driver_name": driver_name,
        "driver_code": driver.driver_code,
        "duration_seconds": round(payment_to_driver_sec, 1),
        "sla_status": order.assignment_sla_status,
        "delivery_otp": raw_otp,
    }


def calculate_operational_sla_metrics(
    db: Session,
    timeframe_hours: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Aggregates authoritative operational SLA metrics from Supabase PostgreSQL database timestamps.
    """
    now = datetime.utcnow()
    query = db.query(Order)
    if timeframe_hours:
        since = now - timedelta(hours=timeframe_hours)
        query = query.filter(Order.created_at >= since)

    all_orders = query.all()
    total_orders = len(all_orders)

    # Orders with driver assignments
    assigned_orders = [o for o in all_orders if o.driver_assigned_at and o.payment_to_driver_assignment_seconds is not None]
    assigned_count = len(assigned_orders)

    durations: List[float] = [float(o.payment_to_driver_assignment_seconds) for o in assigned_orders]

    within_sla_count = sum(1 for d in durations if d <= TARGET_ASSIGNMENT_TIME_SECONDS)
    exceeded_sla_count = sum(1 for d in durations if d > TARGET_ASSIGNMENT_TIME_SECONDS)
    compliance_rate = round((within_sla_count / assigned_count * 100), 1) if assigned_count > 0 else 100.0

    avg_assignment = round(statistics.mean(durations), 1) if durations else 0.0
    median_assignment = round(statistics.median(durations), 1) if durations else 0.0
    fastest_assignment = round(min(durations), 1) if durations else 0.0
    slowest_assignment = round(max(durations), 1) if durations else 0.0

    # Bottleneck and delay breakdown
    awaiting_vehicle_count = sum(1 for o in all_orders if o.assignment_delay_reason == DELAY_NO_ELIGIBLE_VEHICLE or o.status == "Awaiting Assignment" and not o.driver_assigned_at)
    awaiting_driver_count = sum(1 for o in all_orders if o.assignment_delay_reason == DELAY_NO_AVAILABLE_DRIVER)
    
    godown_durations = [float(o.godown_to_transport_seconds) for o in all_orders if o.godown_to_transport_seconds is not None]
    avg_godown_processing = round(statistics.mean(godown_durations), 1) if godown_durations else 0.0

    return {
        "target_assignment_time_seconds": TARGET_ASSIGNMENT_TIME_SECONDS,
        "total_orders": total_orders,
        "assigned_orders_count": assigned_count,
        "within_sla_count": within_sla_count,
        "exceeded_sla_count": exceeded_sla_count,
        "sla_compliance_rate_pct": compliance_rate,
        "average_assignment_seconds": avg_assignment,
        "median_assignment_seconds": median_assignment,
        "fastest_assignment_seconds": fastest_assignment,
        "slowest_assignment_seconds": slowest_assignment,
        "awaiting_vehicle_count": awaiting_vehicle_count,
        "awaiting_driver_count": awaiting_driver_count,
        "average_godown_processing_seconds": avg_godown_processing,
        "generated_at": now.isoformat(),
    }


def handle_driver_unavailability(
    db: Session,
    driver_id: UUID,
    reason: str = "Driver became unavailable",
) -> List[UUID]:
    """
    When a driver becomes unavailable/offline, resets any uncompleted deliveries
    to Awaiting Assignment with reason DRIVER_REASSIGNMENT_REQUIRED and triggers auto-reassignment.
    """
    active_deliveries = db.query(Delivery).filter(
        Delivery.driver_id == driver_id,
        Delivery.status.in_(("Driver Assigned", "Awaiting Assignment"))
    ).all()

    reassigned_order_ids = []
    for deliv in active_deliveries:
        order = deliv.order
        if order and order.status not in ("Delivered", "Cancelled"):
            order.status = "Awaiting Assignment"
            order.assignment_delay_reason = DELAY_DRIVER_REASSIGNMENT
            deliv.status = "Awaiting Assignment"
            deliv.driver_id = None
            deliv.delay_reason = DELAY_DRIVER_REASSIGNMENT

            emit_event(
                db=db,
                event_type=EVENT_DRIVER_REASSIGNMENT_REQUIRED,
                aggregate_id=order.id,
                aggregate_type="Order",
                payload={"order_code": order.order_code, "reason": reason},
                performed_by="Transport SLA Orchestrator",
            )
            reassigned_order_ids.append(order.id)

    db.commit()

    # Retry assignment for affected orders
    for o_id in reassigned_order_ids:
        ord_obj = db.query(Order).filter(Order.id == o_id).first()
        if ord_obj:
            process_auto_assignment_for_order(db, ord_obj)

    return reassigned_order_ids


def handle_vehicle_unavailability(
    db: Session,
    vehicle_id: UUID,
    reason: str = "Vehicle entered maintenance or became unavailable",
) -> List[UUID]:
    """
    When a vehicle enters maintenance or is disabled, resets any uncompleted deliveries
    to Awaiting Assignment with reason VEHICLE_REASSIGNMENT_REQUIRED and triggers auto-reassignment.
    """
    active_deliveries = db.query(Delivery).filter(
        Delivery.vehicle_id == vehicle_id,
        Delivery.status.in_(("Driver Assigned", "Awaiting Assignment"))
    ).all()

    reassigned_order_ids = []
    for deliv in active_deliveries:
        order = deliv.order
        if order and order.status not in ("Delivered", "Cancelled"):
            order.status = "Awaiting Assignment"
            order.assignment_delay_reason = DELAY_VEHICLE_REASSIGNMENT
            deliv.status = "Awaiting Assignment"
            deliv.vehicle_id = None
            deliv.delay_reason = DELAY_VEHICLE_REASSIGNMENT

            emit_event(
                db=db,
                event_type=EVENT_VEHICLE_REASSIGNMENT_REQUIRED,
                aggregate_id=order.id,
                aggregate_type="Order",
                payload={"order_code": order.order_code, "reason": reason},
                performed_by="Transport SLA Orchestrator",
            )
            reassigned_order_ids.append(order.id)

    db.commit()

    # Retry assignment for affected orders
    for o_id in reassigned_order_ids:
        ord_obj = db.query(Order).filter(Order.id == o_id).first()
        if ord_obj:
            process_auto_assignment_for_order(db, ord_obj)

    return reassigned_order_ids
