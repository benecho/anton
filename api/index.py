# Vercel FastAPI entrypoint
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI(title="Trinomial Pricer API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Models
# ============================================

class ModelParams(BaseModel):
    S0: float
    K: float
    T: float
    r: float
    N: int
    type: str
    isAmerican: bool
    Theta: List[float]
    tau: List[float]

class CalibrationParams(BaseModel):
    S0: float
    r: float
    N: int
    M: int
    Theta_initial: List[float]
    tau: List[float]
    Klist: List[float]
    Tlist: List[float]
    Vmarket: List[float]
    weights: Optional[List[float]] = None
    lambda_penalty: float = 0.01
    max_iter: int = 500
    tolerance: float = 1e-6

# ============================================
# Endpoints
# ============================================

@app.get("/")
def root():
    return {"message": "Trinomial Pricer API", "status": "running"}

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/price")
def calculate_price(params: ModelParams):
    # Note: Full C-based calculation not available on Vercel
    # This is a placeholder - the real calculations require the C library
    return JSONResponse(
        status_code=501,
        content={
            "error": "C library not available on Vercel. Use Docker deployment for full functionality.",
            "message": "Please deploy with Docker for trinomial tree calculations."
        }
    )

@app.post("/api/tree")
def calculate_tree(params: ModelParams):
    return JSONResponse(
        status_code=501,
        content={
            "error": "C library not available on Vercel. Use Docker deployment for full functionality."
        }
    )

@app.post("/api/calibrate")
def calibrate(params: CalibrationParams):
    return JSONResponse(
        status_code=501,
        content={
            "error": "C library not available on Vercel. Use Docker deployment for full functionality."
        }
    )
