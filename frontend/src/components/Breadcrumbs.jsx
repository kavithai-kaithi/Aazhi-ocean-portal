import React from 'react';
import { ChevronRight, Home, Box, BarChart3, Settings, Waves } from 'lucide-react';

export default function Breadcrumbs({ activeTab, variable, depth, year, onNavigate }) {
  const getTabLabel = () => {
    switch (activeTab) {
      case 'home': return 'Overview';
      case 'viewer': return '3D Ocean Slicer';
      case 'validation': return 'Validation & Analysis';
      case 'settings': return 'Settings';
      default: return 'Overview';
    }
  };

  const getVarLabel = () => {
    switch (variable) {
      case 'temperature': return 'Sea-Surface Temperature (°C)';
      case 'salinity': return 'Salinity (PSU)';
      case 'currents': return 'Current Velocity (m/s)';
      case 'chlorophyll': return 'Chlorophyll (mg/m³)';
      case 'mld': return 'Mixed-Layer Depth (m)';
      case 'dic': return 'DIC Concentration';
      default: return 'Ocean Variable';
    }
  };

  return (
    <div className="w-full bg-[#020814] border-b border-cyan-500/10 px-6 sm:px-10 py-2 flex items-center gap-2 text-[11px] font-mono text-slate-400 select-none shrink-0 overflow-x-auto custom-scrollbar">
      <span 
        onClick={() => onNavigate && onNavigate('home')}
        className="hover:text-cyan-300 cursor-pointer flex items-center gap-1 transition"
      >
        <Waves className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-bold text-white">AAZHI</span>
      </span>

      <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

      <span 
        onClick={() => onNavigate && onNavigate(activeTab)}
        className="hover:text-cyan-300 cursor-pointer font-semibold text-slate-300 transition"
      >
        {getTabLabel()}
      </span>

      {activeTab === 'viewer' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-cyan-400 font-bold">{getVarLabel()}</span>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
            {depth === 0 ? 'Surface (0m)' : `${depth}m Depth`}
          </span>
        </>
      )}

      {activeTab === 'validation' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-emerald-400 font-bold">{getVarLabel()}</span>
        </>
      )}
    </div>
  );
}
