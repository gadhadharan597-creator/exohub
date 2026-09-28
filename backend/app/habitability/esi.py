import math

EARTH_RADIUS = 1.0
EARTH_TEMP_K = 288.0

def calculate_esi(pl_rade: float, eq_temp_k: float) -> float:
    """Calculates proxy Earth Similarity Index (ESI) based on radius and temperature."""
    if any(v is None or math.isnan(v) or v <= 0 for v in [pl_rade, eq_temp_k]):
        return 0.0
    
    esi_r = 1.0 - abs(pl_rade - EARTH_RADIUS) / (pl_rade + EARTH_RADIUS)
    esi_t = 1.0 - abs(eq_temp_k - EARTH_TEMP_K) / (eq_temp_k + EARTH_TEMP_K)
    
    esi_r = max(0.0, esi_r)
    esi_t = max(0.0, esi_t)
    
    return math.sqrt(esi_r * esi_t)
