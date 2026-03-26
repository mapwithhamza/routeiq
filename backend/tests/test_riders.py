"""
tests/test_riders.py — Rider endpoint tests.
Tests: list, create, update, auth-guard.
"""
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

# ── Helper: register + login ──────────────────────────────────────────────────
async def authed_client(client: AsyncClient) -> AsyncClient:
    import uuid
    email = f"disp_{uuid.uuid4().hex[:8]}@routeiq-test.dev"
    await client.post("/auth/register", json={"email": email, "password": "Pass123!"})
    await client.post("/auth/login", json={"email": email, "password": "Pass123!"})
    return client


RIDER_PAYLOAD = {
    "name": "Ali Khan",
    "phone": "+92-300-1234567",
    "vehicle_type": "bike",
    "current_lat": 33.72,
    "current_lon": 73.04,
}


# ── 1. Unauthenticated list is rejected ───────────────────────────────────────
async def test_list_riders_unauth(client: AsyncClient):
    resp = await client.get("/riders")
    assert resp.status_code == 401, resp.text


# ── 2. Create rider ───────────────────────────────────────────────────────────
async def test_create_rider(client: AsyncClient):
    await authed_client(client)
    resp = await client.post("/riders", json=RIDER_PAYLOAD)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "Ali Khan"
    assert body["vehicle_type"] == "bike"
    assert body["status"] == "available"
    assert "id" in body


# ── 3. List riders ────────────────────────────────────────────────────────────
async def test_list_riders(client: AsyncClient):
    await authed_client(client)
    await client.post("/riders", json=RIDER_PAYLOAD)
    resp = await client.get("/riders")
    assert resp.status_code == 200, resp.text
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


# ── 4. Update rider ───────────────────────────────────────────────────────────
async def test_update_rider(client: AsyncClient):
    await authed_client(client)
    create = await client.post("/riders", json=RIDER_PAYLOAD)
    assert create.status_code == 201, create.text
    rider_id = create.json()["id"]

    resp = await client.put(
        f"/riders/{rider_id}",
        json={"status": "on_route", "vehicle_type": "car"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "on_route"
    assert body["vehicle_type"] == "car"
    assert body["id"] == rider_id


# ── 5. Update non-existent rider ─────────────────────────────────────────────
async def test_update_rider_not_found(client: AsyncClient):
    await authed_client(client)
    resp = await client.put("/riders/999999", json={"status": "offline"})
    assert resp.status_code == 404, resp.text


# ── 6. Analytics summary accessible ──────────────────────────────────────────
async def test_analytics_summary(client: AsyncClient):
    await authed_client(client)
    resp = await client.get("/analytics/summary")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "deliveries" in body
    assert "riders" in body
    assert "total" in body["deliveries"]
    assert "by_status" in body["deliveries"]


# ── 7. Analytics algorithms accessible ───────────────────────────────────────
async def test_analytics_algorithms(client: AsyncClient):
    await authed_client(client)
    resp = await client.get("/analytics/algorithms")
    assert resp.status_code == 200, resp.text
    assert isinstance(resp.json(), list)
