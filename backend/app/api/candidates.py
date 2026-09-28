from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional, List, Dict, Any
from ..services.candidate_service import CandidateService

router = APIRouter()

# Global candidate service instance
candidate_service = CandidateService()

@router.get("/candidates")
def get_candidates(
    min_probability: float = Query(0.0, ge=0.0, le=1.0, description="Minimum ExoMiner probability"),
    min_composite_score: float = Query(0.0, ge=0.0, le=1.0, description="Minimum composite habitability score"),
    radius_class: Optional[str] = Query(None, description="Radius class: 'Rocky', 'Mini-Neptune / Gas Giant', or 'All'"),
    hz_only: bool = Query(False, description="Filter candidates inside Conservative Habitable Zone"),
    stellar_type: Optional[str] = Query(None, description="Comma-separated stellar spectral types, e.g., 'G,K,M'"),
    search: Optional[str] = Query(None, description="Search query by planet name or host star"),
    sort_by: str = Query('composite_habitability_score', description="Column to sort by"),
    ascending: bool = Query(False, description="Sort order: true for ascending, false for descending"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page")
) -> Dict[str, Any]:
    """Retrieves list of ranked exoplanet candidates with filtering, searching, and pagination."""
    return candidate_service.get_candidates(
        min_probability=min_probability,
        min_composite_score=min_composite_score,
        radius_class=radius_class,
        hz_only=hz_only,
        stellar_type=stellar_type,
        search_query=search,
        sort_by=sort_by,
        ascending=ascending,
        page=page,
        page_size=page_size
    )

@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: str) -> Dict[str, Any]:
    """Retrieves detailed information for a single candidate by planet name, host star, or TIC/KIC ID."""
    result = candidate_service.get_candidate_by_id_or_name(candidate_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found.")
    return result
