"""
MARUTHAM KART — Domain Events & Event-Driven Automation Bus

Handles:
- Production-grade decoupled event publishing
- PostgreSQL persistence in `domain_events`
- Automatic role-based notification dispatching
- Server-Sent Events (SSE) streaming subscriber management
"""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List, AsyncGenerator
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.models import (
    DomainEvent,
    Notification,
    User,
    GodownUserAssignment,
    Order,
)

logger = logging.getLogger("maruthamkart.events")

# ── Event Types ───────────────────────────────────────────────────────────────
EVENT_ORDER_CONFIRMED = "ORDER_CONFIRMED"
EVENT_PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"
EVENT_GODOWN_ORDER_CREATED = "GODOWN_ORDER_CREATED"
EVENT_PICKING_STARTED = "PICKING_STARTED"
EVENT_INVENTORY_SHORTAGE_DETECTED = "INVENTORY_SHORTAGE_DETECTED"
EVENT_PACKING_COMPLETED = "PACKING_COMPLETED"
EVENT_ORDER_READY_FOR_DISPATCH = "ORDER_READY_FOR_DISPATCH"
EVENT_VEHICLE_RECOMMENDED = "VEHICLE_RECOMMENDED"
EVENT_TRANSPORT_ASSIGNED = "TRANSPORT_ASSIGNED"
EVENT_DELIVERY_STARTED = "DELIVERY_STARTED"
EVENT_DELIVERY_COMPLETED = "DELIVERY_COMPLETED"
EVENT_PAYMENT_FAILED = "PAYMENT_FAILED"
EVENT_ORDER_CANCELLED = "ORDER_CANCELLED"
EVENT_STATUS_TRANSITION = "STATUS_TRANSITION"
EVENT_NO_ELIGIBLE_VEHICLE = "NO_ELIGIBLE_VEHICLE"
EVENT_NO_AVAILABLE_DRIVER = "NO_AVAILABLE_DRIVER"
EVENT_DRIVER_REASSIGNMENT_REQUIRED = "DRIVER_REASSIGNMENT_REQUIRED"
EVENT_VEHICLE_REASSIGNMENT_REQUIRED = "VEHICLE_REASSIGNMENT_REQUIRED"


# In-memory SSE subscribers: user_id -> List[asyncio.Queue]
_subscribers: Dict[str, List[asyncio.Queue]] = {}


def register_subscriber(user_id: str) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    if user_id not in _subscribers:
        _subscribers[user_id] = []
    _subscribers[user_id].append(queue)
    return queue


def remove_subscriber(user_id: str, queue: asyncio.Queue):
    if user_id in _subscribers and queue in _subscribers[user_id]:
        _subscribers[user_id].remove(queue)
        if not _subscribers[user_id]:
            del _subscribers[user_id]


async def broadcast_to_user(user_id: str, event_data: dict):
    queues = _subscribers.get(user_id, [])
    for q in list(queues):
        try:
            q.put_nowait(event_data)
        except Exception:
            pass


