from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from ..habitability.calculator import compute_habitability_metrics
from ..habitability.monte_carlo import run_monte_carlo_habitability

router = APIRouter()

class CustomDetectRequest(BaseModel):
    st_teff: float = Field(..., ge=500.0, le=50000.0, description="Stellar effective temperature in Kelvin")
    pl_rade: float = Field(..., gt=0.0, le=30.0, description="Planet radius in Earth radii")
    pl_insol: float = Field(..., gt=0.0, le=10000.0, description="Insolation flux in Earth flux units")
    prob_real_planet: float = Field(0.95, ge=0.0, le=1.0, description="ExoMiner real planet probability")
    albedo: float = Field(0.3, ge=0.0, le=0.9, description="Assumed Bond albedo")

@router.post("/detect")
def detect_habitability(req: CustomDetectRequest) -> Dict[str, Any]:
    """Calculates Kopparapu HZ boundaries, equilibrium temperature, ESI, radius class, and Monte Carlo uncertainty."""
    # Input validation
    if req.st_teff < 500.0 or req.st_teff > 50000.0:
        raise HTTPException(status_code=400, detail="Stellar temperature (Teff) must be between 500 K and 50,000 K.")
    if req.pl_rade <= 0.0 or req.pl_rade > 30.0:
        raise HTTPException(status_code=400, detail="Planet radius must be greater than 0 and less than 30 Earth radii.")

    # 1. Deterministic calculation
    metrics = compute_habitability_metrics(
        st_teff=req.st_teff,
        pl_rade=req.pl_rade,
        pl_insol=req.pl_insol,
        prob_real_planet=req.prob_real_planet,
        albedo=req.albedo
    )

    # 2. Monte Carlo Uncertainty Simulation (1,000 iterations)
    mc_uncertainty = run_monte_carlo_habitability(
        st_teff=req.st_teff,
        pl_rade=req.pl_rade,
        pl_insol=req.pl_insol,
        prob_real_planet=req.prob_real_planet,
        albedo=req.albedo,
        n_iterations=1000
    )

    return {
        "inputs": req.model_dump(),
        "deterministic_metrics": metrics,
        "monte_carlo_uncertainty": mc_uncertainty,
        "disclaimer": "ExoMiner classifies transit signals, not habitability. Habitability scores are computed potential habitability estimates with uncertainty, never confirmation of habitability or life."
    }
