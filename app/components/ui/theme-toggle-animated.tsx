import React, { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export type ThemeToggleSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ThemeToggleAnimatedProps {
  /** Current state: true for night/dark mode, false for day/light mode */
  isDark?: boolean
  /** Uncontrolled default state */
  defaultDark?: boolean
  /** Callback fired when state toggles */
  onToggle?: (isDark: boolean) => void
  /** Size preset: xs (50px, navbar tight), sm (60px, navbar default), md (90px), lg (120px) */
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

// Configuration dimensions per size preset
const SIZE_CONFIG = {
  xs: {
    width: 50,
    height: 26,
    knobSize: 20,
    padding: 3,
    travel: 24,
    cloudScale: 0.48,
    starScale: 0.55,
  },
  sm: {
    width: 60,
    height: 30,
    knobSize: 22,
    padding: 4,
    travel: 30,
    cloudScale: 0.62,
    starScale: 0.68,
  },
  md: {
    width: 90,
    height: 44,
    knobSize: 34,
    padding: 5,
    travel: 46,
    cloudScale: 0.88,
    starScale: 0.9,
  },
  lg: {
    width: 120,
    height: 56,
    knobSize: 44,
    padding: 6,
    travel: 64,
    cloudScale: 1.15,
    starScale: 1.15,
  },
} as const

// 4-point sparkle star SVG component
function SparkleStar({
  size = 12,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
    </svg>
  )
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
  const prefersReducedMotion = useReducedMotion()

  // Uncontrolled state fallback
  const [internalDark, setInternalDark] = React.useState(defaultDark)
  const isDark = controlledDark !== undefined ? controlledDark : internalDark

  const config = SIZE_CONFIG[size] || SIZE_CONFIG.md

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

  // Physics springs
  const knobSpring = prefersReducedMotion
    ? { duration: 0.15 }
    : {
        type: 'spring' as const,
        stiffness: 380,
        damping: 26,
        mass: 0.85,
      }

  const atmosphereTransition = prefersReducedMotion
    ? { duration: 0.2 }
    : {
        type: 'spring' as const,
        stiffness: 280,
        damping: 26,
      }

  return (
    <button
      id={toggleId}
      role="switch"
      type="button"
      aria-checked={isDark}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`group relative inline-flex shrink-0 items-center rounded-full p-0 transition-shadow select-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{
        width: config.width,
        height: config.height,
      }}
    >
      {/* Pill Outer Shell with soft depth bezel */}
      <motion.div
        className="relative size-full overflow-hidden rounded-full border shadow-lg"
        initial={false}
        animate={{
          background: isDark
            ? 'linear-gradient(180deg, #090e1a 0%, #111a2e 45%, #1e1b4b 100%)'
            : 'linear-gradient(180deg, #38bdf8 0%, #60a5fa 55%, #93c5fd 100%)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.16)'
            : 'rgba(255, 255, 255, 0.55)',
          boxShadow: isDark
            ? 'inset 0 3px 6px rgba(0, 0, 0, 0.5), inset 0 -2px 4px rgba(255, 255, 255, 0.1), 0 8px 24px -4px rgba(15, 23, 42, 0.45)'
            : 'inset 0 3px 6px rgba(0, 0, 0, 0.16), inset 0 -2px 5px rgba(255, 255, 255, 0.6), 0 8px 20px -4px rgba(56, 189, 248, 0.35)',
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ========================================================= */}
        {/* DAY MODE ATMOSPHERE (Sun Halo & Corona Rings)             */}
        {/* ========================================================= */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{
            opacity: isDark ? 0 : 1,
            scale: isDark ? 0.8 : 1,
          }}
          transition={atmosphereTransition}
        >
          {/* Subtle concentric sun corona waves centered at the left knob */}
          <motion.div
            className="pointer-events-none absolute rounded-full border border-white/25 bg-white/10"
            style={{
              width: config.knobSize * 1.6,
              height: config.knobSize * 1.6,
              left: config.padding - (config.knobSize * 0.6) / 2,
              top: config.padding - (config.knobSize * 0.6) / 2,
            }}
            animate={
              !isDark && !prefersReducedMotion
                ? {
                    scale: [1, 1.08, 1],
                    opacity: [0.7, 1, 0.7],
                  }
                : { scale: 1, opacity: 0.8 }
            }
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="pointer-events-none absolute rounded-full border border-white/20 bg-white/5"
            style={{
              width: config.knobSize * 2.2,
              height: config.knobSize * 2.2,
              left: config.padding - (config.knobSize * 1.2) / 2,
              top: config.padding - (config.knobSize * 1.2) / 2,
            }}
            animate={
              !isDark && !prefersReducedMotion
                ? {
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.85, 0.5],
                  }
                : { scale: 1, opacity: 0.6 }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.6,
            }}
          />
          <motion.div
            className="pointer-events-none absolute rounded-full border border-white/15"
            style={{
              width: config.knobSize * 2.9,
              height: config.knobSize * 2.9,
              left: config.padding - (config.knobSize * 1.9) / 2,
              top: config.padding - (config.knobSize * 1.9) / 2,
            }}
            animate={
              !isDark && !prefersReducedMotion
                ? {
                    scale: [1, 1.12, 1],
                    opacity: [0.35, 0.7, 0.35],
                  }
                : { scale: 1, opacity: 0.4 }
            }
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.2,
            }}
          />

          {/* Daytime Sun Glint / Sparkle */}
          <motion.div
            className="absolute text-amber-100"
            style={{
              left: `${config.width * 0.44}px`,
              top: `${config.height * 0.2}px`,
            }}
            animate={
              !isDark && !prefersReducedMotion
                ? {
                    opacity: [0.25, 0.95, 0.25],
                    scale: [0.8, 1.15, 0.8],
                    rotate: [0, 45, 0],
                  }
                : { opacity: 0.8, scale: 1, rotate: 0 }
            }
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <SparkleStar size={Math.round(8 * config.starScale)} />
          </motion.div>

          {/* Daytime floating sun dots */}
          <motion.div
            className="absolute rounded-full bg-amber-200/90 shadow-[0_0_3px_#fde68a]"
            style={{
              width: 2.2 * config.starScale,
              height: 2.2 * config.starScale,
              left: `${config.width * 0.36}px`,
              top: `${config.height * 0.56}px`,
            }}
            animate={
              !isDark && !prefersReducedMotion
                ? { opacity: [0.2, 0.85, 0.2], scale: [0.85, 1.15, 0.85] }
                : { opacity: 0.6 }
            }
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />

          <motion.div
            className="absolute rounded-full bg-white shadow-[0_0_3px_#ffffff]"
            style={{
              width: 1.8 * config.starScale,
              height: 1.8 * config.starScale,
              left: `${config.width * 0.32}px`,
              top: `${config.height * 0.28}px`,
            }}
            animate={
              !isDark && !prefersReducedMotion
                ? { opacity: [0.15, 0.85, 0.15], scale: [0.8, 1.1, 0.8] }
                : { opacity: 0.5 }
            }
            transition={{
              duration: 2.9,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.2,
            }}
          />
        </motion.div>

        {/* ========================================================= */}
        {/* NIGHT MODE STARFIELD & TWINKLES                           */}
        {/* ========================================================= */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{
            opacity: isDark ? 1 : 0,
            y: isDark ? 0 : -14,
            scale: isDark ? 1 : 0.6,
          }}
          transition={atmosphereTransition}
        >
          {/* Star 1: Primary 4-point sparkle */}
          <motion.div
            className="absolute text-amber-100"
            style={{
              left: `${config.width * 0.16}px`,
              top: `${config.height * 0.22}px`,
            }}
            animate={
              isDark && !prefersReducedMotion
                ? {
                    opacity: [0.35, 1, 0.35],
                    scale: [0.85, 1.15, 0.85],
                  }
                : { opacity: 1, scale: 1 }
            }
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <SparkleStar size={Math.round(11 * config.starScale)} />
          </motion.div>

          {/* Star 2: Medium sparkle at center */}
          <motion.div
            className="absolute text-sky-100"
            style={{
              left: `${config.width * 0.36}px`,
              top: `${config.height * 0.44}px`,
            }}
            animate={
              isDark && !prefersReducedMotion
                ? {
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.15, 0.8],
                  }
                : { opacity: 0.9, scale: 1 }
            }
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.6,
            }}
          >
            <SparkleStar size={Math.round(8 * config.starScale)} />
          </motion.div>

          {/* Star 3: Small sparkle lower-left */}
          <motion.div
            className="absolute text-indigo-100"
            style={{
              left: `${config.width * 0.22}px`,
              top: `${config.height * 0.66}px`,
            }}
            animate={
              isDark && !prefersReducedMotion
                ? {
                    opacity: [0.4, 1, 0.4],
                    scale: [0.8, 1.2, 0.8],
                  }
                : { opacity: 0.85, scale: 1 }
            }
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.1,
            }}
          >
            <SparkleStar size={Math.round(6 * config.starScale)} />
          </motion.div>

          {/* Circular twinkle dots */}
          <motion.div
            className="absolute rounded-full bg-white shadow-[0_0_4px_#ffffff]"
            style={{
              width: 3 * config.starScale,
              height: 3 * config.starScale,
              left: `${config.width * 0.46}px`,
              top: `${config.height * 0.22}px`,
            }}
            animate={
              isDark && !prefersReducedMotion
                ? { opacity: [0.2, 1, 0.2] }
                : { opacity: 0.8 }
            }
            transition={{
              duration: 1.9,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />

          <motion.div
            className="absolute rounded-full bg-amber-200/90 shadow-[0_0_3px_#fde68a]"
            style={{
              width: 2.5 * config.starScale,
              height: 2.5 * config.starScale,
              left: `${config.width * 0.12}px`,
              top: `${config.height * 0.5}px`,
            }}
            animate={
              isDark && !prefersReducedMotion
                ? { opacity: [0.25, 0.95, 0.25] }
                : { opacity: 0.7 }
            }
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.9,
            }}
          />

          <motion.div
            className="absolute rounded-full bg-sky-200"
            style={{
              width: 2 * config.starScale,
              height: 2 * config.starScale,
              left: `${config.width * 0.3}px`,
              top: `${config.height * 0.18}px`,
            }}
            animate={
              isDark && !prefersReducedMotion
                ? { opacity: [0.15, 0.85, 0.15] }
                : { opacity: 0.6 }
            }
            transition={{
              duration: 2.1,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.4,
            }}
          />

          <motion.div
            className="absolute rounded-full bg-white/90"
            style={{
              width: 2.5 * config.starScale,
              height: 2.5 * config.starScale,
              left: `${config.width * 0.54}px`,
              top: `${config.height * 0.55}px`,
            }}
            animate={
              isDark && !prefersReducedMotion
                ? { opacity: [0.2, 0.9, 0.2] }
                : { opacity: 0.7 }
            }
            transition={{
              duration: 2.7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </motion.div>

        {/* ========================================================= */}
        {/* DAY MODE CLOUDS (Layered Puffy Cumulus)                   */}
        {/* ========================================================= */}
        <motion.div
          className="pointer-events-none absolute right-0 bottom-0 select-none"
          initial={false}
          animate={{
            y: isDark ? 42 : 0,
            x: isDark ? 16 : 0,
            opacity: isDark ? 0 : 1,
            scale: isDark ? 0.8 : 1,
          }}
          transition={atmosphereTransition}
          style={{ transformOrigin: 'bottom right' }}
        >
          {/* Back translucent cloud layer with gentle floating drift */}
          <motion.div
            className="absolute right-3.5 bottom-1 opacity-65"
            style={{
              transformOrigin: 'bottom right',
            }}
            animate={
              !isDark && !prefersReducedMotion
                ? {
                    x: [0, 1.5, 0],
                    y: [0, -1, 0],
                    scale: [
                      config.cloudScale * 0.9,
                      config.cloudScale * 0.93,
                      config.cloudScale * 0.9,
                    ],
                  }
                : { scale: config.cloudScale * 0.9, x: 0, y: 0 }
            }
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="relative">
              <div className="size-6 rounded-full bg-white/80" />
              <div className="absolute -top-3 left-3 size-8 rounded-full bg-white/85" />
              <div className="absolute top-1 left-8 size-5 rounded-full bg-white/80" />
            </div>
          </motion.div>

          {/* Front crisp white cloud cluster with gentle floating bob */}
          <motion.div
            className="relative right-0 bottom-0"
            style={{
              transformOrigin: 'bottom right',
            }}
            animate={
              !isDark && !prefersReducedMotion
                ? {
                    x: [0, -1.2, 0],
                    y: [0, -2, 0],
                    scale: [
                      config.cloudScale,
                      config.cloudScale * 1.025,
                      config.cloudScale,
                    ],
                  }
                : { scale: config.cloudScale, x: 0, y: 0 }
            }
            transition={{
              duration: 3.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="relative drop-shadow-[0_2px_4px_rgba(15,23,42,0.12)]">
              {/* Overlapping cloud bubbles */}
              <div className="absolute -bottom-1 -left-12 h-6 w-20 rounded-full bg-white" />
              <div className="absolute -bottom-1 -left-10 size-7 rounded-full bg-white" />
              <div className="absolute -top-4 -left-6 size-9 rounded-full bg-white" />
              <div className="absolute -top-1 left-0 size-7 rounded-full bg-white" />
              <div className="absolute bottom-0 left-4 size-5 rounded-full bg-white" />
            </div>
          </motion.div>
        </motion.div>

        {/* ========================================================= */}
        {/* THE SLIDING KNOB (Sun & Moon Transformation)              */}
        {/* ========================================================= */}
        <motion.div
          className="absolute z-10 flex items-center justify-center rounded-full"
          style={{
            top: config.padding,
            left: config.padding,
            width: config.knobSize,
            height: config.knobSize,
          }}
          initial={false}
          animate={{
            x: isDark ? config.travel : 0,
            rotate: isDark ? 360 : 0,
          }}
          transition={knobSpring}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
        >
          {/* Sun Knob Body with gentle solar radiance breathing */}
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={false}
            animate={
              isDark
                ? { opacity: 0, scale: 0.75 }
                : !prefersReducedMotion
                  ? {
                      opacity: 1,
                      scale: [1, 1.03, 1],
                      boxShadow: [
                        '0 0 14px rgba(245, 158, 11, 0.7), 0 0 24px rgba(251, 191, 36, 0.4), inset -2px -2px 4px rgba(180, 83, 9, 0.45), inset 2px 2px 4px rgba(255, 255, 255, 0.9)',
                        '0 0 20px rgba(245, 158, 11, 0.9), 0 0 32px rgba(251, 191, 36, 0.55), inset -2px -2px 4px rgba(180, 83, 9, 0.45), inset 2px 2px 4px rgba(255, 255, 255, 0.95)',
                        '0 0 14px rgba(245, 158, 11, 0.7), 0 0 24px rgba(251, 191, 36, 0.4), inset -2px -2px 4px rgba(180, 83, 9, 0.45), inset 2px 2px 4px rgba(255, 255, 255, 0.9)',
                      ],
                    }
                  : { opacity: 1, scale: 1 }
            }
            transition={
              isDark
                ? { duration: 0.35, ease: 'easeInOut' }
                : {
                    scale: {
                      duration: 3.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                    boxShadow: {
                      duration: 3.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                    opacity: { duration: 0.35 },
                  }
            }
            style={{
              background:
                'radial-gradient(circle at 35% 35%, #fffde7 0%, #ffeb3b 35%, #f59e0b 75%, #d97706 100%)',
            }}
          >
            {/* Subtle radial glare ring with gentle breathing */}
            <motion.div
              className="absolute top-1 left-1.5 size-2.5 rounded-full bg-white/70 blur-[0.5px]"
              animate={
                !isDark && !prefersReducedMotion
                  ? { opacity: [0.65, 0.95, 0.65], scale: [0.95, 1.1, 0.95] }
                  : { opacity: 0.7, scale: 1 }
              }
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>

          {/* Moon Knob Body with Craters */}
          <motion.div
            className="absolute inset-0 overflow-hidden rounded-full"
            initial={false}
            animate={{
              opacity: isDark ? 1 : 0,
              scale: isDark ? 1 : 0.75,
            }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              background:
                'radial-gradient(circle at 35% 35%, #ffffff 0%, #f1f5f9 40%, #cbd5e1 75%, #94a3b8 100%)',
              boxShadow:
                '0 0 16px rgba(186, 215, 255, 0.45), 0 0 30px rgba(147, 197, 253, 0.25), inset -2px -2px 4px rgba(71, 85, 105, 0.4), inset 2px 2px 4px rgba(255, 255, 255, 0.9)',
            }}
          >
            {/* Crater 1 (Large - top right) */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: config.knobSize * 0.26,
                height: config.knobSize * 0.26,
                top: '20%',
                right: '22%',
                background: '#94a3b8',
                boxShadow:
                  'inset 1px 1.5px 2px rgba(15, 23, 42, 0.6), 0 1px 1px rgba(255, 255, 255, 0.45)',
              }}
              animate={{
                scale: isDark ? 1 : 0,
                opacity: isDark ? 1 : 0,
              }}
              transition={{
                delay: isDark ? 0.08 : 0,
                duration: 0.25,
              }}
            />

            {/* Crater 2 (Medium - bottom right) */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: config.knobSize * 0.18,
                height: config.knobSize * 0.18,
                bottom: '22%',
                right: '34%',
                background: '#94a3b8',
                boxShadow:
                  'inset 1px 1px 2px rgba(15, 23, 42, 0.55), 0 1px 1px rgba(255, 255, 255, 0.4)',
              }}
              animate={{
                scale: isDark ? 1 : 0,
                opacity: isDark ? 1 : 0,
              }}
              transition={{
                delay: isDark ? 0.12 : 0,
                duration: 0.25,
              }}
            />

            {/* Crater 3 (Small - bottom left) */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: config.knobSize * 0.14,
                height: config.knobSize * 0.14,
                bottom: '34%',
                left: '24%',
                background: '#94a3b8',
                boxShadow:
                  'inset 0.8px 0.8px 1.5px rgba(15, 23, 42, 0.55), 0 1px 1px rgba(255, 255, 255, 0.35)',
              }}
              animate={{
                scale: isDark ? 1 : 0,
                opacity: isDark ? 1 : 0,
              }}
              transition={{
                delay: isDark ? 0.15 : 0,
                duration: 0.25,
              }}
            />

            {/* Moon soft pearl specular highlight */}
            <div className="absolute top-1 left-2 size-2 rounded-full bg-white/80 blur-[0.5px]" />
          </motion.div>
        </motion.div>
      </motion.div>
    </button>
  )
}
