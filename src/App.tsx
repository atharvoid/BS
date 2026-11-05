import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Cursor } from './components/Cursor'
import { Intro } from './components/Intro'
import Overview from './pages/Overview'
import Textiles from './pages/Textiles'
import Enquiry from './pages/Enquiry'
import Acknowledgement from './pages/Acknowledgement'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

function ScrollManager() {
  const { pathname, hash } = useLocation()

  /* The reading bar is the only thing that consumes scroll progress, so the
     value is written onto the bar itself rather than onto <html>. Setting a
     custom property on the root invalidates style for the entire document, and
     doing that on every scroll frame is enough on its own to make a long page
     feel heavy. Written to one leaf element, the cost is a single style
     recalculation of a 2px strip. */
  React.useEffect(() => {
    let raf = 0
    let bar: HTMLElement | null = null
    const update = () => {
      raf = 0
      if (!bar) bar = document.querySelector<HTMLElement>('.progress')
      if (!bar) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      bar.style.setProperty('--progress', p.toFixed(4))
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
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <div className="app grain">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <ScrollManager />
      <Cursor />
      <Intro />
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
    </div>
  )
}
