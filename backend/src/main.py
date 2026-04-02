from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from src.routers import pdf_tools, auth

load_dotenv()

app = FastAPI(
    title="Rinse API",
    description="PDF productivity tools backend",
    version="0.1.0",
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


@app.get("/")
async def root():
    return {"status": "ok", "service": "Rinse API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
