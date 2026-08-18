"""
Recruitment Portal & Staff Onboarding Routes.

Full implementation of Phase 7:
  - Recruitment Dashboard & KPIs
  - Applicant Pipeline & Document Verification
  - One-click Account Provisioning from Applications
  - Direct Staff, Driver, Vehicle, and Partner Onboarding
  - Department Management & Member Rosters
  - Unified Organizational Directory with Search & Filters
  - Account Lifecycle Management (Activate, Suspend, Deactivate, Transfer)
  - Onboarding Checklists
  - Recruitment Department Audit Logs
"""
from __future__ import annotations

import random
import string
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.core.dependencies import (
    get_current_user,
    get_database_session,
    require_recruitment_or_admin,
)
from app.core.security import get_password_hash
from app.models.models import (
    Applicant,
    ApplicantDocument,
    AuditLog,
    B2BPartner,
    Department,
    Driver,
    Employee,
    Farmer,
    Godown,
    GodownUserAssignment,
    OnboardingTask,
    User,
    Vehicle,
)
from app.schemas.auth import (
    AccountStatusUpdateRequest,
    MessageResponse,
    RecruitmentAccountCreateRequest,
    UserResponse,
    UserRole,
)
from app.schemas.recruitment import (
    AccountLifecycleStatusRequest,
    ApplicantCreateRequest,
    ApplicantDocumentCreateRequest,
    ApplicantDocumentResponse,
    ApplicantDocumentVerifyRequest,
    ApplicantListResponse,
    ApplicantResponse,
    ApplicantStatusUpdateRequest,
    CategorySummary,
    DepartmentCreateRequest,
    DepartmentDetailResponse,
    DepartmentListResponse,
    DepartmentResponse,
    DepartmentTransferRequest,
    DepartmentUpdateRequest,
    DirectDriverOnboardRequest,
    DirectEmployeeOnboardRequest,
    DirectPartnerOnboardRequest,
    DirectVehicleOnboardRequest,
    DirectoryAccountResponse,
    DirectoryListResponse,
    DriverDetailResponse,
    DriverListResponse,
    EmployeeDetailResponse,
    EmployeeListResponse,
    EmployeeUpdateRequest,
    KPICard,
    OnboardingChecklistResponse,
    OnboardingTaskResponse,
    OnboardingTaskUpdateRequest,
    PartnerDetailResponse,
    PartnerListResponse,
    PipelineStage,
    ProvisionAccountFromAppRequest,
    RecruitmentAuditLogListResponse,
    RecruitmentAuditLogResponse,
    RecruitmentDashboardResponse,
    VehicleDetailResponse,
    VehicleListResponse,
)

router = APIRouter(prefix="/recruitment", tags=["Recruitment"])


# ── Portal & Permission Mappings ──────────────────────────────────────────────

ROLE_PORTAL_MAP: dict[str, str] = {
    UserRole.ADMIN:               "/office/dashboard",
    UserRole.EMPLOYEE:            "/office/dashboard",
    UserRole.GODOWN_MANAGER:      "/godown",
    UserRole.TRANSPORT_MANAGER:   "/transport",
    UserRole.DRIVER:              "/driver/dashboard",
    UserRole.RECRUITMENT_OFFICER: "/recruitment",
    UserRole.HOTEL_BUSINESS:      "/business",
    UserRole.CUSTOMER:            "/home",
}

DEPARTMENT_PORTAL_MAP: dict[str, str] = {
    "GODOWN":      "/godown",
    "TRANSPORT":   "/transport",
    "RECRUITMENT": "/recruitment",
    "OFFICE":      "/office/dashboard",
    "ADMIN":       "/office/dashboard",
    "ACCOUNTS":    "/recruitment/analytics",
    "SALES":       "/business",
    "BUSINESS":    "/business",
}

ROLE_PERMISSIONS_MAP: dict[str, list[str]] = {
    UserRole.GODOWN_MANAGER:      ["manage_products", "manage_inventory", "process_orders", "ready_dispatch", "view_reports"],
    "GODOWN_EMPLOYEE":            ["manage_inventory", "process_orders"],
    UserRole.DRIVER:              ["view_deliveries", "update_status", "otp_entry", "complete_delivery"],
    UserRole.TRANSPORT_MANAGER:   ["manage_vehicles", "manage_drivers", "confirm_assignments", "monitor_deliveries"],
    UserRole.RECRUITMENT_OFFICER: ["create_accounts", "verify_accounts", "approve_accounts", "manage_directory"],
    UserRole.EMPLOYEE:            ["monitor_org", "view_reports", "manage_settings", "audit_logs"],
    UserRole.ADMIN:               ["admin_all", "monitor_org", "view_reports", "manage_settings", "audit_logs"],
    UserRole.HOTEL_BUSINESS:      ["view_catalog", "place_bulk_orders", "view_invoices"],
    UserRole.CUSTOMER:            ["view_catalog", "cart", "checkout", "track_orders"],
}

_ROLE_DEFAULT_DEPT: dict[str, str] = {
    UserRole.GODOWN_MANAGER:      "GODOWN",
    UserRole.TRANSPORT_MANAGER:   "TRANSPORT",
    UserRole.DRIVER:              "TRANSPORT",
    UserRole.RECRUITMENT_OFFICER: "RECRUITMENT",
    UserRole.EMPLOYEE:            "OFFICE",
    UserRole.ADMIN:               "ADMIN",
    UserRole.HOTEL_BUSINESS:      "BUSINESS",
}


def _get_portal(role: str, department_name: Optional[str] = None) -> str:
    if role == UserRole.DRIVER:
        return "/driver/dashboard"
    if department_name and department_name.upper() in DEPARTMENT_PORTAL_MAP:
        return DEPARTMENT_PORTAL_MAP[department_name.upper()]
    return ROLE_PORTAL_MAP.get(role, "/home")


def _get_permissions(role: str) -> list[str]:
    return ROLE_PERMISSIONS_MAP.get(role, [])


# ── Unique Code Generators ────────────────────────────────────────────────────

def _rand_suffix(n: int = 4) -> str:
    return "".join(random.choices(string.digits, k=n))


def _unique_employee_code(db: Session) -> str:
    for _ in range(30):
        code = f"MK-EMP-{_rand_suffix(3)}"
        if not db.query(Employee).filter(Employee.employee_code == code).first():
            return code
    raise RuntimeError("Could not generate unique employee code")


