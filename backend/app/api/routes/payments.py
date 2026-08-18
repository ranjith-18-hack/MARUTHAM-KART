"""
MARUTHAM KART — Payment API Router

Endpoints:
- GET  /api/v1/payments/diagnostic   — Safe status check of configured payment gateway
- POST /api/v1/payments/create-intent — Authoritative order & payment intent creation (COD & UPI)
- POST /api/v1/payments/verify        — Cryptographic HMAC SHA-256 signature verification & payment capture
- POST /api/v1/payments/webhook       — Idempotent gateway webhook handler
- POST /api/v1/payments/cod/collect   — Driver / Staff COD cash collection recording
- POST /api/v1/payments/refund        — Admin / Manager refund trigger
- GET  /api/v1/payments/{order_id}/receipt — Customer receipt fetcher
"""
from __future__ import annotations
import uuid
from uuid import UUID
import random
import string
from decimal import Decimal
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import (
    get_current_user,
    get_database_session,
    require_customer,
    RoleChecker,
)
from app.models.models import (
    AuditLog,
    Cart,
    CartItem,
    CustomerAddress,
    Godown,
    Order,
    OrderItem,
    OrderStatusHistory,
    Payment,
    PaymentAuditLog,
    Product,
    User,
)
from app.schemas.payments import (
    PaymentDiagnosticResponse,
    PaymentIntentCreateRequest,
    PaymentIntentResponse,
    PaymentVerificationRequest,
    PaymentVerificationResponse,
    CODCollectionRequest,
    CODCollectionResponse,
    RefundRequest,
    RefundResponse,
    PaymentReceiptResponse,
)
from app.core.payment import (
    check_payment_diagnostic,
    create_gateway_order,
    verify_razorpay_signature,
    verify_razorpay_webhook_signature,
    fetch_gateway_payment,
    create_gateway_refund,
)
from app.core.events import (
    emit_event,
    EVENT_ORDER_CONFIRMED,
    EVENT_PAYMENT_CONFIRMED,
    EVENT_PAYMENT_FAILED,
)
from app.services.godown_matcher import find_nearest_godown

router = APIRouter(prefix="/payments", tags=["Payments"])

DELIVERY_CHARGE = Decimal("40.00")

require_staff_or_admin = RoleChecker([
    "ADMIN", "GODOWN_MANAGER", "TRANSPORT_MANAGER", "DRIVER", "EMPLOYEE",
])


def _gen_order_code(db: Session) -> str:
    for _ in range(20):
        suffix = "".join(random.choices(string.digits, k=4))
        code = f"ORD-MK-{suffix}"
        if not db.query(Order).filter(Order.order_code == code).first():
            return code
    return f"ORD-MK-{uuid.uuid4().hex[:6].upper()}"


# ── 1. Diagnostic Probe ────────────────────────────────────────────────────────

@router.get(
    "/diagnostic",
    response_model=PaymentDiagnosticResponse,
    summary="Safe diagnostic check of configured payment gateway",
)
def payment_diagnostic():
    diag = check_payment_diagnostic()
    return PaymentDiagnosticResponse(**diag)


# ── 2. Create Payment Intent / Order ───────────────────────────────────────────

