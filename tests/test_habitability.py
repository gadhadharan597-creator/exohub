import pytest
import math
from backend.app.habitability.kopparapu import calculate_hz_flux, calculate_hz_position_index
from backend.app.habitability.esi import calculate_esi
from backend.app.habitability.calculator import compute_habitability_metrics, calculate_eq_temp
from backend.app.habitability.monte_carlo import run_monte_carlo_habitability

def test_kopparapu_hz_flux():
    # Solar temperature 5778 K should return baseline solar flux bounds
    inner_flux = calculate_hz_flux(5778.0, 'recent_venus_inner')
    outer_flux = calculate_hz_flux(5778.0, 'max_greenhouse_outer')
    
    assert inner_flux > outer_flux
    assert math.isclose(inner_flux, 1.776, rel_tol=1e-2)
    assert math.isclose(outer_flux, 0.356, rel_tol=1e-2)

def test_hz_position_index():
    inner_flux = 1.776
    outer_flux = 0.356
    
    # Earth insolation (1.0 S_earth) is inside HZ
    idx = calculate_hz_position_index(1.0, inner_flux, outer_flux)
    assert 0.0 <= idx <= 1.0

def test_calculate_esi():
    # Earth parameters should yield ESI close to 1.0
    esi = calculate_esi(1.0, 288.0)
    assert math.isclose(esi, 1.0, abs_tol=1e-3)
    
    # Extreme gas giant radius should yield lower ESI
    esi_jupiter = calculate_esi(11.2, 120.0)
    assert esi_jupiter < 0.5

def test_compute_habitability_metrics():
    # Test Earth-like planet around Sun-like star
    metrics = compute_habitability_metrics(
        st_teff=5778.0,
        pl_rade=1.0,
        pl_insol=1.0,
        prob_real_planet=0.95
    )
    
    assert metrics['in_conservative_hz'] == 1
    assert metrics['is_rocky'] == 1
    assert metrics['physics_habitability_score'] == 0.95
    assert metrics['stellar_type'] == 'G'

def test_monte_carlo_simulation():
    mc = run_monte_carlo_habitability(
        st_teff=5778.0,
        pl_rade=1.0,
        pl_insol=1.0,
        prob_real_planet=0.95,
        n_iterations=100
    )
    
    assert 'habitability_score_mean' in mc
    assert 'habitability_score_std' in mc
    assert 'habitability_score_ci95' in mc
    assert 0.0 <= mc['habitability_score_mean'] <= 1.0
