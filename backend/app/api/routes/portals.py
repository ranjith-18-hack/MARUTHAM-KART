"""
Portal gateway routes — one protected endpoint per portal role.
These serve as the role-verified entry point that the frontend calls after login
to confirm the user's identity and retrieve their portal dashboard data.

Endpoints:
  GET /api/v1/portals/customer          — Customer portal access
  GET /api/v1/portals/godown            — Godown Manager portal
  GET /api/v1/portals/transport         — Transport Manager portal
  GET /api/v1/portals/driver            — Driver portal
  GET /api/v1/portals/recruitment       — Recruitment portal
  GET /api/v1/portals/employee          — General employee portal
  GET /api/v1/portals/business          — Hotel/Business portal
  GET /api/v1/portals/admin             — Admin / Office portal
"""
from fastapi import APIRouter, Depends
from app.core.dependencies import (
    get_current_user,
    require_admin,
    require_customer,
    require_driver,
    require_employee,
    require_godown_manager,
    require_godown_or_admin,
    require_hotel_business,
    require_recruitment,
    require_transport_manager,
    require_transport_or_admin,
    require_recruitment_or_admin,
)
from app.models.models import User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/portals", tags=["Portal Gateways"])


@router.get(
    "/customer",
    response_model=UserResponse,
    summary="Customer portal — requires CUSTOMER role",
)
def customer_portal(current_user: User = Depends(require_customer)):
    return UserResponse.from_orm_with_portal(current_user)


@router.get(
    "/godown",
    response_model=UserResponse,
    summary="Godown portal — requires GODOWN_MANAGER role",
)
def godown_portal(current_user: User = Depends(require_godown_or_admin)):
    return UserResponse.from_orm_with_portal(current_user)


@router.get(
    "/transport",
    response_model=UserResponse,
    summary="Transport portal — requires TRANSPORT_MANAGER role",
)
def transport_portal(current_user: User = Depends(require_transport_or_admin)):
    return UserResponse.from_orm_with_portal(current_user)


@router.get(
    "/driver",
    response_model=UserResponse,
    summary="Driver portal — requires DRIVER role",
)
def driver_portal(current_user: User = Depends(require_driver)):
    return UserResponse.from_orm_with_portal(current_user)


@router.get(
    "/recruitment",
    response_model=UserResponse,
    summary="Recruitment portal — requires RECRUITMENT_OFFICER role",
)
def recruitment_portal(current_user: User = Depends(require_recruitment_or_admin)):
    return UserResponse.from_orm_with_portal(current_user)


@router.get(
    "/employee",
    response_model=UserResponse,
    summary="Employee portal — requires EMPLOYEE role",
)
def employee_portal(current_user: User = Depends(require_employee)):
    return UserResponse.from_orm_with_portal(current_user)


@router.get(
    "/business",
    response_model=UserResponse,
    summary="Hotel/Business portal — requires HOTEL_BUSINESS role",
)
def business_portal(current_user: User = Depends(require_hotel_business)):
    return UserResponse.from_orm_with_portal(current_user)


@router.get(
    "/admin",
    response_model=UserResponse,
    summary="Admin/Office portal — requires ADMIN role",
)
def admin_portal(current_user: User = Depends(require_admin)):
    return UserResponse.from_orm_with_portal(current_user)
