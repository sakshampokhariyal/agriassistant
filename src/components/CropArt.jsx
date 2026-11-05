/** Hand-drawn style crop illustrations (no external images needed). */
const bgs = {
  ragi: ['#e9efcf', '#cfdca0'],
  tomato: ['#fbe9de', '#f3c9b3'],
  maize: ['#fbf0c9', '#f0dc8a'],
};

export default function CropArt({ type = 'ragi', className = '' }) {
  const [a, b] = bgs[type] || bgs.ragi;
  const id = `g-${type}`;
  return (
    <svg viewBox="0 0 200 140" className={className} role="img" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="200" height="140" fill={`url(#${id})`} />
      <ellipse cx="100" cy="150" rx="150" ry="38" fill="#7b5a3a" opacity="0.35" />
      {type === 'ragi' && (
        <g stroke="#3f7d3a" strokeWidth="3" strokeLinecap="round" fill="none">
          {[40, 70, 100, 130, 160].map((x, i) => (
            <g key={x}>
              <path d={`M${x} 140 C ${x - 6} 100, ${x + (i % 2 ? 8 : -8)} 70, ${x + (i % 2 ? 14 : -14)} 40`} />
              <path d={`M${x} 120 C ${x + 14} 100, ${x + 22} 96, ${x + 30} 80`} strokeWidth="2.5" />
              <path d={`M${x} 124 C ${x - 14} 104, ${x - 20} 98, ${x - 28} 84`} strokeWidth="2.5" />
              <g stroke="#8a5a2b" strokeWidth="3">
                <path d={`M${x + (i % 2 ? 14 : -14)} 40 l-5 -10`} />
                <path d={`M${x + (i % 2 ? 14 : -14)} 40 l0 -13`} />
                <path d={`M${x + (i % 2 ? 14 : -14)} 40 l5 -10`} />
              </g>
            </g>
          ))}
        </g>
      )}
      {type === 'tomato' && (
        <g>
          <path d="M100 140 C 98 100, 104 70, 100 30" stroke="#3f7d3a" strokeWidth="4" fill="none" strokeLinecap="round" />
          {[[78, 60], [124, 74], [84, 96], [120, 112]].map(([x, y], i) => (
            <g key={i}>
              <path d={`M100 ${y - 8} L ${x} ${y - 14}`} stroke="#3f7d3a" strokeWidth="3" />
              <circle cx={x} cy={y} r="14" fill="#d64a2f" />
              <circle cx={x - 4} cy={y - 4} r="3.5" fill="#fff" opacity="0.35" />
              <path d={`M${x - 6} ${y - 13} l6 5 l6 -5`} stroke="#3f7d3a" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
          ))}
          <path d="M100 40 c -22 -4 -34 6 -38 16 c 20 4 34 -2 38 -16z M100 52 c 22 -4 34 6 38 16 c -20 4 -34 -2 -38 -16z" fill="#4c9a48" />
        </g>
      )}
      {type === 'maize' && (
        <g>
          <path d="M100 140 L100 30" stroke="#4c9a48" strokeWidth="5" strokeLinecap="round" />
          <path d="M100 120 C 60 112, 44 90, 34 70 C 70 74, 92 94, 100 120z M100 100 C 138 92, 158 72, 168 52 C 130 58, 108 78, 100 100z" fill="#5aa84f" />
          <ellipse cx="116" cy="82" rx="10" ry="26" fill="#f0c43a" transform="rotate(14 116 82)" />
          <path d="M104 60 C 108 90, 120 104, 130 104 C 128 84, 120 66, 104 60z" fill="#8fc464" />
          <path d="M100 30 l-8 -14 M100 30 l0 -18 M100 30 l8 -14" stroke="#c98a2b" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
