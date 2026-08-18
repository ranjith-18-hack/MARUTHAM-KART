"""
Pydantic schemas for Products (customer-facing and godown management).
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    unit: str = Field(..., min_length=1, max_length=50)
    price: Decimal = Field(..., gt=0, description="Selling price per unit")
    image_url: Optional[str] = None
    quality_info: Optional[str] = None
    harvest_date: Optional[str] = None
    delivery_estimate: Optional[str] = None


class ProductCreateRequest(ProductBase):
    """Used by Godown Manager to add a new product."""
    farmer_id: UUID
    available_qty: Decimal = Field(default=Decimal("0"), ge=0)
    min_bulk_qty: Optional[Decimal] = None
    price_tiers: Optional[list] = None


class ProductUpdateRequest(BaseModel):
    """All fields optional — godown manager can patch any subset."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    image_url: Optional[str] = None
    quality_info: Optional[str] = None
    harvest_date: Optional[str] = None
    delivery_estimate: Optional[str] = None
    status: Optional[str] = None  # Active | Inactive
    available_qty: Optional[Decimal] = Field(None, ge=0)
    min_bulk_qty: Optional[Decimal] = None
    price_tiers: Optional[list] = None


class StockUpdateRequest(BaseModel):
    """Godown: adjust available quantity and reason."""
    quantity_change: Decimal = Field(..., description="Positive to add, negative to remove")
    reason: str = Field(..., min_length=1, max_length=255)


class ProductResponse(BaseModel):
    id: UUID
    name: str
    category: str
    description: Optional[str]
    unit: str
    price: Decimal
    available_qty: Decimal
    availability: str
    status: str
    rating: float
    image_url: Optional[str]
    quality_info: Optional[str]
    harvest_date: Optional[str]
    delivery_estimate: Optional[str]
    farmer_id: UUID
    farmer_name: Optional[str] = None
    farmer_location: Optional[str] = None
    farmer_verified: Optional[bool] = True
    farmer_code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    skip: int
    limit: int
