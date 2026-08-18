"""
Pydantic schemas for Hotel / Restaurant / B2B Partner Portal.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── B2B Profile & Dashboard ───────────────────────────────────────────────────

class B2BProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_code: str
    business_name: str
    business_type: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: str
    verification_status: str
    credit_limit: Decimal
    outstanding_balance: Decimal
    available_credit: Decimal
    payment_terms: str
    status: str


class B2BProfileUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None


class B2BDashboardResponse(BaseModel):
    partner_id: UUID
    business_code: str
    business_name: str
    business_type: str
    credit_limit: Decimal
    outstanding_balance: Decimal
    available_credit: Decimal
    payment_terms: str
    total_orders_count: int
    active_orders_count: int
    pending_invoices_count: int
    active_quotes_count: int
    monthly_spend: Decimal
    recent_invoices: list[B2BInvoiceResponse]
    recent_quotes: list[B2BQuoteResponse]
    recent_recurring_orders: list[B2BRecurringOrderResponse]


# ── B2B Wholesale Catalog ─────────────────────────────────────────────────────

class B2BProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: str
    price: Decimal
    unit: str
    availability: str
    available_qty: Decimal
    rating: float
    image_url: Optional[str] = None
    description: Optional[str] = None
    min_bulk_qty: Optional[Decimal] = None
    price_tiers: Optional[list[dict]] = None
    delivery_estimate: Optional[str] = None


class B2BProductCatalogResponse(BaseModel):
    items: list[B2BProductResponse]
    total: int


# ── B2B Quotations / RFQ ──────────────────────────────────────────────────────

class B2BQuoteItemRequest(BaseModel):
    product_id: UUID
    requested_quantity: Decimal = Field(..., gt=0)
    unit: str = "kg"


class B2BQuoteCreateRequest(BaseModel):
    items: list[B2BQuoteItemRequest]
    notes: Optional[str] = None


class B2BQuoteItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    product_name: str
    requested_quantity: Decimal
    quoted_unit_price: Decimal
    unit: str
    subtotal: Decimal


class B2BQuoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    quote_code: str
    partner_id: UUID
    status: str
    total_estimated_amount: Decimal
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    items: list[B2BQuoteItemResponse]


class B2BQuoteListResponse(BaseModel):
    items: list[B2BQuoteResponse]
    total: int


# ── B2B Invoices & Payments ───────────────────────────────────────────────────

class B2BInvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    order_id: UUID
    order_code: str
    amount: Decimal
    date: Optional[datetime] = None
    status: str  # Paid, Pending, Overdue
    due_date: Optional[str] = None


class B2BInvoiceListResponse(BaseModel):
    items: list[B2BInvoiceResponse]
    total: int
    total_outstanding: Decimal
    total_paid: Decimal


class B2BInvoicePayRequest(BaseModel):
    payment_method: str = Field("Credit Ledger", description="Credit Ledger, Bank Transfer, UPI, Card")
    notes: Optional[str] = None


# ── B2B Standing / Recurring Orders ───────────────────────────────────────────

class B2BRecurringOrderItemRequest(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0)
    unit: str = "kg"


class B2BRecurringOrderCreateRequest(BaseModel):
    frequency: str = Field("Weekly", description="Daily, Weekly, Bi-Weekly, Monthly")
    delivery_day: Optional[str] = "Monday"
    destination: str
    items: list[B2BRecurringOrderItemRequest]


class B2BRecurringOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    product_name: str
    quantity: Decimal
    unit: str


class B2BRecurringOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recurring_code: str
    partner_id: UUID
    frequency: str
    delivery_day: Optional[str] = None
    destination: str
    next_run_date: Optional[datetime] = None
    status: str
    created_at: Optional[datetime] = None
    items: list[B2BRecurringOrderItemResponse]


class B2BRecurringOrderListResponse(BaseModel):
    items: list[B2BRecurringOrderResponse]
    total: int
