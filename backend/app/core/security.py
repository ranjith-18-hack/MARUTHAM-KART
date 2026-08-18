"""
Core security utilities — password hashing and JWT token management.
These utilities are server-side only. Never expose JWT_SECRET or password hashes to clients.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union

import bcrypt
import jwt

# ── JWT config loaded via settings (from .env) ───────────────────────────────
# Imported lazily to avoid circular imports at module load time.
def _get_jwt_secret() -> str:
    from app.core.config import settings
    return settings.JWT_SECRET

def _get_algorithm() -> str:
    return "HS256"

ALGORITHM = "HS256"


# ── Password hashing ──────────────────────────────────────────────────────────

def get_password_hash(password: str) -> str:
    """Hash a plain-text password using bcrypt (cost factor 12). Returns a UTF-8 string."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if the plain-text password matches the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _build_token(subject: Union[str, Any], token_type: str, expire: datetime) -> str:
    """Internal helper to encode a JWT payload."""
    payload = {
        "sub": str(subject),
        "type": token_type,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _get_jwt_secret(), algorithm=ALGORITHM)


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a short-lived JWT access token for API authentication."""
    from app.core.config import settings
    delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + delta
    return _build_token(subject, "access", expire)


def create_refresh_token(subject: Union[str, Any]) -> str:
    """Create a long-lived JWT refresh token."""
    from app.core.config import settings
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _build_token(subject, "refresh", expire)


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    return jwt.decode(token, _get_jwt_secret(), algorithms=[ALGORITHM])
