import React, { useState, useEffect } from 'react';
import { fetchCandidates, Candidate } from '../services/api';
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onSelectCandidate: (candidateName: string) => void;
}

export const RankedCandidatesPage: React.FC<Props> = ({ onSelectCandidate }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [minComposite, setMinComposite] = useState(0.50);
  const [minProbability, setMinProbability] = useState(0.70);
  const [stellarType, setStellarType] = useState('ALL');
  const [radiusClass, setRadiusClass] = useState('ALL');
  const [hzOnly, setHzOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCandidates({
        search,
        min_composite_score: minComposite,
        min_probability: minProbability,
        stellar_type: stellarType === 'ALL' ? undefined : stellarType,
        radius_class: radiusClass === 'ALL' ? undefined : radiusClass,
        hz_only: hzOnly,
        page,
        page_size: pageSize
      });
      setCandidates(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, minComposite, minProbability, stellarType, radiusClass, hzOnly, page]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-2">
          <span>🪐 Ranked Exoplanet Candidates</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Catalog of exoplanets ranked by multi-stage composite habitability scores derived from NASA Archive parameters & ExoMiner++ probabilities.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search planet or star..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-space-cyan"
            />
          </div>

          {/* Min Composite Score Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>Min Composite Score</span>
              <span className="text-space-cyan font-bold">{minComposite.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={minComposite}
              onChange={(e) => { setMinComposite(parseFloat(e.target.value)); setPage(1); }}
              className="w-full accent-space-cyan bg-slate-800"
            />
          </div>

          {/* Min ExoMiner Prob Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>Min ExoMiner P(Real)</span>
              <span className="text-space-cyan font-bold">{minProbability.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={minProbability}
              onChange={(e) => { setMinProbability(parseFloat(e.target.value)); setPage(1); }}
              className="w-full accent-space-cyan bg-slate-800"
            />
          </div>

          {/* Stellar Type Filter */}
          <div>
            <select
              value={stellarType}
              onChange={(e) => { setStellarType(e.target.value); setPage(1); }}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-space-cyan"
            >
              <option value="ALL">All Stellar Types (O, B, A, F, G, K, M)</option>
              <option value="G">G-type (Sun-like)</option>
              <option value="K">K-type (Orange Dwarfs)</option>
              <option value="M">M-type (Red Dwarfs)</option>
              <option value="F">F-type</option>
              <option value="A">A-type</option>
            </select>
          </div>
        </div>

        {/* Checkboxes Row */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800 text-xs text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={radiusClass === 'Rocky'}
              onChange={(e) => { setRadiusClass(e.target.checked ? 'Rocky' : 'ALL'); setPage(1); }}
              className="rounded bg-slate-900 border-slate-700 text-space-cyan focus:ring-0"
            />
            <span>Rocky Planets Only (R ≤ 1.6 R⊕)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hzOnly}
              onChange={(e) => { setHzOnly(e.target.checked); setPage(1); }}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span>Conservative Habitable Zone Only</span>
          </label>

          <span className="ml-auto text-slate-500">
            Total Matches: <strong className="text-slate-200">{total}</strong>
          </span>
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className="glass-panel rounded-xl p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-space-cyan mb-2" />
          <p>Loading catalog candidates...</p>
        </div>
      ) : error ? (
        <div className="glass-panel rounded-xl p-6 text-center text-rose-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center text-slate-400">
          <p>No candidates match active filter criteria. Try lowering score thresholds.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden shadow-xl border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Rank / Name</th>
                  <th className="px-4 py-3">Star</th>
                  <th className="px-4 py-3">Radius (R⊕)</th>
                  <th className="px-4 py-3">T_eq (K)</th>
                  <th className="px-4 py-3">Insolation (S⊕)</th>
                  <th className="px-4 py-3">Proxy ESI</th>
                  <th className="px-4 py-3">P(Real Planet)</th>
                  <th className="px-4 py-3">Physics Score</th>
                  <th className="px-4 py-3">Composite Score</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {candidates.map((item, idx) => {
                  const rank = (page - 1) * pageSize + idx + 1;
                  const score = item.composite_habitability_score ?? 0;
                  return (
                    <tr
                      key={item.pl_name}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => onSelectCandidate(item.pl_name)}
                    >
                      <td className="px-4 py-3 font-sans font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-mono w-6">#{rank}</span>
                          <span className="font-semibold text-space-cyan">{item.pl_name}</span>
                          {item.is_rocky === 1 && (
                            <span className="badge-rocky text-[10px] px-1.5 py-0.5 rounded font-sans">Rocky</span>
                          )}
                          {item.P_HZ === 1 && (
                            <span className="badge-hz text-[10px] px-1.5 py-0.5 rounded font-sans">In HZ</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-300">
                        {item.hostname} <span className="text-slate-500 text-xs">({item.stellar_type})</span>
                      </td>
                      <td className="px-4 py-3">{item.pl_rade ? item.pl_rade.toFixed(2) : 'N/A'}</td>
                      <td className="px-4 py-3">{item.eq_temp_k ? `${item.eq_temp_k.toFixed(1)} K` : 'N/A'}</td>
                      <td className="px-4 py-3">{item.pl_insol ? item.pl_insol.toFixed(2) : 'N/A'}</td>
                      <td className="px-4 py-3">{item.earth_similarity_index ? item.earth_similarity_index.toFixed(3) : 'N/A'}</td>
                      <td className="px-4 py-3 text-emerald-400">{item.P_real_planet ? item.P_real_planet.toFixed(3) : 'N/A'}</td>
                      <td className="px-4 py-3">{item.physics_habitability_score ? item.physics_habitability_score.toFixed(3) : 'N/A'}</td>
                      <td className="px-4 py-3 font-sans font-bold">
                        <span className={`px-2 py-1 rounded text-xs ${
                          score >= 0.85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          score >= 0.60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {score.toFixed(3)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-sans">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectCandidate(item.pl_name); }}
                          className="text-xs bg-space-indigo/20 hover:bg-space-indigo/40 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded transition-colors"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-slate-900/90 px-4 py-3 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
            <span>Showing Page {page} of {Math.ceil(total / pageSize)}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-slate-800 rounded disabled:opacity-40 hover:bg-slate-700 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-slate-800 rounded disabled:opacity-40 hover:bg-slate-700 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
