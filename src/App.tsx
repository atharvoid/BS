import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Cursor } from './components/Cursor'
import { LogoIntro } from './components/LogoIntro'
import Overview from './pages/Overview'
import Textiles from './pages/Textiles'
import Enquiry from './pages/Enquiry'
import Acknowledgement from './pages/Acknowledgement'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'
import { EnquiryProvider } from './components/EnquiryForm'

function ScrollManager() {
  const { pathname, hash } = useLocation()

  React.useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
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

  React.useEffect(() => {
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
  }, [pathname, hash])

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
    }
    const [title, description] = pages[pathname] ?? ['BS EXIMNEXUS', 'India-focused sourcing and trade coordination.']
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
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
      <PageMetadata />
      <Cursor />
      <LogoIntro />
      <Nav />
      <main id="main">
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
