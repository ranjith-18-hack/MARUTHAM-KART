import uuid
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.models.models import User, Customer
from app.schemas.auth import UserRole
from app.core.security import get_password_hash

client = TestClient(app)


class TestGoogleOAuth:
    @classmethod
    def setup_class(cls):
        cls.db = SessionLocal()

    @classmethod
    def teardown_class(cls):
        cls.db.close()

    def test_google_auth_new_customer_registration(self):
        unique_email = f"test_google_{uuid.uuid4().hex[:8]}@gmail.com"
        name = "Google Farm Customer"
        google_id = f"g_{uuid.uuid4().hex[:12]}"

        res = client.post("/api/v1/auth/google", json={
            "email": unique_email,
            "name": name,
            "google_id": google_id,
            "avatar_url": "https://lh3.googleusercontent.com/test-avatar"
        })

        assert res.status_code == 200, res.text
        data = res.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == name
        assert data["user"]["role"] == UserRole.CUSTOMER
        assert data["user"]["status"] == "Active"

        # Verify Customer record exists in DB
        db_user = self.db.query(User).filter(User.email == unique_email).first()
        assert db_user is not None
        customer_rec = self.db.query(Customer).filter(Customer.id == db_user.id).first()
        assert customer_rec is not None
        assert customer_rec.customer_code.startswith("MK-CUST-")

        # Cleanup
        self.db.delete(customer_rec)
        self.db.delete(db_user)
        self.db.commit()

    def test_google_auth_existing_customer_login(self):
        unique_email = f"test_existing_g_{uuid.uuid4().hex[:8]}@gmail.com"
        
        # 1. First login (creates customer)
        res1 = client.post("/api/v1/auth/google", json={
            "email": unique_email,
            "name": "Existing Google Customer",
            "google_id": "g_12345"
        })
        assert res1.status_code == 200
        user_id_1 = res1.json()["user"]["id"]

        # 2. Second login with same Google account
        res2 = client.post("/api/v1/auth/google", json={
            "email": unique_email,
            "name": "Existing Google Customer",
            "google_id": "g_12345"
        })
        assert res2.status_code == 200
        user_id_2 = res2.json()["user"]["id"]

        # Must be the exact same user ID without duplicate account
        assert user_id_1 == user_id_2

        # Cleanup
        db_user = self.db.query(User).filter(User.id == user_id_1).first()
        if db_user:
            cust = self.db.query(Customer).filter(Customer.id == db_user.id).first()
            if cust:
                self.db.delete(cust)
            self.db.delete(db_user)
            self.db.commit()

    def test_google_auth_suspended_account_returns_403(self):
        unique_email = f"suspended_g_{uuid.uuid4().hex[:8]}@gmail.com"
        
        # Create suspended user
        suspended_user = User(
            name="Suspended Google User",
            email=unique_email,
            password_hash=get_password_hash("TestPass@123"),
            role=UserRole.CUSTOMER,
            status="Suspended"
        )
        self.db.add(suspended_user)
        self.db.commit()
        self.db.refresh(suspended_user)

        try:
            res = client.post("/api/v1/auth/google", json={
                "email": unique_email,
                "name": "Suspended Google User",
                "google_id": "g_suspended_1"
            })
            assert res.status_code == 403
            assert "suspended" in res.json()["detail"].lower()
        finally:
            self.db.delete(suspended_user)
            self.db.commit()
