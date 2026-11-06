import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CATEGORIES, getCategory, type CategoryId } from '../content'
import { EnquiryForm, useEnquiryDraft } from './EnquiryForm'
import { Arrow } from './Nav'
import '../styles/products.css'

export function ProductExplorer() {
  const location = useLocation()
  const navigate = useNavigate()
  const { draft, setDraft, sending } = useEnquiryDraft()
  const raw = new URLSearchParams(location.search).get('category')
  const selected = raw === null ? 'textiles' : getCategory(raw).id
  const tabs = React.useRef<(HTMLButtonElement | null)[]>([])
  const strip = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setDraft(previous => previous.subject === selected ? previous : { ...previous, subject: selected })
  }, [selected, setDraft])

  const choose = (id: CategoryId) => {
    if (sending) return
    setDraft(previous => ({ ...previous, subject: id }))
    navigate({ pathname: '/', search: `?category=${encodeURIComponent(id)}`, hash: '#products' }, { preventScrollReset: true })
  }

  const key = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % CATEGORIES.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + CATEGORIES.length) % CATEGORIES.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = CATEGORIES.length - 1
    else return
    event.preventDefault()
    tabs.current[next]?.focus()
    tabs.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  return (
    <section className="product-explorer" id="products">
      <div className="shell">
        <div className="product-explorer__heading">
          <div><p className="eyebrow">Product areas</p><h2>What are you looking to <em className="display-italic">source?</em></h2></div>
          <div className="product-explorer__arrows" aria-label="Scroll product categories">
            <button type="button" aria-label="Scroll categories left" onClick={() => strip.current?.scrollBy({ left: -260, behavior: 'smooth' })}>←</button>
            <button type="button" aria-label="Scroll categories right" onClick={() => strip.current?.scrollBy({ left: 260, behavior: 'smooth' })}>→</button>
          </div>
        </div>
        <div className="product-explorer__tabs" role="tablist" aria-label="Product categories" ref={strip}>
          {CATEGORIES.map((category, index) => (
            <button key={category.id} ref={element => { tabs.current[index] = element }} type="button" role="tab"
              id={`category-tab-${category.id}`} aria-controls="category-panel" aria-selected={selected === category.id}
              tabIndex={selected === category.id ? 0 : -1} disabled={sending} data-cursor="select"
              onClick={() => choose(category.id)} onKeyDown={event => key(event, index)}>
              {category.label}<span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
        <div className="product-explorer__panel" id="category-panel" role="tabpanel" aria-labelledby={`category-tab-${selected}`}>
          {selected === 'textiles' ? (
            <div className="product-explorer__textile">
              <div><p className="eyebrow">Textiles &amp; fabrics</p><h3>Materials with a purpose.</h3><p>Explore fabric types and the sourcing areas of Tamil Nadu and Gujarat.</p></div>
              <div className="product-explorer__actions"><Link to="/textiles" className="btn">Explore textiles <Arrow /></Link><Link to="/enquiry?category=textiles" className="tlink">Textile enquiry</Link></div>
            </div>
          ) : <EnquiryForm />}
        </div>
        <span className="visually-hidden" aria-live="polite">{draft.subject === selected ? '' : 'Updating category'}</span>
      </div>
    </section>
  )
}