def _unique_driver_code(db: Session) -> str:
    for _ in range(30):
        code = f"MK-DRI-{_rand_suffix(3)}"
        if not db.query(Driver).filter(Driver.driver_code == code).first():
            return code
    raise RuntimeError("Could not generate unique driver code")


def _unique_vehicle_code(db: Session) -> str:
    for _ in range(30):
        code = f"MK-V-{_rand_suffix(4)}"
        if not db.query(Vehicle).filter(Vehicle.vehicle_code == code).first():
            return code
    raise RuntimeError("Could not generate unique vehicle code")


def _unique_business_code(db: Session) -> str:
    for _ in range(30):
        code = f"MK-BUS-{_rand_suffix(3)}"
        if not db.query(B2BPartner).filter(B2BPartner.business_code == code).first():
            return code
    raise RuntimeError("Could not generate unique business code")


def _unique_applicant_code(db: Session, category: str) -> str:
    prefix = "APP-EMP"
    if "Driver" in category:
        prefix = "APP-DRI"
    elif "Vehicle" in category:
        prefix = "APP-VO"
    elif "Business" in category or "Hotel" in category:
        prefix = "APP-HB"
    elif "Farmer" in category:
        prefix = "APP-FRM"

    for _ in range(30):
        code = f"{prefix}-{_rand_suffix(4)}"
        if not db.query(Applicant).filter(Applicant.applicant_code == code).first():
            return code
    return f"{prefix}-{_rand_suffix(5)}"


def _get_or_create_department(db: Session, name: str) -> Department:
    dept = db.query(Department).filter(func.upper(Department.name) == name.upper()).first()
    if not dept:
        dept = Department(name=name.upper(), code=f"MK-DEPT-{name[:3].upper()}")
        db.add(dept)
        db.flush()
    return dept


def _get_or_create_recruitment_department(db: Session) -> Department:
    return _get_or_create_department(db, "RECRUITMENT")


def _log_recruitment_action(
    db: Session,
    officer: User,
    action: str,
    entity_type: str,
    entity_id: str,
    previous_val: Optional[Any] = None,
    new_val: Optional[Any] = None,
    reason: Optional[str] = None,
) -> AuditLog:
    dept = _get_or_create_recruitment_department(db)
    log = AuditLog(
        user_id=officer.id,
        performed_by=officer.name,
        action=action,
        department_id=dept.id,
        entity_type=entity_type,
        entity_id=str(entity_id),
        previous_value=previous_val if isinstance(previous_val, dict) else ({"value": previous_val} if previous_val is not None else None),
        new_value=new_val if isinstance(new_val, dict) else ({"value": new_val} if new_val is not None else None),
        reason=reason,
    )
    db.add(log)
    return log


# ── 1. Recruitment Dashboard & KPIs ───────────────────────────────────────────

