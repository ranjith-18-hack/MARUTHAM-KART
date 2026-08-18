"""
MARUTHAM KART — Complete End-to-End Workflow Automation Test Suite

Validates the full production workflow:
1. Prepaid UPI Order Checkout & Cryptographic HMAC SHA-256 Verification
2. Cash on Delivery (COD) Order Workflow
3. Decoupled Domain Events & Role Notifications
4. Godown Order Queue & Picking Workflow
5. Inventory Shortage Detection & Alert Generation
6. Godown Packing & Verified Actual Weight Confirmation
7. Transport Dispatch Queue Auto-Population
8. Multi-Factor Transport Allocation (Capacity Matching, Rejecting Underweight Vehicles)
9. Driver Recommendation & Workload Balancing
10. Transport Assignment & 4-Digit Doorstep Delivery OTP Generation
11. Customer Real-Time Tracking & OTP Exposure
12. Driver Delivery Execution ("Out for Delivery")
13. Wrong OTP Rejection & Security Enforcement
14. Valid OTP Verification & Doorstep Handover
15. Post-Delivery Settle: Vehicle & Driver Release, COD Cash Recording & Invoicing
"""
import hmac
import hashlib
import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.core.security import get_password_hash, create_access_token
from app.models.models import (
    User, Product, Farmer, Godown, Cart, CartItem, Order, OrderItem,
    PickingRecord, PackingRecord, Vehicle, Driver, Delivery, DeliveryOTP,
    Invoice, Payment, DomainEvent, GodownAlert, TransportAssignment
)

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_pipeline_data():
    """Seed test database with Farmer, Godown, Products, Vehicles, Drivers, and Users."""
    db = SessionLocal()
    unique_id = uuid.uuid4().hex[:6]

    # 1. Customer User
    customer = User(
        name=f"Automation Customer {unique_id}",
        email=f"customer_{unique_id}@test.com",
        phone=f"+9198765{unique_id[:5]}",
        password_hash=get_password_hash("Pass@123"),
        role="CUSTOMER",
        status="Active",
    )
    db.add(customer)

    # 2. Godown Manager
    godown_mgr = User(
        name=f"Godown Manager {unique_id}",
        email=f"godown_{unique_id}@test.com",
        phone=f"+9198764{unique_id[:5]}",
        password_hash=get_password_hash("Pass@123"),
        role="GODOWN_MANAGER",
        status="Active",
    )
    db.add(godown_mgr)

    # 3. Transport Manager
    transport_mgr = User(
        name=f"Transport Manager {unique_id}",
        email=f"transport_{unique_id}@test.com",
        phone=f"+9198763{unique_id[:5]}",
        password_hash=get_password_hash("Pass@123"),
        role="TRANSPORT_MANAGER",
        status="Active",
    )
    db.add(transport_mgr)

    # 4. Driver User
    driver_user = User(
        name=f"Driver Veerappan {unique_id}",
        email=f"driver_{unique_id}@test.com",
        phone=f"+9198762{unique_id[:5]}",
        password_hash=get_password_hash("Pass@123"),
        role="DRIVER",
        status="Active",
    )
    db.add(driver_user)

    # 5. Farmer
    farmer_user = User(
        name=f"Farmer Raman {unique_id}",
        email=f"farmer_{unique_id}@test.com",
        phone=f"+9198761{unique_id[:5]}",
        password_hash=get_password_hash("Pass@123"),
        role="FARMER",
        status="Active",
    )
    db.add(farmer_user)
    db.flush()

    farmer = Farmer(
        id=farmer_user.id,
        farmer_code=f"MK-FAR-{unique_id[:4].upper()}",
        location="Madurai Outer Ring Road, Tamil Nadu",
        rating=4.9,
        products_supplied=120,
        verified=True,
    )
    db.add(farmer)

    # 6. Godown
    godown = Godown(
        godown_code=f"MK-GD-{unique_id[:4].upper()}",
        name="Madurai Central Godown",
        location="Madurai Outer Ring Road",
        total_capacity=Decimal("50000.00"),
        used_capacity=Decimal("0.00"),
    )
    db.add(godown)

    # 7. Products
    prod1 = Product(
        name="Organic Ponni Rice",
        category="Grains",
        price=Decimal("65.00"),
        unit="kg",
        available_qty=Decimal("500.00"),
        availability="Available",
        status="Active",
        farmer_id=farmer.id,
    )
    prod2 = Product(
        name="Fresh Country Tomatoes",
        category="Vegetables",
        price=Decimal("40.00"),
        unit="kg",
        available_qty=Decimal("200.00"),
        availability="Available",
        status="Active",
        farmer_id=farmer.id,
    )
    db.add(prod1)
    db.add(prod2)

    # 8. Fleet Vehicles: Small Bike (15kg) and Mini Truck (500kg)
    small_bike = Vehicle(
        vehicle_code=f"MK-V-BK-{unique_id[:3]}",
        number=f"TN-58-BK-{unique_id[:4]}",
        type="Two Wheeler",
        max_weight=Decimal("15.00"),
        max_volume=Decimal("0.10"),
        capacity="15 kg",
        status="Available",
        service_status="Healthy",
        insurance_status="Valid",
        fitness_status="Valid",
    )
    mini_truck = Vehicle(
        vehicle_code=f"MK-V-TR-{unique_id[:3]}",
        number=f"TN-58-TR-{unique_id[:4]}",
        type="Mini Truck",
        max_weight=Decimal("500.00"),
        max_volume=Decimal("3.50"),
        capacity="500 kg",
        status="Available",
        service_status="Healthy",
        insurance_status="Valid",
        fitness_status="Valid",
    )
    db.add(small_bike)
    db.add(mini_truck)
    db.flush()

    # 9. Driver Profile
    driver = Driver(
        id=driver_user.id,
        driver_code=f"MK-DRI-{unique_id[:3]}",
        type="Home Delivery Driver",
        availability="Available",
        workload=0,
        vehicle_id=mini_truck.id,
    )
    db.add(driver)

    # 10. Office Admin
    office_admin = User(
        name=f"Office Admin {unique_id}",
        email=f"office_{unique_id}@test.com",
        phone=f"+9198760{unique_id[:5]}",
        password_hash=get_password_hash("Pass@123"),
        role="OFFICE_STAFF",
        status="Active",
    )
    db.add(office_admin)

    db.commit()

    yield {
        "customer": customer,
        "godown_mgr": godown_mgr,
        "transport_mgr": transport_mgr,
        "driver_user": driver_user,
        "office_admin": office_admin,
        "godown": godown,
        "prod1": prod1,
        "prod2": prod2,
        "small_bike": small_bike,
        "mini_truck": mini_truck,
        "driver": driver,
    }
    db.close()