@router.post(
    "/create-intent",
    response_model=PaymentIntentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Customer: Authoritative payment intent & order creation (COD or UPI)",
)
def create_payment_intent(
    body: PaymentIntentCreateRequest,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    # Check for existing order with same idempotency key to prevent double charge
    if body.idempotency_key:
        existing_order = (
            db.query(Order)
            .filter(Order.idempotency_key == body.idempotency_key, Order.customer_id == customer.id)
            .first()
        )
        if existing_order:
            existing_payment = (
                db.query(Payment)
                .filter(Payment.order_id == existing_order.id)
                .order_by(Payment.created_at.desc())
                .first()
            )
            return PaymentIntentResponse(
                order_id=existing_order.id,
                order_code=existing_order.order_code,
                payment_id=existing_payment.id if existing_payment else None,
                gateway=existing_payment.gateway if existing_payment else "razorpay",
                payment_method=existing_order.payment_method,
                payment_status=existing_order.payment_status,
                order_status=existing_order.status,
                total_amount=Decimal(str(existing_order.total_amount)),
                delivery_charge=Decimal(str(existing_order.delivery_charge)),
                razorpay_order_id=existing_payment.gateway_order_id if existing_payment else None,
                razorpay_key_id=settings.RAZORPAY_KEY_ID,
                customer_name=customer.name,
                customer_phone=customer.phone,
                customer_email=customer.email,
                message="Retrieved existing checkout order for idempotency token.",
            )

    # 1. Load active cart
    cart = db.query(Cart).filter(Cart.customer_id == customer.id).first()
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your shopping cart is empty. Add fresh items before placing an order.",
        )

    # 2. Server-side authoritative price recalculation & stock verification
    subtotal = Decimal("0.00")
    order_items_data = []

    for ci in cart.items:
        product = db.query(Product).with_for_update().filter(Product.id == ci.product_id).first()
        if not product or product.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{ci.product.name}' is no longer available.",
            )
        requested_qty = Decimal(str(ci.quantity))
        available_qty = Decimal(str(product.available_qty))
        if requested_qty > available_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}'. "
                    f"Available: {available_qty} {product.unit}, requested: {requested_qty}."
                ),
            )
        unit_price = Decimal(str(product.price))
        line_total = (requested_qty * unit_price).quantize(Decimal("0.01"))
        subtotal += line_total
        order_items_data.append({
            "product": product,
            "quantity": requested_qty,
            "price": unit_price,
            "unit": product.unit,
        })

    delivery_charge = DELIVERY_CHARGE
    grand_total = subtotal + delivery_charge

    # 3. Resolve customer location & nearest active fulfillment Godown
    primary_address = (
        db.query(CustomerAddress)
        .filter(CustomerAddress.customer_id == customer.id)
        .order_by(CustomerAddress.is_default.desc(), CustomerAddress.created_at.desc())
        .first()
    )
    assigned_godown_info = find_nearest_godown(db, primary_address)
    assigned_godown_id = UUID(assigned_godown_info["id"]) if assigned_godown_info else None

    method = (body.payment_method or "UPI").upper().strip()
    if method not in ("COD", "UPI", "CARD", "NETBANKING"):
        method = "UPI"

    # 4. Handle Cash on Delivery (COD) Flow
    if method == "COD":
        # Set initial timestamps
        now = datetime.utcnow()
        order = Order(
            order_code=_gen_order_code(db),
            customer_id=customer.id,
            buyer_type="Customer",
            total_amount=grand_total,
            destination=body.delivery_address,
            delivery_address=body.delivery_address,
            delivery_charge=delivery_charge,
            status="Pending",
            payment_method="COD",
            payment_status="PENDING",
            godown_id=assigned_godown_id,
            idempotency_key=body.idempotency_key,
            notes=body.notes,
            payment_verified_at=now,
            order_confirmed_at=now,
            godown_notified_at=now,
        )
        db.add(order)
        db.flush()

        # Create Order Items and deduct inventory atomically
        for item in order_items_data:
            p = item["product"]
            db.add(OrderItem(
                order_id=order.id,
                product_id=p.id,
                quantity=item["quantity"],
                price=item["price"],
                unit=item["unit"],
            ))
            # Deduct available stock
            new_stock = float(p.available_qty) - float(item["quantity"])
            p.available_qty = max(0.0, new_stock)
            if new_stock <= 0:
                p.availability = "Out of Stock"
            elif new_stock < 20:
                p.availability = "Low Stock"

        # Create internal payment tracking record
        payment = Payment(
            order_id=order.id,
            customer_id=customer.id,
            gateway="cod_internal",
            payment_method="COD",
            amount=grand_total,
            currency="INR",
            status="PENDING",
            idempotency_key=body.idempotency_key,
        )
        db.add(payment)
        db.flush()

        # Record Audit Logs
        db.add(OrderStatusHistory(
            order_id=order.id,
            status="Pending",
            changed_by_id=customer.id,
            notes="Order placed via Cash on Delivery",
        ))
        db.add(PaymentAuditLog(
            payment_id=payment.id,
            order_id=order.id,
            event_type="COD_ORDER_PLACED",
            payload={"order_code": order.order_code, "amount": str(grand_total)},
            performed_by=customer.name,
        ))

        # Clear Cart
        for ci in list(cart.items):
            db.delete(ci)

        # Emit Decoupled Domain Event to notify Godown and Customer
        emit_event(
            db=db,
            event_type=EVENT_ORDER_CONFIRMED,
            aggregate_id=order.id,
            aggregate_type="ORDER",
            payload={
                "order_id": str(order.id),
                "order_code": order.order_code,
                "customer_id": str(customer.id),
                "godown_id": str(order.godown_id) if order.godown_id else None,
                "payment_method": "COD",
                "payment_status": "PENDING",
                "amount": str(grand_total),
            },
            performed_by=customer.name,
        )

        db.commit()
        db.refresh(order)

        return PaymentIntentResponse(
            order_id=order.id,
            order_code=order.order_code,
            payment_id=payment.id,
            gateway="cod_internal",
            payment_method="COD",
            payment_status="PENDING",
            order_status="Pending",
            total_amount=grand_total,
            delivery_charge=delivery_charge,
            currency="INR",
            customer_name=customer.name,
            customer_phone=customer.phone,
            customer_email=customer.email,
            assigned_godown=assigned_godown_info,
            message="COD Order placed successfully. Payment will be collected upon delivery.",
        )

    # 5. Handle Online UPI / Card / Net Banking via Gateway (Razorpay)
    order_code = _gen_order_code(db)
    order = Order(
        order_code=order_code,
        customer_id=customer.id,
        buyer_type="Customer",
        total_amount=grand_total,
        destination=body.delivery_address,
        delivery_address=body.delivery_address,
        delivery_charge=delivery_charge,
        status="Payment Pending",  # Not in godown queue until payment is captured
        payment_method=method,
        payment_status="CREATED",
        godown_id=assigned_godown_id,
        idempotency_key=body.idempotency_key,
        notes=body.notes,
    )
    db.add(order)
    db.flush()

    # Create OrderItems (Stock reserved upon payment verification)
    for item in order_items_data:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item["product"].id,
            quantity=item["quantity"],
            price=item["price"],
            unit=item["unit"],
        ))

    # Request Gateway Order from Razorpay
    gateway_order = create_gateway_order(
        amount_inr=grand_total,
        receipt_code=order.order_code,
        notes={
            "customer_id": str(customer.id),
            "customer_phone": customer.phone or "",
            "order_code": order.order_code,
        },
    )

    if not gateway_order.success:
        if "not configured" in (gateway_order.error or "").lower() or "missing" in (gateway_order.error or "").lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Payment Gateway is not configured: {gateway_order.error}",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to create payment gateway session: {gateway_order.error}",
        )

    # Save internal payment record
    payment = Payment(
        order_id=order.id,
        customer_id=customer.id,
        gateway="razorpay",
        gateway_order_id=gateway_order.gateway_order_id,
        payment_method=method,
        amount=grand_total,
        currency="INR",
        status="CREATED",
        idempotency_key=body.idempotency_key,
    )
    db.add(payment)
    db.flush()

    # Log intent creation
    db.add(PaymentAuditLog(
        payment_id=payment.id,
        order_id=order.id,
        event_type="PAYMENT_INTENT_CREATED",
        payload={
            "gateway_order_id": gateway_order.gateway_order_id,
            "amount": str(grand_total),
            "currency": "INR",
        },
        performed_by=customer.name,
    ))

    db.commit()
    db.refresh(order)

    return PaymentIntentResponse(
        order_id=order.id,
        order_code=order.order_code,
        payment_id=payment.id,
        gateway="razorpay",
        payment_method=method,
        payment_status="CREATED",
        order_status="Payment Pending",
        total_amount=grand_total,
        delivery_charge=delivery_charge,
        currency="INR",
        razorpay_order_id=gateway_order.gateway_order_id,
        razorpay_key_id=gateway_order.key_id or settings.RAZORPAY_KEY_ID,
        customer_name=customer.name,
        customer_phone=customer.phone,
        customer_email=customer.email,
        assigned_godown=assigned_godown_info,
        message="Payment intent created. Please complete payment using UPI / Card in the gateway prompt.",
    )


