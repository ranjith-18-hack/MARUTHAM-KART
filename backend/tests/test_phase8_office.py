"""
Integration test suite for Phase 8: Office, Finance, Reconciliation & Compliance.
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
    Department,
    Employee,
    Expense,
    MonthlyReport,
    User,
)

client = TestClient(app)


def _unique_email(prefix: str = "office_test") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@maruthamkart.com"


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _db():
    return SessionLocal()


def _create_user(role: str, name: str = "Office User") -> tuple[str, str, str]:
    email = _unique_email(role.lower())
    pw = "OfficePass123!"
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

    dept = db.query(Department).first()
    if not dept:
        dept = Department(name="FINANCE", code="MK-FIN", description="Finance & Accounting")
        db.add(dept)
        db.flush()

    dept_id = str(dept.id)

    if role.upper() in ("EMPLOYEE", "ADMIN", "RECRUITMENT_OFFICER"):
        emp = Employee(
            id=u.id,
            employee_code=f"MK-EMP-{uuid.uuid4().hex[:4].upper()}",
            department_id=dept.id,
            role="Finance Manager",
            location="Headquarters",
        )
        db.add(emp)

    db.commit()
    db.refresh(u)
    uid = str(u.id)
    db.close()

    res = client.post("/api/v1/auth/login", json={"identifier": email, "password": pw})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return uid, token, dept_id


def _delete_user(user_id: str):
    db = _db()
    uid = uuid.UUID(user_id)
    db.query(AuditLog).filter(AuditLog.user_id == uid).delete()
    db.query(Expense).filter(Expense.employee_id == uid).delete()
    db.query(MonthlyReport).filter(MonthlyReport.prepared_by_id == uid).delete()
    db.query(MonthlyReport).filter(MonthlyReport.approved_by_id == uid).update({"approved_by_id": None})
    db.query(Employee).filter(Employee.created_by_id == uid).update({"created_by_id": None})
    db.query(Employee).filter(Employee.id == uid).delete()
    db.query(User).filter(User.id == uid).delete()
    db.commit()
    db.close()


class TestOfficePortal:

    def setup_method(self):
        self.officer_id, self.officer_token, self.dept_id = _create_user("EMPLOYEE", name="Finance Executive")
        self.cust_id, self.cust_token, _ = _create_user("CUSTOMER", name="Retail Customer")

    def teardown_method(self):
        _delete_user(self.officer_id)
        _delete_user(self.cust_id)

    def test_office_dashboard_summary(self):
        res = client.get("/api/v1/office/dashboard", headers=_auth(self.officer_token))
        assert res.status_code == 200
        data = res.json()
        assert "total_revenue_month" in data
        assert "total_expenses_month" in data
        assert "net_operating_profit" in data
        assert "reconciliation_status" in data

    def test_monthly_report_generation_and_approval(self):
        # 1. Generate report
        res = client.post(
            "/api/v1/office/reports/generate",
            json={
                "department_id": self.dept_id,
                "location": "Headquarters",
                "month": "August 2026",
            },
            headers=_auth(self.officer_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["report_code"].startswith("MK-")
        assert data["status"] == "Submitted"
        report_id = data["id"]

        # 2. View details
        detail_res = client.get(f"/api/v1/office/reports/{report_id}", headers=_auth(self.officer_token))
        assert detail_res.status_code == 200
        assert "summary" in detail_res.json()

        # 3. Approve report
        apprv_res = client.post(f"/api/v1/office/reports/{report_id}/approve", headers=_auth(self.officer_token))
        assert apprv_res.status_code == 200
        assert apprv_res.json()["status"] == "Finalized"
        assert apprv_res.json()["digital_approval_status"] == "Finance Signed"

    def test_expense_voucher_submission_and_approval(self):
        # 1. Submit expense
        res = client.post(
            "/api/v1/office/expenses",
            json={
                "department_id": self.dept_id,
                "description": "Warehouse Temperature Sensor Maintenance",
                "amount": 3500.00,
            },
            headers=_auth(self.officer_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert float(data["amount"]) == 3500.00
        assert data["status"] == "Pending"
        exp_id = data["id"]

        # 2. Approve expense
        apprv_res = client.patch(f"/api/v1/office/expenses/{exp_id}/status", json={"status": "Paid"}, headers=_auth(self.officer_token))
        assert apprv_res.status_code == 200
        assert apprv_res.json()["status"] == "Paid"

    def test_reconciliation_audit(self):
        res = client.get("/api/v1/office/reconciliation", headers=_auth(self.officer_token))
        assert res.status_code == 200
        data = res.json()
        assert data["overall_status"] == "Clean"
        assert len(data["items"]) >= 3

    def test_compliance_dashboard(self):
        res = client.get("/api/v1/office/compliance", headers=_auth(self.officer_token))
        assert res.status_code == 200
        data = res.json()
        assert data["compliance_rate"] >= 95
        assert len(data["items"]) >= 4

    def test_customer_forbidden_from_office_portal(self):
        res = client.get("/api/v1/office/dashboard", headers=_auth(self.cust_token))
        assert res.status_code == 403
