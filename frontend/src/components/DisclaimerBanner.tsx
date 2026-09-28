import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2.5 text-xs md:text-sm text-amber-200/90 flex items-center justify-center gap-2 text-center backdrop-blur-md">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        <strong>Scientific Framing Note:</strong> ExoMiner classifies transit signals (real planet vs false positive), not habitability. Habitability scores are computed <em>potential habitability</em> estimates with uncertainty, never confirmation of habitability or life.
      </span>
    </div>
  );
};
