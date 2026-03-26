"""
tests/test_deliveries.py — Delivery endpoint tests.
Tests: list, create, update, delete, auth-guard.
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

# ── Helper: register + login, return authed client ────────────────────────────
async def authed_client(client: AsyncClient) -> AsyncClient:
    """Register a dispatcher and log in; mutates client's cookie jar."""
    import uuid
    email = f"disp_{uuid.uuid4().hex[:8]}@routeiq-test.dev"
    await client.post("/auth/register", json={"email": email, "password": "Pass123!"})
    await client.post("/auth/login", json={"email": email, "password": "Pass123!"})
    return client


DELIVERY_PAYLOAD = {
    "title": "Test Package",
    "address": "123 Main St",
    "lat": 33.72,
    "lon": 73.04,
    "priority": "high",
}


# ── 1. Unauthenticated list is rejected ───────────────────────────────────────
async def test_list_deliveries_unauth(client: AsyncClient):
    resp = await client.get("/deliveries")
    assert resp.status_code == 401, resp.text


# ── 2. Create delivery ────────────────────────────────────────────────────────
async def test_create_delivery(client: AsyncClient):
    await authed_client(client)
    resp = await client.post("/deliveries", json=DELIVERY_PAYLOAD)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["title"] == "Test Package"
    assert body["status"] == "pending"
    assert body["priority"] == "high"
    assert "id" in body


# ── 3. List deliveries ────────────────────────────────────────────────────────
async def test_list_deliveries(client: AsyncClient):
    await authed_client(client)
    await client.post("/deliveries", json=DELIVERY_PAYLOAD)
    resp = await client.get("/deliveries")
    assert resp.status_code == 200, resp.text
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


# ── 4. Update delivery ────────────────────────────────────────────────────────
async def test_update_delivery(client: AsyncClient):
    await authed_client(client)
    create = await client.post("/deliveries", json=DELIVERY_PAYLOAD)
    assert create.status_code == 201, create.text
    delivery_id = create.json()["id"]

    resp = await client.put(
        f"/deliveries/{delivery_id}",
        json={"status": "assigned", "priority": "low"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "assigned"
    assert body["priority"] == "low"
    assert body["id"] == delivery_id


# ── 5. Update non-existent delivery ──────────────────────────────────────────
async def test_update_delivery_not_found(client: AsyncClient):
    await authed_client(client)
    resp = await client.put("/deliveries/999999", json={"priority": "low"})
    assert resp.status_code == 404, resp.text


# ── 6. Delete delivery ────────────────────────────────────────────────────────
async def test_delete_delivery(client: AsyncClient):
    await authed_client(client)
    create = await client.post("/deliveries", json=DELIVERY_PAYLOAD)
    assert create.status_code == 201, create.text
    delivery_id = create.json()["id"]

    resp = await client.delete(f"/deliveries/{delivery_id}")
    assert resp.status_code == 204, resp.text


# ── 7. Delete non-existent delivery ──────────────────────────────────────────
async def test_delete_delivery_not_found(client: AsyncClient):
    await authed_client(client)
    resp = await client.delete("/deliveries/999999")
    assert resp.status_code == 404, resp.text
