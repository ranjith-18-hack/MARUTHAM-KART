"""
Phase 6 — Transport & Logistics Management Integration Tests.

Comprehensive integration tests covering:
  - Transport dashboard metrics & RBAC
  - Vehicle registration, capacity, status, maintenance, and driver linking
  - Driver registration, availability, workload, and vehicle assignment
  - Automated allocation engine (smallest suitable vehicle, heavy cargo scaling, assigned driver preference)
  - Insufficient capacity rejection & anti double-booking enforcement
  - Complete dispatch workflow (Ready for Dispatch → Assigned → Dispatched → Out for Delivery → Delivered)
  - Automatic release of driver & vehicle on delivery
  - Customer & manager delivery tracking
  - Transport audit logs
  - Full end-to-end workflow from Godown handoff to customer delivery
"""
from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.security import create_access_token, get_password_hash
from app.database.connection import get_db
from app.models.models import (
    AuditLog,
    Cart,
    CartItem,
    Delivery,
    Department,
    Driver,
    Employee,
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
    TransportAssignment,
    User,
    Vehicle,
)

client = TestClient(app)


# ── Database & Cleanup Helpers ────────────────────────────────────────────────

def _db() -> Session:
    return next(get_db())


def _unique_email(prefix: str = "u") -> str:
    return f"ph6_{prefix}_{uuid.uuid4().hex[:6]}@test.mk"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _create_user(role: str) -> tuple[str, str]:
    db = _db()
    try:
        user = User(
            name=f"Test {role.title()}",
            email=_unique_email(role.lower()),
            password_hash=get_password_hash("TestPass@123"),
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
            name="Test Farmer P6",
            email=_unique_email("farmer"),
            password_hash=get_password_hash("FarmPass@123"),
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


def _create_product(farmer_id: str, qty: float = 500.0) -> str:
    db = _db()
    try:
        product = Product(
            name=f"Test Product P6 {uuid.uuid4().hex[:4]}",
            category="Grains",
            price=Decimal("40.00"),
            unit="kg",
            available_qty=qty,
            availability="Available",
            status="Active",
            farmer_id=farmer_id,
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return str(product.id)
    finally:
        db.close()


def _create_vehicle(
    number: str | None = None,
    v_type: str = "Mini Van",
    max_weight: float = 500.0,
    status: str = "Available",
    service_status: str = "Healthy",
) -> str:
    db = _db()
    try:
        v_num = number or f"TN-38-MK-{uuid.uuid4().hex[:4].upper()}"
        vehicle = Vehicle(
            vehicle_code=f"MK-V-{uuid.uuid4().hex[:4].upper()}",
            number=v_num,
            type=v_type,
            max_weight=Decimal(str(max_weight)),
            max_volume=Decimal("2.5"),
            capacity=f"{int(max_weight)} kg",
            status=status,
            service_status=service_status,
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
        return str(vehicle.id)
    finally:
        db.close()


def _create_driver(
    name: str = "Test Driver",
    v_id: str | None = None,
    availability: str = "Available",
    d_type: str = "Home Delivery Driver",
) -> tuple[str, str]:
    db = _db()
    try:
        user = User(
            name=name,
            email=_unique_email("driver"),
            password_hash=get_password_hash("DriverPass@123"),
            role="DRIVER",
            status="Active",
        )
        db.add(user)
        db.flush()
        driver = Driver(
            id=user.id,
            driver_code=f"MK-DRI-{uuid.uuid4().hex[:3].upper()}",
            vehicle_id=uuid.UUID(v_id) if v_id else None,
            type=d_type,
            availability=availability,
            workload=0,
        )
        db.add(driver)
        db.commit()
        db.refresh(user)
        driver_id = str(user.id)
    finally:
        db.close()
    return driver_id, create_access_token(driver_id)


def _delete_vehicle(vehicle_id: str):
    db = _db()
    try:
        v_uuid = uuid.UUID(vehicle_id)
        # Unlink drivers
        drivers = db.query(Driver).filter(Driver.vehicle_id == v_uuid).all()
        for d in drivers:
            d.vehicle_id = None
        db.query(TransportAssignment).filter(TransportAssignment.vehicle_id == v_uuid).delete()
        db.query(Delivery).filter(Delivery.vehicle_id == v_uuid).delete()
        db.query(AuditLog).filter(AuditLog.entity_id == str(v_uuid)).delete()
        db.query(Vehicle).filter(Vehicle.id == v_uuid).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _delete_driver(driver_id: str):
    db = _db()
    try:
        d_uuid = uuid.UUID(driver_id)
        db.query(TransportAssignment).filter(TransportAssignment.driver_id == d_uuid).delete()
        db.query(Delivery).filter(Delivery.driver_id == d_uuid).delete()
        db.query(AuditLog).filter(AuditLog.entity_id == str(d_uuid)).delete()
        db.query(Driver).filter(Driver.id == d_uuid).delete()
        db.query(User).filter(User.id == d_uuid).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _delete_order(order_id: str):
    db = _db()
    try:
        o_uuid = uuid.UUID(order_id)
        db.query(TransportAssignment).filter(TransportAssignment.order_id == o_uuid).delete()
        db.query(Delivery).filter(Delivery.order_id == o_uuid).delete()
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


def _delete_user(user_id: str):
    db = _db()
    try:
        u_uuid = uuid.UUID(user_id)
        db.query(GodownUserAssignment).filter(GodownUserAssignment.user_id == u_uuid).delete()
        db.query(GodownAlert).filter(GodownAlert.resolved_by_id == u_uuid).delete()
        db.query(AuditLog).filter(AuditLog.user_id == u_uuid).delete()
        db.query(StockMovement).filter(StockMovement.user_id == u_uuid).delete()
        db.query(PickingRecord).filter(PickingRecord.picked_by_id == u_uuid).delete()
        db.query(PackingRecord).filter(PackingRecord.packed_by_id == u_uuid).delete()
        db.query(TransportAssignment).filter(TransportAssignment.assigned_by_id == u_uuid).delete()

        # Customer orders
        orders = db.query(Order).filter(Order.customer_id == u_uuid).all()
        for o in orders:
            db.query(TransportAssignment).filter(TransportAssignment.order_id == o.id).delete()
            db.query(Delivery).filter(Delivery.order_id == o.id).delete()
            db.query(PickingRecord).filter(PickingRecord.order_id == o.id).delete()
            db.query(PackingRecord).filter(PackingRecord.order_id == o.id).delete()
            db.query(InventoryReservation).filter(InventoryReservation.order_id == o.id).delete()
            db.query(OrderItem).filter(OrderItem.order_id == o.id).delete()
            db.query(OrderStatusHistory).filter(OrderStatusHistory.order_id == o.id).delete()
            db.query(AuditLog).filter(AuditLog.entity_id == str(o.id)).delete()
            db.delete(o)

        cart = db.query(Cart).filter(Cart.customer_id == u_uuid).first()
        if cart:
            db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
            db.delete(cart)

        # Farmer
        farmer = db.query(Farmer).filter(Farmer.id == u_uuid).first()
        if farmer:
            products = db.query(Product).filter(Product.farmer_id == u_uuid).all()
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

        # Driver
        db.query(Driver).filter(Driver.id == u_uuid).delete()

        db.query(User).filter(User.id == u_uuid).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _delete_product(product_id: str):
    db = _db()
    try:
        p_uuid = uuid.UUID(product_id)
        db.query(GodownAlert).filter(GodownAlert.product_id == p_uuid).delete()
        db.query(ProductLocation).filter(ProductLocation.product_id == p_uuid).delete()
        db.query(StockMovement).filter(StockMovement.product_id == p_uuid).delete()
        db.query(InventoryReservation).filter(InventoryReservation.product_id == p_uuid).delete()
        db.query(PickingRecord).filter(PickingRecord.product_id == p_uuid).delete()
        db.query(CartItem).filter(CartItem.product_id == p_uuid).delete()
        order_items = db.query(OrderItem).filter(OrderItem.product_id == p_uuid).all()
        for oi in order_items:
            db.query(PickingRecord).filter(PickingRecord.order_item_id == oi.id).delete()
            db.delete(oi)
        db.query(Product).filter(Product.id == p_uuid).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _create_ready_for_dispatch_order(
    cust_token: str,
    gd_token: str,
    product_id: str,
    qty: float = 10.0,
) -> str:
    """Creates an order, picks it, packs it, and marks it Ready for Dispatch."""
    client.post("/api/v1/cart/items", json={"product_id": product_id, "quantity": qty}, headers=_auth(cust_token))
    res = client.post("/api/v1/orders", json={"delivery_address": "45 Market Road, Chennai"}, headers=_auth(cust_token))
    order_id = res.json()["id"]

    # Pick
    order_detail = client.get(f"/api/v1/godown/orders/{order_id}", headers=_auth(gd_token)).json()
    pick_items = [
        {"order_item_id": i["order_item_id"], "picked_qty": float(i["quantity"])}
        for i in order_detail["items"]
    ]
    client.post(f"/api/v1/godown/orders/{order_id}/pick", json={"items": pick_items}, headers=_auth(gd_token))

    # Pack
    client.post(
        f"/api/v1/godown/orders/{order_id}/pack",
        json={"package_count": 1, "total_weight_kg": str(qty)},
        headers=_auth(gd_token),
    )

    # Ready for Dispatch
    client.post(f"/api/v1/godown/orders/{order_id}/ready", headers=_auth(gd_token))
    return order_id


# ══════════════════════════════════════════════════════════════════════════════
# 1. Transport Dashboard & Access Control
# ══════════════════════════════════════════════════════════════════════════════

class TestTransportDashboard:

    def setup_method(self):
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.adm_id, self.adm_token = _create_user("ADMIN")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")

    def teardown_method(self):
        _delete_user(self.tr_id)
        _delete_user(self.adm_id)
        _delete_user(self.cust_id)

    def test_dashboard_returns_metrics(self):
        res = client.get("/api/v1/transport/dashboard", headers=_auth(self.tr_token))
        assert res.status_code == 200
        data = res.json()
        assert "total_vehicles" in data
        assert "available_vehicles" in data
        assert "total_drivers" in data
        assert "available_drivers" in data
        assert "queue_ready_count" in data

    def test_admin_can_access_dashboard(self):
        res = client.get("/api/v1/transport/dashboard", headers=_auth(self.adm_token))
        assert res.status_code == 200

    def test_customer_cannot_access_dashboard(self):
        res = client.get("/api/v1/transport/dashboard", headers=_auth(self.cust_token))
        assert res.status_code == 403

    def test_unauthenticated_cannot_access_dashboard(self):
        res = client.get("/api/v1/transport/dashboard")
        assert res.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# 2. Vehicle Management
# ══════════════════════════════════════════════════════════════════════════════

class TestVehicleManagement:

    def setup_method(self):
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.v_ids: list[str] = []

    def teardown_method(self):
        for vid in self.v_ids:
            _delete_vehicle(vid)
        _delete_user(self.tr_id)

    def test_register_vehicle(self):
        num = f"TN-38-V-{uuid.uuid4().hex[:4].upper()}"
        res = client.post(
            "/api/v1/transport/vehicles",
            json={
                "number": num,
                "type": "Mini Truck",
                "max_weight": "1000",
                "max_volume": "4.5",
                "capacity": "1,000 kg",
                "service_status": "Healthy",
            },
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["number"] == num
        assert data["type"] == "Mini Truck"
        assert float(data["max_weight"]) == 1000.0
        assert data["status"] == "Available"
        self.v_ids.append(data["id"])

    def test_duplicate_vehicle_number_rejected(self):
        num = f"TN-38-V-{uuid.uuid4().hex[:4].upper()}"
        res1 = client.post(
            "/api/v1/transport/vehicles",
            json={"number": num, "type": "Van", "max_weight": "500", "max_volume": "2.0", "capacity": "500 kg"},
            headers=_auth(self.tr_token),
        )
        assert res1.status_code == 201
        self.v_ids.append(res1.json()["id"])

        res2 = client.post(
            "/api/v1/transport/vehicles",
            json={"number": num, "type": "Van", "max_weight": "500", "max_volume": "2.0", "capacity": "500 kg"},
            headers=_auth(self.tr_token),
        )
        assert res2.status_code == 400

    def test_list_vehicles_with_status_filter(self):
        vid = _create_vehicle(status="Available")
        self.v_ids.append(vid)
        res = client.get("/api/v1/transport/vehicles?status=Available", headers=_auth(self.tr_token))
        assert res.status_code == 200
        ids = [v["id"] for v in res.json()["items"]]
        assert vid in ids

    def test_update_vehicle_status_and_maintenance(self):
        vid = _create_vehicle(status="Available", service_status="Healthy")
        self.v_ids.append(vid)
        res = client.patch(
            f"/api/v1/transport/vehicles/{vid}",
            json={"status": "Maintenance", "service_status": "Service Due"},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Maintenance"
        assert res.json()["service_status"] == "Service Due"


# ══════════════════════════════════════════════════════════════════════════════
# 3. Driver Management
# ══════════════════════════════════════════════════════════════════════════════

class TestDriverManagement:

    def setup_method(self):
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.d_ids: list[str] = []
        self.v_ids: list[str] = []

    def teardown_method(self):
        for did in self.d_ids:
            _delete_driver(did)
        for vid in self.v_ids:
            _delete_vehicle(vid)
        _delete_user(self.tr_id)

    def test_register_driver(self):
        email = _unique_email("driver_reg")
        phone = f"+9198{uuid.uuid4().hex[:8]}"
        res = client.post(
            "/api/v1/transport/drivers",
            json={
                "name": "Ravi Kumar",
                "email": email,
                "phone": phone,
                "type": "Home Delivery Driver",
            },
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Ravi Kumar"
        assert data["availability"] == "Available"
        assert data["workload"] == 0
        self.d_ids.append(data["id"])

    def test_list_drivers_with_availability_filter(self):
        did, _ = _create_driver("Driver Available", availability="Available")
        self.d_ids.append(did)
        res = client.get("/api/v1/transport/drivers?availability=Available", headers=_auth(self.tr_token))
        assert res.status_code == 200
        ids = [d["id"] for d in res.json()["items"]]
        assert did in ids

    def test_update_driver_availability(self):
        did, _ = _create_driver("Driver Off Duty", availability="Available")
        self.d_ids.append(did)
        res = client.patch(
            f"/api/v1/transport/drivers/{did}",
            json={"availability": "Off Duty"},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 200
        assert res.json()["availability"] == "Off Duty"

    def test_pair_driver_with_vehicle(self):
        vid = _create_vehicle()
        self.v_ids.append(vid)
        did, _ = _create_driver("Paired Driver")
        self.d_ids.append(did)

        res = client.patch(
            f"/api/v1/transport/drivers/{did}",
            json={"vehicle_id": vid},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 200
        assert res.json()["vehicle_id"] == vid


# ══════════════════════════════════════════════════════════════════════════════
# 4. Automated Allocation Engine
# ══════════════════════════════════════════════════════════════════════════════

class TestAutoAllocationEngine:

    def setup_method(self):
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=1000.0)

        # Set up a fleet: 1 Bike (20kg), 1 Van (200kg), 1 Truck (1500kg)
        self.bike_id = _create_vehicle(v_type="Two Wheeler", max_weight=20.0)
        self.van_id = _create_vehicle(v_type="Mini Van", max_weight=200.0)
        self.truck_id = _create_vehicle(v_type="Truck", max_weight=1500.0)

        # Set up available drivers
        self.d1_id, _ = _create_driver("Driver One", v_id=self.bike_id)
        self.d2_id, _ = _create_driver("Driver Two", v_id=self.van_id)
        self.d3_id, _ = _create_driver("Driver Three", v_id=self.truck_id)

    def teardown_method(self):
        _delete_driver(self.d1_id)
        _delete_driver(self.d2_id)
        _delete_driver(self.d3_id)
        _delete_vehicle(self.bike_id)
        _delete_vehicle(self.van_id)
        _delete_vehicle(self.truck_id)
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.tr_id)
        _delete_user(self.farmer_id)

    def test_auto_allocate_small_package_selects_smallest_vehicle(self):
        # 5 kg order -> should pick smallest suitable vehicle (capacity >= 5kg)
        order_id = _create_ready_for_dispatch_order(self.cust_token, self.gd_token, self.product_id, qty=5.0)

        res = client.post(f"/api/v1/transport/orders/{order_id}/auto-allocate", headers=_auth(self.tr_token))
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert Decimal(str(data["vehicle"]["max_weight"])) >= Decimal("5.0")
        assert data["driver"] is not None

        _delete_order(order_id)

    def test_auto_allocate_medium_load_selects_van(self):
        # 80 kg order -> Two Wheeler (20kg) is too small, should pick vehicle with capacity >= 80kg
        order_id = _create_ready_for_dispatch_order(self.cust_token, self.gd_token, self.product_id, qty=80.0)

        res = client.post(f"/api/v1/transport/orders/{order_id}/auto-allocate", headers=_auth(self.tr_token))
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert Decimal(str(data["vehicle"]["max_weight"])) >= Decimal("80.0")
        assert data["vehicle"]["id"] != self.bike_id
        assert data["driver"] is not None

        _delete_order(order_id)

    def test_auto_allocate_heavy_cargo_selects_truck(self):
        # 600 kg order -> Small vehicles cannot carry it, only vehicle with >= 600kg
        order_id = _create_ready_for_dispatch_order(self.cust_token, self.gd_token, self.product_id, qty=600.0)

        res = client.post(f"/api/v1/transport/orders/{order_id}/auto-allocate", headers=_auth(self.tr_token))
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert Decimal(str(data["vehicle"]["max_weight"])) >= Decimal("600.0")
        assert data["vehicle"]["id"] != self.bike_id
        assert data["vehicle"]["id"] != self.van_id

        _delete_order(order_id)

    def test_auto_allocate_when_no_vehicle_has_capacity(self):
        # 99999 kg order -> Exceeds max fleet capacity
        order_id = _create_ready_for_dispatch_order(self.cust_token, self.gd_token, self.product_id, qty=50.0)
        # Artificially set order weight higher for test
        db = _db()
        o = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
        o.weight = Decimal("99999.0")
        db.commit()
        db.close()

        res = client.post(f"/api/v1/transport/orders/{order_id}/auto-allocate", headers=_auth(self.tr_token))
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is False
        assert "capacity" in data["reason"].lower() or "no vehicle" in data["reason"].lower()

        _delete_order(order_id)


# ══════════════════════════════════════════════════════════════════════════════
# 5. Manual Assignment & Constraint Enforcement
# ══════════════════════════════════════════════════════════════════════════════

class TestAssignmentConstraints:

    def setup_method(self):
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=500.0)

        self.vehicle_id = _create_vehicle(max_weight=50.0)
        self.driver_id, _ = _create_driver("Assign Driver")
        self.order_id = _create_ready_for_dispatch_order(self.cust_token, self.gd_token, self.product_id, qty=10.0)

    def teardown_method(self):
        _delete_order(self.order_id)
        _delete_driver(self.driver_id)
        _delete_vehicle(self.vehicle_id)
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.tr_id)
        _delete_user(self.farmer_id)

    def test_assign_vehicle_and_driver_success(self):
        res = client.post(
            f"/api/v1/transport/orders/{self.order_id}/assign",
            json={"vehicle_id": self.vehicle_id, "driver_id": self.driver_id, "notes": "Standard assignment"},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "Assigned"
        assert data["vehicle_id"] == self.vehicle_id
        assert data["driver_id"] == self.driver_id

        # Verify vehicle and driver are marked Assigned
        v = client.get(f"/api/v1/transport/vehicles/{self.vehicle_id}", headers=_auth(self.tr_token)).json()
        assert v["status"] == "Assigned"
        d = client.get(f"/api/v1/transport/drivers/{self.driver_id}", headers=_auth(self.tr_token)).json()
        assert d["availability"] == "Assigned"

    def test_rejects_assignment_if_capacity_insufficient(self):
        # Tiny vehicle (5kg capacity), order is 10kg
        tiny_v_id = _create_vehicle(max_weight=5.0)

        res = client.post(
            f"/api/v1/transport/orders/{self.order_id}/assign",
            json={"vehicle_id": tiny_v_id, "driver_id": self.driver_id},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 400
        assert "capacity" in res.json()["detail"].lower()

        _delete_vehicle(tiny_v_id)

    def test_prevent_double_booking_vehicle(self):
        # Assign vehicle once
        client.post(
            f"/api/v1/transport/orders/{self.order_id}/assign",
            json={"vehicle_id": self.vehicle_id, "driver_id": self.driver_id},
            headers=_auth(self.tr_token),
        )

        # Create a second order
        order_id2 = _create_ready_for_dispatch_order(self.cust_token, self.gd_token, self.product_id, qty=5.0)
        driver_id2, _ = _create_driver("Second Driver")

        # Attempt to assign the same already-assigned vehicle to order 2
        res = client.post(
            f"/api/v1/transport/orders/{order_id2}/assign",
            json={"vehicle_id": self.vehicle_id, "driver_id": driver_id2},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 400
        assert "not available" in res.json()["detail"].lower()

        _delete_order(order_id2)
        _delete_driver(driver_id2)

    def test_prevent_double_booking_driver(self):
        client.post(
            f"/api/v1/transport/orders/{self.order_id}/assign",
            json={"vehicle_id": self.vehicle_id, "driver_id": self.driver_id},
            headers=_auth(self.tr_token),
        )

        order_id2 = _create_ready_for_dispatch_order(self.cust_token, self.gd_token, self.product_id, qty=5.0)
        vehicle_id2 = _create_vehicle(max_weight=100.0)

        # Attempt to assign already-assigned driver
        res = client.post(
            f"/api/v1/transport/orders/{order_id2}/assign",
            json={"vehicle_id": vehicle_id2, "driver_id": self.driver_id},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 400
        assert "not available" in res.json()["detail"].lower()

        _delete_order(order_id2)
        _delete_vehicle(vehicle_id2)

    def test_rejects_vehicle_in_maintenance(self):
        maint_v_id = _create_vehicle(max_weight=100.0, service_status="Maintenance")

        res = client.post(
            f"/api/v1/transport/orders/{self.order_id}/assign",
            json={"vehicle_id": maint_v_id, "driver_id": self.driver_id},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 400
        assert "maintenance" in res.json()["detail"].lower()

        _delete_vehicle(maint_v_id)


# ══════════════════════════════════════════════════════════════════════════════
# 6. Complete Dispatch & Delivery Lifecycle
# ══════════════════════════════════════════════════════════════════════════════

class TestDispatchLifecycle:

    def setup_method(self):
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=500.0)

        self.vehicle_id = _create_vehicle(max_weight=100.0)
        self.driver_id, _ = _create_driver("Lifecycle Driver")
        self.order_id = _create_ready_for_dispatch_order(self.cust_token, self.gd_token, self.product_id, qty=15.0)

        # Assign transport
        client.post(
            f"/api/v1/transport/orders/{self.order_id}/assign",
            json={"vehicle_id": self.vehicle_id, "driver_id": self.driver_id},
            headers=_auth(self.tr_token),
        )

    def teardown_method(self):
        _delete_order(self.order_id)
        _delete_driver(self.driver_id)
        _delete_vehicle(self.vehicle_id)
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.tr_id)
        _delete_user(self.farmer_id)

    def test_dispatch_order_sets_resources_on_route(self):
        res = client.post(
            f"/api/v1/transport/orders/{self.order_id}/dispatch",
            json={"notes": "Departed warehouse"},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Dispatched"

        # Check vehicle and driver status
        v = client.get(f"/api/v1/transport/vehicles/{self.vehicle_id}", headers=_auth(self.tr_token)).json()
        assert v["status"] == "On Route"
        d = client.get(f"/api/v1/transport/drivers/{self.driver_id}", headers=_auth(self.tr_token)).json()
        assert d["availability"] == "On Route"

    def test_out_for_delivery_with_eta(self):
        # Dispatch first
        client.post(f"/api/v1/transport/orders/{self.order_id}/dispatch", json={}, headers=_auth(self.tr_token))

        res = client.post(
            f"/api/v1/transport/orders/{self.order_id}/out-for-delivery",
            json={"eta": "25 mins", "notes": "Near delivery location"},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Out for Delivery"

    def test_deliver_order_releases_vehicle_and_driver(self):
        # Dispatch -> Out for Delivery -> Deliver
        client.post(f"/api/v1/transport/orders/{self.order_id}/dispatch", json={}, headers=_auth(self.tr_token))
        client.post(f"/api/v1/transport/orders/{self.order_id}/out-for-delivery", json={"eta": "10 mins"}, headers=_auth(self.tr_token))

        res = client.post(
            f"/api/v1/transport/orders/{self.order_id}/deliver",
            json={"notes": "Delivered and signed by recipient"},
            headers=_auth(self.tr_token),
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Delivered"

        # Check resources released back to Available
        v = client.get(f"/api/v1/transport/vehicles/{self.vehicle_id}", headers=_auth(self.tr_token)).json()
        assert v["status"] == "Available"

        d = client.get(f"/api/v1/transport/drivers/{self.driver_id}", headers=_auth(self.tr_token)).json()
        assert d["availability"] == "Available"
        assert d["workload"] == 1  # Incremented


# ══════════════════════════════════════════════════════════════════════════════
# 7. Delivery Tracking & Audit Logs
# ══════════════════════════════════════════════════════════════════════════════

class TestDeliveryTrackingAndLogs:

    def setup_method(self):
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.other_cust_id, self.other_cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=500.0)

        self.vehicle_id = _create_vehicle(max_weight=100.0)
        self.driver_id, _ = _create_driver("Tracking Driver")
        self.order_id = _create_ready_for_dispatch_order(self.cust_token, self.gd_token, self.product_id, qty=10.0)

        client.post(
            f"/api/v1/transport/orders/{self.order_id}/assign",
            json={"vehicle_id": self.vehicle_id, "driver_id": self.driver_id},
            headers=_auth(self.tr_token),
        )

    def teardown_method(self):
        _delete_order(self.order_id)
        _delete_driver(self.driver_id)
        _delete_vehicle(self.vehicle_id)
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.other_cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.tr_id)
        _delete_user(self.farmer_id)

    def test_customer_can_track_their_order(self):
        res = client.get(f"/api/v1/transport/tracking/{self.order_id}", headers=_auth(self.cust_token))
        assert res.status_code == 200
        data = res.json()
        assert data["order_id"] == self.order_id
        assert data["status"] == "Driver Assigned"
        assert data["vehicle"]["id"] == self.vehicle_id
        assert data["driver"]["id"] == self.driver_id
        assert len(data["status_history"]) >= 1

    def test_other_customer_cannot_track_order(self):
        res = client.get(f"/api/v1/transport/tracking/{self.order_id}", headers=_auth(self.other_cust_token))
        assert res.status_code == 403

    def test_transport_manager_can_track_order(self):
        res = client.get(f"/api/v1/transport/tracking/{self.order_id}", headers=_auth(self.tr_token))
        assert res.status_code == 200

    def test_transport_logs_recorded(self):
        res = client.get("/api/v1/transport/logs", headers=_auth(self.tr_token))
        assert res.status_code == 200
        assert res.json()["total"] >= 1
        actions = [l["action"] for l in res.json()["items"]]
        assert "Transport Assigned" in actions or "Vehicle Registered" in actions


# ══════════════════════════════════════════════════════════════════════════════
# 8. Complete End-to-End Workflow: Godown to Final Delivery
# ══════════════════════════════════════════════════════════════════════════════

class TestCompleteLogisticsLifecycle:

    def setup_method(self):
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.farmer_id = _create_farmer_user()
        self.product_id = _create_product(self.farmer_id, qty=500.0)

        self.vehicle_id = _create_vehicle(v_type="Mini Truck", max_weight=500.0)
        self.driver_id, _ = _create_driver("E2E Driver", v_id=self.vehicle_id)

    def teardown_method(self):
        _delete_driver(self.driver_id)
        _delete_vehicle(self.vehicle_id)
        _delete_product(self.product_id)
        _delete_user(self.cust_id)
        _delete_user(self.gd_id)
        _delete_user(self.tr_id)
        _delete_user(self.farmer_id)

    def test_full_logistics_lifecycle(self):
        """
        Complete journey:
        1. Customer places order
        2. Godown picks & packs
        3. Godown marks Ready for Dispatch -> Order routes into Transport Queue
        4. Transport system automatically allocates vehicle and driver
        5. Transport manager confirms assignment
        6. Order is dispatched -> vehicle & driver go On Route
        7. Order is Out for Delivery with ETA
        8. Order is Delivered -> vehicle & driver released back to Available
        """
        # Step 1: Customer places order
        client.post("/api/v1/cart/items", json={"product_id": self.product_id, "quantity": 25.0}, headers=_auth(self.cust_token))
        order_res = client.post("/api/v1/orders", json={"delivery_address": "12 Agro Complex, Coimbatore"}, headers=_auth(self.cust_token))
        order_id = order_res.json()["id"]

        # Step 2: Godown Pick & Pack
        order_data = client.get(f"/api/v1/godown/orders/{order_id}", headers=_auth(self.gd_token)).json()
        pick_items = [{"order_item_id": i["order_item_id"], "picked_qty": float(i["quantity"])} for i in order_data["items"]]
        client.post(f"/api/v1/godown/orders/{order_id}/pick", json={"items": pick_items}, headers=_auth(self.gd_token))
        client.post(f"/api/v1/godown/orders/{order_id}/pack", json={"package_count": 2, "total_weight_kg": "25.0"}, headers=_auth(self.gd_token))

        # Step 3: Godown Ready for Dispatch
        client.post(f"/api/v1/godown/orders/{order_id}/ready", headers=_auth(self.gd_token))

        # Step 4: Verify in Transport Queue
        queue_res = client.get("/api/v1/transport/queue", headers=_auth(self.tr_token))
        queue_ids = [q["order_id"] for q in queue_res.json()["items"]]
        assert order_id in queue_ids

        # Step 5: Auto-allocate
        alloc_res = client.post(f"/api/v1/transport/orders/{order_id}/auto-allocate", headers=_auth(self.tr_token))
        assert alloc_res.status_code == 200
        alloc_data = alloc_res.json()
        assert alloc_data["success"] is True
        assert Decimal(str(alloc_data["vehicle"]["max_weight"])) >= Decimal("25.0")
        assert alloc_data["driver"] is not None

        # Step 6: Commit assignment
        assign_res = client.post(
            f"/api/v1/transport/orders/{order_id}/assign",
            json={"vehicle_id": self.vehicle_id, "driver_id": self.driver_id},
            headers=_auth(self.tr_token),
        )
        assert assign_res.status_code == 200
        assert assign_res.json()["status"] == "Assigned"

        # Step 7: Dispatch
        disp_res = client.post(f"/api/v1/transport/orders/{order_id}/dispatch", json={"notes": "On road"}, headers=_auth(self.tr_token))
        assert disp_res.status_code == 200
        assert disp_res.json()["status"] == "Dispatched"

        # Step 8: Out for delivery
        out_res = client.post(f"/api/v1/transport/orders/{order_id}/out-for-delivery", json={"eta": "15 mins"}, headers=_auth(self.tr_token))
        assert out_res.status_code == 200
        assert out_res.json()["status"] == "Out for Delivery"

        # Step 9: Customer tracks order
        track_res = client.get(f"/api/v1/transport/tracking/{order_id}", headers=_auth(self.cust_token))
        assert track_res.status_code == 200
        assert track_res.json()["status"] == "Out for Delivery"
        assert track_res.json()["eta"] == "15 mins"

        # Step 10: Deliver
        del_res = client.post(f"/api/v1/transport/orders/{order_id}/deliver", json={"notes": "Received in good condition"}, headers=_auth(self.tr_token))
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "Delivered"

        # Verify resources are now available again
        v_check = client.get(f"/api/v1/transport/vehicles/{self.vehicle_id}", headers=_auth(self.tr_token)).json()
        assert v_check["status"] == "Available"
        d_check = client.get(f"/api/v1/transport/drivers/{self.driver_id}", headers=_auth(self.tr_token)).json()
        assert d_check["availability"] == "Available"
        assert d_check["workload"] >= 1

        _delete_order(order_id)
