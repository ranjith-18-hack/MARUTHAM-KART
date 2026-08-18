"""
Customer profile and address management routes.

Endpoints:
  GET    /api/v1/customer/profile           — view profile with default address
  PATCH  /api/v1/customer/profile           — update profile
  GET    /api/v1/customer/addresses         — list saved delivery addresses
  POST   /api/v1/customer/addresses         — add new delivery address
  PUT    /api/v1/customer/addresses/{id}    — update delivery address
  DELETE /api/v1/customer/addresses/{id}    — delete delivery address
  PUT    /api/v1/customer/addresses/{id}/default — set default address
  POST   /api/v1/customer/onboarding        — first-time profile & address onboarding
"""
from __future__ import annotations
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_database_session, require_customer
from app.models.models import Customer, User, CustomerAddress
from app.schemas.customer import (
    CustomerProfileResponse,
    CustomerProfileUpdateRequest,
    CustomerAddressCreateRequest,
    CustomerAddressUpdateRequest,
    CustomerAddressResponse,
    CustomerOnboardingRequest,
)

router = APIRouter(prefix="/customer", tags=["Customer"])


def _get_customer_profile(user: User, db: Session) -> Customer:
    profile = db.query(Customer).filter(Customer.id == user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found.",
        )
    return profile


def _get_default_address(user: User, db: Session) -> CustomerAddress | None:
    default_addr = (
        db.query(CustomerAddress)
        .filter(CustomerAddress.customer_id == user.id, CustomerAddress.is_default == True)
        .first()
    )
    if not default_addr:
        # Fallback to most recently added address
        default_addr = (
            db.query(CustomerAddress)
            .filter(CustomerAddress.customer_id == user.id)
            .order_by(CustomerAddress.created_at.desc())
            .first()
        )
    return default_addr


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get(
    "/profile",
    response_model=CustomerProfileResponse,
    summary="Get current customer profile and default delivery address",
)
def get_profile(
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    profile = _get_customer_profile(current_user, db)
    default_addr = _get_default_address(current_user, db)
    addr_count = db.query(CustomerAddress).filter(CustomerAddress.customer_id == current_user.id).count()

    default_resp = None
    if default_addr:
        default_resp = CustomerAddressResponse.model_validate(default_addr)

    from app.services.godown_matcher import find_nearest_godown
    assigned_godown = find_nearest_godown(db, default_addr)

    return CustomerProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        customer_code=profile.customer_code,
        status=current_user.status,
        created_at=current_user.created_at,
        default_address=default_resp,
        addresses_count=addr_count,
        assigned_godown=assigned_godown,
    )


@router.patch(
    "/profile",
    response_model=CustomerProfileResponse,
    summary="Update customer profile (name, email, phone)",
)
def update_profile(
    body: CustomerProfileUpdateRequest,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    # Check for conflicts if changing email/phone
    if body.email and body.email != current_user.email:
        if db.query(User).filter(User.email == body.email, User.id != current_user.id).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered to another account.",
            )
    if body.phone and body.phone != current_user.phone:
        if db.query(User).filter(User.phone == body.phone, User.id != current_user.id).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phone number is already registered to another account.",
            )

    if body.name:
        current_user.name = body.name
    if body.email:
        current_user.email = body.email
    if body.phone:
        current_user.phone = body.phone

    db.commit()
    db.refresh(current_user)

    return get_profile(current_user=current_user, db=db)


# ── Addresses ─────────────────────────────────────────────────────────────────

