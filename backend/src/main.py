import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from src.routers import pdf_tools, auth, payments, admin
from src.services.cleanup import cleanup_expired_files

load_dotenv()
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://rinse.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf_tools.router, prefix="/api/pdf", tags=["PDF Tools"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
async def root():
    return {"status": "ok", "service": "Rinse API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
