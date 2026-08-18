import hmac
import hashlib
import uuid
import random
from decimal import Decimal
from unittest.mock import patch, MagicMock
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.database.connection import SessionLocal
from app.models.models import (
    Cart,
    CartItem,
    Customer,
    CustomerAddress,
    Godown,
    Order,
    OrderItem,
    Payment,
    Product,
    User,
    Farmer,
)
from app.core.config import settings
from app.core.security import create_access_token, get_password_hash

client = TestClient(app)


class TestPaymentSystem:
    @classmethod
    def setup_class(cls):
        cls.db = SessionLocal()

        # 1. Setup Test Godown
        cls.godown = cls.db.query(Godown).first()
        if not cls.godown:
            cls.godown = Godown(
                godown_code=f"GD-TEST-{uuid.uuid4().hex[:4]}",
                name="Central Coimbatore Warehouse",
                location="Coimbatore, Tamil Nadu",
                total_capacity=10000.0,
            )
            cls.db.add(cls.godown)
            cls.db.commit()

        # 2. Setup Test Farmer & Product
        cls.farmer_user = cls.db.query(User).filter(User.role == "FARMER").first()
        if not cls.farmer_user:
            cls.farmer_user = User(
                name="Test Organic Farmer",
                phone="+919870001122",
                password_hash=get_password_hash("FarmerPass123!"),
                role="FARMER",
                status="Active",
            )
            cls.db.add(cls.farmer_user)
            cls.db.flush()
            cls.farmer_profile = Farmer(id=cls.farmer_user.id, farmer_code=f"FRM-{uuid.uuid4().hex[:4]}")
            cls.db.add(cls.farmer_profile)
            cls.db.commit()
        else:
            cls.farmer_profile = cls.farmer_user.farmer_profile

        cls.product = cls.db.query(Product).filter(Product.status == "Active", Product.available_qty > 10).first()
        if not cls.product:
            cls.product = Product(
                name="Farm Fresh Organic Tomato",
                category="Vegetables",
                price=Decimal("45.00"),
                unit="kg",
                available_qty=100.0,
                status="Active",
                farmer_id=cls.farmer_profile.id,
            )
            cls.db.add(cls.product)
            cls.db.commit()

        # 3. Setup Test Customer
        cust_phone = f"+9198{random.randint(10000000, 99999999)}"
        cls.customer_user = User(
            name="Ranjith Payment Tester",
            phone=cust_phone,
            email=f"tester_{uuid.uuid4().hex[:6]}@example.com",
            password_hash=get_password_hash("CustPass123!"),
            role="CUSTOMER",
            status="Active",
        )
        cls.db.add(cls.customer_user)
        cls.db.flush()
        cls.customer_profile = Customer(id=cls.customer_user.id, customer_code=f"CUST-{uuid.uuid4().hex[:4]}")
        cls.db.add(cls.customer_profile)

        # Address
        cls.address = CustomerAddress(
            customer_id=cls.customer_user.id,
            recipient_name="Ranjith",
            phone=cust_phone,
            door_no="4B",
            street_address="Gandhipuram Cross Street",
            area="Gandhipuram",
            city="Coimbatore",
            state="Tamil Nadu",
            postal_code="641012",
            is_default=True,
        )
        cls.db.add(cls.address)
        cls.db.commit()

        cls.auth_token = create_access_token(str(cls.customer_user.id))
        cls.headers = {"Authorization": f"Bearer {cls.auth_token}"}

    @classmethod
    def teardown_class(cls):
        cls.db.close()

    def _setup_cart_with_items(self):
        """Helper to ensure the test customer has items in their cart."""
        cart = self.db.query(Cart).filter(Cart.customer_id == self.customer_user.id).first()
        if not cart:
            cart = Cart(customer_id=self.customer_user.id)
            self.db.add(cart)
            self.db.flush()

        # Clear existing
        for itm in list(cart.items):
            self.db.delete(itm)
        self.db.commit()

        # Add 2 kg of test product (2 * 45 = 90)
        item = CartItem(
            cart_id=cart.id,
            product_id=self.product.id,
            quantity=Decimal("2.0"),
            unit_price=self.product.price,
        )
        self.db.add(item)
        self.db.commit()

    def test_payment_diagnostic_endpoint(self):
        """Tests that the diagnostic endpoint reports gateway info without leaking secrets."""
        res = client.get("/api/v1/payments/diagnostic")
        assert res.status_code == 200
        data = res.json()
        assert data["primary_gateway"] == "razorpay"
        assert "gateway_configured" in data
        assert "supported_methods" in data
        assert len(data["supported_methods"]) >= 3
        # Assert no secrets in output
        assert "key_secret" not in data
        assert "webhook_secret" not in data

    def test_cod_order_creation_and_fulfillment_queue(self):
        """Tests Cash on Delivery flow: creates order with PENDING payment, deducts stock, clears cart."""
        self._setup_cart_with_items()
        stock_before = float(self.product.available_qty)

        res = client.post(
            "/api/v1/payments/create-intent",
            headers=self.headers,
            json={
                "delivery_address": "4B, Gandhipuram, Coimbatore - 641012",
                "delivery_phone": "+919876543210",
                "payment_method": "COD",
                "notes": "Deliver evening",
            },
        )
        assert res.status_code == 201
        data = res.json()
        assert data["payment_method"] == "COD"
        assert data["payment_status"] == "PENDING"
        expected_total = (Decimal("2.0") * Decimal(str(self.product.price))) + Decimal("40.00")
        assert Decimal(str(data["total_amount"])) == expected_total

        # Verify stock was deducted by 2.0
        self.db.refresh(self.product)
        assert float(self.product.available_qty) == stock_before - 2.0

        # Verify Cart is now empty
        cart = self.db.query(Cart).filter(Cart.customer_id == self.customer_user.id).first()
        assert len(cart.items) == 0

    def test_driver_cod_cash_collection_recording(self):
        """Tests staff recording COD cash collection upon delivery."""
        # Create an order
        order = Order(
            order_code=f"ORD-MK-{random.randint(1000, 9999)}",
            customer_id=self.customer_user.id,
            buyer_type="Customer",
            total_amount=Decimal("130.00"),
            destination="Coimbatore",
            status="Delivered",
            payment_method="COD",
            payment_status="PENDING",
        )
        self.db.add(order)
        self.db.commit()

        # Staff user (Admin)
        admin_user = self.db.query(User).filter(User.role == "ADMIN").first()
        if not admin_user:
            admin_user = User(
                name="System Admin",
                phone="+919800112233",
                password_hash=get_password_hash("AdminPass123!"),
                role="ADMIN",
                status="Active",
            )
            self.db.add(admin_user)
            self.db.commit()

        admin_token = create_access_token(str(admin_user.id))
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        res = client.post(
            "/api/v1/payments/cod/collect",
            headers=admin_headers,
            json={"order_id": str(order.id), "collected_amount": 130.00, "notes": "Cash collected"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["payment_status"] == "COLLECTED"
        assert Decimal(str(data["collected_amount"])) == Decimal("130.00")

    @patch("app.api.routes.payments.create_gateway_order")
    def test_upi_payment_intent_and_signature_verification(self, mock_create_gw_order):
        """Tests complete online UPI payment lifecycle: Intent -> Razorpay Order -> HMAC verification -> Capture."""
        from app.core.payment import GatewayOrderResult
        mock_create_gw_order.return_value = GatewayOrderResult(
            success=True,
            gateway="razorpay",
            gateway_order_id="order_rzp_mock_12345",
            amount_paise=13000,
            currency="INR",
            key_id="rzp_test_mock_key",
        )

        self._setup_cart_with_items()

        # 1. Create UPI Payment Intent
        res_intent = client.post(
            "/api/v1/payments/create-intent",
            headers=self.headers,
            json={
                "delivery_address": "4B, Gandhipuram, Coimbatore",
                "payment_method": "UPI",
            },
        )
        assert res_intent.status_code == 201
        intent_data = res_intent.json()
        assert intent_data["payment_method"] == "UPI"
        assert intent_data["payment_status"] == "CREATED"
        assert intent_data["order_status"] == "Payment Pending"
        assert intent_data["razorpay_order_id"] == "order_rzp_mock_12345"

        order_id = intent_data["order_id"]

        # 2. Test Invalid Signature Rejection (prevent fake frontend success)
        res_fake = client.post(
            "/api/v1/payments/verify",
            headers=self.headers,
            json={
                "order_id": order_id,
                "razorpay_order_id": "order_rzp_mock_12345",
                "razorpay_payment_id": "pay_fake_99999",
                "razorpay_signature": "fake_invalid_hmac_signature_xyz",
            },
        )
        assert res_fake.status_code == 400
        assert "Invalid cryptographic signature" in res_fake.json()["detail"]

        # 3. Test Valid Signature Verification
        test_secret = "test_razorpay_secret_key_123"
        original_secret = settings.RAZORPAY_KEY_SECRET
        settings.RAZORPAY_KEY_SECRET = test_secret

        try:
            rzp_order_id = "order_rzp_mock_12345"
            rzp_payment_id = "pay_valid_887766"
            msg = f"{rzp_order_id}|{rzp_payment_id}".encode("utf-8")
            valid_sig = hmac.new(test_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

            res_verify = client.post(
                "/api/v1/payments/verify",
                headers=self.headers,
                json={
                    "order_id": order_id,
                    "razorpay_order_id": rzp_order_id,
                    "razorpay_payment_id": rzp_payment_id,
                    "razorpay_signature": valid_sig,
                },
            )
            assert res_verify.status_code == 200
            verify_data = res_verify.json()
            assert verify_data["payment_status"] == "CAPTURED"
            assert verify_data["order_status"] == "Pending"  # Now in Godown queue
            assert verify_data["transaction_id"] == rzp_payment_id

            # Verify Receipt Endpoint
            res_receipt = client.get(f"/api/v1/payments/{order_id}/receipt", headers=self.headers)
            assert res_receipt.status_code == 200
            receipt = res_receipt.json()
            assert receipt["payment_status"] == "CAPTURED"
            assert receipt["transaction_id"] == rzp_payment_id

        finally:
            settings.RAZORPAY_KEY_SECRET = original_secret

    def test_idempotency_duplicate_order_protection(self):
        """Tests that multiple rapid clicks with the same idempotency key return the same order."""
        self._setup_cart_with_items()
        idempotency_token = f"test_idemp_{uuid.uuid4().hex}"

        res1 = client.post(
            "/api/v1/payments/create-intent",
            headers=self.headers,
            json={
                "delivery_address": "4B, Gandhipuram",
                "payment_method": "COD",
                "idempotency_key": idempotency_token,
            },
        )
        assert res1.status_code == 201
        order_id_1 = res1.json()["order_id"]

        # Duplicate tap with same idempotency token
        res2 = client.post(
            "/api/v1/payments/create-intent",
            headers=self.headers,
            json={
                "delivery_address": "4B, Gandhipuram",
                "payment_method": "COD",
                "idempotency_key": idempotency_token,
            },
        )
        assert res2.status_code == 200 or res2.status_code == 201
        order_id_2 = res2.json()["order_id"]

        # Assert no duplicate order was created
        assert order_id_1 == order_id_2
