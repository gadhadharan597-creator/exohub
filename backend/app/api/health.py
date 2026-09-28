from fastapi import APIRouter, Depends
from typing import Dict, Any

router = APIRouter()

@router.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "online",
        "service": "Exoplanet Habitability API",
        "version": "1.0.0",
        "disclaimer": "ExoMiner classifies transit signals, not habitability. Habitability scores are computed potential habitability estimates with uncertainty."
    }
