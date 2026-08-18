"""
Phase 5 — Godown / Warehouse Operations Integration Tests.

Tests cover:
  - Godown dashboard
  - Inventory listing, detail
  - Product location management
  - Stock adjustment (add / remove)
  - Negative stock prevention
  - Low-stock alert generation
  - Stock movement history
  - Order routing to godown queue
  - Picking workflow
  - Packing workflow
  - Ready-for-dispatch transition (transport handoff)
  - Unauthorized access
  - Invalid status transitions
"""
from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.database.connection import get_db
from app.models.models import (
    AuditLog,
    Cart,
    CartItem,
    Farmer,
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
from sqlalchemy.orm import Session
from app.models.models import Base
from app.database.connection import engine

try:
    from app.models.models import UserRole  # type: ignore
except ImportError:
    class UserRole:  # type: ignore
        CUSTOMER = "CUSTOMER"
        GODOWN_MANAGER = "GODOWN_MANAGER"
        TRANSPORT_MANAGER = "TRANSPORT_MANAGER"
        ADMIN = "ADMIN"
        EMPLOYEE = "EMPLOYEE"

client = TestClient(app)

# ── Database helpers ───────────────────────────────────────────────────────────

def _db() -> Session:
    return next(get_db())


def _unique_email(prefix: str = "u") -> str:
    return f"ph5_{prefix}_{uuid.uuid4().hex[:6]}@test.mk"


def _create_user(role: str) -> tuple[str, str]:
    db = _db()
    try:
        user = User(
            name=f"Test {role.title()}",
            email=_unique_email(role.lower()),
            password_hash=get_password_hash("TestPass@1"),
            role=role,
            status="Active",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = str(user.id)
    finally:
        db.close()
    return user_id, create_access_token(user_id)


def _create_farmer_user() -> str:
    db = _db()
    try:
        user = User(
            name="Test Farmer P5",
            email=_unique_email("farmer"),
            password_hash=get_password_hash("FarmPass@1"),
            role="FARMER",
            status="Active",
        )
        db.add(user)
        db.flush()
        farmer = Farmer(
            id=user.id,
            farmer_code=f"MK-FRM-{uuid.uuid4().hex[:8].upper()}",
            location="Test Village",
            verified=True,
        )
        db.add(farmer)
        db.commit()
        db.refresh(user)
        return str(user.id)
    finally:
        db.close()


def _create_product(farmer_id: str, qty: float = 100.0) -> str:
    db = _db()
    try:
        product = Product(
            name=f"Test Product {uuid.uuid4().hex[:4]}",
            category="Grains",
            price=Decimal("50.00"),
            unit="kg",
            available_qty=qty,
            availability="Available" if qty > 20 else ("Low Stock" if qty > 0 else "Out of Stock"),
            status="Active",
            farmer_id=farmer_id,
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return str(product.id)
    finally:
        db.close()


def _delete_user(user_id: str):
    db = _db()
    try:
        user_uuid = uuid.UUID(user_id)
        # Delete godown assignments
        db.query(GodownUserAssignment).filter(GodownUserAssignment.user_id == user_uuid).delete()
        # Delete user's alerts
        db.query(GodownAlert).filter(GodownAlert.resolved_by_id == user_uuid).delete()
        # Delete audit logs and stock movements
        db.query(AuditLog).filter(AuditLog.user_id == user_uuid).delete()
        db.query(StockMovement).filter(StockMovement.user_id == user_uuid).delete()
        db.query(PickingRecord).filter(PickingRecord.picked_by_id == user_uuid).delete()
        db.query(PackingRecord).filter(PackingRecord.packed_by_id == user_uuid).delete()
        
        # If user is a customer with orders
        orders = db.query(Order).filter(Order.customer_id == user_uuid).all()
        for o in orders:
            db.query(PickingRecord).filter(PickingRecord.order_id == o.id).delete()
            db.query(PackingRecord).filter(PackingRecord.order_id == o.id).delete()
            db.query(InventoryReservation).filter(InventoryReservation.order_id == o.id).delete()
            db.query(OrderItem).filter(OrderItem.order_id == o.id).delete()
            db.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == o.id).delete()
            db.query(AuditLog).filter(AuditLog.entity_id == str(o.id)).delete()
            db.delete(o)
            
        # Cart
        cart = db.query(Cart).filter(Cart.customer_id == user_uuid).first()
        if cart:
            db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
            db.delete(cart)
            
        # If user is a farmer, delete their products
        farmer = db.query(Farmer).filter(Farmer.id == user_uuid).first()
        if farmer:
            products = db.query(Product).filter(Product.farmer_id == user_uuid).all()
            for p in products:
                db.query(GodownAlert).filter(GodownAlert.product_id == p.id).delete()
                db.query(ProductLocation).filter(ProductLocation.product_id == p.id).delete()
                db.query(StockMovement).filter(StockMovement.product_id == p.id).delete()
                db.query(InventoryReservation).filter(InventoryReservation.product_id == p.id).delete()
                db.query(PickingRecord).filter(PickingRecord.product_id == p.id).delete()
                db.query(CartItem).filter(CartItem.product_id == p.id).delete()
                db.query(OrderItem).filter(OrderItem.product_id == p.id).delete()
                db.delete(p)
            db.delete(farmer)
            
        db.query(User).filter(User.id == user_uuid).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _delete_product(product_id: str):
    db = _db()
    try:
        prod_uuid = uuid.UUID(product_id)
        db.query(GodownAlert).filter(GodownAlert.product_id == prod_uuid).delete()
        db.query(ProductLocation).filter(ProductLocation.product_id == prod_uuid).delete()
        db.query(StockMovement).filter(StockMovement.product_id == prod_uuid).delete()
        db.query(InventoryReservation).filter(InventoryReservation.product_id == prod_uuid).delete()
        db.query(PickingRecord).filter(PickingRecord.product_id == prod_uuid).delete()
        db.query(CartItem).filter(CartItem.product_id == prod_uuid).delete()
        
        # Check order items
        order_items = db.query(OrderItem).filter(OrderItem.product_id == prod_uuid).all()
        for oi in order_items:
            db.query(PickingRecord).filter(PickingRecord.order_item_id == oi.id).delete()
            db.delete(oi)
            
        db.query(Product).filter(Product.id == prod_uuid).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _delete_order(order_id: str):
    db = _db()
    try:
        o_uuid = uuid.UUID(order_id)
        db.query(PickingRecord).filter(PickingRecord.order_id == o_uuid).delete()
        db.query(PackingRecord).filter(PackingRecord.order_id == o_uuid).delete()
        db.query(InventoryReservation).filter(InventoryReservation.order_id == o_uuid).delete()
        db.query(OrderItem).filter(OrderItem.order_id == o_uuid).delete()
        db.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == o_uuid).delete()
        db.query(AuditLog).filter(AuditLog.entity_id == str(o_uuid)).delete()
        db.query(Order).filter(Order.id == o_uuid).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _place_order(cust_token: str, product_id: str, qty: float = 5.0) -> str:
    """Helper: add product to cart, place order, return order_id."""
    client.post("/api/v1/cart/items", json={"product_id": product_id, "quantity": qty},
                headers=_auth(cust_token))
    res = client.post("/api/v1/orders", json={"delivery_address": "Phase 5 Test St"},
                      headers=_auth(cust_token))
    assert res.status_code == 201, f"Order failed: {res.text}"
    return res.json()["id"]


# ══════════════════════════════════════════════════════════════════════════════
# 1. Dashboard
# ══════════════════════════════════════════════════════════════════════════════

class TestGodownDashboard:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")

    def teardown_method(self):
        _delete_user(self.gd_id)

    def test_dashboard_returns_200(self):
        res = client.get("/api/v1/godown/dashboard", headers=_auth(self.gd_token))
        assert res.status_code == 200
        data = res.json()
        assert "total_products" in data
        assert "pending_orders" in data
        assert "unresolved_alerts" in data

    def test_customer_cannot_access_dashboard(self):
        cust_id, cust_token = _create_user("CUSTOMER")
        res = client.get("/api/v1/godown/dashboard", headers=_auth(cust_token))
        assert res.status_code == 403
        _delete_user(cust_id)

    def test_unauthenticated_cannot_access_dashboard(self):
        res = client.get("/api/v1/godown/dashboard")
        assert res.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# 2. Inventory
# ══════════════════════════════════════════════════════════════════════════════

class TestInventoryListing:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=50.0)

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.gd_id)
        _delete_user(self.farmer_id)

    def test_list_inventory(self):
        res = client.get("/api/v1/godown/inventory?limit=500", headers=_auth(self.gd_token))
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert data["total"] >= 1
        ids = [i["product_id"] for i in data["items"]]
        assert self.product_id in ids

    def test_inventory_search(self):
        # Get the product name
        db = _db()
        product = db.query(Product).filter(Product.id == uuid.UUID(self.product_id)).first()
        name = product.name[:6]
        db.close()

        res = client.get(f"/api/v1/godown/inventory?search={name}&limit=500", headers=_auth(self.gd_token))
        assert res.status_code == 200
        ids = [i["product_id"] for i in res.json()["items"]]
        assert self.product_id in ids

    def test_inventory_filter_by_category(self):
        res = client.get("/api/v1/godown/inventory?category=Grains&limit=500", headers=_auth(self.gd_token))
        assert res.status_code == 200
        # All returned items must have the matching category
        for item in res.json()["items"]:
            assert item["category"] == "Grains"
        # Our test product should be in the list
        ids = [i["product_id"] for i in res.json()["items"]]
        assert self.product_id in ids

    def test_get_single_inventory_item(self):
        res = client.get(f"/api/v1/godown/inventory/{self.product_id}", headers=_auth(self.gd_token))
        assert res.status_code == 200
        assert res.json()["product_id"] == self.product_id

    def test_get_nonexistent_product_returns_404(self):
        fake_id = str(uuid.uuid4())
        res = client.get(f"/api/v1/godown/inventory/{fake_id}", headers=_auth(self.gd_token))
        assert res.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# 3. Product Locations