def _dispatch_notifications_for_event(
    db: Session,
    event_type: str,
    aggregate_id: UUID,
    payload: Dict[str, Any],
):
    """
    Creates relevant in-app notifications for users/managers based on the domain event.
    """
    order = db.query(Order).filter(Order.id == aggregate_id).first() if payload.get("order_id") or aggregate_id else None
    customer_id = order.customer_id if order else payload.get("customer_id")
    order_code = order.order_code if order else payload.get("order_code", "ORD-MK")

    # 1. ORDER_CONFIRMED / PAYMENT_CONFIRMED
    if event_type in (EVENT_ORDER_CONFIRMED, EVENT_PAYMENT_CONFIRMED):
        # Notify Customer
        if customer_id:
            db.add(Notification(
                user_id=customer_id,
                title="Order Confirmed!",
                message=f"Your order {order_code} has been confirmed and routed to the nearest godown for packing.",
            ))
        # Notify Godown Managers of the assigned godown
        godown_id = payload.get("godown_id") or (order.godown_id if order else None)
        if godown_id:
            assignments = db.query(GodownUserAssignment).filter(
                GodownUserAssignment.godown_id == godown_id,
                GodownUserAssignment.is_active == True,
            ).all()
            for asg in assignments:
                db.add(Notification(
                    user_id=asg.user_id,
                    title="New Order Received for Fulfillment",
                    message=f"Order {order_code} requires picking and packing.",
                ))

    # 2. PICKING_STARTED
    elif event_type == EVENT_PICKING_STARTED:
        if customer_id:
            db.add(Notification(
                user_id=customer_id,
                title="Preparing Your Order",
                message=f"Godown staff has started picking fresh items for order {order_code}.",
            ))

    # 3. INVENTORY_SHORTAGE_DETECTED
    elif event_type == EVENT_INVENTORY_SHORTAGE_DETECTED:
        admins = db.query(User).filter(User.role.in_(["ADMIN", "OFFICE_STAFF"])).all()
        prod_name = payload.get("product_name", "Product")
        for admin in admins:
            db.add(Notification(
                user_id=admin.id,
                title="Inventory Shortage Alert",
                message=f"Shortage reported for '{prod_name}' on order {order_code}.",
            ))

    # 4. PACKING_COMPLETED / ORDER_READY_FOR_DISPATCH
    elif event_type in (EVENT_PACKING_COMPLETED, EVENT_ORDER_READY_FOR_DISPATCH):
        if customer_id:
            db.add(Notification(
                user_id=customer_id,
                title="Order Packed & Ready",
                message=f"Order {order_code} is packed ({payload.get('actual_weight_kg', '')} kg) and awaiting dispatch.",
            ))
        # Notify Transport Managers
        transport_managers = db.query(User).filter(User.role.in_(["ADMIN", "TRANSPORT_MANAGER"])).all()
        for tm in transport_managers:
            db.add(Notification(
                user_id=tm.id,
                title="New Order in Transport Dispatch Queue",
                message=f"Order {order_code} is packed ({payload.get('actual_weight_kg', '')} kg) and ready for vehicle assignment.",
            ))

    # 5. TRANSPORT_ASSIGNED
    elif event_type == EVENT_TRANSPORT_ASSIGNED:
        driver_user_id = payload.get("driver_user_id")
        if driver_user_id:
            db.add(Notification(
                user_id=driver_user_id,
                title="New Delivery Assignment",
                message=f"You have been assigned to deliver order {order_code}. Destination: {payload.get('destination', 'Customer Location')}.",
            ))
        if customer_id:
            db.add(Notification(
                user_id=customer_id,
                title="Vehicle & Driver Assigned",
                message=f"Delivery partner {payload.get('driver_name', '')} with vehicle {payload.get('vehicle_number', '')} assigned to order {order_code}.",
            ))

    # 6. DELIVERY_STARTED
    elif event_type == EVENT_DELIVERY_STARTED:
        if customer_id:
            db.add(Notification(
                user_id=customer_id,
                title="Out for Delivery!",
                message=f"Your order {order_code} is on the way. Share your delivery OTP with the driver upon arrival.",
            ))

    # 7. DELIVERY_COMPLETED
    elif event_type == EVENT_DELIVERY_COMPLETED:
        if customer_id:
            db.add(Notification(
                user_id=customer_id,
                title="Order Delivered Successfully!",
                message=f"Order {order_code} has been delivered. Thank you for choosing MARUTHAM KART!",
            ))
        # Notify Office & Admin
        office_users = db.query(User).filter(User.role.in_(["ADMIN", "OFFICE_STAFF"])).all()
        for off in office_users:
            db.add(Notification(
                user_id=off.id,
                title="Order Delivered & Settled",
                message=f"Order {order_code} completed. Invoices & ledger updated.",
            ))


def emit_event(
    db: Session,
    event_type: str,
    aggregate_id: UUID,
    aggregate_type: str = "ORDER",
    payload: Optional[Dict[str, Any]] = None,
    performed_by: Optional[str] = "SYSTEM",
) -> DomainEvent:
    """
    Publishes a domain event into the PostgreSQL database, dispatches notifications,
    and broadcasts to real-time subscribers.
    """
    event_payload = payload or {}
    domain_event = DomainEvent(
        event_type=event_type,
        aggregate_id=aggregate_id,
        aggregate_type=aggregate_type,
        payload=event_payload,
        status="PROCESSED",
        created_at=datetime.utcnow(),
        processed_at=datetime.utcnow(),
    )
    db.add(domain_event)
    
    # Generate Notifications
    try:
        _dispatch_notifications_for_event(db, event_type, aggregate_id, event_payload)
    except Exception as exc:
        logger.error(f"[Events] Error creating notifications for {event_type}: {exc}")

    db.flush()
    logger.info(f"[Domain Event] Emitted {event_type} for {aggregate_type} {aggregate_id}")
    return domain_event
