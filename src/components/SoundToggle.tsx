import React from 'react'
import { installClickSound, onSoundChange, playClick, setSound, soundOn } from './click-sound'

/* Speaker button beside the theme toggle. On by default; muting is
   remembered. The sound waves fold away when muted and a slash draws across. */
export function SoundToggle() {
  const on = React.useSyncExternalStore(onSoundChange, soundOn, () => true)

  React.useEffect(() => installClickSound(), [])

  const toggle = () => {
    const next = !on
    setSound(next)
    if (next) playClick(true)
  }

  return (
    <button
      type="button"
      className="sound-toggle"
      data-on={on}
      data-sound="off"
      onClick={toggle}
      aria-pressed={on}
      title={on ? 'Mute click sounds' : 'Turn click sounds on'}
    >
      <span className="visually-hidden">Click sounds</span>
      <svg className="sound-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
        <path className="sound-toggle__speaker" d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" />
        <path className="sound-toggle__wave sound-toggle__wave--1" d="M15 9.2a4 4 0 0 1 0 5.6" />
        <path className="sound-toggle__wave sound-toggle__wave--2" d="M17.6 6.8a7.4 7.4 0 0 1 0 10.4" />
        <path className="sound-toggle__slash" d="M15 9l5 6" />
      </svg>
    </button>
  )
}
