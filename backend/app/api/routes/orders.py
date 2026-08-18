"""
Orders routes — customers place orders; godown and transport update status.

Customer endpoints:
  POST /api/v1/orders             — place order from cart
  GET  /api/v1/orders             — customer order history
  GET  /api/v1/orders/{id}        — order detail

Godown/Transport endpoints:
  GET   /api/v1/orders/queue/godown     — pending orders for godown processing
  GET   /api/v1/orders/queue/transport  — dispatched orders for transport
  PATCH /api/v1/orders/{id}/status      — update order status
"""
from __future__ import annotations
import random
import string
from decimal import Decimal
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_database_session,
    require_customer,
    require_godown_or_admin,
    require_transport_or_admin,
    RoleChecker,
)
from app.models.models import (
    AuditLog, Cart, CartItem, Delivery, DeliveryOTP, Order, OrderItem,
    OrderStatusHistory, PackingRecord, Product, User
)
from app.schemas.orders import (
    ORDER_STATUS_TRANSITIONS,
    OrderListResponse,
    OrderResponse,
    OrderItemResponse,
    OrderStatusUpdateRequest,
    PlaceOrderRequest,
    CustomerOrderTrackingResponse,
    TimelineEvent,
)

router = APIRouter(prefix="/orders", tags=["Orders"])

DELIVERY_CHARGE = Decimal("40.00")

# Roles that can update order status (not customers)
require_staff_or_admin = RoleChecker([
    "ADMIN", "GODOWN_MANAGER", "TRANSPORT_MANAGER", "EMPLOYEE",
])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _gen_order_code(db: Session) -> str:
    for _ in range(20):
        suffix = "".join(random.choices(string.digits, k=4))
        code = f"ORD-MK-{suffix}"
        if not db.query(Order).filter(Order.order_code == code).first():
            return code
    raise RuntimeError("Could not generate unique order code")


def _build_order_response(order: Order) -> OrderResponse:
    items = [
        OrderItemResponse(
            id=i.id,
            product_id=i.product_id,
            product_name=i.product.name,
            quantity=Decimal(str(i.quantity)),
            price=Decimal(str(i.price)),
            unit=i.unit,
            subtotal=(Decimal(str(i.quantity)) * Decimal(str(i.price))).quantize(Decimal("0.01")),
        )
        for i in order.order_items
    ]
    return OrderResponse(
        id=order.id,
        order_code=order.order_code,
        customer_id=order.customer_id,
        buyer_type=order.buyer_type,
        status=order.status,
        total_amount=Decimal(str(order.total_amount)),
        delivery_charge=Decimal(str(order.delivery_charge)) if order.delivery_charge else Decimal("0"),
        delivery_address=order.delivery_address,
        destination=order.destination,
        notes=order.notes,
        items=items,
        created_at=order.created_at,
    )


