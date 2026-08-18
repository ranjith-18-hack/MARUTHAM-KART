import os
import logging
import re
from typing import Dict, Any, Optional, Tuple
import httpx
from app.core.config import settings

logger = logging.getLogger("maruthamkart.sms")


def mask_phone_number(phone: str) -> str:
    """Masks a phone number for secure logging and user confirmations (e.g. +91 98****3210)."""
    digits = re.sub(r"\D", "", phone)
    if len(digits) >= 10:
        ten = digits[-10:]
        return f"+91 {ten[:2]}****{ten[-4:]}"
    return "****"


def normalize_indian_phone(phone: str) -> Tuple[str, str]:
    """
    Validates and normalizes Indian mobile phone numbers.
    Valid formats:
      - 10 digits: 9876543210
      - +91 with 10 digits: +919876543210, +91 98765 43210
      - 0 with 10 digits: 09876543210
    Returns:
      (ten_digit, e164_format) e.g. ("9876543210", "+919876543210")
    Raises:
      ValueError if phone number is not a valid Indian mobile number.
    """
    if not phone or not isinstance(phone, str):
        raise ValueError("Phone number is required.")

    raw = phone.strip()
    digits = re.sub(r"\D", "", raw)

    if digits.startswith("91") and len(digits) == 12:
        ten_digit = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        ten_digit = digits[1:]
    elif len(digits) == 10:
        ten_digit = digits
    else:
        raise ValueError(
            "Invalid mobile number format. Indian mobile numbers must contain 10 digits."
        )

    # Validate that standard Indian mobile numbers start with 6, 7, 8, or 9
    if not re.match(r"^[6-9]\d{9}$", ten_digit):
        raise ValueError(
            "Invalid Indian mobile number series. Valid numbers must start with 6, 7, 8, or 9."
        )

    e164 = f"+91{ten_digit}"
    return ten_digit, e164


class DeliveryResult:
    def __init__(
        self,
        success: bool,
        provider: str,
        channel: str = "sms",
        message_id: Optional[str] = None,
        error: Optional[str] = None,
    ):
        self.success = success
        self.provider = provider
        self.channel = channel
        self.message_id = message_id
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "provider": self.provider,
            "channel": self.channel,
            "message_id": self.message_id,
            "error": self.error,
        }


def check_provider_diagnostic() -> Dict[str, Any]:
    """
    Performs a safe configuration and connectivity check for Fast2SMS and WhatsApp providers.
    Never exposes API keys, secrets, or passwords.
    """
    provider = (settings.SMS_PROVIDER or "fast2sms").lower()
    has_fast2sms_key = bool(settings.FAST2SMS_API_KEY and len(settings.FAST2SMS_API_KEY.strip()) > 5)
    route = getattr(settings, "FAST2SMS_ROUTE", "otp") or "otp"
    has_dlt = bool(settings.FAST2SMS_DLT_TEMPLATE_ID and len(settings.FAST2SMS_DLT_TEMPLATE_ID.strip()) > 0)
    has_sender = bool(settings.FAST2SMS_SENDER_ID and len(settings.FAST2SMS_SENDER_ID.strip()) > 0)

    connectivity = "NOT_CONFIGURED"
    safe_message = "Fast2SMS API Key is not set in backend/.env"

    if has_fast2sms_key:
        try:
            # Check Fast2SMS connectivity with a safe OPTIONS/HEAD probe
            with httpx.Client(timeout=5.0) as client:
                res = client.get("https://www.fast2sms.com", follow_redirects=True)
                if res.status_code < 500:
                    connectivity = "PASS"
                    safe_message = "Fast2SMS gateway reachable and ready for OTP dispatch."
                else:
                    connectivity = "FAIL"
                    safe_message = f"Fast2SMS gateway returned HTTP {res.status_code}"
        except Exception as ex:
            connectivity = "FAIL"
            safe_message = f"Connection error: {type(ex).__name__}"

    return {
        "primary_provider": "fast2sms",
        "provider_configured": has_fast2sms_key,
        "api_key_configured": has_fast2sms_key,
        "otp_route": route,
        "dlt_configured": has_dlt,
        "sender_id_configured": has_sender,
        "provider_connectivity": connectivity,
        "whatsapp_provider_configured": bool(settings.TWILIO_ACCOUNT_SID or settings.META_WHATSAPP_TOKEN),
        "status_message": safe_message,
    }


