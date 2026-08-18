"""
Phase 3 Authentication & RBAC Integration Tests

Covers:
  - Customer registration (success, duplicate, missing email+phone)
  - Login (correct password, wrong password, inactive account)
  - JWT structure and token refresh
  - Expired/invalid JWT rejection
  - /auth/me endpoint
  - Role-based portal access (authorized vs unauthorized)
  - Recruitment officer account creation
  - Account approval flow
  - Department restrictions (cross-role access forbidden)
  - Duplicate account handling

Run from backend/ directory:
  .\\venv\\Scripts\\python -m pytest tests/test_auth.py -v
"""
from __future__ import annotations
import uuid
import time
from datetime import timedelta
from typing import Optional

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.connection import get_db, SessionLocal
from app.models.models import Customer, Driver, Employee, User
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
)
from app.schemas.auth import UserRole

# ── Test client ───────────────────────────────────────────────────────────────

client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _unique_email(prefix: str = "test") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@test.maruthamkart.com"


def _unique_phone() -> str:
    import random
    return f"9{random.randint(100000000, 999999999)}"


def _db() -> Session:
    return SessionLocal()


def _create_user(
    role: str,
    status: str = "Active",
    email: Optional[str] = None,
    phone: Optional[str] = None,
) -> User:
    """Helper: create and persist a User directly in the DB for test setup."""
    db = _db()
    try:
        user = User(
            name=f"Test {role}",
            email=email or _unique_email(role.lower()),
            phone=phone,
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


def _delete_user(user_id) -> None:
    db = _db()
    try:
        from app.models.models import AuditLog, Employee, Driver, B2BPartner, Customer, GodownUserAssignment, TransportAssignment, Delivery
        uid = uuid.UUID(str(user_id))
        db.query(AuditLog).filter(AuditLog.user_id == uid).delete()
        db.query(GodownUserAssignment).filter(GodownUserAssignment.user_id == uid).delete()
        db.query(Delivery).filter(Delivery.driver_id == uid).delete()
        db.query(TransportAssignment).filter(TransportAssignment.driver_id == uid).delete()
        db.query(Employee).filter(Employee.created_by_id == uid).update({"created_by_id": None})
        db.query(Employee).filter(Employee.id == uid).delete()
        db.query(Driver).filter(Driver.id == uid).delete()
        db.query(B2BPartner).filter(B2BPartner.id == uid).delete()
        db.query(Customer).filter(Customer.id == uid).delete()
        db.query(User).filter(User.id == uid).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Customer Registration
# ═══════════════════════════════════════════════════════════════════════════════

class TestCustomerRegistration:

    def test_register_customer_with_email(self):
        email = _unique_email("cust_reg")
        res = client.post("/api/v1/auth/register/customer", json={
            "name": "Test Customer",
            "email": email,
            "password": "SecurePass@1",
        })
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["user"]["role"] == UserRole.CUSTOMER
        assert data["user"]["status"] == "Active"
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == email
        # Verify password hash NOT in response
        assert "password_hash" not in str(data)
        # Cleanup
        _delete_user(data["user"]["id"])

    def test_register_customer_with_phone(self):
        phone = _unique_phone()
        res = client.post("/api/v1/auth/register/customer", json={
            "name": "Phone Customer",
            "phone": phone,
            "password": "SecurePass@1",
        })
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["user"]["role"] == UserRole.CUSTOMER
        _delete_user(data["user"]["id"])

    def test_register_fails_without_email_or_phone(self):
        res = client.post("/api/v1/auth/register/customer", json={
            "name": "No Contact",
            "password": "SecurePass@1",
        })
        assert res.status_code == 400

    def test_register_duplicate_email_returns_409(self):
        email = _unique_email("dup_cust")
        # First registration
        res1 = client.post("/api/v1/auth/register/customer", json={
            "name": "First",
            "email": email,
            "password": "Pass1234!",
        })
        assert res1.status_code == 201
        # Second registration with same email
        res2 = client.post("/api/v1/auth/register/customer", json={
            "name": "Second",
            "email": email,
            "password": "Pass1234!",
        })
        assert res2.status_code == 409
        _delete_user(res1.json()["user"]["id"])

    def test_register_customer_code_is_assigned(self):
        email = _unique_email("cust_code")
        res = client.post("/api/v1/auth/register/customer", json={
            "name": "Code Test",
            "email": email,
            "password": "Pass1234!",
        })
        assert res.status_code == 201
        user_id = res.json()["user"]["id"]
        # Verify Customer record exists in DB
        db = _db()
        try:
            cust = db.query(Customer).filter(Customer.id == user_id).first()
            assert cust is not None
            assert cust.customer_code.startswith("MK-CUST-")
        finally:
            db.close()
        _delete_user(user_id)


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Login
# ═══════════════════════════════════════════════════════════════════════════════

class TestLogin:

    def setup_method(self):
        self.email = _unique_email("login_test")
        res = client.post("/api/v1/auth/register/customer", json={
            "name": "Login Test User",
            "email": self.email,
            "password": "CorrectPass@1",
        })
        assert res.status_code == 201
        self.user_id = res.json()["user"]["id"]

    def teardown_method(self):
        _delete_user(self.user_id)

    def test_login_correct_password(self):
        res = client.post("/api/v1/auth/login", json={
            "identifier": self.email,
            "password": "CorrectPass@1",
        })
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["token_type"] == "bearer"
        assert "access_token" in data
        assert data["user"]["role"] == UserRole.CUSTOMER
        assert data["user"]["portal_redirect"] == "/home"

    def test_login_wrong_password_returns_401(self):
        res = client.post("/api/v1/auth/login", json={
            "identifier": self.email,
            "password": "WrongPass!",
        })
        assert res.status_code == 401

    def test_login_nonexistent_user_returns_401(self):
        res = client.post("/api/v1/auth/login", json={
            "identifier": "nobody@nowhere.com",
            "password": "AnyPass123",
        })
        assert res.status_code == 401

    def test_login_suspended_account_returns_403(self):
        db = _db()
        try:
            user = db.query(User).filter(User.id == self.user_id).first()
            user.status = "Suspended"
            db.commit()
        finally:
            db.close()

        res = client.post("/api/v1/auth/login", json={
            "identifier": self.email,
            "password": "CorrectPass@1",
        })
        assert res.status_code == 403

        # Restore
        db = _db()
        try:
            user = db.query(User).filter(User.id == self.user_id).first()
            user.status = "Active"
            db.commit()
        finally:
            db.close()

    def test_login_pending_account_returns_403(self):
        db = _db()
        try:
            user = db.query(User).filter(User.id == self.user_id).first()
            user.status = "Pending"
            db.commit()
        finally:
            db.close()

        res = client.post("/api/v1/auth/login", json={
            "identifier": self.email,
            "password": "CorrectPass@1",
        })
        assert res.status_code == 403

        # Restore
        db = _db()
        try:
            user = db.query(User).filter(User.id == self.user_id).first()
            user.status = "Active"
            db.commit()
        finally:
            db.close()

    def test_login_response_excludes_password_hash(self):
        res = client.post("/api/v1/auth/login", json={
            "identifier": self.email,
            "password": "CorrectPass@1",
        })
        assert res.status_code == 200
        assert "password_hash" not in res.text


# ═══════════════════════════════════════════════════════════════════════════════
# 3. JWT Token Tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestJWT:

    def setup_method(self):
        self.email = _unique_email("jwt_test")
        res = client.post("/api/v1/auth/register/customer", json={
            "name": "JWT Test",
            "email": self.email,
            "password": "JwtPass@1",
        })
        assert res.status_code == 201
        self.user_id = res.json()["user"]["id"]
        self.access_token = res.json()["access_token"]
        self.refresh_token = res.json()["refresh_token"]

    def teardown_method(self):
        _delete_user(self.user_id)

    def test_me_endpoint_with_valid_token(self):
        res = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {self.access_token}"
        })
        assert res.status_code == 200
        assert res.json()["email"] == self.email

    def test_me_endpoint_without_token_returns_401(self):
        res = client.get("/api/v1/auth/me")
        assert res.status_code == 401

    def test_me_endpoint_with_invalid_token_returns_401(self):
        res = client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer this.is.not.a.valid.token"
        })
        assert res.status_code == 401

    def test_me_endpoint_with_expired_token_returns_401(self):
        expired_token = create_access_token(
            subject=self.user_id,
            expires_delta=timedelta(seconds=-10),  # already expired
        )
        res = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {expired_token}"
        })
        assert res.status_code == 401

    def test_token_refresh(self):
        res = client.post("/api/v1/auth/refresh", json={
            "refresh_token": self.refresh_token
        })
        assert res.status_code == 200, res.text
        data = res.json()
        # Response must include a valid access token and user data
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == self.email
        assert data["user"]["role"] == UserRole.CUSTOMER
        # The new access token must itself be usable to hit /me
        new_token = data["access_token"]
        me_res = client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {new_token}"
        })
        assert me_res.status_code == 200
        assert me_res.json()["email"] == self.email

    def test_refresh_with_access_token_fails(self):
        """An access token should NOT be accepted as a refresh token."""
        res = client.post("/api/v1/auth/refresh", json={
            "refresh_token": self.access_token
        })
        assert res.status_code == 401

    def test_logout(self):
        res = client.post("/api/v1/auth/logout", headers={
            "Authorization": f"Bearer {self.access_token}"
        })
        assert res.status_code == 200
        assert "message" in res.json()


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Role-Based Portal Access
# ═══════════════════════════════════════════════════════════════════════════════

