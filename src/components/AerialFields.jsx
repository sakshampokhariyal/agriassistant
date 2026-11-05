import { memo } from 'react';

/**
 * Procedurally drawn aerial view of patchwork crop fields with tree lines.
 * Pure SVG – works offline, scales to any size. Deterministic per `seed`.
 */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const FIELD = ['#3d6a28', '#4b7a2e', '#5a8a33', '#2e5a25', '#6a963b', '#7c9f3c', '#36622c', '#8aa843', '#55803a', '#45732f'];
const TREE = ['#1b3a17', '#24461d', '#2d5623', '#1f4a22'];

function AerialFields({ seed = 7, className = '', tint = true }) {
  const r = rng(seed);
  const cols = 9;
  const rows = 7;
  const W = 2000;
  const H = 1500;
  const cw = W / cols;
  const ch = H / rows;

  // Jittered grid of corner points so fields look hand-surveyed, not square.
  const pts = Array.from({ length: rows + 1 }, (_, y) =>
    Array.from({ length: cols + 1 }, (_, x) => [
      x * cw + (x > 0 && x < cols ? (r() - 0.5) * cw * 0.5 : 0),
      y * ch + (y > 0 && y < rows ? (r() - 0.5) * ch * 0.5 : 0),
    ])
  );

  const fields = [];
  const trees = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p = [pts[y][x], pts[y][x + 1], pts[y + 1][x + 1], pts[y + 1][x]];
      const d = `M${p.map((q) => q.join(',')).join('L')}Z`;
      fields.push({ d, fill: FIELD[Math.floor(r() * FIELD.length)], pat: Math.floor(r() * 4) });
      // Tree clumps along some field edges
      if (r() < 0.45) {
        const [a, b] = r() < 0.5 ? [p[0], p[1]] : [p[1], p[2]];
        const n = 6 + Math.floor(r() * 10);
        for (let i = 0; i < n; i++) {
          const t = r();
          trees.push({
            cx: a[0] + (b[0] - a[0]) * t + (r() - 0.5) * 26,
            cy: a[1] + (b[1] - a[1]) * t + (r() - 0.5) * 26,
            rr: 10 + r() * 18,
            fill: TREE[Math.floor(r() * TREE.length)],
          });
        }
      }
    }
  }

  const id = `af${seed}`;
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        {[0, 35, 90, -30].map((a, i) => (
          <pattern key={i} id={`${id}-p${i}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform={`rotate(${a})`}>
            <rect width="14" height="5" fill="#0b2410" opacity="0.18" />
            <rect y="7" width="14" height="2" fill="#d6e48a" opacity="0.08" />
          </pattern>
        ))}
        <filter id={`${id}-n`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
          <feColorMatrix values="0 0 0 0 0.85  0 0 0 0 0.8  0 0 0 0 0.35  0 0 0 0.55 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <radialGradient id={`${id}-tree`} cx="35%" cy="35%" r="70%">
          <stop offset="0" stopColor="#4f7e34" />
          <stop offset="1" stopColor="#173315" />
        </radialGradient>
        <linearGradient id={`${id}-tint`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04170d" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#062014" stopOpacity="0.25" />
          <stop offset="1" stopColor="#03140b" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#03140b" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#03140b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="#2f5a25" />
      <g transform="translate(800 500) rotate(-24) translate(-1000 -750)">
        {fields.map((f, i) => (
          <g key={i}>
            <path d={f.d} fill={f.fill} stroke="#20401a" strokeWidth="3" />
            <path d={f.d} fill={`url(#${id}-p${f.pat})`} />
          </g>
        ))}
        <g filter={`url(#${id}-n)`}>
          {fields.map((f, i) => <path key={i} d={f.d} fill="#fff" opacity="0.22" />)}
        </g>
        {trees.map((t, i) => (
          <g key={i}>
            <circle cx={t.cx + 4} cy={t.cy + 5} r={t.rr} fill="#0a1d0a" opacity="0.35" />
            <circle cx={t.cx} cy={t.cy} r={t.rr} fill={`url(#${id}-tree)`} />
          </g>
        ))}
      </g>
      {tint && (
        <>
          <rect width="1600" height="1000" fill={`url(#${id}-tint)`} />
          <rect width="1600" height="1000" fill={`url(#${id}-side)`} />
        </>
      )}
    </svg>
  );
}

export default memo(AerialFields);

/** Real photo with a calm gradient fallback (works offline). */
export function Photo({ id, alt = '', className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-forest-300 via-moss-400 to-forest-600 ${className}`}>
      <img
        src={`https://images.unsplash.com/${id}?w=800&q=70&auto=format&fit=crop`}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
    </div>
  );
}
