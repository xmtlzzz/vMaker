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

// Applies theme change directly so ThemeToggleAnimated can play its smooth
// hardware-accelerated CSS transition in real-time, matching vBlog's fluid experience.
function commitThemeSwitch(theme: Theme, setTheme: (next: Theme) => void) {
  applyThemeClass(theme)
  setTheme(theme)
}

// Theme, accent and locale are the only preferences the site keeps, and every route
// needs them. They live here so the index and the project detail page cannot drift
// apart; each value is seeded from localStorage and written back on change.
//
// `ownerLabel` fills the `{owner}` placeholder in the copy. It is passed in rather
// than imported so the account is whatever the loader resolved from GitHub, not a
// build-time constant.
export function useSitePreferences(ownerLabel = '') {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'zh'
    try {
      const urlLang = new URLSearchParams(window.location.search).get('lang')
      if (urlLang === 'en' || urlLang === 'zh') {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, urlLang)
        return urlLang
      }
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
      if (stored === 'en' || stored === 'zh') return stored
    } catch {
      // ignore storage access error
    }
    return 'zh'
  })
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    try {
      const urlTheme = new URLSearchParams(window.location.search).get('theme')
      if (urlTheme === 'light' || urlTheme === 'dark') {
        window.localStorage.setItem(THEME_STORAGE_KEY, urlTheme)
        return urlTheme
      }
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') return stored
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    } catch {
      // ignore storage access error
    }
    return 'light'
  })
  const [accentId, setAccentId] = useState<AccentPreset['id']>(() => {
    if (typeof window === 'undefined') return ACCENT_PRESETS[0].id
    try {
      const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY)
      if (ACCENT_PRESETS.some((preset) => preset.id === stored)) {
        return stored as AccentPreset['id']
      }
    } catch {
      // ignore storage access error
    }
    return ACCENT_PRESETS[0].id
  })
  const pickedTheme = useRef(false)

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

  const toggleTheme = useCallback(
    (forcedDark?: boolean) => {
      if (typeof forcedDark === 'boolean') {
        switchTheme(forcedDark ? 'dark' : 'light')
      } else {
        switchTheme(theme === 'dark' ? 'light' : 'dark')
      }
    },
    [switchTheme, theme]
  )

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
