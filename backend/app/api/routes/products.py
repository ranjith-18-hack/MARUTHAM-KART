"""
Products routes — customer browsing and godown management.

Customer endpoints (read-only, active products only):
  GET  /api/v1/products              — paginated list with search/filter
  GET  /api/v1/products/{id}         — product detail
  GET  /api/v1/products/categories   — distinct category list

Godown management endpoints (GODOWN_MANAGER or ADMIN):
  POST  /api/v1/products             — create product
  PATCH /api/v1/products/{id}        — update product info or status
  POST  /api/v1/products/{id}/stock  — adjust stock quantity
"""
from __future__ import annotations
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from app.core.dependencies import (
    get_database_session,
    require_godown_or_admin,
)
from app.models.models import Farmer, Product, StockMovement, User
from app.schemas.products import (
    ProductCreateRequest,
    ProductListResponse,
    ProductResponse,
    ProductUpdateRequest,
    StockUpdateRequest,
)

router = APIRouter(prefix="/products", tags=["Products"])

# Optional auth — does not raise 401 if no token present
_optional_bearer = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def _get_optional_user(
    db: Session = Depends(get_database_session),
    token: Optional[str] = Depends(_optional_bearer),
) -> Optional[User]:
    if not token:
        return None
    try:
        from app.core.security import decode_token
        import jwt
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id or payload.get("type") != "access":
            return None
        return db.query(User).filter(User.id == user_id, User.status == "Active").first()
    except Exception:
        return None


def _to_response(p: Product) -> ProductResponse:
    farmer_name = None
    farmer_location = "Tamil Nadu"
    farmer_verified = True
    farmer_code = None

    if p.farmer:
        farmer_location = p.farmer.location or "Tamil Nadu"
        farmer_verified = p.farmer.verified if p.farmer.verified is not None else True
        farmer_code = p.farmer.farmer_code
        if p.farmer.user and p.farmer.user.name:
            farmer_name = p.farmer.user.name
        else:
            farmer_name = "Marutham Organic Farm"
    else:
        farmer_name = "Marutham Organic Farm"

    return ProductResponse(
        id=p.id,
        name=p.name,
        category=p.category,
        description=p.description,
        unit=p.unit,
        price=p.price,
        available_qty=p.available_qty,
        availability=p.availability,
        status=p.status,
        rating=p.rating or 4.9,
        image_url=p.image_url,
        quality_info=p.quality_info,
        harvest_date=p.harvest_date,
        delivery_estimate=p.delivery_estimate,
        farmer_id=p.farmer_id,
        farmer_name=farmer_name,
        farmer_location=farmer_location,
        farmer_verified=farmer_verified,
        farmer_code=farmer_code,
        created_at=None,
        updated_at=None,
    )


# ── Customer: list products ───────────────────────────────────────────────────

