import uuid
from app.main import app
from starlette.testclient import TestClient

def main():
    client = TestClient(app)
    print("=== MARUTHAM KART CUSTOMER ANDROID APP VERIFICATION ===")

    # 1. Health check
    res = client.get("/api/v1/health")
    print("1. Health Check:", res.status_code, res.json())
    assert res.status_code == 200

    # 2. Customer Registration
    unique_suffix = str(uuid.uuid4())[:6]
    phone = f"+9198{unique_suffix}10"
    email = f"customer_{unique_suffix}@maruthamkart.com"

    reg_payload = {
        "name": "Test Android Customer",
        "phone": phone,
        "email": email,
        "password": "SecurePassword123!",
    }
    res = client.post("/api/v1/auth/register/customer", json=reg_payload)
    print("2. Customer Registration:", res.status_code)
    assert res.status_code in [200, 201]

    # 3. Customer Login
    login_payload = {
        "identifier": phone,
        "password": "SecurePassword123!"
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    print("3. Customer Login:", res.status_code)
    assert res.status_code == 200
    login_data = res.json()
    token = login_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    user_role = login_data["user"]["role"]
    print(f"   Authenticated User: {login_data['user']['name']} (Role: {user_role})")
    assert user_role == "CUSTOMER"

    # 4. Catalog Browsing & Search
    res = client.get("/api/v1/products?limit=10", headers=headers)
    print("4. Product Catalog Listing:", res.status_code, f"Items returned: {len(res.json()['items'])}")
    assert res.status_code == 200
    products = res.json()["items"]
    assert len(products) > 0
    first_prod = products[0]

    # 5. Product Detail
    prod_id = first_prod["id"]
    res = client.get(f"/api/v1/products/{prod_id}", headers=headers)
    print(f"5. Product Detail ({first_prod['name']}):", res.status_code, f"Price: INR {res.json()['price']}/{res.json().get('unit', 'Kg')}")
    assert res.status_code == 200

    # 6. Cart Management
    cart_item_payload = {
        "product_id": prod_id,
        "quantity": 3
    }
    res = client.post("/api/v1/cart/items", json=cart_item_payload, headers=headers)
    print("6. Add Product to Cart:", res.status_code, f"Cart Items: {res.json()['item_count']}")
    assert res.status_code in [200, 201]

    res = client.get("/api/v1/cart", headers=headers)
    print(f"   Get Cart Total: INR {res.json()['total']} (Subtotal: INR {res.json()['subtotal']})")
    assert res.status_code == 200

    # 7. Checkout & Order Placement
    order_payload = {
        "delivery_address": "77 Agro Tech Hub, Coimbatore, Tamil Nadu",
        "delivery_phone": phone,
        "payment_method": "Cash on Delivery",
        "notes": "Order placed via Customer Android App"
    }
    res = client.post("/api/v1/orders", json=order_payload, headers=headers)
    print("7. Order Placement:", res.status_code)
    assert res.status_code in [200, 201]
    order_data = res.json()
    order_id = order_data["id"]
    print(f"   Created Order ID: #{order_id[:8].upper()} (Total: INR {order_data['total_amount']})")

    # 8. Order Tracking & Order History
    res = client.get(f"/api/v1/orders/{order_id}", headers=headers)
    print(f"8. Order Status Tracking:", res.status_code, f"Current Status: {res.json()['status']}")
    assert res.status_code == 200

    res = client.get("/api/v1/orders", headers=headers)
    print(f"   Customer Order History:", res.status_code, f"Total Orders: {len(res.json()['items'])}")
    assert len(res.json()["items"]) >= 1

    # 9. Profile & Notifications
    res = client.get("/api/v1/auth/me", headers=headers)
    print("9. Customer Profile:", res.status_code, res.json()["name"])
    assert res.status_code == 200

    res = client.get("/api/v1/notifications", headers=headers)
    print(f"   Customer Notifications:", res.status_code, f"Count: {len(res.json().get('items', []))}")
    assert res.status_code == 200

    # 10. Security & Role Restriction Verification
    # Ensure Customer cannot access Godown, Transport, Driver, Admin endpoints
    godown_check = client.get("/api/v1/godown/dashboard", headers=headers)
    print("10. Security Isolation - Access Godown Portal with Customer JWT:", godown_check.status_code)
    assert godown_check.status_code in [401, 403]

    transport_check = client.get("/api/v1/transport/dashboard", headers=headers)
    print("    Security Isolation - Access Transport Portal with Customer JWT:", transport_check.status_code)
    assert transport_check.status_code in [401, 403]

    driver_check = client.get("/api/v1/driver/dashboard", headers=headers)
    print("    Security Isolation - Access Driver Companion with Customer JWT:", driver_check.status_code)
    assert driver_check.status_code in [401, 403]

    admin_check = client.get("/api/v1/office/dashboard", headers=headers)
    print("    Security Isolation - Access Office Portal with Customer JWT:", admin_check.status_code)
    assert admin_check.status_code in [401, 403]

    print("=== ALL 10 CUSTOMER APP WORKFLOW & SECURITY VERIFICATIONS PASSED ===")

if __name__ == "__main__":
    main()
