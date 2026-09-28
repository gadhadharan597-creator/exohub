import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "ExoMiner classifies transit signals" in data["disclaimer"]

def test_candidates_endpoint():
    res = client.get("/api/candidates?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert len(data["items"]) <= 10
    assert data["total"] > 0

def test_candidate_detail_endpoint():
    # Test lookup for K2-72 e
    res = client.get("/api/candidates/K2-72%20e")
    assert res.status_code == 200
    data = res.json()
    assert "K2-72" in data["pl_name"]

def test_custom_detect_endpoint():
    payload = {
        "st_teff": 5778.0,
        "pl_rade": 1.0,
        "pl_insol": 1.0,
        "prob_real_planet": 0.95,
        "albedo": 0.3
    }
    res = client.post("/api/detect", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "deterministic_metrics" in data
    assert "monte_carlo_uncertainty" in data
    assert data["deterministic_metrics"]["is_rocky"] == 1

def test_custom_detect_validation_error():
    payload = {
        "st_teff": 100.0, # Too cold
        "pl_rade": -1.0,  # Invalid radius
        "pl_insol": 1.0
    }
    res = client.post("/api/detect", json=payload)
    assert res.status_code == 422 # Unprocessable Entity validation error
