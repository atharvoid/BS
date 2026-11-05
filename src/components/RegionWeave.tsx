import React from 'react'

/* ==========================================================================
   RegionWeave — a drawn impression of a regional weave tradition.
   SVG rather than photography, because a photograph would imply a specific
   supplier's stock. Each motif is abstract: colour and interlacing only.
   ========================================================================== */

type Motif = 'tamil-nadu' | 'gujarat'

function warpLines(count: number, width: number, height: number) {
  return Array.from({ length: count }, (_, i) => {
    const x = ((i + 0.5) / count) * width
    return { x, i }
  })
}

export function RegionWeave({ motif }: { motif: Motif }) {
  const w = 640
  const h = 300
  const id = `rw-${motif}`

  const isTamil = motif === 'tamil-nadu'

  /* Navy for the south, gold for the west: the same two families as
     everything else, so the pair reads as one set rather than two posters. */
  const ground = isTamil ? '#1e2b4d' : '#3a2f1e'
  const deep = isTamil ? '#16203a' : '#241d12'
  const light = isTamil ? '#b8c6d6' : '#dabc72'
  const accent = isTamil ? '#dabc72' : '#f0dca8'

  const warps = warpLines(isTamil ? 46 : 34, w, h)

  return (
    <svg
      className="region-weave"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ground} />
          <stop offset="55%" stopColor={deep} />
          <stop offset="100%" stopColor={ground} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={light} stopOpacity="0.42" />
          <stop offset="46%" stopColor={light} stopOpacity="0.06" />
          <stop offset="100%" stopColor={light} stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`${id}-thread`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.34" />
          <stop offset="38%" stopColor={light} stopOpacity="0.85" />
          <stop offset="72%" stopColor={light} stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <pattern id={`${id}-grid`} width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M0 0h9v9H0z" fill="none" />
          <path d="M0 0v9M0 0h9" stroke="#000" strokeOpacity="0.16" strokeWidth="0.7" />
        </pattern>
        <filter id={`${id}-soft`}>
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <rect width={w} height={h} fill={`url(#${id}-bg)`} />

      {/* weft bands */}
      {Array.from({ length: 22 }, (_, i) => {
        const y = 8 + i * 13.4
        return (
          <rect
            key={i}
            x="0"
            y={y}
            width={w}
            height={6.4}
            fill={i % 3 === 0 ? accent : light}
            opacity={i % 3 === 0 ? 0.2 : 0.11}
          />
        )
      })}

      {/* warp threads, thicker toward the centre for a shallow curl */}
      {warps.map(({ x, i }) => {
        const centre = Math.abs(i / (warps.length - 1) - 0.5)
        const width = 6.2 - centre * 2.4
        return (
          <rect
            key={i}
            x={x - width / 2}
            y="0"
            width={width}
            height={h}
            fill={`url(#${id}-thread)`}
            opacity={0.78}
          />
        )
      })}

      {/* motif: Tamil Nadu — fine zari checks; Gujarat — a bandhani dot field */}
      {isTamil ? (
        <g>
          {Array.from({ length: 26 }, (_, r) =>
            Array.from({ length: 14 }, (_, c) => {
              const x = 34 + c * 44
              const y = 24 + r * 11.2
              const on = (r + c) % 4 === 0
              return (
                <g key={`${r}-${c}`} opacity={on ? 0.8 : 0.24}>
                  <rect x={x} y={y} width="26" height="3.4" fill={accent} rx="1.2" />
                  <rect x={x + 3} y={y + 4.4} width="20" height="2.2" fill="#f0e6d2" opacity="0.5" rx="1" />
                </g>
              )
            }),
          )}
          {/* border stripes, like a sari edge */}
          <rect x="0" y="0" width="46" height={h} fill="#0b0e14" opacity="0.34" />
          <rect x="46" y="0" width="7" height={h} fill={accent} opacity="0.62" />
          <rect x="56" y="0" width="3" height={h} fill="#f0e6d2" opacity="0.4" />
          <rect x={w - 30} y="0" width="30" height={h} fill="#0b0e14" opacity="0.3" />
        </g>
      ) : (
        <g>
          {Array.from({ length: 16 }, (_, r) =>
            Array.from({ length: 24 }, (_, c) => {
              const x = 22 + c * 26 + (r % 2 ? 13 : 0)
              const y = 20 + r * 17.4
              const big = (r * 7 + c * 3) % 9 === 0
              const rr = big ? 5.4 : 3.1
              return (
                <g key={`${r}-${c}`} opacity={big ? 0.92 : 0.5}>
                  <circle cx={x} cy={y} r={rr} fill="#f6f1e5" opacity="0.82" />
                  <circle cx={x} cy={y} r={rr * 0.52} fill={accent} />
                  <circle cx={x + 1.1} cy={y + 1.2} r={rr * 0.24} fill="#2a2013" opacity="0.55" />
                </g>
              )
            }),
          )}
          {/* bandhani tie texture */}
          <rect width={w} height={h} fill={`url(#${id}-grid)`} opacity="0.5" />
          <rect x="0" y={h - 58} width={w} height="58" fill="#1a1810" opacity="0.32" />
          <rect x="0" y={h - 58} width={w} height="4" fill={accent} opacity="0.6" />
        </g>
      )}

      {/* light fall */}
      <rect width={w} height={h} fill={`url(#${id}-sheen)`} />
      <ellipse cx={w * 0.72} cy={-h * 0.24} rx={w * 0.44} ry={h * 0.5} fill="#fff" opacity="0.1" filter={`url(#${id}-soft)`} />
      <rect width={w} height={h} fill="url(#rw-vignette)" opacity="0.9" />
      <defs>
        <radialGradient id="rw-vignette" cx="0.5" cy="0.3" r="0.85">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#0d0b08" stopOpacity="0.55" />
        </radialGradient>
      </defs>
    </svg>
  )
}
