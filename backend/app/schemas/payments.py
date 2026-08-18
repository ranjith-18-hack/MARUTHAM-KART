"""
Pydantic Schemas for Payment Processing, Diagnostics, Verification, and Receipts.
"""
from __future__ import annotations
from decimal import Decimal
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class PaymentDiagnosticResponse(BaseModel):
    primary_gateway: str
    gateway_configured: bool
    key_id_configured: bool
    key_secret_configured: bool
    webhook_secret_configured: bool
    test_mode: bool
    gateway_connectivity: str
    supported_methods: List[str]
    status_message: str


class PaymentIntentCreateRequest(BaseModel):
    delivery_address: str = Field(..., min_length=5, description="Full delivery destination address")
    delivery_phone: Optional[str] = Field(None, min_length=10, max_length=20)
    payment_method: str = Field("UPI", description="COD | UPI | CARD | NETBANKING")
    notes: Optional[str] = None
    idempotency_key: Optional[str] = Field(None, description="Unique client checkout token preventing duplicate submissions")


class PaymentIntentResponse(BaseModel):
    order_id: UUID
    order_code: str
    payment_id: Optional[UUID] = None
    gateway: str
    payment_method: str
    payment_status: str
    order_status: str
    total_amount: Decimal
    delivery_charge: Decimal
    currency: str = "INR"
    # Gateway specific params (publicly safe)
    razorpay_order_id: Optional[str] = None
    razorpay_key_id: Optional[str] = None
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    assigned_godown: Optional[Dict[str, Any]] = None
    message: str


class PaymentVerificationRequest(BaseModel):
    order_id: UUID
    payment_id: Optional[UUID] = None
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentVerificationResponse(BaseModel):
    success: bool
    order_id: UUID
    order_code: str
    payment_status: str
    order_status: str
    amount: Decimal
    payment_method: str
    transaction_id: str
    verified_at: datetime
    message: str


class CODCollectionRequest(BaseModel):
    order_id: UUID
    collected_amount: Decimal = Field(..., gt=0)
    notes: Optional[str] = None


class CODCollectionResponse(BaseModel):
    success: bool
    order_id: UUID
    order_code: str
    payment_status: str
    collected_amount: Decimal
    collected_by: str
    collected_at: datetime
    message: str


class RefundRequest(BaseModel):
    order_id: UUID
    payment_id: Optional[UUID] = None
    amount: Optional[Decimal] = None  # None for full refund
    reason: Optional[str] = "Customer return / cancellation"


class RefundResponse(BaseModel):
    success: bool
    order_id: UUID
    refund_id: Optional[str] = None
    amount: Decimal
    status: str
    message: str


class PaymentReceiptResponse(BaseModel):
    order_id: UUID
    order_code: str
    customer_name: str
    customer_phone: Optional[str] = None
    delivery_address: str
    payment_method: str
    payment_status: str
    order_status: str
    subtotal: Decimal
    delivery_charge: Decimal
    total_amount: Decimal
    transaction_id: Optional[str] = None
    items: List[Dict[str, Any]]
    assigned_godown_name: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
