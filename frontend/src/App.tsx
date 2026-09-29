import React, { useState } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { RankedCandidatesPage } from './pages/RankedCandidatesPage';
import { PlanetDetailPage } from './pages/PlanetDetailPage';
import { ChatPage } from './pages/ChatPage';
import { DetectorPage } from './pages/DetectorPage';
import { AboutPage } from './pages/AboutPage';
import { OrbitVisualizer } from './components/OrbitVisualizer';
import { Globe, Bot, Cpu, BookOpen, Sparkles, Compass } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'candidates' | 'detail' | 'orbits' | 'chat' | 'detector' | 'about'>('candidates');
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  const handleSelectPlanet = (name: string) => {
    setSelectedPlanet(name);
    setActiveTab('detail');
  };

  return (
    <div className="min-h-screen flex flex-col bg-space-900 text-slate-100">
      {/* Persistent Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Navigation Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('candidates')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-space-cyan to-space-purple flex items-center justify-center shadow-lg shadow-space-cyan/20 group-hover:scale-105 transition-transform">
              <span className="text-xl">🪐</span>
            </div>
            <div>
              <span className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
                ExoHub <Sparkles className="w-3.5 h-3.5 text-space-cyan" />
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono">Habitability Explorer</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'candidates' ? 'bg-space-cyan/20 text-space-cyan border border-space-cyan/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Candidates
            </button>

            <button
              onClick={() => setActiveTab('orbits')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'orbits' ? 'bg-space-cyan/20 text-space-cyan border border-space-cyan/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Orbit Visualizer
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'chat' ? 'bg-space-cyan/20 text-space-cyan border border-space-cyan/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> AI Chatbot
            </button>

            <button
              onClick={() => setActiveTab('detector')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'detector' ? 'bg-space-cyan/20 text-space-cyan border border-space-cyan/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Custom Detector
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'about' ? 'bg-space-cyan/20 text-space-cyan border border-space-cyan/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> About & Methods
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'candidates' && (
          <RankedCandidatesPage onSelectCandidate={handleSelectPlanet} />
        )}

        {activeTab === 'orbits' && (
          <OrbitVisualizer
            initialHostname="TRAPPIST-1"
            onSelectPlanet={handleSelectPlanet}
          />
        )}

        {activeTab === 'detail' && selectedPlanet && (
          <PlanetDetailPage
            planetName={selectedPlanet}
            onBack={() => setActiveTab('candidates')}
            onSelectPlanet={handleSelectPlanet}
          />
        )}

        {activeTab === 'chat' && <ChatPage />}

        {activeTab === 'detector' && <DetectorPage />}

        {activeTab === 'about' && <AboutPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        ExoHub Habitability Explorer | Sourced from NASA Exoplanet Archive & ExoMiner++ Zenodo Catalog
      </footer>
    </div>
  );
};

