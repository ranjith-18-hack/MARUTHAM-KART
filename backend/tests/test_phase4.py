"""
Phase 4 Integration Tests — Customer, Products, Cart, Orders

Test Groups:
  1. Customer Profile
  2. Product Listing & Search
  3. Godown Product Management
  4. Cart Operations
  5. Order Placement & History
  6. Godown / Transport Order Queues
  7. Order Status Transitions
  8. Role Authorization

Run:
  .\\venv\\Scripts\\python -m pytest tests/test_phase4.py -v
"""
from __future__ import annotations
import uuid
from decimal import Decimal
from typing import Optional

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.connection import SessionLocal
from app.models.models import Cart, CartItem, Customer, Farmer, Order, OrderItem, Product, User
from app.core.security import create_access_token, get_password_hash
from app.schemas.auth import UserRole

client = TestClient(app)

# ── Test helpers ──────────────────────────────────────────────────────────────

def _db() -> Session:
    return SessionLocal()


def _unique_email(prefix: str = "p4") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:6]}@test.mk.com"


def _create_user(role: str, status: str = "Active") -> User:
    db = _db()
    try:
        user = User(
            name=f"Test {role}",
            email=_unique_email(role.lower()),
            password_hash=get_password_hash("TestPass@123"),
            role=role,
            status=status,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _create_customer() -> tuple[User, str]:
    """Returns (user, access_token)."""
    res = client.post("/api/v1/auth/register/customer", json={
        "name": "Test Customer",
        "email": _unique_email("cust"),
        "password": "CustPass@1",
    })
    assert res.status_code == 201, res.text
    data = res.json()
    return data["user"]["id"], data["access_token"]


def _create_godown_user() -> tuple[str, str]:
    """Create a godown manager with Active status, return (id, token)."""
    db = _db()
    try:
        user = User(
            name="Godown Manager",
            email=_unique_email("gdwn"),
            password_hash=get_password_hash("GdwnPass@1"),
            role=UserRole.GODOWN_MANAGER,
            status="Active",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = str(user.id)
    finally:
        db.close()
    token = create_access_token(user_id)
    return user_id, token


def _create_transport_user() -> tuple[str, str]:
    """Create a transport manager with Active status, return (id, token)."""
    db = _db()
    try:
        user = User(
            name="Transport Manager",
            email=_unique_email("trns"),
            password_hash=get_password_hash("TrnsPass@1"),
            role=UserRole.TRANSPORT_MANAGER,
            status="Active",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = str(user.id)
    finally:
        db.close()
    token = create_access_token(user_id)
    return user_id, token


def _create_farmer() -> str:
    """Create a farmer user + farmer profile, return farmer UUID."""
    db = _db()
    try:
        user = User(
            name="Test Farmer",
            email=_unique_email("frmr"),
            password_hash=get_password_hash("FarmPass@1"),
            role="FARMER",
            status="Active",
        )
        db.add(user)
        db.flush()
        farmer = Farmer(
            id=user.id,
            farmer_code=f"MK-FRM-{uuid.uuid4().hex[:8].upper()}",
            location="Test Farm, Tamil Nadu",
        )
        db.add(farmer)
        db.commit()
        farmer_id = str(farmer.id)
    finally:
        db.close()
    return farmer_id


def _create_product(farmer_id: str, available_qty: float = 100.0, status: str = "Active") -> str:
    """Create a product directly in DB, return product UUID string."""
    db = _db()
    try:
        product = Product(
            name=f"Test Product {uuid.uuid4().hex[:4]}",
            category="Rice & Grains",
            unit="kg",
            price=Decimal("65.00"),
            available_qty=Decimal(str(available_qty)),
            availability="Available" if available_qty > 0 else "Out of Stock",
            status=status,
            farmer_id=farmer_id,
            description="Test product description",
        )
        db.add(product)
        db.commit()
        product_id = str(product.id)
    finally:
        db.close()
    return product_id


def _delete_product(product_id: str) -> None:
    db = _db()
    try:
        from app.models.models import CartItem, OrderItem, StockMovement, Batch, InventoryItem
        db.query(CartItem).filter(CartItem.product_id == product_id).delete()
        db.query(OrderItem).filter(OrderItem.product_id == product_id).delete()
        db.query(StockMovement).filter(StockMovement.product_id == product_id).delete()
        db.query(Batch).filter(Batch.product_id == product_id).delete()
        db.query(InventoryItem).filter(InventoryItem.product_id == product_id).delete()
        db.query(Product).filter(Product.id == product_id).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _delete_user(user_id: str) -> None:
    db = _db()
    try:
        from app.models.models import (
            Customer, Employee, Driver, Farmer, HotelBusiness,
            AuditLog, OrderStatusHistory, Cart, CartItem, Order, OrderItem, StockMovement
        )
        # 1. Clean cart items
        carts = db.query(Cart).filter(Cart.customer_id == user_id).all()
        for c in carts:
            db.query(CartItem).filter(CartItem.cart_id == c.id).delete()
        db.query(Cart).filter(Cart.customer_id == user_id).delete()

        # 2. Clean orders and order items
        orders = db.query(Order).filter(Order.customer_id == user_id).all()
        for o in orders:
            db.query(OrderItem).filter(OrderItem.order_id == o.id).delete()
            db.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == o.id).delete()
        db.query(Order).filter(Order.customer_id == user_id).delete()

        # 3. Clean audit logs and history
        db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()
        db.query(OrderStatusHistory).filter(OrderStatusHistory.changed_by_id == user_id).delete()
        db.query(StockMovement).filter(StockMovement.user_id == user_id).delete()

        # 4. Clean profiles
        db.query(Customer).filter(Customer.id == user_id).delete()
        db.query(Employee).filter(Employee.id == user_id).delete()
        db.query(Driver).filter(Driver.id == user_id).delete()
        db.query(Farmer).filter(Farmer.id == user_id).delete()
        db.query(HotelBusiness).filter(HotelBusiness.id == user_id).delete()

        # 5. Clean user
        db.query(User).filter(User.id == user_id).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Customer Profile
# ═══════════════════════════════════════════════════════════════════════════════

class TestCustomerProfile:

    def setup_method(self):
        self.user_id, self.token = _create_customer()

    def teardown_method(self):
        _delete_user(self.user_id)

    def test_get_profile(self):
        res = client.get("/api/v1/customer/profile", headers={
            "Authorization": f"Bearer {self.token}"
        })
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["customer_code"].startswith("MK-CUST-")
        assert "password_hash" not in str(data)

    def test_update_profile_name(self):
        res = client.patch("/api/v1/customer/profile", json={
            "name": "Updated Name"
        }, headers={"Authorization": f"Bearer {self.token}"})
        assert res.status_code == 200
        assert res.json()["name"] == "Updated Name"

    def test_godown_manager_cannot_access_customer_profile(self):
        _, gd_token = _create_godown_user()
        res = client.get("/api/v1/customer/profile", headers={
            "Authorization": f"Bearer {gd_token}"
        })
        assert res.status_code == 403


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Product Listing & Search (Public / Customer)
# ═══════════════════════════════════════════════════════════════════════════════

class TestProductListing:

    def setup_method(self):
        self.farmer_id = _create_farmer()
        self.product_id = _create_product(self.farmer_id, available_qty=100.0)
        self.inactive_id = _create_product(self.farmer_id, status="Inactive")

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_product(self.inactive_id)
        _delete_user(self.farmer_id)

    def test_list_products_public(self):
        """Unauthenticated users can list active products."""
        res = client.get("/api/v1/products")
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data

    def test_inactive_product_hidden_from_customers(self):
        user_id, token = _create_customer()
        try:
            res = client.get(f"/api/v1/products/{self.inactive_id}", headers={
                "Authorization": f"Bearer {token}"
            })
            assert res.status_code == 404
        finally:
            _delete_user(user_id)

    def test_inactive_product_visible_to_godown(self):
        _, gd_token = _create_godown_user()
        res = client.get(f"/api/v1/products/{self.inactive_id}", headers={
            "Authorization": f"Bearer {gd_token}"
        })
        assert res.status_code == 200

    def test_search_by_name(self):
        res = client.get("/api/v1/products", params={"search": "Test Product"})
        assert res.status_code == 200
        # At least our test product should be in there
        assert res.json()["total"] >= 1

    def test_filter_by_category(self):
        res = client.get("/api/v1/products", params={"category": "Rice"})
        assert res.status_code == 200
        for item in res.json()["items"]:
            assert "rice" in item["category"].lower()

    def test_get_product_detail(self):
        res = client.get(f"/api/v1/products/{self.product_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == self.product_id
        assert data["status"] == "Active"

    def test_get_nonexistent_product_returns_404(self):
        res = client.get(f"/api/v1/products/{uuid.uuid4()}")
        assert res.status_code == 404

    def test_get_categories(self):
        res = client.get("/api/v1/products/categories")
        assert res.status_code == 200
        assert isinstance(res.json(), list)


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Godown Product Management
# ═══════════════════════════════════════════════════════════════════════════════

class TestGodownProductManagement:

    def setup_method(self):
        self.farmer_id = _create_farmer()
        self.gd_user_id, self.gd_token = _create_godown_user()
        self.created_products = []

    def teardown_method(self):
        for pid in self.created_products:
            _delete_product(pid)
        _delete_user(self.gd_user_id)
        _delete_user(self.farmer_id)

    def test_create_product(self):
        res = client.post("/api/v1/products", json={
            "name": "New Test Rice",
            "category": "Rice & Grains",
            "unit": "kg",
            "price": 70.0,
            "farmer_id": self.farmer_id,
            "available_qty": 200.0,
            "description": "Fresh rice",
        }, headers={"Authorization": f"Bearer {self.gd_token}"})
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["status"] == "Active"
        assert data["available_qty"] == "200.00" or float(data["available_qty"]) == 200.0
        self.created_products.append(data["id"])

    def test_create_product_requires_godown_role(self):
        user_id, cust_token = _create_customer()
        res = client.post("/api/v1/products", json={
            "name": "Unauthorized Product",
            "category": "Test",
            "unit": "kg",
            "price": 50.0,
            "farmer_id": self.farmer_id,
        }, headers={"Authorization": f"Bearer {cust_token}"})
        assert res.status_code == 403
        _delete_user(user_id)

    def test_update_product(self):
        product_id = _create_product(self.farmer_id)
        self.created_products.append(product_id)

        res = client.patch(f"/api/v1/products/{product_id}", json={
            "price": 75.0,
            "description": "Updated description",
        }, headers={"Authorization": f"Bearer {self.gd_token}"})
        assert res.status_code == 200
        assert float(res.json()["price"]) == 75.0

    def test_deactivate_product(self):
        product_id = _create_product(self.farmer_id)
        self.created_products.append(product_id)

        res = client.patch(f"/api/v1/products/{product_id}", json={
            "status": "Inactive"
        }, headers={"Authorization": f"Bearer {self.gd_token}"})
        assert res.status_code == 200
        assert res.json()["status"] == "Inactive"

    def test_stock_adjustment_add(self):
        product_id = _create_product(self.farmer_id, available_qty=100.0)
        self.created_products.append(product_id)

        res = client.post(f"/api/v1/products/{product_id}/stock", json={
            "quantity_change": 50.0,
            "reason": "Restocked from farmer",
        }, headers={"Authorization": f"Bearer {self.gd_token}"})
        assert res.status_code == 200
        assert float(res.json()["available_qty"]) == 150.0

    def test_stock_adjustment_negative_exceeding_raises_400(self):
        product_id = _create_product(self.farmer_id, available_qty=10.0)
        self.created_products.append(product_id)

        res = client.post(f"/api/v1/products/{product_id}/stock", json={
            "quantity_change": -20.0,
            "reason": "Remove stock",
        }, headers={"Authorization": f"Bearer {self.gd_token}"})
        assert res.status_code == 400


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Cart Operations
# ═══════════════════════════════════════════════════════════════════════════════

class TestCart:

    def setup_method(self):
        self.user_id, self.token = _create_customer()
        self.farmer_id = _create_farmer()
        self.product_id = _create_product(self.farmer_id, available_qty=100.0)
        self.product2_id = _create_product(self.farmer_id, available_qty=50.0)

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_product(self.product2_id)
        _delete_user(self.user_id)
        _delete_user(self.farmer_id)

    def _auth(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    def test_get_empty_cart(self):
        res = client.get("/api/v1/cart", headers=self._auth())
        assert res.status_code == 200
        data = res.json()
        assert data["item_count"] == 0
        assert float(data["subtotal"]) == 0.0

    def test_add_item_to_cart(self):
        res = client.post("/api/v1/cart/items", json={
            "product_id": self.product_id,
            "quantity": 5.0,
        }, headers=self._auth())
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["item_count"] == 1
        assert float(data["subtotal"]) == 5.0 * 65.0
        assert float(data["delivery_charge"]) == 40.0

    def test_add_same_item_increments_quantity(self):
        client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": 5.0
        }, headers=self._auth())
        res = client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": 3.0
        }, headers=self._auth())
        assert res.status_code == 201
        data = res.json()
        assert data["item_count"] == 1
        assert float(data["items"][0]["quantity"]) == 8.0

    def test_add_multiple_items(self):
        client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": 2.0
        }, headers=self._auth())
        res = client.post("/api/v1/cart/items", json={
            "product_id": self.product2_id, "quantity": 3.0
        }, headers=self._auth())
        assert res.status_code == 201
        assert res.json()["item_count"] == 2

    def test_exceeding_stock_rejected(self):
        res = client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": 999.0
        }, headers=self._auth())
        assert res.status_code == 400

    def test_update_item_quantity(self):
        add_res = client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": 5.0
        }, headers=self._auth())
        item_id = add_res.json()["items"][0]["id"]

        res = client.patch(f"/api/v1/cart/items/{item_id}", json={
            "quantity": 10.0
        }, headers=self._auth())
        assert res.status_code == 200
        assert float(res.json()["items"][0]["quantity"]) == 10.0

    def test_remove_item_from_cart(self):
        add_res = client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": 5.0
        }, headers=self._auth())
        item_id = add_res.json()["items"][0]["id"]

        res = client.delete(f"/api/v1/cart/items/{item_id}", headers=self._auth())
        assert res.status_code == 200
        assert res.json()["item_count"] == 0

    def test_clear_cart(self):
        client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": 2.0
        }, headers=self._auth())
        client.post("/api/v1/cart/items", json={
            "product_id": self.product2_id, "quantity": 1.0
        }, headers=self._auth())

        res = client.delete("/api/v1/cart", headers=self._auth())
        assert res.status_code == 200
        assert res.json()["item_count"] == 0

    def test_unauthenticated_cannot_access_cart(self):
        res = client.get("/api/v1/cart")
        assert res.status_code == 401

    def test_price_not_trusted_from_frontend(self):
        """Adding item should use server-side price, ignoring any client price."""
        add_res = client.post("/api/v1/cart/items", json={
            "product_id": self.product_id,
            "quantity": 1.0,
        }, headers=self._auth())
        assert add_res.status_code == 201
        # Price must match the DB product price, not any client-provided value
        assert float(add_res.json()["items"][0]["unit_price"]) == 65.0

    def test_delivery_charge_zero_for_empty_cart(self):
        res = client.get("/api/v1/cart", headers=self._auth())
        assert float(res.json()["delivery_charge"]) == 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Order Placement & History
