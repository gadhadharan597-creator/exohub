import requests
from typing import Optional, Dict, Any

NASA_TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

def query_nasa_archive_live(planet_identifier: str) -> Optional[Dict[str, Any]]:
    """Queries NASA Exoplanet Archive TAP service live for authoritative numeric parameters."""
    clean_id = planet_identifier.strip()
    
    # Query by planet name or host name
    query = (
        f"SELECT pl_name, hostname, pl_orbper, pl_rade, pl_insol, pl_eqt, "
        f"st_teff, st_rad, st_mass, st_lum, sy_dist, disc_year, discoverymethod "
        f"FROM pscomppars WHERE LOWER(pl_name) LIKE '%{clean_id.lower()}%' "
        f"OR LOWER(hostname) LIKE '%{clean_id.lower()}%'"
    )
    
    url = f"{NASA_TAP_URL}?query={query.replace(' ', '+')}&format=json"
    
    try:
        res = requests.get(url, timeout=15)
        res.raise_for_status()
        records = res.json()
        if records and len(records) > 0:
            # Pick exact match if available, else first record
            exact = [r for r in records if r.get('pl_name', '').lower() == clean_id.lower()]
            record = exact[0] if exact else records[0]
            
            return {
                'pl_name': record.get('pl_name'),
                'hostname': record.get('hostname'),
                'pl_orbper': record.get('pl_orbper'),
                'pl_rade': record.get('pl_rade'),
                'pl_insol': record.get('pl_insol'),
                'pl_eqt': record.get('pl_eqt'),
                'st_teff': record.get('st_teff'),
                'st_rad': record.get('st_rad'),
                'st_mass': record.get('st_mass'),
                'st_lum': record.get('st_lum'),
                'sy_dist': record.get('sy_dist'),
                'disc_year': record.get('disc_year'),
                'discoverymethod': record.get('discoverymethod'),
                'source': 'NASA Exoplanet Archive TAP Service'
            }
    except Exception as e:
        print(f"[NASA Archive Service] Query error for '{planet_identifier}': {e}")
        
    return None
