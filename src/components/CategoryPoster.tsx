import React from 'react'
import type { CategoryMotif } from '../three/categoryObjects'
import '../styles/posters.css'

/* ==========================================================================
   Stills of the six objects, drawn as SVG.

   Each is the same object the 3D row shows — the indigo bolt with its kraft
   band and unrolling tail, the blue pottery vase, the tied jute sack, the
   copper coil, the cotton boll, the stencilled crate — at the same three-quarter
   angle, lit from the same side. They are used while the shared canvas loads,
   when a device should not animate, and when WebGL is unavailable.

   Vector, not a bitmap, for three reasons: they stay sharp at any size and at
   any zoom, they cost a few kilobytes instead of a megabyte of PNGs, and they
   are the same palette as the models rather than a photograph of something
   else. Each is drawn from a handful of paths, so the file stays small.
   ========================================================================== */

type Props = { motif: CategoryMotif; className?: string }

/** Shared light: a warm key from the upper left, cool fill from lower right. */
const light = (id: string, warm = '#f6efdf', cool = '#8c99b4') => (
  <linearGradient id={id} x1="0.2" y1="0" x2="0.85" y2="1">
    <stop offset="0" stopColor={warm} />
    <stop offset="1" stopColor={cool} />
  </linearGradient>
)

function Textiles() {
  return (
    <g>
      <ellipse cx="86" cy="126" rx="52" ry="9" fill="rgba(20,17,13,0.13)" />
      {/* the bolt: body, shaded left end, lit right */}
      <path
        d="M40 62c0-15 12-27 27-27h44c15 0 27 12 27 27v50c0 15-12 27-27 27H67c-15 0-27-12-27-27z"
        fill="#2b3a5e"
      />
      <path d="M40 62c0-15 12-27 27-27h10v104H67c-15 0-27-12-27-27z" fill="#1d2947" />
      <path d="M58 66c0-11 9-20 20-20h33c11 0 20 9 20 20v42c0 11-9 20-20 20H78c-11 0-20-9-20-20z" fill="#35466e" />
      {/* the kraft band */}
      <path d="M104 36h14v102h-14z" fill="#c9b489" />
      {/* the unrolling tail, falling forward and lying down */}
      <path d="M118 96c14 2 26 10 30 22l6 16c-12 3-24 1-33-4-9-5-14-13-14-22z" fill="#3a4c75" />
      <path d="M120 112c14 2 26 8 34 18-12 2-25 0-34-5z" fill="#46598a" opacity="0.85" />
      <path d="M58 66c0-11 9-20 20-20h6v82h-6c-11 0-20-9-20-20z" fill="#232f52" />
    </g>
  )
}

function Handicrafts() {
  return (
    <g>
      <ellipse cx="86" cy="128" rx="34" ry="7" fill="rgba(20,17,13,0.13)" />
      <path
        d="M70 118c-4-10-8-22-6-34 2-14 10-24 22-24s20 10 22 24c2 12-2 24-6 34z"
        fill="#efe4cd"
      />
      <path d="M68 46h36l3 12H65z" fill="#e3d6ba" />
      <path d="M64 96c14 5 30 5 44 0l2 10c-16 6-32 6-48 0z" fill="#26408f" />
      <path d="M86 60c6 0 10 5 10 11s-4 11-10 11-10-5-10-11 4-11 10-11z" fill="#2b4aa3" opacity="0.9" />
      <path d="M76 71c5-6 15-6 20 0" stroke="#2b4aa3" strokeWidth="2" fill="none" />
      <path d="M86 60v22M75 71h22" stroke="#2b4aa3" strokeWidth="1.2" opacity="0.55" />
      <path d="M72 40h28v6H72z" fill="#d9caab" />
      <path d="M70 118c4-6 10-9 16-9s12 3 16 9z" fill="#cfc0a2" opacity="0.6" />
    </g>
  )
}

function Agriculture() {
  return (
    <g>
      <ellipse cx="86" cy="128" rx="36" ry="8" fill="rgba(20,17,13,0.13)" />
      {/* the sack, slumping, wide at the base */}
      <path
        d="M60 122c-6-16-7-34-3-50 3-12 11-22 21-26l8-3 8 3c10 4 18 14 21 26 4 16 3 34-3 50z"
        fill="#b8944f"
      />
      <path d="M60 122c-6-16-7-34-3-50 3-12 11-22 21-26l4-1v103z" fill="#9c7c3f" />
      {/* the woven surface: a few tapes, lighter */}
      <g stroke="#cda965" strokeWidth="1.1" opacity="0.55">
        <path d="M64 100h44M66 88h40M70 76h32M76 64h20" />
      </g>
      <g stroke="#a4823f" strokeWidth="1" opacity="0.5">
        <path d="M78 50v74M92 50v74" />
      </g>
      {/* the tied neck and the gathered crown */}
      <path d="M78 43h16v6H78z" fill="#6f5730" />
      <path d="M80 30c4-6 12-6 16 0 3 5-1 9-8 9s-11-4-8-9z" fill="#a9873f" />
      {/* the stencil, sunk into the weave */}
      <rect x="72" y="86" width="28" height="16" rx="1" fill="none" stroke="#4a3b22" strokeWidth="1" opacity="0.5" />
      <text x="86" y="97" textAnchor="middle" fontSize="7" fill="#4a3b22" opacity="0.72" fontFamily="monospace">INDIA</text>
      {/* spilled grain */}
      <path d="M104 126c6-3 12-3 17 0-5 3-12 3-17 0z" fill="#e6d4a8" />
      <path d="M46 127c5-2 10-2 14 0-4 2-9 2-14 0z" fill="#e6d4a8" opacity="0.8" />
    </g>
  )
}

