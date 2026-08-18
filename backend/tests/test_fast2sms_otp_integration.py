import uuid
import random
import hashlib
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.models.models import PhoneOTP, User, Customer
from app.core.config import settings

client = TestClient(app)


class TestFast2SMSOTPIntegration:
    @classmethod
    def setup_class(cls):
        cls.db = SessionLocal()

    @classmethod
    def teardown_class(cls):
        cls.db.close()

    def test_provider_diagnostic_endpoint(self):
        """Tests that the diagnostic endpoint reports provider status without exposing secrets."""
        res = client.get("/api/v1/auth/otp/diagnostic")
        assert res.status_code == 200
        data = res.json()
        assert "primary_provider" in data
        assert data["primary_provider"] == "fast2sms"
        assert "api_key_configured" in data
        assert "provider_connectivity" in data
        # Ensure no secrets or API keys are returned
        assert "api_key" not in data
        assert "auth_token" not in data
        assert "password" not in data

    def test_invalid_phone_format_rejection(self):
        """Tests that invalid phone formats are rejected with HTTP 400 or 422."""
        # Less than 10 digits (Pydantic min_length=10)
        res1 = client.post("/api/v1/auth/otp/request", json={"phone": "98765", "purpose": "login"})
        assert res1.status_code in (400, 422)

        # Invalid Indian series starting with 1
        res2 = client.post("/api/v1/auth/otp/request", json={"phone": "1234567890", "purpose": "login"})
        assert res2.status_code == 400

    @patch("app.core.sms.send_otp_sms")
    def test_fast2sms_successful_dispatch_and_verification(self, mock_send_sms):
        """Tests end-to-end send -> rate limit -> verify -> JWT issuance lifecycle."""
        from app.core.sms import DeliveryResult
        mock_send_sms.return_value = DeliveryResult(
            success=True,
            provider="fast2sms",
            channel="sms",
            message_id="fast2sms_req_998877",
        )

        # Temporary configure API key for test
        original_key = settings.FAST2SMS_API_KEY
        settings.FAST2SMS_API_KEY = "test_fast2sms_api_key_mock"
        try:
            phone_num = "98" + "".join(random.choices("0123456789", k=8))
            e164_phone = f"+91{phone_num}"

            # 1. Request OTP
            res = client.post("/api/v1/auth/otp/request", json={"phone": phone_num, "purpose": "login"})
            assert res.status_code == 200
            data = res.json()
            assert data["expires_in_seconds"] == 300
            assert "****" in data["phone"]
            # Ensure no plain OTP is returned in the API response
            assert "otp" not in data
            assert "otp_code" not in data

            # 2. Rate limiting check (requesting again within 30s)
            res_limit = client.post("/api/v1/auth/otp/request", json={"phone": phone_num, "purpose": "login"})
            assert res_limit.status_code == 429

            # 3. Retrieve hashed record from database to verify OTP
            otp_record = (
                self.db.query(PhoneOTP)
                .filter(PhoneOTP.phone == e164_phone, PhoneOTP.is_used == False)
                .order_by(PhoneOTP.created_at.desc())
                .first()
            )
            assert otp_record is not None
            assert len(otp_record.otp_hash) == 64  # Valid SHA-256

            # 4. Attempt verify with wrong OTP
            res_wrong = client.post(
                "/api/v1/auth/otp/verify",
                json={"phone": phone_num, "otp": "000000", "purpose": "login"},
            )
            assert res_wrong.status_code == 400
            assert "Invalid OTP" in res_wrong.json()["detail"]

            # 5. Set a known OTP hash for testing verification
            test_otp = "849201"
            otp_record.otp_hash = hashlib.sha256(test_otp.encode("utf-8")).hexdigest()
            self.db.commit()

            # 6. Verify with correct OTP
            res_verify = client.post(
                "/api/v1/auth/otp/verify",
                json={"phone": phone_num, "otp": test_otp, "purpose": "login", "name": "Ranjith Kumar"},
            )
            assert res_verify.status_code == 200
            auth_data = res_verify.json()
            assert "access_token" in auth_data
            assert auth_data["token_type"] == "bearer"
            assert auth_data["user"]["phone"] == e164_phone
            assert auth_data["user"]["role"] == "CUSTOMER"

            # 7. Ensure OTP cannot be reused
            res_reuse = client.post(
                "/api/v1/auth/otp/verify",
                json={"phone": phone_num, "otp": test_otp, "purpose": "login"},
            )
            assert res_reuse.status_code == 400

        finally:
            settings.FAST2SMS_API_KEY = original_key

    def test_missing_fast2sms_api_key_returns_safe_503(self):
        """Tests that when FAST2SMS_API_KEY is not set, a clear HTTP 503 is returned."""
        original_key = settings.FAST2SMS_API_KEY
        settings.FAST2SMS_API_KEY = ""
        try:
            phone_num = "98" + "".join(random.choices("0123456789", k=8))
            res = client.post("/api/v1/auth/otp/request", json={"phone": phone_num, "purpose": "login"})
            assert res.status_code == 503
            assert "FAST2SMS_API_KEY" in res.json()["detail"] or "SMS provider is not configured" in res.json()["detail"]
        finally:
            settings.FAST2SMS_API_KEY = original_key
