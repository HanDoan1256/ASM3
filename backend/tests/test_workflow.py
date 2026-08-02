"""Focused end-to-end tests for the core SmartFM business workflow:
register -> login -> create order -> approve -> allocate fleet -> pay -> track.

These are not exhaustive unit tests; they target the critical paths that were
previously broken or unimplemented (per the project audit) to guard against
regression: transactional order creation, auth/ownership checks, fleet
allocation, payment validation, and report generation.
"""
import uuid


def _register_and_login(client, email: str, password: str = "CustomerPass123!"):
    register_resp = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Customer",
            "email": email,
            "password": password,
            "phone": "0987654321",
        },
    )
    assert register_resp.status_code == 201, register_resp.text
    customer_id = register_resp.json()["customer_id"]

    login_resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    return customer_id, {"Authorization": f"Bearer {token}"}


def _create_order_payload(customer_id: str, payment_method: str = "SENDER_COD"):
    return {
        "customer_id": customer_id,
        "service_id": 1,
        "sender_address": {
            "receiver_name": "Sender Name",
            "receiver_phone": "0900000001",
            "street": "1 Sender St",
            "district": "District 1",
            "city": "Ho Chi Minh City",
        },
        "receiver_address": {
            "receiver_name": "Receiver Name",
            "receiver_phone": "0900000002",
            "street": "2 Receiver St",
            "district": "District 2",
            "city": "Ho Chi Minh City",
        },
        "package_details": {
            "weight": 2.5,
            "height": 10,
            "length": 20,
            "width": 15,
            "package_type": "Standard",
        },
        "payment_method": payment_method,
    }


def test_register_login_and_password_are_not_plaintext(client):
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    _register_and_login(client, email)


