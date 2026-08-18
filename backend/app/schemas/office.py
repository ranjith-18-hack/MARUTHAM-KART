"""
Pydantic schemas for Office / Finance & Reconciliation Workflows.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Office Dashboard ──────────────────────────────────────────────────────────

class OfficeDashboardResponse(BaseModel):
    total_revenue_month: Decimal
    total_expenses_month: Decimal
    net_operating_profit: Decimal
    active_departments_count: int
    total_employees_count: int
    pending_expense_approvals: int
    pending_monthly_reports: int
    reconciliation_status: str
    recent_reports: list[MonthlyReportSummaryResponse]
    recent_expenses: list[ExpenseResponse]


# ── Monthly Reports ───────────────────────────────────────────────────────────

class MonthlyReportGenerateRequest(BaseModel):
    department_id: UUID
    location: str = "Headquarters"
    month: str = Field(..., description="e.g. August 2026")


class MonthlyReportSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    report_code: str
    department_id: UUID
    department_name: str
    location: str
    month: str
    generated_date: Optional[datetime] = None
    status: str
    reconciliation_status: str
    digital_approval_status: str
    prepared_by_name: str
    approved_by_name: Optional[str] = None


class MonthlyReportDetailResponse(MonthlyReportSummaryResponse):
    summary: dict[str, Any]
    activity_summary: dict[str, Any]


class MonthlyReportListResponse(BaseModel):
    items: list[MonthlyReportSummaryResponse]
    total: int


class MonthlyReportSignRequest(BaseModel):
    notes: Optional[str] = None


# ── Expenses ──────────────────────────────────────────────────────────────────

class ExpenseCreateRequest(BaseModel):
    department_id: UUID
    description: str
    amount: Decimal = Field(..., gt=0)


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    department_id: UUID
    department_name: str
    description: str
    amount: Decimal
    date: Optional[datetime] = None
    employee_id: UUID
    employee_name: str
    status: str  # Paid, Pending, Rejected


class ExpenseListResponse(BaseModel):
    items: list[ExpenseResponse]
    total: int
    total_pending_amount: Decimal
    total_paid_amount: Decimal


class ExpenseStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Paid, Rejected, Pending")


# ── Reconciliation & Compliance ───────────────────────────────────────────────

class ReconciliationItem(BaseModel):
    category: str
    recorded_amount: Decimal
    settled_amount: Decimal
    variance: Decimal
    status: str  # Matched, Discrepancy


class ReconciliationSummaryResponse(BaseModel):
    reconciliation_date: str
    overall_status: str  # Clean, Issues Found
    total_sales_recorded: Decimal
    total_bank_received: Decimal
    total_expenses_disbursed: Decimal
    inventory_valuation: Decimal
    items: list[ReconciliationItem]


class ComplianceAuditItem(BaseModel):
    area: str
    compliance_score: int
    status: str  # Compliant, Review Required
    last_audited: str
    auditor: str


class ComplianceDashboardResponse(BaseModel):
    compliance_rate: int
    tax_filing_status: str
    fssai_license_status: str
    safety_audit_status: str
    items: list[ComplianceAuditItem]


class SLAMetricsResponse(BaseModel):
    target_assignment_time_seconds: float = 120.0
    total_orders: int
    assigned_orders_count: int
    within_sla_count: int
    exceeded_sla_count: int
    sla_compliance_rate_pct: float
    average_assignment_seconds: float
    median_assignment_seconds: float
    fastest_assignment_seconds: float
    slowest_assignment_seconds: float
    awaiting_vehicle_count: int
    awaiting_driver_count: int
    average_godown_processing_seconds: float
    generated_at: str
