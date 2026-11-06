import React from 'react'
import '../styles/select.css'

/* ==========================================================================
   A themed listbox, replacing the browser's own select.

   Why not a `<select>`: the closed control is whatever the operating system
   draws — a Windows chevron on Windows, a pill on iOS, a metal button on macOS
   — and on iOS the arrow is painted by the platform, which is why it never
   matched the arrows on the rest of the site. Nothing in CSS reaches inside
   that popup. So this is a real button plus a real listbox, drawn entirely in
   our own colours, with the same chevron as every other arrow (an inline SVG,
   not a background image), and the whole of the keyboard and screen-reader
   contract the native control gave us for free.

   The contract, spelled out because it is the part that is easy to get wrong:

   - the button carries role="combobox", aria-expanded and aria-controls, and
     points at the active option with aria-activedescendant while open
   - ArrowUp / ArrowDown move the active option, Home / End go to the ends,
     Enter or Space chooses it, Escape closes without choosing, Tab closes
   - typing a letter jumps to the next option starting with it, with a 700 ms
     buffer so "ag" is one search rather than two
   - a press anywhere outside closes it; so does scrolling away from it
   - the list stays inside the viewport on short screens by opening upwards
     when there is more room above than below
   ========================================================================== */

type Choice = { value: string; label: string; hint?: string }

type Props = {
  id: string
  label: string
  value: string
  choices: Choice[]
  disabled?: boolean
  onChange: (value: string) => void
  /** Extra hint under the button, the way a native select has none. */
  hint?: string
}

/** The site's arrow, drawn as geometry rather than fetched as an image. */
function Chevron() {
  return (
    <svg className="select__chevron" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4 7.5 10 13l6-5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  )
}

export function CustomSelect({ id, label, value, choices, disabled = false, onChange, hint }: Props) {
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(() => Math.max(0, choices.findIndex((c) => c.value === value)))
  const [placement, setPlacement] = React.useState<'below' | 'above'>('below')

  const wrap = React.useRef<HTMLDivElement>(null)
  const button = React.useRef<HTMLButtonElement>(null)
  const list = React.useRef<HTMLUListElement>(null)
  const typeahead = React.useRef({ text: '', at: 0 })

  const selected = choices.find((c) => c.value === value) ?? choices[0]
  const listId = `${id}-listbox`
  const optionId = (index: number) => `${id}-option-${index}`

  const close = React.useCallback((focusButton = true) => {
    setOpen(false)
    if (focusButton) button.current?.focus()
  }, [])

  const openList = React.useCallback(() => {
    if (disabled || choices.length === 0) return
    setActive(Math.max(0, choices.findIndex((c) => c.value === value)))
    setOpen(true)
  }, [choices, disabled, value])

  const choose = React.useCallback(
    (index: number) => {
      const choice = choices[index]
      if (!choice) return
      if (choice.value !== value) onChange(choice.value)
      close()
    },
    [choices, close, onChange, value],
  )

  /* Decide which way the list opens, from the room actually available. A list
     that runs off the bottom of a phone screen is the one failure a custom
     control introduces that the native one does not have. */
  React.useLayoutEffect(() => {
    if (!open) return
    const el = wrap.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom
    const above = rect.top
    setPlacement(below < Math.min(rect.height * 4 + 24, 260) && above > below ? 'above' : 'below')
  }, [open])

  /* Keep the active option in view while the arrows walk the list. */
  React.useEffect(() => {
    if (!open) return
    /* Indexed rather than queried by id: the list is rendered in the same order
       as `choices`, and this needs no id escaping. */
    const el = list.current?.children[active] as HTMLElement | undefined
    /* Not every environment implements scrollIntoView; the list still works
       without it, it just will not chase the active row. */
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  /* A press outside, or a scroll that takes the control away, closes it. */
  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && wrap.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  const typeAhead = (key: string) => {
    const now = Date.now()
    const state = typeahead.current
    state.text = now - state.at > 700 ? key.toLowerCase() : state.text + key.toLowerCase()
    state.at = now
    const match = choices.findIndex((c) => c.label.toLowerCase().startsWith(state.text))
    if (match >= 0) {
      if (open) setActive(match)
      else choose(match)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    const { key } = event
    const isOpen = open

    switch (key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) return openList()
        return setActive((i) => (i + 1) % choices.length)
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) return openList()
        return setActive((i) => (i - 1 + choices.length) % choices.length)
      case 'Home':
        if (!isOpen) return
        event.preventDefault()
        return setActive(0)
      case 'End':
        if (!isOpen) return
        event.preventDefault()
        return setActive(choices.length - 1)
      case 'Enter':
        event.preventDefault()
        return isOpen ? choose(active) : openList()
      case ' ':
      case 'Spacebar':
        event.preventDefault()
        return isOpen ? choose(active) : openList()
      case 'Escape':
        if (!isOpen) return
        event.preventDefault()
        return close()
      case 'Tab':
        if (isOpen) setOpen(false)
        return
      default:
        if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) typeAhead(key)
    }
  }

  return (
    <div className="select" ref={wrap} data-open={open ? 'true' : 'false'} data-placement={placement}>
      <button
        ref={button}
        id={id}
        type="button"
        className="select__button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        /* Only while it exists: aria-controls must not point at nothing. */
        aria-controls={open ? listId : undefined}
        aria-label={label}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        data-cursor="action"
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="select__value">{selected?.label}</span>
        <Chevron />
      </button>

      {open ? (
        <ul
          ref={list}
          id={listId}
          className="select__list"
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onKeyDown}
        >
          {choices.map((choice, index) => (
            <li
              key={choice.value}
              id={optionId(index)}
              className="select__option"
              role="option"
              aria-selected={choice.value === value}
              data-active={index === active ? 'true' : 'false'}
              data-cursor="action"
              onPointerEnter={() => setActive(index)}
              /* Choosing on pointerdown would fire before the document listener
                 that closes the list, so the click would be lost. */
              onPointerDown={(event) => {
                event.preventDefault()
                choose(index)
              }}
            >
              <span className="select__option-label">{choice.label}</span>
              {choice.hint ? <span className="select__option-hint">{choice.hint}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {hint ? <p className="select__hint">{hint}</p> : null}
    </div>
  )
}
