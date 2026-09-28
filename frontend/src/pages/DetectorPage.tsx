import React, { useState } from 'react';
import { runCustomDetect, DetectResponse } from '../services/api';
import { Cpu, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const DetectorPage: React.FC = () => {
  const [teff, setTeff] = useState(5778);
  const [rade, setRade] = useState(1.0);
  const [insol, setInsol] = useState(1.0);
  const [probReal, setProbReal] = useState(0.95);
  const [albedo, setAlbedo] = useState(0.3);

  const [result, setResult] = useState<DetectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await runCustomDetect({
        st_teff: teff,
        pl_rade: rade,
        pl_insol: insol,
        prob_real_planet: probReal,
        albedo
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-7 h-7 text-space-cyan" /> Custom Habitability Detector & Monte Carlo Simulator
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Input custom planetary and stellar physical parameters to compute Kopparapu Habitable Zone positioning, equilibrium temperature, ESI, and a 1,000-run Monte Carlo Gaussian uncertainty distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs */}
        <div className="glass-panel rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
            Input Stellar & Planetary Parameters
          </h2>

          <form onSubmit={handleCalculate} className="space-y-4 text-xs font-medium">
            <div className="space-y-1">
              <label className="text-slate-300">Stellar Temperature (T_eff in Kelvin)</label>
              <input
                type="number"
                step="50"
                min="500"
                max="50000"
                value={teff}
                onChange={(e) => setTeff(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-space-cyan"
                required
              />
              <span className="text-[10px] text-slate-500">Solar baseline = 5778 K (G-type)</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">Planet Radius (Earth Radii R⊕)</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="30"
                value={rade}
                onChange={(e) => setRade(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-space-cyan"
                required
              />
              <span className="text-[10px] text-slate-500">Rocky threshold ≤ 1.6 R⊕</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">Insolation Flux (Earth Flux Units S⊕)</label>
              <input
                type="number"
                step="0.05"
                min="0.001"
                max="10000"
                value={insol}
                onChange={(e) => setInsol(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-space-cyan"
                required
              />
              <span className="text-[10px] text-slate-500">Earth baseline = 1.0 S⊕</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">ExoMiner Real Planet Probability</label>
              <input
                type="number"
                step="0.01"
                min="0.0"
                max="1.0"
                value={probReal}
                onChange={(e) => setProbReal(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-space-cyan"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300">Assumed Bond Albedo</label>
              <input
                type="number"
                step="0.05"
                min="0.0"
                max="0.9"
                value={albedo}
                onChange={(e) => setAlbedo(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-space-cyan"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-space-cyan/20 hover:bg-space-cyan/30 text-space-cyan border border-space-cyan/40 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
              <span>Run Detector & Monte Carlo</span>
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="glass-panel rounded-xl p-4 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 font-sans block">Calculated T_eq</span>
                  <span className="text-xl font-bold text-space-cyan mt-1 block">
                    {result.deterministic_metrics.eq_temp_k ? `${result.deterministic_metrics.eq_temp_k.toFixed(1)} K` : 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 font-sans block">Proxy ESI</span>
                  <span className="text-xl font-bold text-emerald-400 mt-1 block">
                    {result.deterministic_metrics.earth_similarity_index ? result.deterministic_metrics.earth_similarity_index.toFixed(3) : 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 font-sans block">Conservative HZ</span>
                  <span className={`text-sm font-bold mt-2 block ${result.deterministic_metrics.in_conservative_hz ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {result.deterministic_metrics.in_conservative_hz ? 'Inside HZ' : 'Outside HZ'}
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 font-sans block">Physics Score</span>
                  <span className="text-xl font-bold text-indigo-400 mt-1 block">
                    {result.deterministic_metrics.physics_habitability_score ? result.deterministic_metrics.physics_habitability_score.toFixed(3) : '0.000'}
                  </span>
                </div>
              </div>

              {/* Monte Carlo Uncertainty Distribution Card */}
              <div className="glass-panel rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                  1,000-Run Monte Carlo Gaussian Uncertainty Distribution
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 font-sans block text-[11px]">Score Mean ± Std Dev</span>
                    <span className="text-sm font-bold text-space-cyan">
                      {result.monte_carlo_uncertainty.habitability_score_mean.toFixed(3)} ± {result.monte_carlo_uncertainty.habitability_score_std.toFixed(3)}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 font-sans block text-[11px]">95% Confidence Interval</span>
                    <span className="text-sm font-bold text-emerald-400">
                      [{result.monte_carlo_uncertainty.habitability_score_ci95[0].toFixed(3)}, {result.monte_carlo_uncertainty.habitability_score_ci95[1].toFixed(3)}]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-16 text-center text-slate-500 text-sm">
              <p>Adjust inputs on the left and click "Run Detector & Monte Carlo" to view custom calculations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