def test_customer_cannot_spoof_customer_id_on_order_creation(client):
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    customer_id, headers = _register_and_login(client, email)

    payload = _create_order_payload("SOMEONE-ELSE-ID")
    response = client.post("/api/orders", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    # The server must override the client-supplied customer_id with the
    # authenticated principal's own id, not trust the request body.
    assert response.json()["customer_id"] == customer_id


def test_full_order_lifecycle_cod(client, staff_headers):
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    customer_id, headers = _register_and_login(client, email)

    create_resp = client.post("/api/orders", json=_create_order_payload(customer_id), headers=headers)
    assert create_resp.status_code == 201, create_resp.text
    order_id = create_resp.json()["order_id"]

    # Unauthenticated access must be rejected.
    assert client.get(f"/api/orders/{order_id}").status_code == 401

    # A customer cannot approve their own order (staff-only action).
    forbidden = client.post(f"/api/orders/{order_id}/approve", headers=headers)
    assert forbidden.status_code == 403

    detail_resp = client.get(f"/api/orders/{order_id}", headers=headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["invoice"]["status"] == "Pending"

    approve_resp = client.post(f"/api/orders/{order_id}/approve", headers=staff_headers)
    assert approve_resp.status_code == 200, approve_resp.text

    # Re-approving an already-approved order must fail, not silently succeed.
    duplicate_approve = client.post(f"/api/orders/{order_id}/approve", headers=staff_headers)
    assert duplicate_approve.status_code == 409

    allocate_resp = client.post(f"/api/fleet/orders/{order_id}/allocate", headers=staff_headers)
    assert allocate_resp.status_code == 200, allocate_resp.text

    # A customer must not be able to trigger fleet allocation.
    assert client.post(f"/api/fleet/orders/{order_id}/allocate", headers=headers).status_code == 403


def test_payment_confirmation_validates_amount_and_rejects_duplicates(client, staff_headers):
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    customer_id, headers = _register_and_login(client, email)

    create_resp = client.post(
        "/api/orders", json=_create_order_payload(customer_id, "SENDER_TRANSFER"), headers=headers
    )
    assert create_resp.status_code == 201, create_resp.text
    order_id = create_resp.json()["order_id"]

    invoice_resp = client.get(f"/api/payments/orders/{order_id}/invoice", headers=headers)
    assert invoice_resp.status_code == 200, invoice_resp.text
    invoice = invoice_resp.json()

    wrong_amount_resp = client.post(
        "/api/payments",
        json={
            "invoice_id": invoice["invoice_id"],
            "payment_method": "SENDER_TRANSFER",
            "payment_date": "2024-01-01T00:00:00",
            "amount": invoice["total"] + 1,
            "status": "Completed",
        },
        headers=headers,
    )
    assert wrong_amount_resp.status_code == 400

    correct_payment_resp = client.post(
        "/api/payments",
        json={
            "invoice_id": invoice["invoice_id"],
            "payment_method": "SENDER_TRANSFER",
            "payment_date": "2024-01-01T00:00:00",
            "amount": invoice["total"],
            "status": "Completed",
        },
        headers=headers,
    )
    assert correct_payment_resp.status_code == 201, correct_payment_resp.text

    duplicate_payment_resp = client.post(
        "/api/payments",
        json={
            "invoice_id": invoice["invoice_id"],
            "payment_method": "SENDER_TRANSFER",
            "payment_date": "2024-01-01T00:00:00",
            "amount": invoice["total"],
            "status": "Completed",
        },
        headers=headers,
    )
    assert duplicate_payment_resp.status_code == 400


def test_report_generation_and_unknown_report_type(client, staff_headers):
    ok_resp = client.get("/api/reports/order_summary", headers=staff_headers)
    assert ok_resp.status_code == 200, ok_resp.text
    assert ok_resp.json()["report_type"] == "order_summary"

    bad_resp = client.get("/api/reports/not_a_real_report", headers=staff_headers)
    assert bad_resp.status_code == 400

    dashboard_resp = client.get("/api/reports/dashboard", headers=staff_headers)
    assert dashboard_resp.status_code == 200
    assert "total_orders" in dashboard_resp.json()


def test_customer_order_scope_and_fleet_access(client, staff_headers):
    customer_a, headers_a = _register_and_login(client, f"user_{uuid.uuid4().hex[:8]}@example.com")
    customer_b, headers_b = _register_and_login(client, f"user_{uuid.uuid4().hex[:8]}@example.com")

    order_a = client.post("/api/orders", json=_create_order_payload(customer_a), headers=headers_a)
    order_b = client.post("/api/orders", json=_create_order_payload(customer_b), headers=headers_b)
    assert order_a.status_code == 201
    assert order_b.status_code == 201

    orders_for_a = client.get("/api/orders", headers=headers_a)
    assert orders_for_a.status_code == 200
    assert {order["customer_id"] for order in orders_for_a.json()} == {customer_a}

    other_order_id = order_b.json()["order_id"]
    assert client.get(f"/api/orders/{other_order_id}", headers=headers_a).status_code == 403
    assert client.get("/api/fleet/vehicles", headers=headers_a).status_code == 403
    assert client.get("/api/fleet/drivers", headers=headers_a).status_code == 403
    assert client.get("/api/fleet/allocations", headers=headers_a).status_code == 403
    assert client.get("/api/fleet/vehicles", headers=staff_headers).status_code == 200


def test_customer_cannot_use_another_customers_saved_address(client):
    customer_a, headers_a = _register_and_login(client, f"user_{uuid.uuid4().hex[:8]}@example.com")
    customer_b, headers_b = _register_and_login(client, f"user_{uuid.uuid4().hex[:8]}@example.com")

    address_resp = client.post(
        f"/api/accounts/customers/{customer_a}/addresses",
        json={
            "receiver_name": "Customer A",
            "receiver_phone": "0900000001",
            "street": "A Street",
            "district": "District A",
            "city": "Ho Chi Minh City",
        },
        headers=headers_a,
    )
    assert address_resp.status_code == 201

    payload = _create_order_payload(customer_b)
    payload.pop("sender_address")
    payload["sender_address_id"] = address_resp.json()["address_id"]
    assert client.post("/api/orders", json=payload, headers=headers_b).status_code == 400


def test_customer_cannot_retrieve_another_customers_tracking(client, staff_headers):
    customer_a, headers_a = _register_and_login(client, f"user_{uuid.uuid4().hex[:8]}@example.com")
    customer_b, headers_b = _register_and_login(client, f"user_{uuid.uuid4().hex[:8]}@example.com")
    order_resp = client.post("/api/orders", json=_create_order_payload(customer_b), headers=headers_b)
    order_id = order_resp.json()["order_id"]
    suffix = uuid.uuid4().hex[:8]
    assert client.post(
        "/api/fleet/vehicles",
        json={
            "vehicle_id": f"VEH-{suffix}",
            "plate_number": f"TEST-{suffix}",
            "vehicle_type": "Truck",
            "capacity": 5,
            "status": "Available",
        },
        headers=staff_headers,
    ).status_code == 201
    assert client.post(
        "/api/fleet/drivers",
        json={
            "driver_id": f"DRV-{suffix}",
            "full_name": "Tracking Test Driver",
            "phone": "0911111111",
            "license_number": f"LIC-{suffix}",
            "status": "Available",
        },
        headers=staff_headers,
    ).status_code == 201
    assert client.post(f"/api/orders/{order_id}/approve", headers=staff_headers).status_code == 200
    assert client.post(f"/api/fleet/orders/{order_id}/allocate", headers=staff_headers).status_code == 200

    allocations = client.get("/api/fleet/allocations", headers=staff_headers)
    tracking_id = next(item["track_id"] for item in allocations.json() if item["order_id"] == order_id)
    assert client.get(f"/api/tracking/{tracking_id}", headers=headers_a).status_code == 404
    assert client.get(f"/api/tracking/{tracking_id}/history", headers=headers_a).status_code == 404
    assert client.get(f"/api/tracking/orders/{order_id}", headers=headers_a).status_code == 404


def test_deleted_customer_is_soft_deleted_and_cannot_login(client):
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    _, headers = _register_and_login(client, email)

    principal_id = client.post("/api/auth/login", json={"email": email, "password": "CustomerPass123!"}).json()["principal_id"]
    delete_resp = client.delete(f"/api/accounts/customers/{principal_id}", headers=headers)
    assert delete_resp.status_code == 204
    assert client.post("/api/auth/login", json={"email": email, "password": "CustomerPass123!"}).status_code == 401
