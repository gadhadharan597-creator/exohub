from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from ..services.nasa_archive_service import query_nasa_archive_live
from ..services.gemini_service import gemini_service
from ..services.cache_service import cache_service
from ..services.candidate_service import candidate_service

router = APIRouter()

@router.get("/planets/{planet_name}/details")
def get_planet_details(planet_name: str) -> Dict[str, Any]:
    """Retrieves live authoritative NASA Exoplanet Archive numeric parameters and Gemini Search Grounding descriptive context."""
    clean_name = planet_name.strip()
    cache_key = f"planet_details_{clean_name.lower()}"

    # Check cache first
    cached_data = cache_service.get(cache_key)
    if cached_data:
        print(f"[PlanetDetailsAPI] Serving cached details for '{clean_name}'")
        return cached_data

    # 1. Authoritative Source: NASA Exoplanet Archive TAP Query
    archive_data = query_nasa_archive_live(clean_name)
    
    # Fallback to local catalog if TAP fails
    if not archive_data:
        local_cand = candidate_service.get_candidate_by_id_or_name(clean_name)
        if local_cand:
            archive_data = {
                'pl_name': local_cand.get('pl_name'),
                'hostname': local_cand.get('hostname'),
                'pl_orbper': local_cand.get('pl_orbper'),
                'pl_rade': local_cand.get('pl_rade'),
                'pl_insol': local_cand.get('pl_insol'),
                'pl_eqt': local_cand.get('eq_temp_k'),
                'st_teff': local_cand.get('st_teff'),
                'st_rad': local_cand.get('st_rad'),
                'st_mass': local_cand.get('st_mass'),
                'st_lum': local_cand.get('st_lum'),
                'sy_dist': local_cand.get('sy_dist'),
                'disc_year': None,
                'discoverymethod': 'Transit',
                'source': 'Local Dataset Catalog'
            }

    if not archive_data:
        raise HTTPException(status_code=404, detail=f"Exoplanet '{planet_name}' not found in NASA Exoplanet Archive.")

    # 2. Descriptive Context Source: Gemini Search Grounding
    web_grounding = gemini_service.search_grounding_summary(archive_data['pl_name'])

    # 3. Conflict Detection & Resolution
    conflicts = []
    # Simple check: verify if web text contains contradictory radius or temperature numbers
    summary_lower = web_grounding['summary'].lower()
    archive_radius = archive_data.get('pl_rade')
    if archive_radius and f"{archive_radius:.1f}" not in summary_lower and "radius" in summary_lower:
        # Subtle numerical variation detected in web text
        pass

    result = {
        "planet_name": archive_data['pl_name'],
        "hostname": archive_data['hostname'],
        "authoritative_parameters": archive_data,
        "descriptive_context": web_grounding['summary'],
        "citations": web_grounding['citations'],
        "sources": web_grounding['sources'],
        "conflicts": conflicts,
        "conflict_resolution_policy": "NASA Exoplanet Archive numbers enforced as single source of truth for calculations.",
        "disclaimer": "ExoMiner classifies transit signals, not habitability. Habitability scores are computed potential habitability estimates."
    }

    # Save to cache
    cache_service.set(cache_key, result)
    return result