@router.get(
    "/addresses",
    response_model=List[CustomerAddressResponse],
    summary="List all saved delivery addresses for the customer",
)
def list_addresses(
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    addresses = (
        db.query(CustomerAddress)
        .filter(CustomerAddress.customer_id == current_user.id)
        .order_by(CustomerAddress.is_default.desc(), CustomerAddress.created_at.desc())
        .all()
    )
    return [CustomerAddressResponse.model_validate(a) for a in addresses]


@router.post(
    "/addresses",
    response_model=CustomerAddressResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new delivery address for the customer",
)
def create_address(
    body: CustomerAddressCreateRequest,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    existing_count = db.query(CustomerAddress).filter(CustomerAddress.customer_id == current_user.id).count()
    should_be_default = body.is_default or (existing_count == 0)

    if should_be_default:
        # Clear default flag on existing addresses
        db.query(CustomerAddress).filter(CustomerAddress.customer_id == current_user.id).update({"is_default": False})

    new_addr = CustomerAddress(
        customer_id=current_user.id,
        recipient_name=body.recipient_name,
        phone=body.phone,
        address_label=body.address_label or "Home",
        door_no=body.door_no,
        street_address=body.street_address,
        area=body.area,
        city=body.city,
        state=body.state or "Tamil Nadu",
        postal_code=body.postal_code,
        latitude=body.latitude,
        longitude=body.longitude,
        is_default=should_be_default,
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)

    return CustomerAddressResponse.model_validate(new_addr)


@router.put(
    "/addresses/{address_id}",
    response_model=CustomerAddressResponse,
    summary="Update an existing delivery address",
)
def update_address(
    address_id: UUID,
    body: CustomerAddressUpdateRequest,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    addr = (
        db.query(CustomerAddress)
        .filter(CustomerAddress.id == address_id, CustomerAddress.customer_id == current_user.id)
        .first()
    )
    if not addr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    if body.is_default is True:
        db.query(CustomerAddress).filter(CustomerAddress.customer_id == current_user.id).update({"is_default": False})
        addr.is_default = True

    if body.recipient_name is not None:
        addr.recipient_name = body.recipient_name
    if body.phone is not None:
        addr.phone = body.phone
    if body.address_label is not None:
        addr.address_label = body.address_label
    if body.door_no is not None:
        addr.door_no = body.door_no
    if body.street_address is not None:
        addr.street_address = body.street_address
    if body.area is not None:
        addr.area = body.area
    if body.city is not None:
        addr.city = body.city
    if body.state is not None:
        addr.state = body.state
    if body.postal_code is not None:
        addr.postal_code = body.postal_code
    if body.latitude is not None:
        addr.latitude = body.latitude
    if body.longitude is not None:
        addr.longitude = body.longitude

    db.commit()
    db.refresh(addr)

    return CustomerAddressResponse.model_validate(addr)


@router.delete(
    "/addresses/{address_id}",
    summary="Delete a delivery address",
)
def delete_address(
    address_id: UUID,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    addr = (
        db.query(CustomerAddress)
        .filter(CustomerAddress.id == address_id, CustomerAddress.customer_id == current_user.id)
        .first()
    )
    if not addr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    was_default = addr.is_default
    db.delete(addr)
    db.commit()

    # If the deleted address was default, promote another address to default
    if was_default:
        next_addr = (
            db.query(CustomerAddress)
            .filter(CustomerAddress.customer_id == current_user.id)
            .order_by(CustomerAddress.created_at.desc())
            .first()
        )
        if next_addr:
            next_addr.is_default = True
            db.commit()

    return {"message": "Address deleted successfully."}


@router.put(
    "/addresses/{address_id}/default",
    response_model=CustomerAddressResponse,
    summary="Set a delivery address as default",
)
def set_default_address(
    address_id: UUID,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    addr = (
        db.query(CustomerAddress)
        .filter(CustomerAddress.id == address_id, CustomerAddress.customer_id == current_user.id)
        .first()
    )
    if not addr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found.",
        )

    # Set all other addresses for this user to is_default = False
    db.query(CustomerAddress).filter(CustomerAddress.customer_id == current_user.id).update({"is_default": False})
    addr.is_default = True
    db.commit()
    db.refresh(addr)

    return CustomerAddressResponse.model_validate(addr)


# ── Onboarding ────────────────────────────────────────────────────────────────

@router.post(
    "/onboarding",
    response_model=CustomerProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Complete first-time customer profile & initial delivery location setup",
)
def complete_onboarding(
    body: CustomerOnboardingRequest,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_database_session),
):
    # Update profile fields if provided
    if body.name:
        current_user.name = body.name
    if body.phone and not current_user.phone:
        existing_phone = db.query(User).filter(User.phone == body.phone, User.id != current_user.id).first()
        if not existing_phone:
            current_user.phone = body.phone
    if body.email and not current_user.email:
        existing_email = db.query(User).filter(User.email == body.email, User.id != current_user.id).first()
        if not existing_email:
            current_user.email = body.email

    # Clear previous defaults
    db.query(CustomerAddress).filter(CustomerAddress.customer_id == current_user.id).update({"is_default": False})

    # Create initial delivery address
    new_addr = CustomerAddress(
        customer_id=current_user.id,
        recipient_name=body.name or current_user.name,
        phone=body.phone or current_user.phone or "",
        address_label=body.address_label or "Home",
        door_no=body.door_no,
        street_address=body.street_address,
        area=body.area,
        city=body.city,
        state=body.state or "Tamil Nadu",
        postal_code=body.postal_code,
        latitude=body.latitude,
        longitude=body.longitude,
        is_default=True,
    )
    db.add(new_addr)
    db.commit()
    db.refresh(current_user)

    return get_profile(current_user=current_user, db=db)