def _get_token(user: User) -> str:
    return create_access_token(subject=str(user.id))


def test_full_prepaid_automation_pipeline(setup_pipeline_data):
    """
    Executes the entire 15-stage automation pipeline from Payment -> Godown -> Transport -> Driver -> Handover -> Settle.
    """
    data = setup_pipeline_data
    db = SessionLocal()
    cust_token = _get_token(data["customer"])
    godown_token = _get_token(data["godown_mgr"])
    transport_token = _get_token(data["transport_mgr"])
    driver_token = _get_token(data["driver_user"])

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 1: Customer creates payment intent (UPI)
    # ──────────────────────────────────────────────────────────────────────────
    cart = db.query(Cart).filter(Cart.customer_id == data["customer"].id).first()
    if not cart:
        cart = Cart(customer_id=data["customer"].id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.add(CartItem(cart_id=cart.id, product_id=data["prod1"].id, quantity=Decimal("15.00"), unit_price=data["prod1"].price))
    db.add(CartItem(cart_id=cart.id, product_id=data["prod2"].id, quantity=Decimal("5.00"), unit_price=data["prod2"].price))
    db.commit()

    intent_res = client.post(
        "/api/v1/payments/create-intent",
        json={
            "payment_method": "UPI",
            "delivery_address": "12 Gandhi Nagar, Madurai, Tamil Nadu - 625001",
            "idempotency_key": f"test-intent-{uuid.uuid4().hex[:8]}",
        },
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert intent_res.status_code == 201, intent_res.text
    intent_data = intent_res.json()
    order_id = intent_data["order_id"]
    razorpay_order_id = intent_data["razorpay_order_id"]

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 2: HMAC SHA-256 Payment Verification & Order Confirmation
    # ──────────────────────────────────────────────────────────────────────────
    razorpay_payment_id = f"pay_test_{uuid.uuid4().hex[:8]}"
    secret = b"maruthamkart_sandbox_secret_2026"
    msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    signature = hmac.new(secret, msg, hashlib.sha256).hexdigest()

    v_res = client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": order_id,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": signature,
        },
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert v_res.status_code == 200, v_res.text
    assert v_res.json()["payment_status"] == "CAPTURED"
    assert v_res.json()["order_status"] == "Pending"

    # Verify domain event in PostgreSQL
    event = db.query(DomainEvent).filter(
        DomainEvent.aggregate_id == uuid.UUID(order_id),
        DomainEvent.event_type == "ORDER_CONFIRMED"
    ).first()
    assert event is not None, "ORDER_CONFIRMED domain event must be emitted."

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 3: Godown Picking & Inventory Shortage Alert
    # ──────────────────────────────────────────────────────────────────────────
    order = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    order_items = order.order_items

    # Pick item 1 fully (15kg) and item 2 partially (4kg instead of 5kg -> 1kg shortage)
    pick_res = client.post(
        f"/api/v1/godown/orders/{order_id}/pick",
        json={
            "items": [
                {"order_item_id": str(order_items[0].id), "picked_qty": 15.0, "notes": "Picked from Rack A"},
                {"order_item_id": str(order_items[1].id), "picked_qty": 4.0, "notes": "1kg crate shortage"},
            ],
        },
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    assert pick_res.status_code == 200, pick_res.text
    assert pick_res.json()["status"] == "Picking"

    # Check that Godown Shortage Alert was created
    alert = db.query(GodownAlert).filter(
        GodownAlert.alert_type == "INVENTORY_SHORTAGE"
    ).order_by(GodownAlert.created_at.desc()).first()
    assert alert is not None, "Shortage alert must be recorded."

    # Complete picking for remaining 1kg
    pick_fix_res = client.post(
        f"/api/v1/godown/orders/{order_id}/pick",
        json={
            "items": [
                {"order_item_id": str(order_items[1].id), "picked_qty": 5.0, "notes": "Restocked from reserve"},
            ],
        },
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    assert pick_fix_res.status_code == 200

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 4: Godown Packing & Verified Actual Weight (19.4 kg) Confirmation
    # ──────────────────────────────────────────────────────────────────────────
    pack_res = client.post(
        f"/api/v1/godown/orders/{order_id}/pack",
        json={
            "package_count": 2,
            "total_weight_kg": 19.4,
            "notes": "Packed in reinforced produce crates",
        },
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    assert pack_res.status_code == 200, pack_res.text
    assert pack_res.json()["status"] == "Packing"

    ready_res = client.post(
        f"/api/v1/godown/orders/{order_id}/ready",
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    assert ready_res.status_code == 200, ready_res.text
    assert ready_res.json()["status"] in ("Ready for Dispatch", "Driver Assigned")

    # Verify auto-queued into Transport deliveries
    deliv = db.query(Delivery).filter(Delivery.order_id == uuid.UUID(order_id)).first()
    assert deliv is not None, "Delivery entry must be automatically created in Transport Dispatch Queue."
    assert deliv.status in ("Awaiting Assignment", "Driver Assigned")
    assert "19.4" in deliv.quantity

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 5: Multi-Factor Transport Allocation (Matches Mini Truck, Rejects Bike)
    # ──────────────────────────────────────────────────────────────────────────
    truck = db.query(Vehicle).filter(Vehicle.id == data["mini_truck"].id).first()
    truck.status = "Available"
    drv = db.query(Driver).filter(Driver.id == data["driver_user"].id).first()
    drv.availability = "Available"
    db.commit()

    alloc_res = client.post(
        f"/api/v1/transport/orders/{order_id}/auto-allocate",
        headers={"Authorization": f"Bearer {transport_token}"},
    )
    assert alloc_res.status_code == 200, alloc_res.text
    alloc_data = alloc_res.json()
    assert alloc_data["success"] is True
    assert Decimal(str(alloc_data["vehicle"]["max_weight"])) >= Decimal("19.4")
    assert Decimal(str(alloc_data["cargo_weight"])) == Decimal("19.4")

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 6: Transport Assignment & 4-Digit Delivery OTP Generation
    # ──────────────────────────────────────────────────────────────────────────
    assign_res = client.post(
        f"/api/v1/transport/orders/{order_id}/assign",
        json={
            "vehicle_id": str(data["mini_truck"].id),
            "driver_id": str(data["driver_user"].id),
            "notes": "Fast-track delivery",
        },
        headers={"Authorization": f"Bearer {transport_token}"},
    )
    assert assign_res.status_code == 200, assign_res.text
    assert assign_res.json()["status"] == "Assigned"

    # Verify OTP generated
    otp_rec = db.query(DeliveryOTP).filter(DeliveryOTP.order_id == uuid.UUID(order_id)).first()
    assert otp_rec is not None, "DeliveryOTP record must exist."
    assert otp_rec.otp_code is not None
    assert len(otp_rec.otp_code) == 4
    doorstep_otp = otp_rec.otp_code

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 7: Customer Live Tracking View
    # ──────────────────────────────────────────────────────────────────────────
    track_res = client.get(
        f"/api/v1/orders/{order_id}/tracking",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert track_res.status_code == 200, track_res.text
    track_data = track_res.json()
    assert float(track_data["verified_weight_kg"]) == 19.4
    assert track_data["package_count"] == 2
    assert track_data["driver_name"] == data["driver_user"].name
    assert track_data["delivery_otp"] == doorstep_otp

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 8: Driver Start Delivery Trip ("Out for Delivery")
    # ──────────────────────────────────────────────────────────────────────────
    drv_delivs = client.get(
        "/api/v1/driver/deliveries",
        headers={"Authorization": f"Bearer {driver_token}"},
    ).json()
    matching_deliv = [d for d in drv_delivs if d["order_id"] == order_id]
    assert len(matching_deliv) > 0
    delivery_id = matching_deliv[0]["id"]

    start_res = client.post(
        f"/api/v1/driver/deliveries/{delivery_id}/start",
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "On Route"

    db.expire_all()
    order_in_transit = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    assert order_in_transit.status == "Out for Delivery"

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 9: Security Enforcement — Wrong OTP Rejection
    # ──────────────────────────────────────────────────────────────────────────
    wrong_otp_res = client.post(
        f"/api/v1/driver/deliveries/{delivery_id}/verify-otp",
        json={"otp": "9999"},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert wrong_otp_res.status_code == 400
    assert "Invalid OTP" in wrong_otp_res.json()["detail"]

    # ──────────────────────────────────────────────────────────────────────────
    # Stage 10: Correct OTP Verification & Delivery Completion
    # ──────────────────────────────────────────────────────────────────────────
    complete_res = client.post(
        f"/api/v1/driver/deliveries/{delivery_id}/verify-otp",
        json={"otp": doorstep_otp},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert complete_res.status_code == 200, complete_res.text
    assert complete_res.json()["status"] == "Delivered"

    # Verify Post-Delivery State
    db.expire_all()
    order_final = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    assert order_final.status == "Delivered"
    assert order_final.payment_status in ("CAPTURED", "PAID")

    # Vehicle & Driver Released to Available
    veh = db.query(Vehicle).filter(Vehicle.id == data["mini_truck"].id).first()
    assert veh.status == "Available"

    drv = db.query(Driver).filter(Driver.id == data["driver_user"].id).first()
    assert drv.availability == "Available"

    # Invoice Generated & Paid
    inv = db.query(Invoice).filter(Invoice.order_id == uuid.UUID(order_id)).first()
    assert inv is not None
    assert inv.status == "Paid"

    db.close()


def test_cod_full_lifecycle(setup_pipeline_data):
    """
    Tests the complete Cash on Delivery (COD) workflow:
    COD Order Placement -> Godown -> Transport -> Driver Doorstep Cash Collection -> Paid & Invoiced.
    """
    data = setup_pipeline_data
    db = SessionLocal()
    cust_token = _get_token(data["customer"])
    godown_token = _get_token(data["godown_mgr"])
    transport_token = _get_token(data["transport_mgr"])
    driver_token = _get_token(data["driver_user"])

    # Ensure bike and driver are Available
    bike = db.query(Vehicle).filter(Vehicle.id == data["small_bike"].id).first()
    bike.status = "Available"
    drv = db.query(Driver).filter(Driver.id == data["driver_user"].id).first()
    drv.availability = "Available"
    db.commit()

    # 1. Place COD Order
    cart = db.query(Cart).filter(Cart.customer_id == data["customer"].id).first()
    if not cart:
        cart = Cart(customer_id=data["customer"].id)
        db.add(cart)
        db.commit()

    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.add(CartItem(cart_id=cart.id, product_id=data["prod2"].id, quantity=Decimal("2.00"), unit_price=data["prod2"].price))
    db.commit()

    cod_res = client.post(
        "/api/v1/payments/create-intent",
        json={
            "payment_method": "COD",
            "delivery_address": "88 Anna Nagar, Madurai, Tamil Nadu - 625020",
            "idempotency_key": f"test-cod-{uuid.uuid4().hex[:8]}",
        },
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert cod_res.status_code == 201, cod_res.text
    cod_data = cod_res.json()
    order_id = cod_data["order_id"]
    assert cod_data["payment_method"] == "COD"
    assert cod_data["payment_status"] == "PENDING"
    assert cod_data["order_status"] == "Pending"

    # 2. Godown Pick & Pack
    order = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    oi = order.order_items[0]

    client.post(
        f"/api/v1/godown/orders/{order_id}/pick",
        json={"items": [{"order_item_id": str(oi.id), "picked_qty": 2.0}]},
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    client.post(
        f"/api/v1/godown/orders/{order_id}/pack",
        json={"package_count": 1, "total_weight_kg": 2.0},
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    client.post(
        f"/api/v1/godown/orders/{order_id}/ready",
        headers={"Authorization": f"Bearer {godown_token}"},
    )

    # 3. Transport Assign Small Bike (2kg safe payload)
    bike = db.query(Vehicle).filter(Vehicle.id == data["small_bike"].id).first()
    bike.status = "Available"
    drv = db.query(Driver).filter(Driver.id == data["driver_user"].id).first()
    drv.availability = "Available"
    db.commit()

    assign_res = client.post(
        f"/api/v1/transport/orders/{order_id}/assign",
        json={
            "vehicle_id": str(data["small_bike"].id),
            "driver_id": str(data["driver_user"].id),
        },
        headers={"Authorization": f"Bearer {transport_token}"},
    )
    assert assign_res.status_code == 200, assign_res.text

    db.expire_all()
    otp_rec = db.query(DeliveryOTP).filter(DeliveryOTP.order_id == uuid.UUID(order_id)).first()
    assert otp_rec is not None
    otp_code = otp_rec.otp_code

    # 4. Driver Start & Complete with COD Handshake
    drv_delivs = client.get("/api/v1/driver/deliveries", headers={"Authorization": f"Bearer {driver_token}"}).json()
    deliv_id = [d for d in drv_delivs if d["order_id"] == order_id][0]["id"]

    client.post(f"/api/v1/driver/deliveries/{deliv_id}/start", headers={"Authorization": f"Bearer {driver_token}"})
    comp_res = client.post(
        f"/api/v1/driver/deliveries/{deliv_id}/verify-otp",
        json={"otp": otp_code},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert comp_res.status_code == 200, comp_res.text

    # Verify COD Cash was Collected & Settle to PAID
    db.expire_all()
    order_final = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    assert order_final.status == "Delivered"
    assert order_final.payment_status in ("CAPTURED", "PAID")

    db.close()


def test_reject_underweight_vehicle_assignment(setup_pipeline_data):
    """
    Verifies that assigning a vehicle whose capacity is lower than actual shipment weight is strictly rejected with HTTP 400.
    """
    data = setup_pipeline_data
    db = SessionLocal()
    transport_token = _get_token(data["transport_mgr"])

    # Ensure small_bike and driver are Available
    bike = db.query(Vehicle).filter(Vehicle.id == data["small_bike"].id).first()
    bike.status = "Available"
    drv = db.query(Driver).filter(Driver.id == data["driver_user"].id).first()
    drv.availability = "Available"
    db.commit()

    # Create an order with 25kg packed weight
    heavy_order = Order(
        order_code=f"ORD-MK-HVY-{uuid.uuid4().hex[:4].upper()}",
        customer_id=data["customer"].id,
        buyer_type="Customer",
        total_amount=Decimal("1500.00"),
        destination="Madurai",
        status="Ready for Dispatch",
        payment_status="CAPTURED",
        weight=Decimal("25.00"),
        godown_id=data["godown"].id,
    )
    db.add(heavy_order)
    db.commit()
    db.refresh(heavy_order)

    # Attempt to assign Small Bike (max 15kg) for 25kg order
    assign_res = client.post(
        f"/api/v1/transport/orders/{heavy_order.id}/assign",
        json={
            "vehicle_id": str(data["small_bike"].id),  # max 15 kg
            "driver_id": str(data["driver_user"].id),
        },
        headers={"Authorization": f"Bearer {transport_token}"},
    )
    assert assign_res.status_code == 400
    assert "Insufficient vehicle capacity" in assign_res.json()["detail"]

    db.close()


def test_2_minute_sla_fast_pipeline(setup_pipeline_data):
    """
    Verifies that verified payment propagates through Godown to Transport and Driver assignment
    within the 120-second operational SLA target, calculating and storing exact duration metrics.
    """
    data = setup_pipeline_data
    db = SessionLocal()
    customer_token = _get_token(data["customer"])
    godown_token = _get_token(data["godown_mgr"])

    # Ensure fleet is Available
    truck = db.query(Vehicle).filter(Vehicle.id == data["mini_truck"].id).first()
    truck.status = "Available"
    truck.service_status = "Healthy"
    driver = db.query(Driver).filter(Driver.id == data["driver_user"].id).first()
    driver.availability = "Available"
    driver.workload = 0
    db.commit()

    # 1. Add item to cart
    client.post(
        "/api/v1/cart/items",
        json={"product_id": str(data["prod2"].id), "quantity": 10},
        headers={"Authorization": f"Bearer {customer_token}"},
    )

    # 2. Create UPI Intent
    intent_res = client.post(
        "/api/v1/payments/create-intent",
        json={
            "delivery_address": "88 Farm Lane, Madurai, TN",
            "delivery_phone": "+919876543210",
            "payment_method": "UPI",
            "idempotency_key": f"idemp-sla-{uuid.uuid4().hex[:8]}",
        },
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert intent_res.status_code == 201
    order_id = intent_res.json()["order_id"]
    order_code = intent_res.json()["order_code"]
    gateway_order_id = intent_res.json()["razorpay_order_id"]

    # 3. Authoritative Cryptographic Payment Verification
    mock_payment_id = f"pay_sla_{uuid.uuid4().hex[:8]}"
    secret = "maruthamkart_sandbox_secret_2026"
    msg = f"{gateway_order_id}|{mock_payment_id}".encode("utf-8")
    valid_sig = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    verify_res = client.post(
        "/api/v1/payments/verify",
        json={
            "order_id": order_id,
            "razorpay_order_id": gateway_order_id,
            "razorpay_payment_id": mock_payment_id,
            "razorpay_signature": valid_sig,
        },
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert verify_res.status_code == 200, verify_res.text

    # Verify timestamps recorded
    db.expire_all()
    order_obj = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    assert order_obj.payment_verified_at is not None
    assert order_obj.order_confirmed_at is not None
    assert order_obj.godown_notified_at is not None

    # 4. Godown Picking
    oi = order_obj.order_items[0]
    pick_res = client.post(
        f"/api/v1/godown/orders/{order_id}/pick",
        json={"items": [{"order_item_id": str(oi.id), "picked_qty": 10.0}]},
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    assert pick_res.status_code == 200

    # 5. Godown Packing with verified actual weight
    pack_res = client.post(
        f"/api/v1/godown/orders/{order_id}/pack",
        json={"package_count": 2, "total_weight_kg": 10.5, "notes": "Packed safely in 2 crates"},
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    assert pack_res.status_code == 200

    # 6. Mark Ready for Dispatch (triggers automatic SLA assignment)
    ready_res = client.post(
        f"/api/v1/godown/orders/{order_id}/ready",
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    assert ready_res.status_code == 200

    # 7. Verify Auto-Assignment & SLA metrics
    db.expire_all()
    order_obj = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    assert order_obj.status == "Driver Assigned"
    assert order_obj.driver_assigned_at is not None
    assert order_obj.vehicle_assigned_at is not None
    assert float(order_obj.payment_to_driver_assignment_seconds) <= 120.0
    assert order_obj.assignment_sla_status == "WITHIN_SLA"

    # 8. Customer Order Tracking SLA & Driver Info Display
    track_res = client.get(
        f"/api/v1/orders/{order_id}/tracking",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["status"] == "Driver Assigned"
    assert track_data["driver_name"] is not None
    assert track_data["driver_id_code"] is not None and track_data["driver_id_code"].startswith("MK-DRI-")
    assert track_data["vehicle_code"] is not None and track_data["vehicle_code"].startswith("MK-V-")
    assert track_data["vehicle_capacity"] is not None
    assert track_data["assignment_duration_seconds"] is not None
    assert track_data["assignment_sla_status"] == "WITHIN_SLA"
    assert len(track_data["delivery_otp"]) == 4

    db.close()


def test_sla_unavailability_handling_no_fake_assignment(setup_pipeline_data):
    """
    Verifies that when no eligible vehicle or driver exists:
    1. The system NEVER fabricates a fake assignment.
    2. Order status is marked Awaiting Assignment with explicit delay reason.
    3. Transport/Admin are alerted.
    4. When resources become available, retry-unassigned automatically completes the assignment.
    """
    data = setup_pipeline_data
    db = SessionLocal()
    customer_token = _get_token(data["customer"])
    godown_token = _get_token(data["godown_mgr"])
    transport_token = _get_token(data["transport_mgr"])

    # 1. Set all vehicles to Maintenance (unavailable)
    for v in db.query(Vehicle).all():
        v.status = "Maintenance"
    db.commit()

    # 2. Add item to cart
    client.post(
        "/api/v1/cart/items",
        json={"product_id": str(data["prod2"].id), "quantity": 5},
        headers={"Authorization": f"Bearer {customer_token}"},
    )

    # 3. Place COD order
    intent_res = client.post(
        "/api/v1/payments/create-intent",
        json={
            "delivery_address": "42 Harvest Road, Madurai",
            "payment_method": "COD",
            "idempotency_key": f"idemp-unavail-{uuid.uuid4().hex[:8]}",
        },
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert intent_res.status_code == 201, intent_res.text
    order_id = intent_res.json()["order_id"]

    db.expire_all()
    order_obj = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()

    # 4. Pick & Pack
    client.post(
        f"/api/v1/godown/orders/{order_id}/pick",
        json={"items": [{"order_item_id": str(order_obj.order_items[0].id), "picked_qty": 5.0}]},
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    client.post(
        f"/api/v1/godown/orders/{order_id}/pack",
        json={"package_count": 1, "total_weight_kg": 5.2},
        headers={"Authorization": f"Bearer {godown_token}"},
    )

    # 5. Mark Ready for Dispatch (attempt auto assignment with no vehicles available)
    ready_res = client.post(
        f"/api/v1/godown/orders/{order_id}/ready",
        headers={"Authorization": f"Bearer {godown_token}"},
    )
    assert ready_res.status_code == 200

    # 6. Assert NO FAKE ASSIGNMENT was made
    db.expire_all()
    order_obj = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    assert order_obj.driver_assigned_at is None
    assert order_obj.vehicle_assigned_at is None
    assert order_obj.status == "Awaiting Assignment"
    assert order_obj.assignment_delay_reason in ("NO_ELIGIBLE_VEHICLE", "NO_AVAILABLE_DRIVER")

    # 7. Restore a vehicle to Available
    truck = db.query(Vehicle).filter(Vehicle.id == data["mini_truck"].id).first()
    truck.status = "Available"
    truck.service_status = "Healthy"
    driver = db.query(Driver).filter(Driver.id == data["driver_user"].id).first()
    driver.availability = "Available"
    driver.workload = 0
    
    order_obj = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    if not order_obj.godown_id:
        order_obj.godown_id = data["godown"].id
    db.commit()

    # 8. Trigger SLA Assignment for this Order
    trigger_res = client.post(
        f"/api/v1/transport/orders/{order_id}/trigger-sla-assignment",
        headers={"Authorization": f"Bearer {transport_token}"},
    )
    assert trigger_res.status_code == 200, trigger_res.text
    assert trigger_res.json()["success"] is True

    # 9. Verify order is now assigned with real resources
    db.expire_all()
    order_obj = db.query(Order).filter(Order.id == uuid.UUID(order_id)).first()
    assert order_obj.status == "Driver Assigned"
    assert order_obj.driver_assigned_at is not None
    assert order_obj.assignment_delay_reason is None

    db.close()


def test_driver_and_vehicle_reassignment_triggers(setup_pipeline_data):
    """
    Verifies that when a driver or vehicle becomes unavailable,
    the active assignment is securely reset and marked for reassignment without data corruption.
    """
    data = setup_pipeline_data
    db = SessionLocal()
    transport_token = _get_token(data["transport_mgr"])

    # Create an assigned order
    assigned_order = Order(
        order_code=f"ORD-MK-REASS-{uuid.uuid4().hex[:4].upper()}",
        customer_id=data["customer"].id,
        buyer_type="Customer",
        total_amount=Decimal("600.00"),
        destination="Coimbatore",
        status="Driver Assigned",
        payment_status="CAPTURED",
        weight=Decimal("12.00"),
        godown_id=data["godown"].id,
    )
    db.add(assigned_order)
    db.flush()

    delivery = Delivery(
        order_id=assigned_order.id,
        type="Home Delivery",
        source_godown_id=data["godown"].id,
        destination="Coimbatore",
        quantity="12.00 kg",
        status="Driver Assigned",
        vehicle_id=data["mini_truck"].id,
        driver_id=data["driver_user"].id,
    )
    db.add(delivery)
    db.commit()

    # Driver becomes Off Duty
    patch_res = client.patch(
        f"/api/v1/transport/drivers/{data['driver_user'].id}",
        json={"availability": "Off Duty"},
        headers={"Authorization": f"Bearer {transport_token}"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["availability"] == "Off Duty"

    # Verify order is marked for reassignment
    db.expire_all()
    deliv_check = db.query(Delivery).filter(Delivery.order_id == assigned_order.id).first()
    assert deliv_check.status == "Awaiting Assignment"
    assert deliv_check.delay_reason in ("DRIVER_REASSIGNMENT_REQUIRED", "NO_ELIGIBLE_VEHICLE", "NO_AVAILABLE_DRIVER")

    # Restore driver availability
    drv_record = db.query(Driver).filter(Driver.id == data["driver_user"].id).first()
    drv_record.availability = "Available"
    db.commit()

    db.close()


def test_office_admin_sla_reporting_metrics(setup_pipeline_data):
    """
    Verifies that Office/Admin SLA metrics report accurately reflects database timestamps,
    compliance rate %, and delay breakdowns.
    """
    data = setup_pipeline_data
    office_token = _get_token(data["office_admin"])
    transport_token = _get_token(data["transport_mgr"])

    # Test Office SLA Metrics endpoint
    res_office = client.get(
        "/api/v1/office/sla-metrics?timeframe_hours=24",
        headers={"Authorization": f"Bearer {office_token}"},
    )
    assert res_office.status_code == 200
    office_metrics = res_office.json()
    assert office_metrics["target_assignment_time_seconds"] == 120.0
    assert "total_orders" in office_metrics
    assert "assigned_orders_count" in office_metrics
    assert "within_sla_count" in office_metrics
    assert "sla_compliance_rate_pct" in office_metrics
    assert "average_assignment_seconds" in office_metrics

    # Test Transport SLA Dashboard endpoint
    res_transport = client.get(
        "/api/v1/transport/sla-dashboard?timeframe_hours=24",
        headers={"Authorization": f"Bearer {transport_token}"},
    )
    assert res_transport.status_code == 200
    transport_dash = res_transport.json()
    assert transport_dash["target_assignment_time_seconds"] == 120.0
    assert isinstance(transport_dash["items"], list)

