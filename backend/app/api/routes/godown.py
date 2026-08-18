"""
Phase 5 — Godown / Warehouse Operations Routes.

Endpoints:
  GET    /api/v1/godown/dashboard
  GET    /api/v1/godown/inventory
  GET    /api/v1/godown/inventory/{product_id}
  PATCH  /api/v1/godown/inventory/{product_id}/location
  POST   /api/v1/godown/stock-adjustments
  GET    /api/v1/godown/stock-movements
  GET    /api/v1/godown/orders
  GET    /api/v1/godown/orders/{order_id}
  POST   /api/v1/godown/orders/{order_id}/pick
  POST   /api/v1/godown/orders/{order_id}/pack
  POST   /api/v1/godown/orders/{order_id}/ready
  GET    /api/v1/godown/alerts
  PATCH  /api/v1/godown/alerts/{alert_id}/resolve
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_database_session,
    require_godown_or_admin,
    RoleChecker,
)
from app.models.models import (
    AuditLog,
    Delivery,
    Godown,
    GodownAlert,
    GodownUserAssignment,
    InventoryReservation,
    Order,
    OrderItem,
    OrderStatusHistory,
    PackingRecord,
    PickingRecord,
    Product,
    ProductLocation,
    StockMovement,
    User,
)
from app.core.events import (
    emit_event,
    EVENT_PICKING_STARTED,
    EVENT_INVENTORY_SHORTAGE_DETECTED,
    EVENT_PACKING_COMPLETED,
    EVENT_ORDER_READY_FOR_DISPATCH,
)
from app.core.sla import process_auto_assignment_for_order
from app.schemas.godown import (
    GodownAlertListResponse,
    GodownAlertResponse,
    GodownDashboardResponse,
    GodownOrderItemResponse,
    GodownOrderListResponse,
    GodownOrderResponse,
    InventoryItemResponse,
    InventoryListResponse,
    PackingRecordResponse,
    PackingRequest,
    PickingRecordResponse,
    PickingRequest,
    ProductLocationRequest,
    ProductLocationResponse,
    StockAdjustmentRequest,
    StockMovementListResponse,
    StockMovementResponse,
)

router = APIRouter(prefix="/godown", tags=["Godown / Warehouse"])

# Roles allowed to perform godown operations
require_godown_staff = RoleChecker(["GODOWN_MANAGER", "EMPLOYEE", "ADMIN"])


# ── Access helpers ─────────────────────────────────────────────────────────────

LOW_STOCK_THRESHOLD = Decimal("20.0")  # qty below this → Low Stock alert


def _get_user_godown_id(user: User, db: Session) -> Optional[UUID]:
    """Return the godown the user is assigned to, or None if ADMIN."""
    if user.role.upper() == "ADMIN":
        return None  # Admin has access to all
    assignment = (
        db.query(GodownUserAssignment)
        .filter(
            GodownUserAssignment.user_id == user.id,
            GodownUserAssignment.is_active == True,
        )
        .first()
    )
    return assignment.godown_id if assignment else None


def _build_godown_order_response(order: Order, db: Session) -> GodownOrderResponse:
    """Build a detailed GodownOrderResponse including picking statuses."""
    items: List[GodownOrderItemResponse] = []
    for oi in order.order_items:
        product = oi.product
        picking = (
            db.query(PickingRecord)
            .filter(
                PickingRecord.order_id == order.id,
                PickingRecord.order_item_id == oi.id,
            )
            .first()
        )
        items.append(
            GodownOrderItemResponse(
                order_item_id=oi.id,
                product_id=oi.product_id,
                product_name=product.name,
                quantity=Decimal(str(oi.quantity)),
                unit=oi.unit,
                available_qty=Decimal(str(product.available_qty)),
                picking_status=picking.status if picking else None,
                picked_qty=Decimal(str(picking.picked_qty)) if picking else None,
            )
        )

    # Packing record if exists
    packing_record = (
        db.query(PackingRecord)
        .filter(PackingRecord.order_id == order.id)
        .first()
    )
    packing = (
        PackingRecordResponse(
            id=packing_record.id,
            order_id=packing_record.order_id,
            package_count=packing_record.package_count,
            total_weight_kg=(
                Decimal(str(packing_record.total_weight_kg))
                if packing_record.total_weight_kg
                else None
            ),
            notes=packing_record.notes,
            packed_at=packing_record.packed_at,
            status=packing_record.status,
        )
        if packing_record
        else None
    )

    customer_name = order.customer.name if order.customer else "Unknown"

    return GodownOrderResponse(
        id=order.id,
        order_code=order.order_code,
        customer_name=customer_name,
        status=order.status,
        total_amount=Decimal(str(order.total_amount)),
        delivery_address=order.delivery_address,
        created_at=order.created_at,
        items=items,
        packing=packing,
    )


def _ensure_alert(
    db: Session,
    product: Product,
    godown_id: Optional[UUID],
    alert_type: str,
    message: str,
    severity: str = "High",
) -> None:
    """Create a GodownAlert if one doesn't already exist (unresolved)."""
    existing = (
        db.query(GodownAlert)
        .filter(
            GodownAlert.product_id == product.id,
            GodownAlert.alert_type == alert_type,
            GodownAlert.is_resolved == False,
        )
        .first()
    )
    if not existing:
        db.add(
            GodownAlert(
                godown_id=godown_id,
                product_id=product.id,
                alert_type=alert_type,
                severity=severity,
                message=message,
            )
        )


