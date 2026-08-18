"""
Integration test suite for Phase 8: Hotel / Restaurant / B2B Partner Portal.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.core.security import get_password_hash
from app.database.connection import SessionLocal
from app.main import app
from app.models.models import (
    AuditLog,
    B2BPartner,
    B2BQuote,
    B2BQuoteItem,
    B2BRecurringOrder,
    B2BRecurringOrderItem,
    Farmer,
    Invoice,
    Order,
    OrderItem,
    OrderStatusHistory,
    Product,
    User,
)

client = TestClient(app)


def _unique_email(prefix: str = "b2b_test") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@maruthamkart.com"


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _db():
    return SessionLocal()


def _create_user(role: str, name: str = "B2B User") -> tuple[str, str]:
    email = _unique_email(role.lower())
    pw = "B2BPass123!"
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

    if role.upper() == "HOTEL_BUSINESS":
        p = B2BPartner(
            id=u.id,
            business_code=f"MK-BUS-{uuid.uuid4().hex[:3].upper()}",
            business_name="Annapoorna Grand Hotel",
            business_type="Hotel",
            location="Coimbatore, Tamil Nadu",
            verification_status="Verified",
            credit_limit=Decimal("100000.00"),
            outstanding_balance=Decimal("0.00"),
            payment_terms="Net 15 Days",
        )
        db.add(p)

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
    db.query(OrderStatusHistory).filter(OrderStatusHistory.changed_by_id == uid).delete()
    db.query(Invoice).filter(Invoice.order_id.in_(db.query(Order.id).filter(Order.customer_id == uid))).delete(synchronize_session=False)
    db.query(OrderItem).filter(OrderItem.order_id.in_(db.query(Order.id).filter(Order.customer_id == uid))).delete(synchronize_session=False)
    db.query(Order).filter(Order.customer_id == uid).delete()
    db.query(B2BQuoteItem).filter(B2BQuoteItem.quote_id.in_(db.query(B2BQuote.id).filter(B2BQuote.partner_id == uid))).delete(synchronize_session=False)
    db.query(B2BQuote).filter(B2BQuote.partner_id == uid).delete()
    db.query(B2BRecurringOrderItem).filter(B2BRecurringOrderItem.recurring_order_id.in_(db.query(B2BRecurringOrder.id).filter(B2BRecurringOrder.partner_id == uid))).delete(synchronize_session=False)
    db.query(B2BRecurringOrder).filter(B2BRecurringOrder.partner_id == uid).delete()
    db.query(B2BPartner).filter(B2BPartner.id == uid).delete()
    db.query(User).filter(User.id == uid).delete()
    db.commit()
    db.close()


def _get_or_create_product() -> str:
    db = _db()
    p = db.query(Product).first()
    if not p:
        farmer_user = User(
            name="Product Farmer",
            email=_unique_email("fprod"),
            password_hash=get_password_hash("Pass123!"),
            role="FARMER",
            status="Active",
        )
        db.add(farmer_user)
        db.flush()
        farmer = Farmer(id=farmer_user.id, farmer_code="F-PROD", location="Erode", rating=5.0, verified=True)
        db.add(farmer)
        p = Product(
            name="Wholesale Samba Rice",
            category="Rice & Grains",
            price=Decimal("60.00"),
            unit="kg",
            available_qty=Decimal("5000.00"),
            farmer_id=farmer.id,
            status="Active",
        )
        db.add(p)
        db.commit()
        db.refresh(p)
    pid = str(p.id)
    db.close()
    return pid


class TestB2BPartnerPortal:

    def setup_method(self):
        self.b2b_id, self.b2b_token = _create_user("HOTEL_BUSINESS", name="Annapoorna Hotel Manager")
        self.cust_id, self.cust_token = _create_user("CUSTOMER", name="Retail Customer")
        self.prod_id = _get_or_create_product()

    def teardown_method(self):
        _delete_user(self.b2b_id)
        _delete_user(self.cust_id)

    def test_b2b_profile_and_credit_limit(self):
        res = client.get("/api/v1/business/profile", headers=_auth(self.b2b_token))
        assert res.status_code == 200
        data = res.json()
        assert data["business_name"] == "Annapoorna Grand Hotel"
        assert float(data["credit_limit"]) == 100000.0
        assert data["payment_terms"] == "Net 15 Days"

    def test_b2b_dashboard_metrics(self):
        res = client.get("/api/v1/business/dashboard", headers=_auth(self.b2b_token))
        assert res.status_code == 200
        data = res.json()
        assert "credit_limit" in data
        assert "outstanding_balance" in data
        assert "recent_invoices" in data
        assert "recent_quotes" in data

    def test_wholesale_catalog_with_price_tiers(self):
        res = client.get("/api/v1/business/catalog", headers=_auth(self.b2b_token))
        assert res.status_code == 200
        data = res.json()
        assert data["total"] > 0
        p = data["items"][0]
        assert "price_tiers" in p

    def test_quotation_request_and_acceptance_workflow(self):
        # 1. Request quote
        res = client.post(
            "/api/v1/business/quotes",
            json={
                "items": [
                    {"product_id": self.prod_id, "requested_quantity": 200.0, "unit": "kg"},
                ],
                "notes": "Weekly restaurant requirement",
            },
            headers=_auth(self.b2b_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["quote_code"].startswith("QT-MK")
        assert data["status"] == "Sent"
        quote_id = data["id"]

        # 2. Accept quote & convert to confirmed wholesale order
        accept_res = client.post(f"/api/v1/business/quotes/{quote_id}/accept", headers=_auth(self.b2b_token))
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == "Accepted"

        # 3. Verify invoice created
        inv_res = client.get("/api/v1/business/invoices", headers=_auth(self.b2b_token))
        assert inv_res.status_code == 200
        assert inv_res.json()["total"] >= 1

    def test_invoice_payment_workflow(self):
        # Create an order & invoice first
        db = _db()
        ord_obj = Order(
            order_code=f"ORD-B2B-{uuid.uuid4().hex[:4].upper()}",
            customer_id=uuid.UUID(self.b2b_id),
            buyer_type="Business / Hotel",
            total_amount=Decimal("12000.00"),
            destination="Coimbatore",
            status="Pending",
            created_at=datetime.utcnow(),
        )
        db.add(ord_obj)
        db.flush()
        inv_obj = Invoice(
            order_id=ord_obj.id,
            amount=Decimal("12000.00"),
            date=datetime.utcnow(),
            status="Pending",
        )
        db.add(inv_obj)
        db.commit()
        inv_id = str(inv_obj.id)
        db.close()

        # Settle invoice
        pay_res = client.post(f"/api/v1/business/invoices/{inv_id}/pay", json={"payment_method": "Bank Transfer"}, headers=_auth(self.b2b_token))
        assert pay_res.status_code == 200
        assert pay_res.json()["status"] == "Paid"

    def test_standing_recurring_order_lifecycle(self):
        # Create standing order
        res = client.post(
            "/api/v1/business/recurring",
            json={
                "frequency": "Weekly",
                "delivery_day": "Monday",
                "destination": "Hotel Kitchen Central",
                "items": [
                    {"product_id": self.prod_id, "quantity": 100.0, "unit": "kg"},
                ],
            },
            headers=_auth(self.b2b_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["recurring_code"].startswith("REC-MK")
        assert data["status"] == "Active"
        rec_id = data["id"]

        # Pause standing order
        pause_res = client.patch(f"/api/v1/business/recurring/{rec_id}/status?status=Paused", headers=_auth(self.b2b_token))
        assert pause_res.status_code == 200
        assert pause_res.json()["status"] == "Paused"

    def test_retail_customer_forbidden_from_b2b_portal(self):
        res = client.get("/api/v1/business/dashboard", headers=_auth(self.cust_token))
        assert res.status_code == 403
