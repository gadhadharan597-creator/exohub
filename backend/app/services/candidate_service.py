import os
import pandas as pd
import joblib
from typing import Dict, Any, List, Optional

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

def _resolve_path(rel_path: str) -> str:
    if os.path.isabs(rel_path) and os.path.exists(rel_path):
        return rel_path

    filename = os.path.basename(rel_path)
    dirname = os.path.basename(os.path.dirname(rel_path))

    candidate_paths = [
        os.path.join(PROJECT_ROOT, rel_path),
        os.path.abspath(os.path.join(PROJECT_ROOT, "api", rel_path)),
        os.path.abspath(os.path.join(PROJECT_ROOT, "api", dirname, filename)),
        os.path.abspath(rel_path),
        os.path.abspath(os.path.join("..", rel_path)),
        os.path.abspath(os.path.join("/var/task", rel_path)),
        os.path.abspath(os.path.join("/var/task/api", rel_path)),
        os.path.abspath(os.path.join("/var/task/api", dirname, filename)),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "api", dirname, filename)),
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            return p
    return os.path.join(PROJECT_ROOT, rel_path)

class CandidateService:
    def __init__(self, data_path: str = 'data/ranked_candidates.csv', model_path: str = 'models/habitability_model.joblib'):
        self.data_path = _resolve_path(data_path)
        self.model_path = _resolve_path(model_path)
        self.df: Optional[pd.DataFrame] = None
        self.model_data: Optional[Dict[str, Any]] = None
        self.is_loaded = False
        self.load_data()

    def load_data(self):
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Ranked candidates file not found at '{self.data_path}'")
        
        self.df = pd.read_csv(self.data_path)
        print(f"[CandidateService] Loaded {len(self.df)} candidates from {self.data_path}")

        if os.path.exists(self.model_path):
            self.model_data = joblib.load(self.model_path)
            print(f"[CandidateService] Loaded model from {self.model_path}")
        else:
            print(f"[CandidateService] Warning: Model file not found at {self.model_path}")

        self.is_loaded = True

    def get_candidates(
        self,
        min_probability: float = 0.0,
        min_composite_score: float = 0.0,
        radius_class: Optional[str] = None,
        hz_only: bool = False,
        stellar_type: Optional[str] = None,
        search_query: Optional[str] = None,
        sort_by: str = 'composite_habitability_score',
        ascending: bool = False,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        if self.df is None:
            return {'total': 0, 'page': page, 'page_size': page_size, 'items': []}

        df_filtered = self.df.copy()

        if 'P_real_planet' in df_filtered.columns:
            df_filtered = df_filtered[df_filtered['P_real_planet'] >= min_probability]
        if 'composite_habitability_score' in df_filtered.columns:
            df_filtered = df_filtered[df_filtered['composite_habitability_score'] >= min_composite_score]

        if radius_class and radius_class.lower() != 'all':
            if 'radius_class' in df_filtered.columns:
                df_filtered = df_filtered[df_filtered['radius_class'].str.lower() == radius_class.lower()]

        if hz_only:
            if 'P_HZ' in df_filtered.columns:
                df_filtered = df_filtered[df_filtered['P_HZ'] == 1]

        if stellar_type and stellar_type.lower() != 'all':
            if 'stellar_type' in df_filtered.columns:
                types = [t.strip().upper() for t in stellar_type.split(',')]
                df_filtered = df_filtered[df_filtered['stellar_type'].str.upper().isin(types)]

        if search_query:
            q = search_query.strip().lower()
            mask = df_filtered['pl_name'].fillna('').str.lower().str.contains(q) | df_filtered['hostname'].fillna('').str.lower().str.contains(q)
            df_filtered = df_filtered[mask]

        if sort_by in df_filtered.columns:
            df_filtered = df_filtered.sort_values(by=sort_by, ascending=ascending)

        total = len(df_filtered)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        page_items = df_filtered.iloc[start_idx:end_idx].to_dict(orient='records')
        
        # Replace NaNs with None for clean JSON serialization
        for item in page_items:
            for k, v in item.items():
                if pd.isna(v):
                    item[k] = None

        return {
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': max(1, (total + page_size - 1) // page_size),
            'items': page_items
        }

    def get_candidate_by_id_or_name(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        if self.df is None:
            return None
        
        q = candidate_id.strip().lower()
        match = self.df[self.df['pl_name'].fillna('').str.lower() == q]
        if match.empty:
            match = self.df[self.df['hostname'].fillna('').str.lower() == q]

        if match.empty and candidate_id.isdigit():
            val = int(candidate_id)
            if 'tic_id' in self.df.columns:
                match = self.df[self.df['tic_id'] == val]
            if match.empty and 'kic_id' in self.df.columns:
                match = self.df[self.df['kic_id'] == val]

        if match.empty:
            # Partial match search
            match = self.df[self.df['pl_name'].fillna('').str.lower().str.contains(q)]

        if not match.empty:
            res = match.iloc[0].to_dict()
            for k, v in res.items():
                if pd.isna(v):
                    res[k] = None
            return res

        return None

candidate_service = CandidateService()
