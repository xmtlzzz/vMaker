import { useEffect, useState } from 'react'

import { ACCENT_PRESETS } from '~/data/accents'
import type { AccentPreset } from '~/data/accents'
import { copy } from '~/data/copy'
import type { Locale } from '~/data/copy'
import {
  ACCENT_STORAGE_KEY,
  LOCALE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '~/lib/config'
import type { Theme } from '~/lib/config'

// Theme, accent and locale are the only preferences the site keeps, and every route
// needs them. They live here so the index and the project detail page cannot drift
// apart; each value is seeded from localStorage and written back on change.
export function useSitePreferences() {
  const [locale, setLocale] = useState<Locale>('zh')
  const [theme, setTheme] = useState<Theme>('light')
  const [accentId, setAccentId] = useState<AccentPreset['id']>(
    ACCENT_PRESETS[0].id
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme)

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
    const root = document.documentElement
    const isDarkTheme = theme === 'dark'
    root.classList.toggle('dark', isDarkTheme)
    root.classList.toggle('theme-dark', isDarkTheme)
    root.classList.toggle('theme-light', !isDarkTheme)

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

  const activeAccent =
    ACCENT_PRESETS.find((preset) => preset.id === accentId) ?? ACCENT_PRESETS[0]

  return {
    accentId,
    activeAccent,
    isDark: theme === 'dark',
    locale,
    setAccentId,
    setLocale,
    setTheme,
    t: copy[locale],
    theme,
  }
}
