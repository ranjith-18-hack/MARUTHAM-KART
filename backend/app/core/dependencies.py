"""
Updated FastAPI dependency injection utilities.
Provides:
  - get_database_session: injects a SQLAlchemy DB session
  - get_current_user:     validates JWT and returns the authenticated User
  - RoleChecker:          enforces role-based access control per endpoint
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── DB session ────────────────────────────────────────────────────────────────

def get_database_session(db: Session = Depends(get_db)) -> Session:
    """Backward-compatible alias — existing code uses get_database_session."""
    return db


# ── JWT + User resolution ─────────────────────────────────────────────────────

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """
    Decode the Bearer JWT, look up the user in the database, and return the
    User ORM object.  Raises 401 for invalid/expired tokens, 403 for inactive
    accounts.
    """
    from app.core.security import decode_token

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: Optional[str] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    if user.status not in ("Active",):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is not active (status: {user.status}). "
                   "Contact your administrator.",
        )
    return user


# ── Optional current user (for public endpoints that can optionally use auth) ─

def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(OAuth2PasswordBearer(
        tokenUrl="/api/v1/auth/login", auto_error=False
    )),
) -> Optional[User]:
    """Like get_current_user but returns None instead of raising if no token."""
    if token is None:
        return None
    try:
        return get_current_user.__wrapped__(db=db, token=token)
    except HTTPException:
        return None


# ── Role-based access control ─────────────────────────────────────────────────

class RoleChecker:
    """
    FastAPI dependency that enforces one or more allowed roles.

    Usage::

        require_admin = RoleChecker(["ADMIN"])

        @router.get("/secret", dependencies=[Depends(require_admin)])
        def secret_endpoint(): ...

        # Or inject the user object:
        @router.get("/secret")
        def secret_endpoint(user: User = Depends(require_admin)): ...
    """

    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = [r.upper() for r in allowed_roles]

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.upper() not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied. Required role(s): {', '.join(self.allowed_roles)}. "
                    f"Your role: {current_user.role}."
                ),
            )
        return current_user


# Convenience role checkers ─────────────────────────────────────────────────

require_admin             = RoleChecker(["ADMIN"])
require_customer          = RoleChecker(["CUSTOMER"])
require_farmer            = RoleChecker(["FARMER"])
require_godown_manager    = RoleChecker(["GODOWN_MANAGER"])
require_transport_manager = RoleChecker(["TRANSPORT_MANAGER"])
require_driver            = RoleChecker(["DRIVER"])
require_recruitment       = RoleChecker(["RECRUITMENT_OFFICER"])
require_employee          = RoleChecker(["EMPLOYEE"])
require_hotel_business    = RoleChecker(["HOTEL_BUSINESS"])

# Multi-role checkers
require_farmer_or_admin      = RoleChecker(["FARMER", "ADMIN"])
require_b2b_or_admin         = RoleChecker(["HOTEL_BUSINESS", "ADMIN"])
require_office_or_admin      = RoleChecker(["EMPLOYEE", "ADMIN", "RECRUITMENT_OFFICER", "OFFICE_STAFF"])
require_driver_or_admin      = RoleChecker(["DRIVER", "ADMIN"])
require_godown_or_admin      = RoleChecker(["GODOWN_MANAGER", "ADMIN"])
require_transport_or_admin   = RoleChecker(["TRANSPORT_MANAGER", "ADMIN"])
require_recruitment_or_admin = RoleChecker(["RECRUITMENT_OFFICER", "ADMIN"])
require_any_staff            = RoleChecker([
    "ADMIN", "GODOWN_MANAGER", "TRANSPORT_MANAGER",
    "DRIVER", "RECRUITMENT_OFFICER", "EMPLOYEE", "HOTEL_BUSINESS", "FARMER",
])
