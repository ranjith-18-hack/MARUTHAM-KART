"""
Hotel / Restaurant / B2B Partner Portal API.
Prefix: /api/v1/business
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_database_session, require_b2b_or_admin
from app.models.models import (
    B2BPartner,
    B2BQuote,
    B2BQuoteItem,
    B2BRecurringOrder,
    B2BRecurringOrderItem,
    Invoice,
    Order,
    OrderItem,
    OrderStatusHistory,
    Product,
    User,
)
from app.schemas.business import (
    B2BDashboardResponse,
    B2BInvoiceListResponse,
    B2BInvoicePayRequest,
    B2BInvoiceResponse,
    B2BProductCatalogResponse,
    B2BProductResponse,
    B2BProfileResponse,
    B2BProfileUpdateRequest,
    B2BQuoteCreateRequest,
    B2BQuoteItemResponse,
    B2BQuoteListResponse,
    B2BQuoteResponse,
    B2BRecurringOrderCreateRequest,
    B2BRecurringOrderItemResponse,
    B2BRecurringOrderListResponse,
    B2BRecurringOrderResponse,
)

router = APIRouter(prefix="/business", tags=["B2B Partner Portal"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_partner_record(user: User, db: Session) -> B2BPartner:
    """Resolve the B2BPartner profile associated with the authenticated user."""
    partner = db.query(B2BPartner).filter(B2BPartner.id == user.id).first()
    if not partner:
        biz_code = f"MK-BUS-{random.randint(100, 999)}"
        partner = B2BPartner(
            id=user.id,
            business_code=biz_code,
            business_name=user.name,
            business_type="Hotel / Restaurant",
            location="Tamil Nadu",
            verification_status="Verified",
            credit_limit=Decimal("50000.00"),
            outstanding_balance=Decimal("0.00"),
            payment_terms="Net 15 Days",
        )
        db.add(partner)
        db.commit()
        db.refresh(partner)
    return partner


def _unique_quote_code(db: Session) -> str:
    while True:
        code = f"QT-MK-{random.randint(1000, 9999)}"
        if not db.query(B2BQuote).filter(B2BQuote.quote_code == code).first():
            return code


def _unique_recurring_code(db: Session) -> str:
    while True:
        code = f"REC-MK-{random.randint(1000, 9999)}"
        if not db.query(B2BRecurringOrder).filter(B2BRecurringOrder.recurring_code == code).first():
            return code


def _unique_order_code(db: Session) -> str:
    while True:
        code = f"ORD-B2B-{random.randint(1000, 9999)}"
        if not db.query(Order).filter(Order.order_code == code).first():
            return code


# ── Profile & Dashboard ───────────────────────────────────────────────────────

@router.get(
    "/profile",
    response_model=B2BProfileResponse,
    summary="B2B: view business profile & credit limit",
)
def get_business_profile(
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    credit_limit = Decimal(str(partner.credit_limit or 50000.0))
    outstanding = Decimal(str(partner.outstanding_balance or 0.0))
    available_credit = max(Decimal("0.0"), credit_limit - outstanding)

    return B2BProfileResponse(
        id=partner.id,
        business_code=partner.business_code,
        business_name=partner.business_name,
        business_type=partner.business_type,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        location=partner.location,
        verification_status=partner.verification_status,
        credit_limit=credit_limit,
        outstanding_balance=outstanding,
        available_credit=available_credit,
        payment_terms=partner.payment_terms or "Net 15 Days",
        status=current_user.status,
    )


@router.put(
    "/profile",
    response_model=B2BProfileResponse,
    summary="B2B: update business profile",
)
def update_business_profile(
    body: B2BProfileUpdateRequest,
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    if body.business_name is not None:
        partner.business_name = body.business_name
    if body.business_type is not None:
        partner.business_type = body.business_type
    if body.location is not None:
        partner.location = body.location
    if body.phone is not None:
        current_user.phone = body.phone

    db.commit()
    db.refresh(partner)
    db.refresh(current_user)

    credit_limit = Decimal(str(partner.credit_limit or 50000.0))
    outstanding = Decimal(str(partner.outstanding_balance or 0.0))
    available_credit = max(Decimal("0.0"), credit_limit - outstanding)

    return B2BProfileResponse(
        id=partner.id,
        business_code=partner.business_code,
        business_name=partner.business_name,
        business_type=partner.business_type,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        location=partner.location,
        verification_status=partner.verification_status,
        credit_limit=credit_limit,
        outstanding_balance=outstanding,
        available_credit=available_credit,
        payment_terms=partner.payment_terms or "Net 15 Days",
        status=current_user.status,
    )


@router.get(
    "/dashboard",
    response_model=B2BDashboardResponse,
    summary="B2B: dashboard KPI metrics, credit summary and recent orders",
)
def get_business_dashboard(
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    credit_limit = Decimal(str(partner.credit_limit or 50000.0))
    outstanding = Decimal(str(partner.outstanding_balance or 0.0))
    available_credit = max(Decimal("0.0"), credit_limit - outstanding)

    # Order statistics
    total_orders_count = db.query(Order).filter(Order.customer_id == current_user.id).count()
    active_orders_count = db.query(Order).filter(
        Order.customer_id == current_user.id,
        Order.status.in_(["Pending", "Processing", "Picking", "Packing", "Ready for Dispatch", "Dispatched"]),
    ).count()

    # Invoice statistics
    invoices = db.query(Invoice).join(Order).filter(Order.customer_id == current_user.id).all()
    pending_invoices_count = sum(1 for inv in invoices if inv.status != "Paid")

    # Quotes count
    active_quotes_count = db.query(B2BQuote).filter(
        B2BQuote.partner_id == partner.id,
        B2BQuote.status.in_(["Pending", "Sent"]),
    ).count()

    # Monthly spend
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    monthly_spend = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
        Order.customer_id == current_user.id,
        Order.created_at >= thirty_days_ago,
        Order.status != "Cancelled",
    ).scalar() or Decimal("0.0")

    # Recent Invoices
    recent_invoices_db = db.query(Invoice).join(Order).filter(Order.customer_id == current_user.id).order_by(Invoice.date.desc()).limit(5).all()
    recent_invoices = [
        B2BInvoiceResponse(
            id=inv.id,
            order_id=inv.order_id,
            order_code=inv.order.order_code if inv.order else "ORD-MK",
            amount=Decimal(str(inv.amount)),
            date=inv.date,
            status=inv.status,
            due_date=(inv.date + timedelta(days=15)).strftime("%d %b %Y") if inv.date else None,
        )
        for inv in recent_invoices_db
    ]

    # Recent Quotes
    recent_quotes_db = db.query(B2BQuote).filter(B2BQuote.partner_id == partner.id).order_by(B2BQuote.created_at.desc()).limit(5).all()
    recent_quotes = [
        B2BQuoteResponse(
            id=q.id,
            quote_code=q.quote_code,
            partner_id=q.partner_id,
            status=q.status,
            total_estimated_amount=Decimal(str(q.total_estimated_amount)),
            valid_until=q.valid_until,
            notes=q.notes,
            created_at=q.created_at,
            items=[
                B2BQuoteItemResponse(
                    id=it.id,
                    product_id=it.product_id,
                    product_name=it.product.name if it.product else "Produce",
                    requested_quantity=Decimal(str(it.requested_quantity)),
                    quoted_unit_price=Decimal(str(it.quoted_unit_price)),
                    unit=it.unit,
                    subtotal=Decimal(str(it.requested_quantity)) * Decimal(str(it.quoted_unit_price)),
                )
                for it in q.items
            ],
        )
        for q in recent_quotes_db
    ]

    # Recent Recurring Orders
    recent_recurring_db = db.query(B2BRecurringOrder).filter(B2BRecurringOrder.partner_id == partner.id).order_by(B2BRecurringOrder.created_at.desc()).limit(5).all()
    recent_recurring = [
        B2BRecurringOrderResponse(
            id=ro.id,
            recurring_code=ro.recurring_code,
            partner_id=ro.partner_id,
            frequency=ro.frequency,
            delivery_day=ro.delivery_day,
            destination=ro.destination,
            next_run_date=ro.next_run_date,
            status=ro.status,
            created_at=ro.created_at,
            items=[
                B2BRecurringOrderItemResponse(
                    id=it.id,
                    product_id=it.product_id,
                    product_name=it.product.name if it.product else "Produce",
                    quantity=Decimal(str(it.quantity)),
                    unit=it.unit,
                )
                for it in ro.items
            ],
        )
        for ro in recent_recurring_db
    ]

    return B2BDashboardResponse(
        partner_id=partner.id,
        business_code=partner.business_code,
        business_name=partner.business_name,
        business_type=partner.business_type,
        credit_limit=credit_limit,
        outstanding_balance=outstanding,
        available_credit=available_credit,
        payment_terms=partner.payment_terms or "Net 15 Days",
        total_orders_count=total_orders_count,
        active_orders_count=active_orders_count,
        pending_invoices_count=pending_invoices_count,
        active_quotes_count=active_quotes_count,
        monthly_spend=Decimal(str(monthly_spend)),
        recent_invoices=recent_invoices,
        recent_quotes=recent_quotes,
        recent_recurring_orders=recent_recurring,
    )


# ── Wholesale Catalog ─────────────────────────────────────────────────────────

@router.get(
    "/catalog",
    response_model=B2BProductCatalogResponse,
    summary="B2B: view wholesale catalog with volume tier pricing",
)
def get_wholesale_catalog(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    _user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    q = db.query(Product).filter(Product.status == "Active")
    if category and category != "All":
        q = q.filter(Product.category.ilike(f"%{category}%"))
    if search:
        s = f"%{search}%"
        q = q.filter(Product.name.ilike(s) | Product.description.ilike(s))

    products = q.order_by(Product.name.asc()).all()

    items = [
        B2BProductResponse(
            id=p.id,
            name=p.name,
            category=p.category,
            price=Decimal(str(p.price)),
            unit=p.unit,
            availability=p.availability,
            available_qty=Decimal(str(p.available_qty or 0)),
            rating=p.rating or 5.0,
            image_url=p.image_url,
            description=p.description,
            min_bulk_qty=Decimal(str(p.min_bulk_qty or 10.0)),
            price_tiers=p.price_tiers or [
                {"min_qty": 50, "price": float(p.price) * 0.95},
                {"min_qty": 100, "price": float(p.price) * 0.90},
                {"min_qty": 500, "price": float(p.price) * 0.85},
            ],
            delivery_estimate=p.delivery_estimate or "Next Day Delivery",
        )
        for p in products
    ]
    return B2BProductCatalogResponse(items=items, total=len(items))


# ── Quotations / RFQ ──────────────────────────────────────────────────────────

@router.get(
    "/quotes",
    response_model=B2BQuoteListResponse,
    summary="B2B: list quotation requests",
)
def list_quotes(
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    quotes = db.query(B2BQuote).filter(B2BQuote.partner_id == partner.id).order_by(B2BQuote.created_at.desc()).all()

    items = [
        B2BQuoteResponse(
            id=q.id,
            quote_code=q.quote_code,
            partner_id=q.partner_id,
            status=q.status,
            total_estimated_amount=Decimal(str(q.total_estimated_amount)),
            valid_until=q.valid_until,
            notes=q.notes,
            created_at=q.created_at,
            items=[
                B2BQuoteItemResponse(
                    id=it.id,
                    product_id=it.product_id,
                    product_name=it.product.name if it.product else "Produce",
                    requested_quantity=Decimal(str(it.requested_quantity)),
                    quoted_unit_price=Decimal(str(it.quoted_unit_price)),
                    unit=it.unit,
                    subtotal=Decimal(str(it.requested_quantity)) * Decimal(str(it.quoted_unit_price)),
                )
                for it in q.items
            ],
        )
        for q in quotes
    ]
    return B2BQuoteListResponse(items=items, total=len(items))


@router.post(
    "/quotes",
    response_model=B2BQuoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="B2B: request custom wholesale quotation (RFQ)",
)
def create_quote(
    body: B2BQuoteCreateRequest,
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    if not body.items:
        raise HTTPException(status_code=400, detail="At least one product line item is required.")

    quote_code = _unique_quote_code(db)
    quote = B2BQuote(
        quote_code=quote_code,
        partner_id=partner.id,
        status="Sent",
        total_estimated_amount=Decimal("0.0"),
        valid_until=datetime.utcnow() + timedelta(days=7),
        notes=body.notes,
        created_at=datetime.utcnow(),
    )
    db.add(quote)
    db.flush()

    total_amt = Decimal("0.0")
    for req_item in body.items:
        prod = db.query(Product).filter(Product.id == req_item.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product {req_item.product_id} not found.")

        # Compute volume discounted wholesale price
        unit_price = Decimal(str(prod.price))
        if req_item.requested_quantity >= 500:
            unit_price = unit_price * Decimal("0.85")
        elif req_item.requested_quantity >= 100:
            unit_price = unit_price * Decimal("0.90")
        elif req_item.requested_quantity >= 50:
            unit_price = unit_price * Decimal("0.95")

        item = B2BQuoteItem(
            quote_id=quote.id,
            product_id=prod.id,
            requested_quantity=req_item.requested_quantity,
            quoted_unit_price=round(unit_price, 2),
            unit=req_item.unit or prod.unit,
        )
        db.add(item)
        total_amt += Decimal(str(req_item.requested_quantity)) * round(unit_price, 2)

    quote.total_estimated_amount = total_amt
    db.commit()
    db.refresh(quote)

    return B2BQuoteResponse(
        id=quote.id,
        quote_code=quote.quote_code,
        partner_id=quote.partner_id,
        status=quote.status,
        total_estimated_amount=Decimal(str(quote.total_estimated_amount)),
        valid_until=quote.valid_until,
        notes=quote.notes,
        created_at=quote.created_at,
        items=[
            B2BQuoteItemResponse(
                id=it.id,
                product_id=it.product_id,
                product_name=it.product.name if it.product else "Produce",
                requested_quantity=Decimal(str(it.requested_quantity)),
                quoted_unit_price=Decimal(str(it.quoted_unit_price)),
                unit=it.unit,
                subtotal=Decimal(str(it.requested_quantity)) * Decimal(str(it.quoted_unit_price)),
            )
            for it in quote.items
        ],
    )


@router.post(
    "/quotes/{quote_id}/accept",
    response_model=B2BQuoteResponse,
    summary="B2B: accept quotation and convert into a confirmed wholesale order",
)
def accept_quote(
    quote_id: UUID,
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    quote = db.query(B2BQuote).filter(B2BQuote.id == quote_id, B2BQuote.partner_id == partner.id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found.")

    if quote.status == "Accepted":
        raise HTTPException(status_code=400, detail="Quotation has already been accepted.")

    # Create Order
    order_code = _unique_order_code(db)
    order = Order(
        order_code=order_code,
        customer_id=current_user.id,
        buyer_type="Business / Hotel",
        total_amount=quote.total_estimated_amount,
        destination=partner.location,
        delivery_address=f"{partner.business_name}, {partner.location}",
        delivery_charge=Decimal("0.0"),
        status="Pending",
        notes=f"Converted from quotation: {quote.quote_code}",
        created_at=datetime.utcnow(),
    )
    db.add(order)
    db.flush()

    # Create OrderItems from quote
    for it in quote.items:
        oi = OrderItem(
            order_id=order.id,
            product_id=it.product_id,
            quantity=it.requested_quantity,
            price=it.quoted_unit_price,
            unit=it.unit,
        )
        db.add(oi)

    # Status history
    hist = OrderStatusHistory(
        order_id=order.id,
        status="Pending",
        changed_by_id=current_user.id,
        notes="Order placed from accepted B2B quotation",
    )
    db.add(hist)

    # Create Invoice for B2B order
    inv = Invoice(
        order_id=order.id,
        amount=order.total_amount,
        date=datetime.utcnow(),
        status="Pending",
    )
    db.add(inv)

    # Update B2B partner ledger
    partner.outstanding_balance = (partner.outstanding_balance or Decimal("0.0")) + order.total_amount

    quote.status = "Accepted"
    db.commit()
    db.refresh(quote)

    return B2BQuoteResponse(
        id=quote.id,
        quote_code=quote.quote_code,
        partner_id=quote.partner_id,
        status=quote.status,
        total_estimated_amount=Decimal(str(quote.total_estimated_amount)),
        valid_until=quote.valid_until,
        notes=quote.notes,
        created_at=quote.created_at,
        items=[
            B2BQuoteItemResponse(
                id=it.id,
                product_id=it.product_id,
                product_name=it.product.name if it.product else "Produce",
                requested_quantity=Decimal(str(it.requested_quantity)),
                quoted_unit_price=Decimal(str(it.quoted_unit_price)),
                unit=it.unit,
                subtotal=Decimal(str(it.requested_quantity)) * Decimal(str(it.quoted_unit_price)),
            )
            for it in quote.items
        ],
    )


# ── Invoices & Payments ───────────────────────────────────────────────────────

@router.get(
    "/invoices",
    response_model=B2BInvoiceListResponse,
    summary="B2B: list invoices and credit payment dues",
)
def list_invoices(
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    invoices = db.query(Invoice).join(Order).filter(Order.customer_id == current_user.id).order_by(Invoice.date.desc()).all()

    total_outstanding = Decimal("0.0")
    total_paid = Decimal("0.0")
    items = []

    for inv in invoices:
        amt = Decimal(str(inv.amount))
        if inv.status == "Paid":
            total_paid += amt
        else:
            total_outstanding += amt

        items.append(
            B2BInvoiceResponse(
                id=inv.id,
                order_id=inv.order_id,
                order_code=inv.order.order_code if inv.order else "ORD-MK",
                amount=amt,
                date=inv.date,
                status=inv.status,
                due_date=(inv.date + timedelta(days=15)).strftime("%d %b %Y") if inv.date else None,
            )
        )

    return B2BInvoiceListResponse(
        items=items,
        total=len(items),
        total_outstanding=total_outstanding,
        total_paid=total_paid,
    )


@router.post(
    "/invoices/{invoice_id}/pay",
    response_model=B2BInvoiceResponse,
    summary="B2B: settle invoice payment",
)
def pay_invoice(
    invoice_id: UUID,
    _body: Optional[B2BInvoicePayRequest] = None,
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    inv = db.query(Invoice).join(Order).filter(Invoice.id == invoice_id, Order.customer_id == current_user.id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    if inv.status == "Paid":
        raise HTTPException(status_code=400, detail="Invoice is already marked Paid.")

    inv.status = "Paid"
    partner.outstanding_balance = max(Decimal("0.0"), (partner.outstanding_balance or Decimal("0.0")) - inv.amount)

    db.commit()
    db.refresh(inv)

    return B2BInvoiceResponse(
        id=inv.id,
        order_id=inv.order_id,
        order_code=inv.order.order_code if inv.order else "ORD-MK",
        amount=Decimal(str(inv.amount)),
        date=inv.date,
        status=inv.status,
        due_date=(inv.date + timedelta(days=15)).strftime("%d %b %Y") if inv.date else None,
    )


# ── Standing / Recurring Orders ───────────────────────────────────────────────

@router.get(
    "/recurring",
    response_model=B2BRecurringOrderListResponse,
    summary="B2B: list standing recurring subscription orders",
)
def list_recurring_orders(
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    recurring = db.query(B2BRecurringOrder).filter(B2BRecurringOrder.partner_id == partner.id).order_by(B2BRecurringOrder.created_at.desc()).all()

    items = [
        B2BRecurringOrderResponse(
            id=ro.id,
            recurring_code=ro.recurring_code,
            partner_id=ro.partner_id,
            frequency=ro.frequency,
            delivery_day=ro.delivery_day,
            destination=ro.destination,
            next_run_date=ro.next_run_date,
            status=ro.status,
            created_at=ro.created_at,
            items=[
                B2BRecurringOrderItemResponse(
                    id=it.id,
                    product_id=it.product_id,
                    product_name=it.product.name if it.product else "Produce",
                    quantity=Decimal(str(it.quantity)),
                    unit=it.unit,
                )
                for it in ro.items
            ],
        )
        for ro in recurring
    ]
    return B2BRecurringOrderListResponse(items=items, total=len(items))


@router.post(
    "/recurring",
    response_model=B2BRecurringOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="B2B: create standing recurring subscription order",
)
def create_recurring_order(
    body: B2BRecurringOrderCreateRequest,
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    if not body.items:
        raise HTTPException(status_code=400, detail="At least one recurring item is required.")

    code = _unique_recurring_code(db)
    next_date = datetime.utcnow() + timedelta(days=7 if body.frequency == "Weekly" else 1)

    rec = B2BRecurringOrder(
        recurring_code=code,
        partner_id=partner.id,
        frequency=body.frequency,
        delivery_day=body.delivery_day,
        destination=body.destination,
        next_run_date=next_date,
        status="Active",
        created_at=datetime.utcnow(),
    )
    db.add(rec)
    db.flush()

    for item_req in body.items:
        prod = db.query(Product).filter(Product.id == item_req.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product {item_req.product_id} not found.")

        item = B2BRecurringOrderItem(
            recurring_order_id=rec.id,
            product_id=prod.id,
            quantity=item_req.quantity,
            unit=item_req.unit or prod.unit,
        )
        db.add(item)

    db.commit()
    db.refresh(rec)

    return B2BRecurringOrderResponse(
        id=rec.id,
        recurring_code=rec.recurring_code,
        partner_id=rec.partner_id,
        frequency=rec.frequency,
        delivery_day=rec.delivery_day,
        destination=rec.destination,
        next_run_date=rec.next_run_date,
        status=rec.status,
        created_at=rec.created_at,
        items=[
            B2BRecurringOrderItemResponse(
                id=it.id,
                product_id=it.product_id,
                product_name=it.product.name if it.product else "Produce",
                quantity=Decimal(str(it.quantity)),
                unit=it.unit,
            )
            for it in rec.items
        ],
    )


@router.patch(
    "/recurring/{recurring_id}/status",
    response_model=B2BRecurringOrderResponse,
    summary="B2B: toggle recurring order status (Active, Paused, Cancelled)",
)
def update_recurring_status(
    recurring_id: UUID,
    status_val: str = Query(..., alias="status", description="Active, Paused, Cancelled"),
    current_user: User = Depends(require_b2b_or_admin),
    db: Session = Depends(get_database_session),
):
    partner = _get_partner_record(current_user, db)
    rec = db.query(B2BRecurringOrder).filter(B2BRecurringOrder.id == recurring_id, B2BRecurringOrder.partner_id == partner.id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recurring order not found.")

    if status_val not in ("Active", "Paused", "Cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status value. Allowed: Active, Paused, Cancelled")

    rec.status = status_val
    db.commit()
    db.refresh(rec)

    return B2BRecurringOrderResponse(
        id=rec.id,
        recurring_code=rec.recurring_code,
        partner_id=rec.partner_id,
        frequency=rec.frequency,
        delivery_day=rec.delivery_day,
        destination=rec.destination,
        next_run_date=rec.next_run_date,
        status=rec.status,
        created_at=rec.created_at,
        items=[
            B2BRecurringOrderItemResponse(
                id=it.id,
                product_id=it.product_id,
                product_name=it.product.name if it.product else "Produce",
                quantity=Decimal(str(it.quantity)),
                unit=it.unit,
            )
            for it in rec.items
        ],
    )