class TestRoleAccess:

    def setup_method(self):
        self.users = {}
        self.tokens = {}

        # Create one user per relevant role
        for role in [UserRole.CUSTOMER, UserRole.GODOWN_MANAGER, UserRole.DRIVER]:
            user = _create_user(role)
            token = create_access_token(str(user.id))
            self.users[role] = user
            self.tokens[role] = token

    def teardown_method(self):
        for user in self.users.values():
            _delete_user(user.id)

    def test_customer_can_access_customer_portal(self):
        res = client.get("/api/v1/portals/customer", headers={
            "Authorization": f"Bearer {self.tokens[UserRole.CUSTOMER]}"
        })
        assert res.status_code == 200

    def test_driver_cannot_access_customer_portal(self):
        res = client.get("/api/v1/portals/customer", headers={
            "Authorization": f"Bearer {self.tokens[UserRole.DRIVER]}"
        })
        assert res.status_code == 403

    def test_godown_manager_can_access_godown_portal(self):
        res = client.get("/api/v1/portals/godown", headers={
            "Authorization": f"Bearer {self.tokens[UserRole.GODOWN_MANAGER]}"
        })
        assert res.status_code == 200

    def test_customer_cannot_access_godown_portal(self):
        res = client.get("/api/v1/portals/godown", headers={
            "Authorization": f"Bearer {self.tokens[UserRole.CUSTOMER]}"
        })
        assert res.status_code == 403

    def test_driver_can_access_driver_portal(self):
        res = client.get("/api/v1/portals/driver", headers={
            "Authorization": f"Bearer {self.tokens[UserRole.DRIVER]}"
        })
        assert res.status_code == 200

    def test_customer_cannot_access_driver_portal(self):
        res = client.get("/api/v1/portals/driver", headers={
            "Authorization": f"Bearer {self.tokens[UserRole.CUSTOMER]}"
        })
        assert res.status_code == 403

    def test_unauthenticated_cannot_access_any_portal(self):
        for path in ["/customer", "/godown", "/driver", "/recruitment", "/admin"]:
            res = client.get(f"/api/v1/portals{path}")
            assert res.status_code == 401, f"Expected 401 for {path}"


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Recruitment Account Flow
# ═══════════════════════════════════════════════════════════════════════════════

