import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage.jsx';
import Viewer from './components/Viewer.jsx';
import Analytics from './components/Analytics.jsx';
import Breadcrumbs from './components/Breadcrumbs.jsx';
import GlobalSearchModal from './components/GlobalSearchModal.jsx';
import KeyboardShortcutsDrawer from './components/KeyboardShortcutsDrawer.jsx';
import DemoModeOverlay from './components/DemoModeOverlay.jsx';
import { COLORMAPS, gradientCss } from './lib/colormap.js';

import { 
  Box, 
  BarChart3, 
  Maximize2, 
  Keyboard, 
  X, 
  Home,
  Settings,
  Waves,
  Cog,
  Globe,
  Info,
  ChevronRight,
  Search,
  Tv,
  HelpCircle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Server,
  CloudOff,
  Cloud,
  Palette,
  FileSpreadsheet,
  FileCode,
  FileJson,
  Zap,
  Power,
  Layers
} from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Overview', icon: Home },
  { id: 'viewer', label: '3D Ocean Slicer', icon: Box },
  { id: 'validation', label: 'Validation & Analysis', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/* ═══════════════════════════════════════════════════════════════════ */
/* Settings Page Component                                             */
/* ═══════════════════════════════════════════════════════════════════ */
function SettingsPage({ 
  onOpenKeybinds, 
  onNavigate,
  activeColormap,
  setActiveColormap,
  fogEnabled,
  setFogEnabled,
  bathymetryRes,
  setBathymetryRes
}) {
  const [antiAliasing, setAntiAliasing] = useState(true);

  // Data Endpoint Connection States
  const [endpoints, setEndpoints] = useState([
    { id: 'glorys', label: 'Copernicus CMEMS GLORYS12V1 API', desc: '1/12° NEMO Ocean Physics Reanalysis (Primary)', connected: true },
    { id: 'argo', label: 'Argo GDAC Float Index Archive', desc: '414,727 Global float CTD profiles', connected: true },
    { id: 'incois', label: 'INCOIS BIO ROMS Endpoint', desc: '40-Year reanalysis (1980–2019, 480 Slices)', connected: false },
    { id: 'usgs', label: 'USGS ScienceBase Detrital-Flow', desc: 'Coastal hydrodynamic wave-current model', connected: false },
  ]);

  // Toggle endpoint status
  const toggleEndpoint = (id) => {
    setEndpoints(prev => prev.map(e => e.id === id ? { ...e, connected: !e.connected } : e));
  };

  // Direct Data Export Helpers
  const handleSettingsExportCSV = () => {
    const sampleData = "Depth(m),Temperature(°C),Salinity(PSU)\n0,27.85,34.82\n50,26.40,34.90\n100,21.15,35.12\n500,10.20,34.78\n1000,5.80,34.88\n2000,2.35,34.72";
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(sampleData));
    dlAnchor.setAttribute("download", "AAZHI_IndianOcean_Sliced_Profile_Sample.csv");
    dlAnchor.click();
  };

  const handleSettingsExportJSON = () => {
    const sampleJson = JSON.stringify({
      portal: "AAZHI Ocean Observation Portal",
      region: "Indian Ocean (30°E to 120°E, 30°S to 30°N)",
      active_colormap: activeColormap,
      fog_enabled: fogEnabled,
      depth_levels_m: [0, 50, 100, 200, 500, 1000, 2000],
      variables: ["temperature", "salinity", "currents", "chlorophyll"],
      status: "Operational"
    }, null, 2);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(sampleJson));
    dlAnchor.setAttribute("download", "AAZHI_Platform_Metadata.json");
    dlAnchor.click();
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden bg-[#020a18] text-slate-100 font-sans selection:bg-cyan-500/30 flex flex-col items-center custom-scrollbar">
      <div className="w-full max-w-[1400px] px-6 sm:px-10 py-10 space-y-10">

        {/* Page Header */}
        <div className="space-y-2.5 border-b border-white/8 pb-5">
          <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-3.5">
            <Settings className="w-9 h-9 text-cyan-400" />
            Platform Settings & Optimization
          </h1>
          <p className="text-base text-slate-300 leading-relaxed max-w-2xl font-sans">
            Customize 3D WebGL performance, toggle active data endpoints, select scientific colorbar palettes, and configure export shortcuts.
          </p>
        </div>

        {/* 2 x 2 Fluid Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">

          {/* CARD 1: 3D Performance Optimization */}
          <div className="rounded-2xl bg-[#04122d]/85 border border-cyan-500/20 p-8 sm:p-9 space-y-7 shadow-2xl flex flex-col justify-between">
            <div className="space-y-7">
              <div className="flex items-center gap-4 pb-5 border-b border-white/8">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-['Outfit']">3D Performance & Rendering</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">WebGL acceleration & unobstructed scene options</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* 1. Atmospheric Fog Toggle */}
                <div className="p-4 rounded-xl bg-[#020a18]/70 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
                        {fogEnabled ? <Cloud className="w-4 h-4 text-cyan-400" /> : <CloudOff className="w-4 h-4 text-emerald-400" />}
                        Atmospheric Fog Rendering
                      </div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Disable fog for a 100% clean, unobstructed 3D view of deep ocean strata.
                      </div>
                    </div>
                    <button
                      onClick={() => setFogEnabled(!fogEnabled)}
                      className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition cursor-pointer shrink-0 ${
                        fogEnabled
                          ? 'bg-slate-800 text-slate-300 border border-white/10'
                          : 'bg-emerald-400 text-slate-950 shadow-[0_0_16px_rgba(52,211,153,0.5)] font-extrabold'
                      }`}
                    >
                      {fogEnabled ? 'FOG: ON' : 'FOG: OFF (Clean View)'}
                    </button>
                  </div>
                </div>

                {/* 2. Bathymetry Density */}
                <div className="p-4 rounded-xl bg-[#020a18]/70 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold text-slate-100 font-['Outfit']">Seafloor Bathymetry Density</div>
                      <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Lower grid density eliminates WebGL lag on standard displays.
                      </div>
                    </div>
                    <select
                      value={bathymetryRes}
                      onChange={(e) => setBathymetryRes(e.target.value)}
                      className="bg-[#030d24] text-cyan-300 font-bold font-mono px-3.5 py-2 rounded-xl border border-cyan-500/30 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="65 × 55 (Low)">65 × 55 (Low - Fast)</option>
                      <option value="130 × 110 (Standard)">130 × 110 (Standard - Recommended)</option>
                      <option value="260 × 220 (Ultra)">260 × 220 (High GPU)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Anti-Aliasing Toggle */}
                <div className="p-4 rounded-xl bg-[#020a18]/70 border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-slate-100 font-['Outfit']">Anti-Aliasing (MSAA)</div>
                    <div className="text-xs text-slate-400 mt-0.5">Smooth jagged edges across 3D cutting planes</div>
                  </div>
                  <button
                    onClick={() => setAntiAliasing(!antiAliasing)}
                    className={`px-4 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                      antiAliasing ? 'bg-cyan-400 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 border border-white/8'
                    }`}
                  >
                    {antiAliasing ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Active Data Source Connections */}
          <div className="rounded-2xl bg-[#04122d]/85 border border-amber-500/20 p-8 sm:p-9 space-y-7 shadow-2xl flex flex-col justify-between">
            <div className="space-y-7">
              <div className="flex items-center gap-4 pb-5 border-b border-white/8">
                <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-['Outfit']">Data Source Connections</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">Enable or disconnect background observation endpoints</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {endpoints.map((ep) => (
                  <div
                    key={ep.id}
                    className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                      ep.connected
                        ? 'bg-[#020a18]/80 border-emerald-500/30 shadow-[0_0_16px_rgba(16,185,129,0.15)]'
                        : 'bg-[#020a18]/40 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                        <span>{ep.label}</span>
                        {ep.connected ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                            ● ACTIVE
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                            ○ DISCONNECTED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{ep.desc}</div>
                    </div>

                    <button
                      onClick={() => toggleEndpoint(ep.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition shrink-0 ${
                        ep.connected
                          ? 'bg-slate-900 text-amber-300 border border-amber-500/30 hover:bg-amber-950/60'
                          : 'bg-emerald-400 text-slate-950 font-extrabold shadow-md'
                      }`}
                    >
                      {ep.connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 3: Custom Scientific Color Palettes & Presets */}
          <div className="rounded-2xl bg-[#04122d]/85 border border-purple-500/20 p-8 sm:p-9 space-y-7 shadow-2xl flex flex-col justify-between">
            <div className="space-y-7">
              <div className="flex items-center justify-between pb-5 border-b border-white/8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Outfit']">Custom Colorbar Palettes</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">Linked instantly to 3D WebGL renderer</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-3 py-1 rounded-lg border border-purple-500/30">
                  ACTIVE: {activeColormap.toUpperCase()}
                </span>
              </div>

              {/* Color Palette Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'thermal', name: 'Thermal', desc: 'Temperature & Heat Content' },
                  { id: 'viridis', name: 'Viridis', desc: 'Perceptually Uniform Standard' },
                  { id: 'cividis', name: 'Cividis', desc: 'Colorblind Friendly Gradient' },
                  { id: 'turbo', name: 'Turbo', desc: 'High Dynamic Contrast' },
                  { id: 'plasma', name: 'Plasma', desc: 'Salinity & Density Slices' },
                  { id: 'speed', name: 'Speed', desc: '3D Current Flow Velocity' },
                ].map((palette) => (
                  <button
                    key={palette.id}
                    onClick={() => setActiveColormap(palette.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      activeColormap === palette.id
                        ? 'bg-purple-950/60 border-purple-400/60 shadow-[0_0_16px_rgba(168,85,247,0.3)]'
                        : 'bg-[#020a18]/60 border-white/5 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-['Outfit']">{palette.name}</span>
                      {activeColormap === palette.id && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <div className="h-3 w-full rounded-md shadow-inner" style={{ background: gradientCss(palette.id, 10) }} />
                  </button>
                ))}
              </div>

              {/* Quick Depth Presets */}
              <div className="p-4 rounded-xl bg-[#020a18]/70 border border-white/5 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase">QUICK DEPTH PRESET SHORTCUTS</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Surface (0m)', tab: 'viewer', depth: 0 },
                    { label: '100m Thermocline', tab: 'viewer', depth: 100 },
                    { label: '500m Mesopelagic', tab: 'viewer', depth: 500 },
                    { label: '2000m Abyssal', tab: 'viewer', depth: 2000 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onNavigate && onNavigate(p.tab)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-400 hover:text-slate-950 font-mono text-xs font-bold transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: Direct Data Export Shortcuts */}
          <div className="rounded-2xl bg-[#04122d]/85 border border-emerald-500/20 p-8 sm:p-9 space-y-7 shadow-2xl flex flex-col justify-between">
            <div className="space-y-7">
              <div className="flex items-center gap-4 pb-5 border-b border-white/8">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-['Outfit']">Direct Data Export Shortcuts</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">Download sliced ocean data in standardized formats</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export CSV */}
                <button
                  onClick={handleSettingsExportCSV}
                  className="p-4 rounded-xl bg-[#020a18]/90 border border-emerald-500/25 hover:border-emerald-400/60 transition cursor-pointer flex items-center gap-3.5 group shadow-lg"
                >
                  <div className="p-3 rounded-xl bg-emerald-950/80 text-emerald-400 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white font-['Outfit']">Export CSV Table</div>
                    <div className="text-[11px] text-slate-400 font-mono">Depth profile matchups</div>
                  </div>
                </button>

                {/* Export JSON */}
                <button
                  onClick={handleSettingsExportJSON}
                  className="p-4 rounded-xl bg-[#020a18]/90 border border-cyan-500/25 hover:border-cyan-400/60 transition cursor-pointer flex items-center gap-3.5 group shadow-lg"
                >
                  <div className="p-3 rounded-xl bg-cyan-950/80 text-cyan-400 group-hover:scale-110 transition-transform">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white font-['Outfit']">Export JSON Structure</div>
                    <div className="text-[11px] text-slate-400 font-mono">Full platform metadata</div>
                  </div>
                </button>
              </div>

              {/* Keyboard Shortcuts Drawer Button */}
              <div className="p-4 rounded-xl bg-[#020a18]/70 border border-white/5 flex items-center justify-between gap-4 pt-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-slate-100 font-['Outfit']">Keyboard & Mouse Keybinds</div>
                  <div className="text-xs text-slate-400">View shortcuts drawer for 3D navigation & slicing</div>
                </div>
                <button
                  onClick={onOpenKeybinds}
                  className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition cursor-pointer shrink-0 font-mono"
                >
                  <span>View Keybinds</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function App() {
  const getInitialParams = () => {
    const params = new URLSearchParams(window.location.search);
    let initialTab = 'home';
    if (params.get('tab') && TABS.some(t => t.id === params.get('tab'))) {
      initialTab = params.get('tab');
    }
    return {
      tab: initialTab,
      var: params.get('var') || 'temperature',
      month: params.get('month') || '2023-06',
      depth: params.get('depth') ? parseInt(params.get('depth'), 10) : 0,
    };
  };

  const initialParams = getInitialParams();

  // Centralized Global Portal State Store
  const [activeTab, setActiveTab] = useState(initialParams.tab);
  const [variable, setVariable] = useState(initialParams.var);
  const [depth, setDepth] = useState(initialParams.depth);
  const [month, setMonth] = useState(initialParams.month);

  // Global Centralized Render & Theme State
  const [activeColormap, setActiveColormap] = useState('thermal');
  const [fogEnabled, setFogEnabled] = useState(false);
  const [bathymetryRes, setBathymetryRes] = useState('130 × 110 (Standard)');
  const [selectedStationId, setSelectedStationId] = useState('ARGO-2902745');

  // Modals & Drawers state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isKeybindsOpen, setIsKeybindsOpen] = useState(false);
  const [isDemoModeActive, setIsDemoModeActive] = useState(false);

  // Sync active tab and parameters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    params.set('var', variable);
    params.set('depth', depth.toString());
    params.set('month', month);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [activeTab, variable, depth, month]);

  // Global Keyboard Shortcuts Listener (Ctrl + K / Cmd + K, ?, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '?' && !e.target.matches('input, select, textarea')) {
        e.preventDefault();
        setIsKeybindsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsKeybindsOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleSearchResultSelect = (result) => {
    if (result.tab) setActiveTab(result.tab);
    if (result.var) setVariable(result.var);
    if (result.station) setSelectedStationId(result.station);
  };

  const handleDemoStepNavigate = (step) => {
    if (step.tab) setActiveTab(step.tab);
    if (step.var) setVariable(step.var);
    if (step.depth !== undefined) setDepth(step.depth);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020a18] text-slate-100 font-sans flex flex-col selection:bg-cyan-500/30">
      
      {/* ═════════════════════ TOP NAVIGATION BAR (REFINED LAYOUT & SPACING) ═════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-[#010915]/98 backdrop-blur-2xl shrink-0 shadow-[0_4px_32px_rgba(0,0,0,0.75)]">
        <div className="flex items-center justify-between px-3.5 sm:px-8 lg:px-12 h-[56px] sm:h-[64px] gap-2 sm:gap-6">
          
          {/* Brand Logo & Name (Left) */}
          <div className="flex items-center gap-2.5 sm:gap-4 cursor-pointer group shrink-0" onClick={() => setActiveTab('home')}>
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-slate-950 shadow-[0_0_24px_rgba(6,182,212,0.5)] border border-cyan-300/40 group-hover:scale-105 transition-all duration-300">
              <Waves className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="text-base sm:text-lg font-black tracking-widest text-white font-['Outfit']">AAZHI</span>
                <span className="text-[9px] sm:text-[10px] font-extrabold tracking-[0.15em] text-cyan-300 bg-cyan-950/90 border border-cyan-400/35 px-2 py-0.5 rounded-full uppercase leading-none shadow-sm hidden md:inline-block">
                  OCEAN OBSERVATION PORTAL
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 font-mono tracking-tight leading-none hidden lg:block">
                Indian Ocean Hydrodynamics & Argo Float In-Situ Network
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2 sm:gap-4 lg:gap-6 h-full">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`relative h-full flex items-center gap-2 px-3 sm:px-5 lg:px-6 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-cyan-300 border-cyan-400 bg-cyan-500/[0.1] font-bold shadow-[inset_0_-2px_10px_rgba(6,182,212,0.25)]'
                      : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.04] hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="tracking-wide">{t.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Utility Controls (Right) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 sm:px-4 sm:py-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-slate-200 hover:text-white hover:border-cyan-400/60 transition cursor-pointer flex items-center gap-2 text-xs font-mono shadow-md"
              title="Search (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="hidden md:inline font-sans text-slate-300">Search...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700 font-bold ml-1">
                Ctrl + K
              </kbd>
            </button>

            {/* Presentation Demo Mode */}
            <button
              onClick={() => setIsDemoModeActive(!isDemoModeActive)}
              className={`p-2 sm:px-3.5 sm:py-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold ${
                isDemoModeActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.55)]'
                  : 'bg-slate-900/90 border-cyan-500/20 text-amber-300 hover:border-amber-400/40'
              }`}
              title="Toggle Presentation Demo Mode"
            >
              <Tv className="w-4 h-4" />
              <span className="hidden md:inline font-sans">Demo</span>
            </button>

            {/* Keyboard Shortcuts Drawer */}
            <button
              onClick={() => setIsKeybindsOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 text-slate-300 hover:text-white hover:border-cyan-400/40 transition cursor-pointer hidden sm:block"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 text-slate-300 hover:text-white hover:border-cyan-400/40 transition cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

        </div>
      </header>

      {/* Breadcrumbs */}
      <Breadcrumbs 
        activeTab={activeTab}
        variable={variable}
        depth={depth}
        year={month.split('-')[0] || '2023'}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Main Tab Views */}
      <main className="relative flex-1 w-full overflow-hidden flex flex-col items-center justify-start bg-[#020a18]">
        {activeTab === 'home' && (
          <HomePage 
            onNavigate={(tab) => setActiveTab(tab)}
            setVariable={setVariable}
            setDepth={setDepth}
            setMonth={setMonth}
          />
        )}

        {activeTab === 'viewer' && (
          <Viewer 
            variable={variable}
            setVariable={setVariable}
            depth={depth}
            setDepth={setDepth}
            month={month}
            setMonth={setMonth}
            activeColormap={activeColormap}
            setActiveColormap={setActiveColormap}
            fogEnabled={fogEnabled}
            setFogEnabled={setFogEnabled}
            selectedStationId={selectedStationId}
            setSelectedStationId={setSelectedStationId}
          />
        )}

        {activeTab === 'validation' && (
          <Analytics 
            month={month}
            setMonth={setMonth}
            variable={variable}
            setVariable={setVariable}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage 
            onOpenKeybinds={() => setIsKeybindsOpen(true)}
            onNavigate={(tab) => setActiveTab(tab)}
            activeColormap={activeColormap}
            setActiveColormap={setActiveColormap}
            fogEnabled={fogEnabled}
            setFogEnabled={setFogEnabled}
            bathymetryRes={bathymetryRes}
            setBathymetryRes={setBathymetryRes}
          />
        )}
      </main>

      {/* Sleek Mobile Bottom Navigation Bar (Visible only on mobile screens < 768px) */}
      <nav className="flex md:hidden sticky bottom-0 left-0 right-0 z-40 bg-[#010915]/95 border-t border-cyan-500/20 backdrop-blur-xl h-14 items-center justify-around px-2 shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.8)]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
                isActive
                  ? 'text-cyan-300 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-slate-500'}`} />
              <span>{t.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResultSelect}
      />

      {/* Keyboard Shortcuts Drawer */}
      <KeyboardShortcutsDrawer
        isOpen={isKeybindsOpen}
        onClose={() => setIsKeybindsOpen(false)}
      />

      {/* Demo Mode Overlay */}
      <DemoModeOverlay
        isActive={isDemoModeActive}
        onClose={() => setIsDemoModeActive(false)}
        onNavigateStep={handleDemoStepNavigate}
      />

    </div>
  );
}