# ── Place Order ───────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Customer: place an order from their cart",
)
def place_order(
    body: PlaceOrderRequest,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    # Load cart
    cart = db.query(Cart).filter(Cart.customer_id == customer.id).first()
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your cart is empty. Add items before placing an order.",
        )

    # Validate stock for each item (inside transaction)
    subtotal = Decimal("0.00")
    order_items_data = []

    for ci in cart.items:
        product = db.query(Product).with_for_update().filter(Product.id == ci.product_id).first()
        if not product or product.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{ci.product.name}' is no longer available.",
            )
        requested = Decimal(str(ci.quantity))
        available = Decimal(str(product.available_qty))
        if requested > available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}'. "
                    f"Available: {available}, requested: {requested}."
                ),
            )
        unit_price = Decimal(str(product.price))
        line_total = (requested * unit_price).quantize(Decimal("0.01"))
        subtotal += line_total
        order_items_data.append({
            "product": product,
            "quantity": requested,
            "price": unit_price,
            "unit": product.unit,
        })

    delivery_charge = DELIVERY_CHARGE
    total = subtotal + delivery_charge

    # Create Order
    order = Order(
        order_code=_gen_order_code(db),
        customer_id=customer.id,
        buyer_type="Customer",
        total_amount=total,
        destination=body.delivery_address,
        delivery_address=body.delivery_address,
        delivery_charge=delivery_charge,
        status="Pending",
        notes=body.notes,
    )
    db.add(order)
    db.flush()

    # Create OrderItems + deduct stock atomically
    for item_data in order_items_data:
        product = item_data["product"]
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item_data["quantity"],
            price=item_data["price"],
            unit=item_data["unit"],
        ))
        # Deduct stock
        new_qty = float(product.available_qty) - float(item_data["quantity"])
        product.available_qty = new_qty
        if new_qty <= 0:
            product.availability = "Out of Stock"
        elif new_qty < 20:
            product.availability = "Low Stock"
        else:
            product.availability = "Available"

    # Record status history
    db.add(OrderStatusHistory(
        order_id=order.id,
        status="Pending",
        changed_by_id=customer.id,
        notes="Order placed by customer",
    ))

    # Audit log
    db.add(AuditLog(
        user_id=customer.id,
        performed_by=customer.name,
        action="Order Placed",
        entity_type="Order",
        entity_id=str(order.id),
        new_value={"order_code": order.order_code, "total": str(total)},
    ))

    # Clear cart
    for ci in list(cart.items):
        db.delete(ci)

    db.commit()
    db.refresh(order)
    return _build_order_response(order)


# ── Customer: order history ───────────────────────────────────────────────────

@router.get(
    "",
    response_model=OrderListResponse,
    summary="Customer: view order history",
)
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    query = db.query(Order).filter(Order.customer_id == customer.id)
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return OrderListResponse(
        items=[_build_order_response(o) for o in orders],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Customer: order detail ────────────────────────────────────────────────────

@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Customer: view order detail",
)
def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    # Customers can only see their own orders
    if current_user.role.upper() == "CUSTOMER" and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return _build_order_response(order)