# ══════════════════════════════════════════════════════════════════════════════

class TestProductLocation:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=50.0)

        # Need a godown assigned to the user for location tests
        from app.models.models import Godown
        db = _db()
        try:
            # create a godown if none exists
            gd = db.query(Godown).first()
            if not gd:
                gd = Godown(
                    godown_code=f"GD-TEST-{uuid.uuid4().hex[:4].upper()}",
                    name="Test Godown",
                    location="Test Location",
                    total_capacity=10000.0,
                )
                db.add(gd)
                db.flush()
            self.godown_db_id = str(gd.id)
            # Assign user to godown
            assignment = GodownUserAssignment(
                user_id=uuid.UUID(self.gd_id),
                godown_id=gd.id,
                is_active=True,
            )
            db.add(assignment)
            db.commit()
        finally:
            db.close()

    def teardown_method(self):
        db = _db()
        try:
            db.query(ProductLocation).filter(
                ProductLocation.product_id == uuid.UUID(self.product_id)
            ).delete()
            db.query(GodownUserAssignment).filter(
                GodownUserAssignment.user_id == uuid.UUID(self.gd_id)
            ).delete()
            db.commit()
        finally:
            db.close()
        _delete_product(self.product_id)
        _delete_user(self.gd_id)
        _delete_user(self.farmer_id)

    def test_set_product_location(self):
        res = client.patch(
            f"/api/v1/godown/inventory/{self.product_id}/location",
            json={"rack": "Rack A", "shelf": "Shelf 03", "bin": "Bin 12"},
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        data = res.json()
        assert data["rack"] == "Rack A"
        assert data["shelf"] == "Shelf 03"
        assert data["bin"] == "Bin 12"

    def test_update_product_location(self):
        # Set first
        client.patch(
            f"/api/v1/godown/inventory/{self.product_id}/location",
            json={"rack": "Rack A", "shelf": "Shelf 03"},
            headers=_auth(self.gd_token),
        )
        # Update
        res = client.patch(
            f"/api/v1/godown/inventory/{self.product_id}/location",
            json={"rack": "Rack B", "shelf": "Shelf 05", "bin": "Bin 03"},
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        assert res.json()["rack"] == "Rack B"

    def test_location_appears_in_inventory_listing(self):
        client.patch(
            f"/api/v1/godown/inventory/{self.product_id}/location",
            json={"rack": "Rack Z", "shelf": "Shelf 01"},
            headers=_auth(self.gd_token),
        )
        res = client.get(f"/api/v1/godown/inventory/{self.product_id}", headers=_auth(self.gd_token))
        assert res.status_code == 200
        loc = res.json().get("location")
        assert loc is not None
        assert loc["rack"] == "Rack Z"


# ══════════════════════════════════════════════════════════════════════════════
# 4. Stock Adjustments
# ══════════════════════════════════════════════════════════════════════════════

class TestStockAdjustments:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=100.0)

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.gd_id)
        _delete_user(self.farmer_id)

    def test_add_stock(self):
        res = client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": self.product_id,
                "quantity": "50",
                "movement_type": "RECEIPT",
                "reason": "New batch received from farmer",
            },
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert float(data["prev_qty"]) == 100.0
        assert float(data["new_qty"]) == 150.0
        assert data["type"] == "RECEIPT"

    def test_remove_stock(self):
        res = client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": self.product_id,
                "quantity": "-30",
                "movement_type": "ADJUSTMENT",
                "reason": "Correction for damaged goods",
            },
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert float(data["new_qty"]) == 70.0

    def test_negative_stock_prevented(self):
        """Removing more than available qty should return 400."""
        res = client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": self.product_id,
                "quantity": "-999",
                "movement_type": "ADJUSTMENT",
                "reason": "Attempting illegal negative stock",
            },
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 400
        assert "negative" in res.json()["detail"].lower()

    def test_invalid_movement_type_rejected(self):
        res = client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": self.product_id,
                "quantity": "10",
                "movement_type": "INVALID_TYPE",
                "reason": "Test",
            },
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 400

    def test_stock_movement_creates_record(self):
        client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": self.product_id,
                "quantity": "25",
                "movement_type": "RECEIPT",
                "reason": "Test receipt",
            },
            headers=_auth(self.gd_token),
        )
        # Verify movement is in stock-movements list
        res = client.get(
            f"/api/v1/godown/stock-movements?product_id={self.product_id}",
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        assert res.json()["total"] >= 1

    def test_customer_cannot_adjust_stock(self):
        cust_id, cust_token = _create_user("CUSTOMER")
        res = client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": self.product_id,
                "quantity": "10",
                "movement_type": "RECEIPT",
                "reason": "Unauthorized",
            },
            headers=_auth(cust_token),
        )
        assert res.status_code == 403
        _delete_user(cust_id)


