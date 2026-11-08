import { TextTransitions } from './components/TextTransitions'
import React from 'react'
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Cursor } from './components/Cursor'
import { LogoIntro } from './components/LogoIntro'
import { EnquiryProvider } from './components/EnquiryForm'

/* The pages are static imports on purpose.
 *
 * Splitting them by route was the first attempt at getting the scenes off the
 * critical path, and it worked for that: the privacy page stopped downloading
 * the globe. But it made every page's own text late too — the nav and the
 * footer painted immediately around an empty main, then the page appeared under
 * them, and the textile hero's title arrived a second after the header it
 * belongs to. Measured, that was the largest layout shift on the site, and it
 * was a shift I had introduced.
 *
 * The scenes are the expensive part, and they are already split at their own
 * boundaries — `Stage` fetches a scene module on demand, and the product row
 * fetches its gallery the same way. So the pages can be static and still not
 * carry three: what the entry chunk contains is the markup and the words, which
 * is exactly what should be there. */
import Overview from './pages/Overview'
import Textiles from './pages/Textiles'
import Enquiry from './pages/Enquiry'
import Acknowledgement from './pages/Acknowledgement'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  const navigationType = useNavigationType()
  const positions = React.useRef(new Map<string, number>())
  const scroll = React.useRef(0)
  const lastPath = React.useRef(pathname)

  React.useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      scroll.current = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      document.documentElement.style.setProperty('--progress', p.toFixed(4))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [pathname])

  React.useLayoutEffect(() => () => { positions.current.set(key, scroll.current) }, [key])
  React.useEffect(() => {
    if (navigationType === 'POP' && positions.current.has(key)) {
      const frame = requestAnimationFrame(() => window.scrollTo({top:positions.current.get(key)!, behavior:'instant'}))
      return () => cancelAnimationFrame(frame)
    }
    const changedRoute = lastPath.current !== pathname
    lastPath.current = pathname
    if (changedRoute) document.getElementById('main')?.focus({ preventScroll: true })
    if (hash) {
      let id = hash.slice(1)
      try { id = decodeURIComponent(id) } catch { /* Keep the literal fragment. */ }
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash, key, navigationType])

  return null
}

function PageMetadata() {
  const { pathname } = useLocation()
  React.useEffect(() => {
    const pages: Record<string, [string, string]> = {
      '/': ['BS EXIMNEXUS | Import and export sourcing in India', 'India-focused sourcing and trade coordination for buyers and suppliers.'],
      '/textiles': ['Textiles and fabrics | BS EXIMNEXUS', 'Explore fabric types and textile sourcing areas in India.'],
      '/enquiry': ['Start an enquiry | BS EXIMNEXUS', 'Describe what you need or supply to start a sourcing enquiry.'],
      '/privacy': ['Enquiry privacy | BS EXIMNEXUS', 'How enquiry information is handled.'],
      '/enquiry/acknowledgement': ['Enquiry acknowledgement | BS EXIMNEXUS', 'Submission status for this browser session.'],
    }
    const [title, description] = pages[pathname] ?? ['Page not found | BS EXIMNEXUS', 'This page is not part of the BS EXIMNEXUS website.']
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
    const publicPage = ['/', '/textiles', '/enquiry', '/privacy'].includes(pathname)
    const preview = /(^localhost$|^127\.|\.e2b\.app$)/.test(location.hostname)
    document.querySelector('meta[name="robots"]')?.setAttribute('content', publicPage && !preview ? 'index,follow' : 'noindex,follow')
    // Never publish an invented domain. An optional verified deployment URL
    // overrides the current origin; query strings and fragments are excluded.
    let origin = location.origin
    try {
      const configured = import.meta.env.VITE_SITE_URL
      if (configured && /^https?:/.test(new URL(configured).protocol)) origin = new URL(configured).origin
    } catch { /* Use the actual serving origin for invalid configuration. */ }
    const canonical = new URL(pathname, origin).href
    const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement('link')
    link.rel = 'canonical'; link.href = canonical
    if (!link.parentNode) document.head.appendChild(link)
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <EnquiryProvider><div className="app grain">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollManager />
      <TextTransitions />
      <PageMetadata />
      <Cursor />
      <LogoIntro />
      <Nav />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/textiles" element={<Textiles />} />
          <Route path="/enquiry" element={<Enquiry />} />
          <Route path="/enquiry/acknowledgement" element={<Acknowledgement />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div></EnquiryProvider>
  )
}
