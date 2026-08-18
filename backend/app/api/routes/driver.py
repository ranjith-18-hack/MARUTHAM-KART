"""
MARUTHAM KART — Driver Companion & Delivery Execution API.
Prefix: /api/v1/driver
"""
from __future__ import annotations

import random
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_database_session, require_driver_or_admin
from app.core.events import (
    emit_event,
    EVENT_DELIVERY_STARTED,
    EVENT_DELIVERY_COMPLETED,
)
from app.core.security import verify_password
from app.models.models import (
    AuditLog,
    Delivery,
    DeliveryOTP,
    Driver,
    Invoice,
    Order,
    OrderStatusHistory,
    Payment,
    PaymentAuditLog,
    User,
    Vehicle,
)
from app.schemas.driver import (
    DriverDashboardResponse,
    DriverDeliveryResponse,
    DriverLocationUpdateRequest,
    DriverOTPVerifyRequest,
    DriverTripActionResponse,
)

router = APIRouter(prefix="/driver", tags=["Driver Companion"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_driver_record(user: User, db: Session) -> Driver:
    drv = db.query(Driver).filter(Driver.id == user.id).first()
    if not drv:
        drv_code = f"MK-DRI-{random.randint(100, 999)}"
        drv = Driver(
            id=user.id,
            driver_code=drv_code,
            type="Home Delivery Driver",
            availability="Available",
            workload=0,
        )
        db.add(drv)
        db.commit()
        db.refresh(drv)
    return drv


# ── Driver Dashboard & Deliveries ─────────────────────────────────────────────

@router.get(
    "/dashboard",
    response_model=DriverDashboardResponse,
    summary="Driver: active trip, vehicle status and assigned deliveries",
)
def get_driver_dashboard(
    current_user: User = Depends(require_driver_or_admin),
    db: Session = Depends(get_database_session),
):
    drv = _get_driver_record(current_user, db)

    deliveries_db = db.query(Delivery).filter(
        Delivery.driver_id == drv.id,
        Delivery.status.in_(["Driver Assigned", "On Route", "Dispatched", "Awaiting Assignment"]),
    ).order_by(Delivery.created_at.desc()).all()

    completed_count = db.query(Delivery).filter(
        Delivery.driver_id == drv.id,
        Delivery.status == "Delivered",
    ).count()

    total_count = len(deliveries_db) + completed_count

    pending_deliveries = [
        DriverDeliveryResponse(
            id=d.id,
            order_id=d.order_id,
            order_code=d.order.order_code if d.order else "ORD-MK",
            buyer_type=d.order.buyer_type if d.order else "Customer",
            destination=d.destination,
            delivery_address=d.order.delivery_address if d.order else d.destination,
            customer_name=d.order.customer.name if d.order and d.order.customer else "Customer",
            customer_phone=d.order.customer.phone if d.order and d.order.customer else None,
            quantity=d.quantity,
            priority=d.priority,
            status=d.status,
            eta=d.eta,
            created_at=d.created_at,
        )
        for d in deliveries_db
    ]

    veh_num = drv.vehicle.number if drv.vehicle else None
    veh_type = drv.vehicle.type if drv.vehicle else None

    return DriverDashboardResponse(
        driver_id=drv.id,
        driver_code=drv.driver_code,
        name=current_user.name,
        phone=current_user.phone,
        type=drv.type,
        availability=drv.availability,
        workload=drv.workload or len(deliveries_db),
        assigned_vehicle_number=veh_num,
        assigned_vehicle_type=veh_type,
        total_deliveries_today=total_count,
        completed_deliveries_today=completed_count,
        pending_deliveries=pending_deliveries,
    )


@router.get(
    "/deliveries",
    response_model=List[DriverDeliveryResponse],
    summary="Driver: list all assigned deliveries",
)
def list_driver_deliveries(
    current_user: User = Depends(require_driver_or_admin),
    db: Session = Depends(get_database_session),
):
    drv = _get_driver_record(current_user, db)
    deliveries_db = db.query(Delivery).filter(Delivery.driver_id == drv.id).order_by(Delivery.created_at.desc()).all()

    return [
        DriverDeliveryResponse(
            id=d.id,
            order_id=d.order_id,
            order_code=d.order.order_code if d.order else "ORD-MK",
            buyer_type=d.order.buyer_type if d.order else "Customer",
            destination=d.destination,
            delivery_address=d.order.delivery_address if d.order else d.destination,
            customer_name=d.order.customer.name if d.order and d.order.customer else "Customer",
            customer_phone=d.order.customer.phone if d.order and d.order.customer else None,
            quantity=d.quantity,
            priority=d.priority,
            status=d.status,
            eta=d.eta,
            created_at=d.created_at,
        )
        for d in deliveries_db
    ]


@router.post(
    "/deliveries/{delivery_id}/start",
    response_model=DriverTripActionResponse,
    summary="Driver: start trip towards drop-off destination",
)
def start_delivery_trip(
    delivery_id: UUID,
    current_user: User = Depends(require_driver_or_admin),
    db: Session = Depends(get_database_session),
):
    drv = _get_driver_record(current_user, db)
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id, Delivery.driver_id == drv.id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found.")

    delivery.status = "On Route"
    delivery.eta = "15-30 mins"
    drv.availability = "On Route"

    # Update order status to Out for Delivery
    order = db.query(Order).filter(Order.id == delivery.order_id).first()
    if order:
        order.status = "Out for Delivery"
        db.add(OrderStatusHistory(
            order_id=order.id,
            status="Out for Delivery",
            changed_by_id=current_user.id,
            notes=f"Driver {current_user.name} started delivery trip to customer location",
        ))
        emit_event(
            db=db,
            event_type=EVENT_DELIVERY_STARTED,
            aggregate_id=order.id,
            aggregate_type="ORDER",
            payload={
                "order_id": str(order.id),
                "order_code": order.order_code,
                "driver_name": current_user.name,
                "eta": "15-30 mins",
            },
            performed_by=current_user.name,
        )

    db.commit()
    return DriverTripActionResponse(
        delivery_id=delivery.id,
        order_id=delivery.order_id,
        status="On Route",
        message="Trip started. Order marked Out for Delivery.",
    )


@router.post(
    "/deliveries/{delivery_id}/location",
    response_model=DriverTripActionResponse,
    summary="Driver: transmit live GPS coordinates telemetry",
)
def update_delivery_location(
    delivery_id: UUID,
    _body: DriverLocationUpdateRequest,
    current_user: User = Depends(require_driver_or_admin),
    db: Session = Depends(get_database_session),
):
    drv = _get_driver_record(current_user, db)
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id, Delivery.driver_id == drv.id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found.")

    return DriverTripActionResponse(
        delivery_id=delivery.id,
        order_id=delivery.order_id,
        status=delivery.status,
        message="Telemetry received.",
    )


@router.post(
    "/deliveries/{delivery_id}/verify-otp",
    response_model=DriverTripActionResponse,
    summary="Driver: verify Customer OTP and confirm delivery",
)
def verify_delivery_otp(
    delivery_id: UUID,
    body: DriverOTPVerifyRequest,
    current_user: User = Depends(require_driver_or_admin),
    db: Session = Depends(get_database_session),
):
    drv = _get_driver_record(current_user, db)
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id, Delivery.driver_id == drv.id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery record not found.")

    # Check OTP
    otp_record = db.query(DeliveryOTP).filter(DeliveryOTP.order_id == delivery.order_id).first()
    if otp_record:
        if otp_record.attempts >= otp_record.max_attempts:
            raise HTTPException(status_code=400, detail="Maximum OTP verification attempts exceeded.")
        if otp_record.expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP has expired.")
        if not verify_password(body.otp, otp_record.otp_hash):
            otp_record.attempts += 1
            db.commit()
            raise HTTPException(status_code=400, detail="Invalid OTP entered. Please ask customer for the correct 4-digit code.")

    # Mark delivery Delivered
    delivery.status = "Delivered"

    # Free Driver and decrement active workload
    drv.availability = "Available"
    drv.workload = max(0, (drv.workload or 1) - 1)

    # Free Vehicle if assigned
    if delivery.vehicle_id:
        veh = db.query(Vehicle).filter(Vehicle.id == delivery.vehicle_id).first()
        if veh:
            veh.status = "Available"

    # Mark Order Delivered and settle payment if COD
    order = db.query(Order).filter(Order.id == delivery.order_id).first()
    if order:
        order.status = "Delivered"

        # If Cash on Delivery, record cash settlement
        if order.payment_method == "COD" or order.payment_status in ("PENDING", "COD_PENDING"):
            order.payment_status = "PAID"
            payment = db.query(Payment).filter(Payment.order_id == order.id).first()
            if not payment:
                payment = Payment(
                    order_id=order.id,
                    customer_id=order.customer_id,
                    gateway="cod_internal",
                    payment_method="COD",
                    amount=order.total_amount,
                    status="CAPTURED",
                    verified_at=datetime.utcnow(),
                )
                db.add(payment)
            else:
                payment.status = "CAPTURED"
                payment.verified_at = datetime.utcnow()

            db.add(PaymentAuditLog(
                payment_id=payment.id if payment else None,
                order_id=order.id,
                event_type="COD_CASH_COLLECTED",
                payload={"amount": str(order.total_amount), "collected_by": current_user.name},
                performed_by=current_user.name,
            ))

        # Generate / Update Invoice
        inv = db.query(Invoice).filter(Invoice.order_id == order.id).first()
        if not inv:
            inv = Invoice(
                order_id=order.id,
                amount=order.total_amount,
                status="Paid",
                date=datetime.utcnow(),
            )
            db.add(inv)
        else:
            inv.status = "Paid"

        # Record Status History
        db.add(OrderStatusHistory(
            order_id=order.id,
            status="Delivered",
            changed_by_id=current_user.id,
            notes=f"Order delivered successfully by {current_user.name} via OTP verification",
        ))

        # Audit Log
        db.add(AuditLog(
            user_id=current_user.id,
            performed_by=current_user.name,
            action="Order Delivered",
            entity_type="Order",
            entity_id=str(order.id),
            new_value={"status": "Delivered", "delivered_by": current_user.name},
        ))

        # Emit domain event
        emit_event(
            db=db,
            event_type=EVENT_DELIVERY_COMPLETED,
            aggregate_id=order.id,
            aggregate_type="ORDER",
            payload={
                "order_id": str(order.id),
                "order_code": order.order_code,
                "amount": str(order.total_amount),
                "delivered_by": current_user.name,
            },
            performed_by=current_user.name,
        )

    db.commit()

    return DriverTripActionResponse(
        delivery_id=delivery.id,
        order_id=delivery.order_id,
        status="Delivered",
        message="Delivery confirmed and successfully completed!",
    )