# ── 1. Dashboard ──────────────────────────────────────────────────────────────

@router.get(
    "/dashboard",
    response_model=GodownDashboardResponse,
    summary="Godown: dashboard summary",
)
def godown_dashboard(
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    from app.models.models import Godown

    godown_id = _get_user_godown_id(current_user, db)

    # Godown info
    godown_name = None
    godown_location = None
    if godown_id:
        gd = db.query(Godown).filter(Godown.id == godown_id).first()
        if gd:
            godown_name = gd.name
            godown_location = gd.location

    # Products
    total_products = db.query(Product).filter(Product.status == "Active").count()
    low_stock_count = (
        db.query(Product)
        .filter(
            Product.status == "Active",
            Product.availability == "Low Stock",
        )
        .count()
    )
    out_of_stock_count = (
        db.query(Product)
        .filter(
            Product.status == "Active",
            Product.availability == "Out of Stock",
        )
        .count()
    )

    # Order counts
    def _order_count(s: str) -> int:
        return db.query(Order).filter(Order.status == s).count()

    pending = _order_count("Pending")
    processing = _order_count("Processing")
    picking = _order_count("Picking")
    packing = _order_count("Packing")
    ready = _order_count("Ready for Dispatch")

    # Alerts
    alert_q = db.query(GodownAlert).filter(GodownAlert.is_resolved == False)
    if godown_id:
        alert_q = alert_q.filter(GodownAlert.godown_id == godown_id)
    unresolved_alerts = alert_q.count()

    # Stock movements in last 7 days
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_movements = (
        db.query(StockMovement)
        .filter(StockMovement.date >= week_ago)
        .count()
    )

    return GodownDashboardResponse(
        godown_id=godown_id,
        godown_name=godown_name,
        godown_location=godown_location,
        total_products=total_products,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        pending_orders=pending,
        processing_orders=processing,
        picking_orders=picking,
        packing_orders=packing,
        ready_for_dispatch_orders=ready,
        unresolved_alerts=unresolved_alerts,
        recent_stock_movements=recent_movements,
    )


# ── 2. Inventory Listing ──────────────────────────────────────────────────────

@router.get(
    "/inventory",
    response_model=InventoryListResponse,
    summary="Godown: list all products with current inventory",
)
def list_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    category: Optional[str] = None,
    availability: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    godown_id = _get_user_godown_id(current_user, db)

    q = db.query(Product)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    if category:
        q = q.filter(Product.category == category)
    if availability:
        q = q.filter(Product.availability == availability)

    total = q.count()
    products = q.order_by(Product.name).offset(skip).limit(limit).all()

    items = []
    for p in products:
        location = (
            db.query(ProductLocation)
            .filter(
                ProductLocation.product_id == p.id,
                ProductLocation.godown_id == godown_id,
            )
            .first()
            if godown_id
            else None
        )
        items.append(
            InventoryItemResponse(
                product_id=p.id,
                product_name=p.name,
                category=p.category,
                unit=p.unit,
                available_qty=Decimal(str(p.available_qty)),
                status=p.status,
                availability=p.availability,
                price=Decimal(str(p.price)),
                location=(
                    ProductLocationResponse(
                        rack=location.rack,
                        shelf=location.shelf,
                        bin=location.bin,
                        notes=location.notes,
                    )
                    if location
                    else None
                ),
            )
        )

    return InventoryListResponse(items=items, total=total, skip=skip, limit=limit)


# ── 3. Inventory Detail (single product) ──────────────────────────────────────

@router.get(
    "/inventory/{product_id}",
    response_model=InventoryItemResponse,
    summary="Godown: view a single product's inventory details",
)
def get_inventory_product(
    product_id: UUID,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    godown_id = _get_user_godown_id(current_user, db)
    location = (
        db.query(ProductLocation)
        .filter(
            ProductLocation.product_id == product_id,
            ProductLocation.godown_id == godown_id,
        )
        .first()
        if godown_id
        else None
    )

    return InventoryItemResponse(
        product_id=product.id,
        product_name=product.name,
        category=product.category,
        unit=product.unit,
        available_qty=Decimal(str(product.available_qty)),
        status=product.status,
        availability=product.availability,
        price=Decimal(str(product.price)),
        location=(
            ProductLocationResponse(
                rack=location.rack,
                shelf=location.shelf,
                bin=location.bin,
                notes=location.notes,
            )
            if location
            else None
        ),
    )


# ── 4. Update Product Location ─────────────────────────────────────────────────

@router.patch(
    "/inventory/{product_id}/location",
    response_model=ProductLocationResponse,
    summary="Godown: set or update product physical location",
)
def update_product_location(
    product_id: UUID,
    body: ProductLocationRequest,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    godown_id = _get_user_godown_id(current_user, db)
    if not godown_id:
        # Admin: require godown_id query param in future; for now use first godown
        from app.models.models import Godown
        gd = db.query(Godown).first()
        if not gd:
            raise HTTPException(status_code=400, detail="No godown exists yet.")
        godown_id = gd.id

    location = (
        db.query(ProductLocation)
        .filter(
            ProductLocation.product_id == product_id,
            ProductLocation.godown_id == godown_id,
        )
        .first()
    )
    if not location:
        location = ProductLocation(product_id=product_id, godown_id=godown_id)
        db.add(location)

    location.rack = body.rack
    location.shelf = body.shelf
    location.bin = body.bin
    location.notes = body.notes

    db.commit()
    db.refresh(location)

    return ProductLocationResponse(
        rack=location.rack,
        shelf=location.shelf,
        bin=location.bin,
        notes=location.notes,
    )


# ── 5. Stock Adjustment ───────────────────────────────────────────────────────

VALID_MOVEMENT_TYPES = {"RECEIPT", "ADJUSTMENT", "DAMAGE", "RETURN", "TRANSFER", "RESERVATION", "RELEASE", "SALE"}


@router.post(
    "/stock-adjustments",
    response_model=StockMovementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Godown: adjust product stock (add/remove) with movement record",
)
def adjust_stock(
    body: StockAdjustmentRequest,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    if body.movement_type.upper() not in VALID_MOVEMENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid movement_type. Allowed: {', '.join(sorted(VALID_MOVEMENT_TYPES))}",
        )

    # Lock product row
    product = (
        db.query(Product)
        .with_for_update()
        .filter(Product.id == body.product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    prev_qty = Decimal(str(product.available_qty))
    new_qty = prev_qty + body.quantity

    if new_qty < Decimal("0"):
        raise HTTPException(
            status_code=400,
            detail=f"Stock cannot go negative. Current: {prev_qty}, requested change: {body.quantity}.",
        )

    # Update product stock & availability
    product.available_qty = float(new_qty)
    if new_qty <= 0:
        product.availability = "Out of Stock"
    elif new_qty < LOW_STOCK_THRESHOLD:
        product.availability = "Low Stock"
    else:
        product.availability = "Available"

    # Create stock movement record
    movement = StockMovement(
        product_id=product.id,
        prev_qty=prev_qty,
        changed_qty=body.quantity,
        new_qty=new_qty,
        reason=body.reason,
        user_id=current_user.id,
        type=body.movement_type.upper(),
    )
    db.add(movement)

    # Check if we need to update minimum stock level (if product supports it)
    # We track this via GodownAlert threshold — optional
    if body.min_stock_level is not None:
        # Store as a note; in a future version, add min_stock_level column to Product
        pass  # placeholder for min_stock_level column (not in Phase 4 schema)

    # Low-stock / out-of-stock alerts
    godown_id = _get_user_godown_id(current_user, db)
    if product.availability == "Out of Stock":
        _ensure_alert(
            db, product, godown_id,
            "OUT_OF_STOCK",
            f"Product '{product.name}' is out of stock.",
            severity="Critical",
        )
    elif product.availability == "Low Stock":
        _ensure_alert(
            db, product, godown_id,
            "LOW_STOCK",
            f"Product '{product.name}' stock is low ({new_qty} {product.unit}).",
            severity="High",
        )

    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Stock Adjustment",
        entity_type="Product",
        entity_id=str(product.id),
        previous_value={"available_qty": str(prev_qty)},
        new_value={"available_qty": str(new_qty), "type": body.movement_type},
        reason=body.reason,
    ))

    db.commit()
    db.refresh(movement)

    return StockMovementResponse(
        id=movement.id,
        product_id=movement.product_id,
        product_name=product.name,
        prev_qty=Decimal(str(movement.prev_qty)),
        changed_qty=Decimal(str(movement.changed_qty)),
        new_qty=Decimal(str(movement.new_qty)),
        reason=movement.reason,
        type=movement.type,
        user_id=movement.user_id,
        date=movement.date,
    )


# ── 6. Stock Movements (history) ──────────────────────────────────────────────

@router.get(
    "/stock-movements",
    response_model=StockMovementListResponse,
    summary="Godown: view stock movement history",
)
def list_stock_movements(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    product_id: Optional[UUID] = None,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    q = db.query(StockMovement)
    if product_id:
        q = q.filter(StockMovement.product_id == product_id)
    total = q.count()
    movements = q.order_by(StockMovement.date.desc()).offset(skip).limit(limit).all()

    items = []
    for m in movements:
        items.append(
            StockMovementResponse(
                id=m.id,
                product_id=m.product_id,
                product_name=m.product.name,
                prev_qty=Decimal(str(m.prev_qty)),
                changed_qty=Decimal(str(m.changed_qty)),
                new_qty=Decimal(str(m.new_qty)),
                reason=m.reason,
                type=m.type,
                user_id=m.user_id,
                date=m.date,
            )
        )

    return StockMovementListResponse(items=items, total=total, skip=skip, limit=limit)


# ── 7. Godown Order Queue ─────────────────────────────────────────────────────

GODOWN_STATUSES = ["Pending", "Processing", "Picking", "Packing"]


@router.get(
    "/orders",
    response_model=GodownOrderListResponse,
    summary="Godown: list orders in godown workflow queue",
)
def list_godown_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    order_status: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    statuses = [order_status] if order_status else GODOWN_STATUSES
    q = db.query(Order).filter(Order.status.in_(statuses))
    total = q.count()
    orders = q.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    return GodownOrderListResponse(
        items=[_build_godown_order_response(o, db) for o in orders],
        total=total,
        skip=skip,
        limit=limit,
    )


# ── 8. Godown Order Detail ────────────────────────────────────────────────────

@router.get(
    "/orders/{order_id}",
    response_model=GodownOrderResponse,
    summary="Godown: view order detail with picking/packing info",
)
def get_godown_order(
    order_id: UUID,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return _build_godown_order_response(order, db)


# ── 9. Start Picking (transition Pending → Processing / Processing → Picking) ──

@router.post(
    "/orders/{order_id}/pick",
    response_model=GodownOrderResponse,
    summary="Godown: pick items for an order",
)
def pick_order(
    order_id: UUID,
    body: PickingRequest,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).with_for_update().filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.status not in ("Pending", "Processing", "Picking"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot pick an order in '{order.status}' status.",
        )

    # Transition to Picking if not already there
    old_status = order.status
    now = datetime.utcnow()
    if not order.picking_started_at:
        order.picking_started_at = now

    if order.status != "Picking":
        order.status = "Picking"
        db.add(OrderStatusHistory(
            order_id=order.id,
            status="Picking",
            changed_by_id=current_user.id,
            notes=body.notes or "Picking started",
        ))

    for pick_item in body.items:
        # Find the order item
        oi = db.query(OrderItem).filter(
            OrderItem.id == pick_item.order_item_id,
            OrderItem.order_id == order_id,
        ).first()
        if not oi:
            raise HTTPException(
                status_code=400,
                detail=f"Order item {pick_item.order_item_id} not found in this order.",
            )

        required = Decimal(str(oi.quantity))
        if pick_item.picked_qty > required:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot pick more than required qty ({required}) for item {oi.id}.",
            )

        # If shortage detected, trigger inventory alert
        if pick_item.picked_qty < required:
            shortage_qty = required - pick_item.picked_qty
            prod = oi.product
            prod_name = prod.name if prod else "Produce Item"
            _ensure_alert(
                db, prod, order.godown_id,
                "INVENTORY_SHORTAGE",
                f"Shortage of {shortage_qty} {prod.unit if prod else 'kg'} for '{prod_name}' on order {order.order_code}.",
                severity="High",
            )
            emit_event(
                db=db,
                event_type=EVENT_INVENTORY_SHORTAGE_DETECTED,
                aggregate_id=order.id,
                aggregate_type="ORDER",
                payload={
                    "order_id": str(order.id),
                    "order_code": order.order_code,
                    "product_name": prod_name,
                    "shortage_qty": str(shortage_qty),
                },
                performed_by=current_user.name,
            )

        # Upsert PickingRecord
        picking_rec = db.query(PickingRecord).filter(
            PickingRecord.order_id == order_id,
            PickingRecord.order_item_id == oi.id,
        ).first()

        if not picking_rec:
            picking_rec = PickingRecord(
                order_id=order_id,
                order_item_id=oi.id,
                product_id=oi.product_id,
                required_qty=required,
            )
            db.add(picking_rec)

        picking_rec.picked_qty = pick_item.picked_qty
        picking_rec.status = "Picked" if pick_item.picked_qty >= required else "Partial"
        picking_rec.picked_by_id = current_user.id
        picking_rec.picked_at = now
        picking_rec.notes = pick_item.notes

    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Order Picking",
        entity_type="Order",
        entity_id=str(order.id),
        previous_value={"status": old_status},
        new_value={"status": "Picking"},
    ))

    emit_event(
        db=db,
        event_type=EVENT_PICKING_STARTED,
        aggregate_id=order.id,
        aggregate_type="ORDER",
        payload={"order_id": str(order.id), "order_code": order.order_code},
        performed_by=current_user.name,
    )

    db.commit()
    db.refresh(order)
    return _build_godown_order_response(order, db)


# ── 10. Pack Order (Picking → Packing) ────────────────────────────────────────

@router.post(
    "/orders/{order_id}/pack",
    response_model=GodownOrderResponse,
    summary="Godown: pack an order after picking is complete",
)
def pack_order(
    order_id: UUID,
    body: PackingRequest,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).with_for_update().filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.status != "Picking":
        raise HTTPException(
            status_code=400,
            detail=f"Can only pack an order in 'Picking' status. Current: '{order.status}'.",
        )

    # Check all picking is done
    picking_records = db.query(PickingRecord).filter(PickingRecord.order_id == order_id).all()
    if not picking_records:
        raise HTTPException(
            status_code=400,
            detail="No picking records found. Complete picking first.",
        )

    unpicked = [p for p in picking_records if p.status != "Picked"]
    if unpicked:
        raise HTTPException(
            status_code=400,
            detail=f"{len(unpicked)} item(s) not fully picked yet.",
        )

    # Check if packing already exists
    existing_pack = db.query(PackingRecord).filter(PackingRecord.order_id == order_id).first()
    if existing_pack and existing_pack.status == "Completed":
        raise HTTPException(status_code=400, detail="Order is already packed.")

    now = datetime.utcnow()

    if not existing_pack:
        pack = PackingRecord(
            order_id=order_id,
            packed_by_id=current_user.id,
        )
        db.add(pack)
    else:
        pack = existing_pack

    pack.package_count = body.package_count
    pack.total_weight_kg = body.total_weight_kg
    pack.notes = body.notes
    pack.packed_at = now
    pack.status = "Completed"

    # Update order weight with verified actual packed weight
    if body.total_weight_kg:
        order.weight = body.total_weight_kg

    order.packing_completed_at = now
    old_status = order.status
    order.status = "Packing"
    db.add(OrderStatusHistory(
        order_id=order.id,
        status="Packing",
        changed_by_id=current_user.id,
        notes=f"Packed {body.package_count} package(s), Verified Weight: {body.total_weight_kg} kg",
    ))

    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Order Packing",
        entity_type="Order",
        entity_id=str(order.id),
        previous_value={"status": old_status},
        new_value={"status": "Packing", "packages": body.package_count, "weight_kg": str(body.total_weight_kg)},
    ))

    emit_event(
        db=db,
        event_type=EVENT_PACKING_COMPLETED,
        aggregate_id=order.id,
        aggregate_type="ORDER",
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "actual_weight_kg": str(body.total_weight_kg),
            "package_count": body.package_count,
        },
        performed_by=current_user.name,
    )

    db.commit()
    db.refresh(order)
    return _build_godown_order_response(order, db)


