import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "MARUTHAM KART Backend"

    # JWT
    JWT_SECRET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS origins
    ALLOWED_ORIGINS: str = (
        "http://localhost:8080,http://localhost:5173,http://localhost:3000,"
        "http://127.0.0.1:8080,http://127.0.0.1:5173,http://10.0.2.2:8000,"
        "capacitor://localhost,http://localhost"
    )

    # SMS / WhatsApp / OTP Provider Configuration
    SMS_PROVIDER: str = "fast2sms"  # Primary: "fast2sms" | Fallback: "twilio", "msg91", "development"
    FAST2SMS_API_KEY: Optional[str] = None
    FAST2SMS_ROUTE: str = "otp"  # "otp" (Quick OTP route) | "dlt" (Enterprise DLT route)
    FAST2SMS_SENDER_ID: Optional[str] = None
    FAST2SMS_DLT_TEMPLATE_ID: Optional[str] = None
    FAST2SMS_ENTITY_ID: Optional[str] = None

    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_FROM_PHONE: Optional[str] = None
    MSG91_AUTH_KEY: Optional[str] = None
    MSG91_SENDER_ID: Optional[str] = None
    MSG91_TEMPLATE_ID: Optional[str] = None

    # WhatsApp Delivery Configuration
    WHATSAPP_PROVIDER: Optional[str] = None  # "twilio_whatsapp" | "meta_whatsapp"
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"  # Twilio Sandbox Default
    META_WHATSAPP_PHONE_ID: Optional[str] = None
    META_WHATSAPP_TOKEN: Optional[str] = None

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Payment Gateway Configuration (Razorpay Primary for UPI / Cards / Net Banking)
    PAYMENT_GATEWAY: str = "razorpay"  # "razorpay" | "cashfree"
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None
    RAZORPAY_TEST_MODE: bool = True

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
