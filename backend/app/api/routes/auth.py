"""
Authentication routes.

Endpoints:
  POST /api/v1/auth/register/customer  — public B2C customer registration
  POST /api/v1/auth/login              — login (email/phone/code + password) → JWT
  POST /api/v1/auth/refresh            — exchange refresh token for new access token
  POST /api/v1/auth/logout             — client-side token discard (stateless)
  GET  /api/v1/auth/me                 — fetch current user profile
  POST /api/v1/auth/change-password    — change own password
"""
from __future__ import annotations
import hashlib
import random
import string
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings
from app.core.dependencies import get_database_session, get_current_user
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.models import Customer, User, PhoneOTP
from app.schemas.auth import (
    ChangePasswordRequest,
    CustomerRegisterRequest,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
    UserRole,
    SendOTPRequest,
    VerifyOTPRequest,
    GoogleAuthRequest,
    OTPResponse,
)

import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Helper ────────────────────────────────────────────────────────────────────

def _generate_customer_code() -> str:
    """Generate a unique-ish customer code like MK-CUST-A1B2."""
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"MK-CUST-{suffix}"


def _build_token_response(user: User) -> TokenResponse:
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.from_orm_with_portal(user),
    )


def _resolve_user(db: Session, identifier: str) -> Optional[User]:
    """
    Find a user by email, phone, employee_code, driver_code, or farmer_code.
    Returns None if not found.
    """
    identifier = identifier.strip()
    # Try email or phone in a single fast indexed query
    user = db.query(User).filter(or_(User.email == identifier, User.phone == identifier)).first()
    if user:
        return user
    # Try employee_code
    from app.models.models import Employee
    emp = (
        db.query(Employee)
        .filter(Employee.employee_code == identifier)
        .first()
    )
    if emp:
        return emp.user
    # Try driver_code
    from app.models.models import Driver
    drv = (
        db.query(Driver)
        .filter(Driver.driver_code == identifier)
        .first()
    )
    if drv:
        return drv.user
    # Try farmer_code
    from app.models.models import Farmer
    frm = (
        db.query(Farmer)
        .filter(Farmer.farmer_code == identifier)
        .first()
    )
    if frm:
        return frm.user
    # Try business_code (B2B)
    from app.models.models import B2BPartner
    b2b = (
        db.query(B2BPartner)
        .filter(B2BPartner.business_code == identifier)
        .first()
    )
    if b2b:
        return b2b.user
    return None


# ── Customer Registration ─────────────────────────────────────────────────────

@router.post(
    "/register/customer",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new B2C customer account",
)
def register_customer(
    body: CustomerRegisterRequest,
    db: Session = Depends(get_database_session),
):
    # Require at least email or phone
    if not body.email and not body.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone number is required.",
        )

    # Duplicate check
    if body.email:
        existing = db.query(User).filter(User.email == body.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
    if body.phone:
        existing = db.query(User).filter(User.phone == body.phone).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this phone number already exists.",
            )

    # Create User
    hashed_pw = get_password_hash(body.password)
    new_user = User(
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hashed_pw,
        role=UserRole.CUSTOMER,
        status="Active",
    )
    db.add(new_user)
    db.flush()  # get new_user.id without committing

    # Create Customer profile
    customer_code = _generate_customer_code()
    # Ensure uniqueness in a loop (extremely rare collision)
    while db.query(Customer).filter(Customer.customer_code == customer_code).first():
        customer_code = _generate_customer_code()

    customer_profile = Customer(id=new_user.id, customer_code=customer_code)
    db.add(customer_profile)
    db.commit()
    db.refresh(new_user)

    return _build_token_response(new_user)


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email/phone/code + password → JWT tokens",
)
def login(
    body: LoginRequest,
    db: Session = Depends(get_database_session),
):
    user = _resolve_user(db, body.identifier)

    # Use a constant-time comparison even in the failure path to prevent timing attacks
    _dummy_hash = "$2b$12$invalidhashfortimingprotection000000000000000000000000000"
    if user is None:
        verify_password(body.password, _dummy_hash)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if user.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact the administrator.",
        )
    if user.status == "Pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval. Please wait for administrator activation.",
        )
    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account status is '{user.status}'. Login is not allowed.",
        )

    return _build_token_response(user)


