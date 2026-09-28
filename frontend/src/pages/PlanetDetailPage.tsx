import React, { useState, useEffect } from 'react';
import { fetchCandidateDetails, PlanetDetailsResponse } from '../services/api';
import { ArrowLeft, ExternalLink, ShieldCheck, Globe, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  planetName: string;
  onBack: () => void;
}

export const PlanetDetailPage: React.FC<Props> = ({ planetName, onBack }) => {
  const [data, setData] = useState<PlanetDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const details = await fetchCandidateDetails(planetName);
        setData(details);
      } catch (err: any) {
        setError(err.message || 'Failed to load planet details');
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [planetName]);

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-16 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-space-cyan" />
        <p>Querying NASA Exoplanet Archive TAP & Gemini Search Grounding...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-rose-400 space-y-4">
        <AlertTriangle className="w-8 h-8 mx-auto" />
        <p>{error || 'Planet details unavailable'}</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-800 text-slate-200 rounded text-sm hover:bg-slate-700">
          ← Back to Candidates
        </button>
      </div>
    );
  }

  const p = data.authoritative_parameters;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-space-cyan hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Candidates List
      </button>

      {/* Header Info Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-space-cyan flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{data.planet_name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Host Star: <strong className="text-slate-200">{data.hostname}</strong> | Discovery: {p.disc_year || 'N/A'} ({p.discoverymethod || 'Transit'})
          </p>
        </div>

        <div className="flex gap-2">
          <span className="px-3 py-1 bg-space-cyan/10 border border-space-cyan/30 text-space-cyan text-xs font-semibold rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> NASA TAP Source of Truth
          </span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Authoritative Parameters Table */}
        <div className="lg:col-span-1 glass-panel rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
            Authoritative Numbers (NASA Archive)
          </h2>

          <div className="space-y-2.5 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500 font-sans">Planet Radius</span>
              <span className="font-bold text-slate-200">{p.pl_rade ? `${p.pl_rade.toFixed(2)} R⊕` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500 font-sans">Orbital Period</span>
              <span className="font-bold text-slate-200">{p.pl_orbper ? `${p.pl_orbper.toFixed(2)} days` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500 font-sans">Insolation Flux</span>
              <span className="font-bold text-slate-200">{p.pl_insol ? `${p.pl_insol.toFixed(2)} S⊕` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500 font-sans">Equilibrium Temp</span>
              <span className="font-bold text-slate-200">{p.pl_eqt ? `${p.pl_eqt.toFixed(1)} K` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500 font-sans">Stellar Teff</span>
              <span className="font-bold text-slate-200">{p.st_teff ? `${p.st_teff.toFixed(0)} K` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500 font-sans">Stellar Radius</span>
              <span className="font-bold text-slate-200">{p.st_rad ? `${p.st_rad.toFixed(2)} R☉` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500 font-sans">Stellar Mass</span>
              <span className="font-bold text-slate-200">{p.st_mass ? `${p.st_mass.toFixed(2)} M☉` : 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500 font-sans">Distance</span>
              <span className="font-bold text-slate-200">{p.sy_dist ? `${p.sy_dist.toFixed(1)} pc` : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Web Search Grounding & Context */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Globe className="w-4 h-4 text-space-cyan" /> Descriptive Context & News (Gemini Search Grounding)
            </h2>

            <div className="text-sm text-slate-300 leading-relaxed space-y-3 font-sans">
              <p>{data.descriptive_context}</p>
            </div>

            {/* Citations & Source Links */}
            {data.citations && data.citations.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  Grounding Citations & Sources
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.citations.map((cite, i) => (
                    <a
                      key={i}
                      href={cite.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-700 text-space-cyan px-2.5 py-1 rounded border border-slate-700 transition-colors"
                    >
                      <span>{cite.title || 'Source Link'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conflict Resolution Policy Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Conflict Resolution Policy</p>
            <p>{data.conflict_resolution_policy}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
