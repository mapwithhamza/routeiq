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
# Routers (wired in Phase 2 onwards)
# ---------------------------------------------------------------------------
# from routers import auth, deliveries, riders, routes, analytics
# app.include_router(auth.router, prefix="/auth", tags=["auth"])
# app.include_router(deliveries.router, prefix="/deliveries", tags=["deliveries"])
# app.include_router(riders.router, prefix="/riders", tags=["riders"])
# app.include_router(routes.router, prefix="/routes", tags=["routes"])
# app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