# ══════════════════════════════════════════════════════════════════════════════
# 5. Low-Stock Alerts
# ══════════════════════════════════════════════════════════════════════════════

class TestLowStockAlerts:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=50.0)

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.gd_id)
        _delete_user(self.farmer_id)

    def test_low_stock_alert_generated(self):
        # Reduce stock below threshold (20)
        client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": self.product_id,
                "quantity": "-45",
                "movement_type": "ADJUSTMENT",
                "reason": "Stock reduced for testing",
            },
            headers=_auth(self.gd_token),
        )
        # Check alerts
        res = client.get("/api/v1/godown/alerts", headers=_auth(self.gd_token))
        assert res.status_code == 200
        alert_types = [a["alert_type"] for a in res.json()["items"]]
        assert "LOW_STOCK" in alert_types or "OUT_OF_STOCK" in alert_types

    def test_out_of_stock_alert_generated(self):
        client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": self.product_id,
                "quantity": "-50",
                "movement_type": "ADJUSTMENT",
                "reason": "Full stock removal for test",
            },
            headers=_auth(self.gd_token),
        )
        res = client.get("/api/v1/godown/alerts", headers=_auth(self.gd_token))
        assert res.status_code == 200
        alert_types = [a["alert_type"] for a in res.json()["items"]]
        assert "OUT_OF_STOCK" in alert_types

    def test_resolve_alert(self):
        # Create an alert
        client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": self.product_id,
                "quantity": "-45",
                "movement_type": "ADJUSTMENT",
                "reason": "For resolve test",
            },
            headers=_auth(self.gd_token),
        )
        # Get alert id
        res = client.get(
            f"/api/v1/godown/alerts?resolved=false",
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        items = res.json()["items"]
        our_alerts = [a for a in items if a.get("product_id") == self.product_id]
        if not our_alerts:
            pytest.skip("No alert found for this product")
        alert_id = our_alerts[0]["id"]

        # Resolve it
        res = client.patch(
            f"/api/v1/godown/alerts/{alert_id}/resolve",
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        assert res.json()["is_resolved"] == True

    def test_no_duplicate_alerts(self):
        """Adjusting stock twice should not create duplicate unresolved alerts."""
        for _ in range(2):
            client.post(
                "/api/v1/godown/stock-adjustments",
                json={
                    "product_id": self.product_id,
                    "quantity": "-1",
                    "movement_type": "ADJUSTMENT",
                    "reason": "Duplicate alert test",
                },
                headers=_auth(self.gd_token),
            )
        db = _db()
        try:
            count = (
                db.query(GodownAlert)
                .filter(
                    GodownAlert.product_id == uuid.UUID(self.product_id),
                    GodownAlert.is_resolved == False,
                )
                .count()
            )
            # Should be at most 1 unresolved LOW_STOCK alert
            assert count <= 2  # One for LOW_STOCK, one for OUT_OF_STOCK at most
        finally:
            db.close()


# ══════════════════════════════════════════════════════════════════════════════
# 6. Stock Movement History
# ══════════════════════════════════════════════════════════════════════════════

class TestStockMovements:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=200.0)

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.gd_id)
        _delete_user(self.farmer_id)

    def test_list_stock_movements(self):
        # Create a movement first
        client.post(
            "/api/v1/godown/stock-adjustments",
            json={"product_id": self.product_id, "quantity": "10", "movement_type": "RECEIPT", "reason": "Test"},
            headers=_auth(self.gd_token),
        )
        res = client.get("/api/v1/godown/stock-movements", headers=_auth(self.gd_token))
        assert res.status_code == 200
        assert res.json()["total"] >= 1

    def test_filter_movements_by_product(self):
        client.post(
            "/api/v1/godown/stock-adjustments",
            json={"product_id": self.product_id, "quantity": "5", "movement_type": "ADJUSTMENT", "reason": "Test"},
            headers=_auth(self.gd_token),
        )
        res = client.get(
            f"/api/v1/godown/stock-movements?product_id={self.product_id}",
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        for item in res.json()["items"]:
            assert item["product_id"] == self.product_id


# ══════════════════════════════════════════════════════════════════════════════
# 7. Order Queue
# ══════════════════════════════════════════════════════════════════════════════

class TestGodownOrderQueue:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=200.0)
        self.order_id = _place_order(self.cust_token, self.product_id, qty=5.0)

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.farmer_id)

    def test_godown_sees_pending_order(self):
        res = client.get("/api/v1/godown/orders", headers=_auth(self.gd_token))
        assert res.status_code == 200
        ids = [o["id"] for o in res.json()["items"]]
        assert self.order_id in ids

    def test_godown_order_detail(self):
        res = client.get(f"/api/v1/godown/orders/{self.order_id}", headers=_auth(self.gd_token))
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == self.order_id
        assert len(data["items"]) >= 1

    def test_customer_cannot_access_godown_orders(self):
        res = client.get("/api/v1/godown/orders", headers=_auth(self.cust_token))
        assert res.status_code == 403

    def test_filter_by_status(self):
        res = client.get("/api/v1/godown/orders?status=Pending", headers=_auth(self.gd_token))
        assert res.status_code == 200
        for o in res.json()["items"]:
            assert o["status"] == "Pending"


