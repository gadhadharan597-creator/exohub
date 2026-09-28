const API_BASE = '/api';

export interface Candidate {
  pl_name: string;
  hostname: string;
  stellar_type: string;
  pl_rade: number;
  eq_temp_k: number;
  pl_insol: number;
  st_teff: number;
  st_rad: number;
  st_mass: number;
  sy_dist: number;
  earth_similarity_index: number;
  P_real_planet: number;
  P_HZ: number;
  is_rocky: number;
  radius_class: string;
  physics_habitability_score: number;
  ml_habitability_score: number;
  composite_habitability_score: number;
}

export interface CandidateResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: Candidate[];
}

export interface PlanetDetailsResponse {
  planet_name: string;
  hostname: string;
  authoritative_parameters: Record<string, any>;
  descriptive_context: string;
  citations: Array<{ title: string; uri: string }>;
  sources: string[];
  conflicts: string[];
  conflict_resolution_policy: string;
  disclaimer: string;
}

export interface ChatResponse {
  answer: string;
  tools_used: string[];
  source_table: Candidate[] | null;
  citations: Array<{ title: string; uri: string }>;
  disclaimer: string;
}

export interface DetectRequest {
  st_teff: number;
  pl_rade: number;
  pl_insol: number;
  prob_real_planet?: number;
  albedo?: number;
}

export interface DetectResponse {
  inputs: Record<string, any>;
  deterministic_metrics: Record<string, any>;
  monte_carlo_uncertainty: {
    habitability_score_mean: number;
    habitability_score_std: number;
    habitability_score_ci95: [number, number];
    esi_mean: number;
    esi_std: number;
    eq_temp_mean: number;
    eq_temp_std: number;
  };
  disclaimer: string;
}

export async function fetchCandidates(params: Record<string, any>): Promise<CandidateResponse> {
  const query = new URLSearchParams();
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      query.append(k, params[k].toString());
    }
  });
  const res = await fetch(`${API_BASE}/candidates?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch candidates');
  return res.json();
}

export async function fetchCandidateDetails(planetName: string): Promise<PlanetDetailsResponse> {
  const res = await fetch(`${API_BASE}/planets/${encodeURIComponent(planetName)}/details`);
  if (!res.ok) throw new Error('Failed to fetch planet details');
  return res.json();
}

export async function sendChatMessage(messages: Array<{ role: string; content: string }>): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function runCustomDetect(data: DetectRequest): Promise<DetectResponse> {
  const res = await fetch(`${API_BASE}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Detect request failed');
  }
  return res.json();
}
