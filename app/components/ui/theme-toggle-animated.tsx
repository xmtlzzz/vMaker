import React, { useId, useState } from 'react'

export type ThemeToggleSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ThemeToggleAnimatedProps {
  /** Current state: true for night/dark mode, false for day/light mode */
  isDark?: boolean
  /** Uncontrolled default state */
  defaultDark?: boolean
  /** Callback fired when state toggles */
  onToggle?: (isDark: boolean) => void
  /** Size preset: xs, sm, md, lg */
  size?: ThemeToggleSize
  /** Optional custom class name */
  className?: string
  /** Disabled state */
  disabled?: boolean
  /** Accessible label */
  'aria-label'?: string
  /** Optional element ID */
  id?: string
}

export function ThemeToggleAnimated({
  isDark: controlledDark,
  defaultDark = false,
  onToggle,
  size = 'md',
  className = '',
  disabled = false,
  'aria-label': ariaLabel = 'Toggle day and night mode',
  id,
}: ThemeToggleAnimatedProps) {
  const generatedId = useId()
  const toggleId = id || generatedId

  // Uncontrolled state fallback
  const [internalDark, setInternalDark] = useState(defaultDark)
  const isDark = controlledDark !== undefined ? controlledDark : internalDark

  const handleToggle = () => {
    if (disabled) return
    const next = !isDark
    if (controlledDark === undefined) {
      setInternalDark(next)
    }
    onToggle?.(next)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <button
      aria-checked={isDark}
      aria-label={ariaLabel}
      className={`theme-toggle-animated size-${size} ${isDark ? 'is-dark' : ''} ${className}`}
      disabled={disabled}
      id={toggleId}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="switch"
      type="button"
    >
      {/* Sky Pill Outer Background */}
      <div className="toggle-pill-sky">
        {/* DAY ATMOSPHERE: Sun Corona Rings & Sun Glints */}
        <div aria-hidden="true" className="day-atmosphere">
          <div className="corona-ring ring-1" />
          <div className="corona-ring ring-2" />
          <div className="corona-ring ring-3" />
          <svg
            className="sun-glint glint-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
          </svg>
          <span className="sun-dot dot-day-1" />
          <span className="sun-dot dot-day-2" />
        </div>

        {/* NIGHT ATMOSPHERE: Starfield & Twinkles */}
        <div aria-hidden="true" className="night-atmosphere">
          <svg
            className="sparkle-star star-1"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
          </svg>
          <svg
            className="sparkle-star star-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
          </svg>
          <span className="star-dot dot-1" />
          <span className="star-dot dot-2" />
          <span className="star-dot dot-3" />
        </div>

        {/* DAY CLOUDS: Layered Puffy Cumulus */}
        <div aria-hidden="true" className="day-clouds">
          <div className="cloud-back" />
          <div className="cloud-front">
            <span className="cloud-puff puff-base" />
            <span className="cloud-puff puff-1" />
            <span className="cloud-puff puff-2" />
            <span className="cloud-puff puff-3" />
          </div>
        </div>

        {/* THE SLIDING KNOB (Sun & Moon) */}
        <div className="sliding-knob">
          {/* Sun Body */}
          <div aria-hidden="true" className="knob-sun">
            <div className="sun-glare" />
          </div>

          {/* Moon Body with 3 Craters */}
          <div aria-hidden="true" className="knob-moon">
            <span className="crater crater-1" />
            <span className="crater crater-2" />
            <span className="crater crater-3" />
            <span className="moon-glare" />
          </div>
        </div>
      </div>
    </button>
  )
}
