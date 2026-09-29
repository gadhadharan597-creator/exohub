import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from .candidate_service import candidate_service
from ..habitability.kopparapu import calculate_hz_flux, KOPPARAPU_COEFFS

def compute_semi_major_axis(period_days: float, st_mass_solar: Optional[float] = 1.0) -> float:
    """Computes orbital semi-major axis in AU using Kepler's 3rd Law."""
    if not period_days or period_days <= 0:
        return 0.1
    mass = st_mass_solar if st_mass_solar and st_mass_solar > 0 else 1.0
    # a^3 = M * (P / 365.25)^2
    a_cubed = mass * ((period_days / 365.25) ** 2)
    return max(0.001, float(a_cubed ** (1.0 / 3.0)))

def compute_stellar_luminosity(st_rad: Optional[float], st_teff: Optional[float], st_lum: Optional[float] = None) -> float:
    """Computes stellar luminosity in Solar units (L/L_sun)."""
    if st_lum is not None and not math.isnan(st_lum) and st_lum > 0:
        return float(st_lum)
    rad = st_rad if (st_rad is not None and not math.isnan(st_rad) and st_rad > 0) else 1.0
    teff = st_teff if (st_teff is not None and not math.isnan(st_teff) and st_teff > 0) else 5778.0
    lum = (rad ** 2) * ((teff / 5778.0) ** 4)
    return max(1e-6, float(lum))

class OrbitService:
    def get_system_orbit_data(self, hostname: str) -> Dict[str, Any]:
        """Returns complete Keplerian orbit parameters and HZ boundaries for a multi-planet system."""
        clean_host = hostname.strip()
        df = candidate_service.df

        if df is None:
            return {"error": "Candidate data not loaded."}

        # Filter candidates matching host name
        mask = df['hostname'].fillna('').str.lower() == clean_host.lower()
        matched = df[mask]

        if matched.empty:
            # Try partial search
            mask = df['hostname'].fillna('').str.lower().str.contains(clean_host.lower())
            matched = df[mask]

        if matched.empty:
            # Fallback to search planet name host
            mask = df['pl_name'].fillna('').str.lower().str.contains(clean_host.lower())
            matched = df[mask]

        if matched.empty:
            return {
                "hostname": clean_host,
                "found": False,
                "message": f"No system found for host '{clean_host}'",
                "star": {},
                "planets": [],
                "hz_boundaries": {}
            }

        # Extract system star info from the first planet row
        first_row = matched.iloc[0].to_dict()
        st_teff = first_row.get('st_teff') or 5778.0
        st_rad = first_row.get('st_rad') or 1.0
        st_mass = first_row.get('st_mass') or 1.0
        st_lum = compute_stellar_luminosity(st_rad, st_teff, first_row.get('st_lum'))
        stellar_type = first_row.get('stellar_type') or 'G'

        # Compute Kopparapu HZ flux boundaries
        rv_flux = calculate_hz_flux(st_teff, 'recent_venus_inner')
        rg_flux = calculate_hz_flux(st_teff, 'dry_runaway_inner')
        mg_flux = calculate_hz_flux(st_teff, 'max_greenhouse_outer')
        em_flux = calculate_hz_flux(st_teff, 'early_mars_outer')

        # Compute HZ AU distances: d = sqrt(L_star / S_eff)
        hz_boundaries = {
            "optimistic_inner_au": round(math.sqrt(st_lum / rv_flux), 4),
            "conservative_inner_au": round(math.sqrt(st_lum / rg_flux), 4),
            "conservative_outer_au": round(math.sqrt(st_lum / mg_flux), 4),
            "optimistic_outer_au": round(math.sqrt(st_lum / em_flux), 4),
            "rv_flux": round(rv_flux, 3),
            "rg_flux": round(rg_flux, 3),
            "mg_flux": round(mg_flux, 3),
            "em_flux": round(em_flux, 3),
        }

        # Process planets
        planets_data = []
        for idx, row in matched.iterrows():
            item = row.to_dict()
            orbper = item.get('pl_orbper') or 10.0
            a_au = compute_semi_major_axis(orbper, st_mass)
            rade = item.get('pl_rade') or 1.0
            insol = item.get('pl_insol')
            eqt = item.get('calculated_eq_temp_k') or item.get('eq_temp_k')
            comp_score = item.get('composite_habitability_score') or 0.0
            esi = item.get('earth_similarity_index') or 0.0
            p_hz = bool(item.get('P_HZ') == 1 or item.get('is_habitable_candidate') == 1)

            # Determine whether planet falls within conservative or optimistic HZ
            is_in_conservative_hz = (a_au >= hz_boundaries["conservative_inner_au"]) and (a_au <= hz_boundaries["conservative_outer_au"])
            is_in_optimistic_hz = (a_au >= hz_boundaries["optimistic_inner_au"]) and (a_au <= hz_boundaries["optimistic_outer_au"])

            planets_data.append({
                "pl_name": item.get('pl_name'),
                "pl_orbper": orbper,
                "semi_major_axis_au": round(a_au, 4),
                "pl_rade": rade,
                "pl_insol": round(insol, 3) if insol is not None and not math.isnan(insol) else None,
                "calculated_eq_temp_k": round(eqt, 1) if eqt is not None and not math.isnan(eqt) else None,
                "earth_similarity_index": round(esi, 3) if esi is not None and not math.isnan(esi) else 0.0,
                "composite_habitability_score": round(comp_score, 3) if comp_score is not None and not math.isnan(comp_score) else 0.0,
                "radius_class": item.get('radius_class') or "Unknown",
                "P_HZ": 1 if is_in_conservative_hz else (0.5 if is_in_optimistic_hz else 0),
                "is_in_conservative_hz": is_in_conservative_hz,
                "is_in_optimistic_hz": is_in_optimistic_hz,
                "relative_speed": round(365.25 / orbper, 2),  # Orbits per Earth year
                "color": "#10b981" if is_in_conservative_hz else ("#3b82f6" if is_in_optimistic_hz else "#94a3b8")
            })

        # Sort planets by semi-major axis (inner to outer)
        planets_data.sort(key=lambda p: p["semi_major_axis_au"])

        actual_hostname = first_row.get('hostname') or clean_host

        return {
            "hostname": actual_hostname,
            "found": True,
            "planet_count": len(planets_data),
            "star": {
                "hostname": actual_hostname,
                "st_teff": st_teff,
                "st_rad": st_rad,
                "st_mass": st_mass,
                "st_lum": round(st_lum, 5),
                "stellar_type": stellar_type,
            },
            "hz_boundaries": hz_boundaries,
            "planets": planets_data
        }

    def get_featured_systems(self) -> List[Dict[str, Any]]:
        """Returns a list of multi-planet systems with planet counts for UI selection."""
        df = candidate_service.df
        if df is None:
            return []

        counts = df['hostname'].value_counts()
        systems = []
        for host, count in counts.items():
            if pd.isna(host) or count <= 1:
                continue
            
            # Find if any planet in system is habitable candidate
            sub = df[df['hostname'] == host]
            hab_count = int((sub['composite_habitability_score'] >= 0.7).sum())
            has_hz = int((sub['P_HZ'] == 1).sum())

            systems.append({
                "hostname": str(host),
                "total_planets": int(count),
                "habitable_candidates": hab_count,
                "hz_planets": has_hz,
                "sample_planet": str(sub['pl_name'].iloc[0])
            })

        # Sort by total_planets descending then habitable candidates
        systems.sort(key=lambda s: (s['total_planets'], s['habitable_candidates']), reverse=True)
        return systems

orbit_service = OrbitService()
