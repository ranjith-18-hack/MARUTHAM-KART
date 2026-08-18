"""
Integration test suite for Phase 7: Recruitment Officer & Staff Onboarding Workflow.

Covers:
  - Recruitment Dashboard & KPIs
  - Applicant Pipeline & Document Verification
  - One-click Account Provisioning from Applications
  - Direct Employee, Driver, Vehicle, and Partner Onboarding
  - Department Management & Member Rosters
  - Unified Organizational Directory with Search & Filters
  - Account Lifecycle Operations (Activate, Suspend, Deactivate, Transfer)
  - Onboarding Checklists
  - Recruitment Audit Logs
  - RBAC & Departmental Separation
"""
from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_password_hash
from app.database.connection import SessionLocal
from app.main import app
from app.models.models import (
    Applicant,
    ApplicantDocument,
    AuditLog,
    B2BPartner,
    Department,
    Driver,
    Employee,
    Godown,
    GodownUserAssignment,
    OnboardingTask,
    User,
    Vehicle,
)
from app.schemas.auth import UserRole

client = TestClient(app)


# ── Test Helpers ──────────────────────────────────────────────────────────────

def _unique_email(prefix: str = "rec_test") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@maruthamkart.com"


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _db():
    return SessionLocal()


def _create_user(role: str, name: str = "Test User") -> tuple[str, str]:
    email = _unique_email(role.lower())
    pw = "SecretPass123!"
    db = _db()
    u = User(
        name=name,
        email=email,
        password_hash=get_password_hash(pw),
        role=role.upper(),
        status="Active",
    )
    db.add(u)
    db.flush()

    if role.upper() in ("RECRUITMENT_OFFICER", "ADMIN", "GODOWN_MANAGER", "TRANSPORT_MANAGER", "EMPLOYEE"):
        dept = db.query(Department).first()
        if not dept:
            dept = Department(name="GENERAL", code="MK-GEN")
            db.add(dept)
            db.flush()
        emp = Employee(
            id=u.id,
            employee_code=f"MK-EMP-{uuid.uuid4().hex[:4].upper()}",
            department_id=dept.id,
            role=role.upper(),
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
    return uid, token


def _delete_user(user_id: str):
    db = _db()
    uid = uuid.UUID(user_id)
    db.query(AuditLog).filter(AuditLog.user_id == uid).delete()
    db.query(GodownUserAssignment).filter(GodownUserAssignment.user_id == uid).delete()
    db.query(ApplicantDocument).filter(ApplicantDocument.verified_by_id == uid).update({"verified_by_id": None})
    db.query(Applicant).filter(Applicant.assigned_officer_id == uid).update({"assigned_officer_id": None})
    db.query(OnboardingTask).filter(OnboardingTask.completed_by_id == uid).update({"completed_by_id": None})
    db.query(Employee).filter(Employee.created_by_id == uid).update({"created_by_id": None})
    db.query(Employee).filter(Employee.id == uid).delete()
    db.query(Driver).filter(Driver.id == uid).delete()
    db.query(B2BPartner).filter(B2BPartner.id == uid).delete()
    db.query(User).filter(User.id == uid).delete()
    db.commit()
    db.close()


def _delete_vehicle(vehicle_id: str):
    db = _db()
    vid = uuid.UUID(vehicle_id)
    db.query(Driver).filter(Driver.vehicle_id == vid).update({"vehicle_id": None})
    db.query(Vehicle).filter(Vehicle.id == vid).delete()
    db.commit()
    db.close()


def _delete_applicant(applicant_id: str):
    db = _db()
    aid = uuid.UUID(applicant_id)
    db.query(ApplicantDocument).filter(ApplicantDocument.applicant_id == aid).delete()
    db.query(Applicant).filter(Applicant.id == aid).delete()
    db.commit()
    db.close()


def _delete_department(department_id: str):
    db = _db()
    did = uuid.UUID(department_id)
    default_dept = db.query(Department).filter(Department.id != did).first()
    if default_dept:
        db.query(Employee).filter(Employee.department_id == did).update({"department_id": default_dept.id})
    db.query(Department).filter(Department.id == did).delete()
    db.commit()
    db.close()


# ══════════════════════════════════════════════════════════════════════════════
# 1. Recruitment Dashboard & KPIs
# ══════════════════════════════════════════════════════════════════════════════

class TestRecruitmentDashboard:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")
        self.admin_id, self.admin_token = _create_user("ADMIN")
        self.cust_id, self.cust_token = _create_user("CUSTOMER")
        self.drv_id, self.drv_token = _create_user("DRIVER")
        self.gd_id, self.gd_token = _create_user("GODOWN_MANAGER")

    def teardown_method(self):
        _delete_user(self.rec_id)
        _delete_user(self.admin_id)
        _delete_user(self.cust_id)
        _delete_user(self.drv_id)
        _delete_user(self.gd_id)

    def test_dashboard_returns_metrics(self):
        res = client.get("/api/v1/recruitment/dashboard", headers=_auth(self.rec_token))
        assert res.status_code == 200
        data = res.json()
        assert "kpi_cards" in data
        assert "category_summaries" in data
        assert "pipeline_stages" in data
        assert "total_accounts" in data
        assert "active_staff" in data
        assert len(data["kpi_cards"]) >= 6
        assert len(data["category_summaries"]) >= 4

    def test_admin_can_access_dashboard(self):
        res = client.get("/api/v1/recruitment/dashboard", headers=_auth(self.admin_token))
        assert res.status_code == 200

    def test_customer_forbidden_from_recruitment(self):
        res = client.get("/api/v1/recruitment/dashboard", headers=_auth(self.cust_token))
        assert res.status_code == 403

    def test_driver_forbidden_from_recruitment(self):
        res = client.get("/api/v1/recruitment/dashboard", headers=_auth(self.drv_token))
        assert res.status_code == 403

    def test_godown_manager_forbidden_from_recruitment(self):
        res = client.get("/api/v1/recruitment/dashboard", headers=_auth(self.gd_token))
        assert res.status_code == 403

    def test_unauthenticated_cannot_access(self):
        res = client.get("/api/v1/recruitment/dashboard")
        assert res.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# 2. Applicant Pipeline & Document Verification
# ══════════════════════════════════════════════════════════════════════════════

class TestApplicantPipeline:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")
        self.app_ids: list[str] = []
        self.user_ids: list[str] = []

    def teardown_method(self):
        for aid in self.app_ids:
            _delete_applicant(aid)
        for uid in self.user_ids:
            _delete_user(uid)
        _delete_user(self.rec_id)

    def test_create_and_list_applicant(self):
        email = _unique_email("app_cand")
        res = client.post(
            "/api/v1/recruitment/applications",
            json={
                "name": "Karthik Raj",
                "category": "Driver",
                "type": "Home Delivery Driver",
                "location": "Madurai",
                "contact_email": email,
                "contact_phone": f"+9198{uuid.uuid4().hex[:8]}",
                "notes": "Experienced heavy vehicle driver",
            },
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Karthik Raj"
        assert data["applicant_code"].startswith("APP-DRI")
        assert data["status"] == "New"
        self.app_ids.append(data["id"])

        # List with filter
        list_res = client.get("/api/v1/recruitment/applications?category=Driver", headers=_auth(self.rec_token))
        assert list_res.status_code == 200
        ids = [a["id"] for a in list_res.json()["items"]]
        assert data["id"] in ids

    def test_update_applicant_status(self):
        email = _unique_email("app_status")
        create_res = client.post(
            "/api/v1/recruitment/applications",
            json={
                "name": "Anitha S",
                "category": "Employee",
                "type": "Operations Executive",
                "location": "Coimbatore",
                "contact_email": email,
                "contact_phone": f"+9198{uuid.uuid4().hex[:8]}",
            },
            headers=_auth(self.rec_token),
        )
        aid = create_res.json()["id"]
        self.app_ids.append(aid)

        # Advance to Document Verification
        patch_res = client.patch(
            f"/api/v1/recruitment/applications/{aid}/status",
            json={"status": "Document Verification", "notes": "Screening passed"},
            headers=_auth(self.rec_token),
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "Document Verification"

    def test_attach_and_verify_document(self):
        email = _unique_email("app_doc")
        create_res = client.post(
            "/api/v1/recruitment/applications",
            json={
                "name": "Suresh Babu",
                "category": "Hotel / Business",
                "location": "Chennai",
                "contact_email": email,
                "contact_phone": f"+9198{uuid.uuid4().hex[:8]}",
            },
            headers=_auth(self.rec_token),
        )
        aid = create_res.json()["id"]
        self.app_ids.append(aid)

        # Attach document
        doc_res = client.post(
            f"/api/v1/recruitment/applications/{aid}/documents",
            json={"name": "GST Registration Certificate", "type": "Business Document"},
            headers=_auth(self.rec_token),
        )
        assert doc_res.status_code == 201
        doc_id = doc_res.json()["id"]
        assert doc_res.json()["status"] == "Submitted"

        # Verify document
        verif_res = client.patch(
            f"/api/v1/recruitment/applications/{aid}/documents/{doc_id}",
            json={"status": "Verified", "notes": "Valid GST active status"},
            headers=_auth(self.rec_token),
        )
        assert verif_res.status_code == 200
        assert verif_res.json()["status"] == "Verified"

    def test_provision_account_from_application(self):
        email = _unique_email("app_prov")
        create_res = client.post(
            "/api/v1/recruitment/applications",
            json={
                "name": "Manikandan P",
                "category": "Driver",
                "type": "Home Delivery Driver",
                "location": "Salem",
                "contact_email": email,
                "contact_phone": f"+9198{uuid.uuid4().hex[:8]}",
            },
            headers=_auth(self.rec_token),
        )
        aid = create_res.json()["id"]
        self.app_ids.append(aid)

        # Approve applicant
        client.patch(
            f"/api/v1/recruitment/applications/{aid}/status",
            json={"status": "Approved"},
            headers=_auth(self.rec_token),
        )

        # Provision account
        prov_res = client.post(
            f"/api/v1/recruitment/applications/{aid}/provision",
            json={"initial_password": "SecureDriverPassword123!"},
            headers=_auth(self.rec_token),
        )
        assert prov_res.status_code == 201
        user_data = prov_res.json()
        assert user_data["email"] == email
        assert user_data["role"] == "DRIVER"
        assert user_data["status"] == "Active"
        self.user_ids.append(user_data["id"])

        # Verify application is marked Account Created
        app_check = client.get(f"/api/v1/recruitment/applications/{aid}", headers=_auth(self.rec_token)).json()
        assert app_check["status"] == "Account Created"


# ══════════════════════════════════════════════════════════════════════════════
# 3. Direct Staff / Employee Onboarding
# ══════════════════════════════════════════════════════════════════════════════

class TestDirectEmployeeOnboarding:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")
        self.emp_ids: list[str] = []

    def teardown_method(self):
        for eid in self.emp_ids:
            _delete_user(eid)
        _delete_user(self.rec_id)

    def test_onboard_employee_success(self):
        email = _unique_email("emp_direct")
        res = client.post(
            "/api/v1/recruitment/employees",
            json={
                "name": "Divya Ramesh",
                "email": email,
                "phone": f"+9198{uuid.uuid4().hex[:8]}",
                "password": "Password123!",
                "department_name": "Office",
                "role": "EMPLOYEE",
                "location": "Headquarters",
            },
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Divya Ramesh"
        assert data["employee_code"].startswith("MK-EMP")
        assert data["department_name"] == "OFFICE"
        assert data["portal"] == "/office/dashboard"
        assert data["status"] == "Active"
        self.emp_ids.append(data["id"])

    def test_onboard_godown_manager_auto_associates_godown(self):
        email = _unique_email("emp_gd")
        res = client.post(
            "/api/v1/recruitment/employees",
            json={
                "name": "Murugan G",
                "email": email,
                "phone": f"+9198{uuid.uuid4().hex[:8]}",
                "password": "Password123!",
                "department_name": "Godown",
                "role": "GODOWN_MANAGER",
                "location": "Central Warehouse",
            },
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["role"] == "GODOWN_MANAGER"
        assert data["portal"] == "/godown"
        self.emp_ids.append(data["id"])

    def test_onboard_transport_manager_associates_transport(self):
        email = _unique_email("emp_tr")
        res = client.post(
            "/api/v1/recruitment/employees",
            json={
                "name": "Velmurugan T",
                "email": email,
                "phone": f"+9198{uuid.uuid4().hex[:8]}",
                "password": "Password123!",
                "department_name": "Transport",
                "role": "TRANSPORT_MANAGER",
                "location": "Logistics Hub",
            },
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["role"] == "TRANSPORT_MANAGER"
        assert data["portal"] == "/transport"
        self.emp_ids.append(data["id"])

    def test_duplicate_employee_email_rejected(self):
        email = _unique_email("emp_dup")
        phone = f"+9198{uuid.uuid4().hex[:8]}"
        res1 = client.post(
            "/api/v1/recruitment/employees",
            json={
                "name": "First Employee",
                "email": email,
                "phone": phone,
                "password": "Password123!",
                "department_name": "Office",
                "role": "EMPLOYEE",
            },
            headers=_auth(self.rec_token),
        )
        assert res1.status_code == 201
        self.emp_ids.append(res1.json()["id"])

        # Second with same email
        res2 = client.post(
            "/api/v1/recruitment/employees",
            json={
                "name": "Second Employee",
                "email": email,
                "phone": f"+9198{uuid.uuid4().hex[:8]}",
                "password": "Password123!",
                "department_name": "Office",
                "role": "EMPLOYEE",
            },
            headers=_auth(self.rec_token),
        )
        assert res2.status_code == 409


# ══════════════════════════════════════════════════════════════════════════════
# 4. Direct Driver Onboarding & Transport Portal Synchronization
# ══════════════════════════════════════════════════════════════════════════════

class TestDirectDriverOnboarding:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.drv_ids: list[str] = []

    def teardown_method(self):
        for did in self.drv_ids:
            _delete_user(did)
        _delete_user(self.tr_id)
        _delete_user(self.rec_id)

    def test_onboard_driver_and_verify_in_transport_portal(self):
        email = _unique_email("drv_rec")
        phone = f"+9198{uuid.uuid4().hex[:8]}"
        res = client.post(
            "/api/v1/recruitment/drivers",
            json={
                "name": "Ranganathan K",
                "email": email,
                "phone": phone,
                "password": "DriverSecret123!",
                "type": "Home Delivery Driver",
                "location": "Coimbatore",
            },
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Ranganathan K"
        assert data["driver_code"].startswith("MK-DRI")
        assert data["availability"] == "Available"
        assert data["portal"] == "/driver/dashboard"
        driver_id = data["id"]
        self.drv_ids.append(driver_id)

        # Critical Business Rule: Transport Portal must automatically see the driver!
        tr_res = client.get("/api/v1/transport/drivers", headers=_auth(self.tr_token))
        assert tr_res.status_code == 200
        tr_driver_ids = [d["id"] for d in tr_res.json()["items"]]
        assert driver_id in tr_driver_ids


# ══════════════════════════════════════════════════════════════════════════════
# 5. Direct Vehicle Onboarding & Transport Fleet Synchronization
# ══════════════════════════════════════════════════════════════════════════════

class TestDirectVehicleOnboarding:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")
        self.tr_id, self.tr_token = _create_user("TRANSPORT_MANAGER")
        self.veh_ids: list[str] = []

    def teardown_method(self):
        for vid in self.veh_ids:
            _delete_vehicle(vid)
        _delete_user(self.tr_id)
        _delete_user(self.rec_id)

    def test_onboard_vehicle_and_verify_in_transport_fleet(self):
        plate = f"TN-38-RC-{uuid.uuid4().hex[:4].upper()}"
        res = client.post(
            "/api/v1/recruitment/vehicles",
            json={
                "number": plate,
                "type": "Mini Truck",
                "max_weight": 850.0,
                "max_volume": 4.5,
            },
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["number"] == plate
        assert data["vehicle_code"].startswith("MK-V")
        assert data["status"] == "Available"
        veh_id = data["id"]
        self.veh_ids.append(veh_id)

        # Critical Business Rule: Transport Portal must automatically see the vehicle in the fleet!
        tr_fleet_res = client.get("/api/v1/transport/vehicles", headers=_auth(self.tr_token))
        assert tr_fleet_res.status_code == 200
        fleet_ids = [v["id"] for v in tr_fleet_res.json()["items"]]
        assert veh_id in fleet_ids

    def test_duplicate_vehicle_number_rejected(self):
        plate = f"TN-38-DUP-{uuid.uuid4().hex[:4].upper()}"
        res1 = client.post(
            "/api/v1/recruitment/vehicles",
            json={"number": plate, "type": "Two Wheeler", "max_weight": 30.0},
            headers=_auth(self.rec_token),
        )
        assert res1.status_code == 201
        self.veh_ids.append(res1.json()["id"])

        # Second vehicle with same number
        res2 = client.post(
            "/api/v1/recruitment/vehicles",
            json={"number": plate, "type": "Two Wheeler", "max_weight": 30.0},
            headers=_auth(self.rec_token),
        )
        assert res2.status_code == 409


# ══════════════════════════════════════════════════════════════════════════════
# 6. Direct Hotel / Business Partner Onboarding
# ══════════════════════════════════════════════════════════════════════════════

class TestDirectPartnerOnboarding:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")
        self.partner_ids: list[str] = []

    def teardown_method(self):
        for pid in self.partner_ids:
            _delete_user(pid)
        _delete_user(self.rec_id)

    def test_onboard_partner_success(self):
        email = _unique_email("partner_b2b")
        res = client.post(
            "/api/v1/recruitment/partners",
            json={
                "name": "Kannan Sundaram",
                "business_name": "Sri Krishna Sweets & Hotel",
                "business_type": "Hotel",
                "email": email,
                "phone": f"+9198{uuid.uuid4().hex[:8]}",
                "password": "PartnerPass123!",
                "location": "Coimbatore",
            },
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["business_name"] == "Sri Krishna Sweets & Hotel"
        assert data["business_code"].startswith("MK-BUS")
        assert data["portal"] == "/business"
        assert data["verification_status"] == "Verified"
        self.partner_ids.append(data["id"])

        # List partners
        list_res = client.get("/api/v1/recruitment/partners", headers=_auth(self.rec_token))
        assert list_res.status_code == 200
        ids = [p["id"] for p in list_res.json()["items"]]
        assert data["id"] in ids


# ══════════════════════════════════════════════════════════════════════════════
# 7. Department Management
# ══════════════════════════════════════════════════════════════════════════════

class TestDepartmentManagement:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")
        self.dept_ids: list[str] = []

    def teardown_method(self):
        for did in self.dept_ids:
            _delete_department(did)
        _delete_user(self.rec_id)

    def test_create_and_list_departments(self):
        dname = f"QUALITY_CONTROL_{uuid.uuid4().hex[:4].upper()}"
        res = client.post(
            "/api/v1/recruitment/departments",
            json={"name": dname, "code": "MK-QC", "description": "Agricultural produce quality auditing"},
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == dname
        assert data["code"] == "MK-QC"
        self.dept_ids.append(data["id"])

        # List departments
        list_res = client.get("/api/v1/recruitment/departments", headers=_auth(self.rec_token))
        assert list_res.status_code == 200
        names = [d["name"] for d in list_res.json()["items"]]
        assert dname in names

    def test_duplicate_department_rejected(self):
        dname = f"LEGAL_{uuid.uuid4().hex[:4].upper()}"
        res1 = client.post(
            "/api/v1/recruitment/departments",
            json={"name": dname},
            headers=_auth(self.rec_token),
        )
        assert res1.status_code == 201
        self.dept_ids.append(res1.json()["id"])

        res2 = client.post(
            "/api/v1/recruitment/departments",
            json={"name": dname},
            headers=_auth(self.rec_token),
        )
        assert res2.status_code == 409


# ══════════════════════════════════════════════════════════════════════════════
# 8. Unified Organizational Directory & Lifecycle Operations
# ══════════════════════════════════════════════════════════════════════════════

class TestDirectoryAndLifecycle:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")
        self.emp_id, _ = _create_user("EMPLOYEE", name="Priya Selvam")
        self.emp_ids = [self.emp_id]

    def teardown_method(self):
        for eid in self.emp_ids:
            _delete_user(eid)
        _delete_user(self.rec_id)

    def test_directory_lists_accounts_with_portal_and_permissions(self):
        res = client.get("/api/v1/recruitment/directory", headers=_auth(self.rec_token))
        assert res.status_code == 200
        items = res.json()["items"]
        assert len(items) >= 1
        emp_item = next((i for i in items if i["user_id"] == self.emp_id), None)
        assert emp_item is not None
        assert emp_item["name"] == "Priya Selvam"
        assert len(emp_item["permissions"]) > 0

    def test_suspend_and_activate_account(self):
        # Suspend account
        susp_res = client.post(
            f"/api/v1/recruitment/accounts/{self.emp_id}/suspend",
            json={"status": "Suspended", "reason": "Security review"},
            headers=_auth(self.rec_token),
        )
        assert susp_res.status_code == 200
        assert susp_res.json()["status"] == "Suspended"

        # Suspended user cannot login
        db = _db()
        u = db.query(User).filter(User.id == uuid.UUID(self.emp_id)).first()
        email = u.email
        db.close()

        login_res = client.post("/api/v1/auth/login", json={"identifier": email, "password": "SecretPass123!"})
        assert login_res.status_code == 403

        # Reactivate account
        act_res = client.post(f"/api/v1/recruitment/accounts/{self.emp_id}/activate", headers=_auth(self.rec_token))
        assert act_res.status_code == 200
        assert act_res.json()["status"] == "Active"

    def test_transfer_employee_department(self):
        res = client.post(
            f"/api/v1/recruitment/accounts/{self.emp_id}/transfer",
            json={
                "new_department": "GODOWN",
                "new_role": "GODOWN_MANAGER",
                "reason": "Promotion to Warehouse Operations",
            },
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 200
        data = res.json()
        assert data["department_name"] == "GODOWN"
        assert data["role"] == "GODOWN_MANAGER"
        assert data["portal"] == "/godown"


# ══════════════════════════════════════════════════════════════════════════════
# 9. Onboarding Checklists
# ══════════════════════════════════════════════════════════════════════════════

class TestOnboardingChecklists:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")

    def teardown_method(self):
        _delete_user(self.rec_id)

    def test_get_onboarding_checklists(self):
        res = client.get("/api/v1/recruitment/onboarding/checklists", headers=_auth(self.rec_token))
        assert res.status_code == 200
        data = res.json()
        assert "Business" in data
        assert "Driver" in data
        assert "Vehicle" in data
        assert "Employee" in data
        assert "progress_percentage" in data["Driver"]
        assert len(data["Driver"]["tasks"]) >= 4

    def test_update_onboarding_task_status(self):
        lists_res = client.get("/api/v1/recruitment/onboarding/checklists", headers=_auth(self.rec_token))
        driver_tasks = lists_res.json()["Driver"]["tasks"]
        task_id = driver_tasks[0]["id"]

        patch_res = client.patch(
            f"/api/v1/recruitment/onboarding/checklists/{task_id}",
            json={"status": "completed"},
            headers=_auth(self.rec_token),
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "completed"
        assert patch_res.json()["completed_at"] is not None


# ══════════════════════════════════════════════════════════════════════════════
# 10. Recruitment Audit Logs & RBAC Separation
# ══════════════════════════════════════════════════════════════════════════════

class TestRecruitmentAuditAndRBAC:

    def setup_method(self):
        self.rec_id, self.rec_token = _create_user("RECRUITMENT_OFFICER")

    def teardown_method(self):
        _delete_user(self.rec_id)

    def test_recruitment_audit_logs_recorded(self):
        res = client.get("/api/v1/recruitment/logs", headers=_auth(self.rec_token))
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data

    def test_recruitment_officer_cannot_modify_inventory(self):
        # Separation of concerns: Recruitment officer cannot alter godown inventory
        res = client.post(
            "/api/v1/godown/stock-adjustments",
            json={
                "product_id": str(uuid.uuid4()),
                "movement_type": "ADJUSTMENT",
                "quantity": 100.0,
                "reason": "Unauthorized test",
            },
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 403

    def test_recruitment_officer_cannot_dispatch_transport(self):
        # Separation of concerns: Recruitment officer cannot dispatch transport orders
        res = client.post(
            f"/api/v1/transport/orders/{uuid.uuid4()}/dispatch",
            headers=_auth(self.rec_token),
        )
        assert res.status_code == 403