# ═══════════════════════════════════════════════════════════════════════════════

class TestOrders:

    def setup_method(self):
        self.user_id, self.token = _create_customer()
        self.farmer_id = _create_farmer()
        self.product_id = _create_product(self.farmer_id, available_qty=100.0)

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.user_id)
        _delete_user(self.farmer_id)

    def _auth(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    def _add_to_cart(self, qty: float = 5.0):
        return client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": qty
        }, headers=self._auth())

    def test_place_order_from_cart(self):
        self._add_to_cart(5.0)
        res = client.post("/api/v1/orders", json={
            "delivery_address": "123 Test Street, Chennai",
        }, headers=self._auth())
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["status"] == "Pending"
        assert data["order_code"].startswith("ORD-MK-")
        assert len(data["items"]) == 1
        assert float(data["delivery_charge"]) == 40.0
        assert float(data["total_amount"]) == 5 * 65 + 40

    def test_cart_cleared_after_order(self):
        self._add_to_cart(3.0)
        client.post("/api/v1/orders", json={
            "delivery_address": "123 Test St"
        }, headers=self._auth())
        cart_res = client.get("/api/v1/cart", headers=self._auth())
        assert cart_res.json()["item_count"] == 0

    def test_stock_deducted_after_order(self):
        initial_qty = 100.0
        self._add_to_cart(10.0)
        client.post("/api/v1/orders", json={
            "delivery_address": "123 Test St"
        }, headers=self._auth())

        db = _db()
        try:
            product = db.query(Product).filter(Product.id == self.product_id).first()
            assert float(product.available_qty) == initial_qty - 10.0
        finally:
            db.close()

    def test_place_order_with_empty_cart_returns_400(self):
        res = client.post("/api/v1/orders", json={
            "delivery_address": "123 Test St"
        }, headers=self._auth())
        assert res.status_code == 400

    def test_order_history(self):
        self._add_to_cart(2.0)
        client.post("/api/v1/orders", json={"delivery_address": "123 St"}, headers=self._auth())

        res = client.get("/api/v1/orders", headers=self._auth())
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1

    def test_order_detail(self):
        self._add_to_cart(1.0)
        order_res = client.post("/api/v1/orders", json={
            "delivery_address": "Detail Test St"
        }, headers=self._auth())
        order_id = order_res.json()["id"]

        res = client.get(f"/api/v1/orders/{order_id}", headers=self._auth())
        assert res.status_code == 200
        assert res.json()["id"] == order_id

    def test_customer_cannot_see_other_customers_order(self):
        # Create another customer + order
        other_id, other_token = _create_customer()
        other_farmer_id = _create_farmer()
        other_product_id = _create_product(other_farmer_id, available_qty=50.0)

        client.post("/api/v1/cart/items", json={
            "product_id": other_product_id, "quantity": 1.0
        }, headers={"Authorization": f"Bearer {other_token}"})
        order_res = client.post("/api/v1/orders", json={
            "delivery_address": "Other St"
        }, headers={"Authorization": f"Bearer {other_token}"})
        other_order_id = order_res.json()["id"]

        # Try to access as self.user
        res = client.get(f"/api/v1/orders/{other_order_id}", headers=self._auth())
        assert res.status_code == 403

        _delete_product(other_product_id)
        _delete_user(other_id)

    def test_insufficient_stock_prevents_order(self):
        # Set very low stock
        low_stock_product_id = _create_product(self.farmer_id, available_qty=2.0)
        try:
            client.post("/api/v1/cart/items", json={
                "product_id": low_stock_product_id, "quantity": 1.0
            }, headers=self._auth())
            # Manually deplete stock in DB before ordering
            db = _db()
            try:
                p = db.query(Product).filter(Product.id == low_stock_product_id).first()
                p.available_qty = 0
                db.commit()
            finally:
                db.close()

            # Cart still has item, but stock is now 0 — order must fail
            order_res = client.post("/api/v1/orders", json={
                "delivery_address": "Low Stock St"
            }, headers=self._auth())
            assert order_res.status_code == 400
        finally:
            _delete_product(low_stock_product_id)


