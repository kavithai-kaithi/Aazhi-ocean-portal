import React from 'react';
import heroGlobeVideo from '../assets/hero_globe.mp4';
import { 
  Box, 
  BarChart3, 
  ArrowRight, 
  Waves,
  Database,
  Layers,
  Thermometer,
  Radio,
  ExternalLink,
  Globe,
  Anchor,
  Navigation,
  Compass,
  Droplets,
  Wind,
  CheckCircle2,
  Sparkles,
  Sliders,
  Play
} from 'lucide-react';

export default function HomePage({ onNavigate, setVariable, setDepth, setMonth }) {
  const handleLaunch = (tab, customVar, customDepth, customMonth) => {
    if (customVar && setVariable) setVariable(customVar);
    if (customDepth !== undefined && setDepth) setDepth(customDepth);
    if (customMonth && setMonth) setMonth(customMonth);
    if (onNavigate) onNavigate(tab);
  };

  const VARIABLES_TILES = [
    { id: 'temperature', name: 'Temperature', unit: '°C', icon: Thermometer, color: 'text-amber-400 border-amber-500/30 bg-amber-950/40' },
    { id: 'salinity', name: 'Salinity', unit: 'PSU', icon: Droplets, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40' },
    { id: 'currents', name: 'Current Velocity', unit: 'm/s', icon: Wind, color: 'text-sky-400 border-sky-500/30 bg-sky-950/40' },
    { id: 'chlorophyll', name: 'Chlorophyll', unit: 'mg/m³', icon: Waves, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40' },
    { id: 'ssh', name: 'Sea Surface Height', unit: 'm', icon: Compass, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/40' },
    { id: 'dic', name: 'CO₂ & Carbon (DIC)', unit: 'µatm', icon: Database, color: 'text-purple-400 border-purple-500/30 bg-purple-950/40' },
    { id: 'mld', name: 'Mixed Layer Depth', unit: 'm', icon: Layers, color: 'text-teal-400 border-teal-500/30 bg-teal-950/40' },
  ];

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden bg-[#020a18] text-slate-100 font-sans selection:bg-cyan-500/30 flex flex-col items-center custom-scrollbar">
      
      <div className="relative z-10 w-full max-w-[1440px] px-6 sm:px-10 lg:px-12 py-8 space-y-10 flex flex-col items-center">
        
        {/* ═════════════════════ HERO SECTION WITH FULL VIDEO BACKGROUND ═════════════════════ */}
        <section className="relative w-full rounded-3xl overflow-hidden border border-cyan-500/20 bg-[#020a18] shadow-[0_12px_60px_rgba(0,0,0,0.85)] animate-fade-in-up">
          
          {/* Full Hero Video Background Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Video Element covering the right & center of Hero */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute right-0 top-1/2 -translate-y-1/2 w-full md:w-[65%] h-full object-cover md:object-contain opacity-95 mix-blend-screen"
            >
              <source src={heroGlobeVideo} type="video/mp4" />
            </video>

            {/* Dynamic Multi-Stage Gradient Overlay for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#020a18] via-[#020a18]/80 to-transparent z-[1]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020a18] via-transparent to-[#020a18]/50 z-[1]" />

            {/* Grid scan line texture overlay */}
            <div className="absolute inset-0 opacity-[0.035] z-[1]" style={{
              backgroundImage: 'linear-gradient(rgba(56,189,248,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.2) 1px, transparent 1px)',
              backgroundSize: '36px 36px'
            }} />
          </div>

          <div className="relative z-10 p-8 sm:p-12 lg:p-14 space-y-10 min-h-[460px] flex flex-col justify-between">
            <div className="max-w-xl space-y-6">
              {/* Kicker Badge */}
              <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-glow-pulse" />
                <span className="text-[11px] font-mono font-bold tracking-[0.18em] text-cyan-300">REAL-TIME OCEAN DATA PLATFORM</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-[3rem] font-black text-white font-['Outfit'] tracking-tight leading-[1.12]">
                Exploring the Indian Ocean <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 italic">
                  Through Data
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-[15px] sm:text-[16px] text-slate-300/90 leading-relaxed max-w-lg font-normal">
                Integrated ocean observations, 3D WebGL numerical modeling, and in-situ Argo profiling float measurements across 24 depth layers.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => handleLaunch('viewer')}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-[0_0_28px_rgba(6,182,212,0.5)] hover:shadow-[0_0_36px_rgba(6,182,212,0.7)] hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <Box className="w-4.5 h-4.5" />
                  <span>Explore 3D Ocean</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                <button
                  onClick={() => handleLaunch('validation')}
                  className="px-5 py-3.5 rounded-xl bg-[#031027]/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 font-bold text-xs sm:text-sm flex items-center gap-2.5 hover:bg-cyan-950/80 hover:border-cyan-400/60 transition-all duration-300 cursor-pointer shadow-lg"
                >
                  <BarChart3 className="w-4.5 h-4.5 text-cyan-400" />
                  <span>Open Validation Hub</span>
                </button>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-4">
              
              {/* Stat 1 */}
              <div 
                onClick={() => handleLaunch('viewer')}
                className="stat-card flex items-center justify-between p-5 rounded-2xl bg-[#031027]/70 backdrop-blur-md border border-cyan-500/15 shadow-xl hover:border-cyan-400/40 hover:bg-[#041638]/85 cursor-pointer group transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-shadow">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-white font-mono leading-none tracking-tight">18.13M</div>
                    <div className="text-[12px] text-slate-400 mt-1.5 font-medium">OpenDrift Records</div>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#020b1e] border border-cyan-500/20 flex items-center justify-center text-slate-500 group-hover:text-cyan-300 group-hover:border-cyan-400/50 transition-all ml-2">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Stat 2 */}
              <div 
                onClick={() => handleLaunch('viewer')}
                className="stat-card flex items-center justify-between p-5 rounded-2xl bg-[#031027]/70 backdrop-blur-md border border-teal-500/15 shadow-xl hover:border-teal-400/40 hover:bg-[#041638]/85 cursor-pointer group transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-950/80 border border-teal-500/30 text-teal-300 group-hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-shadow">
                    <Waves className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-white font-mono leading-none tracking-tight">2025–2026</div>
                    <div className="text-[12px] text-slate-400 mt-1.5 font-medium">Trained Predictions</div>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#020b1e] border border-cyan-500/20 flex items-center justify-center text-slate-500 group-hover:text-teal-300 group-hover:border-teal-400/50 transition-all ml-2">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Stat 3 */}
              <div 
                onClick={() => handleLaunch('viewer')}
                className="stat-card flex items-center justify-between p-5 rounded-2xl bg-[#031027]/70 backdrop-blur-md border border-amber-500/15 shadow-xl hover:border-amber-400/40 hover:bg-[#041638]/85 cursor-pointer group transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-300 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-shadow">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-amber-200 font-mono leading-none tracking-tight">24 Levels</div>
                    <div className="text-[12px] text-slate-400 mt-1.5 font-medium">0m to 2000m Depth</div>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#020b1e] border border-cyan-500/20 flex items-center justify-center text-slate-500 group-hover:text-amber-300 group-hover:border-amber-400/50 transition-all ml-2">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Stat 4 */}
              <div 
                onClick={() => handleLaunch('validation')}
                className="stat-card flex items-center justify-between p-5 rounded-2xl bg-[#031027]/70 backdrop-blur-md border border-purple-500/15 shadow-xl hover:border-purple-400/40 hover:bg-[#041638]/85 cursor-pointer group transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-300 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-shadow">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-white font-mono leading-none tracking-tight">&lt; 0.45°C</div>
                    <div className="text-[12px] text-slate-400 mt-1.5 font-medium">Mean Model RMSE</div>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#020b1e] border border-cyan-500/15 flex items-center justify-center text-slate-600 group-hover:text-purple-300 group-hover:border-purple-400/40 transition-all ml-2">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          </div>

        </section>


        {/* ═════════════════════ CORE PLATFORM WORKSPACES ═════════════════════ */}
        <section className="space-y-7 w-full flex flex-col items-center animate-fade-in-up" style={{animationDelay: '0.1s'}}>
          
          <div className="flex flex-col items-center space-y-3 text-center w-full">
            <div className="flex items-center gap-5 w-full max-w-xl">
              <span className="section-line" />
              <div className="flex items-center gap-3 shrink-0">
                <Waves className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
                  Core Platform Workspaces
                </h2>
              </div>
              <span className="section-line" />
            </div>
            <p className="text-[13px] text-slate-400 max-w-lg leading-relaxed font-sans">
              Interactive 3D volumetric slicing, vertical water column profiling, and quantitative accuracy metrics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            
            {/* Workspace 1: 3D Volumetric Slicer */}
            <div 
              onClick={() => handleLaunch('viewer')}
              className="stat-card p-7 lg:p-8 rounded-2xl bg-[#04122d]/70 border border-cyan-500/12 hover:border-cyan-400/35 cursor-pointer shadow-xl flex items-center justify-between group backdrop-blur-sm"
            >
              <div className="space-y-5 max-w-[60%]">
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/25 text-cyan-300 group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(6,182,212,0.4)] transition-all duration-300">
                    <Box className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-['Outfit'] group-hover:text-cyan-300 transition-colors tracking-tight">
                    3D Volumetric Ocean Slicer
                  </h3>
                </div>

                <p className="text-[13px] text-slate-300/80 leading-[1.7]">
                  Interactive 3D WebGL cutting planes rendering continuous depth stratification, laser isotherms, high-resolution seabed bathymetry, and live Argo float CTD profile matchups.
                </p>

                <div className="flex items-center gap-2.5 text-[13px] font-bold text-cyan-300 pt-1 group-hover:translate-x-2 transition-transform duration-300">
                  <span>Launch 3D Ocean Slicer</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* 3D Preview Graphic */}
              <div className="w-[34%] flex items-center justify-center pl-4">
                <svg viewBox="0 0 160 120" className="w-full h-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:scale-105 transition-transform duration-500">
                  <polygon points="80,15 145,45 80,75 15,45" fill="#0284c7" opacity="0.5" stroke="#38bdf8" strokeWidth="1.2" />
                  <polygon points="80,35 145,65 80,95 15,65" fill="#0369a1" opacity="0.6" stroke="#38bdf8" strokeWidth="1.2" />
                  <polygon points="80,55 145,85 80,115 15,85" fill="#075985" opacity="0.7" stroke="#38bdf8" strokeWidth="1.2" />
                  <line x1="80" y1="15" x2="80" y2="115" stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="80" cy="15" r="3.5" fill="#facc15" />
                  <circle cx="80" cy="55" r="3.5" fill="#facc15" />
                  <circle cx="80" cy="115" r="3.5" fill="#facc15" />
                </svg>
              </div>
            </div>

            {/* Workspace 2: Validation Hub */}
            <div 
              onClick={() => handleLaunch('validation')}
              className="stat-card p-7 lg:p-8 rounded-2xl bg-[#04122d]/70 border border-emerald-500/12 hover:border-emerald-400/35 cursor-pointer shadow-xl flex items-center justify-between group backdrop-blur-sm"
            >
              <div className="space-y-5 max-w-[60%]">
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-500/25 text-emerald-300 group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] transition-all duration-300">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-['Outfit'] group-hover:text-emerald-300 transition-colors tracking-tight">
                    Validation & Analytics Hub
                  </h3>
                </div>

                <p className="text-[13px] text-slate-300/80 leading-[1.7]">
                  Comprehensive statistical benchmarking suite with Model vs In-Situ scatter comparisons, Taylor skill diagrams, depth-wise RMSE charts, and station validation tables across INCOIS, AOML, and CSIRO.
                </p>

                <div className="flex items-center gap-2.5 text-[13px] font-bold text-emerald-300 pt-1 group-hover:translate-x-2 transition-transform duration-300">
                  <span>Open Validation Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Chart Preview */}
              <div className="w-[34%] flex items-center justify-center pl-4">
                <svg viewBox="0 0 160 120" className="w-full h-auto drop-shadow-[0_0_20px_rgba(52,211,153,0.35)] group-hover:scale-105 transition-transform duration-500">
                  <line x1="20" y1="100" x2="140" y2="100" stroke="#1e293b" strokeWidth="1" />
                  <line x1="20" y1="20" x2="20" y2="100" stroke="#1e293b" strokeWidth="1" />
                  <polyline points="25,90 45,75 70,60 95,40 120,25 135,15" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="25" cy="90" r="4" fill="#2dd4bf" />
                  <circle cx="45" cy="75" r="4" fill="#2dd4bf" />
                  <circle cx="70" cy="60" r="4" fill="#2dd4bf" />
                  <circle cx="95" cy="40" r="4" fill="#2dd4bf" />
                  <circle cx="120" cy="25" r="4" fill="#2dd4bf" />
                  <circle cx="135" cy="15" r="4" fill="#2dd4bf" />
                </svg>
              </div>
            </div>

          </div>
        </section>


        {/* ═════════════════════ EXPLORE OCEAN VARIABLES (SECTION 11) ═════════════════════ */}
        <section className="space-y-6 w-full animate-fade-in-up" style={{animationDelay: '0.14s'}}>
          <div className="flex flex-col items-center space-y-2 text-center w-full">
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-3">
              <Compass className="w-5 h-5 text-cyan-400" />
              Explore Ocean Variables
            </h2>
            <p className="text-xs text-slate-400 max-w-md">
              Select an ocean variable to launch directly into 3D scene analysis
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            {VARIABLES_TILES.map((tile) => {
              const Icon = tile.icon;
              return (
                <button
                  key={tile.id}
                  onClick={() => handleLaunch('viewer', tile.id)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${tile.color} shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group`}
                >
                  <Icon className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
                  <div className="text-left">
                    <div className="text-sm font-bold text-white font-['Outfit'] leading-tight">{tile.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 font-semibold">{tile.unit}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>


        {/* ═════════════════════ HOW TO EXPLORE (SECTION 12) ═════════════════════ */}
        <section className="space-y-7 w-full animate-fade-in-up" style={{animationDelay: '0.18s'}}>
          <div className="flex flex-col items-center space-y-2 text-center w-full">
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
              How to Explore AAZHI
            </h2>
            <p className="text-xs text-slate-400">Three simple steps to oceanographic data discovery</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            
            {/* Step 1 */}
            <div className="p-7 rounded-2xl bg-[#04122d]/70 border border-cyan-500/15 space-y-4 shadow-lg text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-black font-mono text-lg flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.3)]">
                01
              </div>
              <h3 className="text-base font-bold text-white font-['Outfit']">Select Variable</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose from Temperature, Salinity, Current Velocity, Chlorophyll, or Sea Surface Height.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-7 rounded-2xl bg-[#04122d]/70 border border-cyan-500/15 space-y-4 shadow-lg text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-black font-mono text-lg flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.3)]">
                02
              </div>
              <h3 className="text-base font-bold text-white font-['Outfit']">Explore Depth & Time</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use the vertical depth slider (0-2000m) and monthly timeline to inspect water column stratification.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-7 rounded-2xl bg-[#04122d]/70 border border-cyan-500/15 space-y-4 shadow-lg text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-black font-mono text-lg flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.3)]">
                03
              </div>
              <h3 className="text-base font-bold text-white font-['Outfit']">Compare & Analyze</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect live float CTD profile matchups, calculate Mean Bias and RMSE, and view Taylor skill diagrams.
              </p>
            </div>

          </div>
        </section>


        {/* ═════════════════════ FOOTER ═════════════════════ */}
        <footer className="w-full pt-8 pb-6 border-t border-white/6 flex flex-wrap items-center justify-between gap-4 text-[12px] text-slate-400/80 font-mono">
          <div className="flex items-center gap-3 text-slate-300">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">AAZHI</span>
            <span className="text-slate-500">- Indian Ocean Numerical Model & Argo In-Situ Validation Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-3.5 text-slate-500">
            <span>Argo GDAC</span>
            <span className="text-slate-700">•</span>
            <span>Copernicus CMEMS</span>
            <span className="text-slate-700">•</span>
            <span>INCOIS</span>
            <span className="text-slate-700">•</span>
            <span>NOAA AOML</span>
            <span className="text-slate-700">•</span>
            <span>CSIRO</span>
          </div>
        </footer>

      </div>

    </div>
  );
}
