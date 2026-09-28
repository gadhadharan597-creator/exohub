import math
from typing import Dict, Any
from .kopparapu import calculate_hz_flux, calculate_hz_position_index
from .esi import calculate_esi

SIGMA = 5.670374419e-8
EARTH_INSOLATION_WM2 = 1361.0
ROCKY_RADIUS_THRESHOLD = 1.6

def calculate_eq_temp(pl_insol: float, albedo: float = 0.3) -> float:
    """Calculates planet equilibrium temperature in Kelvin given insolation and Bond albedo."""
    if pl_insol is None or math.isnan(pl_insol) or pl_insol <= 0:
        return float('nan')
    insol_wm2 = pl_insol * EARTH_INSOLATION_WM2
    return (insol_wm2 * (1.0 - albedo) / (4.0 * SIGMA)) ** 0.25

def classify_stellar_type(st_teff: float) -> str:
    if st_teff is None or math.isnan(st_teff):
        return 'Unknown'
    if st_teff >= 30000: return 'O'
    elif st_teff >= 10000: return 'B'
    elif st_teff >= 7500: return 'A'
    elif st_teff >= 6000: return 'F'
    elif st_teff >= 5200: return 'G'
    elif st_teff >= 3700: return 'K'
    else: return 'M'

def compute_habitability_metrics(
    st_teff: float,
    pl_rade: float,
    pl_insol: float,
    prob_real_planet: float = 0.95,
    albedo: float = 0.3
) -> Dict[str, Any]:
    """Computes full set of habitability features and physics-based habitability score."""
    inner_hz_flux = calculate_hz_flux(st_teff, 'recent_venus_inner')
    outer_hz_flux = calculate_hz_flux(st_teff, 'max_greenhouse_outer')
    opt_inner_flux = calculate_hz_flux(st_teff, 'dry_runaway_inner')
    opt_outer_flux = calculate_hz_flux(st_teff, 'early_mars_outer')

    hz_pos_index = calculate_hz_position_index(pl_insol, inner_hz_flux, outer_hz_flux)
    eq_temp = calculate_eq_temp(pl_insol, albedo=albedo)

    in_hz = int(pl_insol >= outer_hz_flux and pl_insol <= inner_hz_flux) if not math.isnan(pl_insol) else 0
    in_opt_hz = int(pl_insol >= opt_outer_flux and pl_insol <= opt_inner_flux) if not math.isnan(pl_insol) else 0
    is_rocky = int(pl_rade <= ROCKY_RADIUS_THRESHOLD) if (pl_rade is not None and not math.isnan(pl_rade)) else 0
    radius_class = 'Rocky' if is_rocky == 1 else 'Mini-Neptune / Gas Giant'

    esi = calculate_esi(pl_rade, eq_temp)
    stellar_type = classify_stellar_type(st_teff)

    physics_score = float(prob_real_planet) * float(in_hz) * float(is_rocky)

    return {
        'st_teff': st_teff,
        'pl_rade': pl_rade,
        'pl_insol': pl_insol,
        'eq_temp_k': eq_temp,
        'hz_inner_con_flux': inner_hz_flux,
        'hz_outer_con_flux': outer_hz_flux,
        'hz_inner_opt_flux': opt_inner_flux,
        'hz_outer_opt_flux': opt_outer_flux,
        'hz_position_index': hz_pos_index,
        'in_conservative_hz': in_hz,
        'in_optimistic_hz': in_opt_hz,
        'is_rocky': is_rocky,
        'radius_class': radius_class,
        'earth_similarity_index': esi,
        'stellar_type': stellar_type,
        'physics_habitability_score': physics_score
    }