@router.get(
    "/dashboard",
    response_model=RecruitmentDashboardResponse,
    summary="Recruitment: get dashboard metrics, category summaries and pipeline stats",
)
def get_recruitment_dashboard(
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    # Total Applications counts
    total_apps = db.query(Applicant).count()
    under_review = db.query(Applicant).filter(Applicant.status.in_(["Screening", "Under Review"])).count()
    verif_pending = db.query(Applicant).filter(Applicant.status == "Document Verification").count()
    approved = db.query(Applicant).filter(Applicant.status == "Approved").count()
    rejected = db.query(Applicant).filter(Applicant.status == "Rejected").count()
    accounts_created = db.query(Applicant).filter(Applicant.status == "Account Created").count()
    new_apps = db.query(Applicant).filter(Applicant.status == "New").count()

    total_non_customers = db.query(User).filter(User.role != UserRole.CUSTOMER).count()
    active_staff = db.query(User).filter(User.role != UserRole.CUSTOMER, User.status == "Active").count()

    kpi_cards = [
        KPICard(title="New Applications", value=str(new_apps), color="text-blue-600"),
        KPICard(title="Under Review", value=str(under_review), color="text-amber-600"),
        KPICard(title="Verification Pending", value=str(verif_pending), color="text-purple-600"),
        KPICard(title="Approved", value=str(approved), color="text-[#16803A]"),
        KPICard(title="Rejected", value=str(rejected), color="text-red-600"),
        KPICard(title="Accounts Created", value=str(accounts_created), color="text-[#16803A]"),
    ]

    # Category summaries
    categories = ["Hotel / Business", "Driver", "Vehicle Owner", "Employee"]
    category_labels = {
        "Hotel / Business": "HOTEL / BUSINESS",
        "Driver": "DRIVERS",
        "Vehicle Owner": "VEHICLE OWNERS",
        "Employee": "EMPLOYEES",
    }
    summaries: list[CategorySummary] = []
    for cat in categories:
        apps = db.query(Applicant).filter(Applicant.category == cat).count()
        app_approved = db.query(Applicant).filter(Applicant.category == cat, Applicant.status.in_(["Approved", "Account Created"])).count()
        app_accounts = db.query(Applicant).filter(Applicant.category == cat, Applicant.status == "Account Created").count()
        summaries.append(CategorySummary(
            category=category_labels.get(cat, cat.upper()),
            apps=apps,
            approved=app_approved,
            accounts=app_accounts,
        ))

    # Pipeline stages
    pipeline_stages = [
        PipelineStage(name="APPLICATION RECEIVED", count=new_apps),
        PipelineStage(name="SCREENING", count=under_review),
        PipelineStage(name="DOCUMENT VERIFICATION", count=verif_pending),
        PipelineStage(name="APPROVED", count=approved),
        PipelineStage(name="ACCOUNT CREATION", count=accounts_created),
        PipelineStage(name="ACTIVE", count=active_staff),
    ]

    return RecruitmentDashboardResponse(
        kpi_cards=kpi_cards,
        category_summaries=summaries,
        pipeline_stages=pipeline_stages,
        total_accounts=total_non_customers,
        active_staff=active_staff,
    )


# ── 2. Applications Pipeline & Document Verification ──────────────────────────

def _build_applicant_response(app: Applicant) -> ApplicantResponse:
    docs = [
        ApplicantDocumentResponse(
            id=d.id,
            applicant_id=d.applicant_id,
            name=d.name,
            type=d.type,
            status=d.status,
            submitted_date=d.submitted_date,
            verified_by_id=d.verified_by_id,
            verified_date=d.verified_date,
        )
        for d in (app.documents or [])
    ]
    return ApplicantResponse(
        id=app.id,
        applicant_code=app.applicant_code,
        name=app.name,
        category=app.category,
        type=app.type,
        location=app.location,
        submitted_date=app.submitted_date,
        status=app.status,
        contact_email=app.contact_email,
        contact_phone=app.contact_phone,
        notes=app.notes,
        assigned_officer_id=app.assigned_officer_id,
        documents=docs,
    )


@router.get(
    "/applications",
    response_model=ApplicantListResponse,
    summary="Recruitment: list applicants with category and status filtering",
)
def list_applications(
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by pipeline status"),
    search: Optional[str] = Query(None, description="Search by name, email or code"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    query = db.query(Applicant)
    if category:
        query = query.filter(Applicant.category == category)
    if status_filter:
        query = query.filter(Applicant.status == status_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Applicant.name.ilike(search_pattern),
                Applicant.applicant_code.ilike(search_pattern),
                Applicant.contact_email.ilike(search_pattern),
                Applicant.contact_phone.ilike(search_pattern),
            )
        )

    total = query.count()
    apps = query.order_by(Applicant.applicant_code.desc()).offset(skip).limit(limit).all()
    return ApplicantListResponse(
        items=[_build_applicant_response(a) for a in apps],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post(
    "/applications",
    response_model=ApplicantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruitment: submit new candidate application",
)
def create_application(
    body: ApplicantCreateRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    code = _unique_applicant_code(db, body.category)
    now_str = datetime.utcnow().strftime("%d %b %Y")

    app = Applicant(
        applicant_code=code,
        name=body.name,
        category=body.category,
        type=body.type or body.category,
        location=body.location,
        submitted_date=now_str,
        status="New",
        contact_email=body.contact_email,
        contact_phone=body.contact_phone,
        notes=body.notes,
        assigned_officer_id=officer.id,
    )
    db.add(app)
    db.flush()

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Application Submitted",
        entity_type="Applicant",
        entity_id=str(app.id),
        new_val={"code": app.applicant_code, "name": app.name, "category": app.category},
    )

    db.commit()
    db.refresh(app)
    return _build_applicant_response(app)


@router.get(
    "/applications/{applicant_id}",
    response_model=ApplicantResponse,
    summary="Recruitment: view single application details with documents",
)
def get_application(
    applicant_id: UUID,
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    app = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Applicant not found.")
    return _build_applicant_response(app)


@router.patch(
    "/applications/{applicant_id}/status",
    response_model=ApplicantResponse,
    summary="Recruitment: update applicant pipeline stage",
)
def update_application_status(
    applicant_id: UUID,
    body: ApplicantStatusUpdateRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    app = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Applicant not found.")

    old_status = app.status
    app.status = body.status
    if body.notes:
        app.notes = body.notes

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Application Status Updated",
        entity_type="Applicant",
        entity_id=str(app.id),
        previous_val={"status": old_status},
        new_val={"status": app.status, "notes": body.notes},
    )

    db.commit()
    db.refresh(app)
    return _build_applicant_response(app)


@router.post(
    "/applications/{applicant_id}/documents",
    response_model=ApplicantDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruitment: attach applicant document metadata",
)
def add_applicant_document(
    applicant_id: UUID,
    body: ApplicantDocumentCreateRequest,
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    app = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Applicant not found.")

    doc = ApplicantDocument(
        applicant_id=app.id,
        name=body.name,
        type=body.type,
        status="Submitted",
        submitted_date=body.submitted_date or datetime.utcnow().strftime("%d %b %Y"),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.patch(
    "/applications/{applicant_id}/documents/{doc_id}",
    response_model=ApplicantDocumentResponse,
    summary="Recruitment: verify or reject applicant document",
)
def verify_applicant_document(
    applicant_id: UUID,
    doc_id: UUID,
    body: ApplicantDocumentVerifyRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    doc = db.query(ApplicantDocument).filter(
        ApplicantDocument.id == doc_id,
        ApplicantDocument.applicant_id == applicant_id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    old_status = doc.status
    doc.status = body.status
    doc.verified_by_id = officer.id
    doc.verified_date = datetime.utcnow().strftime("%d %b %Y")

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Document Verification Updated",
        entity_type="ApplicantDocument",
        entity_id=str(doc.id),
        previous_val={"status": old_status},
        new_val={"status": doc.status, "document_name": doc.name},
        reason=body.notes,
    )

    db.commit()
    db.refresh(doc)
    return doc


@router.post(
    "/applications/{applicant_id}/provision",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruitment: one-click account provisioning directly from approved application",
)
def provision_account_from_application(
    applicant_id: UUID,
    body: ProvisionAccountFromAppRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    app = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Applicant not found.")

    if app.status not in ("Approved", "Document Verification", "Screening", "New"):
        raise HTTPException(status_code=400, detail=f"Cannot provision account from application in status '{app.status}'.")

    # Check for duplicate user
    if db.query(User).filter(User.email == app.contact_email).first():
        raise HTTPException(status_code=409, detail=f"User with email '{app.contact_email}' already exists.")
    if app.contact_phone and db.query(User).filter(User.phone == app.contact_phone).first():
        raise HTTPException(status_code=409, detail=f"User with phone '{app.contact_phone}' already exists.")

    # Determine target role
    target_role = body.role
    if not target_role:
        if "Driver" in app.category:
            target_role = UserRole.DRIVER
        elif "Hotel" in app.category or "Business" in app.category:
            target_role = UserRole.HOTEL_BUSINESS
        elif "Vehicle" in app.category:
            target_role = UserRole.DRIVER
        else:
            target_role = UserRole.EMPLOYEE

    hashed_pw = get_password_hash(body.initial_password)
    new_user = User(
        name=app.name,
        email=app.contact_email,
        phone=app.contact_phone,
        password_hash=hashed_pw,
        role=target_role,
        status="Active",
    )
    db.add(new_user)
    db.flush()

    dept_name = body.department_name or _ROLE_DEFAULT_DEPT.get(target_role, "OFFICE")
    dept = _get_or_create_department(db, dept_name)
    location = body.location or app.location or "Headquarters"

    # Create role profile
    if target_role in (UserRole.EMPLOYEE, UserRole.GODOWN_MANAGER, UserRole.TRANSPORT_MANAGER, UserRole.RECRUITMENT_OFFICER, UserRole.ADMIN):
        emp_code = _unique_employee_code(db)
        emp = Employee(
            id=new_user.id,
            employee_code=emp_code,
            department_id=dept.id,
            role=target_role,
            location=location,
            joining_date=datetime.utcnow(),
            created_by_id=officer.id,
        )
        db.add(emp)

        if target_role == UserRole.GODOWN_MANAGER:
            godown = db.query(Godown).first()
            if godown:
                db.add(GodownUserAssignment(user_id=new_user.id, godown_id=godown.id))

    elif target_role == UserRole.DRIVER:
        drv_code = _unique_driver_code(db)
        drv_type = body.driver_type or app.type or "Home Delivery Driver"
        drv = Driver(
            id=new_user.id,
            driver_code=drv_code,
            type=drv_type,
            availability="Available",
            workload=0,
        )
        db.add(drv)

    elif target_role == UserRole.HOTEL_BUSINESS:
        biz_code = _unique_business_code(db)
        partner = B2BPartner(
            id=new_user.id,
            business_code=biz_code,
            business_name=body.business_name or app.name,
            business_type=body.business_type or app.type or "Hotel",
            location=location,
            verification_status="Verified",
        )
        db.add(partner)

    # Mark application as Account Created
    app.status = "Account Created"

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Account Provisioned From Application",
        entity_type="User",
        entity_id=str(new_user.id),
        new_val={"name": new_user.name, "role": new_user.role, "applicant_code": app.applicant_code},
    )

    db.commit()
    db.refresh(new_user)
    return UserResponse.from_orm_with_portal(new_user)


# ── 3. Direct Staff / Employee Onboarding ──────────────────────────────────────

@router.post(
    "/employees",
    response_model=EmployeeDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruitment: onboard employee and associate with department and portal",
)
def onboard_employee(
    body: DirectEmployeeOnboardRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    if not body.email and not body.phone:
        raise HTTPException(status_code=400, detail="Email or phone number is required.")

    if body.email and db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="A user with this email already exists.")
    if body.phone and db.query(User).filter(User.phone == body.phone).first():
        raise HTTPException(status_code=409, detail="A user with this phone number already exists.")

    hashed_pw = get_password_hash(body.password)
    user = User(
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hashed_pw,
        role=body.role.upper(),
        status="Active",
    )
    db.add(user)
    db.flush()

    dept = _get_or_create_department(db, body.department_name)
    emp_code = _unique_employee_code(db)

    emp = Employee(
        id=user.id,
        employee_code=emp_code,
        department_id=dept.id,
        role=body.role,
        location=body.location,
        joining_date=body.joining_date or datetime.utcnow(),
        created_by_id=officer.id,
    )
    db.add(emp)

    # If Godown Manager or Godown staff, automatically link to godown portal
    if body.role.upper() == UserRole.GODOWN_MANAGER or body.department_name.upper() == "GODOWN":
        godown = db.query(Godown).first()
        if godown:
            db.add(GodownUserAssignment(user_id=user.id, godown_id=godown.id))

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Employee Onboarded",
        entity_type="Employee",
        entity_id=str(user.id),
        new_val={"code": emp.employee_code, "department": dept.name, "role": body.role},
    )

    db.commit()
    db.refresh(emp)

    portal = _get_portal(user.role, dept.name)
    return EmployeeDetailResponse(
        id=user.id,
        employee_code=emp.employee_code,
        name=user.name,
        email=user.email,
        phone=user.phone,
        department_id=dept.id,
        department_name=dept.name,
        role=emp.role,
        portal=portal,
        location=emp.location,
        joining_date=emp.joining_date,
        status=user.status,
        created_at=user.created_at,
    )


@router.get(
    "/employees",
    response_model=EmployeeListResponse,
    summary="Recruitment: list all onboarded employees with department and role filters",
)
def list_employees(
    department: Optional[str] = Query(None, description="Filter by department name"),
    role: Optional[str] = Query(None, description="Filter by role"),
    search: Optional[str] = Query(None, description="Search by name, email or code"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    query = db.query(Employee).join(User, Employee.id == User.id).join(Department, Employee.department_id == Department.id)
    if department:
        query = query.filter(func.upper(Department.name) == department.upper())
    if role:
        query = query.filter(Employee.role.ilike(f"%{role}%"))
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(s),
                User.email.ilike(s),
                Employee.employee_code.ilike(s),
            )
        )

    total = query.count()
    employees = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    items = [
        EmployeeDetailResponse(
            id=e.user.id,
            employee_code=e.employee_code,
            name=e.user.name,
            email=e.user.email,
            phone=e.user.phone,
            department_id=e.department_id,
            department_name=e.department.name if e.department else "GENERAL",
            role=e.role,
            portal=_get_portal(e.user.role, e.department.name if e.department else None),
            location=e.location,
            joining_date=e.joining_date,
            status=e.user.status,
            created_at=e.user.created_at,
        )
        for e in employees
    ]
    return EmployeeListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get(
    "/employees/{employee_id}",
    response_model=EmployeeDetailResponse,
    summary="Recruitment: get employee details",
)
def get_employee(
    employee_id: UUID,
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    return EmployeeDetailResponse(
        id=emp.user.id,
        employee_code=emp.employee_code,
        name=emp.user.name,
        email=emp.user.email,
        phone=emp.user.phone,
        department_id=emp.department_id,
        department_name=emp.department.name if emp.department else "GENERAL",
        role=emp.role,
        portal=_get_portal(emp.user.role, emp.department.name if emp.department else None),
        location=emp.location,
        joining_date=emp.joining_date,
        status=emp.user.status,
        created_at=emp.user.created_at,
    )


@router.patch(
    "/employees/{employee_id}",
    response_model=EmployeeDetailResponse,
    summary="Recruitment: update employee details",
)
def update_employee(
    employee_id: UUID,
    body: EmployeeUpdateRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    if body.name is not None:
        emp.user.name = body.name
    if body.phone is not None:
        emp.user.phone = body.phone
    if body.location is not None:
        emp.location = body.location
    if body.role is not None:
        emp.role = body.role
        emp.user.role = body.role.upper()

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Employee Details Updated",
        entity_type="Employee",
        entity_id=str(emp.id),
        new_val={"name": emp.user.name, "role": emp.role, "location": emp.location},
    )

    db.commit()
    db.refresh(emp)

    return EmployeeDetailResponse(
        id=emp.user.id,
        employee_code=emp.employee_code,
        name=emp.user.name,
        email=emp.user.email,
        phone=emp.user.phone,
        department_id=emp.department_id,
        department_name=emp.department.name if emp.department else "GENERAL",
        role=emp.role,
        portal=_get_portal(emp.user.role, emp.department.name if emp.department else None),
        location=emp.location,
        joining_date=emp.joining_date,
        status=emp.user.status,
        created_at=emp.user.created_at,
    )


# ── 4. Direct Driver Onboarding ───────────────────────────────────────────────

@router.post(
    "/drivers",
    response_model=DriverDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruitment: onboard driver and automatically make available in Transport portal",
)
def onboard_driver(
    body: DirectDriverOnboardRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    if not body.email and not body.phone:
        raise HTTPException(status_code=400, detail="Email or phone number is required.")

    if body.email and db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="A user with this email already exists.")
    if body.phone and db.query(User).filter(User.phone == body.phone).first():
        raise HTTPException(status_code=409, detail="A user with this phone number already exists.")

    hashed_pw = get_password_hash(body.password)
    user = User(
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hashed_pw,
        role=UserRole.DRIVER,
        status="Active",
    )
    db.add(user)
    db.flush()

    drv_code = _unique_driver_code(db)
    drv = Driver(
        id=user.id,
        driver_code=drv_code,
        vehicle_id=body.vehicle_id,
        type=body.type,
        availability="Available",
        workload=0,
    )
    db.add(drv)

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Driver Onboarded",
        entity_type="Driver",
        entity_id=str(user.id),
        new_val={"code": drv.driver_code, "type": drv.type, "vehicle_id": str(drv.vehicle_id) if drv.vehicle_id else None},
    )

    db.commit()
    db.refresh(drv)

    v_num = drv.vehicle.number if drv.vehicle else None
    return DriverDetailResponse(
        id=user.id,
        driver_code=drv.driver_code,
        name=user.name,
        email=user.email,
        phone=user.phone,
        type=drv.type,
        availability=drv.availability,
        workload=drv.workload,
        vehicle_id=drv.vehicle_id,
        vehicle_number=v_num,
        status=user.status,
        portal="/driver/dashboard",
    )


@router.get(
    "/drivers",
    response_model=DriverListResponse,
    summary="Recruitment: list all onboarded drivers",
)
def list_drivers(
    availability: Optional[str] = Query(None, description="Filter by availability"),
    search: Optional[str] = Query(None, description="Search by name or code"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    query = db.query(Driver).join(User, Driver.id == User.id)
    if availability:
        query = query.filter(Driver.availability == availability)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(s),
                User.email.ilike(s),
                Driver.driver_code.ilike(s),
            )
        )

    total = query.count()
    drivers = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    items = [
        DriverDetailResponse(
            id=d.user.id,
            driver_code=d.driver_code,
            name=d.user.name,
            email=d.user.email,
            phone=d.user.phone,
            type=d.type,
            availability=d.availability,
            workload=d.workload,
            vehicle_id=d.vehicle_id,
            vehicle_number=d.vehicle.number if d.vehicle else None,
            status=d.user.status,
            portal="/driver/dashboard",
        )
        for d in drivers
    ]
    return DriverListResponse(items=items, total=total, skip=skip, limit=limit)


# ── 5. Direct Vehicle Fleet Onboarding ────────────────────────────────────────

@router.post(
    "/vehicles",
    response_model=VehicleDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruitment: onboard vehicle and automatically make available in Transport fleet",
)
def onboard_vehicle(
    body: DirectVehicleOnboardRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    # Duplicate plate check
    clean_num = body.number.strip().upper()
    if db.query(Vehicle).filter(Vehicle.number == clean_num).first():
        raise HTTPException(
            status_code=409,
            detail=f"A vehicle with registration number '{clean_num}' already exists.",
        )

    v_code = _unique_vehicle_code(db)
    vehicle = Vehicle(
        vehicle_code=v_code,
        number=clean_num,
        type=body.type,
        capacity=f"{body.max_weight} kg",
        max_weight=body.max_weight,
        max_volume=body.max_volume or Decimal("2.5"),
        status="Available",
        service_status="Healthy",
    )
    db.add(vehicle)
    db.flush()

    if body.assigned_driver_id:
        driver = db.query(Driver).filter(Driver.id == body.assigned_driver_id).first()
        if driver:
            driver.vehicle_id = vehicle.id

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Vehicle Onboarded",
        entity_type="Vehicle",
        entity_id=str(vehicle.id),
        new_val={"code": vehicle.vehicle_code, "number": vehicle.number, "capacity": vehicle.capacity},
    )

    db.commit()
    db.refresh(vehicle)

    assigned_driver = db.query(Driver).filter(Driver.vehicle_id == vehicle.id).first()
    return VehicleDetailResponse(
        id=vehicle.id,
        vehicle_code=vehicle.vehicle_code,
        number=vehicle.number,
        type=vehicle.type,
        max_weight=vehicle.max_weight,
        max_volume=vehicle.max_volume,
        status=vehicle.status,
        service_status=vehicle.service_status,
        assigned_driver_id=assigned_driver.id if assigned_driver else None,
        assigned_driver_name=assigned_driver.user.name if (assigned_driver and assigned_driver.user) else None,
    )


@router.get(
    "/vehicles",
    response_model=VehicleListResponse,
    summary="Recruitment: list all onboarded fleet vehicles",
)
def list_vehicles(
    status_filter: Optional[str] = Query(None, alias="status"),
    v_type: Optional[str] = Query(None, alias="type"),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    query = db.query(Vehicle)
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)
    if v_type:
        query = query.filter(Vehicle.type == v_type)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(Vehicle.number.ilike(s), Vehicle.vehicle_code.ilike(s)))

    total = query.count()
    vehicles = query.order_by(Vehicle.number.asc()).offset(skip).limit(limit).all()

    items = []
    for v in vehicles:
        assigned_driver = db.query(Driver).filter(Driver.vehicle_id == v.id).first()
        items.append(VehicleDetailResponse(
            id=v.id,
            vehicle_code=v.vehicle_code,
            number=v.number,
            type=v.type,
            max_weight=v.max_weight,
            max_volume=v.max_volume,
            status=v.status,
            service_status=v.service_status,
            assigned_driver_id=assigned_driver.id if assigned_driver else None,
            assigned_driver_name=assigned_driver.user.name if (assigned_driver and assigned_driver.user) else None,
        ))
    return VehicleListResponse(items=items, total=total, skip=skip, limit=limit)


# ── 6. Direct Hotel / Business Partner Onboarding ─────────────────────────────

@router.post(
    "/partners",
    response_model=PartnerDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruitment: onboard hotel/business B2B partner",
)
def onboard_partner(
    body: DirectPartnerOnboardRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    if not body.email and not body.phone:
        raise HTTPException(status_code=400, detail="Email or phone number is required.")

    if body.email and db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="A user with this email already exists.")
    if body.phone and db.query(User).filter(User.phone == body.phone).first():
        raise HTTPException(status_code=409, detail="A user with this phone number already exists.")

    hashed_pw = get_password_hash(body.password)
    user = User(
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hashed_pw,
        role=UserRole.HOTEL_BUSINESS,
        status="Active",
    )
    db.add(user)
    db.flush()

    biz_code = _unique_business_code(db)
    partner = B2BPartner(
        id=user.id,
        business_code=biz_code,
        business_name=body.business_name,
        business_type=body.business_type,
        location=body.location,
        verification_status="Verified",
    )
    db.add(partner)

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Partner Onboarded",
        entity_type="B2BPartner",
        entity_id=str(user.id),
        new_val={"code": partner.business_code, "business_name": partner.business_name},
    )

    db.commit()
    db.refresh(partner)

    return PartnerDetailResponse(
        id=user.id,
        business_code=partner.business_code,
        name=user.name,
        business_name=partner.business_name,
        business_type=partner.business_type,
        email=user.email,
        phone=user.phone,
        location=partner.location,
        verification_status=partner.verification_status,
        status=user.status,
        portal="/business",
    )


@router.get(
    "/partners",
    response_model=PartnerListResponse,
    summary="Recruitment: list all onboarded hotel and business partners",
)
def list_partners(
    verification_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    query = db.query(B2BPartner).join(User, B2BPartner.id == User.id)
    if verification_status:
        query = query.filter(B2BPartner.verification_status == verification_status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                B2BPartner.business_name.ilike(s),
                B2BPartner.business_code.ilike(s),
                User.name.ilike(s),
            )
        )

    total = query.count()
    partners = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    items = [
        PartnerDetailResponse(
            id=p.user.id,
            business_code=p.business_code,
            name=p.user.name,
            business_name=p.business_name,
            business_type=p.business_type,
            email=p.user.email,
            phone=p.user.phone,
            location=p.location,
            verification_status=p.verification_status,
            status=p.user.status,
            portal="/business",
        )
        for p in partners
    ]
    return PartnerListResponse(items=items, total=total, skip=skip, limit=limit)


# ── 7. Department Management ──────────────────────────────────────────────────

@router.get(
    "/departments",
    response_model=DepartmentListResponse,
    summary="Recruitment: list all departments with active member counts",
)
def list_departments(
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    depts = db.query(Department).all()
    items = []
    for d in depts:
        count = db.query(Employee).filter(Employee.department_id == d.id).count()
        items.append(DepartmentResponse(
            id=d.id,
            name=d.name,
            code=d.code,
            description=d.description,
            employee_count=count,
        ))
    return DepartmentListResponse(items=items, total=len(items))


@router.post(
    "/departments",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruitment: create new department",
)
def create_department(
    body: DepartmentCreateRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    clean_name = body.name.strip().upper()
    existing = db.query(Department).filter(func.upper(Department.name) == clean_name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Department '{clean_name}' already exists.")

    code = body.code or f"MK-DEPT-{clean_name[:3]}"
    dept = Department(name=clean_name, code=code, description=body.description)
    db.add(dept)
    db.flush()

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Department Created",
        entity_type="Department",
        entity_id=str(dept.id),
        new_val={"name": dept.name, "code": dept.code},
    )

    db.commit()
    db.refresh(dept)
    return DepartmentResponse(id=dept.id, name=dept.name, code=dept.code, description=dept.description, employee_count=0)


@router.get(
    "/departments/{department_id}",
    response_model=DepartmentDetailResponse,
    summary="Recruitment: view department details and member list",
)
def get_department(
    department_id: UUID,
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    employees = db.query(Employee).filter(Employee.department_id == dept.id).all()
    emp_details = [
        EmployeeDetailResponse(
            id=e.user.id,
            employee_code=e.employee_code,
            name=e.user.name,
            email=e.user.email,
            phone=e.user.phone,
            department_id=dept.id,
            department_name=dept.name,
            role=e.role,
            portal=_get_portal(e.user.role, dept.name),
            location=e.location,
            joining_date=e.joining_date,
            status=e.user.status,
            created_at=e.user.created_at,
        )
        for e in employees
    ]

    return DepartmentDetailResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        employees=emp_details,
    )


@router.patch(
    "/departments/{department_id}",
    response_model=DepartmentResponse,
    summary="Recruitment: update department name or description",
)
def update_department(
    department_id: UUID,
    body: DepartmentUpdateRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    if body.name is not None:
        dept.name = body.name.strip().upper()
    if body.code is not None:
        dept.code = body.code
    if body.description is not None:
        dept.description = body.description

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Department Updated",
        entity_type="Department",
        entity_id=str(dept.id),
        new_val={"name": dept.name, "code": dept.code},
    )

    db.commit()
    db.refresh(dept)
    count = db.query(Employee).filter(Employee.department_id == dept.id).count()
    return DepartmentResponse(id=dept.id, name=dept.name, code=dept.code, description=dept.description, employee_count=count)


# ── 8. Unified Organizational Directory & Lifecycle ───────────────────────────

@router.get(
    "/directory",
    response_model=DirectoryListResponse,
    summary="Recruitment: unified organizational directory across staff, drivers, partners",
)
def get_organizational_directory(
    department: Optional[str] = Query(None, description="Filter by department"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (Active, Suspended, Inactive)"),
    category: Optional[str] = Query(None, description="Filter by category (Driver, Employee, Partner, etc.)"),
    search: Optional[str] = Query(None, description="Search name, code, email, phone"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    query = db.query(User).filter(User.role != UserRole.CUSTOMER)
    if status_filter and status_filter != "All":
        query = query.filter(User.status == status_filter)

    users = query.order_by(User.created_at.desc()).all()

    directory_items: list[DirectoryAccountResponse] = []
    for u in users:
        # Determine code, category, department, portal, joining_date
        code = str(u.id)[:8]
        user_cat = "Employee"
        dept_name = "Office"
        joining_date_str = None
        portal = _get_portal(u.role)

        if u.employee_profile:
            code = u.employee_profile.employee_code
            user_cat = "Employee" if u.role not in (UserRole.GODOWN_MANAGER, UserRole.TRANSPORT_MANAGER) else "Operations"
            dept_name = u.employee_profile.department.name if u.employee_profile.department else "Office"
            portal = _get_portal(u.role, dept_name)
            if u.employee_profile.joining_date:
                joining_date_str = u.employee_profile.joining_date.strftime("%d %b %Y")
        elif u.driver_profile:
            code = u.driver_profile.driver_code
            user_cat = "Driver"
            dept_name = "Transport"
            portal = "/driver/dashboard"
        elif u.b2b_profile:
            code = u.b2b_profile.business_code
            user_cat = "Hotel / Business"
            dept_name = "Business"
            portal = "/business"
        elif u.farmer_profile:
            code = u.farmer_profile.farmer_code
            user_cat = "Farmer"
            dept_name = "Procurement"
            portal = "/farmer"

        # Apply department filter
        if department and department != "All" and dept_name.upper() != department.upper():
            continue

        # Apply category filter
        if category and category != "All" and user_cat.lower() != category.lower():
            continue

        # Apply search filter
        if search:
            s = search.lower()
            if not (s in u.name.lower() or s in code.lower() or (u.email and s in u.email.lower()) or (u.phone and s in u.phone.lower())):
                continue

        permissions = _get_permissions(u.role)
        created_str = u.created_at.strftime("%d %b %Y") if u.created_at else "N/A"

        directory_items.append(DirectoryAccountResponse(
            id=code,
            user_id=u.id,
            name=u.name,
            email=u.email,
            phone=u.phone,
            category=user_cat,
            department=dept_name,
            role=u.role,
            portal=portal,
            location=u.employee_profile.location if u.employee_profile else (u.b2b_profile.location if u.b2b_profile else "Headquarters"),
            status=u.status,
            created_date=created_str,
            joining_date=joining_date_str,
            permissions=permissions,
        ))

    total = len(directory_items)
    paginated = directory_items[skip : skip + limit]
    return DirectoryListResponse(items=paginated, total=total, skip=skip, limit=limit)


# ── Account Lifecycle Endpoints (Activate, Suspend, Deactivate, Transfer) ─────

@router.get(
    "/accounts",
    response_model=list[UserResponse],
    summary="Recruitment: list all staff/partner accounts",
)
def list_accounts(
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    users = db.query(User).filter(User.role != UserRole.CUSTOMER).order_by(User.created_at.desc()).all()
    return [UserResponse.from_orm_with_portal(u) for u in users]


@router.post(
    "/accounts",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Recruitment: provision staff/driver/partner account",
)
def create_account(
    body: RecruitmentAccountCreateRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    if not body.email and not body.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one contact method (email or phone) is required.",
        )

    if body.email and db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
    if body.phone and db.query(User).filter(User.phone == body.phone).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone already registered.")

    normalized_role = body.role.upper()
    hashed_password = get_password_hash(body.initial_password)

    new_user = User(
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hashed_password,
        role=normalized_role,
        status="Pending",
    )
    db.add(new_user)
    db.flush()

    dept_name = body.department_name or _ROLE_DEFAULT_DEPT.get(normalized_role, "OFFICE")
    dept = _get_or_create_department(db, dept_name)
    loc = body.location or "Headquarters"

    if normalized_role in (UserRole.EMPLOYEE, UserRole.GODOWN_MANAGER, UserRole.TRANSPORT_MANAGER, UserRole.RECRUITMENT_OFFICER, UserRole.ADMIN):
        emp_code = _unique_employee_code(db)
        emp = Employee(
            id=new_user.id,
            employee_code=emp_code,
            department_id=dept.id,
            role=normalized_role,
            location=loc,
            joining_date=datetime.utcnow(),
            created_by_id=officer.id,
        )
        db.add(emp)
        if normalized_role == UserRole.GODOWN_MANAGER:
            gd = db.query(Godown).first()
            if gd:
                db.add(GodownUserAssignment(user_id=new_user.id, godown_id=gd.id))

    elif normalized_role == UserRole.DRIVER:
        drv_code = _unique_driver_code(db)
        drv = Driver(
            id=new_user.id,
            driver_code=drv_code,
            type=body.driver_type or "Home Delivery Driver",
            availability="Available",
            workload=0,
        )
        db.add(drv)

    elif normalized_role == UserRole.HOTEL_BUSINESS:
        biz_code = _unique_business_code(db)
        partner = B2BPartner(
            id=new_user.id,
            business_code=biz_code,
            business_name=body.business_name or body.name,
            business_type=body.business_type or "Restaurant",
            location=loc,
            verification_status="Pending",
        )
        db.add(partner)

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Account Created (Recruitment)",
        entity_type="User",
        entity_id=str(new_user.id),
        new_val={"name": new_user.name, "role": new_user.role, "status": new_user.status},
    )

    db.commit()
    db.refresh(new_user)
    return UserResponse.from_orm_with_portal(new_user)


@router.post(
    "/accounts/{account_id}/approve",
    response_model=UserResponse,
    summary="Recruitment: approve a pending account",
)
def approve_account(
    account_id: UUID,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    return activate_account(account_id=account_id, db=db, officer=officer)


@router.post(
    "/accounts/{account_id}/activate",
    response_model=UserResponse,
    summary="Recruitment: activate an account (Pending / Suspended -> Active)",
)
def activate_account(
    account_id: UUID,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    user = db.query(User).filter(User.id == account_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    old_status = user.status
    user.status = "Active"

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Status Change (Activation)",
        entity_type="User",
        entity_id=str(user.id),
        previous_val={"status": old_status},
        new_val={"status": user.status},
    )

    db.commit()
    db.refresh(user)
    return UserResponse.from_orm_with_portal(user)


@router.post(
    "/accounts/{account_id}/suspend",
    response_model=UserResponse,
    summary="Recruitment: suspend an active account",
)
def suspend_account(
    account_id: UUID,
    body: Optional[AccountLifecycleStatusRequest] = None,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    user = db.query(User).filter(User.id == account_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    if user.id == officer.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own account.")

    old_status = user.status
    user.status = "Suspended"

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Status Change (Suspension)",
        entity_type="User",
        entity_id=str(user.id),
        previous_val={"status": old_status},
        new_val={"status": user.status},
        reason=body.reason if body else None,
    )

    db.commit()
    db.refresh(user)
    return UserResponse.from_orm_with_portal(user)


@router.post(
    "/accounts/{account_id}/deactivate",
    response_model=UserResponse,
    summary="Recruitment: deactivate/terminate an account",
)
def deactivate_account(
    account_id: UUID,
    body: Optional[AccountLifecycleStatusRequest] = None,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    user = db.query(User).filter(User.id == account_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")

    if user.id == officer.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")

    old_status = user.status
    user.status = "Inactive"

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Account Deactivated",
        entity_type="User",
        entity_id=str(user.id),
        previous_val={"status": old_status},
        new_val={"status": user.status},
        reason=body.reason if body else None,
    )

    db.commit()
    db.refresh(user)
    return UserResponse.from_orm_with_portal(user)


@router.post(
    "/accounts/{account_id}/transfer",
    response_model=EmployeeDetailResponse,
    summary="Recruitment: transfer employee to a different department with automatic portal remapping",
)
def transfer_department(
    account_id: UUID,
    body: DepartmentTransferRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    emp = db.query(Employee).filter(Employee.id == account_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee record not found for this account.")

    target_dept = _get_or_create_department(db, body.new_department)
    prev_dept_name = emp.department.name if emp.department else "GENERAL"

    emp.department_id = target_dept.id
    if body.new_role:
        emp.role = body.new_role
        emp.user.role = body.new_role.upper()

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Department Transfer",
        entity_type="Employee",
        entity_id=str(emp.id),
        previous_val={"department": prev_dept_name},
        new_val={"department": target_dept.name, "role": emp.role},
        reason=body.reason,
    )

    db.commit()
    db.refresh(emp)

    portal = _get_portal(emp.user.role, target_dept.name)
    return EmployeeDetailResponse(
        id=emp.user.id,
        employee_code=emp.employee_code,
        name=emp.user.name,
        email=emp.user.email,
        phone=emp.user.phone,
        department_id=target_dept.id,
        department_name=target_dept.name,
        role=emp.role,
        portal=portal,
        location=emp.location,
        joining_date=emp.joining_date,
        status=emp.user.status,
        created_at=emp.user.created_at,
    )


# ── 9. Onboarding Checklists ──────────────────────────────────────────────────

DEFAULT_CHECKLISTS: dict[str, list[str]] = {
    "Business": [
        "Application Approved",
        "Business Documents Verified",
        "Bank Details Linked",
        "Account Credentials Sent",
        "Business Orientation Scheduled",
        "Marketplace Activation",
    ],
    "Driver": [
        "Application Approved",
        "Driving License Verified",
        "Account Credentials Sent",
        "Driver Orientation",
        "Vehicle Assignment",
    ],
    "Vehicle": [
        "Registration Documents Verified",
        "Insurance & Fitness Validated",
        "Partner Account Created",
        "Physical Inspection",
    ],
    "Employee": [
        "Identity Verification",
        "Department Assignment",
        "System Access Provisioning",
        "Employee Orientation",
    ],
}


def _seed_checklist_if_empty(db: Session, category: str):
    existing = db.query(OnboardingTask).filter(OnboardingTask.category == category).count()
    if existing == 0:
        tasks = DEFAULT_CHECKLISTS.get(category, [])
        for idx, t_name in enumerate(tasks):
            st = "completed" if idx < 2 else ("pending" if idx == 2 else "upcoming")
            t = OnboardingTask(
                category=category,
                task_name=t_name,
                status=st,
                order_num=idx,
                completed_at=datetime.utcnow() if st == "completed" else None,
            )
            db.add(t)
        db.commit()


@router.get(
    "/onboarding/checklists",
    response_model=dict[str, OnboardingChecklistResponse],
    summary="Recruitment: get onboarding checklists across all categories",
)
def get_onboarding_checklists(
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    result: dict[str, OnboardingChecklistResponse] = {}

    for cat in ["Business", "Driver", "Vehicle", "Employee"]:
        _seed_checklist_if_empty(db, cat)
        tasks = db.query(OnboardingTask).filter(OnboardingTask.category == cat).order_by(OnboardingTask.order_num.asc()).all()

        completed_count = sum(1 for t in tasks if t.status == "completed")
        total_count = len(tasks) if len(tasks) > 0 else 1
        pct = int((completed_count / total_count) * 100)

        task_responses = [
            OnboardingTaskResponse(
                id=t.id,
                category=t.category,
                task_name=t.task_name,
                status=t.status,
                order_num=t.order_num,
                completed_at=t.completed_at,
                completed_by=t.completed_by.name if t.completed_by else None,
            )
            for t in tasks
        ]

        result[cat] = OnboardingChecklistResponse(
            category=cat,
            progress_percentage=pct,
            tasks=task_responses,
        )

    return result


@router.patch(
    "/onboarding/checklists/{task_id}",
    response_model=OnboardingTaskResponse,
    summary="Recruitment: update onboarding task status",
)
def update_onboarding_task(
    task_id: UUID,
    body: OnboardingTaskUpdateRequest,
    db: Session = Depends(get_database_session),
    officer: User = Depends(require_recruitment_or_admin),
):
    task = db.query(OnboardingTask).filter(OnboardingTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Onboarding task not found.")

    task.status = body.status
    if body.status == "completed":
        task.completed_at = datetime.utcnow()
        task.completed_by_id = officer.id
    else:
        task.completed_at = None
        task.completed_by_id = None

    _log_recruitment_action(
        db=db,
        officer=officer,
        action="Onboarding Task Updated",
        entity_type="OnboardingTask",
        entity_id=str(task.id),
        new_val={"task_name": task.task_name, "category": task.category, "status": task.status},
    )

    db.commit()
    db.refresh(task)

    return OnboardingTaskResponse(
        id=task.id,
        category=task.category,
        task_name=task.task_name,
        status=task.status,
        order_num=task.order_num,
        completed_at=task.completed_at,
        completed_by=task.completed_by.name if task.completed_by else None,
    )


# ── 10. Recruitment Audit Logs ────────────────────────────────────────────────

@router.get(
    "/logs",
    response_model=RecruitmentAuditLogListResponse,
    summary="Recruitment: chronological audit trail of recruitment operations",
)
def get_recruitment_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_database_session),
    _officer: User = Depends(require_recruitment_or_admin),
):
    dept = _get_or_create_recruitment_department(db)
    query = db.query(AuditLog).filter(
        or_(
            AuditLog.department_id == dept.id,
            AuditLog.action.ilike("%Onboard%"),
            AuditLog.action.ilike("%Application%"),
            AuditLog.action.ilike("%Account Provision%"),
            AuditLog.action.ilike("%Transfer%"),
        )
    )
    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

    items = [
        RecruitmentAuditLogResponse(
            id=l.id,
            action=l.action,
            target=f"{l.entity_type}:{l.entity_id}",
            performed_by=l.performed_by,
            previous_value=l.previous_value,
            new_value=l.new_value,
            reason=l.reason,
            date=l.timestamp,
        )
        for l in logs
    ]
    return RecruitmentAuditLogListResponse(items=items, total=total, skip=skip, limit=limit)