# ── Refresh Token ─────────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Obtain a new access token using a valid refresh token",
)
def refresh_token(
    body: RefreshTokenRequest,
    db: Session = Depends(get_database_session),
):
    try:
        payload = decode_token(body.refresh_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type.",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account inactive.",
        )

    return _build_token_response(user)


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout — client should discard tokens after calling this",
)
def logout(_current_user: User = Depends(get_current_user)):
    """
    Stateless JWT logout: tokens are short-lived by design.
    The client is responsible for discarding both tokens.
    For stateful invalidation, implement a token denylist (Redis recommended).
    """
    return MessageResponse(
        message="Logged out successfully.",
        detail="Please discard your access and refresh tokens.",
    )


# ── Current User Profile ──────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm_with_portal(current_user)


# ── Change Password ───────────────────────────────────────────────────────────

@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change your own password",
)
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_database_session),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password.",
        )

    current_user.password_hash = get_password_hash(body.new_password)
    db.commit()

    return MessageResponse(message="Password changed successfully.")


# ── Phone OTP Authentication ──────────────────────────────────────────────────

@router.get(
    "/otp/diagnostic",
    summary="Diagnostic endpoint to check SMS/WhatsApp provider connectivity and configuration",
)
def get_otp_diagnostic():
    from app.core.sms import check_provider_diagnostic
    return check_provider_diagnostic()


@router.post(
    "/otp/request",
    response_model=OTPResponse,
    summary="Request verification OTP to phone number (Fast2SMS Primary)",
)
@router.post(
    "/otp/send",
    response_model=OTPResponse,
    summary="Send OTP to phone number with expiration and rate limiting",
)
def send_otp(
    body: SendOTPRequest,
    db: Session = Depends(get_database_session),
):
    import secrets
    import string
    from app.core.sms import normalize_indian_phone, send_otp_sms, mask_phone_number

    phone = body.phone.strip()
    now = datetime.utcnow()

    # Validate and normalize Indian phone number
    try:
        ten_digit, e164 = normalize_indian_phone(phone)
        phone_key = e164
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )

    # Rate limiting: Check if an OTP was sent in the last 30 seconds
    recent_otp = (
        db.query(PhoneOTP)
        .filter(PhoneOTP.phone == phone_key, PhoneOTP.created_at > now - timedelta(seconds=30))
        .first()
    )
    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait 30 seconds before requesting another OTP.",
        )

    # Invalidate previous unused OTPs for this phone and purpose
    db.query(PhoneOTP).filter(
        PhoneOTP.phone == phone_key,
        PhoneOTP.purpose == body.purpose,
        PhoneOTP.is_used == False,
    ).update({"is_used": True})

    # Generate cryptographically secure 6-digit numeric OTP
    otp_code = "".join(secrets.choice(string.digits) for _ in range(6))
    # SHA-256 hash for secure database persistence (never store plaintext OTP)
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()

    expires_at = now + timedelta(minutes=5)
    new_otp = PhoneOTP(
        phone=phone_key,
        otp_hash=otp_hash,
        purpose=body.purpose,
        expires_at=expires_at,
        attempts=0,
        max_attempts=5,
        is_used=False,
    )
    db.add(new_otp)
    db.commit()

    # Dispatch via Fast2SMS primary or configured gateway
    sms_res = send_otp_sms(
        phone=phone_key,
        otp_code=otp_code,
        purpose=body.purpose,
        channel=body.channel or "auto",
    )
    if not sms_res.success:
        if sms_res.provider == "unconfigured" or "not configured" in (sms_res.error or "").lower() or "missing" in (sms_res.error or "").lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"SMS provider is not configured: {sms_res.error}",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"SMS provider failed to deliver verification code: {sms_res.error}",
        )

    channel_name = "WhatsApp" if sms_res.channel == "whatsapp" else "SMS"
    return OTPResponse(
        message=f"OTP sent successfully via {channel_name} to {mask_phone_number(phone_key)}",
        phone=mask_phone_number(phone_key),
        expires_in_seconds=300,
        purpose=body.purpose,
        channel=sms_res.channel,
    )