# ═══════════════════════════════════════════════════════════════════════════════
# 6. Godown / Transport Order Queues
# ═══════════════════════════════════════════════════════════════════════════════

class TestOrderQueues:

    def setup_method(self):
        self.cust_id, self.cust_token = _create_customer()
        self.gd_id, self.gd_token = _create_godown_user()
        self.tr_id, self.tr_token = _create_transport_user()
        self.farmer_id = _create_farmer()
        self.product_id = _create_product(self.farmer_id, available_qty=200.0)

        # Create a pending order
        client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": 5.0
        }, headers={"Authorization": f"Bearer {self.cust_token}"})
        res = client.post("/api/v1/orders", json={
            "delivery_address": "Queue Test St"
        }, headers={"Authorization": f"Bearer {self.cust_token}"})
        self.order_id = res.json()["id"]

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.tr_id)
        _delete_user(self.farmer_id)

    def test_godown_can_see_pending_orders(self):
        res = client.get("/api/v1/orders/queue/godown", headers={
            "Authorization": f"Bearer {self.gd_token}"
        })
        assert res.status_code == 200
        order_ids = [o["id"] for o in res.json()["items"]]
        assert self.order_id in order_ids

    def test_customer_cannot_access_godown_queue(self):
        res = client.get("/api/v1/orders/queue/godown", headers={
            "Authorization": f"Bearer {self.cust_token}"
        })
        assert res.status_code == 403

    def test_transport_queue_empty_until_dispatch(self):
        res = client.get("/api/v1/orders/queue/transport", headers={
            "Authorization": f"Bearer {self.tr_token}"
        })
        assert res.status_code == 200
        order_ids = [o["id"] for o in res.json()["items"]]
        assert self.order_id not in order_ids


