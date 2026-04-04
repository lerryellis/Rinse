import logging
import os
from contextlib import asynccontextmanager

import sentry_sdk
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Initialize Sentry (no-op if DSN not set)
sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=0.2,
        environment=os.getenv("ENVIRONMENT", "production"),
    )

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import JSONResponse

from src.routers import pdf_tools, auth, payments, admin, batch, analyze, developer, referrals, teams, tickets
from src.services.cleanup import cleanup_expired_files
from src.services.rate_limit import check_rate_limit

logging.basicConfig(level=logging.INFO)

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run cleanup every 30 minutes
    scheduler.add_job(cleanup_expired_files, "interval", minutes=30)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="Rinse API",
    description="PDF productivity tools backend",
    version="0.1.0",
    lifespan=lifespan,
)

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        # Rate limit PDF processing endpoints more aggressively
        if request.url.path.startswith("/api/pdf/"):
            ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
            error = check_rate_limit(ip, window=60, max_requests=20)  # 20 per minute
            if error:
                return JSONResponse(status_code=429, content={"detail": error})
        return await call_next(request)


app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3002",
        "https://rinse.vercel.app",
        "https://rinse-production.up.railway.app",
        # Allow all Vercel preview deployments
        "https://*.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf_tools.router, prefix="/api/pdf", tags=["PDF Tools"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(batch.router, prefix="/api/batch", tags=["Batch"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analyze"])
app.include_router(developer.router, prefix="/api/v1", tags=["Developer API"])
app.include_router(referrals.router, prefix="/api/referrals", tags=["Referrals"])
app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])


@app.get("/")
async def root():
    return {"status": "ok", "service": "Rinse API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
