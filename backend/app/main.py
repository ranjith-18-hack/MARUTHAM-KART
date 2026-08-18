"""
MARUTHAM KART — FastAPI Application Entry Point

Registers all API routers and middleware.
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.dependencies import get_database_session

# Import routers
from app.api.routes.auth import router as auth_router
from app.api.routes.recruitment import router as recruitment_router
from app.api.routes.portals import router as portals_router
# Phase 4
from app.api.routes.customer import router as customer_router
from app.api.routes.products import router as products_router
from app.api.routes.cart import router as cart_router
from app.api.routes.orders import router as orders_router
# Phase 5
from app.api.routes.godown import router as godown_router
# Phase 6
from app.api.routes.transport import router as transport_router
# Phase 8
from app.api.routes.farmer import router as farmer_router
from app.api.routes.business import router as business_router
from app.api.routes.office import router as office_router
from app.api.routes.driver import router as driver_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.payments import router as payments_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="MARUTHAM KART — Agricultural E-Commerce & Logistics Platform API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# Reads allowed origins from .env (ALLOWED_ORIGINS).
# In production, replace with the exact frontend domain instead of wildcard.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

# ── Routers ────────────────────────────────────────────────────────────────────
PREFIX = settings.API_V1_STR

app.include_router(auth_router,          prefix=f"{PREFIX}")
app.include_router(recruitment_router,   prefix=f"{PREFIX}")
app.include_router(portals_router,       prefix=f"{PREFIX}")
# Phase 4
app.include_router(customer_router,      prefix=f"{PREFIX}")
app.include_router(products_router,      prefix=f"{PREFIX}")
app.include_router(cart_router,          prefix=f"{PREFIX}")
app.include_router(orders_router,        prefix=f"{PREFIX}")
# Phase 5
app.include_router(godown_router,        prefix=f"{PREFIX}")
# Phase 6
app.include_router(transport_router,     prefix=f"{PREFIX}")
# Phase 8
app.include_router(farmer_router,        prefix=f"{PREFIX}")
app.include_router(business_router,      prefix=f"{PREFIX}")
app.include_router(office_router,        prefix=f"{PREFIX}")
app.include_router(driver_router,        prefix=f"{PREFIX}")
app.include_router(notifications_router, prefix=f"{PREFIX}")
# Phase 9: Payments
app.include_router(payments_router,      prefix=f"{PREFIX}")


# ── Root ───────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
def read_root():
    return {
        "message": "Welcome to MARUTHAM KART API",
        "docs": f"{PREFIX}/docs",
        "health": f"{PREFIX}/health",
    }


# ── Health Check ───────────────────────────────────────────────────────────────

@app.get(f"{PREFIX}/health", tags=["Health"])
def health_check(db: Session = Depends(get_database_session)):
    try:
        db.execute(text("SELECT 1")).fetchone()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}
