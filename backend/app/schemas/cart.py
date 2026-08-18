"""
Pydantic schemas for the shopping cart.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field


class CartItemAddRequest(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0, description="Must be greater than 0")


class CartItemUpdateRequest(BaseModel):
    quantity: Decimal = Field(..., gt=0, description="New quantity; must be > 0")


class CartItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    product_image_url: Optional[str]
    unit: str
    quantity: Decimal
    unit_price: Decimal
    subtotal: Decimal
    available_qty: Decimal  # current stock snapshot for frontend validation
    added_at: datetime

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    id: UUID
    customer_id: UUID
    items: list[CartItemResponse]
    item_count: int
    subtotal: Decimal
    delivery_charge: Decimal
    total: Decimal
    updated_at: datetime

    model_config = {"from_attributes": True}
