"""
Farmer Portal & Procurement Operations API.
Prefix: /api/v1/farmer
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_database_session, require_farmer_or_admin
from app.models.models import (
    Batch,
    Farmer,
    FarmerPayout,
    FarmerPickup,
    Godown,
    Product,
    StockMovement,
    User,
    WarehouseZone,
)
from app.schemas.farmer import (
    FarmerBatchCreateRequest,
    FarmerBatchListResponse,
    FarmerBatchResponse,
    FarmerDashboardResponse,
    FarmerPayoutListResponse,
    FarmerPayoutResponse,
    FarmerPickupCreateRequest,
    FarmerPickupListResponse,
    FarmerPickupResponse,
    FarmerProfileResponse,
    FarmerProfileUpdateRequest,
)

router = APIRouter(prefix="/farmer", tags=["Farmer Portal"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_farmer_record(user: User, db: Session) -> Farmer:
    """Resolve the Farmer record associated with the authenticated user."""
    farmer = db.query(Farmer).filter(Farmer.id == user.id).first()
    if not farmer:
        # Auto-create profile if missing for this user
        farmer_code = f"F-{random.randint(1000, 9999)}"
        farmer = Farmer(
            id=user.id,
            farmer_code=farmer_code,
            location="Tamil Nadu",
            rating=5.0,
            products_supplied=0,
            verified=True,
        )
        db.add(farmer)
        db.commit()
        db.refresh(farmer)
    return farmer


def _unique_batch_code(db: Session) -> str:
    while True:
        code = f"BATCH-MK-{random.randint(1000, 9999)}"
        if not db.query(Batch).filter(Batch.batch_code == code).first():
            return code


def _unique_pickup_code(db: Session) -> str:
    while True:
        code = f"PK-MK-{random.randint(1000, 9999)}"
        if not db.query(FarmerPickup).filter(FarmerPickup.pickup_code == code).first():
            return code


def _unique_payout_code(db: Session) -> str:
    while True:
        code = f"PO-MK-{random.randint(1000, 9999)}"
        if not db.query(FarmerPayout).filter(FarmerPayout.payout_code == code).first():
            return code


# ── Profile & Dashboard ───────────────────────────────────────────────────────

@router.get(
    "/profile",
    response_model=FarmerProfileResponse,
    summary="Farmer: view profile details",
)
def get_farmer_profile(
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_database_session),
):
    farmer = _get_farmer_record(current_user, db)
    return FarmerProfileResponse(
        id=farmer.id,
        farmer_code=farmer.farmer_code,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        location=farmer.location,
        rating=farmer.rating or 5.0,
        products_supplied=farmer.products_supplied or 0,
        verified=farmer.verified,
        status=current_user.status,
    )


@router.put(
    "/profile",
    response_model=FarmerProfileResponse,
    summary="Farmer: update profile details",
)
def update_farmer_profile(
    body: FarmerProfileUpdateRequest,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_database_session),
):
    farmer = _get_farmer_record(current_user, db)

    if body.name is not None:
        current_user.name = body.name
    if body.phone is not None:
        current_user.phone = body.phone
    if body.location is not None:
        farmer.location = body.location

    db.commit()
    db.refresh(farmer)
    db.refresh(current_user)

    return FarmerProfileResponse(
        id=farmer.id,
        farmer_code=farmer.farmer_code,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        location=farmer.location,
        rating=farmer.rating or 5.0,
        products_supplied=farmer.products_supplied or 0,
        verified=farmer.verified,
        status=current_user.status,
    )


@router.get(
    "/dashboard",
    response_model=FarmerDashboardResponse,
    summary="Farmer: dashboard KPIs, earnings and recent activity",
)
def get_farmer_dashboard(
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_database_session),
):
    farmer = _get_farmer_record(current_user, db)

    # Earnings & Payout calculations
    total_paid = db.query(func.coalesce(func.sum(FarmerPayout.amount), 0)).filter(
        FarmerPayout.farmer_id == farmer.id,
        FarmerPayout.status == "Paid",
    ).scalar() or Decimal("0.0")

    pending_payout = db.query(func.coalesce(func.sum(FarmerPayout.amount), 0)).filter(
        FarmerPayout.farmer_id == farmer.id,
        FarmerPayout.status == "Pending",
    ).scalar() or Decimal("0.0")

    total_earnings = Decimal(str(total_paid)) + Decimal(str(pending_payout))

    # Batches & Pickups count
    batches_count = db.query(Batch).filter(Batch.farmer_id == farmer.id).count()
    active_pickups_count = db.query(FarmerPickup).filter(
        FarmerPickup.farmer_id == farmer.id,
        FarmerPickup.status.in_(["Scheduled", "Driver Assigned", "In Transit"]),
    ).count()

    products_count = db.query(Product).filter(Product.farmer_id == farmer.id).count()

    # Recent items
    recent_batches_db = db.query(Batch).filter(Batch.farmer_id == farmer.id).order_by(Batch.received_date.desc()).limit(5).all()
    recent_batches = [
        FarmerBatchResponse(
            id=b.id,
            batch_code=b.batch_code,
            product_id=b.product.id if b.product else uuid.uuid4(),
            product_name=b.product.name if b.product else "Produce",
            product_category=b.product.category if b.product else "Agricultural",
            quantity=Decimal(str(b.quantity)),
            unit=b.product.unit if b.product else "kg",
            received_date=b.received_date,
            harvest_date=b.harvest_date,
            expiry_date=b.expiry_date,
            status=b.status,
            quality_status=b.quality_status,
        )
        for b in recent_batches_db
    ]

    recent_pickups_db = db.query(FarmerPickup).filter(FarmerPickup.farmer_id == farmer.id).order_by(FarmerPickup.created_at.desc()).limit(5).all()
    recent_pickups = [
        FarmerPickupResponse(
            id=p.id,
            pickup_code=p.pickup_code,
            farmer_id=p.farmer_id,
            product_id=p.product_id,
            product_name=p.product.name if p.product else "Produce",
            quantity=Decimal(str(p.quantity)),
            unit=p.unit,
            scheduled_date=p.scheduled_date,
            pickup_location=p.pickup_location,
            status=p.status,
            assigned_driver_id=p.assigned_driver_id,
            assigned_driver_name=p.assigned_driver.user.name if p.assigned_driver and p.assigned_driver.user else None,
            assigned_vehicle_number=p.assigned_vehicle.number if p.assigned_vehicle else None,
            completed_at=p.completed_at,
            notes=p.notes,
            created_at=p.created_at,
        )
        for p in recent_pickups_db
    ]

    recent_payouts_db = db.query(FarmerPayout).filter(FarmerPayout.farmer_id == farmer.id).order_by(FarmerPayout.created_at.desc()).limit(5).all()
    recent_payouts = [
        FarmerPayoutResponse(
            id=po.id,
            payout_code=po.payout_code,
            farmer_id=po.farmer_id,
            amount=Decimal(str(po.amount)),
            payment_method=po.payment_method,
            status=po.status,
            reference_number=po.reference_number,
            processed_at=po.processed_at,
            notes=po.notes,
            created_at=po.created_at,
        )
        for po in recent_payouts_db
    ]

    return FarmerDashboardResponse(
        farmer_id=farmer.id,
        farmer_code=farmer.farmer_code,
        name=current_user.name,
        location=farmer.location,
        rating=farmer.rating or 5.0,
        total_earnings=Decimal(str(total_earnings)),
        pending_payouts=Decimal(str(pending_payout)),
        total_batches_supplied=batches_count,
        active_pickup_requests=active_pickups_count,
        products_count=products_count,
        recent_batches=recent_batches,
        recent_pickups=recent_pickups,
        recent_payouts=recent_payouts,
    )


# ── Batches ───────────────────────────────────────────────────────────────────

@router.get(
    "/batches",
    response_model=FarmerBatchListResponse,
    summary="Farmer: list produce batches",
)
def list_farmer_batches(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_database_session),
):
    farmer = _get_farmer_record(current_user, db)
    q = db.query(Batch).filter(Batch.farmer_id == farmer.id)
    if status_filter:
        q = q.filter(Batch.status.ilike(f"%{status_filter}%"))
    batches = q.order_by(Batch.received_date.desc()).all()

    items = [
        FarmerBatchResponse(
            id=b.id,
            batch_code=b.batch_code,
            product_id=b.product_id,
            product_name=b.product.name if b.product else "Produce",
            product_category=b.product.category if b.product else "Agricultural",
            quantity=Decimal(str(b.quantity)),
            unit=b.product.unit if b.product else "kg",
            received_date=b.received_date,
            harvest_date=b.harvest_date,
            expiry_date=b.expiry_date,
            status=b.status,
            quality_status=b.quality_status,
        )
        for b in batches
    ]
    return FarmerBatchListResponse(items=items, total=len(items))


@router.post(
    "/batches",
    response_model=FarmerBatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Farmer: register new harvest batch",
)
def create_farmer_batch(
    body: FarmerBatchCreateRequest,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_database_session),
):
    farmer = _get_farmer_record(current_user, db)
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    storage_zone = None
    if body.storage_zone_id:
        storage_zone = db.query(WarehouseZone).filter(WarehouseZone.id == body.storage_zone_id).first()
    if not storage_zone:
        storage_zone = db.query(WarehouseZone).first()

    if not storage_zone:
        godown = db.query(Godown).first()
        if not godown:
            godown = Godown(
                name="Central Central Warehouse",
                code="MK-WH-01",
                location="Tamil Nadu",
                capacity=10000.0,
                status="Active",
            )
            db.add(godown)
            db.flush()
        storage_zone = WarehouseZone(
            godown_id=godown.id,
            name="General Grains Section",
            category="Rice & Grains",
            capacity=Decimal("50000.00"),
            current_stock=Decimal("0.00"),
        )
        db.add(storage_zone)
        db.flush()

    batch_code = _unique_batch_code(db)
    batch = Batch(
        batch_code=batch_code,
        product_id=product.id,
        farmer_id=farmer.id,
        quantity=body.quantity,
        received_date=datetime.utcnow(),
        harvest_date=body.harvest_date or datetime.utcnow().strftime("%d %b %Y"),
        expiry_date=body.expiry_date,
        storage_zone_id=storage_zone.id,
        status="Active",
        quality_status=body.quality_status,
    )
    db.add(batch)

    # Increment available product stock
    prev_qty = Decimal(str(product.available_qty or 0))
    product.available_qty = prev_qty + body.quantity
    product.availability = "Available"

    # Log movement
    movement = StockMovement(
        product_id=product.id,
        prev_qty=prev_qty,
        changed_qty=body.quantity,
        new_qty=product.available_qty,
        reason=f"Farmer Batch Harvest: {batch.batch_code}",
        user_id=current_user.id,
        date=datetime.utcnow(),
        type="Addition",
    )
    db.add(movement)

    # Increment farmer product count
    farmer.products_supplied = (farmer.products_supplied or 0) + 1

    db.commit()
    db.refresh(batch)

    return FarmerBatchResponse(
        id=batch.id,
        batch_code=batch.batch_code,
        product_id=product.id,
        product_name=product.name,
        product_category=product.category,
        quantity=Decimal(str(batch.quantity)),
        unit=product.unit,
        received_date=batch.received_date,
        harvest_date=batch.harvest_date,
        expiry_date=batch.expiry_date,
        status=batch.status,
        quality_status=batch.quality_status,
    )


# ── Pickups ───────────────────────────────────────────────────────────────────

@router.get(
    "/pickups",
    response_model=FarmerPickupListResponse,
    summary="Farmer: list scheduled crop pickups",
)
def list_farmer_pickups(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_database_session),
):
    farmer = _get_farmer_record(current_user, db)
    q = db.query(FarmerPickup).filter(FarmerPickup.farmer_id == farmer.id)
    if status_filter:
        q = q.filter(FarmerPickup.status == status_filter)
    pickups = q.order_by(FarmerPickup.created_at.desc()).all()

    items = [
        FarmerPickupResponse(
            id=p.id,
            pickup_code=p.pickup_code,
            farmer_id=p.farmer_id,
            product_id=p.product_id,
            product_name=p.product.name if p.product else "Produce",
            quantity=Decimal(str(p.quantity)),
            unit=p.unit,
            scheduled_date=p.scheduled_date,
            pickup_location=p.pickup_location,
            status=p.status,
            assigned_driver_id=p.assigned_driver_id,
            assigned_driver_name=p.assigned_driver.user.name if p.assigned_driver and p.assigned_driver.user else None,
            assigned_vehicle_number=p.assigned_vehicle.number if p.assigned_vehicle else None,
            completed_at=p.completed_at,
            notes=p.notes,
            created_at=p.created_at,
        )
        for p in pickups
    ]
    return FarmerPickupListResponse(items=items, total=len(items))


@router.post(
    "/pickups",
    response_model=FarmerPickupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Farmer: request procurement pickup from farm",
)
def request_crop_pickup(
    body: FarmerPickupCreateRequest,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_database_session),
):
    farmer = _get_farmer_record(current_user, db)
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    pickup_code = _unique_pickup_code(db)
    pickup = FarmerPickup(
        pickup_code=pickup_code,
        farmer_id=farmer.id,
        product_id=product.id,
        quantity=body.quantity,
        unit=body.unit or product.unit,
        scheduled_date=body.scheduled_date or datetime.utcnow(),
        pickup_location=body.pickup_location,
        status="Scheduled",
        notes=body.notes,
        created_at=datetime.utcnow(),
    )
    db.add(pickup)
    db.commit()
    db.refresh(pickup)

    return FarmerPickupResponse(
        id=pickup.id,
        pickup_code=pickup.pickup_code,
        farmer_id=pickup.farmer_id,
        product_id=product.id,
        product_name=product.name,
        quantity=Decimal(str(pickup.quantity)),
        unit=pickup.unit,
        scheduled_date=pickup.scheduled_date,
        pickup_location=pickup.pickup_location,
        status=pickup.status,
        assigned_driver_id=None,
        assigned_driver_name=None,
        assigned_vehicle_number=None,
        completed_at=None,
        notes=pickup.notes,
        created_at=pickup.created_at,
    )


# ── Earnings & Payouts ────────────────────────────────────────────────────────

@router.get(
    "/payouts",
    response_model=FarmerPayoutListResponse,
    summary="Farmer: view procurement earnings & payouts ledger",
)
def list_farmer_payouts(
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_database_session),
):
    farmer = _get_farmer_record(current_user, db)
    payouts = db.query(FarmerPayout).filter(FarmerPayout.farmer_id == farmer.id).order_by(FarmerPayout.created_at.desc()).all()

    total_paid = Decimal("0.0")
    total_pending = Decimal("0.0")

    items = []
    for po in payouts:
        amt = Decimal(str(po.amount))
        if po.status == "Paid":
            total_paid += amt
        else:
            total_pending += amt

        items.append(
            FarmerPayoutResponse(
                id=po.id,
                payout_code=po.payout_code,
                farmer_id=po.farmer_id,
                amount=amt,
                payment_method=po.payment_method,
                status=po.status,
                reference_number=po.reference_number,
                processed_at=po.processed_at,
                notes=po.notes,
                created_at=po.created_at,
            )
        )

    return FarmerPayoutListResponse(
        items=items,
        total=len(items),
        total_paid=total_paid,
        total_pending=total_pending,
    )
