import React, { useEffect, useMemo, useState } from 'react';
import OceanScene from './OceanScene.jsx';
import { ProfileChart, TimeSeries } from './charts.jsx';
import {
  DEPTH_LEVELS, MONTHS, PLATFORMS, PLATFORM_META, VARIABLES, DATASET_METADATA, CORA_QC_FLAGS,
  profilePairs, stats, timeSeries, sample, bathymetry
} from '../lib/ocean.js';
import { COLORMAPS, gradientCss } from '../lib/colormap.js';
import { 
  Layers, 
  Search, 
  Eye, 
  EyeOff,
  TrendingUp, 
  Thermometer, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Compass,
  Radio,
  ExternalLink,
  Droplets,
  Wind,
  Waves,
  Sparkles,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sliders,
  Calendar,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Info,
  Filter,
  Grid,
  Tag,
  Palette,
  CloudOff,
  Cloud,
  FileSpreadsheet,
  FileCode,
  FileJson
} from 'lucide-react';

export default function Viewer({
  variable: propVariable,
  setVariable: propSetVariable,
  depth: propDepth,
  setDepth: propSetDepth,
  month: propMonth,
  setMonth: propSetMonth,
  activeColormap: propColormap,
  setActiveColormap: propSetColormap,
  fogEnabled: propFogEnabled,
  setFogEnabled: propSetFogEnabled,
  selectedStationId: propSelectedStationId,
  setSelectedStationId: propSetSelectedStationId
}) {
  // Controlled & uncontrolled fallbacks for props
  const [localVariable, setLocalVariable] = useState('temperature');
  const [localDepth, setLocalDepth] = useState(0);
  const [localColormap, setLocalColormap] = useState('thermal');
  const [localFogEnabled, setLocalFogEnabled] = useState(false);
  const [localStationId, setLocalStationId] = useState('ARGO-2902745');

  const variable = propVariable !== undefined ? propVariable : localVariable;
  const setVariable = propSetVariable || setLocalVariable;

  const depth = propDepth !== undefined ? propDepth : localDepth;
  const setDepth = propSetDepth || setLocalDepth;

  const activeColormap = propColormap !== undefined ? propColormap : localColormap;
  const setActiveColormap = propSetColormap || setLocalColormap;

  const fogEnabled = propFogEnabled !== undefined ? propFogEnabled : localFogEnabled;
  const setFogEnabled = propSetFogEnabled || setLocalFogEnabled;

  const selectedStationId = propSelectedStationId !== undefined ? propSelectedStationId : localStationId;
  const setSelectedStationId = propSetSelectedStationId || setLocalStationId;

  const [activeModel, setActiveModel] = useState('cmems_glorys');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showTimeSeries, setShowTimeSeries] = useState(false);
  const [showMetadataDrawer, setShowMetadataDrawer] = useState(false);
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState('both');

  // Collapsible dataset groups state
  const [openGroups, setOpenGroups] = useState({
    opendrift: true,
    copernicus: true,
    incois: true,
    usgs: false
  });

  // ---------------- Interactive Ocean Slicing & Level Controls ----------------
  const [time, setTime] = useState(5); // Month index 0-11 (June = 5)
  const [year, setYear] = useState('2023'); // 2023, 2024, 2025, 2026
  const [isPlaying, setIsPlaying] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(1);
  const [transectLat, setTransectLat] = useState(12);

  // ---------------- 3D Visualization Layer Toggles ----------------
  const [showSlice, setShowSlice] = useState(true);
  const [showStack, setShowStack] = useState(false);
  const [showTransect, setShowTransect] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showFloor, setShowFloor] = useState(true);
  const [showObs, setShowObs] = useState(true);

  const meta = VARIABLES[variable] || VARIABLES.temperature;

  // Automated Monthly Timeline Playback
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(200, 1400 / animSpeed);
    const interval = setInterval(() => {
      setTime((prev) => (prev + 1) % 12);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isPlaying, animSpeed]);

  // Alias map for backwards compatibility
  const STATION_ALIASES = useMemo(() => ({
    'CTD-039': 'ARGO-2902745',
    'Argo-Float-74': 'ARGO-2902801',
    'Fukushima-Site': 'ARGO-2903110',
    'Chagos-Platform': 'ARGO-5904500',
    'Kavaratti-Ridge': 'ARGO-1901720'
  }), []);

  // Station definitions derived directly from PLATFORMS
  const STATIONS = useMemo(() => {
    return PLATFORMS.map((p) => {
      const metaType = PLATFORM_META[p.type] || { label: 'In-Situ Cast', color: '#38bdf8' };
      const bDepth = Math.round(bathymetry(p.lon, p.lat));
      const typeCode = p.type === 'incois' ? 'ARGO' : p.type === 'aoml' ? 'DEEP' : p.type === 'csiro' ? 'CTD' : 'BUOY';
      
      return {
        id: p.id,
        wmo: p.wmo,
        name: p.name || `Station ${p.wmo}`,
        type: p.profiler || metaType.agency || 'Autonomous Argo Float',
        typeCode: typeCode,
        lat: p.lat,
        lon: p.lon,
        seafloorDepth: bDepth > 0 ? bDepth : 2500,
        provenance: p.datasetSource || metaType.agency,
        lastDate: p.lastSeen || '12 h ago',
        qcStatus: 'Good (QC)',
        depths: p.depths || [0, 50, 100, 150, 200, 300, 500, 750, 1000, 1250, 1500, 1750, 2000],
        rawPlatform: p
      };
    });
  }, []);

  const activeStationId = STATION_ALIASES[selectedStationId] || selectedStationId;
  const activeStation = STATIONS.find(s => s.id === activeStationId || s.wmo === activeStationId) || STATIONS[0];

  const profilePairsData = useMemo(() => {
    return profilePairs(activeStation.rawPlatform || activeStation, variable, time);
  }, [activeStation, variable, time]);

  const activeStats = useMemo(() => {
    return stats(profilePairsData);
  }, [profilePairsData]);

  const tsData = useMemo(() => {
    return timeSeries(activeStation.rawPlatform || activeStation, variable, 0);
  }, [activeStation, variable]);

  const DATASET_GROUPS = [
    {
      id: 'opendrift',
      title: 'OpenDrift Hydrodynamic Model',
      badge: '48 / 48 layers',
      desc: '18.13M point dataset for 2025–2026 predictions'
    },
    {
      id: 'copernicus',
      title: 'Copernicus Ocean Physics',
      badge: '12 / 12 layers',
      desc: 'GLORYS12V1 temperature, currents & salinity (0–2000m)'
    },
    {
      id: 'incois',
      title: 'INCOIS L3-BIORS',
      badge: '12 / 12 layers',
      desc: 'Indian Ocean Basin State (Nrt2)'
    },
    {
      id: 'usgs',
      title: 'USGS Detrital-Flow',
      badge: '1 / 1 layer',
      desc: 'Weekly current coupled hydrodynamics'
    }
  ];

  const COMPACT_VARIABLES = [
    { id: 'temperature', name: 'Temperature', unit: '°C', category: 'physical' },
    { id: 'salinity', name: 'Salinity', unit: 'PSU', category: 'physical' },
    { id: 'currents', name: 'Current Velocity', unit: 'm/s', category: 'physical' },
    { id: 'chlorophyll', name: 'Chlorophyll', unit: 'mg/m³', category: 'biogeo' },
    { id: 'dic', name: 'CO₂ & Carbon (DIC)', unit: 'µatm', category: 'biogeo' },
    { id: 'mld', name: 'Mixed-Layer Depth', unit: 'm', category: 'surface' },
  ];

  const filteredVars = COMPACT_VARIABLES.filter(v => {
    const matchesQuery = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.unit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || v.category === activeFilter;
    return matchesQuery && matchesFilter;
  });

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleExportCSV = () => {
    const headers = ["Depth(m)", `Model_${variable}`, `InSitu_${variable}`];
    const rows = profilePairsData.map(p => `${p.depth},${p.model},${p.obs}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", encodeURI(csvContent));
    dlAnchor.setAttribute("download", `${activeStation.id}_${variable}_${MONTHS[time]}_${year}.csv`);
    dlAnchor.click();
  };

  const handleExportJSON = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      station: activeStation,
      variable,
      depth,
      month: MONTHS[time],
      year,
      vertical_profile: profilePairsData
    }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", jsonStr);
    dlAnchor.setAttribute("download", `${activeStation.id}_${variable}_${MONTHS[time]}_${year}.json`);
    dlAnchor.click();
  };

  const handleExportNetCDF = () => {
    const ncContent = "data:text/plain;charset=utf-8," + encodeURIComponent(
      `netcdf AAZHI_${activeStation.id}_${variable} {\n` +
      `dimensions:\n\tdepth = ${profilePairsData.length} ;\n\ttime = 1 ;\n` +
      `variables:\n\tfloat depth(depth) ;\n\t\tdepth:units = "m" ;\n` +
      `\tfloat ${variable}(time, depth) ;\n\t\t${variable}:units = "${meta.unit}" ;\n` +
      `// global attributes:\n\t\t:institution = "INCOIS / Argo GDAC / CMEMS" ;\n` +
      `\t\t:source_station = "${activeStation.name} (WMO ${activeStation.wmo})" ;\n` +
      `}`
    );
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", ncContent);
    dlAnchor.setAttribute("download", `${activeStation.id}_${variable}_header.cdl`);
    dlAnchor.click();
  };

  return (
    <div className={`grid h-[calc(100vh-56px)] w-full grid-cols-1 ${isViewerFullscreen ? 'lg:grid-cols-1 p-0' : 'lg:grid-cols-[320px_1fr_370px] xl:grid-cols-[340px_1fr_400px] p-4 sm:p-5 gap-5'} bg-[#020a18] text-slate-100 overflow-hidden select-none`}>
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. LEFT SIDEBAR: Redesigned Data Explorer & Layer Controls        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {!isViewerFullscreen && (
        <aside className="flex flex-col gap-5 rounded-2xl border border-cyan-500/15 bg-[#04112a]/95 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-y-auto custom-scrollbar select-none">
          
          {/* Header & Global Search */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-white/8">
              <span className="text-base font-bold text-white uppercase tracking-wider font-['Outfit'] flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-cyan-400" />
                Data Explorer
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-400/30 px-2.5 py-1 rounded-lg">
                64 Active
              </span>
            </div>

            {/* Global Search Input */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search datasets or variables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-[#020a18]/90 border border-cyan-500/25 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 pr-9 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'physical', label: 'Physical' },
                { id: 'biogeo', label: 'Biogeochemical' },
                { id: 'surface', label: 'Surface' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    activeFilter === f.id
                      ? 'bg-cyan-400 text-slate-950 shadow-md font-extrabold'
                      : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dataset Collapsible Groups Card */}
          <div className="space-y-2.5 p-3 rounded-xl border border-white/6 bg-[#030d24]/50">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1 flex items-center justify-between">
              <span>HYDRODYNAMIC MODELS</span>
              <span className="text-slate-500 text-[10px]">4 GROUPS</span>
            </div>

            <div className="space-y-2">
              {DATASET_GROUPS.map((g) => {
                const isOpen = openGroups[g.id];
                return (
                  <div key={g.id} className="rounded-xl border border-white/6 bg-[#020a18]/70 overflow-hidden transition-all">
                    <button
                      onClick={() => toggleGroup(g.id)}
                      className="w-full p-2.5 flex items-center justify-between text-left hover:bg-cyan-950/30 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                        <span className="text-xs font-bold text-white font-['Outfit']">{g.title}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/20">
                        {g.badge}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="p-2.5 pt-0 text-xs text-slate-400 border-t border-white/5 leading-relaxed">
                        <p>{g.desc}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ocean Variables List Card */}
          <div className="space-y-2.5 p-3 rounded-xl border border-white/6 bg-[#030d24]/50">
            <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 font-bold px-1 flex items-center justify-between">
              <span>OCEAN VARIABLES</span>
              <span className="text-slate-500 text-[10px]">{filteredVars.length} AVAILABLE</span>
            </div>

            <div className="space-y-2">
              {filteredVars.map((v) => {
                const isSelected = variable === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVariable(v.id)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all duration-150 cursor-pointer text-left ${
                      isSelected
                        ? 'border-cyan-400/60 bg-cyan-950/70 text-white shadow-[0_0_16px_rgba(6,182,212,0.25)] font-bold'
                        : 'border-white/5 bg-[#020a18]/70 hover:border-cyan-500/30 text-slate-300 hover:bg-cyan-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-slate-700'}`} />
                      <span className="text-xs font-['Outfit']">{v.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20 shrink-0">
                      {v.unit}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3D Scene Visual Layers Card (Padded Bottom Section) */}
          <div className="space-y-2.5 p-3.5 rounded-xl border border-white/6 bg-[#030d24]/70 mt-auto">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              3D SCENE VISUAL LAYERS
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => setShowSlice(!showSlice)}
                className={`px-2.5 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                  showSlice ? 'bg-cyan-950/80 border-cyan-400/40 text-cyan-300' : 'bg-slate-900/50 border-white/5 text-slate-500'
                }`}
              >
                <span>Depth Plane</span>
                {showSlice ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowStack(!showStack)}
                className={`px-2.5 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                  showStack ? 'bg-cyan-950/80 border-cyan-400/40 text-cyan-300' : 'bg-slate-900/50 border-white/5 text-slate-500'
                }`}
              >
                <span>Strata Stack</span>
                {showStack ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowTransect(!showTransect)}
                className={`px-2.5 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                  showTransect ? 'bg-cyan-950/80 border-cyan-400/40 text-cyan-300' : 'bg-slate-900/50 border-white/5 text-slate-500'
                }`}
              >
                <span>Transect Curtain</span>
                {showTransect ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowVectors(!showVectors)}
                className={`px-2.5 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                  showVectors ? 'bg-cyan-950/80 border-cyan-400/40 text-cyan-300' : 'bg-slate-900/50 border-white/5 text-slate-500'
                }`}
              >
                <span>Current Flow</span>
                {showVectors ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowFloor(!showFloor)}
                className={`px-2.5 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                  showFloor ? 'bg-cyan-950/80 border-cyan-400/40 text-cyan-300' : 'bg-slate-900/50 border-white/5 text-slate-500'
                }`}
              >
                <span>Bathymetry</span>
                {showFloor ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowObs(!showObs)}
                className={`px-2.5 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                  showObs ? 'bg-cyan-950/80 border-cyan-400/40 text-cyan-300' : 'bg-slate-900/50 border-white/5 text-slate-500'
                }`}
              >
                <span>Argo Floats</span>
                {showObs ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

        </aside>
      )}


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. CENTER: 3D Ocean Scene & Floating Viewport Toolbar             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col justify-between rounded-2xl border border-cyan-500/15 bg-[#020b1f] shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden">
        
        {/* 3D Scene Top Header Overlay */}
        <div className="absolute left-4 top-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          
          {/* Active Variable Header */}
          <div className="pointer-events-auto flex items-center gap-3 bg-[#030d24]/90 border border-cyan-500/25 p-3.5 rounded-2xl backdrop-blur-xl shadow-xl">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white font-['Outfit'] tracking-tight leading-none">
                  {meta.label}
                </h2>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-400/30 px-2 py-0.5 rounded">
                  {meta.unit}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                <span>IBR Model</span>
                <span>•</span>
                <span>{MONTHS[time]} {year}</span>
                <span>•</span>
                <span className="text-amber-300 font-bold">{depth === 0 ? 'Surface' : `${depth}m`}</span>
              </div>
            </div>

            <button
              onClick={() => setShowMetadataDrawer(!showMetadataDrawer)}
              className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:text-white transition cursor-pointer ml-2"
              title="Technical Metadata Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Model / In-Situ Mode Toggle Pills */}
          <div className="pointer-events-auto flex items-center gap-1 bg-[#030d24]/90 border border-cyan-500/20 p-1.5 rounded-2xl backdrop-blur-xl shadow-xl text-xs font-mono font-bold">
            {[
              { id: 'model', label: 'Model' },
              { id: 'insitu', label: 'In-Situ' },
              { id: 'both', label: 'Both' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setDisplayMode(m.id)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  displayMode === m.id
                    ? 'bg-cyan-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

        </div>

        {/* Floating 3D Scene Controls Toolbar */}
        <div className="absolute top-24 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
          <div className="flex flex-col gap-1.5 p-2 rounded-2xl bg-[#030d24]/90 border border-cyan-500/20 backdrop-blur-xl shadow-xl">
            {/* Reset */}
            <button
              onClick={() => { setDepth(0); setTransectLat(12); }}
              className="p-2 rounded-xl bg-slate-900/80 text-cyan-300 border border-white/5 hover:bg-cyan-950/80 hover:border-cyan-400/40 transition cursor-pointer flex items-center gap-1.5 text-xs font-mono"
              title="Reset Scene View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Fog Toggle */}
            <button
              onClick={() => setFogEnabled(!fogEnabled)}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-mono ${
                fogEnabled 
                  ? 'bg-slate-900/80 text-cyan-300 border-white/5' 
                  : 'bg-emerald-950/90 text-emerald-300 border-emerald-400/40 font-bold'
              }`}
              title={fogEnabled ? "Atmospheric Fog Active - Click to Disable" : "Clear View Mode (Fog Disabled)"}
            >
              {fogEnabled ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{fogEnabled ? 'Fog: ON' : 'Fog: OFF (Clear)'}</span>
            </button>

            {/* Color Palette Selector Dropdown */}
            <div className="relative group">
              <button
                className="w-full p-2 rounded-xl bg-slate-900/80 text-cyan-300 border border-white/5 hover:bg-cyan-950/80 hover:border-cyan-400/40 transition cursor-pointer flex items-center gap-1.5 text-xs font-mono"
                title="Select Scientific Color Palette"
              >
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline capitalize">{activeColormap}</span>
              </button>
              
              <div className="hidden group-hover:flex flex-col gap-1 absolute left-full top-0 ml-2 p-2 rounded-2xl bg-[#030d24] border border-cyan-500/30 shadow-2xl z-40 min-w-[140px]">
                {['thermal', 'viridis', 'cividis', 'turbo', 'plasma', 'speed', 'ice'].map((cm) => (
                  <button
                    key={cm}
                    onClick={() => setActiveColormap(cm)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold capitalize text-left flex items-center justify-between cursor-pointer transition ${
                      activeColormap === cm ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{cm}</span>
                    <div className="w-6 h-2 rounded" style={{ background: gradientCss(cm, 6) }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Fullscreen */}
            <button
              onClick={() => setIsViewerFullscreen(!isViewerFullscreen)}
              className="p-2 rounded-xl bg-slate-900/80 text-cyan-300 border border-white/5 hover:bg-cyan-950/80 hover:border-cyan-400/40 transition cursor-pointer flex items-center gap-1.5 text-xs font-mono"
              title="Toggle Fullscreen"
            >
              {isViewerFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isViewerFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Slim Vertical Depth Adjustment Widget */}
        <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 z-20 flex flex-col items-center gap-2.5 px-2.5 py-3.5 rounded-2xl bg-[#030d24]/80 border border-cyan-500/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto select-none transition-all duration-200 hover:border-cyan-400/40">
          <div className="text-[9px] font-mono font-bold tracking-widest text-cyan-300/90 uppercase [writing-mode:vertical-rl] rotate-180">
            DEPTH
          </div>
          
          <div className="relative h-48 sm:h-52 flex items-center justify-center py-1">
            <input
              type="range"
              min={0}
              max={2000}
              step={25}
              value={depth}
              onChange={(e) => setDepth(+e.target.value)}
              className="h-full accent-cyan-400 cursor-pointer text-cyan-400 bg-slate-800/80 rounded-full w-1.5"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            />
          </div>

          {/* Quick Depth Presets */}
          <div className="flex flex-col items-center gap-1 text-[10px] font-mono text-slate-400 font-medium">
            <button onClick={() => setDepth(0)} className={`hover:text-cyan-300 cursor-pointer transition ${depth === 0 ? 'text-cyan-300 font-bold' : ''}`}>0m</button>
            <button onClick={() => setDepth(100)} className={`hover:text-cyan-300 cursor-pointer transition ${depth === 100 ? 'text-cyan-300 font-bold' : ''}`}>100m</button>
            <button onClick={() => setDepth(500)} className={`hover:text-cyan-300 cursor-pointer transition ${depth === 500 ? 'text-cyan-300 font-bold' : ''}`}>500m</button>
            <button onClick={() => setDepth(2000)} className={`hover:text-cyan-300 cursor-pointer transition ${depth === 2000 ? 'text-cyan-300 font-bold' : ''}`}>2k m</button>
          </div>

          {/* Compact Depth Badge */}
          <div className="mt-0.5 px-2 py-0.5 rounded-lg bg-cyan-950/90 border border-cyan-400/40 text-cyan-300 font-mono font-bold text-[11px] shadow-md whitespace-nowrap">
            {depth}m
          </div>
        </div>

        {/* 3D WebGL Canvas */}
        <div className="relative w-full h-full">
          <OceanScene
            variable={variable}
            depth={depth}
            time={time}
            transectLat={transectLat}
            showSlice={showSlice}
            showStack={showStack}
            showTransect={showTransect}
            showVectors={showVectors}
            showFloor={showFloor}
            showObs={showObs}
            selected={selectedStationId}
            onSelect={setSelectedStationId}
            fogEnabled={fogEnabled}
            customColormap={activeColormap}
          />
        </div>

        {/* Horizontal Color Legend Bar at Bottom of Viewport */}
        <div className="pointer-events-none absolute bottom-16 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/20 bg-[#030d24]/92 p-3 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-3.5 pointer-events-auto">
            <span className="text-xs font-bold text-white font-['Outfit']">{meta.label.split(' ')[0]} ({meta.unit})</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-300 font-semibold">{meta.range[0]}{meta.unit}</span>
              <div 
                className="h-3.5 w-48 sm:w-64 rounded-md shadow-inner border border-white/15"
                style={{ background: gradientCss(activeColormap, 12) }}
              />
              <span className="text-xs font-mono text-slate-300 font-semibold">{meta.range[1]}{meta.unit}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-medium text-slate-300 pointer-events-auto">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              Numerical Model
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              In-Situ Cast
            </span>
          </div>
        </div>

        {/* Time-Series Animation Playbar (Time-Lapse Player) */}
        <div className="z-30 w-full bg-[#010916] border-t border-cyan-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 shadow-2xl shrink-0 select-none">
          
          {/* Playback Controls (Step Back, Play/Pause, Step Forward) & Speed Multipliers */}
          <div className="flex items-center gap-2">
            {/* Step Backward */}
            <button
              onClick={() => setTime((prev) => (prev === 0 ? 11 : prev - 1))}
              title="Step Backward (Previous Month)"
              className="p-2 rounded-xl bg-slate-900 border border-cyan-500/20 text-cyan-300 hover:text-white hover:border-cyan-400/50 transition cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? "Pause Time-Lapse" : "Play Time-Lapse Animation"}
              className="p-2 rounded-xl bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:scale-105 transition cursor-pointer font-bold"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Step Forward */}
            <button
              onClick={() => setTime((prev) => (prev === 11 ? 0 : prev + 1))}
              title="Step Forward (Next Month)"
              className="p-2 rounded-xl bg-slate-900 border border-cyan-500/20 text-cyan-300 hover:text-white hover:border-cyan-400/50 transition cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Speed Multipliers (1x, 5x, 10x) */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/5 text-xs font-mono font-bold ml-1">
              {[1, 5, 10].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setAnimSpeed(spd)}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                    animSpeed === spd ? 'bg-cyan-950 text-cyan-300 border border-cyan-400/30 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Month Scrubber Slider */}
          <div className="flex-1 max-w-xl flex items-center gap-4">
            <span className="text-xs font-mono font-bold text-amber-300 shrink-0 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-400/30">
              {MONTHS[time]} {year}
            </span>
            <input
              type="range"
              min={0}
              max={11}
              value={time}
              onChange={(e) => setTime(+e.target.value)}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Year Selectors (2023, 2024, 2025, 2026) */}
          <div className="flex items-center gap-1 text-xs font-mono font-bold">
            {['2023', '2024', '2025', '2026'].map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  year === y
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 border border-white/5 hover:text-white'
                }`}
              >
                {y}
              </button>
            ))}
          </div>

        </div>

      </section>


      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. RIGHT PANEL: Station Telemetry Inspector                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {!isViewerFullscreen && (
        <aside className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-500/15 bg-[#04112a]/95 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-y-auto custom-scrollbar">
          
          <div className="space-y-4">
            {/* Station Header */}
            <div className="flex items-start justify-between gap-2 border-b border-white/8 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white font-['Outfit'] tracking-tight">{activeStation.id}</h3>
                  <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded">
                    {activeStation.typeCode}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{activeStation.type}</div>
              </div>

              {/* Direct Multi-Format Export Options */}
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleExportCSV}
                  title="Export Station Profile CSV"
                  className="p-1.5 rounded-lg bg-[#020a18] border border-cyan-500/20 text-cyan-300 hover:text-white hover:border-cyan-400/50 cursor-pointer transition shadow-sm flex items-center gap-1 text-[11px] font-mono font-bold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <button 
                  onClick={handleExportJSON}
                  title="Export Profile JSON"
                  className="p-1.5 rounded-lg bg-[#020a18] border border-cyan-500/20 text-cyan-300 hover:text-white hover:border-cyan-400/50 cursor-pointer transition shadow-sm flex items-center gap-1 text-[11px] font-mono font-bold"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>

                <button 
                  onClick={handleExportNetCDF}
                  title="Export NetCDF Header Metadata"
                  className="p-1.5 rounded-lg bg-[#020a18] border border-cyan-500/20 text-purple-300 hover:text-white hover:border-purple-400/50 cursor-pointer transition shadow-sm flex items-center gap-1 text-[11px] font-mono font-bold"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>.NC</span>
                </button>
              </div>
            </div>

            {/* Station Selector */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#020a18]/80 border border-cyan-500/15 text-xs">
              <span className="text-slate-400 font-mono font-semibold">Station:</span>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="bg-[#030d24] text-cyan-300 font-bold font-mono px-2 py-1 rounded-lg border border-cyan-500/30 focus:outline-none cursor-pointer text-xs"
              >
                {STATIONS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#020a18] text-slate-200">
                    {s.name} ({s.typeCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Station Specifications Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#020a18]/60 border border-white/5 space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">LOCATION</div>
                <div className="font-bold text-slate-100 font-mono text-[12px]">{activeStation.lat.toFixed(2)}°N, {activeStation.lon.toFixed(2)}°E</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#020a18]/60 border border-white/5 space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">SEAFLEOR DEPTH</div>
                <div className="font-bold text-slate-100 font-mono text-[12px]">{activeStation.seafloorDepth} m</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#020a18]/60 border border-white/5 space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">PROVENANCE</div>
                <div className="font-bold text-slate-100 truncate text-[11px]">{activeStation.provenance}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#020a18]/60 border border-white/5 space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">LAST OBSERVATION</div>
                <div className="font-bold text-slate-100 text-[11px]">{activeStation.lastDate}</div>
              </div>
            </div>

            {/* Vertical Profile Chart */}
            <div className="p-3.5 rounded-xl bg-[#020a18]/70 border border-cyan-500/15 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5 font-['Outfit'] text-[13px]">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Vertical Profile Matchup
                </span>
                <span className="text-[10px] font-mono text-cyan-300/70">depth (m)</span>
              </div>

              <div className="w-full h-44">
                <ProfileChart pairs={profilePairsData} unit={meta.unit} />
              </div>

              <div className="flex items-center justify-center gap-5 text-xs font-medium text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Model (GLORYS12V1)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  In-Situ (CTD)
                </span>
              </div>
            </div>

            {/* 3 KPI Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-[#020a18]/70 border border-white/5 text-center">
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">MEAN BIAS</div>
                <div className="font-mono text-base font-black text-amber-300 mt-0.5">
                  {activeStats.bias >= 0 ? `+${activeStats.bias.toFixed(3)}` : activeStats.bias.toFixed(3)}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#020a18]/70 border border-white/5 text-center">
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">RMSE</div>
                <div className="font-mono text-base font-black text-cyan-300 mt-0.5">{activeStats.rmse.toFixed(3)}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#020a18]/70 border border-white/5 text-center">
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">PEARSON R</div>
                <div className="font-mono text-base font-black text-emerald-300 mt-0.5">{activeStats.corr.toFixed(3)}</div>
              </div>
            </div>
          </div>

          {/* Collapsible Annual Time Series */}
          <div className="rounded-xl border border-white/8 bg-[#020a18]/50 overflow-hidden">
            <button
              onClick={() => setShowTimeSeries(!showTimeSeries)}
              className="w-full p-3 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between cursor-pointer transition"
            >
              <span className="flex items-center gap-1.5 font-['Outfit']">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Annual Time Series
              </span>
              {showTimeSeries ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTimeSeries && (
              <div className="p-3 border-t border-white/5 space-y-2">
                <TimeSeries data={tsData} unit={meta.unit} current={time} />
              </div>
            )}
          </div>

        </aside>
      )}

    </div>
  );
}