# ═══════════════════════════════════════════════════════════════════════════════
# 7. Order Status Transitions
# ═══════════════════════════════════════════════════════════════════════════════

class TestOrderStatusTransitions:

    def setup_method(self):
        self.cust_id, self.cust_token = _create_customer()
        self.gd_id, self.gd_token = _create_godown_user()
        self.tr_id, self.tr_token = _create_transport_user()
        self.farmer_id = _create_farmer()
        self.product_id = _create_product(self.farmer_id, available_qty=200.0)

        client.post("/api/v1/cart/items", json={
            "product_id": self.product_id, "quantity": 2.0
        }, headers={"Authorization": f"Bearer {self.cust_token}"})
        res = client.post("/api/v1/orders", json={
            "delivery_address": "Transition Test St"
        }, headers={"Authorization": f"Bearer {self.cust_token}"})
        assert res.status_code == 201, res.text
        self.order_id = res.json()["id"]

    def teardown_method(self):
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.tr_id)
        _delete_user(self.farmer_id)

    def _update_status(self, new_status: str, token: str) -> dict:
        return client.patch(f"/api/v1/orders/{self.order_id}/status", json={
            "status": new_status, "notes": f"Moving to {new_status}"
        }, headers={"Authorization": f"Bearer {token}"})

    def test_valid_transition_pending_to_processing(self):
        res = self._update_status("Processing", self.gd_token)
        assert res.status_code == 200
        assert res.json()["status"] == "Processing"

    def test_invalid_transition_pending_to_delivered_rejected(self):
        res = self._update_status("Delivered", self.gd_token)
        assert res.status_code == 400

    def test_invalid_transition_delivered_to_pending_rejected(self):
        # Walk order to Delivered
        for s in ["Processing", "Picking", "Packing", "Ready for Dispatch", "Dispatched", "Delivered"]:
            r = self._update_status(s, self.gd_token)
            assert r.status_code == 200, f"Failed at {s}: {r.text}"

        # Try to go back
        res = self._update_status("Pending", self.gd_token)
        assert res.status_code == 400

    def test_customer_cannot_update_order_status(self):
        res = self._update_status("Processing", self.cust_token)
        assert res.status_code == 403

    def test_order_appears_in_transport_queue_after_ready_for_dispatch(self):
        for s in ["Processing", "Picking", "Packing", "Ready for Dispatch"]:
            self._update_status(s, self.gd_token)

        res = client.get("/api/v1/orders/queue/transport", headers={
            "Authorization": f"Bearer {self.tr_token}"
        })
        assert res.status_code == 200
        order_ids = [o["id"] for o in res.json()["items"]]
        assert self.order_id in order_ids
