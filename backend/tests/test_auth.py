"""
tests/test_auth.py — Auth endpoint tests.
All tests use unique email addresses (uuid suffix) so the real Neon DB
doesn't accumulate conflicts across runs.

NOTE: httpx ASGITransport blocks httpOnly cookies from .cookies dict,
so we extract the access_token directly from the Set-Cookie response header.
"""
import re
import uuid
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


def unique_email() -> str:
    return f"test_{uuid.uuid4().hex[:8]}@routeiq-test.dev"


def extract_token(response) -> str:
    """Extract access_token value from Set-Cookie header (httpOnly-safe)."""
    set_cookie = response.headers.get("set-cookie", "")
    match = re.search(r"access_token=([^;]+)", set_cookie)
    assert match, f"access_token not found in Set-Cookie: {set_cookie!r}"
    return match.group(1)


# ── 1. Register success ───────────────────────────────────────────────────────
async def test_register_success(client: AsyncClient):
    email = unique_email()
    resp = await client.post("/auth/register", json={"email": email, "password": "Password123!"})
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["email"] == email
    assert body["role"] == "dispatcher"
    assert "hashed_password" not in body


# ── 2. Duplicate email ────────────────────────────────────────────────────────
async def test_register_duplicate_email(client: AsyncClient):
    email = unique_email()
    payload = {"email": email, "password": "Password123!"}
    r1 = await client.post("/auth/register", json=payload)
    assert r1.status_code == 201, r1.text
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 400, resp.text
    assert "already registered" in resp.json()["detail"]


# ── 3. Login success + cookie set ────────────────────────────────────────────
async def test_login_success(client: AsyncClient):
    email = unique_email()
    r = await client.post("/auth/register", json={"email": email, "password": "Password123!"})
    assert r.status_code == 201, r.text
    resp = await client.post("/auth/login", json={"email": email, "password": "Password123!"})
    assert resp.status_code == 200, resp.text
    # Verify Set-Cookie header contains access_token
    token = extract_token(resp)
    assert len(token) > 10
    body = resp.json()
    assert body["email"] == email


# ── 4. Login wrong password ───────────────────────────────────────────────────
async def test_login_wrong_password(client: AsyncClient):
    email = unique_email()
    r = await client.post("/auth/register", json={"email": email, "password": "Password123!"})
    assert r.status_code == 201, r.text
    resp = await client.post("/auth/login", json={"email": email, "password": "wrongpass"})
    assert resp.status_code == 401, resp.text
    assert "Invalid" in resp.json()["detail"]


# ── 5. GET /auth/me authenticated ─────────────────────────────────────────────
async def test_me_authenticated(client: AsyncClient):
    email = unique_email()
    await client.post("/auth/register", json={"email": email, "password": "Password123!"})
    login_resp = await client.post("/auth/login", json={"email": email, "password": "Password123!"})
    assert login_resp.status_code == 200, login_resp.text
    token = extract_token(login_resp)

    resp = await client.get("/auth/me", cookies={"access_token": token})
    assert resp.status_code == 200, resp.text
    assert resp.json()["email"] == email


# ── 6. GET /auth/me unauthenticated ──────────────────────────────────────────
async def test_me_unauthenticated(client: AsyncClient):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401, resp.text


# ── 7. Logout clears cookie ───────────────────────────────────────────────────
async def test_logout(client: AsyncClient):
    email = unique_email()
    await client.post("/auth/register", json={"email": email, "password": "Password123!"})
    await client.post("/auth/login", json={"email": email, "password": "Password123!"})

    resp = await client.post("/auth/logout")
    assert resp.status_code == 204, resp.text
    # Verify Set-Cookie clears the token (empty value or max-age=0)
    set_cookie = resp.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie
    # deleted cookie has empty value or max-age=0
    assert 'access_token=""' in set_cookie or "max-age=0" in set_cookie.lower() or 'access_token=; ' in set_cookie