# ── 3. Authoritative Payment Verification ──────────────────────────────────────

@router.post(
    "/verify",
    response_model=PaymentVerificationResponse,
    summary="Customer: Verify payment signature and capture order",
)
def verify_payment(
    body: PaymentVerificationRequest,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    # 1. Fetch Order and Payment record
    order = db.query(Order).filter(Order.id == body.order_id).first()
    if not order or order.customer_id != customer.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or unauthorized.",
        )

    payment = (
        db.query(Payment)
        .filter(Payment.order_id == order.id, Payment.gateway_order_id == body.razorpay_order_id)
        .first()
    )
    if not payment:
        payment = (
            db.query(Payment)
            .filter(Payment.order_id == order.id)
            .order_by(Payment.created_at.desc())
            .first()
        )

    # 2. Cryptographic HMAC SHA-256 Signature Verification
    is_valid_sig = verify_razorpay_signature(
        razorpay_order_id=body.razorpay_order_id,
        razorpay_payment_id=body.razorpay_payment_id,
        razorpay_signature=body.razorpay_signature,
    )

    if not is_valid_sig:
        # Mark payment failed and record audit failure
        if payment:
            payment.status = "FAILED"
            payment.failure_reason = "Cryptographic HMAC signature verification mismatch."
            db.add(PaymentAuditLog(
                payment_id=payment.id,
                order_id=order.id,
                event_type="SIGNATURE_VERIFICATION_FAILED",
                payload={"provided_signature": body.razorpay_signature[:20] + "..."},
                performed_by=customer.name,
            ))
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed: Invalid cryptographic signature.",
        )

    # 3. Transition Payment & Order States
    now = datetime.utcnow()
    payment.status = "CAPTURED"
    payment.gateway_payment_id = body.razorpay_payment_id
    payment.gateway_signature = body.razorpay_signature
    payment.verified_at = now
    payment.updated_at = now

    order.payment_status = "CAPTURED"
    order.status = "Pending"  # Now ready for Godown Picking & Packing queue
    order.payment_verified_at = now
    order.order_confirmed_at = now
    order.godown_notified_at = now

    # 4. Deduct Inventory stock atomically & clear cart
    for item in order.order_items:
        p = db.query(Product).with_for_update().filter(Product.id == item.product_id).first()
        if p:
            new_stock = float(p.available_qty) - float(item.quantity)
            p.available_qty = max(0.0, new_stock)
            if new_stock <= 0:
                p.availability = "Out of Stock"
            elif new_stock < 20:
                p.availability = "Low Stock"

    # Clear customer cart
    cart = db.query(Cart).filter(Cart.customer_id == customer.id).first()
    if cart:
        for ci in list(cart.items):
            db.delete(ci)

    # Record Status & Audit Logs
    db.add(OrderStatusHistory(
        order_id=order.id,
        status="Pending",
        changed_by_id=customer.id,
        notes=f"Payment verified and captured via Razorpay ({body.razorpay_payment_id})",
    ))
    db.add(PaymentAuditLog(
        payment_id=payment.id,
        order_id=order.id,
        event_type="PAYMENT_CAPTURED",
        payload={
            "gateway_order_id": body.razorpay_order_id,
            "gateway_payment_id": body.razorpay_payment_id,
            "amount": str(payment.amount),
        },
        performed_by="SYSTEM_PAYMENT_VERIFIER",
    ))

    # Emit Decoupled Domain Events to notify Godown and Customer
    emit_event(
        db=db,
        event_type=EVENT_PAYMENT_CONFIRMED,
        aggregate_id=payment.id,
        aggregate_type="PAYMENT",
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "payment_id": str(payment.id),
            "customer_id": str(customer.id),
            "amount": str(payment.amount),
            "transaction_id": body.razorpay_payment_id,
        },
        performed_by="SYSTEM_PAYMENT_VERIFIER",
    )
    emit_event(
        db=db,
        event_type=EVENT_ORDER_CONFIRMED,
        aggregate_id=order.id,
        aggregate_type="ORDER",
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "customer_id": str(customer.id),
            "godown_id": str(order.godown_id) if order.godown_id else None,
            "payment_method": payment.payment_method,
            "payment_status": "CAPTURED",
            "amount": str(payment.amount),
            "transaction_id": body.razorpay_payment_id,
        },
        performed_by="SYSTEM_PAYMENT_VERIFIER",
    )

    db.commit()
    db.refresh(order)

    return PaymentVerificationResponse(
        success=True,
        order_id=order.id,
        order_code=order.order_code,
        payment_status="CAPTURED",
        order_status="Pending",
        amount=Decimal(str(payment.amount)),
        payment_method=payment.payment_method,
        transaction_id=body.razorpay_payment_id,
        verified_at=now,
        message="Payment verified and captured successfully! Order dispatched to fulfillment godown.",
    )