class TestRecruitmentFlow:

    def setup_method(self):
        # Create a recruitment officer
        self.officer = _create_user(UserRole.RECRUITMENT_OFFICER)
        self.officer_token = create_access_token(str(self.officer.id))
        # Create a customer (should not have recruitment access)
        self.customer = _create_user(UserRole.CUSTOMER)
        self.customer_token = create_access_token(str(self.customer.id))
        self.created_ids = []

    def teardown_method(self):
        for uid in self.created_ids:
            _delete_user(uid)
        _delete_user(self.officer.id)
        _delete_user(self.customer.id)

    def test_officer_can_create_driver_account(self):
        res = client.post("/api/v1/recruitment/accounts", json={
            "name": "New Driver",
            "email": _unique_email("drv"),
            "role": UserRole.DRIVER,
            "driver_type": "Home Delivery Driver",
            "initial_password": "DrivePass@1",
        }, headers={"Authorization": f"Bearer {self.officer_token}"})
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["role"] == UserRole.DRIVER
        # Newly created accounts start as Pending
        assert data["status"] == "Pending"
        self.created_ids.append(data["id"])

    def test_officer_can_create_employee_account(self):
        res = client.post("/api/v1/recruitment/accounts", json={
            "name": "New Employee",
            "email": _unique_email("emp"),
            "role": UserRole.EMPLOYEE,
            "department_name": "OFFICE",
            "location": "Chennai",
            "initial_password": "EmpPass@1",
        }, headers={"Authorization": f"Bearer {self.officer_token}"})
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["role"] == UserRole.EMPLOYEE
        assert data["status"] == "Pending"
        self.created_ids.append(data["id"])

    def test_officer_can_create_hotel_business_account(self):
        res = client.post("/api/v1/recruitment/accounts", json={
            "name": "Taj Hotel",
            "email": _unique_email("hotel"),
            "role": UserRole.HOTEL_BUSINESS,
            "business_name": "Taj Hotel",
            "business_type": "Hotel",
            "location": "Chennai",
            "initial_password": "HotelPass@1",
        }, headers={"Authorization": f"Bearer {self.officer_token}"})
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["role"] == UserRole.HOTEL_BUSINESS
        self.created_ids.append(data["id"])

    def test_customer_cannot_create_accounts(self):
        res = client.post("/api/v1/recruitment/accounts", json={
            "name": "Unauthorized",
            "email": _unique_email("unauth"),
            "role": UserRole.EMPLOYEE,
            "initial_password": "Pass1234!",
        }, headers={"Authorization": f"Bearer {self.customer_token}"})
        assert res.status_code == 403

    def test_cannot_create_customer_via_recruitment(self):
        res = client.post("/api/v1/recruitment/accounts", json={
            "name": "Sneaky Customer",
            "email": _unique_email("sneaky"),
            "role": UserRole.CUSTOMER,
            "initial_password": "Pass1234!",
        }, headers={"Authorization": f"Bearer {self.officer_token}"})
        assert res.status_code == 422  # Pydantic validation error

    def test_approve_pending_account_enables_login(self):
        # Step 1: Create pending driver
        email = _unique_email("apprv_drv")
        create_res = client.post("/api/v1/recruitment/accounts", json={
            "name": "Approvable Driver",
            "email": email,
            "role": UserRole.DRIVER,
            "initial_password": "DriverTemp@1",
        }, headers={"Authorization": f"Bearer {self.officer_token}"})
        assert create_res.status_code == 201
        account_id = create_res.json()["id"]
        self.created_ids.append(account_id)

        # Step 2: Login should fail (Pending)
        login_res = client.post("/api/v1/auth/login", json={
            "identifier": email,
            "password": "DriverTemp@1",
        })
        assert login_res.status_code == 403

        # Step 3: Approve
        approve_res = client.post(
            f"/api/v1/recruitment/accounts/{account_id}/approve",
            headers={"Authorization": f"Bearer {self.officer_token}"},
        )
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "Active"

        # Step 4: Login should now succeed
        login_res2 = client.post("/api/v1/auth/login", json={
            "identifier": email,
            "password": "DriverTemp@1",
        })
        assert login_res2.status_code == 200
        assert login_res2.json()["user"]["role"] == UserRole.DRIVER
        assert login_res2.json()["user"]["portal_redirect"] == "/driver/dashboard"

    def test_suspend_active_account(self):
        # Create + approve a driver
        email = _unique_email("susp_drv")
        create_res = client.post("/api/v1/recruitment/accounts", json={
            "name": "Suspendable Driver",
            "email": email,
            "role": UserRole.DRIVER,
            "initial_password": "SuspPass@1",
        }, headers={"Authorization": f"Bearer {self.officer_token}"})
        assert create_res.status_code == 201
        account_id = create_res.json()["id"]
        self.created_ids.append(account_id)

        # Approve
        client.post(
            f"/api/v1/recruitment/accounts/{account_id}/approve",
            headers={"Authorization": f"Bearer {self.officer_token}"},
        )

        # Suspend
        suspend_res = client.post(
            f"/api/v1/recruitment/accounts/{account_id}/suspend",
            json={"status": "Suspended", "reason": "Policy violation"},
            headers={"Authorization": f"Bearer {self.officer_token}"},
        )
        assert suspend_res.status_code == 200
        assert suspend_res.json()["status"] == "Suspended"

        # Login should fail
        login_res = client.post("/api/v1/auth/login", json={
            "identifier": email,
            "password": "SuspPass@1",
        })
        assert login_res.status_code == 403

    def test_duplicate_account_returns_409(self):
        email = _unique_email("dup_staff")
        create1 = client.post("/api/v1/recruitment/accounts", json={
            "name": "Staff One",
            "email": email,
            "role": UserRole.EMPLOYEE,
            "initial_password": "Pass1234!",
        }, headers={"Authorization": f"Bearer {self.officer_token}"})
        assert create1.status_code == 201
        self.created_ids.append(create1.json()["id"])

        create2 = client.post("/api/v1/recruitment/accounts", json={
            "name": "Staff Two",
            "email": email,
            "role": UserRole.EMPLOYEE,
            "initial_password": "Pass1234!",
        }, headers={"Authorization": f"Bearer {self.officer_token}"})
        assert create2.status_code == 409

    def test_list_accounts_returns_only_staff(self):
        res = client.get(
            "/api/v1/recruitment/accounts",
            headers={"Authorization": f"Bearer {self.officer_token}"},
        )
        assert res.status_code == 200
        data = res.json()
        # No customer roles should appear
        for account in data:
            assert account["role"] != UserRole.CUSTOMER
