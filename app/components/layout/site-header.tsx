import type { CSSProperties } from 'react'
import { Menu, Moon, Palette, Sun, X } from 'lucide-react'

import type { AccentPreset } from '~/data/accents'
import { ThemeToggleAnimated } from '~/components/ui/theme-toggle-animated'
import type { Locale } from '~/data/copy'
import type { Theme } from '~/lib/config'
import { ownerLabel } from '~/lib/github/types'
import type { GitHubOwner } from '~/lib/github/types'

export type SiteHeaderProps = {
  accentId: AccentPreset['id']
  accentPresets: AccentPreset[]
  isAccentMenuOpen: boolean
  isMenuOpen: boolean
  locale: Locale
  onAccentChange: (accentId: AccentPreset['id']) => void
  onAccentMenuToggle: () => void
  onMenuToggle: () => void
  onThemeToggle: () => void
  owner: GitHubOwner
  setLocale: (locale: Locale) => void
  t: Record<string, string>
  theme: Theme
}

export function SiteHeader({
  accentId,
  accentPresets,
  isAccentMenuOpen,
  isMenuOpen,
  locale,
  onAccentChange,
  onAccentMenuToggle,
  onMenuToggle,
  onThemeToggle,
  owner,
  setLocale,
  t,
  theme,
}: SiteHeaderProps) {
  const navItems = [
    { href: '/#projects', index: '01', label: t.works },
    { href: '/toggle-demo', index: '02', label: 'Theme Toggle' },
  ]
  const ownerHref = owner.url || `https://github.com/${owner.login}`
  const ownerName = ownerLabel(owner)

  return (
    <header className="absolute top-0 left-0 z-10 w-full">
      <div className="hero-nav-shell mx-auto max-w-[1340px] px-[15px] py-9">
        <div className="flex items-center justify-between gap-6">
          <a
            className="text-sm font-semibold tracking-[0.18em] text-white uppercase"
            href="/"
          >
            vMaker
          </a>

          <nav className="hero-desktop-nav flex items-center gap-6">
            {navItems.map((item) => (
              <a
                className="nav-link-underline group flex items-center gap-2 text-white/88"
                href={item.href}
                key={item.label}
              >
                <span className="text-[8px] leading-3 font-medium tracking-[-0.08px] uppercase">
                  {item.index}
                </span>
                <span className="text-xs leading-4 font-medium tracking-[-0.12px] uppercase">
                  {item.label}
                </span>
              </a>
            ))}
          </nav>

          <div className="hero-desktop-meta flex items-center gap-3 text-right">
            <a
              className="text-xs font-medium tracking-[-0.12px] text-white/88 uppercase"
              href={ownerHref}
              rel="noreferrer"
              target="_blank"
            >
              GitHub / {ownerName}
            </a>
            <button
              aria-label={t.changeLocale}
              className="hero-icon-button"
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              type="button"
            >
              {locale === 'en' ? '中' : 'EN'}
            </button>
            <ThemeToggleAnimated
              aria-label={t.changeTheme}
              isDark={theme === 'dark'}
              onToggle={onThemeToggle}
              size="sm"
            />
            <div className="hero-accent-picker">
              <button
                aria-label={t.changeAccent}
                className="hero-icon-button"
                onClick={onAccentMenuToggle}
                type="button"
              >
                <Palette className="size-4" />
              </button>
              <div
                hidden={!isAccentMenuOpen}
                className={`hero-accent-menu ${isAccentMenuOpen ? 'open' : ''}`}
              >
                {accentPresets.map((preset) => (
                  <button
                    aria-label={preset.label}
                    className={`hero-accent-swatch ${accentId === preset.id ? 'is-active' : ''}`}
                    key={preset.id}
                    onClick={() => onAccentChange(preset.id)}
                    style={{ '--swatch-color': preset.color } as CSSProperties}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="hero-mobile-actions">
            <button
              aria-label={t.changeLocale}
              className="hero-icon-button"
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              type="button"
            >
              {locale === 'en' ? '中' : 'EN'}
            </button>
            <ThemeToggleAnimated
              aria-label={t.changeTheme}
              isDark={theme === 'dark'}
              onToggle={onThemeToggle}
              size="sm"
            />
            <div className="hero-accent-picker">
              <button
                aria-label={t.changeAccent}
                className="hero-icon-button"
                onClick={onAccentMenuToggle}
                type="button"
              >
                <Palette className="size-4" />
              </button>
              <div
                hidden={!isAccentMenuOpen}
                className={`hero-accent-menu ${isAccentMenuOpen ? 'open' : ''}`}
              >
                {accentPresets.map((preset) => (
                  <button
                    aria-label={preset.label}
                    className={`hero-accent-swatch ${accentId === preset.id ? 'is-active' : ''}`}
                    key={preset.id}
                    onClick={() => onAccentChange(preset.id)}
                    style={{ '--swatch-color': preset.color } as CSSProperties}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <button
              aria-expanded={isMenuOpen}
              aria-controls="hero-mobile-navigation"
              className="hero-menu-button"
              onClick={onMenuToggle}
              type="button"
            >
              <span>{isMenuOpen ? t.close : t.menu}</span>
              {isMenuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div
          id="hero-mobile-navigation"
          hidden={!isMenuOpen}
          className={`hero-mobile-panel ${isMenuOpen ? 'open' : ''}`}
        >
          <div className="hero-mobile-panel-inner">
            <div className="mt-6 flex flex-col gap-5">
              {navItems.map((item) => (
                <a
                  className="text-[28px] leading-8 font-medium tracking-[-0.84px] text-white uppercase"
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-2 text-sm text-white/58">
              <a href={ownerHref} rel="noreferrer" target="_blank">
                GitHub / {ownerName}
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