# ── 4. Idempotent Webhook Listener ─────────────────────────────────────────────

@router.post(
    "/webhook",
    summary="Gateway webhook receiver for automated reconciliation",
)
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_database_session),
    x_razorpay_signature: Optional[str] = Header(None),
):
    body_bytes = await request.body()

    if not x_razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-Razorpay-Signature header",
        )

    if not verify_razorpay_webhook_signature(body_bytes, x_razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    import json
    event_data = json.loads(body_bytes.decode("utf-8"))
    event_type = event_data.get("event")

    # Idempotent handler for payment.captured
    if event_type in ("payment.captured", "order.paid"):
        payment_entity = event_data.get("payload", {}).get("payment", {}).get("entity", {})
        gateway_order_id = payment_entity.get("order_id")
        gateway_payment_id = payment_entity.get("id")

        if gateway_order_id:
            payment = db.query(Payment).filter(Payment.gateway_order_id == gateway_order_id).first()
            if payment and payment.status != "CAPTURED":
                payment.status = "CAPTURED"
                payment.gateway_payment_id = gateway_payment_id
                payment.verified_at = datetime.utcnow()
                if payment.order:
                    payment.order.payment_status = "CAPTURED"
                    payment.order.status = "Pending"
                db.add(PaymentAuditLog(
                    payment_id=payment.id,
                    order_id=payment.order_id,
                    event_type="WEBHOOK_PAYMENT_CAPTURED",
                    payload={"event": event_type, "payment_id": gateway_payment_id},
                ))
                db.commit()

    return {"status": "ok", "event": event_type}


# ── 5. Driver COD Cash Collection Recording ────────────────────────────────────

@router.post(
    "/cod/collect",
    response_model=CODCollectionResponse,
    summary="Driver / Staff: Record cash collected upon COD order delivery",
)
def record_cod_collection(
    body: CODCollectionRequest,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).filter(Order.id == body.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.payment_method != "COD":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot record COD collection on an online paid order.",
        )

    authoritative_amount = Decimal(str(order.total_amount))
    if body.collected_amount < authoritative_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Collected amount (₹{body.collected_amount}) is less than order total (₹{authoritative_amount}).",
        )

    now = datetime.utcnow()
    order.payment_status = "COLLECTED"

    payment = (
        db.query(Payment)
        .filter(Payment.order_id == order.id)
        .order_by(Payment.created_at.desc())
        .first()
    )
    if not payment:
        payment = Payment(
            order_id=order.id,
            customer_id=order.customer_id,
            gateway="cod_internal",
            payment_method="COD",
            amount=authoritative_amount,
            currency="INR",
            status="COLLECTED",
        )
        db.add(payment)
    else:
        payment.status = "COLLECTED"
        payment.verified_at = now

    db.add(PaymentAuditLog(
        payment_id=payment.id,
        order_id=order.id,
        event_type="COD_CASH_COLLECTED",
        payload={
            "collected_amount": str(body.collected_amount),
            "order_total": str(authoritative_amount),
            "collector_id": str(current_user.id),
            "notes": body.notes,
        },
        performed_by=current_user.name,
    ))

    db.commit()
    db.refresh(order)

    return CODCollectionResponse(
        success=True,
        order_id=order.id,
        order_code=order.order_code,
        payment_status="COLLECTED",
        collected_amount=body.collected_amount,
        collected_by=current_user.name,
        collected_at=now,
        message="COD cash collection recorded successfully.",
    )


