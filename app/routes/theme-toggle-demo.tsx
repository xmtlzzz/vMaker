import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import {
  ThemeToggleAnimated,
  type ThemeToggleSize,
} from '~/components/ui/theme-toggle-animated'
import {
  Sun,
  Moon,
  Sparkles,
  Cloud,
  Layers,
  Code,
  ArrowLeft,
  Check,
  Play,
  Pause,
} from 'lucide-react'

// Procedural background stars for the night page environment
const BACKGROUND_STARS = [
  { id: 1, top: '12%', left: '8%', size: 2, delay: 0 },
  { id: 2, top: '18%', left: '22%', size: 3, delay: 0.6 },
  { id: 3, top: '28%', left: '14%', size: 1.5, delay: 1.2 },
  { id: 4, top: '14%', left: '42%', size: 2, delay: 0.3 },
  { id: 5, top: '22%', left: '62%', size: 2.5, delay: 0.9 },
  { id: 6, top: '16%', left: '84%', size: 3, delay: 0.4 },
  { id: 7, top: '32%', left: '78%', size: 2, delay: 1.5 },
  { id: 8, top: '45%', left: '88%', size: 1.5, delay: 0.8 },
  { id: 9, top: '65%', left: '92%', size: 2, delay: 1.1 },
  { id: 10, top: '78%', left: '82%', size: 3, delay: 0.2 },
  { id: 11, top: '82%', left: '68%', size: 1.5, delay: 1.4 },
  { id: 12, top: '74%', left: '34%', size: 2, delay: 0.7 },
  { id: 13, top: '68%', left: '16%', size: 2.5, delay: 1.0 },
  { id: 14, top: '52%', left: '6%', size: 1.5, delay: 0.5 },
  { id: 15, top: '40%', left: '30%', size: 2, delay: 1.3 },
]

