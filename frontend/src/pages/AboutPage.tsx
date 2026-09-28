import React from 'react';
import { BookOpen, ShieldAlert, Database, ExternalLink, Code } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-space-cyan" /> Methodology, Citations & Limitations
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Detailed scientific background, multi-stage architecture overview, data provenance, and scientific caveats.
        </p>
      </div>

      {/* Critical Scientific Disclaimer */}
      <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-5 text-amber-200 text-xs md:text-sm space-y-2">
        <h2 className="font-bold flex items-center gap-2 text-amber-400 text-base">
          <ShieldAlert className="w-5 h-5" /> Critical Scientific Caveats & Framing
        </h2>
        <ul className="list-disc list-inside space-y-1.5 leading-relaxed text-amber-200/90">
          <li><strong>ExoMiner Scope:</strong> NASA ExoMiner and ExoMiner++ classify transit signals (probability of a real planet vs a false positive). ExoMiner does <em>not</em> predict or measure habitability.</li>
          <li><strong>Potential Habitability:</strong> All scores produced by this system represent computed <em>potential habitability estimates</em> with uncertainty based on physical parameters (flux, radius, temperature). They are <strong>never</strong> confirmation of habitability, liquid water, or life.</li>
        </ul>
      </div>

      {/* 2-Stage System Overview */}
      <div className="glass-panel rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">
          Multi-Stage Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-300">
          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="font-semibold text-space-cyan text-sm">Stage 1 — Signal Validation</h3>
            <p>
              Pre-computed ExoMiner++ scores from the TESS vetting catalog on Zenodo provide the probability P(real planet) that an observed transit signal is a true exoplanet candidate rather than a false positive (astrophysical or instrumental noise).
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 space-y-2">
            <h3 className="font-semibold text-emerald-400 text-sm">Stage 2 — Habitability Scoring</h3>
            <p>
              Physical parameters fetched from the NASA Exoplanet Archive are processed through Kopparapu et al. (2013/2014) polynomial Habitable Zone models, Bond albedo equilibrium temperature calculations, and a supervised Gradient Boosted Tree classifier.
            </p>
          </div>
        </div>
      </div>

      {/* Acknowledgements & Citations */}
      <div className="glass-panel rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">
          Acknowledgements & Data Sources
        </h2>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <Database className="w-4 h-4 text-space-cyan shrink-0 mt-0.5" />
            <div>
              <strong>NASA Exoplanet Archive:</strong> Sourced via TAP service (`pscomppars` table). Operated by the California Institute of Technology under contract with NASA under the Exoplanet Exploration Program.
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Code className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>ExoMiner & ExoMiner++:</strong> Developed by Hamann et al. / NASA Ames Research Center. Zenodo DOI: 10.5281/zenodo.15466292.
            </div>
          </div>

          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong>Kopparapu et al. (2013/2014) HZ Models:</strong> <em>Habitable Zones Around Main-Sequence Stars: New Estimates</em>. The Astrophysical Journal, 765(2), 131.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