# ── 6. Refund Initiation ───────────────────────────────────────────────────────

@router.post(
    "/refund",
    response_model=RefundResponse,
    summary="Staff / Admin: Initiate refund for cancelled or returned order",
)
def process_refund(
    body: RefundRequest,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).filter(Order.id == body.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    payment = (
        db.query(Payment)
        .filter(Payment.order_id == order.id, Payment.status == "CAPTURED")
        .first()
    )
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No captured online payment found for this order to refund.",
        )

    refund_amt = body.amount or Decimal(str(payment.amount))
    refund_res = create_gateway_refund(
        razorpay_payment_id=payment.gateway_payment_id,
        amount_inr=refund_amt,
        notes={"order_code": order.order_code, "reason": body.reason or ""},
    )

    if not refund_res.success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gateway refund failed: {refund_res.error}",
        )

    now = datetime.utcnow()
    payment.status = "REFUNDED"
    payment.refund_id = refund_res.refund_id
    payment.refund_amount = refund_amt
    payment.refunded_at = now

    order.payment_status = "REFUNDED"
    order.status = "Cancelled"

    db.add(PaymentAuditLog(
        payment_id=payment.id,
        order_id=order.id,
        event_type="REFUND_ISSUED",
        payload={
            "refund_id": refund_res.refund_id,
            "refund_amount": str(refund_amt),
            "reason": body.reason,
        },
        performed_by=current_user.name,
    ))

    db.commit()

    return RefundResponse(
        success=True,
        order_id=order.id,
        refund_id=refund_res.refund_id,
        amount=refund_amt,
        status="REFUNDED",
        message="Refund processed successfully via Razorpay.",
    )


