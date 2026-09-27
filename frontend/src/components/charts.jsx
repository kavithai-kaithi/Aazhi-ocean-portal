import React from 'react';
import { MONTHS } from '../lib/ocean.js';

const AXIS = '#334b6b';
const TEXT = '#8fa6c4';

function niceRange(vals, pad = 0.08) {
  const finite = vals.filter((v) => Number.isFinite(v));
  if (!finite.length) return [0, 1];
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (max - min < 1e-6) { max += 0.5; min -= 0.5; }
  const p = (max - min) * pad;
  return [min - p, max + p];
}

/* --------------------------- depth profile chart --------------------------- */
export function ProfileChart({ pairs, unit, maxDepth = 2000 }) {
  const W = 300, H = 300, L = 44, R = 12, T = 14, B = 30;
  const [vmin, vmax] = niceRange(pairs.flatMap((p) => [p.model, p.obs]));
  const dMax = Math.max(50, Math.min(maxDepth, Math.max(...pairs.map((p) => p.depth), 100)));
  const xs = (v) => L + ((v - vmin) / (vmax - vmin)) * (W - L - R);
  const ys = (d) => T + Math.pow(d / dMax, 0.55) * (H - T - B);
  const path = (key) =>
    pairs.map((p, i) => `${i ? 'L' : 'M'}${xs(p[key]).toFixed(1)},${ys(p.depth).toFixed(1)}`).join(' ');
  const depthTicks = [0, 50, 100, 200, 500, 1000, 1500, 2000].filter((d) => d <= dMax);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {depthTicks.map((d) => (
        <g key={d}>
          <line x1={L} x2={W - R} y1={ys(d)} y2={ys(d)} stroke={AXIS} strokeWidth={0.5} strokeDasharray="3 3" />
          <text x={L - 6} y={ys(d) + 3} textAnchor="end" fontSize={9} fill={TEXT}>{d}</text>
        </g>
      ))}
      {[0, 0.5, 1].map((f) => {
        const v = vmin + f * (vmax - vmin);
        return (
          <text key={f} x={xs(v)} y={H - 12} textAnchor="middle" fontSize={9} fill={TEXT}>
            {v.toFixed(v > 50 ? 0 : 2)}
          </text>
        );
      })}
      <text x={4} y={12} fontSize={9} fill={TEXT}>depth (m)</text>
      <text x={W - R} y={H - 1} textAnchor="end" fontSize={9} fill={TEXT}>{unit}</text>
      <line x1={L} x2={L} y1={T} y2={H - B} stroke={AXIS} />
      <path d={path('model')} fill="none" stroke="#38bdf8" strokeWidth={2} />
      <path d={path('obs')} fill="none" stroke="#fbbf24" strokeWidth={1.6} strokeDasharray="5 3" />
      {pairs.map((p) => (
        <circle key={p.depth} cx={xs(p.obs)} cy={ys(p.depth)} r={2.6} fill="#fbbf24" />
      ))}
    </svg>
  );
}

/* ------------------------------ time series ------------------------------ */
export function TimeSeries({ data, unit, current }) {
  const W = 320, H = 150, L = 38, R = 8, T = 10, B = 22;
  const [vmin, vmax] = niceRange(data.flatMap((d) => [d.model, d.obs]));
  const xs = (t) => L + (t / 11) * (W - L - R);
  const ys = (v) => T + (1 - (v - vmin) / (vmax - vmin)) * (H - T - B);
  const line = (k) => data.map((d, i) => `${i ? 'L' : 'M'}${xs(d.t).toFixed(1)},${ys(d[k]).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.5, 1].map((f) => {
        const v = vmin + f * (vmax - vmin);
        return (
          <g key={f}>
            <line x1={L} x2={W - R} y1={ys(v)} y2={ys(v)} stroke={AXIS} strokeWidth={0.5} strokeDasharray="3 3" />
            <text x={L - 5} y={ys(v) + 3} textAnchor="end" fontSize={8} fill={TEXT}>{v.toFixed(1)}</text>
          </g>
        );
      })}
      <rect x={xs(current) - 5} y={T} width={10} height={H - T - B} fill="#22d3ee" opacity={0.14} />
      {MONTHS.map((m, i) => i % 2 === 0 && (
        <text key={m} x={xs(i)} y={H - 7} textAnchor="middle" fontSize={8} fill={TEXT}>{m}</text>
      ))}
      <path d={line('model')} fill="none" stroke="#38bdf8" strokeWidth={2} />
      <path d={line('obs')} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={W - R} y={T + 2} textAnchor="end" fontSize={8} fill={TEXT}>{unit}</text>
    </svg>
  );
}

/* -------------------------- model vs obs scatter -------------------------- */
export function Scatter({ pairs, unit }) {
  const W = 300, H = 280, L = 40, R = 10, T = 10, B = 30;
  const all = pairs.flatMap((p) => [p.model, p.obs]);
  const [vmin, vmax] = niceRange(all, 0.05);
  const xs = (v) => L + ((v - vmin) / (vmax - vmin)) * (W - L - R);
  const ys = (v) => T + (1 - (v - vmin) / (vmax - vmin)) * (H - T - B);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={xs(vmin)} y1={ys(vmin)} x2={xs(vmax)} y2={ys(vmax)} stroke="#64748b" strokeDasharray="4 4" />
      {pairs.map((p, i) => (
        <circle key={i} cx={xs(p.obs)} cy={ys(p.model)} r={2.1} fill="#38bdf8" opacity={0.55} />
      ))}
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke={AXIS} />
      <line x1={L} x2={L} y1={T} y2={H - B} stroke={AXIS} />
      {[0, 1].map((f) => {
        const v = vmin + f * (vmax - vmin);
        return (
          <g key={f}>
            <text x={xs(v)} y={H - B + 12} textAnchor="middle" fontSize={8} fill={TEXT}>{v.toFixed(1)}</text>
            <text x={L - 5} y={ys(v) + 3} textAnchor="end" fontSize={8} fill={TEXT}>{v.toFixed(1)}</text>
          </g>
        );
      })}
      <text x={(W + L) / 2} y={H - 4} textAnchor="middle" fontSize={9} fill={TEXT}>observed ({unit})</text>
      <text x={10} y={T + 4} fontSize={9} fill={TEXT}>model</text>
    </svg>
  );
}

/* ------------------------------- bar chart ------------------------------- */
export function Bars({ items, unit }) {
  const max = Math.max(...items.map((i) => i.value), 1e-6);
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2 text-[11px]">
          <span className="w-28 shrink-0 truncate text-slate-400">{i.label}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800/80">
            <div className="h-full rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: i.color }} />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-slate-300">
            {i.value.toFixed(3)} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}