@router.get(
    "",
    response_model=ProductListResponse,
    summary="List available products (customers see only active, in-stock items)",
)
def list_products(
    search: Optional[str] = Query(None, description="Search by name or category"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort_by: Optional[str] = Query("name", description="name, price_asc, price_desc, rating, newest"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_database_session),
    current_user: Optional[User] = Depends(_get_optional_user),
):
    query = db.query(Product).options(joinedload(Product.farmer).joinedload(Farmer.user))

    # Non-godown/admin users only see Active products
    is_staff = current_user and current_user.role.upper() in (
        "ADMIN", "GODOWN_MANAGER", "EMPLOYEE"
    )
    if not is_staff:
        query = query.filter(Product.status == "Active", Product.available_qty > 0)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(Product.name.ilike(pattern), Product.category.ilike(pattern), Product.description.ilike(pattern))
        )
    if category and category.lower() != "all":
        query = query.filter(Product.category.ilike(f"%{category}%"))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Apply sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.rating.desc().nullslast())
    else:
        query = query.order_by(Product.name.asc())

    total = query.count()
    products = query.offset(skip).limit(limit).all()

    return ProductListResponse(
        items=[_to_response(p) for p in products],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── Customer: categories ──────────────────────────────────────────────────────

@router.get(
    "/categories",
    response_model=list[str],
    summary="Get distinct product categories",
)
def list_categories(db: Session = Depends(get_database_session)):
    rows = (
        db.query(Product.category)
        .filter(Product.status == "Active")
        .distinct()
        .order_by(Product.category)
        .all()
    )
    return [r[0] for r in rows]


# ── Customer: product detail ──────────────────────────────────────────────────

@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get product detail",
)
def get_product(
    product_id: UUID,
    db: Session = Depends(get_database_session),
    current_user: Optional[User] = Depends(_get_optional_user),
):
    product = (
        db.query(Product)
        .options(joinedload(Product.farmer).joinedload(Farmer.user))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    is_staff = current_user and current_user.role.upper() in ("ADMIN", "GODOWN_MANAGER", "EMPLOYEE")
    if not is_staff and product.status != "Active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return _to_response(product)


# ── Godown: create product ────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Godown: create a new product",
)
def create_product(
    body: ProductCreateRequest,
    db: Session = Depends(get_database_session),
    _staff: User = Depends(require_godown_or_admin),
):
    # Validate farmer exists
    farmer = db.query(Farmer).filter(Farmer.id == body.farmer_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farmer with id {body.farmer_id} not found.",
        )

    availability = "Available" if body.available_qty > 0 else "Out of Stock"
    product = Product(
        name=body.name,
        category=body.category,
        description=body.description,
        unit=body.unit,
        price=body.price,
        available_qty=body.available_qty,
        availability=availability,
        status="Active",
        image_url=body.image_url,
        farmer_id=body.farmer_id,
        quality_info=body.quality_info,
        harvest_date=body.harvest_date,
        delivery_estimate=body.delivery_estimate,
        min_bulk_qty=body.min_bulk_qty,
        price_tiers=body.price_tiers,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return _to_response(product)


# ── Godown: update product ────────────────────────────────────────────────────

@router.patch(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Godown: update product info, price, status, or stock",
)
def update_product(
    product_id: UUID,
    body: ProductUpdateRequest,
    db: Session = Depends(get_database_session),
    _staff: User = Depends(require_godown_or_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(product, field, value)

    # Sync availability flag
    if product.available_qty is not None:
        if float(product.available_qty) <= 0:
            product.availability = "Out of Stock"
        elif float(product.available_qty) < 20:
            product.availability = "Low Stock"
        else:
            product.availability = "Available"

    db.commit()
    db.refresh(product)
    return _to_response(product)


# ── Godown: stock adjustment ──────────────────────────────────────────────────

@router.post(
    "/{product_id}/stock",
    response_model=ProductResponse,
    summary="Godown: adjust product stock quantity",
)
def adjust_stock(
    product_id: UUID,
    body: StockUpdateRequest,
    db: Session = Depends(get_database_session),
    staff: User = Depends(require_godown_or_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    new_qty = float(product.available_qty) + float(body.quantity_change)
    if new_qty < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stock adjustment would result in negative stock ({new_qty:.2f}).",
        )

    prev_qty = float(product.available_qty)
    product.available_qty = new_qty

    # Update availability flag
    if new_qty <= 0:
        product.availability = "Out of Stock"
    elif new_qty < 20:
        product.availability = "Low Stock"
    else:
        product.availability = "Available"

    # Record stock movement
    movement = StockMovement(
        product_id=product.id,
        prev_qty=prev_qty,
        changed_qty=float(body.quantity_change),
        new_qty=new_qty,
        reason=body.reason,
        user_id=staff.id,
        type="Addition" if body.quantity_change > 0 else "Removal",
    )
    db.add(movement)
    db.commit()
    db.refresh(product)
    return _to_response(product)