# ── 11. Mark Ready for Dispatch (Packing → Ready for Dispatch) ────────────────

@router.post(
    "/orders/{order_id}/ready",
    response_model=GodownOrderResponse,
    summary="Godown: mark order as Ready for Dispatch (hands off to transport)",
)
def mark_ready_for_dispatch(
    order_id: UUID,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    order = db.query(Order).with_for_update().filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    if order.status != "Packing":
        raise HTTPException(
            status_code=400,
            detail=f"Order must be in 'Packing' status to mark ready. Current: '{order.status}'.",
        )

    # Verify packing is completed
    pack = db.query(PackingRecord).filter(PackingRecord.order_id == order_id).first()
    if not pack or pack.status != "Completed":
        raise HTTPException(
            status_code=400,
            detail="Packing must be completed before marking order as Ready for Dispatch.",
        )

    now = datetime.utcnow()
    old_status = order.status
    order.status = "Ready for Dispatch"
    order.ready_for_dispatch_at = now
    order.transport_queued_at = now

    # Automatically create/update Delivery in Transport Dispatch Queue
    delivery = db.query(Delivery).filter(Delivery.order_id == order.id).first()
    delivery_type = "Bulk Delivery" if order.buyer_type and "business" in order.buyer_type.lower() else "Home Delivery"
    verified_weight = pack.total_weight_kg or order.weight or Decimal("1.0")

    # Resolve godown fallback if missing
    source_godown_id = order.godown_id
    if not source_godown_id:
        fallback_gd = db.query(Godown).first()
        source_godown_id = fallback_gd.id if fallback_gd else None

    if not delivery and source_godown_id:
        delivery = Delivery(
            order_id=order.id,
            type=delivery_type,
            source_godown_id=source_godown_id,
            destination=order.delivery_address or order.destination or "Customer Destination",
            quantity=f"{verified_weight} kg",
            priority="High" if order.notes and "urgent" in order.notes.lower() else "Normal",
            status="Awaiting Assignment",
        )
        db.add(delivery)
    elif delivery:
        delivery.quantity = f"{verified_weight} kg"
        delivery.status = "Awaiting Assignment"

    db.add(OrderStatusHistory(
        order_id=order.id,
        status="Ready for Dispatch",
        changed_by_id=current_user.id,
        notes=f"Order ready. Verified weight: {verified_weight} kg. Queued for transport.",
    ))

    db.add(AuditLog(
        user_id=current_user.id,
        performed_by=current_user.name,
        action="Order Ready for Dispatch",
        entity_type="Order",
        entity_id=str(order.id),
        previous_value={"status": old_status},
        new_value={"status": "Ready for Dispatch", "verified_weight": str(verified_weight)},
    ))

    # Emit domain event to notify Transport Managers & Customer
    emit_event(
        db=db,
        event_type=EVENT_ORDER_READY_FOR_DISPATCH,
        aggregate_id=order.id,
        aggregate_type="ORDER",
        payload={
            "order_id": str(order.id),
            "order_code": order.order_code,
            "actual_weight_kg": str(verified_weight),
            "package_count": pack.package_count,
            "godown_id": str(source_godown_id) if source_godown_id else None,
            "destination": order.delivery_address or order.destination,
        },
        performed_by=current_user.name,
    )

    db.commit()
    db.refresh(order)

    # 2-Minute SLA: Trigger automated transport matching and assignment immediately
    process_auto_assignment_for_order(db, order, current_user)
    db.refresh(order)

    return _build_godown_order_response(order, db)


# ── 12. Alerts ────────────────────────────────────────────────────────────────

@router.get(
    "/alerts",
    response_model=GodownAlertListResponse,
    summary="Godown: view inventory alerts (low stock, out of stock, etc.)",
)
def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    resolved: Optional[bool] = Query(None),
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    godown_id = _get_user_godown_id(current_user, db)

    q = db.query(GodownAlert)
    if godown_id:
        q = q.filter(GodownAlert.godown_id == godown_id)
    if resolved is not None:
        q = q.filter(GodownAlert.is_resolved == resolved)

    total = q.count()
    alerts = q.order_by(GodownAlert.created_at.desc()).offset(skip).limit(limit).all()

    items = [
        GodownAlertResponse(
            id=a.id,
            godown_id=a.godown_id,
            product_id=a.product_id,
            product_name=a.product.name if a.product else None,
            alert_type=a.alert_type,
            severity=a.severity,
            message=a.message,
            is_resolved=a.is_resolved,
            created_at=a.created_at,
            resolved_at=a.resolved_at,
        )
        for a in alerts
    ]

    return GodownAlertListResponse(items=items, total=total, skip=skip, limit=limit)


# ── 13. Resolve Alert ─────────────────────────────────────────────────────────

@router.patch(
    "/alerts/{alert_id}/resolve",
    response_model=GodownAlertResponse,
    summary="Godown: mark an alert as resolved",
)
def resolve_alert(
    alert_id: UUID,
    current_user: User = Depends(require_godown_or_admin),
    db: Session = Depends(get_database_session),
):
    alert = db.query(GodownAlert).filter(GodownAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    if alert.is_resolved:
        raise HTTPException(status_code=400, detail="Alert is already resolved.")

    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by_id = current_user.id

    db.commit()
    db.refresh(alert)

    return GodownAlertResponse(
        id=alert.id,
        godown_id=alert.godown_id,
        product_id=alert.product_id,
        product_name=alert.product.name if alert.product else None,
        alert_type=alert.alert_type,
        severity=alert.severity,
        message=alert.message,
        is_resolved=alert.is_resolved,
        created_at=alert.created_at,
        resolved_at=alert.resolved_at,
    )