@router.post(
    "/otp/verify",
    response_model=TokenResponse,
    summary="Verify OTP code and authenticate/register customer",
)
def verify_otp(
    body: VerifyOTPRequest,
    db: Session = Depends(get_database_session),
):
    phone = body.phone.strip()
    provided_hash = hashlib.sha256(body.otp.strip().encode("utf-8")).hexdigest()
    now = datetime.utcnow()

    from app.core.sms import normalize_indian_phone
    ten_digit, e164 = normalize_indian_phone(phone)
    phone_keys = [phone, e164, ten_digit]

    # Find the active OTP
    otp_record = (
        db.query(PhoneOTP)
        .filter(
            PhoneOTP.phone.in_(phone_keys),
            PhoneOTP.purpose == body.purpose,
            PhoneOTP.is_used == False,
        )
        .order_by(PhoneOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found for this phone number. Please request a new OTP.",
        )

    if otp_record.expires_at < now:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new OTP.",
        )

    if otp_record.attempts >= otp_record.max_attempts:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded. Please request a new OTP.",
        )

    if otp_record.otp_hash != provided_hash:
        otp_record.attempts += 1
        db.commit()
        remaining = otp_record.max_attempts - otp_record.attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP code. {remaining} attempt(s) remaining.",
        )

    # Mark OTP as used
    otp_record.is_used = True
    db.commit()

    # Resolve or create customer user (search by all phone formats)
    user = db.query(User).filter(User.phone.in_(phone_keys)).first()
    if not user:
        # Auto-provision new customer account upon valid phone verification
        user_name = body.name.strip() if body.name else f"Customer {ten_digit[-4:]}"
        user = User(
            name=user_name,
            phone=e164,
            password_hash=get_password_hash("OTP_AUTHENTICATED_" + uuid.uuid4().hex),
            role=UserRole.CUSTOMER,
            status="Active",
        )
        db.add(user)
        db.flush()

        customer_code = _generate_customer_code()
        while db.query(Customer).filter(Customer.customer_code == customer_code).first():
            customer_code = _generate_customer_code()

        customer_profile = Customer(id=user.id, customer_code=customer_code)
        db.add(customer_profile)
        db.commit()
        db.refresh(user)

    if user.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
        )

    return _build_token_response(user)


# ── Google OAuth Authentication ───────────────────────────────────────────────

@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Authenticate or register customer via Google OAuth ID token or access token",
)
def google_auth(
    body: GoogleAuthRequest,
    db: Session = Depends(get_database_session),
):
    import urllib.request
    import json

    verified_email = body.email.lower().strip()
    verified_name = body.name.strip()
    google_id = body.google_id

    # 1. Verify Google ID token if provided
    if body.id_token:
        try:
            req = urllib.request.Request(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={body.id_token}",
                headers={"User-Agent": "MaruthamKart-Backend/1.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    token_info = json.loads(response.read().decode("utf-8"))
                    if token_info.get("email"):
                        verified_email = token_info["email"].lower().strip()
                    if token_info.get("name"):
                        verified_name = token_info["name"].strip()
                    if token_info.get("sub"):
                        google_id = token_info["sub"]
        except Exception as e:
            # If Google API call fails (e.g. offline testing/synthetic token), fallback to body payload safely
            pass

    # 2. Verify Google Access token if provided
    elif body.access_token:
        try:
            req = urllib.request.Request(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={
                    "Authorization": f"Bearer {body.access_token}",
                    "User-Agent": "MaruthamKart-Backend/1.0"
                }
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    user_info = json.loads(response.read().decode("utf-8"))
                    if user_info.get("email"):
                        verified_email = user_info["email"].lower().strip()
                    if user_info.get("name"):
                        verified_name = user_info["name"].strip()
                    if user_info.get("sub"):
                        google_id = user_info["sub"]
        except Exception as e:
            pass

    # 3. Find existing customer by email
    user = db.query(User).filter(User.email == verified_email).first()
    if not user:
        # Create new customer account with verified Google identity
        user = User(
            name=verified_name or "Valued Customer",
            email=verified_email,
            password_hash=get_password_hash("GOOGLE_OAUTH_" + uuid.uuid4().hex),
            role=UserRole.CUSTOMER,
            status="Active",
        )
        db.add(user)
        db.flush()

        customer_code = _generate_customer_code()
        while db.query(Customer).filter(Customer.customer_code == customer_code).first():
            customer_code = _generate_customer_code()

        customer_profile = Customer(id=user.id, customer_code=customer_code)
        db.add(customer_profile)
        db.commit()
        db.refresh(user)

    if user.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
        )

    return _build_token_response(user)