function Industrial() {
  return (
    <g>
      <ellipse cx="86" cy="126" rx="34" ry="8" fill="rgba(20,17,13,0.13)" />
      {/* the coil: turns, each a lit band with a dark gap */}
      <g>
        <path d="M56 100h60v18c0 5-13 8-30 8s-30-3-30-8z" fill="#8a4f2a" />
        <ellipse cx="86" cy="100" rx="30" ry="9" fill="#b4703f" />
        <ellipse cx="86" cy="100" rx="22" ry="6" fill="#7c4625" />
        <ellipse cx="86" cy="100" rx="16" ry="4.2" fill="#9c5f34" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <ellipse cx="86" cy={64 + i * 7} rx="30" ry="9" fill="#a5643a" />
            <ellipse cx="86" cy={64 + i * 7} rx="30" ry="9" fill="none" stroke="#5e351c" strokeWidth="1.6" />
            <path d={`M58 ${64 + i * 7} a28 8 0 0 0 56 0`} fill="none" stroke="#d08a52" strokeWidth="1.2" opacity="0.6" />
          </g>
        ))}
        {/* the free end, lifting off the top turn */}
        <path d="M104 62c6-4 12-6 18-5" stroke="#b4703f" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M104 62c6-4 12-6 18-5" stroke="#d08a52" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7" />
        {/* brass collars */}
        <ellipse cx="86" cy="82" rx="30.5" ry="9" fill="none" stroke="#c08a4a" strokeWidth="2.4" />
        <ellipse cx="86" cy="110" rx="30.5" ry="9" fill="none" stroke="#c08a4a" strokeWidth="2.4" opacity="0.85" />
      </g>
    </g>
  )
}

function Organic() {
  return (
    <g>
      <ellipse cx="86" cy="126" rx="28" ry="7" fill="rgba(20,17,13,0.12)" />
      {/* five lobes of lint, the front ones lighter */}
      <g fill="#faf5ea">
        <path d="M86 52c14 0 24 10 24 22s-10 20-24 20-24-8-24-20 10-22 24-22z" />
        <path d="M64 68c10-8 22-4 22 10s-10 24-20 20-12-22-2-30z" fill="#f2ebdc" />
        <path d="M108 68c-10-8-22-4-22 10s10 24 20 20 12-22 2-30z" fill="#fffdf8" />
        <path d="M86 84c10 6 10 20 2 26s-16 2-18-6 6-24 16-20z" fill="#f7f1e4" />
      </g>
      <g fill="none" stroke="#e6dcc6" strokeWidth="1.2" opacity="0.9">
        <path d="M74 60c6 6 14 10 24 10M70 78c8 2 16 0 22-6M96 92c-2 8-8 14-16 16" />
      </g>
      {/* the dried calyx, splayed behind */}
      <path d="M60 88c-6-6-8-14-6-20 6 2 12 8 14 16z" fill="#7b663e" />
      <path d="M66 100c-8-2-14-8-16-14 8 0 16 4 20 10z" fill="#6b5836" />
      <path d="M62 74c-2-8 0-16 4-20 3 6 4 14 2 20z" fill="#8a7147" />
      <path d="M56 82c-8 2-14 8-16 14 8 2 16 0 20-6z" fill="#7b663e" />
    </g>
  )
}

function General() {
  return (
    <g>
      <ellipse cx="86" cy="128" rx="44" ry="8" fill="rgba(20,17,13,0.13)" />
      {/* right face, lit */}
      <path d="M86 44l38-10v76l-38 12z" fill="#d8b581" />
      {/* front face, in shadow */}
      <path d="M48 34l38 10v78l-38-12z" fill="#b8975f" />
      {/* top */}
      <path d="M48 34l38-8 38 8-38 10z" fill="#e6c897" />
      {/* corner battens */}
      <path d="M48 34v76l6 2V36z" fill="#a98951" />
      <path d="M118 44v70l6-2V44z" fill="#c3a26c" />
      <path d="M82 42v78l8 2V44z" fill="#ab8b53" />
      {/* board seams */}
      <g stroke="#8f7040" strokeWidth="1" opacity="0.65">
        <path d="M52 58l30 8M52 84l30 8M90 54l32-8M90 78l32-8" />
      </g>
      {/* the stencil */}
      <g fill="#3a2e1c" opacity="0.62" fontFamily="monospace" textAnchor="middle">
        <text x="67" y="70" fontSize="6.5">BS EXIMNEXUS</text>
        <text x="67" y="80" fontSize="5">MADE IN INDIA</text>
        <text x="67" y="89" fontSize="4.4">NET 25 KG</text>
      </g>
    </g>
  )
}

const ART: Record<CategoryMotif, () => React.ReactElement> = {
  textiles: Textiles,
  handicrafts: Handicrafts,
  agriculture: Agriculture,
  industrial: Industrial,
  organic: Organic,
  general: General,
}

/**
 * The still for one category. Decorative in every use: the tile's own label and
 * link carry the meaning, so this is hidden from assistive technology.
 */
export function CategoryPoster({ motif, className }: Props) {
  const Art = ART[motif]
  const id = `poster-${motif}`
  return (
    <svg
      className={className ? `poster ${className}` : 'poster'}
      viewBox="0 0 172 140"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>{light(id)}</defs>
      <Art />
      {/* The same soft ground shadow the 3D row uses, so the two read alike. */}
      <ellipse cx="86" cy="132" rx="46" ry="5" fill="rgba(20,17,13,0.06)" />
    </svg>
  )
}
