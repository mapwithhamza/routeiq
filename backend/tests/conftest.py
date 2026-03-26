"""
Shared pytest fixtures for all backend tests.
Uses httpx.AsyncClient against the live FastAPI app.
pytest-asyncio mode is set to 'auto' so all async tests run without decoration.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Must import app AFTER sys.path is set — running from backend/ this works directly
from main import app
from database import engine


@pytest.fixture(scope="session")
def event_loop():
    """Use a single event loop for all tests to avoid asyncpg connection pool issues."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client() -> AsyncClient:
    """Async test client wrapping the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    # Dispose engine connections so stale asyncpg sockets don't leak across tests
    await engine.dispose()
