"""
Shopping cart routes — customers only.

Endpoints:
  GET    /api/v1/cart          — view current cart
  POST   /api/v1/cart/items    — add item to cart
  PATCH  /api/v1/cart/items/{item_id} — update item quantity
  DELETE /api/v1/cart/items/{item_id} — remove item
  DELETE /api/v1/cart          — clear entire cart
"""
from __future__ import annotations
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_database_session, require_customer
from app.models.models import Cart, CartItem, Product, User
from app.schemas.cart import (
    CartItemAddRequest,
    CartItemResponse,
    CartItemUpdateRequest,
    CartResponse,
)

router = APIRouter(prefix="/cart", tags=["Cart"])

DELIVERY_CHARGE = Decimal("40.00")  # ₹40 flat delivery charge


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_or_create_cart(customer: User, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.customer_id == customer.id).first()
    if not cart:
        cart = Cart(customer_id=customer.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _build_item_response(item: CartItem) -> CartItemResponse:
    qty = Decimal(str(item.quantity))
    price = Decimal(str(item.unit_price))
    return CartItemResponse(
        id=item.id,
        product_id=item.product_id,
        product_name=item.product.name,
        product_image_url=item.product.image_url,
        unit=item.product.unit,
        quantity=qty,
        unit_price=price,
        subtotal=(qty * price).quantize(Decimal("0.01")),
        available_qty=Decimal(str(item.product.available_qty)),
        added_at=item.added_at,
    )


def _build_cart_response(cart: Cart) -> CartResponse:
    from datetime import datetime
    item_responses = [_build_item_response(i) for i in cart.items]
    subtotal = sum(i.subtotal for i in item_responses) if item_responses else Decimal("0.00")
    delivery = DELIVERY_CHARGE if subtotal > 0 else Decimal("0.00")
    return CartResponse(
        id=cart.id,
        customer_id=cart.customer_id,
        items=item_responses,
        item_count=len(item_responses),
        subtotal=subtotal,
        delivery_charge=delivery,
        total=(subtotal + delivery).quantize(Decimal("0.01")),
        updated_at=cart.updated_at or cart.created_at,
    )


def _check_stock(product: Product, requested_qty: Decimal, existing_qty: Decimal = Decimal("0")) -> None:
    """Raise 400 if requested_qty exceeds available stock."""
    available = Decimal(str(product.available_qty))
    total_needed = requested_qty  # existing already reserved separately
    if total_needed > available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Insufficient stock for '{product.name}'. "
                f"Requested: {requested_qty}, Available: {available}."
            ),
        )


# ── View Cart ─────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=CartResponse,
    summary="View current customer cart",
)
def get_cart(
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    cart = _get_or_create_cart(customer, db)
    return _build_cart_response(cart)


# ── Add Item ──────────────────────────────────────────────────────────────────

@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a product to cart or update quantity if already present",
)
def add_item(
    body: CartItemAddRequest,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    cart = _get_or_create_cart(customer, db)

    product = db.query(Product).filter(
        Product.id == body.product_id,
        Product.status == "Active",
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or not available.",
        )

    requested_qty = Decimal(str(body.quantity))
    _check_stock(product, requested_qty)

    # Check if already in cart
    existing = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == product.id,
    ).first()

    if existing:
        new_qty = Decimal(str(existing.quantity)) + requested_qty
        _check_stock(product, new_qty)
        existing.quantity = new_qty
        existing.unit_price = product.price  # refresh price
    else:
        item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=requested_qty,
            unit_price=product.price,
        )
        db.add(item)

    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)


# ── Update Item ───────────────────────────────────────────────────────────────

@router.patch(
    "/items/{item_id}",
    response_model=CartResponse,
    summary="Update quantity of a cart item",
)
def update_item(
    item_id: UUID,
    body: CartItemUpdateRequest,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    cart = _get_or_create_cart(customer, db)
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found.",
        )

    new_qty = Decimal(str(body.quantity))
    _check_stock(item.product, new_qty)

    item.quantity = new_qty
    item.unit_price = item.product.price  # always refresh price from DB
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)


# ── Remove Item ───────────────────────────────────────────────────────────────

@router.delete(
    "/items/{item_id}",
    response_model=CartResponse,
    summary="Remove a specific item from the cart",
)
def remove_item(
    item_id: UUID,
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    cart = _get_or_create_cart(customer, db)
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found.",
        )

    db.delete(item)
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)


# ── Clear Cart ────────────────────────────────────────────────────────────────

@router.delete(
    "",
    response_model=CartResponse,
    summary="Clear all items from the cart",
)
def clear_cart(
    customer: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    cart = _get_or_create_cart(customer, db)
    for item in list(cart.items):
        db.delete(item)
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)
