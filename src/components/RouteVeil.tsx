import React from 'react'
import { useLocation } from 'react-router-dom'

/* ==========================================================================
   Route veil

   When the page changes, a length of indigo cloth, carrying the new page's
   name and a gold thread at its hem, lifts off the page like cloth drawn up
   out of a dye vat. It plays after the new page has rendered, so navigation
   itself never waits for it, and it never takes a click: the cloth is
   pointer-transparent and hidden from assistive technology. Not on first
   load (the logo intro owns that), not for in-page anchors, and not with
   reduced motion.
   ========================================================================== */

const NAMES: Record<string, string> = {
  '/': 'From India to the World',
  '/textiles': 'Textiles & fabrics',
  '/about': 'About',
  '/enquiry': 'Start an enquiry',
  '/enquiry/acknowledgement': 'Thank you',
  '/privacy': 'Privacy',
}

export function RouteVeil() {
  const { pathname } = useLocation()
  const first = React.useRef(true)
  const [run, setRun] = React.useState(0)

  React.useLayoutEffect(() => {
    if (first.current) { first.current = false; return }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setRun((n) => n + 1)
  }, [pathname])

  if (!run) return null
  return (
    <div key={run} className="veil" aria-hidden="true" onAnimationEnd={(e) => { if (e.target === e.currentTarget) setRun(0) }}>
      <span className="veil__name">{NAMES[pathname] ?? 'Not found'}</span>
    </div>
  )
}
