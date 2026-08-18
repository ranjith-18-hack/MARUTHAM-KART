"""
Integration test suite for Phase 8: Farmer Portal & Procurement Workflows.
"""
from __future__ import annotations

import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.core.security import get_password_hash
from app.database.connection import SessionLocal
from app.main import app
from app.models.models import (
    AuditLog,
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

client = TestClient(app)


def _unique_email(prefix: str = "farmer_test") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@maruthamkart.com"


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _db():
    return SessionLocal()


def _create_user(role: str, name: str = "Farmer User") -> tuple[str, str]:
    email = _unique_email(role.lower())
    pw = "FarmerPass123!"
    db = _db()
    u = User(
        name=name,
        email=email,
        phone=f"+9198{uuid.uuid4().hex[:8]}",
        password_hash=get_password_hash(pw),
        role=role.upper(),
        status="Active",
    )
    db.add(u)
    db.flush()

    if role.upper() == "FARMER":
        f = Farmer(
            id=u.id,
            farmer_code=f"F-{uuid.uuid4().hex[:4].upper()}",
            location="Thanjavur, Tamil Nadu",
            rating=5.0,
            products_supplied=0,
            verified=True,
        )
        db.add(f)

    db.commit()
    db.refresh(u)
    uid = str(u.id)
    db.close()

    res = client.post("/api/v1/auth/login", json={"identifier": email, "password": pw})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return uid, token


def _delete_user(user_id: str):
    db = _db()
    uid = uuid.UUID(user_id)
    db.query(AuditLog).filter(AuditLog.user_id == uid).delete()
    db.query(StockMovement).filter(StockMovement.user_id == uid).delete()
    db.query(FarmerPickup).filter(FarmerPickup.farmer_id == uid).delete()
    db.query(FarmerPayout).filter(FarmerPayout.farmer_id == uid).delete()
    db.query(Batch).filter(Batch.farmer_id == uid).delete()
    db.query(Product).filter(Product.farmer_id == uid).delete()
    db.query(Farmer).filter(Farmer.id == uid).delete()
    db.query(User).filter(User.id == uid).delete()
    db.commit()
    db.close()


def _create_test_product(farmer_id: str) -> str:
    db = _db()
    fid = uuid.UUID(farmer_id)
    p = Product(
        name=f"Organic Ponni Rice {uuid.uuid4().hex[:4]}",
        category="Rice & Grains",
        price=Decimal("75.00"),
        unit="kg",
        availability="Available",
        available_qty=Decimal("100.00"),
        farmer_id=fid,
        status="Active",
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    pid = str(p.id)
    db.close()
    return pid


class TestFarmerPortal:

    def setup_method(self):
        self.farmer_id, self.farmer_token = _create_user("FARMER", name="Ramasamy Farmer")
        self.cust_id, self.cust_token = _create_user("CUSTOMER", name="Regular Customer")
        self.prod_id = _create_test_product(self.farmer_id)

    def teardown_method(self):
        _delete_user(self.farmer_id)
        _delete_user(self.cust_id)

    def test_farmer_profile_view_and_update(self):
        # View profile
        res = client.get("/api/v1/farmer/profile", headers=_auth(self.farmer_token))
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Ramasamy Farmer"
        assert data["verified"] is True

        # Update profile
        up_res = client.put(
            "/api/v1/farmer/profile",
            json={"name": "Ramasamy G", "location": "Madurai, Tamil Nadu"},
            headers=_auth(self.farmer_token),
        )
        assert up_res.status_code == 200
        assert up_res.json()["name"] == "Ramasamy G"
        assert up_res.json()["location"] == "Madurai, Tamil Nadu"

    def test_farmer_dashboard_metrics(self):
        res = client.get("/api/v1/farmer/dashboard", headers=_auth(self.farmer_token))
        assert res.status_code == 200
        data = res.json()
        assert "total_earnings" in data
        assert "pending_payouts" in data
        assert "recent_batches" in data
        assert "recent_pickups" in data

    def test_register_batch_and_stock_movement(self):
        res = client.post(
            "/api/v1/farmer/batches",
            json={
                "product_id": self.prod_id,
                "quantity": 250.0,
                "harvest_date": "15 Aug 2026",
                "quality_status": "Good",
            },
            headers=_auth(self.farmer_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["batch_code"].startswith("BATCH-MK")
        assert float(data["quantity"]) == 250.0

        # Verify batch is listed
        list_res = client.get("/api/v1/farmer/batches", headers=_auth(self.farmer_token))
        assert list_res.status_code == 200
        codes = [b["batch_code"] for b in list_res.json()["items"]]
        assert data["batch_code"] in codes

    def test_request_crop_pickup(self):
        res = client.post(
            "/api/v1/farmer/pickups",
            json={
                "product_id": self.prod_id,
                "quantity": 500.0,
                "pickup_location": "Farm Gate, Thanjavur West",
                "notes": "Packed in 50kg jute bags",
            },
            headers=_auth(self.farmer_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["pickup_code"].startswith("PK-MK")
        assert data["status"] == "Scheduled"

        # Verify listed
        list_res = client.get("/api/v1/farmer/pickups", headers=_auth(self.farmer_token))
        assert list_res.status_code == 200
        codes = [p["pickup_code"] for p in list_res.json()["items"]]
        assert data["pickup_code"] in codes

    def test_farmer_payouts_ledger(self):
        # Insert payout
        db = _db()
        payout = FarmerPayout(
            payout_code=f"PO-MK-{uuid.uuid4().hex[:4].upper()}",
            farmer_id=uuid.UUID(self.farmer_id),
            amount=Decimal("18750.00"),
            payment_method="Bank Transfer",
            status="Paid",
            reference_number="NEFT-12345678",
            processed_at=None,
        )
        db.add(payout)
        db.commit()
        db.close()

        res = client.get("/api/v1/farmer/payouts", headers=_auth(self.farmer_token))
        assert res.status_code == 200
        data = res.json()
        assert float(data["total_paid"]) >= 18750.0

    def test_customer_forbidden_from_farmer_portal(self):
        res = client.get("/api/v1/farmer/dashboard", headers=_auth(self.cust_token))
        assert res.status_code == 403
