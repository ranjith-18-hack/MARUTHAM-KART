import hashlib
import uuid
from datetime import datetime, timedelta
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.models.models import User, Customer, CustomerAddress, PhoneOTP

client = TestClient(app)


class TestCustomerAuthAndLocation:
    @classmethod
    def setup_class(cls):
        cls.db = SessionLocal()

    @classmethod
    def teardown_class(cls):
        cls.db.close()

    def test_otp_send_and_verify_lifecycle(self):
        import random
        phone = "+9197" + "".join(random.choices("0123456789", k=8))

        # 1. Send OTP
        res = client.post("/api/v1/auth/otp/send", json={"phone": phone, "purpose": "login"})
        assert res.status_code == 200
        data = res.json()
        assert "****" in data["phone"]
        assert data["expires_in_seconds"] == 300

        # 2. Rate limiting check (sending another OTP within 30s)
        res_limit = client.post("/api/v1/auth/otp/send", json={"phone": phone, "purpose": "login"})
        assert res_limit.status_code == 429

        # Retrieve the OTP from DB to simulate user SMS delivery
        otp_rec = (
            self.db.query(PhoneOTP)
            .filter(PhoneOTP.phone == phone, PhoneOTP.is_used == False)
            .order_by(PhoneOTP.created_at.desc())
            .first()
        )
        assert otp_rec is not None

        # 3. Test Invalid OTP
        res_bad = client.post("/api/v1/auth/otp/verify", json={"phone": phone, "otp": "000000", "purpose": "login"})
        assert res_bad.status_code == 400

        # 4. Verify with correct OTP (we will set known hash for verification test)
        test_otp_code = "654321"
        otp_rec.otp_hash = hashlib.sha256(test_otp_code.encode("utf-8")).hexdigest()
        self.db.commit()

        res_verify = client.post(
            "/api/v1/auth/otp/verify",
            json={"phone": phone, "otp": test_otp_code, "purpose": "login", "name": "OTP Test User"},
        )
        assert res_verify.status_code == 200
        token_data = res_verify.json()
        assert "access_token" in token_data
        assert token_data["user"]["phone"] == phone
        assert token_data["user"]["role"] == "CUSTOMER"

    def test_google_auth_flow(self):
        suffix = str(uuid.uuid4())[:6]
        email = f"google_user_{suffix}@gmail.com"

        res = client.post(
            "/api/v1/auth/google",
            json={
                "email": email,
                "name": "Google Test Customer",
                "google_id": f"g_{suffix}",
            },
        )
        assert res.status_code == 200
        token_data = res.json()
        assert token_data["user"]["email"] == email
        assert token_data["user"]["role"] == "CUSTOMER"

    def test_customer_address_crud_and_onboarding(self):
        # Register a customer
        suffix = str(uuid.uuid4())[:6]
        phone = f"+9196{suffix}12"
        email = f"cust_addr_{suffix}@example.com"

        reg_res = client.post(
            "/api/v1/auth/register/customer",
            json={
                "name": "Address Flow Customer",
                "phone": phone,
                "email": email,
                "password": "Password123!",
            },
        )
        assert reg_res.status_code == 201
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Complete onboarding
        onboard_payload = {
            "name": "Address Flow Customer Updated",
            "phone": phone,
            "email": email,
            "door_no": "12-A",
            "street_address": "Avinashi Road",
            "area": "Peelamedu",
            "city": "Coimbatore",
            "state": "Tamil Nadu",
            "postal_code": "641004",
            "address_label": "Home",
        }
        res_onboard = client.post("/api/v1/customer/onboarding", json=onboard_payload, headers=headers)
        assert res_onboard.status_code == 201
        onboard_data = res_onboard.json()
        assert onboard_data["name"] == "Address Flow Customer Updated"
        assert onboard_data["default_address"] is not None
        assert onboard_data["default_address"]["area"] == "Peelamedu"
        assert onboard_data["default_address"]["is_default"] is True

        # 2. List addresses
        res_list = client.get("/api/v1/customer/addresses", headers=headers)
        assert res_list.status_code == 200
        addresses = res_list.json()
        assert len(addresses) == 1
        addr1_id = addresses[0]["id"]

        # 3. Add second address (Work)
        work_addr_payload = {
            "recipient_name": "Address Flow Customer",
            "phone": phone,
            "address_label": "Work",
            "door_no": "Level 4, IT Park",
            "street_address": "OMR",
            "area": "T. Nagar",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "postal_code": "600017",
            "is_default": True,
        }
        res_add2 = client.post("/api/v1/customer/addresses", json=work_addr_payload, headers=headers)
        assert res_add2.status_code == 201
        addr2 = res_add2.json()
        assert addr2["address_label"] == "Work"
        assert addr2["is_default"] is True
        addr2_id = addr2["id"]

        # 4. Verify profile default address is now the Work address
        prof_res = client.get("/api/v1/customer/profile", headers=headers)
        assert prof_res.status_code == 200
        assert prof_res.json()["default_address"]["id"] == addr2_id
        assert prof_res.json()["addresses_count"] == 2

        # 5. Switch default back to addr1
        res_default = client.put(f"/api/v1/customer/addresses/{addr1_id}/default", headers=headers)
        assert res_default.status_code == 200
        assert res_default.json()["is_default"] is True

        # 6. Update address 1
        res_update = client.put(
            f"/api/v1/customer/addresses/{addr1_id}",
            json={"door_no": "12-B", "area": "Hope College"},
            headers=headers,
        )
        assert res_update.status_code == 200
        assert res_update.json()["area"] == "Hope College"
        assert res_update.json()["door_no"] == "12-B"

        # 7. Delete address 2
        res_del = client.delete(f"/api/v1/customer/addresses/{addr2_id}", headers=headers)
        assert res_del.status_code == 200

        # Verify count is 1
        res_list_after = client.get("/api/v1/customer/addresses", headers=headers)
        assert len(res_list_after.json()) == 1
