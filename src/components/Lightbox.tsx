import React from 'react'

/* A larger view of one picture, using the native <dialog>: it traps focus,
   closes on Escape, keeps the page behind it inert, and returns focus to the
   button that opened it. A click on the backdrop also closes it. */

export type LightboxImage = { src: string; alt: string; title: string; caption: string }

export function Lightbox({ image, onClose }: { image: LightboxImage | null; onClose: () => void }) {
  const dialog = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (image && !el.open) el.showModal()
    if (!image && el.open) el.close()
  }, [image])

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={image?.title}
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {image && (
        <figure className="lightbox__card">
          <button type="button" className="lightbox__close" onClick={onClose}>
            <span className="visually-hidden">Close</span>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
          </button>
          <img src={image.src} alt={image.alt} />
          <figcaption>
            <strong>{image.title}</strong>
            <span>{image.caption}</span>
          </figcaption>
        </figure>
      )}
    </dialog>
  )
}
