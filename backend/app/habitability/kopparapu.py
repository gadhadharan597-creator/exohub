import math
import numpy as np

KOPPARAPU_COEFFS = {
    'recent_venus_inner':   {'a': 1.3351e-8, 'b': 3.1515e-12, 'c': -1.3785e-15, 'd': -2.9658e-19, 'e': -2.9866e-23, 'S_eff_sun': 1.776},
    'max_greenhouse_outer': {'a': 1.0183e-8, 'b': 1.4885e-12, 'c': -4.8943e-16, 'd': -3.6937e-19, 'e': -1.1396e-23, 'S_eff_sun': 0.356},
    'dry_runaway_inner':    {'a': 1.7766e-8, 'b': 6.6436e-12, 'c': -2.5704e-15, 'd': -2.9090e-19, 'e': -6.1802e-24, 'S_eff_sun': 1.038},
    'early_mars_outer':     {'a': 5.9529e-9, 'b': -1.4925e-12, 'c': 7.6293e-16, 'd': -2.3164e-19, 'e': 2.4578e-23, 'S_eff_sun': 0.320}
}

EARTH_TEFF_K = 5778.0

def calculate_hz_flux(st_teff: float, boundary_type: str) -> float:
    """Calculates stellar flux boundary (S_eff relative to Sun) for a given stellar Teff."""
    if st_teff is None or math.isnan(st_teff):
        return float('nan')
    if boundary_type not in KOPPARAPU_COEFFS:
        raise ValueError(f"Unknown boundary type: {boundary_type}")
    
    coeffs = KOPPARAPU_COEFFS[boundary_type]
    X = st_teff - EARTH_TEFF_K
    S_eff = coeffs['S_eff_sun'] + coeffs['a']*X + coeffs['b']*(X**2) + coeffs['c']*(X**3) + coeffs['d']*(X**4) + coeffs['e']*(X**5)
    return max(0.01, float(S_eff))

def calculate_hz_position_index(pl_insol: float, inner_flux: float, outer_flux: float) -> float:
    """Calculates HZ Position Index (1.0 = inner edge, 0.0 = outer edge, 0..1 = inside HZ)."""
    if any(val is None or math.isnan(val) for val in [pl_insol, inner_flux, outer_flux]):
        return float('nan')
    if inner_flux == outer_flux:
        return float('nan')
    return (pl_insol - outer_flux) / (inner_flux - outer_flux)