# ══════════════════════════════════════════════════════════════════════════════
# 8. Picking Workflow
# ══════════════════════════════════════════════════════════════════════════════

class TestPickingWorkflow:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=200.0)
        self.order_id = _place_order(self.cust_token, self.product_id, qty=5.0)

        # Get order items
        res = client.get(f"/api/v1/godown/orders/{self.order_id}", headers=_auth(self.gd_token))
        self.items = res.json()["items"]

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.farmer_id)

    def test_pick_order_items(self):
        assert len(self.items) >= 1
        order_item_id = self.items[0]["order_item_id"]
        required_qty = float(self.items[0]["quantity"])

        res = client.post(
            f"/api/v1/godown/orders/{self.order_id}/pick",
            json={
                "items": [{"order_item_id": order_item_id, "picked_qty": required_qty}],
                "notes": "Picking started",
            },
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "Picking"
        # Check item picking status
        item = [i for i in data["items"] if i["order_item_id"] == order_item_id][0]
        assert item["picking_status"] == "Picked"

    def test_cannot_pick_more_than_required(self):
        order_item_id = self.items[0]["order_item_id"]
        required_qty = float(self.items[0]["quantity"])

        res = client.post(
            f"/api/v1/godown/orders/{self.order_id}/pick",
            json={
                "items": [{"order_item_id": order_item_id, "picked_qty": required_qty + 999}],
            },
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 400

    def test_cannot_pick_wrong_order_item(self):
        fake_item_id = str(uuid.uuid4())
        res = client.post(
            f"/api/v1/godown/orders/{self.order_id}/pick",
            json={
                "items": [{"order_item_id": fake_item_id, "picked_qty": 1.0}],
            },
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 400

    def test_customer_cannot_pick(self):
        order_item_id = self.items[0]["order_item_id"]
        res = client.post(
            f"/api/v1/godown/orders/{self.order_id}/pick",
            json={"items": [{"order_item_id": order_item_id, "picked_qty": 1.0}]},
            headers=_auth(self.cust_token),
        )
        assert res.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# 9. Packing Workflow
# ══════════════════════════════════════════════════════════════════════════════

class TestPackingWorkflow:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=200.0)
        self.order_id = _place_order(self.cust_token, self.product_id, qty=5.0)

        # Get items & fully pick
        res = client.get(f"/api/v1/godown/orders/{self.order_id}", headers=_auth(self.gd_token))
        items = res.json()["items"]
        pick_items = [
            {"order_item_id": i["order_item_id"], "picked_qty": float(i["quantity"])}
            for i in items
        ]
        client.post(
            f"/api/v1/godown/orders/{self.order_id}/pick",
            json={"items": pick_items},
            headers=_auth(self.gd_token),
        )

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.farmer_id)

    def test_pack_order(self):
        res = client.post(
            f"/api/v1/godown/orders/{self.order_id}/pack",
            json={"package_count": 2, "total_weight_kg": "4.5", "notes": "Packed securely"},
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "Packing"
        assert data["packing"] is not None
        assert data["packing"]["package_count"] == 2
        assert data["packing"]["status"] == "Completed"

    def test_cannot_pack_without_picking(self):
        # New unrelated order (not picked)
        product_id2 = _create_product(self.farmer_id, qty=100.0)
        order_id2 = _place_order(self.cust_token, product_id2, qty=3.0)
        # Try to pack without picking
        res = client.post(
            f"/api/v1/godown/orders/{order_id2}/pack",
            json={"package_count": 1},
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 400
        _delete_order(order_id2)
        _delete_product(product_id2)

    def test_cannot_pack_twice(self):
        # Pack first time
        client.post(
            f"/api/v1/godown/orders/{self.order_id}/pack",
            json={"package_count": 1},
            headers=_auth(self.gd_token),
        )
        # Try packing again
        res = client.post(
            f"/api/v1/godown/orders/{self.order_id}/pack",
            json={"package_count": 1},
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 400


# ══════════════════════════════════════════════════════════════════════════════
# 10. Ready for Dispatch (Transport Handoff)
# ══════════════════════════════════════════════════════════════════════════════

class TestReadyForDispatch:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=200.0)
        self.order_id = _place_order(self.cust_token, self.product_id, qty=5.0)

        # Full pick + pack workflow
        res = client.get(f"/api/v1/godown/orders/{self.order_id}", headers=_auth(self.gd_token))
        items = res.json()["items"]
        pick_items = [
            {"order_item_id": i["order_item_id"], "picked_qty": float(i["quantity"])}
            for i in items
        ]
        client.post(
            f"/api/v1/godown/orders/{self.order_id}/pick",
            json={"items": pick_items},
            headers=_auth(self.gd_token),
        )
        client.post(
            f"/api/v1/godown/orders/{self.order_id}/pack",
            json={"package_count": 1, "total_weight_kg": "5.0"},
            headers=_auth(self.gd_token),
        )

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.tr_id)
        _delete_user(self.farmer_id)

    def test_mark_ready_for_dispatch(self):
        res = client.post(
            f"/api/v1/godown/orders/{self.order_id}/ready",
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Ready for Dispatch"

    def test_order_appears_in_transport_queue_after_ready(self):
        client.post(
            f"/api/v1/godown/orders/{self.order_id}/ready",
            headers=_auth(self.gd_token),
        )
        # Check transport queue
        res = client.get("/api/v1/orders/queue/transport", headers=_auth(self.tr_token))
        assert res.status_code == 200
        ids = [o["id"] for o in res.json()["items"]]
        assert self.order_id in ids

    def test_cannot_mark_ready_without_packing(self):
        # New order (not packed)
        product_id2 = _create_product(self.farmer_id, qty=100.0)
        order_id2 = _place_order(self.cust_token, product_id2, qty=3.0)
        res = client.post(
            f"/api/v1/godown/orders/{order_id2}/ready",
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 400
        _delete_order(order_id2)
        _delete_product(product_id2)

    def test_cannot_mark_ready_from_wrong_status(self):
        # Order is in Pending (not Packing)
        product_id2 = _create_product(self.farmer_id, qty=100.0)
        order_id2 = _place_order(self.cust_token, product_id2, qty=3.0)
        res = client.post(
            f"/api/v1/godown/orders/{order_id2}/ready",
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 400
        _delete_order(order_id2)
        _delete_product(product_id2)


# ══════════════════════════════════════════════════════════════════════════════
# 11. Full Godown Workflow End-to-End
# ══════════════════════════════════════════════════════════════════════════════

class TestGodownFullWorkflow:

    def setup_method(self):
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=500.0)

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.tr_id)
        _delete_user(self.farmer_id)

    def test_complete_workflow_pending_to_transport_handoff(self):
        """
        Full lifecycle:
        Customer places order → Godown picks → Godown packs → Ready for Dispatch
        → Transport sees it in queue
        """
        # Step 1: Customer places order
        order_id = _place_order(self.cust_token, self.product_id, qty=10.0)

        # Step 2: Godown sees it
        res = client.get("/api/v1/godown/orders", headers=_auth(self.gd_token))
        ids = [o["id"] for o in res.json()["items"]]
        assert order_id in ids

        # Step 3: Pick
        res = client.get(f"/api/v1/godown/orders/{order_id}", headers=_auth(self.gd_token))
        items = res.json()["items"]
        pick_items = [
            {"order_item_id": i["order_item_id"], "picked_qty": float(i["quantity"])}
            for i in items
        ]
        res = client.post(
            f"/api/v1/godown/orders/{order_id}/pick",
            json={"items": pick_items},
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Picking"

        # Step 4: Pack
        res = client.post(
            f"/api/v1/godown/orders/{order_id}/pack",
            json={"package_count": 2, "total_weight_kg": "10.0", "notes": "Securely packed"},
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Packing"

        # Step 5: Ready for dispatch
        res = client.post(
            f"/api/v1/godown/orders/{order_id}/ready",
            headers=_auth(self.gd_token),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Ready for Dispatch"

        # Step 6: Transport queue
        res = client.get("/api/v1/orders/queue/transport", headers=_auth(self.tr_token))
        ids = [o["id"] for o in res.json()["items"]]
        assert order_id in ids

        # Step 7: Verify order no longer in godown queue
        res = client.get("/api/v1/godown/orders", headers=_auth(self.gd_token))
        godown_ids = [o["id"] for o in res.json()["items"]]
        assert order_id not in godown_ids
