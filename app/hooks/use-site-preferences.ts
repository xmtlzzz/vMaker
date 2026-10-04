import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ACCENT_PRESETS } from '~/data/accents'
import type { AccentPreset } from '~/data/accents'
import { copy, formatCopy } from '~/data/copy'
import type { Locale } from '~/data/copy'
import {
  ACCENT_STORAGE_KEY,
  LOCALE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '~/lib/config'
import type { Theme } from '~/lib/config'

// The theme classes live on <html>; root.tsx applies them before hydration and
// the effect below keeps them in sync afterwards.
function applyThemeClass(theme: Theme) {
  const root = document.documentElement
  const isDark = theme === 'dark'
  root.classList.toggle('dark', isDark)
  root.classList.toggle('theme-dark', isDark)
  root.classList.toggle('theme-light', !isDark)
}

// Only present on <html> for the length of a switch: `theme-switching` turns the
// blanket colour transitions off so a view transition snapshots finished colours
// (see app.css), while `theme-fading` is the fallback that fades every themed
// surface at one shared speed.
const THEME_SWITCH_CLASS = 'theme-switching'
const THEME_FADE_CLASS = 'theme-fading'
const THEME_FADE_MS = 240

// Re-armed on every switch so a rapid toggle cannot cut the previous fade short.
let fadeTimer: number | undefined

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> }
}

// A theme switch repaints the whole page, so it has to commit synchronously —
// the browser snapshots the finished DOM for the crossfade. `react-dom` is
// imported lazily because this hook also sits in the server graph, where the
// switch never runs.
async function commitThemeSwitch(
  theme: Theme,
  setTheme: (next: Theme) => void
) {
  const { flushSync } = await import('react-dom')

  const root = document.documentElement
  const startViewTransition = (
    document as ViewTransitionDocument
  ).startViewTransition?.bind(document)
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (!startViewTransition || reduceMotion) {
    // Reduced motion, or a browser without view transitions. The latter still
    // gets a fade — every themed surface shares one duration, so it reads as a
    // single cross-fade instead of surfaces and text finishing at different
    // times. Nothing is animated when the visitor asked for less motion.
    if (reduceMotion) {
      applyThemeClass(theme)
      flushSync(() => setTheme(theme))
      return
    }

    root.classList.add(THEME_FADE_CLASS)
    // Put the class into the before-change style, so the fade starts from the
    // old colours rather than being skipped as a same-frame change.
    void window.getComputedStyle(root).color
    applyThemeClass(theme)
    flushSync(() => setTheme(theme))

    window.clearTimeout(fadeTimer)
    fadeTimer = window.setTimeout(() => {
      fadeTimer = undefined
      root.classList.remove(THEME_FADE_CLASS)
    }, THEME_FADE_MS + 60)
    return
  }

  root.classList.add(THEME_SWITCH_CLASS)

  try {
    const transition = startViewTransition(() => {
      applyThemeClass(theme)
      flushSync(() => setTheme(theme))
    })

    await transition.finished
  } catch {
    // A skipped transition still settles, but a browser that refuses to start
    // one must not leave the page with its transitions switched off.
    applyThemeClass(theme)
    flushSync(() => setTheme(theme))
  } finally {
    root.classList.remove(THEME_SWITCH_CLASS)
  }
}

// Theme, accent and locale are the only preferences the site keeps, and every route
// needs them. They live here so the index and the project detail page cannot drift
// apart; each value is seeded from localStorage and written back on change.
//
// `ownerLabel` fills the `{owner}` placeholder in the copy. It is passed in rather
// than imported so the account is whatever the loader resolved from GitHub, not a
// build-time constant.
export function useSitePreferences(ownerLabel = '') {
  const [locale, setLocale] = useState<Locale>('zh')
  const [theme, setTheme] = useState<Theme>('light')
  const [accentId, setAccentId] = useState<AccentPreset['id']>(
    ACCENT_PRESETS[0].id
  )
  // React replays a click that lands before hydration finishes, so the toggle can
  // run before this mount effect seeds from localStorage. Seeding must not undo
  // the visitor's own choice.
  const pickedTheme = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!pickedTheme.current) {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme)
      }
    }

    const storedAccent = window.localStorage.getItem(ACCENT_STORAGE_KEY)
    if (ACCENT_PRESETS.some((preset) => preset.id === storedAccent)) {
      setAccentId(storedAccent as AccentPreset['id'])
    }

    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (storedLocale === 'en' || storedLocale === 'zh') setLocale(storedLocale)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 主题类挂在 <html> 上：root.tsx 的内联脚本会在 hydration 前先设置一次，
    // 这里只负责在用户切换主题后保持同步，避免暗色用户看到亮色首屏。
    applyThemeClass(theme)

    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accentId)
  }, [accentId])

  const rawAccent =
    ACCENT_PRESETS.find((preset) => preset.id === accentId) ?? ACCENT_PRESETS[0]

  const activeAccent = useMemo(() => {
    if (theme === 'light' && rawAccent.lightColor && rawAccent.lightRgb) {
      return {
        ...rawAccent,
        color: rawAccent.lightColor,
        rgb: rawAccent.lightRgb,
      }
    }
    return rawAccent
  }, [rawAccent, theme])

  // Theme changes go through the atomic switch instead of a bare setTheme: see
  // commitThemeSwitch above.
  const switchTheme = useCallback((next: Theme) => {
    pickedTheme.current = true

    if (typeof document === 'undefined') {
      setTheme(next)
      return
    }

    void commitThemeSwitch(next, setTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    switchTheme(theme === 'dark' ? 'light' : 'dark')
  }, [switchTheme, theme])

  // Only the owner-related strings carry a placeholder, and formatCopy leaves any
  // other text untouched, so interpolating the whole dictionary is safe.
  const t = useMemo(
    () => formatCopyObject(copy[locale], ownerLabel),
    [locale, ownerLabel]
  )

  return {
    accentId,
    activeAccent,
    isDark: theme === 'dark',
    locale,
    setAccentId,
    setLocale,
    setTheme,
    switchTheme,
    t,
    theme,
    toggleTheme,
  }
}

function formatCopyObject<T extends Record<string, string>>(
  dictionary: T,
  ownerLabel: string
): T {
  if (!ownerLabel) {
    return dictionary
  }

  const values = { owner: ownerLabel }
  const result = {} as Record<string, string>

  for (const [key, value] of Object.entries(dictionary)) {
    result[key] = formatCopy(value, values)
  }

  return result as T
}
