import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Eye, Layers, Compass, ExternalLink, Activity, Info } from 'lucide-react';
import { fetchSystemOrbit, fetchFeaturedSystems, SystemOrbitResponse, FeaturedSystem, OrbitPlanet } from '../services/api';

interface OrbitVisualizerProps {
  initialHostname?: string;
  selectedPlanetName?: string;
  onSelectPlanet?: (planetName: string) => void;
}

export const OrbitVisualizer: React.FC<OrbitVisualizerProps> = ({
  initialHostname = 'TRAPPIST-1',
  selectedPlanetName,
  onSelectPlanet
}) => {
  const [featuredSystems, setFeaturedSystems] = useState<FeaturedSystem[]>([]);
  const [currentHostname, setCurrentHostname] = useState<string>(initialHostname);
  const [systemData, setSystemData] = useState<SystemOrbitResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Animation & Control State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [showHZ, setShowHZ] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [scaleMode, setScaleMode] = useState<'adaptive' | 'linear'>('adaptive');
  const [highlightedPlanet, setHighlightedPlanet] = useState<OrbitPlanet | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const anglesRef = useRef<{ [plName: string]: number }>({});
  const lastTimeRef = useRef<number>(performance.now());

  // Load featured systems list
  useEffect(() => {
    fetchFeaturedSystems()
      .then(res => setFeaturedSystems(res))
      .catch(err => console.error("Failed to load featured systems", err));
  }, []);

  // Sync initialHostname if changed
  useEffect(() => {
    if (initialHostname) {
      setCurrentHostname(initialHostname);
    }
  }, [initialHostname]);

  // Load system orbit data
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSystemOrbit(currentHostname)
      .then(data => {
        setSystemData(data);
        setLoading(false);
        // Initialize orbital angles randomly or based on index
        const initialAngles: { [key: string]: number } = {};
        data.planets.forEach((p, idx) => {
          initialAngles[p.pl_name] = (idx * (360 / Math.max(1, data.planets.length))) % 360;
        });
        anglesRef.current = initialAngles;

        // Auto-highlight initial planet if matched
        if (selectedPlanetName) {
          const match = data.planets.find(p => p.pl_name.toLowerCase() === selectedPlanetName.toLowerCase());
          if (match) setHighlightedPlanet(match);
          else if (data.planets.length > 0) setHighlightedPlanet(data.planets[0]);
        } else if (data.planets.length > 0) {
          setHighlightedPlanet(data.planets[0]);
        }
      })
      .catch(err => {
        console.error("System orbit error:", err);
        setError(`Could not load orbit data for ${currentHostname}`);
        setLoading(false);
      });
  }, [currentHostname]);

  // Main Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !systemData || !systemData.found) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      if (isPlaying) {
        // Update angles
        systemData.planets.forEach(p => {
          // speed factor based on relative_speed (orbits per Earth year)
          // 1 earth year = 20 seconds in simulation at 1x speed
          const degPerSec = (360 / 20) * p.relative_speed * speed;
          anglesRef.current[p.pl_name] = (anglesRef.current[p.pl_name] + degPerSec * dt) % 360;
        });
      }

      // Handle retina canvas scaling
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const centerX = width / 2;
      const centerY = viewMode === '3d' ? height * 0.52 : height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw background space particles
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Determine scale factor for semi-major axis in AU to canvas pixels
      const maxAU = systemData.planets.length > 0 
        ? Math.max(...systemData.planets.map(p => p.semi_major_axis_au), systemData.hz_boundaries.optimistic_outer_au * 1.1)
        : 1.0;
      
      const maxRadiusPx = Math.min(width, height) * 0.42;

      const auToPx = (au: number) => {
        if (scaleMode === 'linear') {
          return Math.max(25, (au / maxAU) * maxRadiusPx);
        } else {
          // Adaptive / Log-like scaling for multi-planet systems with huge AU span
          const ratio = au / maxAU;
          return Math.max(30, Math.pow(ratio, 0.65) * maxRadiusPx);
        }
      };

      const tiltY = viewMode === '3d' ? 0.38 : 1.0; // Y compression for 3D isometric view

      // 1. Draw Habitable Zone Bands
      if (showHZ && systemData.hz_boundaries) {
        const hz = systemData.hz_boundaries;
        const optInPx = auToPx(hz.optimistic_inner_au);
        const conInPx = auToPx(hz.conservative_inner_au);
        const conOutPx = auToPx(hz.conservative_outer_au);
        const optOutPx = auToPx(hz.optimistic_outer_au);

        // Optimistic HZ region (outer teal band)
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, optOutPx, optOutPx * tiltY, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX, centerY, optInPx, optInPx * tiltY, 0, Math.PI * 2, 0, true);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.fill();

        // Conservative HZ region (inner green band)
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, conOutPx, conOutPx * tiltY, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX, centerY, conInPx, conInPx * tiltY, 0, Math.PI * 2, 0, true);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
        ctx.fill();
        ctx.restore();

        // HZ Border Rings
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, conInPx, conInPx * tiltY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, conOutPx, conOutPx * tiltY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Draw Planet Orbits
      systemData.planets.forEach(p => {
        const rPx = auToPx(p.semi_major_axis_au);
        const isHighlighted = highlightedPlanet?.pl_name === p.pl_name;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, rPx, rPx * tiltY, 0, 0, Math.PI * 2);
        ctx.lineWidth = isHighlighted ? 2.5 : 1;
        ctx.strokeStyle = isHighlighted
          ? 'rgba(56, 189, 248, 0.9)'
          : (p.is_in_conservative_hz ? 'rgba(16, 185, 129, 0.35)' : 'rgba(148, 163, 184, 0.2)');
        ctx.stroke();
        ctx.restore();
      });

      // 3. Draw Host Star
      const starTeff = systemData.star.st_teff || 5778;
      let starGlowColor = 'rgba(234, 179, 8, 0.8)'; // G-type yellow
      let starCenterColor = '#fef08a';
      if (starTeff < 3700) {
        starGlowColor = 'rgba(239, 68, 68, 0.85)'; // Red Dwarf M-type
        starCenterColor = '#fca5a5';
      } else if (starTeff < 5200) {
        starGlowColor = 'rgba(249, 115, 22, 0.85)'; // K-type orange
        starCenterColor = '#fed7aa';
      } else if (starTeff > 7500) {
        starGlowColor = 'rgba(99, 102, 241, 0.85)'; // A/B-type blue
        starCenterColor = '#c7d2fe';
      }

      const starRadius = Math.max(12, Math.min(24, 14 * (systemData.star.st_rad || 1.0)));

      ctx.save();
      // Star Outer Glow
      const grad = ctx.createRadialGradient(centerX, centerY, starRadius * 0.2, centerX, centerY, starRadius * 2.5);
      grad.addColorStop(0, starGlowColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Star Center Body
      ctx.beginPath();
      ctx.arc(centerX, centerY, starRadius, 0, Math.PI * 2);
      ctx.fillStyle = starCenterColor;
      ctx.fill();

      // Label Star
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(systemData.star.hostname || 'Host Star', centerX, centerY + starRadius + 14);
      ctx.restore();

      // 4. Draw Planets and Orbital Motion
      systemData.planets.forEach(p => {
        const rPx = auToPx(p.semi_major_axis_au);
        const angleRad = (anglesRef.current[p.pl_name] || 0) * (Math.PI / 180);

        const px = centerX + rPx * Math.cos(angleRad);
        const py = centerY + rPx * tiltY * Math.sin(angleRad);

        const isHighlighted = highlightedPlanet?.pl_name === p.pl_name;

        // Draw Planet Trail
        if (showTrails) {
          ctx.save();
          ctx.beginPath();
          const trailAngle = 0.35; // radians back
          const startAngle = angleRad - trailAngle;
          ctx.ellipse(centerX, centerY, rPx, rPx * tiltY, 0, startAngle, angleRad);
          ctx.lineWidth = Math.max(3, (p.pl_rade || 1) * 2);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.3;
          ctx.stroke();
          ctx.restore();
        }

        // Draw Planet Body
        const bodyRadius = Math.max(4, Math.min(10, 4 * Math.sqrt(p.pl_rade || 1.0)));

        ctx.save();
        if (isHighlighted) {
          // Highlight Ring
          ctx.beginPath();
          ctx.arc(px, py, bodyRadius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(px, py, bodyRadius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isHighlighted ? 12 : 6;
        ctx.fill();

        // Planet Label
        ctx.font = isHighlighted ? 'bold 12px sans-serif' : '10px sans-serif';
        ctx.fillStyle = isHighlighted ? '#38bdf8' : '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(p.pl_name, px, py - bodyRadius - 6);

        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [systemData, isPlaying, speed, viewMode, showHZ, showTrails, scaleMode, highlightedPlanet]);

  // Handle Canvas Click to Select Planet
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !systemData || !systemData.found) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = viewMode === '3d' ? height * 0.52 : height / 2;
    const tiltY = viewMode === '3d' ? 0.38 : 1.0;

    const maxAU = Math.max(...systemData.planets.map(p => p.semi_major_axis_au), systemData.hz_boundaries.optimistic_outer_au * 1.1);
    const maxRadiusPx = Math.min(width, height) * 0.42;

    const auToPx = (au: number) => {
      if (scaleMode === 'linear') {
        return Math.max(25, (au / maxAU) * maxRadiusPx);
      } else {
        const ratio = au / maxAU;
        return Math.max(30, Math.pow(ratio, 0.65) * maxRadiusPx);
      }
    };

    let closestPlanet: OrbitPlanet | null = null;
    let minDist = 25; // click threshold

    systemData.planets.forEach(p => {
      const rPx = auToPx(p.semi_major_axis_au);
      const angleRad = (anglesRef.current[p.pl_name] || 0) * (Math.PI / 180);
      const px = centerX + rPx * Math.cos(angleRad);
      const py = centerY + rPx * tiltY * Math.sin(angleRad);

      const dist = Math.hypot(clickX - px, clickY - py);
      if (dist < minDist) {
        minDist = dist;
        closestPlanet = p;
      }
    });

    if (closestPlanet) {
      setHighlightedPlanet(closestPlanet);
      if (onSelectPlanet) {
        onSelectPlanet(closestPlanet.pl_name);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-200">
      {/* Visualizer Header Controls */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Compass className="w-6 h-6 text-emerald-400" />
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Multi-Planet System Orbit Visualizer
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Keplerian Physics
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 2D/3D orbital dynamics with Kopparapu Habitable Zone boundaries
            </p>
          </div>
        </div>

        {/* System Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-medium">Select System:</label>
          <select
            value={currentHostname}
            onChange={(e) => setCurrentHostname(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {featuredSystems.map(sys => (
              <option key={sys.hostname} value={sys.hostname}>
                {sys.hostname} ({sys.total_planets} planets{sys.habitable_candidates > 0 ? ` • ${sys.habitable_candidates} in HZ` : ''})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Interactive Canvas Container */}
      <div className="relative w-full h-[480px] bg-slate-950 flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80">
            <div className="flex items-center space-x-3 text-emerald-400">
              <Activity className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Calculating Keplerian Orbit Parameters...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 text-red-400 p-6 text-center">
            <div>
              <p className="font-semibold">{error}</p>
              <button
                onClick={() => setCurrentHostname(initialHostname)}
                className="mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg"
              >
                Reset System
              </button>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-pointer"
        />

        {/* Canvas Legend & Controls Overlay */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg backdrop-blur-md">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title={isPlaying ? "Pause Animation" : "Play Animation"}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-emerald-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Speed Slider */}
          <div className="flex items-center space-x-1.5 px-2 border-l border-slate-800">
            <span className="text-xs text-slate-400">Speed:</span>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-16 accent-emerald-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-emerald-400 w-8 text-right font-mono">{speed.toFixed(1)}x</span>
          </div>

          {/* View Mode (2D / 3D) */}
          <div className="flex items-center space-x-1 px-2 border-l border-slate-800">
            <button
              onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
              className={`px-2 py-1 text-xs rounded font-medium transition ${
                viewMode === '3d' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {viewMode === '3d' ? '3D Tilt' : '2D Top'}
            </button>
          </div>

          {/* HZ Highlight Toggle */}
          <button
            onClick={() => setShowHZ(!showHZ)}
            className={`px-2 py-1 text-xs rounded font-medium transition flex items-center space-x-1 ${
              showHZ ? 'bg-emerald-600/80 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>HZ Zone</span>
          </button>

          {/* Scale Mode Toggle */}
          <button
            onClick={() => setScaleMode(scaleMode === 'adaptive' ? 'linear' : 'adaptive')}
            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Scale: {scaleMode === 'adaptive' ? 'Adaptive' : 'Linear'}
          </button>
        </div>

        {/* Top Right HZ Key Banner */}
        <div className="absolute top-3 right-3 z-10 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs backdrop-blur-md hidden sm:block">
          <div className="font-semibold text-slate-300 mb-1">Habitable Zone Boundaries</div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-400"></span>
            <span>Conservative HZ ({systemData?.hz_boundaries?.conservative_inner_au || 0} - {systemData?.hz_boundaries?.conservative_outer_au || 0} AU)</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400 mt-1">
            <span className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-400"></span>
            <span>Optimistic HZ ({systemData?.hz_boundaries?.optimistic_inner_au || 0} - {systemData?.hz_boundaries?.optimistic_outer_au || 0} AU)</span>
          </div>
        </div>
      </div>

      {/* Selected Planet Detail Card */}
      {highlightedPlanet && (
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: highlightedPlanet.color }}
              ></div>
              <div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  {highlightedPlanet.pl_name}
                  {highlightedPlanet.is_in_conservative_hz && (
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Conservative HZ Candidate
                    </span>
                  )}
                  {highlightedPlanet.is_in_optimistic_hz && !highlightedPlanet.is_in_conservative_hz && (
                    <span className="bg-cyan-950 text-cyan-400 border border-cyan-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      Optimistic HZ Candidate
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400">
                  {highlightedPlanet.radius_class} • {highlightedPlanet.relative_speed.toFixed(2)} orbits / Earth year
                </p>
              </div>
            </div>

            {/* Quick Parameter Grid */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Semi-Major Axis</span>
                <span className="font-bold text-indigo-400">{highlightedPlanet.semi_major_axis_au} AU</span>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Orbital Period</span>
                <span className="font-bold text-amber-400">{highlightedPlanet.pl_orbper.toFixed(2)} days</span>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Planet Radius</span>
                <span className="font-bold text-cyan-400">{highlightedPlanet.pl_rade.toFixed(2)} R⊕</span>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Habitability Score</span>
                <span className="font-bold text-emerald-400">
                  {(highlightedPlanet.composite_habitability_score * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {onSelectPlanet && (
              <button
                onClick={() => onSelectPlanet(highlightedPlanet.pl_name)}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-lg transition font-medium"
              >
                <span>Inspect Planet Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