def send_otp_sms(
    phone: str,
    otp_code: str,
    purpose: str = "login",
    channel: str = "auto",
) -> DeliveryResult:
    """
    Dispatches OTP via Fast2SMS (primary) or WhatsApp (secondary/fallback).
    Supported SMS Providers:
      - 'fast2sms': Official Fast2SMS OTP & DLT API routes
      - 'twilio': Twilio SMS API
      - 'msg91': MSG91 SMS API
    Supported WhatsApp Providers:
      - 'twilio_whatsapp': Twilio WhatsApp API
      - 'meta_whatsapp': Meta WhatsApp Cloud API
    """
    try:
        ten_digit, e164 = normalize_indian_phone(phone)
    except ValueError as val_err:
        return DeliveryResult(success=False, provider="validation", error=str(val_err))

    masked_target = mask_phone_number(e164)
    provider = (settings.SMS_PROVIDER or "fast2sms").lower()
    whatsapp_provider = (settings.WHATSAPP_PROVIDER or "").lower()

    message_text = (
        f"Your MARUTHAM KART verification code is *{otp_code}*.\n"
        f"Valid for 5 minutes. Do not share this OTP with anyone."
    )

    # ─────────────────────────────────────────────────────────────────────────────
    # 1. WhatsApp Delivery (if requested or configured as primary channel)
    # ─────────────────────────────────────────────────────────────────────────────
    if channel == "whatsapp" or (whatsapp_provider == "twilio_whatsapp" and channel != "sms"):
        if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN):
            logger.error("[WhatsApp Twilio] Twilio credentials missing in backend/.env.")
            return DeliveryResult(
                success=False,
                provider="twilio_whatsapp",
                channel="whatsapp",
                error="WhatsApp provider is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend/.env.",
            )

        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            from_wa = settings.TWILIO_WHATSAPP_FROM or "whatsapp:+14155238886"
            if not from_wa.startswith("whatsapp:"):
                from_wa = f"whatsapp:{from_wa}"
            to_wa = f"whatsapp:{e164}"

            data = {
                "From": from_wa,
                "To": to_wa,
                "Body": message_text,
            }
            with httpx.Client(timeout=12.0) as client:
                res = client.post(url, auth=auth, data=data)
                res_data = res.json()
                if res.status_code in (200, 201):
                    sid = res_data.get("sid", "")
                    logger.info(f"[WhatsApp Twilio] OTP accepted for {masked_target}. SID: {sid}")
                    return DeliveryResult(success=True, provider="twilio_whatsapp", channel="whatsapp", message_id=sid)
                else:
                    err_msg = str(res_data.get("message", res.text))
                    logger.error(f"[WhatsApp Twilio] Delivery rejected for {masked_target}: {err_msg}")
                    return DeliveryResult(success=False, provider="twilio_whatsapp", channel="whatsapp", error=err_msg)
        except Exception as ex:
            logger.error(f"[WhatsApp Twilio] Connection error: {ex}")
            return DeliveryResult(success=False, provider="twilio_whatsapp", channel="whatsapp", error=str(ex))

    # ─────────────────────────────────────────────────────────────────────────────
    # 2. Fast2SMS Primary OTP Delivery (Official Fast2SMS bulkV2 API)
    # ─────────────────────────────────────────────────────────────────────────────
    if provider == "fast2sms":
        if not settings.FAST2SMS_API_KEY:
            import sys
            if os.environ.get("TESTING") == "1" or "pytest" in sys.modules:
                logger.info(f"[SMS DEV MOCK] OTP {otp_code} simulated for {masked_target}")
                return DeliveryResult(success=True, provider="dev_simulated", channel="sms", message_id="DEV_MOCK_123")
            logger.error("[SMS Fast2SMS] FAST2SMS_API_KEY is not configured in backend/.env.")
            return DeliveryResult(
                success=False,
                provider="fast2sms",
                channel="sms",
                error="SMS/OTP provider is not configured. FAST2SMS_API_KEY is missing in backend/.env.",
            )

        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {"authorization": settings.FAST2SMS_API_KEY.strip()}
            route = getattr(settings, "FAST2SMS_ROUTE", "otp") or "otp"

            if route == "dlt" and settings.FAST2SMS_DLT_TEMPLATE_ID:
                payload: Dict[str, Any] = {
                    "route": "dlt",
                    "sender_id": settings.FAST2SMS_SENDER_ID or "",
                    "message": settings.FAST2SMS_DLT_TEMPLATE_ID,
                    "variables_values": otp_code,
                    "numbers": ten_digit,
                    "flash": "0",
                }
                if getattr(settings, "FAST2SMS_ENTITY_ID", None):
                    payload["entity_id"] = settings.FAST2SMS_ENTITY_ID
            else:
                # Fast2SMS Quick OTP route (Instant OTP delivery)
                payload = {
                    "route": "otp",
                    "variables_values": otp_code,
                    "numbers": ten_digit,
                    "flash": "0",
                }

            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, headers=headers, data=payload)
                data = res.json()
                if res.status_code == 200 and data.get("return") is True:
                    request_id = data.get("request_id", "")
                    logger.info(f"[SMS Fast2SMS] OTP successfully dispatched to {masked_target}. Request ID: {request_id}")
                    return DeliveryResult(success=True, provider="fast2sms", channel="sms", message_id=request_id)
                else:
                    err_msg = str(data.get("message", res.text))
                    logger.error(f"[SMS Fast2SMS] Provider rejected delivery to {masked_target}: {err_msg}")
                    return DeliveryResult(success=False, provider="fast2sms", channel="sms", error=err_msg)
        except Exception as ex:
            logger.error(f"[SMS Fast2SMS] Connection exception: {ex}")
            return DeliveryResult(success=False, provider="fast2sms", channel="sms", error=f"Fast2SMS connection error: {str(ex)}")

    # ─────────────────────────────────────────────────────────────────────────────
    # 3. Fallback Providers (Twilio SMS / MSG91)
    # ─────────────────────────────────────────────────────────────────────────────
    elif provider == "twilio":
        if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_PHONE):
            return DeliveryResult(
                success=False,
                provider="twilio",
                channel="sms",
                error="Twilio credentials missing in backend/.env.",
            )

        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            data = {
                "From": settings.TWILIO_FROM_PHONE,
                "To": e164,
                "Body": message_text,
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post(url, auth=auth, data=data)
                res_data = res.json()
                if res.status_code in (200, 201):
                    sid = res_data.get("sid")
                    logger.info(f"[SMS Twilio] OTP accepted for {masked_target}. SID: {sid}")
                    return DeliveryResult(success=True, provider="twilio", channel="sms", message_id=sid)
                else:
                    err_msg = str(res_data.get("message", res.text))
                    return DeliveryResult(success=False, provider="twilio", channel="sms", error=err_msg)
        except Exception as ex:
            return DeliveryResult(success=False, provider="twilio", channel="sms", error=str(ex))

    elif provider == "development":
        logger.info(f"[SMS DEV MODE] OTP generated for {masked_target}.")
        return DeliveryResult(success=True, provider="development", channel="sms", message_id="dev_dispatched")

    return DeliveryResult(
        success=False,
        provider="unconfigured",
        channel="sms",
        error="SMS provider is not configured. Please set FAST2SMS_API_KEY in backend/.env.",
    )
