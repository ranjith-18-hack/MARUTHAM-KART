"""
Pydantic schemas for Phase 7: Recruitment Officer & Staff Onboarding Workflow.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# ── Dashboard & KPI Schemas ───────────────────────────────────────────────────

class KPICard(BaseModel):
    title: str
    value: str
    color: str


class CategorySummary(BaseModel):
    category: str
    apps: int
    approved: int
    accounts: int


class PipelineStage(BaseModel):
    name: str
    count: int


class RecruitmentDashboardResponse(BaseModel):
    kpi_cards: List[KPICard]
    category_summaries: List[CategorySummary]
    pipeline_stages: List[PipelineStage]
    total_accounts: int
    active_staff: int


# ── Applications & Documents ───────────────────────────────────────────────────

class ApplicantDocumentResponse(BaseModel):
    id: UUID
    applicant_id: UUID
    name: str
    type: str
    status: str
    submitted_date: Optional[str] = None
    verified_by_id: Optional[UUID] = None
    verified_date: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicantDocumentCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    type: str = Field("Identity Document", min_length=2, max_length=100)
    submitted_date: Optional[str] = None


class ApplicantDocumentVerifyRequest(BaseModel):
    status: str = Field("Verified", pattern="^(Verified|Rejected|Under Review|Submitted)$")
    notes: Optional[str] = None


class ApplicantResponse(BaseModel):
    id: UUID
    applicant_code: str
    name: str
    category: str
    type: Optional[str] = None
    location: str
    submitted_date: str
    status: str
    contact_email: str
    contact_phone: str
    notes: Optional[str] = None
    assigned_officer_id: Optional[UUID] = None
    documents: List[ApplicantDocumentResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ApplicantCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: str = Field(..., pattern="^(Hotel / Business|Driver|Vehicle Owner|Employee|Farmer)$")
    type: Optional[str] = None
    location: str = Field(..., min_length=2, max_length=255)
    contact_email: str = Field(..., min_length=5, max_length=255)
    contact_phone: str = Field(..., min_length=8, max_length=50)
    notes: Optional[str] = None


class ApplicantStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(New|Screening|Document Verification|Approved|Rejected|Account Created)$")
    notes: Optional[str] = None


class ApplicantListResponse(BaseModel):
    items: List[ApplicantResponse]
    total: int
    skip: int
    limit: int


class ProvisionAccountFromAppRequest(BaseModel):
    initial_password: str = Field(..., min_length=6)
    role: Optional[str] = None
    department_name: Optional[str] = None
    location: Optional[str] = None
    driver_type: Optional[str] = None
    business_name: Optional[str] = None
    business_type: Optional[str] = None


# ── Direct Staff / Employee Onboarding ─────────────────────────────────────────

class DirectEmployeeOnboardRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    department_name: str = Field("OFFICE", min_length=2, max_length=100)
    role: str = Field("EMPLOYEE", min_length=2, max_length=100)
    location: str = Field("Headquarters", min_length=2, max_length=255)
    joining_date: Optional[datetime] = None


class EmployeeDetailResponse(BaseModel):
    id: UUID
    employee_code: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: UUID
    department_name: str
    role: str
    portal: str
    location: str
    joining_date: Optional[datetime] = None
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EmployeeUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    role: Optional[str] = None


class EmployeeListResponse(BaseModel):
    items: List[EmployeeDetailResponse]
    total: int
    skip: int
    limit: int


# ── Direct Driver Onboarding ───────────────────────────────────────────────────

class DirectDriverOnboardRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    type: str = Field("Home Delivery Driver", pattern="^(Home Delivery Driver|Bulk Delivery Driver)$")
    vehicle_id: Optional[UUID] = None
    location: str = Field("Coimbatore", min_length=2, max_length=255)


class DriverDetailResponse(BaseModel):
    id: UUID
    driver_code: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    type: str
    availability: str
    workload: int
    vehicle_id: Optional[UUID] = None
    vehicle_number: Optional[str] = None
    status: str
    portal: str

    model_config = ConfigDict(from_attributes=True)


class DriverListResponse(BaseModel):
    items: List[DriverDetailResponse]
    total: int
    skip: int
    limit: int


# ── Direct Vehicle Onboarding ──────────────────────────────────────────────────

class DirectVehicleOnboardRequest(BaseModel):
    number: str = Field(..., min_length=3, max_length=50)
    type: str = Field("Mini Van", pattern="^(Two Wheeler|Mini Van|Van|Mini Truck|Truck|Lorry)$")
    max_weight: Decimal = Field(..., gt=0)
    max_volume: Optional[Decimal] = Field(Decimal("2.5"), gt=0)
    assigned_driver_id: Optional[UUID] = None


class VehicleDetailResponse(BaseModel):
    id: UUID
    vehicle_code: str
    number: str
    type: str
    max_weight: Decimal
    max_volume: Optional[Decimal] = None
    status: str
    service_status: str
    assigned_driver_id: Optional[UUID] = None
    assigned_driver_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VehicleListResponse(BaseModel):
    items: List[VehicleDetailResponse]
    total: int
    skip: int
    limit: int


# ── Direct Partner Onboarding ──────────────────────────────────────────────────

class DirectPartnerOnboardRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    business_name: str = Field(..., min_length=2, max_length=255)
    business_type: str = Field("Hotel", min_length=2, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    location: str = Field("Coimbatore", min_length=2, max_length=255)


class PartnerDetailResponse(BaseModel):
    id: UUID
    business_code: str
    name: str
    business_name: str
    business_type: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: str
    verification_status: str
    status: str
    portal: str

    model_config = ConfigDict(from_attributes=True)


class PartnerListResponse(BaseModel):
    items: List[PartnerDetailResponse]
    total: int
    skip: int
    limit: int


# ── Department Management ─────────────────────────────────────────────────────

class DepartmentCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: Optional[str] = None
    description: Optional[str] = None


class DepartmentUpdateRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    employee_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class DepartmentDetailResponse(BaseModel):
    id: UUID
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    employees: List[EmployeeDetailResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DepartmentListResponse(BaseModel):
    items: List[DepartmentResponse]
    total: int


# ── Organizational Directory & Lifecycle ──────────────────────────────────────

class DirectoryAccountResponse(BaseModel):
    id: str  # String ID/code e.g. "MK-EMP-104" or UUID str
    user_id: UUID
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    category: str
    department: str
    role: str
    portal: str
    location: str
    status: str
    created_date: str
    joining_date: Optional[str] = None
    permissions: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class DirectoryListResponse(BaseModel):
    items: List[DirectoryAccountResponse]
    total: int
    skip: int
    limit: int


class DepartmentTransferRequest(BaseModel):
    new_department: str = Field(..., min_length=2, max_length=100)
    new_role: Optional[str] = None
    reason: Optional[str] = None


class AccountLifecycleStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(Active|Suspended|Inactive)$")
    reason: Optional[str] = None


# ── Onboarding Checklists ─────────────────────────────────────────────────────

class OnboardingTaskResponse(BaseModel):
    id: UUID
    category: str
    task_name: str
    status: str  # completed, pending, upcoming
    order_num: int
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OnboardingChecklistResponse(BaseModel):
    category: str
    progress_percentage: int
    tasks: List[OnboardingTaskResponse]


class OnboardingTaskUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(completed|pending|upcoming)$")


# ── Recruitment Audit Logs ────────────────────────────────────────────────────

class RecruitmentAuditLogResponse(BaseModel):
    id: UUID
    action: str
    target: str
    performed_by: str
    previous_value: Optional[Any] = None
    new_value: Optional[Any] = None
    reason: Optional[str] = None
    date: datetime

    model_config = ConfigDict(from_attributes=True)


class RecruitmentAuditLogListResponse(BaseModel):
    items: List[RecruitmentAuditLogResponse]
    total: int
    skip: int
    limit: int
