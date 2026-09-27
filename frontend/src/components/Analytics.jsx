import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Calendar,
  Table,
  Target,
  Filter,
  FileText,
  Activity,
  Link as LinkIcon,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Globe,
  Anchor,
  Navigation,
  Sliders,
  Search
} from 'lucide-react';

const YEARS = ['1980', '1985', '1990', '1995', '2000', '2005', '2010', '2015', '2019', '2023', '2024', '2025', '2026'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEPTH_OPTIONS = ['Surface (0m)', '10m Depth', '50m Depth', '100m Depth', '500m Depth', '1000m Depth', '2000m Deep'];

const VARIABLES = {
  temperature: { label: 'Sea-surface temperature', unit: '°C', min: 4, max: 30, baseRmse: 0.513, baseBias: 0.049 },
  salinity: { label: 'Sea-surface salinity', unit: 'PSU', min: 31, max: 37, baseRmse: 0.224, baseBias: -0.018 },
  currents: { label: 'Current Velocity (uo, vo)', unit: 'm/s', min: 0, max: 1.8, baseRmse: 0.086, baseBias: 0.012 },
  chlorophyll: { label: 'Sea-surface chlorophyll', unit: 'mg/m³', min: 0.05, max: 4.5, baseRmse: 0.175, baseBias: -0.022 },
  mld: { label: 'Mixed-layer depth', unit: 'm', min: 10, max: 140, baseRmse: 4.85, baseBias: 1.24 },
  dic: { label: 'Sea-surface DIC concentration', unit: 'mmol/m³', min: 1800, max: 2300, baseRmse: 18.5, baseBias: -4.2 },
  nitrate: { label: 'Sea-surface nitrate concentration', unit: 'mmol/m³', min: 0.01, max: 25.0, baseRmse: 0.85, baseBias: 0.12 },
  pco2_model: { label: 'Surface pCO2 from IBR model', unit: 'µatm', min: 300, max: 480, baseRmse: 8.4, baseBias: 1.15 },
};

const VAR_KEYS = Object.keys(VARIABLES);

function prng(seed) {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
}

function generateValidationData(yearStr, monthIdx, varKey, qcFilter, selectedDepth) {
  const yearNum = parseInt(yearStr, 10) || 2026;
  const varMeta = VARIABLES[varKey] || VARIABLES.temperature;
  const varIdx = VAR_KEYS.indexOf(varKey);
  const qcIdx = qcFilter === 'qc1' ? 1 : qcFilter === 'qc12' ? 2 : 0;
  const depthIdx = DEPTH_OPTIONS.indexOf(selectedDepth);

  const seed = (yearNum - 2020) * 401 + monthIdx * 79 + varIdx * 43 + qcIdx * 17 + depthIdx * 23;

  const qcMult = qcFilter === 'qc1' ? 0.74 : qcFilter === 'qc12' ? 0.89 : 1.0;
  const rawObs = Math.round(460 + prng(seed + 1) * 180 + (yearNum - 2023) * 35 + monthIdx * 8);
  const observations = Math.round(rawObs * qcMult);

  const biasSign = prng(seed + 2) > 0.45 ? 1 : -1;
  const biasMag = (0.01 + prng(seed + 3) * 0.08) * (varMeta.baseRmse / 0.5);
  const rawBias = (biasSign * biasMag).toFixed(3);
  const meanBias = (parseFloat(rawBias) >= 0 ? '+' : '') + rawBias;

  const rmseVar = (prng(seed + 4) - 0.5) * 0.25 * varMeta.baseRmse;
  const rmseVal = Math.max(0.01, varMeta.baseRmse + rmseVar).toFixed(3);

  const corrVal = Math.min(0.999, Math.max(0.940, 0.968 + prng(seed + 5) * 0.029)).toFixed(3);

  const points = [];
  const minVal = varMeta.min;
  const maxVal = varMeta.max;
  const numPts = 260;
  for (let i = 0; i < numPts; i++) {
    const t = (i + prng(seed + 100 + i)) / numPts;
    const obs = minVal + t * (maxVal - minVal);
    const noise = (prng(seed + 400 + i) - 0.5) * parseFloat(rmseVal) * 0.75;
    const mod = Math.max(minVal, Math.min(maxVal, obs + parseFloat(rawBias) + noise));
    points.push({ obs, mod });
  }

  const modelRatio = 0.88 + prng(seed + 6) * 0.14;
  const skillCorr = Math.max(0.70, parseFloat(corrVal) - 0.07);
  const skillRatio = 0.52 + prng(seed + 7) * 0.12;

  const networkSpecs = [
    { label: 'Argo Core Profiler', baseScale: 1.15, color: 'bg-amber-400' },
    { label: 'Deep Argo Profiler', baseScale: 1.28, color: 'bg-sky-400' },
    { label: 'RAMA / OMNI Mooring', baseScale: 0.75, color: 'bg-orange-400' },
    { label: 'Autonomous Glider', baseScale: 0.76, color: 'bg-purple-400' },
    { label: 'Shipboard CTD Cast', baseScale: 0.85, color: 'bg-emerald-400' },
    { label: 'Surface SVP Drifter', baseScale: 0.88, color: 'bg-cyan-400' },
  ];
  const networkRmse = networkSpecs.map((n, idx) => {
    const factor = n.baseScale * (0.88 + prng(seed + 30 + idx) * 0.24);
    const val = (parseFloat(rmseVal) * factor).toFixed(3);
    const percent = Math.min(98, Math.max(30, Math.round((parseFloat(val) / (varMeta.baseRmse * 1.5)) * 80)));
    return {
      label: n.label,
      value: `${val} ${varMeta.unit}`,
      percent,
      color: n.color
    };
  });

  const depthLevels = ['0 m', '10 m', '20 m', '50 m', '100 m', '500 m', '2000 m'];
  const depthRmse = depthLevels.map((d, idx) => {
    const factor = 0.8 + (idx * 0.04) + (prng(seed + 50 + idx) * 0.3);
    const val = (parseFloat(rmseVal) * factor).toFixed(3);
    const percent = Math.min(98, Math.max(35, Math.round((parseFloat(val) / (varMeta.baseRmse * 1.4)) * 75)));
    return {
      label: d,
      value: `${val} ${varMeta.unit}`,
      percent
    };
  });

  const stationTemplates = [
    { id: 'DEEP-ARGO-015', net: 'Deep Argo Profiler', color: 'text-sky-400', baseLat: -6.71, baseLon: 84.86, baseLvl: 11 },
    { id: 'ARGO-014', net: 'Argo Core Profiler', color: 'text-amber-400', baseLat: -18.66, baseLon: 63.87, baseLvl: 15 },
    { id: 'ARGO-013', net: 'Argo Core Profiler', color: 'text-amber-400', baseLat: 33.025, baseLon: 91.61, baseLvl: 15 },
    { id: 'ARGO-007', net: 'Argo Core Profiler', color: 'text-amber-400', baseLat: -1.18, baseLon: 69.06, baseLvl: 15 },
    { id: 'DRIFTER-044', net: 'Surface SVP Drifter', color: 'text-cyan-400', baseLat: 11.54, baseLon: 81.20, baseLvl: 3 },
    { id: 'BIO-003', net: 'Shipboard CTD Cast', color: 'text-emerald-400', baseLat: -23.12, baseLon: 135.70, baseLvl: 8 },
  ];

  const stationsTable = stationTemplates.map((tmpl, idx) => {
    const pSeed = seed + 70 + idx * 7;
    const bVal = ((prng(pSeed) - 0.48) * varMeta.baseRmse * 1.5).toFixed(3);
    const rVal = (parseFloat(rmseVal) * (0.85 + prng(pSeed + 1) * 0.5)).toFixed(3);
    const cVal = (Math.min(1.0, 0.95 + prng(pSeed + 2) * 0.05 * (idx === 4 ? -1.5 : 1))).toFixed(2);
    const qcStatus = qcFilter === 'qc1' ? 'QC 1 PASSED' : qcFilter === 'qc12' ? 'QC 1/2 GOOD' : 'PASSED';
    const latStr = tmpl.baseLat >= 0 ? `${tmpl.baseLat.toFixed(2)}°N` : `${Math.abs(tmpl.baseLat).toFixed(2)}°S`;
    const lonStr = `${tmpl.baseLon.toFixed(2)}°E`;

    return {
      id: tmpl.id,
      network: tmpl.net,
      networkColor: tmpl.color,
      lat: latStr,
      lon: lonStr,
      levels: String(tmpl.baseLvl),
      bias: parseFloat(bVal) >= 0 ? `+${bVal}` : bVal,
      rmse: rVal,
      r: cVal,
      qc: qcStatus
    };
  });

  return {
    observations,
    meanBias,
    rmse: rmseVal,
    correlation: corrVal,
    points,
    minVal,
    maxVal,
    unit: varMeta.unit,
    modelRatio,
    skillCorr,
    skillRatio,
    networkRmse,
    depthRmse,
    stationsTable
  };
}

function ScatterPlot({ points, minVal, maxVal, unit }) {
  const W = 380, H = 260, L = 45, R = 15, T = 15, B = 38;
  
  const xs = (v) => L + ((v - minVal) / Math.max(0.0001, maxVal - minVal)) * (W - L - R);
  const ys = (v) => T + (1 - (v - minVal) / Math.max(0.0001, maxVal - minVal)) * (H - T - B);

  const ticks = useMemo(() => {
    const arr = [];
    const step = (maxVal - minVal) / 4;
    for (let i = 0; i <= 4; i++) {
      const v = minVal + i * step;
      arr.push(v < 10 && v > -10 && v % 1 !== 0 ? v.toFixed(1) : Math.round(v));
    }
    return arr;
  }, [minVal, maxVal]);

  return (
    <div className="w-full flex flex-col items-center py-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[260px]">
        {ticks.map((v) => {
          const numV = parseFloat(v);
          return (
            <g key={v}>
              <line x1={L} x2={W - R} y1={ys(numV)} y2={ys(numV)} stroke="#0f2847" strokeWidth={0.8} />
              <line x1={xs(numV)} x2={xs(numV)} y1={T} y2={H - B} stroke="#0f2847" strokeWidth={0.8} />
              <text x={L - 7} y={ys(numV) + 3.5} textAnchor="end" fontSize={9} fill="#64748b" fontFamily="JetBrains Mono" fontWeight="500">{v}</text>
              <text x={xs(numV)} y={H - B + 16} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="JetBrains Mono" fontWeight="500">{v}</text>
            </g>
          );
        })}

        <line x1={xs(minVal)} y1={ys(minVal)} x2={xs(maxVal)} y2={ys(maxVal)} stroke="#0ea5e9" strokeWidth={1.2} strokeDasharray="5 4" opacity="0.7" />

        {points.map((p, i) => (
          <circle key={i} cx={xs(p.obs)} cy={ys(p.mod)} r={2.5} fill="#38bdf8" opacity={0.75} />
        ))}

        <text x={(W + L) / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" fontFamily="Inter">
          Observation ({unit})
        </text>
        <text transform={`rotate(-90 ${13} ${(H + T - B) / 2})`} x={13} y={(H + T - B) / 2} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" fontFamily="Inter">
          Model ({unit})
        </text>
      </svg>
    </div>
  );
}

function TaylorDiagram({ correlation, skillCorr, modelRatio, skillRatio }) {
  const W = 380, H = 260, cx = 48, cy = H - 38, R = 260;
  const maxR = 1.0;
  
  const pos = (corr, ratio) => {
    const th = Math.acos(Math.max(-1, Math.min(1, corr)));
    const r = (Math.min(ratio, maxR) / maxR) * R;
    return [cx + r * Math.cos(th), cy - r * Math.sin(th)];
  };

  const arcs = [0.2, 0.4, 0.6, 0.8, 1.0];
  const rays = [0.6, 0.8, 0.9, 0.95, 0.99, 1.0];

  const corrNum = parseFloat(correlation) || 0.999;
  const [mx, my] = pos(corrNum, modelRatio || 0.94);
  const [sx, sy] = pos(skillCorr || 0.92, skillRatio || 0.58);

  return (
    <div className="w-full flex flex-col items-center py-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[260px]">
        {arcs.map((rr) => (
          <g key={rr}>
            <path
              d={`M ${cx + (rr / maxR) * R} ${cy} A ${(rr / maxR) * R} ${(rr / maxR) * R} 0 0 0 ${cx} ${cy - (rr / maxR) * R}`}
              fill="none" stroke="#0f2847" strokeWidth={0.8}
            />
            <text x={cx - 7} y={cy - (rr / maxR) * R + 3.5} textAnchor="end" fontSize={9} fill="#64748b" fontFamily="JetBrains Mono" fontWeight="500">
              {rr.toFixed(1)}
            </text>
          </g>
        ))}

        {rays.map((c) => {
          const [x, y] = pos(c, maxR);
          return (
            <g key={c}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="#0f2847" strokeWidth={0.8} />
              <text x={x + 5} y={y - 3} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono" fontWeight="500">
                {c}
              </text>
            </g>
          );
        })}

        <line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke="#1e3a5f" strokeWidth={1} />
        <line x1={cx} y1={cy} x2={cx} y2={cy - R} stroke="#1e3a5f" strokeWidth={1} />

        {[0.0, 0.2, 0.4, 0.6, 0.8, 1.0].map((v) => (
          <text key={v} x={cx + (v / maxR) * R} y={cy + 16} textAnchor="middle" fontSize={9} fill="#64748b" fontFamily="JetBrains Mono" fontWeight="500">{v.toFixed(1)}</text>
        ))}

        <circle cx={cx + R} cy={cy} r={6} fill="none" stroke="#0ea5e9" strokeWidth={2.5} />
        <circle cx={cx + R} cy={cy} r={2.5} fill="#ffffff" />

        <g>
          <circle cx={sx} cy={sy} r={6} fill="#4ade80" opacity="0.9" />
          <text x={sx + 10} y={sy + 4} fontSize={10} fill="#4ade80" fontWeight="700" fontFamily="Inter">Surface</text>
        </g>

        <g>
          <circle cx={mx} cy={my} r={6} fill="#f472b6" opacity="0.9" />
          <text x={mx + 10} y={my + 4} fontSize={10} fill="#f472b6" fontWeight="700" fontFamily="Inter">
            R={correlation}
          </text>
        </g>

        <text x={(W + cx) / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" fontFamily="Inter">
          Correlation (R)
        </text>
        <text transform={`rotate(-90 ${13} ${(cy + 10) / 2})`} x={13} y={(cy + 10) / 2} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" fontFamily="Inter">
          Standard Deviation (Normalized)
        </text>
      </svg>
    </div>
  );
}

export default function Analytics({ month = '2023-06', setMonth, variable = 'temperature', setVariable }) {
  const [selectedQC, setSelectedQC] = useState('all');
  const [selectedDepth, setSelectedDepth] = useState('Surface (0m)');
  const [compareMode, setCompareMode] = useState(true);
  const [tableSearch, setTableSearch] = useState('');

  const parsedYear = useMemo(() => {
    const parts = String(month).split('-');
    return YEARS.includes(parts[0]) ? parts[0] : '2023';
  }, [month]);

  const parsedMonthIndex = useMemo(() => {
    const parts = String(month).split('-');
    if (parts.length > 1) {
      const m = parseInt(parts[1], 10);
      if (!isNaN(m) && m >= 1 && m <= 12) return m - 1;
    }
    return 5;
  }, [month]);

  const activeVar = VAR_KEYS.includes(variable) ? variable : 'temperature';
  const activeMeta = VARIABLES[activeVar] || VARIABLES.temperature;

  const handleYearChange = (newYear) => {
    const mm = String(parsedMonthIndex + 1).padStart(2, '0');
    if (setMonth) setMonth(`${newYear}-${mm}`);
  };

  const handleMonthIndexChange = (newIdx) => {
    const mm = String(newIdx + 1).padStart(2, '0');
    if (setMonth) setMonth(`${parsedYear}-${mm}`);
  };

  const validationData = useMemo(() => {
    return generateValidationData(parsedYear, parsedMonthIndex, activeVar, selectedQC, selectedDepth);
  }, [parsedYear, parsedMonthIndex, activeVar, selectedQC, selectedDepth]);

  const filteredTable = useMemo(() => {
    return validationData.stationsTable.filter(row =>
      row.id.toLowerCase().includes(tableSearch.toLowerCase()) ||
      row.network.toLowerCase().includes(tableSearch.toLowerCase()) ||
      row.lat.toLowerCase().includes(tableSearch.toLowerCase()) ||
      row.lon.toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [validationData, tableSearch]);

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden bg-[#020a18] text-slate-100 font-sans px-6 sm:px-10 py-8 space-y-8 custom-scrollbar">
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-cyan-400" />
            Validation & Analysis Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Statistical accuracy benchmarking suite matching ocean numerical model simulations against in-situ float CTD profiles.
          </p>
        </div>

        {/* Compare Control */}
        <div className="flex items-center gap-2 bg-[#04122d] border border-cyan-500/25 p-2 rounded-2xl shadow-lg">
          <span className="text-xs font-mono text-slate-400 px-2 font-bold uppercase">COMPARE:</span>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
              compareMode
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_14px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {compareMode ? 'Model vs In-Situ (ON)' : 'Model Only'}
          </button>
        </div>
      </div>


      {/* ═══════════ LAYER 1: ONE ORGANIZED HORIZONTAL FILTER BAR (SECTION 22, 49) ═══════════ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#04122d]/90 border border-cyan-500/20 shadow-xl flex flex-wrap items-center justify-between gap-5 animate-fade-in-up">
        
        {/* Variable Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Variable</label>
          <select
            value={activeVar}
            onChange={(e) => setVariable && setVariable(e.target.value)}
            className="bg-[#020a18] text-cyan-300 font-bold font-['Outfit'] px-3.5 py-2 rounded-xl border border-cyan-500/30 focus:outline-none cursor-pointer text-xs"
          >
            {VAR_KEYS.map((k) => (
              <option key={k} value={k} className="bg-[#020a18] text-slate-200">
                {VARIABLES[k].label} ({VARIABLES[k].unit})
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Year</label>
          <div className="flex items-center gap-1">
            {['2023', '2024', '2025', '2026'].map((y) => (
              <button
                key={y}
                onClick={() => handleYearChange(y)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  parsedYear === y
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-md'
                    : 'bg-[#020a18] text-slate-400 border border-cyan-500/20 hover:text-white'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Month</label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1.5 rounded-lg border border-amber-500/30">
              {MONTHS_SHORT[parsedMonthIndex]}
            </span>
            <input
              type="range"
              min={0}
              max={11}
              value={parsedMonthIndex}
              onChange={(e) => handleMonthIndexChange(parseInt(e.target.value, 10))}
              className="w-36 accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Depth Level Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Depth Level</label>
          <select
            value={selectedDepth}
            onChange={(e) => setSelectedDepth(e.target.value)}
            className="bg-[#020a18] text-amber-300 font-bold font-mono px-3 py-2 rounded-xl border border-amber-500/30 focus:outline-none cursor-pointer text-xs"
          >
            {DEPTH_OPTIONS.map((d) => (
              <option key={d} value={d} className="bg-[#020a18] text-slate-200">{d}</option>
            ))}
          </select>
        </div>

        {/* QC Filter Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">QC Filter</label>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All QC' },
              { id: 'qc1', label: 'QC 1' },
              { id: 'qc12', label: 'QC 1 & 2' }
            ].map((q) => (
              <button
                key={q.id}
                onClick={() => setSelectedQC(q.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
                  selectedQC === q.id
                    ? 'bg-sky-500 text-white font-bold shadow-md'
                    : 'bg-[#020a18] text-slate-300 border border-cyan-500/15 hover:text-white'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

      </div>


      {/* ═══════════ LAYER 2: 4 LARGE KPI CARDS (SECTION 23) ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{animationDelay: '0.08s'}}>
        
        {/* KPI 1 */}
        <div className="kpi-card stat-card p-6 rounded-2xl bg-[#04122d]/90 border border-cyan-500/15 shadow-xl space-y-3" style={{'--kpi-color': '#06b6d4'}}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            <span>OBSERVATIONS (N)</span>
            <FileText className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          <div className="text-4xl font-black font-mono text-white tracking-tight">
            {validationData.observations}
          </div>
          <div className="text-xs text-slate-400 font-medium">Matchup pairs ({MONTHS_SHORT[parsedMonthIndex]} {parsedYear})</div>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card stat-card p-6 rounded-2xl bg-[#04122d]/90 border border-amber-500/15 shadow-xl space-y-3" style={{'--kpi-color': '#f59e0b'}}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            <span>MEAN BIAS</span>
            <TrendingUp className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div className="text-4xl font-black font-mono text-amber-300 tracking-tight">
            {validationData.meanBias}
          </div>
          <div className="text-xs text-slate-400 font-medium">{activeMeta.label} ({validationData.unit})</div>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card stat-card p-6 rounded-2xl bg-[#04122d]/90 border border-sky-500/15 shadow-xl space-y-3" style={{'--kpi-color': '#0ea5e9'}}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            <span>RMSE</span>
            <Activity className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div className="text-4xl font-black font-mono text-sky-400 tracking-tight">
            {validationData.rmse}
          </div>
          <div className="text-xs text-slate-400 font-medium">Root Mean Square Error ({validationData.unit})</div>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card stat-card p-6 rounded-2xl bg-[#04122d]/90 border border-emerald-500/15 shadow-xl space-y-3" style={{'--kpi-color': '#10b981'}}>
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            <span>CORRELATION (R)</span>
            <LinkIcon className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div className="text-4xl font-black font-mono text-emerald-400 tracking-tight">
            {validationData.correlation}
          </div>
          <div className="text-xs text-slate-400 font-medium">Pearson R linear correlation</div>
        </div>

      </div>


      {/* ═══════════ LAYER 3: 4-CHART DASHBOARD GRID (SECTION 24) ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 animate-fade-in-up" style={{animationDelay: '0.14s'}}>
        
        {/* Chart 1: Scatter */}
        <div className="rounded-2xl bg-[#04122d]/90 border border-cyan-500/15 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <h3 className="text-base font-bold text-white flex items-center gap-2.5 font-['Outfit']">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Model vs Observation Scatter
            </h3>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-500/20 font-bold">
              {MONTHS_SHORT[parsedMonthIndex]} {parsedYear}
            </span>
          </div>

          <ScatterPlot
            points={validationData.points}
            minVal={validationData.minVal}
            maxVal={validationData.maxVal}
            unit={validationData.unit}
          />

          <div className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-white/5">
            Scatter plot comparing model simulation output against float CTD measurements along the 1:1 reference line.
          </div>
        </div>

        {/* Chart 2: Taylor Diagram */}
        <div className="rounded-2xl bg-[#04122d]/90 border border-cyan-500/15 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <h3 className="text-base font-bold text-white flex items-center gap-2.5 font-['Outfit']">
              <Target className="w-5 h-5 text-cyan-400" />
              Taylor Skill Diagram
            </h3>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-500/20 font-bold">
              {MONTHS_SHORT[parsedMonthIndex]} {parsedYear}
            </span>
          </div>

          <TaylorDiagram
            correlation={validationData.correlation}
            skillCorr={validationData.skillCorr}
            modelRatio={validationData.modelRatio}
            skillRatio={validationData.skillRatio}
          />

          <div className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-white/5">
            Quantifies relative variance and correlation. Proximity to the reference point indicates model skill.
          </div>
        </div>

        {/* Chart 3: RMSE by Network */}
        <div className="rounded-2xl bg-[#04122d]/90 border border-cyan-500/15 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <h3 className="text-base font-bold text-white flex items-center gap-2.5 font-['Outfit']">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              RMSE by Observing Network
            </h3>
            <span className="text-xs font-mono text-slate-400 font-bold">({MONTHS_SHORT[parsedMonthIndex]} {parsedYear})</span>
          </div>

          <div className="space-y-4 py-2">
            {validationData.networkRmse.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs font-mono">
                <span className="w-40 text-slate-300 truncate font-semibold">{item.label}</span>
                <div className="flex-1 mx-4 h-3.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${item.percent}%` }} />
                </div>
                <span className="font-bold text-white text-right w-24">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: RMSE by Depth */}
        <div className="rounded-2xl bg-[#04122d]/90 border border-cyan-500/15 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <h3 className="text-base font-bold text-white flex items-center gap-2.5 font-['Outfit']">
              <Layers className="w-5 h-5 text-cyan-400" />
              RMSE by Depth Level
            </h3>
            <span className="text-xs font-mono text-slate-400 font-bold">({MONTHS_SHORT[parsedMonthIndex]} {parsedYear})</span>
          </div>

          <div className="space-y-4 py-2">
            {validationData.depthRmse.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs font-mono">
                <span className="w-20 text-slate-300 font-bold">{item.label}</span>
                <div className="flex-1 mx-4 h-3.5 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-500" style={{ width: `${item.percent}%` }} />
                </div>
                <span className="font-bold text-white text-right w-24">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>


      {/* ═══════════ LAYER 4: VALIDATION STATION TABLE (SECTION 25) ═══════════ */}
      <div className="rounded-2xl bg-[#04122d]/90 border border-cyan-500/15 p-6 shadow-xl space-y-5 animate-fade-in-up" style={{animationDelay: '0.18s'}}>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-white/8">
          <div className="flex items-center gap-3">
            <Table className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white tracking-wide font-['Outfit']">
              Station In-Situ Validation Profiles
            </h3>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Table Search */}
            <div className="relative flex items-center w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter stations..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full rounded-xl bg-[#020a18] border border-cyan-500/20 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 pr-8"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>

            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/70 px-3 py-1.5 rounded-xl border border-cyan-500/25 font-bold shrink-0">
              {MONTHS_SHORT[parsedMonthIndex]} {parsedYear}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="data-table w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 text-[11px] uppercase tracking-wider">
                <th className="pb-3.5 pr-6 font-bold">STATION ID</th>
                <th className="pb-3.5 pr-6 font-bold">NETWORK TYPE</th>
                <th className="pb-3.5 pr-6 font-bold">LATITUDE</th>
                <th className="pb-3.5 pr-6 font-bold">LONGITUDE</th>
                <th className="pb-3.5 pr-6 font-bold">LEVELS</th>
                <th className="pb-3.5 pr-6 font-bold">MEAN BIAS ({validationData.unit})</th>
                <th className="pb-3.5 pr-6 font-bold">RMSE ({validationData.unit})</th>
                <th className="pb-3.5 pr-6 font-bold">CORRELATION (R)</th>
                <th className="pb-3.5 pr-2 font-bold">QC STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredTable.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500">No matching station records found.</td>
                </tr>
              ) : (
                filteredTable.map((row) => (
                  <tr key={row.id} className="hover:bg-cyan-500/[0.05] transition-colors">
                    <td className="py-3.5 pr-6 text-white font-bold">{row.id}</td>
                    <td className={`py-3.5 pr-6 font-semibold ${row.networkColor}`}>{row.network}</td>
                    <td className="py-3.5 pr-6 text-slate-300">{row.lat}</td>
                    <td className="py-3.5 pr-6 text-slate-300">{row.lon}</td>
                    <td className="py-3.5 pr-6 text-slate-300">{row.levels}</td>
                    <td className="py-3.5 pr-6 text-amber-300 font-bold">{row.bias}</td>
                    <td className="py-3.5 pr-6 text-sky-300 font-bold">{row.rmse}</td>
                    <td className="py-3.5 pr-6 text-emerald-400 font-bold">{row.r}</td>
                    <td className="py-3.5 pr-2">
                      <span className="px-3 py-1 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                        {row.qc}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