export default function ThemeToggleDemo() {
  const [isDark, setIsDark] = useState(false)
  const [size, setSize] = useState<ThemeToggleSize>('lg')
  const [autoCycle, setAutoCycle] = useState(false)
  const [toggleCount, setToggleCount] = useState(0)
  const [copiedCode, setCopiedCode] = useState(false)

  // Handle toggle trigger
  const handleToggle = (nextState: boolean) => {
    setIsDark(nextState)
    setToggleCount((prev) => prev + 1)
  }

  // Auto-play demo cycle
  useEffect(() => {
    if (!autoCycle) return
    const timer = setInterval(() => {
      setIsDark((prev) => !prev)
      setToggleCount((c) => c + 1)
    }, 3600)
    return () => clearInterval(timer)
  }, [autoCycle])

  const copySnippet = () => {
    const snippet = `<ThemeToggleAnimated\n  isDark={isDark}\n  onToggle={(dark) => setIsDark(dark)}\n  size="${size}"\n/>`
    navigator.clipboard?.writeText(snippet)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <motion.div
      className="relative min-h-screen overflow-x-hidden font-sans transition-colors duration-700 select-none"
      animate={{
        backgroundColor: isDark ? '#080d1a' : '#f0f7ff',
        color: isDark ? '#f1f5f9' : '#0f172a',
      }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ========================================================= */}
      {/* AMBIENT BACKGROUND SCENE (Fluid Day & Night Atmosphere)  */}
      {/* ========================================================= */}

      {/* Daylight Atmospheric Ambient Glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={false}
        animate={{ opacity: isDark ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Soft Golden Sunbeam Halo */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            width: '800px',
            height: '480px',
            background:
              'radial-gradient(circle, rgba(254, 240, 138, 0.45) 0%, rgba(186, 230, 253, 0.4) 45%, transparent 75%)',
          }}
        />
        {/* Sky gradient drift */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(circle at 50% 100%, rgba(224, 242, 254, 0.8) 0%, transparent 60%)',
          }}
        />

        {/* Ambient floating cloud silhouettes in the distance */}
        <div className="absolute top-20 left-10 opacity-30 blur-[1px]">
          <div className="relative">
            <div className="size-16 rounded-full bg-white" />
            <div className="absolute -top-6 left-8 size-20 rounded-full bg-white" />
            <div className="absolute top-2 left-20 size-14 rounded-full bg-white" />
          </div>
        </div>
        <div className="absolute top-36 right-16 opacity-25 blur-[1px]">
          <div className="relative">
            <div className="size-20 rounded-full bg-white" />
            <div className="absolute -top-8 left-10 size-24 rounded-full bg-white" />
            <div className="absolute top-4 left-24 size-16 rounded-full bg-white" />
          </div>
        </div>
      </motion.div>

      {/* Midnight Atmospheric Ambient Glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        initial={false}
        animate={{ opacity: isDark ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Celestial Indigo & Violet Nebula Glow */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            width: '900px',
            height: '520px',
            background:
              'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(79, 70, 229, 0.12) 40%, transparent 75%)',
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            width: '700px',
            height: '350px',
            background:
              'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
          }}
        />

        {/* Ambient procedural starfield */}
        {BACKGROUND_STARS.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
            }}
            animate={
              isDark
                ? {
                    opacity: [0.2, 0.95, 0.2],
                    scale: [0.9, 1.25, 0.9],
                  }
                : { opacity: 0 }
            }
            transition={{
              duration: 2.4 + (star.id % 3) * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: star.delay,
            }}
          />
        ))}
      </motion.div>

      {/* ========================================================= */}
      {/* PAGE CONTENT CONTAINER                                    */}
      {/* ========================================================= */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top Navigation Bar */}
        <header className="mb-12 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm font-medium backdrop-blur-md transition hover:bg-white/90 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900/90"
          >
            <ArrowLeft className="size-4" />
            <span>Back to vMaker</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAutoCycle((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md transition ${
                autoCycle
                  ? 'border-amber-400/50 bg-amber-400/20 text-amber-500 dark:text-amber-300'
                  : 'border-black/10 bg-white/60 hover:bg-white/90 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900/90'
              }`}
            >
              {autoCycle ? (
                <>
                  <Pause className="size-3.5" />
                  <span>Autoplay Active</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5" />
                  <span>Autoplay Demo</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center">
          {/* Feature Badge */}
          <motion.div
            layout
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-slate-800/80"
          >
            <Sparkles className="size-3.5 text-amber-500 dark:text-amber-300" />
            <span>Framer Motion • Zero Image Assets</span>
          </motion.div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Animated Day / Night Theme Toggle
          </h1>
          <p className="mt-3 max-w-xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            Soft pill capsule with shifting cumulus clouds, sparkling stars,
            procedural craters, and synchronized ambient atmosphere.
          </p>

          {/* ======================================================= */}
          {/* THE MAIN TOGGLE STAGE                                   */}
          {/* ======================================================= */}
          <div className="mt-12 flex flex-col items-center justify-center">
            {/* Soft Ambient Radial Pad */}
            <motion.div
              className="relative flex items-center justify-center rounded-3xl p-10 backdrop-blur-xl transition-all"
              animate={{
                backgroundColor: isDark
                  ? 'rgba(15, 23, 42, 0.75)'
                  : 'rgba(255, 255, 255, 0.75)',
                boxShadow: isDark
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                  : '0 25px 50px -12px rgba(56, 189, 248, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(255, 255, 255, 0.6)',
              }}
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <ThemeToggleAnimated
                isDark={isDark}
                onToggle={handleToggle}
                size={size}
              />
            </motion.div>

            {/* Current State Status Pill */}
            <motion.div
              layout
              className="mt-6 flex items-center gap-2.5 rounded-full border border-black/10 bg-white/70 px-5 py-2 text-sm font-medium backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70"
            >
              {isDark ? (
                <>
                  <Moon className="size-4 text-indigo-400" />
                  <span>
                    Midnight Mode —{' '}
                    <span className="text-slate-500 dark:text-slate-400">
                      Twinkling stars & lunar craters
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <Sun className="size-4 text-amber-500" />
                  <span>
                    Daylight Mode —{' '}
                    <span className="text-slate-500 dark:text-slate-400">
                      Solar radiance & drifting clouds
                    </span>
                  </span>
                </>
              )}
            </motion.div>

            {/* Controls Bar: Size Preset Switcher */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                Size:
              </span>
              {(['xs', 'sm', 'md', 'lg'] as ThemeToggleSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    size === s
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                      : 'border border-black/10 bg-white/60 hover:bg-white/90 dark:border-white/10 dark:bg-slate-800/60 dark:hover:bg-slate-800'
                  }`}
                >
                  {s === 'xs' && 'Compact (50px)'}
                  {s === 'sm' && 'Small (60px)'}
                  {s === 'md' && 'Medium (90px)'}
                  {s === 'lg' && 'Large (120px)'}
                </button>
              ))}

              <div className="mx-2 hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-700" />

              <span className="text-xs text-slate-500 dark:text-slate-400">
                Toggled <strong>{toggleCount}</strong> times
              </span>
            </div>
          </div>

          {/* ======================================================= */}
          {/* FEATURE HIGHLIGHT CARDS                                 */}
          {/* ======================================================= */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
            {/* Card 1: Sliding Knob Physics */}
            <motion.div
              layout
              className="rounded-2xl border border-black/10 bg-white/60 p-6 backdrop-blur-md transition-shadow dark:border-white/10 dark:bg-slate-900/60"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-300">
                <Sun className="size-5" />
              </div>
              <h3 className="text-base font-semibold">
                Sun-to-Moon Morph
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Rotates 360° on a responsive spring. Warm solar gradient transitions
                smoothly into pearlescent moon with 3 realistic crater indents.
              </p>
            </motion.div>

            {/* Card 2: Shifting Clouds */}
            <motion.div
              layout
              className="rounded-2xl border border-black/10 bg-white/60 p-6 backdrop-blur-md transition-shadow dark:border-white/10 dark:bg-slate-900/60"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 dark:bg-sky-400/10 dark:text-sky-300">
                <Cloud className="size-5" />
              </div>
              <h3 className="text-base font-semibold">
                Layered Shifting Clouds
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Multi-layered cumulus puffs settle gently at the bottom-right in
                light mode and slide downward into the horizon on dark toggle.
              </p>
            </motion.div>

            {/* Card 3: Twinkling Stars */}
            <motion.div
              layout
              className="rounded-2xl border border-black/10 bg-white/60 p-6 backdrop-blur-md transition-shadow dark:border-white/10 dark:bg-slate-900/60"
            >
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-400/10 dark:text-indigo-300">
                <Sparkles className="size-5" />
              </div>
              <h3 className="text-base font-semibold">
                Twinkling Starfield
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                4-point SVG sparkles and glowing star dots enter with staggered
                delays and run continuous subtle twinkle loops.
              </p>
            </motion.div>
          </div>

          {/* ======================================================= */}
          {/* CODE USAGE SNIPPET                                      */}
          {/* ======================================================= */}
          <div className="mt-12 w-full text-left">
            <div className="rounded-2xl border border-black/10 bg-slate-950 p-6 text-slate-100 shadow-xl dark:border-white/10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Code className="size-4 text-sky-400" />
                  <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                    React + TypeScript Usage
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copySnippet}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                >
                  {copiedCode ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <span>Copy Code</span>
                  )}
                </button>
              </div>

              <pre className="mt-4 overflow-x-auto font-mono text-xs leading-relaxed text-slate-300">
                <code>{`import { ThemeToggleAnimated } from '~/components/ui/theme-toggle-animated'

export function AppHeader() {
  const [isDark, setIsDark] = useState(false)

  return (
    <ThemeToggleAnimated
      isDark={isDark}
      onToggle={(dark) => setIsDark(dark)}
      size="${size}" // 'sm' | 'md' | 'lg'
    />
  )
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