# ── 7. Customer Payment Receipt ────────────────────────────────────────────────

@router.get(
    "/{order_id}/receipt",
    response_model=PaymentReceiptResponse,
    summary="Customer: Fetch authoritative payment receipt",
)
def get_payment_receipt(
    order_id: uuid.UUID,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.customer_id != customer.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")

    payment = (
        db.query(Payment)
        .filter(Payment.order_id == order.id)
        .order_by(Payment.created_at.desc())
        .first()
    )

    items = [
        {
            "name": item.product.name,
            "quantity": float(item.quantity),
            "unit": item.unit,
            "price": float(item.price),
            "subtotal": float(item.quantity * item.price),
        }
        for item in order.order_items
    ]

    subtotal = sum(Decimal(str(i["subtotal"])) for i in items)
    godown_name = order.assigned_godown.name if order.assigned_godown else "Regional Warehouse"

    return PaymentReceiptResponse(
        order_id=order.id,
        order_code=order.order_code,
        customer_name=customer.name,
        customer_phone=customer.phone,
        delivery_address=order.delivery_address or order.destination,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        order_status=order.status,
        subtotal=subtotal,
        delivery_charge=Decimal(str(order.delivery_charge or 0)),
        total_amount=Decimal(str(order.total_amount)),
        transaction_id=payment.gateway_payment_id if payment else None,
        items=items,
        assigned_godown_name=godown_name,
        created_at=order.created_at,
        paid_at=payment.verified_at if payment else None,
    )