@router.get(
    "/{order_id}/tracking",
    response_model=CustomerOrderTrackingResponse,
    summary="Customer: live order tracking timeline, vehicle, driver, and OTP",
)
def get_order_tracking(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if current_user.role.upper() == "CUSTOMER" and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Fetch packing & verified weight
    pack = db.query(PackingRecord).filter(PackingRecord.order_id == order.id).first()
    verified_weight = pack.total_weight_kg if pack else order.weight
    pkg_count = pack.package_count if pack else None

    # Fetch delivery & driver info
    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    driver_name = None
    driver_id_code = None
    driver_phone = None
    veh_code = None
    veh_number = None
    veh_type = None
    veh_capacity = None
    eta = delivery.eta if delivery else None

    if delivery and delivery.driver:
        driver_id_code = delivery.driver.driver_code
        if delivery.driver.user:
            driver_name = delivery.driver.user.name
            raw_phone = delivery.driver.user.phone
            # Mask driver phone for customer privacy
            if raw_phone and len(raw_phone) >= 10:
                driver_phone = f"{raw_phone[:3]}****{raw_phone[-4:]}"
            else:
                driver_phone = raw_phone

    if delivery and delivery.vehicle:
        veh_code = delivery.vehicle.vehicle_code
        veh_number = delivery.vehicle.number
        veh_type = delivery.vehicle.type
        veh_capacity = delivery.vehicle.capacity

    # OTP is exposed only to customer who placed the order or staff
    otp_code = None
    otp_rec = db.query(DeliveryOTP).filter(DeliveryOTP.order_id == order.id).first()
    if otp_rec and (order.customer_id == current_user.id or current_user.role.upper() in ("ADMIN", "OFFICE_STAFF")):
        otp_code = otp_rec.otp_code

    # Timeline history
    history = db.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == order.id).order_by(OrderStatusHistory.timestamp.asc()).all()
    timeline = [
        TimelineEvent(
            status=h.status,
            timestamp=h.timestamp,
            notes=h.notes,
        )
        for h in history
    ]

    items = [
        OrderItemResponse(
            id=i.id,
            product_id=i.product_id,
            product_name=i.product.name,
            quantity=Decimal(str(i.quantity)),
            price=Decimal(str(i.price)),
            unit=i.unit,
            subtotal=(Decimal(str(i.quantity)) * Decimal(str(i.price))).quantize(Decimal("0.01")),
        )
        for i in order.order_items
    ]

    return CustomerOrderTrackingResponse(
        order_id=order.id,
        order_code=order.order_code,
        status=order.status,
        payment_status=order.payment_status,
        payment_method=order.payment_method,
        total_amount=Decimal(str(order.total_amount)),
        delivery_charge=Decimal(str(order.delivery_charge)) if order.delivery_charge else Decimal("0"),
        delivery_address=order.delivery_address,
        destination=order.destination,
        verified_weight_kg=Decimal(str(verified_weight)) if verified_weight else None,
        package_count=pkg_count,
        godown_name=order.assigned_godown.name if order.assigned_godown else None,
        driver_name=driver_name,
        driver_id_code=driver_id_code,
        driver_phone=driver_phone,
        vehicle_code=veh_code,
        vehicle_number=veh_number,
        vehicle_type=veh_type,
        vehicle_capacity=veh_capacity,
        eta=eta,
        delivery_otp=otp_code,
        payment_verified_at=order.payment_verified_at,
        driver_assigned_at=order.driver_assigned_at,
        assignment_duration_seconds=float(order.payment_to_driver_assignment_seconds) if order.payment_to_driver_assignment_seconds else None,
        assignment_sla_status=order.assignment_sla_status,
        delay_reason=order.assignment_delay_reason or (delivery.delay_reason if delivery else None),
        timeline=timeline,
        items=items,
        created_at=order.created_at,
    )



# ── Godown: order queue ───────────────────────────────────────────────────────

@router.get(
    "/queue/godown",
    response_model=OrderListResponse,
    summary="Godown: view pending/processing orders that need preparation",
)
def godown_order_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _staff: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    godown_statuses = ["Pending", "Processing", "Picking", "Packing"]
    query = db.query(Order).filter(Order.status.in_(godown_statuses))
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return OrderListResponse(
        items=[_build_order_response(o) for o in orders],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Transport: order queue ─────────────────────────────────────────────────────

@router.get(
    "/queue/transport",
    response_model=OrderListResponse,
    summary="Transport: view orders ready for dispatch or already dispatched",
)
def transport_order_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _staff: User = Depends(require_transport_or_admin),
    db: Session = Depends(get_database_session),
):
    transport_statuses = ["Ready for Dispatch", "Dispatched"]
    query = db.query(Order).filter(Order.status.in_(transport_statuses))
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return OrderListResponse(
        items=[_build_order_response(o) for o in orders],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Staff: update order status ────────────────────────────────────────────────

@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Staff: update order status (godown / transport / admin)",
)
def update_order_status(
    order_id: UUID,
    body: OrderStatusUpdateRequest,
    staff: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    # Validate transition
    body.validate_transition(order.status)

    old_status = order.status
    order.status = body.status

    # Record status change
    db.add(OrderStatusHistory(
        order_id=order.id,
        status=body.status,
        changed_by_id=staff.id,
        notes=body.notes,
    ))

    # Audit
    db.add(AuditLog(
        user_id=staff.id,
        performed_by=staff.name,
        action="Order Status Updated",
        entity_type="Order",
        entity_id=str(order.id),
        previous_value={"status": old_status},
        new_value={"status": body.status},
        reason=body.notes,
    ))

    db.commit()
    db.refresh(order)
    return _build_order_response(order)
