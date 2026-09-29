import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.orbit_service import compute_semi_major_axis, compute_stellar_luminosity

client = TestClient(app)

def test_orbit_physics_calculations():
    # Earth around Sun: P=365.25 days, mass=1.0 M_sun => a = 1.0 AU
    a_earth = compute_semi_major_axis(365.25, 1.0)
    assert abs(a_earth - 1.0) < 0.01

    # TRAPPIST-1 e: P=6.1 days, stellar mass ~0.09 M_sun => a ~ 0.029 AU
    a_t1e = compute_semi_major_axis(6.1, 0.09)
    assert 0.02 < a_t1e < 0.04

    # Stellar luminosity for Sun (1 R_sun, 5778 K) => 1.0 L_sun
    lum_sun = compute_stellar_luminosity(1.0, 5778.0)
    assert abs(lum_sun - 1.0) < 0.01

def test_get_featured_systems_api():
    response = client.get("/api/systems/featured")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # TRAPPIST-1 or KOI-351 should be in featured systems
    hostnames = [s["hostname"] for s in data]
    assert any("TRAPPIST-1" in h for h in hostnames)

def test_get_system_orbit_api():
    response = client.get("/api/systems/TRAPPIST-1/orbit")
    assert response.status_code == 200
    data = response.json()
    assert data["hostname"] == "TRAPPIST-1"
    assert data["found"] is True
    assert data["planet_count"] >= 3
    assert "hz_boundaries" in data
    assert "optimistic_inner_au" in data["hz_boundaries"]
    assert "conservative_inner_au" in data["hz_boundaries"]
    assert "conservative_outer_au" in data["hz_boundaries"]
    assert "optimistic_outer_au" in data["hz_boundaries"]

    # Check planet list is sorted by semi_major_axis_au
    planets = data["planets"]
    axes = [p["semi_major_axis_au"] for p in planets]
    assert axes == sorted(axes)
