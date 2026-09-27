const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

function build(stops) {
  const cols = stops.map((h) => [
    parseInt(h.slice(1, 3), 16) / 255,
    parseInt(h.slice(3, 5), 16) / 255,
    parseInt(h.slice(5, 7), 16) / 255,
  ]);
  return (t) => {
    const x = clamp01(t) * (cols.length - 1);
    const i = Math.min(cols.length - 2, Math.floor(x));
    const f = x - i;
    const a = cols[i];
    const b = cols[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };
}

export const COLORMAPS = {
  thermal: build(['#042333', '#183d6b', '#3f4a8a', '#7a4a7d', '#b3506a', '#dd6b4b', '#f39c3d', '#f7de55']),
  viridis: build(['#440154', '#482878', '#3e4989', '#31688e', '#26828e', '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725']),
  cividis: build(['#002051', '#173660', '#344b6c', '#506179', '#6c7786', '#888f94', '#a6a7a2', '#c5c0af', '#e4dbbb', '#fefecc']),
  turbo: build(['#30123b', '#4454c4', '#4490fe', '#1fc8de', '#29ea8d', '#7cf951', '#c7e02b', '#faba39', '#f6681c', '#ca2a18', '#7a0403']),
  plasma: build(['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921']),
  haline: build(['#2a186c', '#1b4b9a', '#137fa0', '#2ba98c', '#87c266', '#e0d268', '#fdf6a5']),
  speed: build(['#0b132b', '#1c3f6e', '#2a7f9e', '#3fb8a5', '#8fd97a', '#f2e863']),
  algae: build(['#0b1a11', '#123c26', '#1e6b3a', '#3f9c45', '#8ecb52', '#e2ee7e']),
  oxy: build(['#3b0f14', '#7a1f2b', '#c0453c', '#e8825c', '#d9cfc0', '#7fb2d9', '#1f4e9c']),
  ice: build(['#040613', '#1b2a52', '#2f5b95', '#5e93c0', '#9dc6dc', '#e8f4f8']),
  ssh: build(['#1e3a8a', '#2563eb', '#38bdf8', '#f1f5f9', '#fb923c', '#ef4444', '#7f1d1d']),
  mld: build(['#1e1b4b', '#4338ca', '#6366f1', '#06b6d4', '#10b981', '#a3e635']),
  abyss: build(['#020617', '#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8']),
};

export function cssColor(c) {
  return `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
}

export function gradientCss(key, steps = 12) {
  const f = COLORMAPS[key] || COLORMAPS.thermal;
  const parts = [];
  for (let i = 0; i < steps; i++) parts.push(cssColor(f(i / (steps - 1))));
  return `linear-gradient(90deg, ${parts.join(',')})`;
}
