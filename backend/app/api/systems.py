from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ..services.orbit_service import orbit_service

router = APIRouter()

@router.get("/systems/featured")
def get_featured_systems() -> List[Dict[str, Any]]:
    """Retrieves list of multi-planet systems with planet counts and habitability metadata."""
    return orbit_service.get_featured_systems()

@router.get("/systems/{hostname}/orbit")
def get_system_orbit(hostname: str) -> Dict[str, Any]:
    """Retrieves Keplerian orbital elements and Kopparapu Habitable Zone AU boundaries for a host system."""
    data = orbit_service.get_system_orbit_data(hostname)
    if not data.get("found"):
        raise HTTPException(status_code=404, detail=data.get("message", f"System '{hostname}' not found."))
    return data
