import numpy as np
from typing import Dict, Any
from .calculator import compute_habitability_metrics

def run_monte_carlo_habitability(
    st_teff: float,
    pl_rade: float,
    pl_insol: float,
    prob_real_planet: float = 0.95,
    albedo: float = 0.3,
    n_iterations: int = 1000,
    teff_err_pct: float = 0.03,
    rade_err_pct: float = 0.05,
    insol_err_pct: float = 0.10
) -> Dict[str, Any]:
    """Runs Monte Carlo Gaussian perturbation simulation to estimate P(potentially habitable) mean, std, 95% CI."""
    np.random.seed(42)
    
    teff_samples = np.random.normal(st_teff, st_teff * teff_err_pct, n_iterations)
    rade_samples = np.random.normal(pl_rade, pl_rade * rade_err_pct, n_iterations)
    insol_samples = np.random.normal(pl_insol, pl_insol * insol_err_pct, n_iterations)
    
    scores = []
    esi_samples = []
    temp_samples = []
    
    for i in range(n_iterations):
        t = max(2000.0, teff_samples[i])
        r = max(0.1, rade_samples[i])
        s = max(0.001, insol_samples[i])
        
        metrics = compute_habitability_metrics(t, r, s, prob_real_planet=prob_real_planet, albedo=albedo)
        scores.append(metrics['physics_habitability_score'])
        esi_samples.append(metrics['earth_similarity_index'])
        temp_samples.append(metrics['eq_temp_k'])
        
    scores = np.array(scores)
    esi_samples = np.array(esi_samples)
    temp_samples = np.array(temp_samples)
    
    return {
        'habitability_score_mean': float(np.mean(scores)),
        'habitability_score_std': float(np.std(scores)),
        'habitability_score_ci95': [float(np.percentile(scores, 2.5)), float(np.percentile(scores, 97.5))],
        'esi_mean': float(np.mean(esi_samples)),
        'esi_std': float(np.std(esi_samples)),
        'eq_temp_mean': float(np.mean(temp_samples)),
        'eq_temp_std': float(np.std(temp_samples))
    }
