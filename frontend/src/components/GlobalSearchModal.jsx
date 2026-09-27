import React, { useState, useEffect } from 'react';
import { Search, X, Layers, Box, BarChart3, Thermometer, Droplets, Wind, Waves, MapPin, Database, ChevronRight, Tag } from 'lucide-react';

const SEARCH_ITEMS = [
  { id: 'var-temp', type: 'variable', category: 'Ocean Variable', title: 'Sea-surface temperature (IBR model)', sub: 'Unit: °C | Range: 4 – 30°C | In-Situ CTD Matchups', icon: Thermometer, color: 'text-amber-400 bg-amber-950/80 border-amber-500/30', tab: 'viewer', var: 'temperature' },
  { id: 'var-sal', type: 'variable', category: 'Ocean Variable', title: 'Sea-surface salinity (IBR model)', sub: 'Unit: PSU | Range: 31 – 37 PSU | Salinity Stratification', icon: Droplets, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30', tab: 'viewer', var: 'salinity' },
  { id: 'var-curr', type: 'variable', category: 'Ocean Variable', title: 'Current Velocity Flow Vectors (uo, vo)', sub: 'Unit: m/s | OpenDrift 3D vector velocity dynamics', icon: Wind, color: 'text-sky-400 bg-sky-950/80 border-sky-500/30', tab: 'viewer', var: 'currents' },
  { id: 'var-chla', type: 'variable', category: 'Ocean Variable', title: 'Sea-surface chlorophyll concentration', sub: 'Unit: mg/m³ | INCOIS BIO ROMS biogeochemical state', icon: Waves, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30', tab: 'viewer', var: 'chlorophyll' },
  { id: 'var-mld', type: 'variable', category: 'Ocean Variable', title: 'Mixed-layer depth (IBR model)', sub: 'Unit: m | Upper ocean thermal stratification', icon: Layers, color: 'text-indigo-400 bg-indigo-950/80 border-indigo-500/30', tab: 'viewer', var: 'mld' },
  { id: 'var-dic', type: 'variable', category: 'Ocean Variable', title: 'Sea-surface DIC concentration', sub: 'Unit: mmol/m³ | Dissolved inorganic carbon cycle', icon: Database, color: 'text-purple-400 bg-purple-950/80 border-purple-500/30', tab: 'viewer', var: 'dic' },
  
  { id: 'st-ctd39', type: 'station', category: 'Float Station', title: 'INCOIS Arabian Sea Station (WMO: 2902745)', sub: '14.82°N, 67.45°E | INCOIS India | Depth: 2318m | Teledyne APEX CTD', icon: MapPin, color: 'text-cyan-300 bg-cyan-950/80 border-cyan-500/30', tab: 'viewer', station: 'ARGO-2902745' },
  { id: 'st-argo74', type: 'station', category: 'Float Station', title: 'INCOIS Bay of Bengal Station (WMO: 2902801)', sub: '13.50°N, 87.20°E | INCOIS India | Depth: 3420m | ARVOR SBE 41CP', icon: MapPin, color: 'text-amber-300 bg-amber-950/80 border-amber-500/30', tab: 'viewer', station: 'ARGO-2902801' },
  { id: 'st-chagos', type: 'station', category: 'Float Station', title: 'AOML Southern Indian Ocean Station (WMO: 5904500)', sub: '-8.80°S, 64.10°E | AOML USA Deep Argo | Depth: 4120m', icon: MapPin, color: 'text-emerald-300 bg-emerald-950/80 border-emerald-500/30', tab: 'viewer', station: 'ARGO-5904500' },
  { id: 'st-somali', type: 'station', category: 'Float Station', title: 'AOML Somali Upwelling Station (WMO: 1900169)', sub: '1.04°N, 51.90°E | AOML USA | Depth: 4200m', icon: MapPin, color: 'text-sky-300 bg-sky-950/80 border-sky-500/30', tab: 'viewer', station: 'ARGO-1900169' },
  { id: 'st-csiro', type: 'station', category: 'Float Station', title: 'CSIRO Southeast Indian Ocean Station (WMO: 5905100)', sub: '-8.20°S, 94.60°E | CSIRO Australia | Depth: 3850m', icon: MapPin, color: 'text-purple-300 bg-purple-950/80 border-purple-500/30', tab: 'viewer', station: 'ARGO-5905100' },

  { id: 'ds-incois', type: 'dataset', category: 'Data Source', title: 'INCOIS BIO ROMS Reanalysis (1980–2019)', sub: '40-Year 480 Monthly Slices | LAS 8. / PyFerret 7.65', icon: Database, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30', tab: 'validation' },
  { id: 'ds-glorys', type: 'dataset', category: 'Data Source', title: 'Copernicus CMEMS GLORYS12V1', sub: '1/12° NEMO Ocean Physics | 50 Depth Levels (0–2000m)', icon: Database, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30', tab: 'viewer' },
  { id: 'ds-argo', type: 'dataset', category: 'Data Source', title: 'Argo GDAC Global Float Index', sub: '414,727 CTD profiles | 2,859 autonomous robotic floats', icon: Database, color: 'text-amber-400 bg-amber-950/80 border-amber-500/30', tab: 'validation' },

  { id: 'nav-slicer', type: 'nav', category: 'Workspace', title: '3D Volumetric Ocean Slicer', sub: 'Interactive 3D WebGL scene cutting planes & profile matchups', icon: Box, color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30', tab: 'viewer' },
  { id: 'nav-val', type: 'nav', category: 'Workspace', title: 'Validation & Analytics Hub', sub: 'Scatter plots, Taylor skill diagrams & RMSE metrics', icon: BarChart3, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30', tab: 'validation' },
];

export default function GlobalSearchModal({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtered = SEARCH_ITEMS.filter(item => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.sub.toLowerCase().includes(query.toLowerCase());
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    return matchesQuery && matchesCat;
  });

  const handleSelect = (item) => {
    if (onSelectResult) onSelectResult(item);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleModalKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIdx]) {
          handleSelect(filtered[selectedIdx]);
        }
      }
    };
    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isOpen, filtered, selectedIdx, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 sm:px-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in-up">
      <div className="relative w-full max-w-3xl sm:max-w-4xl rounded-3xl bg-[#04122d] border border-cyan-500/35 shadow-[0_20px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        
        {/* Enlarged Search Header (Section 1) */}
        <div className="flex items-center gap-4 px-6 sm:px-8 py-5 border-b border-cyan-500/25 bg-[#020a18]/95">
          <Search className="w-6 h-6 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search AAZHI datasets, ocean variables, float stations..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            className="w-full bg-transparent text-slate-100 text-base sm:text-lg font-sans placeholder-slate-500 focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 px-6 sm:px-8 py-3 bg-[#020a18]/60 border-b border-white/5 text-xs font-mono font-bold">
          <span className="text-slate-500 uppercase mr-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            Filter:
          </span>
          {['All', 'Ocean Variable', 'Float Station', 'Data Source', 'Workspace'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-extrabold shadow-md'
                  : 'bg-slate-900 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List - Clean Card-Based Layout */}
        <div className="max-h-[460px] overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="text-base font-bold text-slate-200">No matching results found</div>
              <div className="text-xs sm:text-sm text-slate-500 font-mono">
                Try searching for "Temperature", "Salinity", "Current Velocity", "CTD-039", or "Validation"
              </div>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 group ${
                    idx === selectedIdx
                      ? 'bg-cyan-950/80 border-cyan-400/60 shadow-[0_0_24px_rgba(6,182,212,0.25)]'
                      : 'bg-[#020a18]/60 border-white/8 hover:border-cyan-500/35 hover:bg-cyan-950/40'
                  }`}
                >
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-md ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-base sm:text-lg font-bold text-white font-['Outfit'] group-hover:text-cyan-300 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-mono text-slate-300/90 leading-snug">{item.sub}</div>
                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-cyan-300 group-hover:border-cyan-400/40 transition-all shrink-0 ml-3">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 sm:px-8 py-3.5 border-t border-white/8 bg-[#020a18] flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span>Press <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold">ESC</kbd> to exit</span>
            <span className="hidden sm:inline"><kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-bold">Ctrl + K</kbd> anytime</span>
          </div>
          <span className="text-cyan-400 font-bold">AAZHI Global Search Engine</span>
        </div>

      </div>
    </div>
  );
}
