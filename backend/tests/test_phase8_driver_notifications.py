"""
Integration test suite for Phase 8: Driver Mobile Companion & Universal Notifications.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.core.security import get_password_hash
from app.database.connection import SessionLocal
from app.main import app
from app.models.models import (
    AuditLog,
    Delivery,
    DeliveryOTP,
    Driver,
    Godown,
    Notification,
    Order,
    OrderItem,
    OrderStatusHistory,
    Product,
    User,
    Vehicle,
)

client = TestClient(app)


def _unique_email(prefix: str = "drv_notif") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@maruthamkart.com"


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _db():
    return SessionLocal()


def _create_user(role: str, name: str = "Driver User") -> tuple[str, str]:
    email = _unique_email(role.lower())
    pw = "DriverPass123!"
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

    if role.upper() == "DRIVER":
        drv = Driver(
            id=u.id,
            driver_code=f"MK-DRI-{uuid.uuid4().hex[:3].upper()}",
            type="Express Van Driver",
            availability="Available",
            workload=0,
        )
        db.add(drv)

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
    db.query(Notification).filter(Notification.user_id == uid).delete()
    db.query(DeliveryOTP).filter(DeliveryOTP.order_id.in_(db.query(Order.id).filter(Order.customer_id == uid))).delete(synchronize_session=False)
    db.query(OrderStatusHistory).filter(OrderStatusHistory.changed_by_id == uid).delete()
    db.query(Delivery).filter(Delivery.driver_id == uid).delete()
    db.query(Order).filter(Order.customer_id == uid).delete()
    db.query(Driver).filter(Driver.id == uid).delete()
    db.query(User).filter(User.id == uid).delete()
    db.commit()
    db.close()


class TestDriverCompanionAndNotifications:

    def setup_method(self):
        self.driver_id, self.driver_token = _create_user("DRIVER", name="Karthik Driver")
        self.cust_id, self.cust_token = _create_user("CUSTOMER", name="Meena Customer")

    def teardown_method(self):
        _delete_user(self.driver_id)
        _delete_user(self.cust_id)

    def test_driver_dashboard_and_deliveries_list(self):
        res = client.get("/api/v1/driver/dashboard", headers=_auth(self.driver_token))
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Karthik Driver"
        assert "pending_deliveries" in data

    def test_driver_trip_lifecycle_and_otp_verification(self):
        # 1. Setup Order, Delivery, and DeliveryOTP
        db = _db()
        godown = db.query(Godown).first()
        if not godown:
            godown = Godown(name="Central Warehouse", code="MK-WH-01", location="Tamil Nadu", capacity=10000.0, status="Active")
            db.add(godown)
            db.flush()

        order = Order(
            order_code=f"ORD-MK-{uuid.uuid4().hex[:4].upper()}",
            customer_id=uuid.UUID(self.cust_id),
            buyer_type="Customer",
            total_amount=Decimal("1500.00"),
            destination="Madurai Central",
            delivery_address="12 Main Bazaar, Madurai",
            status="Ready for Dispatch",
            created_at=datetime.utcnow(),
        )
        db.add(order)
        db.flush()

        deliv = Delivery(
            order_id=order.id,
            type="Customer Delivery",
            source_godown_id=godown.id,
            driver_id=uuid.UUID(self.driver_id),
            destination=order.destination,
            quantity="10 kg",
            priority="Standard",
            status="Driver Assigned",
            created_at=datetime.utcnow(),
        )
        db.add(deliv)
        db.flush()

        otp_code = "458921"
        otp_rec = DeliveryOTP(
            order_id=order.id,
            otp_hash=get_password_hash(otp_code),
            expires_at=datetime.utcnow() + timedelta(hours=2),
            attempts=0,
            max_attempts=3,
        )
        db.add(otp_rec)
        db.commit()

        deliv_id = str(deliv.id)
        db.close()

        # 2. Start delivery trip
        start_res = client.post(f"/api/v1/driver/deliveries/{deliv_id}/start", headers=_auth(self.driver_token))
        assert start_res.status_code == 200
        assert start_res.json()["status"] == "On Route"

        # 3. Transmit GPS telemetry
        loc_res = client.post(
            f"/api/v1/driver/deliveries/{deliv_id}/location",
            json={"latitude": 9.9252, "longitude": 78.1198, "speed_kmh": 42.5},
            headers=_auth(self.driver_token),
        )
        assert loc_res.status_code == 200

        # 4. Verify OTP to confirm delivery
        otp_res = client.post(
            f"/api/v1/driver/deliveries/{deliv_id}/verify-otp",
            json={"otp": otp_code},
            headers=_auth(self.driver_token),
        )
        assert otp_res.status_code == 200
        assert otp_res.json()["status"] == "Delivered"

    def test_universal_notifications_workflow(self):
        # 1. Create notification
        c_res = client.post(
            "/api/v1/notifications",
            json={
                "user_id": self.cust_id,
                "title": "Order Dispatched",
                "message": "Your organic vegetables are on the way!",
            },
            headers=_auth(self.cust_token),
        )
        assert c_res.status_code == 201
        notif_id = c_res.json()["id"]

        # 2. Check unread count
        count_res = client.get("/api/v1/notifications/unread-count", headers=_auth(self.cust_token))
        assert count_res.status_code == 200
        assert count_res.json()["unread_count"] >= 1

        # 3. List notifications
        list_res = client.get("/api/v1/notifications", headers=_auth(self.cust_token))
        assert list_res.status_code == 200
        assert list_res.json()["total"] >= 1

        # 4. Mark single read
        read_res = client.patch(f"/api/v1/notifications/{notif_id}/read", headers=_auth(self.cust_token))
        assert read_res.status_code == 200
        assert read_res.json()["is_read"] is True

        # 5. Mark all read
        all_read_res = client.post("/api/v1/notifications/read-all", headers=_auth(self.cust_token))
        assert all_read_res.status_code == 200
