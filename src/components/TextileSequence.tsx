import React from 'react'
import { FABRIC_TOPICS } from '../content'
import { Stage } from '../three/Stage'
import { ProcessScene, SingleStageScene, type StageKind } from '../three/ProcessScene'
import { useScrollProgress } from './useScrollProgress'

export function TextileSequence() {
  const track = React.useRef<HTMLDivElement>(null)
  const { progress, active } = useScrollProgress(track, FABRIC_TOPICS.length)
  const [mobile, setMobile] = React.useState(() => window.matchMedia('(max-width: 980px)').matches)
  const [mobileActive, setMobileActive] = React.useState(-1)

  React.useEffect(() => {
    const query = window.matchMedia('(max-width: 980px)')
    const update = () => setMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  React.useEffect(() => {
    if (!mobile) return
    let raf = 0
    const update = () => {
      raf = 0
      const plates = [...(track.current?.querySelectorAll<HTMLElement>('.seq-step__plate') ?? [])]
      const visible = plates.map((plate, index) => ({ index, rect: plate.getBoundingClientRect() }))
        .filter(({ rect }) => rect.bottom > 0 && rect.top < window.innerHeight)
      visible.sort((a, b) => Math.abs((a.rect.top + a.rect.bottom) / 2 - window.innerHeight / 2) - Math.abs((b.rect.top + b.rect.bottom) / 2 - window.innerHeight / 2))
      setMobileActive(visible[0]?.index ?? -1)
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [mobile])

  return (
    <section className="process on-dark grain" id="fabric-details">
      <div className="shell"><div className="process__head">
        <h2 className="process__title reveal">What to tell us about your <em className="display-italic">fabric</em>.</h2>
        <p className="process__intro reveal">Share the details you already know. Each object represents textile craft.</p>
      </div></div>
      <div className="sequence" ref={track} style={{ ['--count' as string]: FABRIC_TOPICS.length }}>
        <div className="sequence__pin"><div className="shell sequence__inner">
          {!mobile && <div className="sequence__visual"><div className="sequence__stage">
            <Stage label="Four interactive textile objects. Drag to turn the current object." z={5.1} fov={36} fallback={<div className="sequence__fallback" aria-hidden="true" />}>
              <ProcessScene progress={progress} />
            </Stage>
            <ol className="sequence__rail" aria-hidden="true">{FABRIC_TOPICS.map((topic, i) => <li key={topic.n} className={i === active ? 'is-active' : i < active ? 'is-done' : ''}><span className="sequence__rail-n">{topic.n}</span><span className="sequence__rail-dot" /></li>)}</ol>
            <div className="sequence__progress" aria-hidden="true"><span style={{ ['--p' as string]: active / (FABRIC_TOPICS.length - 1) }} /></div>
          </div></div>}
          <ol className="sequence__text">{FABRIC_TOPICS.map((topic, i) => (
            <li key={topic.n} className={`seq-step ${i === active ? 'is-active' : ''}`}>
              <div className="stage__meta"><span className="stage__n">{topic.n}</span><span className="stage__rule" aria-hidden="true" /><span className="stage__field">{topic.field.join(' / ')}</span></div>
              <h3 className="stage__title">{topic.title}</h3><p className="stage__text">{topic.body}</p><p className="seq-step__object">{topic.objectLabel}</p>
              {mobile && <div className="seq-step__plate">{mobileActive === i ? <Stage label={`Interactive ${topic.objectLabel}. Drag to turn it.`} z={5} fov={36} fallback={<div className="sequence__fallback" aria-hidden="true" />}><SingleStageScene kind={topic.object as StageKind} /></Stage> : <div className="sequence__fallback" aria-hidden="true" />}</div>}
            </li>
          ))}</ol>
        </div></div>
      </div>
    </section>
  )
}
