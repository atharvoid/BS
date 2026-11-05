import React from 'react'
import { Link } from 'react-router-dom'
import { Stage } from '../three/Stage'
import { BobbinObject, Draggable, Ground, Lights, Studio } from '../three/objects'
import { readReceipt } from '../components/EnquiryForm'
import { ACKNOWLEDGEMENT, BUSINESS } from '../content'
import { Arrow } from '../components/Nav'

const ROLE_LABEL: Record<string, string> = {
  'overseas-buyer': 'Overseas buyer',
  'buyer-in-india': 'Buyer in India',
  'indian-supplier': 'Indian supplier',
}

export default function Acknowledgement() {
  const [receipt, setReceipt] = React.useState<ReturnType<typeof readReceipt>>(null)

  React.useEffect(() => {
    setReceipt(readReceipt())
  }, [])

  return (
    <section className="ack on-dark grain">
      <div className="shell ack__inner">
        <div className="ack__text">
          <p className="eyebrow">{ACKNOWLEDGEMENT.eyebrow}</p>
          <h1 className="ack__title">
            {ACKNOWLEDGEMENT.title[0]} <em className="display-italic">{ACKNOWLEDGEMENT.title[1]}</em>.
          </h1>

          <p className="ack__lede">{ACKNOWLEDGEMENT.body}</p>

          <div className="ack__notice">
            <p>
              If nothing arrives, write to{' '}
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> directly.
            </p>
          </div>

          {receipt ? (
            <dl className="ack__receipt">
              <div>
                <dt>About</dt>
                <dd>{receipt.subject === 'textiles' ? 'Textiles and fabrics' : 'General enquiry'}</dd>
              </div>
              <div>
                <dt>Filed as</dt>
                <dd>{ROLE_LABEL[receipt.role] ?? receipt.role}</dd>
              </div>
              <div>
                <dt>Sent</dt>
                <dd>
                  {new Date(receipt.at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="ack__no-receipt">{ACKNOWLEDGEMENT.fallback}</p>
          )}

          <div className="ack__actions">
            <Link to="/" className="btn btn--light">
              {ACKNOWLEDGEMENT.cta}
              <Arrow />
            </Link>
            <Link to="/textiles" className="tlink ack__link">
              {ACKNOWLEDGEMENT.secondary}
            </Link>
          </div>
        </div>

        <div className="ack__canvas">
          <Stage
            label="A bobbin of yarn. Drag to turn it."
            z={5.4}
            fov={36}
            fallback={<div className="ack__canvas-fallback" aria-hidden="true" />}
          >
            <Studio />
            <Lights intensity={1} />
            <Ground y={-1.3} scale={4} opacity={0.4} />
            <Draggable drift={0.22} tilt={0.4} float={0.04}>
              <group position={[0, 0.05, 0]}>
                <BobbinObject scale={0.95} />
              </group>
            </Draggable>
          </Stage>
        </div>
      </div>
    </section>
  )
}
