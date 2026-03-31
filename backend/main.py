from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

app = FastAPI(
    title="RouteIQ API",
    description="GIS-based delivery route optimization dashboard",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],  # exact Vercel URL — NOT "*"
    allow_credentials=True,               # CRITICAL — required for cookie auth
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from routers import auth as auth_router
from routers import google_auth as google_auth_router
from routers import deliveries as deliveries_router
from routers import riders as riders_router
from routers import analytics as analytics_router
from routers import routes as routes_router
from routers import transactions as transactions_router

app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(google_auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(deliveries_router.router, prefix="/deliveries", tags=["deliveries"])
app.include_router(riders_router.router, prefix="/riders", tags=["riders"])
app.include_router(analytics_router.router, prefix="/analytics", tags=["analytics"])
app.include_router(routes_router.router, prefix="/routes", tags=["routes"])
app.include_router(transactions_router.router, prefix="/transactions", tags=["transactions"])

