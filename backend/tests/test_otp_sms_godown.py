import pytest
from app.core.sms import normalize_indian_phone, send_otp_sms
from app.services.godown_matcher import calculate_distance_km, find_nearest_godown
from app.models.models import CustomerAddress, Godown
from app.database.connection import SessionLocal

def test_normalize_indian_phone_formats():
    # Standard 10 digit
    ten, e164 = normalize_indian_phone("9876543210")
    assert ten == "9876543210"
    assert e164 == "+919876543210"

    # +91 prefixed with spaces
    ten, e164 = normalize_indian_phone("+91 98421 23456")
    assert ten == "9842123456"
    assert e164 == "+919842123456"

    # 0 prefixed
    ten, e164 = normalize_indian_phone("09876543210")
    assert ten == "9876543210"
    assert e164 == "+919876543210"

def test_sms_otp_dev_dispatch():
    res = send_otp_sms("9876543210", "123456", "login")
    assert res.success is True
    assert res.provider == "development"
    assert res.message_id == "dev_dispatched"

def test_haversine_distance_calculation():
    # Coimbatore (11.0168, 76.9558) to Pollachi (10.6609, 77.0048) ~ 40km
    dist = calculate_distance_km(11.0168, 76.9558, 10.6609, 77.0048)
    assert 35.0 <= dist <= 45.0

def test_godown_assignment_service():
    db = SessionLocal()
    try:
        # Ensure godowns exist in test DB
        g1 = db.query(Godown).filter(Godown.location == "Coimbatore").first()
        if not g1:
            g1 = Godown(
                godown_code="GD-CBE-TEST",
                name="Coimbatore Central Warehouse",
                location="Coimbatore",
                total_capacity=100000.0,
                used_capacity=5000.0,
            )
            db.add(g1)
            db.commit()

        # Address in Coimbatore
        addr = CustomerAddress(
            customer_id=g1.id,
            recipient_name="Test Customer",
            phone="+919876543210",
            address_label="Home",
            street_address="123 Avinashi Road",
            area="Peelamedu",
            city="Coimbatore",
            state="Tamil Nadu",
            postal_code="641004",
            latitude=11.0283,
            longitude=77.0031,
        )

        godown_match = find_nearest_godown(db, addr)
        assert godown_match is not None
        assert "Coimbatore" in godown_match["name"] or "Coimbatore" in godown_match["location"]
        assert godown_match["estimated_distance_km"] > 0
        assert godown_match["estimated_delivery_hours"] in (2, 4, 24)
    finally:
        db.close()
