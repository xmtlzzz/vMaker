import { ChevronDown, Ellipsis, Moon, Palette, Search, Sun } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'

import { SiteHeader } from '~/components/layout/site-header'
import { LogoLoop } from '~/components/react-bits/LogoLoop'
import { VariableProximity } from '~/components/react-bits/VariableProximity'
import { EmptyProjects } from '~/components/sections/project-empty'
import { ProjectLanguageSection } from '~/components/sections/project-language-section'
import { Metric } from '~/components/sections/project-metric'
import { ACCENT_PRESETS } from '~/data/accents'
import { HERO_SLIDES } from '~/data/hero-slides'
import { STACK_LOGOS } from '~/data/stack-logos'
import { useRevealOnView } from '~/hooks/use-reveal-on-view'
import { useSitePreferences } from '~/hooks/use-site-preferences'
import { SITE_OG_IMAGE, SITE_URL } from '~/lib/config'
import { githubTokenFromContext } from '~/lib/github/context'
import { matchesQuery, parseSearchQuery, sortProjects } from '~/lib/browse'
import type { SortKey } from '~/lib/browse'
import { formatBytes, formatDate } from '~/lib/format'
import { getProjects } from '~/lib/github/projects'
import type { ProjectPayload } from '~/lib/github/projects'
import { indexTotals, topTopics } from '~/lib/insights'
import { languageNavLabel } from '~/lib/language'
import {
  getLatestCommitTimeline,
  groupProjectsByLanguage,
} from '~/lib/projects-view'
import type { Route } from './+types/home'

export function meta() {
  const title = 'vMaker - Project Index'
  const description =
    'A curated, searchable index of xmtlzzz public GitHub projects, grouped by language with stars, code size, language composition and recent commit activity.'

  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: `${SITE_URL}/` },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'vMaker' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: `${SITE_URL}/` },
    { property: 'og:locale', content: 'zh_CN' },
    { property: 'og:locale:alternate', content: 'en_US' },
    { property: 'og:image', content: SITE_OG_IMAGE },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '600' },
    { property: 'og:image:alt', content: title },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: SITE_OG_IMAGE },
    {
      tagName: 'link',
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'vMaker',
      href: `${SITE_URL}/feed.xml`,
    },
  ]
}

export async function loader({
  context,
}: Route.LoaderArgs): Promise<ProjectPayload> {
  return getProjects(githubTokenFromContext(context))
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { error, projects, summary } = loaderData
  const [query, setQuery] = useState('')
  const {
    accentId,
    activeAccent,
    isDark,
    locale,
    setAccentId,
    setLocale,
    setTheme,
    t,
    theme,
  } = useSitePreferences()
  const [activeIndex, setActiveIndex] = useState(0)
  const [clock, setClock] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccentMenuOpen, setIsAccentMenuOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isProjectControlsOpen, setIsProjectControlsOpen] = useState(false)
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey | 'default'>('default')
  const timelineContainerRef = useRef<HTMLDivElement | null>(null)
  const timelineItemRefs = useRef(new Map<string, HTMLAnchorElement | null>())
  const heroSectionRef = useRef<HTMLElement | null>(null)
  const projectsSectionRef = useRef<HTMLElement | null>(null)
  const moreMenuRef = useRef<HTMLDivElement | null>(null)
  const projectScrollLockedRef = useRef(false)
  const topNavigationRef = useRef(false)
  const location = useLocation()

  const activeSlide = HERO_SLIDES[activeIndex]
  // Filtering always preserves the loader order (featured first). Only an explicit
  // sort choice reorders the list, so the default view is byte-for-byte what it was.
  const filteredProjects = useMemo(() => {
    const trimmed = query.trim()
    const matched = trimmed
      ? projects.filter((project) =>
          matchesQuery(project, parseSearchQuery(trimmed))
        )
      : projects

    return sortKey === 'default' ? matched : sortProjects(matched, sortKey)
  }, [projects, query, sortKey])
  const projectGroups = useMemo(
    () => groupProjectsByLanguage(filteredProjects),
    [filteredProjects]
  )
  const languageGroups = useMemo(
    () => groupProjectsByLanguage(projects),
    [projects]
  )
  const languageNavGroups = useMemo(() => {
    const visibleGroups = languageGroups.filter(
      (group) => group.language !== 'Other'
    )
    const otherGroups = languageGroups.filter(
      (group) => group.language === 'Other'
    )

    return [
      ...visibleGroups.sort(
        (a, b) =>
          b.projects.length - a.projects.length ||
          a.language.localeCompare(b.language)
      ),
      ...otherGroups,
    ]
  }, [languageGroups])
  const topLanguageGroups = useMemo(
    () =>
      languageNavGroups
        .filter((group) => group.language !== 'Other')
        .slice(0, 3),
    [languageNavGroups]
  )
  const moreLanguageGroups = useMemo(() => {
    const visibleTopIds = new Set(topLanguageGroups.map((group) => group.id))
    return languageNavGroups.filter((group) => !visibleTopIds.has(group.id))
  }, [languageNavGroups, topLanguageGroups])
  const commitTimeline = useMemo(
    () => getLatestCommitTimeline(projects),
    [projects]
  )
  const totals = useMemo(() => indexTotals(projects), [projects])
  const topics = useMemo(() => topTopics(projects, 6), [projects])
  const [titleRef, titleVisible] = useRevealOnView<HTMLDivElement>()
  const [copyRef, copyVisible] = useRevealOnView<HTMLDivElement>()
  const [buttonRef, buttonVisible] = useRevealOnView<HTMLDivElement>()

  useEffect(() => {
    const formatClock = () =>
      `${t.localTime} ${new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date())}`

    setClock(formatClock())
    const timer = window.setInterval(() => setClock(formatClock()), 1000)
    return () => window.clearInterval(timer)
  }, [t.localTime])

  useEffect(() => {
    setIsMenuOpen(false)
    setIsAccentMenuOpen(false)
    setIsMoreMenuOpen(false)
  }, [activeIndex, locale])

  useEffect(() => {
    if (!isMoreMenuOpen || typeof window === 'undefined') return

    const handlePointerDown = (event: PointerEvent) => {
      const menu = moreMenuRef.current
      if (!menu || menu.contains(event.target as Node)) return
      setIsMoreMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMoreMenuOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMoreMenuOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const heroHeight = heroSectionRef.current?.offsetHeight ?? 0
      const projectsTop =
        projectsSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY
      const currentY = window.scrollY

      if (topNavigationRef.current && currentY <= 1) {
        topNavigationRef.current = false
      }

      if (!topNavigationRef.current && currentY >= projectsTop - 1) {
        projectScrollLockedRef.current = true
      }

      setShowBackToTop(currentY > Math.max(heroHeight * 0.4, 280))
    }

    const handleWheel = (event: WheelEvent) => {
      const projectsTop =
        projectsSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY
      if (
        projectScrollLockedRef.current &&
        event.deltaY < 0 &&
        window.scrollY + event.deltaY < projectsTop
      ) {
        event.preventDefault()
        window.scrollTo({ top: projectsTop })
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const projectsTop =
        projectsSectionRef.current?.offsetTop ?? Number.POSITIVE_INFINITY
      const upwardKeys = ['ArrowUp', 'PageUp', 'Home']
      if (
        projectScrollLockedRef.current &&
        upwardKeys.includes(event.key) &&
        window.scrollY <= projectsTop + 1
      ) {
        event.preventDefault()
        window.scrollTo({ top: projectsTop })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Arriving from a project detail page, the URL carries #<repo-name> so the index
  // lands on that project instead of the top of the page. The card may not exist
  // yet on the first pass, and late-loading media can shift it, so re-align once
  // after paint as well.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const target = location.hash.slice(1)
    if (!target) return

    const scrollToTarget = () => {
      document.getElementById(decodeURIComponent(target))?.scrollIntoView()
    }

    scrollToTarget()
    const frame = requestAnimationFrame(scrollToTarget)

    return () => cancelAnimationFrame(frame)
  }, [location.hash, projects])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const closeMenus = (event: PointerEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.hero-accent-picker')) setIsAccentMenuOpen(false)
      if (!target.closest('.projects-anchor-more')) setIsMoreMenuOpen(false)
      if (!target.closest('.project-floating-actions'))
        setIsProjectControlsOpen(false)
      if (!target.closest('.hero-mobile-actions')) setIsMenuOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsAccentMenuOpen(false)
      setIsMoreMenuOpen(false)
      setIsProjectControlsOpen(false)
      setIsMenuOpen(false)
    }

    window.addEventListener('pointerdown', closeMenus)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', closeMenus)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!hoveredProjectId) return

    const container = timelineContainerRef.current
    const item = timelineItemRefs.current.get(hoveredProjectId)
    if (!container || !item) return

    const containerTop = container.scrollTop
    const containerBottom = containerTop + container.clientHeight
    const itemTop = item.offsetTop
    const itemBottom = itemTop + item.offsetHeight

    if (itemTop < containerTop || itemBottom > containerBottom) {
      const targetTop = itemTop - container.clientHeight * 0.26
      container.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: 'smooth',
      })
    }
  }, [hoveredProjectId])

  function handleThemeToggle() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <main
      className="theme-shell home-canvas min-h-svh bg-black text-white"
      id="main-content"
      style={
        {
          '--vmaker-accent': activeAccent.color,
          '--vmaker-accent-rgb': activeAccent.rgb,
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#projects">
        {t.skipToContent}
      </a>
      <section
        className="hero-shell relative min-h-svh overflow-hidden bg-black text-white"
        ref={heroSectionRef}
      >
        <div className="absolute inset-0 z-0">
          {HERO_SLIDES.map((slide, index) => (
            <img
              alt=""
              className={`hero-background-image ${index === activeIndex ? 'is-active' : ''}`}
              decoding={index === activeIndex ? 'sync' : 'async'}
              fetchPriority={index === 0 ? 'high' : 'low'}
              key={slide.imageUrl}
              src={slide.imageUrl}
            />
          ))}
        </div>
        <div className="absolute inset-0 z-[1] bg-black/10" />
        <div className="hero-scrim absolute inset-0 z-[1]" />

        <SiteHeader
          accentId={accentId}
          accentPresets={ACCENT_PRESETS}
          clock={clock}
          isAccentMenuOpen={isAccentMenuOpen}
          isMenuOpen={isMenuOpen}
          locale={locale}
          onAccentChange={(nextAccentId) => setAccentId(nextAccentId)}
          onAccentMenuToggle={() => setIsAccentMenuOpen((open) => !open)}
          onMenuToggle={() => setIsMenuOpen((open) => !open)}
          onThemeToggle={handleThemeToggle}
          setLocale={setLocale}
          t={t}
          theme={theme}
        />

        <div className="hero-layout relative z-[2] mx-auto flex min-h-svh w-full max-w-[1340px] flex-col justify-end gap-[116px] px-[15px] pt-[190px]">
          <div className="hero-top-row flex w-full items-start justify-between gap-10">
            <div className="flex-[4]">
              <p className="hero-eyebrow mb-6">{t.heroEyebrow}</p>
              <div className="flex flex-col gap-3">
                {HERO_SLIDES.map((slide, index) => (
                  <button
                    className={`hero-switcher role-link text-left text-xs font-medium tracking-[-0.12px] uppercase transition-opacity ${index === activeIndex ? 'opacity-100' : 'opacity-55 hover:opacity-75'}`}
                    key={slide.label}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    {slide.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-1 justify-start md:justify-end">
              <div className="hero-availability">
                <span
                  className="hero-availability-dot"
                  style={
                    {
                      '--dot-color': activeSlide.accent,
                      '--dot-glow': activeSlide.accent,
                    } as CSSProperties
                  }
                />
                <span>{activeSlide.availability}</span>
              </div>
            </div>
          </div>

          <div className="hero-bottom-row flex w-full items-end justify-between gap-10 pb-[54px]">
            <div className="flex-[2]" ref={titleRef}>
              <div
                className={`reveal-block ${titleVisible ? 'is-visible reveal-up' : ''}`}
              >
                <h1 className="hero-title">
                  <VariableProximity
                    className="hero-title-word"
                    labelClassName="hero-title-char"
                    text="vMaker"
                  />
                  <span className="hero-title-dot">.</span>
                </h1>
              </div>
            </div>

            <div className="hero-copy-column flex flex-1 flex-col pl-[50px]">
              <div
                className={`reveal-block ${copyVisible ? 'is-visible reveal-right' : ''}`}
                id="hero-copy"
                ref={copyRef}
              >
                <p className="hero-description">{t.heroDescription}</p>
                <p className="hero-slide-copy">{activeSlide.description}</p>
              </div>
              <div
                className={`reveal-block delay-1 ${buttonVisible ? 'is-visible reveal-right' : ''}`}
                ref={buttonRef}
              >
                <a className="hero-cta" href="#projects">
                  <span>{t.browse}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-bridge relative z-[2] mx-auto flex w-full max-w-[1340px] flex-col gap-5 px-[15px] pb-0">
          <div
            className="hero-bridge-meta hero-bridge-meta-standalone"
            id="stack"
          >
            <span>{t.indexLead}</span>
            <span>{t.dataLeft}</span>
            <span>{t.dataRight}</span>
          </div>
        </div>
      </section>

      <section
        className="projects-shell relative pt-10 pb-16"
        ref={projectsSectionRef}
      >
        <div className="projects-shell-glow" />
        <div
          className="relative mx-auto max-w-[1340px] px-[15px]"
          id="projects"
        >
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="projects-intro">
              <p className="projects-kicker">{t.languageNav}</p>
              <h2 className="projects-title">{t.title}</h2>
              <p className="projects-subtitle">{t.subtitle}</p>
              <div className="projects-side-card">
                <p className="project-meta-label">{t.status}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Metric
                    isDark={isDark}
                    label={t.repos}
                    value={summary.totalProjects.toString()}
                  />
                  <Metric
                    isDark={isDark}
                    label={t.latest}
                    value={formatDate(
                      totals.latestActivity ?? summary.latestActivity,
                      locale
                    )}
                  />
                  <Metric
                    isDark={isDark}
                    label={t.stars}
                    value={totals.totalStars.toString()}
                  />
                  <Metric
                    isDark={isDark}
                    label={t.totalCode}
                    value={formatBytes(totals.totalCodeSize)}
                  />
                </div>
                {topics.length > 0 && (
                  <div className="index-topics" aria-label={t.topics}>
                    {topics.map((entry) => (
                      <button
                        aria-pressed={query.includes(`topic:${entry.topic}`)}
                        className="index-topic-chip"
                        key={entry.topic}
                        onClick={() =>
                          setQuery((current) =>
                            current.includes(`topic:${entry.topic}`)
                              ? current
                              : `${current} topic:${entry.topic}`.trim()
                          )
                        }
                        type="button"
                      >
                        {entry.topic}
                        <span>{entry.count}</span>
                      </button>
                    ))}
                  </div>
                )}
                {error && (
                  <p className="project-error-note mt-4">{t.tokenHelp}</p>
                )}
              </div>
              <div className="project-timeline mt-8" ref={timelineContainerRef}>
                {commitTimeline.length > 0 ? (
                  commitTimeline.map((item) => (
                    <a
                      className={`project-timeline-item ${hoveredProjectId === item.projectId ? 'is-active' : ''}`}
                      href={item.url}
                      key={`${item.projectName}-${item.sha}`}
                      onMouseEnter={() => setHoveredProjectId(item.projectId)}
                      onMouseLeave={() => setHoveredProjectId(null)}
                      ref={(node) => {
                        timelineItemRefs.current.set(item.projectId, node)
                      }}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="project-timeline-date">
                        {formatDate(item.date, locale)}
                      </span>
                      <span className="project-timeline-copy">
                        <span className="project-timeline-title">
                          {item.projectName}({item.sha})
                        </span>
                        <span className="project-timeline-message">
                          {' '}
                          - {item.message}
                        </span>
                      </span>
                    </a>
                  ))
                ) : (
                  <p className="project-empty-copy">{t.latestCommitEmpty}</p>
                )}
              </div>
              <div className="project-stack-loop-wrap">
                <LogoLoop items={STACK_LOGOS} />
              </div>
            </div>

            <div>
              <div className="projects-toolbar">
                <div className="projects-nav-wrap">
                  <div className="projects-anchor-list">
                    {topLanguageGroups.length > 0 ? (
                      topLanguageGroups.map((group) => (
                        <a
                          className="projects-anchor-chip"
                          href={`#language-${group.id}`}
                          key={group.language}
                          title={group.language}
                        >
                          {languageNavLabel(group.language)}
                        </a>
                      ))
                    ) : (
                      <span className="projects-anchor-chip opacity-60">
                        {t.projectsUnavailable}
                      </span>
                    )}
                  </div>
                  <div className="projects-anchor-more" ref={moreMenuRef}>
                    <div
                      className={`projects-anchor-dropdown ${isMoreMenuOpen ? 'is-open' : ''}`}
                    >
                      <button
                        aria-expanded={isMoreMenuOpen}
                        aria-haspopup="menu"
                        className="projects-anchor-chip projects-anchor-summary"
                        onClick={() => setIsMoreMenuOpen((open) => !open)}
                        type="button"
                      >
                        <span>{t.more}</span>
                        <ChevronDown className="size-3.5" />
                      </button>
                      {isMoreMenuOpen && (
                        <div
                          className="projects-anchor-dropdown-menu"
                          role="menu"
                        >
                          {moreLanguageGroups.length > 0 ? (
                            moreLanguageGroups.map((group) => (
                              <a
                                className="projects-anchor-dropdown-item"
                                href={`#language-${group.id}`}
                                key={group.language}
                                onClick={() => setIsMoreMenuOpen(false)}
                                role="menuitem"
                              >
                                <span>{group.language}</span>
                                <span>{group.projects.length}</span>
                              </a>
                            ))
                          ) : (
                            <span className="projects-anchor-dropdown-empty">
                              {t.projectsUnavailable}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <label className="projects-sort">
                  <span className="projects-sort-label">{t.sort}</span>
                  <select
                    aria-label={t.sort}
                    className="projects-sort-select"
                    onChange={(event) =>
                      setSortKey(event.target.value as SortKey | 'default')
                    }
                    value={sortKey}
                  >
                    <option value="default">{t.latest}</option>
                    <option value="activity">{t.sortActivity}</option>
                    <option value="stars">{t.sortStars}</option>
                    <option value="name">{t.sortName}</option>
                    <option value="size">{t.sortSize}</option>
                  </select>
                </label>
                <label className="projects-search">
                  <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/45" />
                  <input
                    aria-label={t.search}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.search}
                    value={query}
                  />
                </label>
              </div>

              {projectGroups.length > 0 ? (
                <div className="mt-12 space-y-12">
                  {projectGroups.map((group) => (
                    <ProjectLanguageSection
                      group={group}
                      hoveredProjectId={hoveredProjectId}
                      isDark={isDark}
                      key={group.language}
                      locale={locale}
                      onProjectHover={setHoveredProjectId}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <EmptyProjects error={error} isDark={isDark} t={t} />
              )}
            </div>
          </div>
        </div>
      </section>

      {showBackToTop && (
        <div className="project-floating-actions">
          <div
            className={`project-control-menu ${isProjectControlsOpen ? 'is-open' : ''}`}
          >
            <button
              aria-label="Change language"
              className="project-control-button"
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              type="button"
            >
              {locale === 'en' ? '中' : 'EN'}
            </button>
            <button
              aria-label="Toggle theme"
              className="project-control-button"
              onClick={handleThemeToggle}
              type="button"
            >
              {theme === 'light' ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
            </button>
            <div className="hero-accent-picker">
              <button
                aria-label="Change accent color"
                className="project-control-button"
                onClick={() => setIsAccentMenuOpen((open) => !open)}
                type="button"
              >
                <Palette className="size-4" />
              </button>
              <div
                className={`hero-accent-menu ${isAccentMenuOpen ? 'open' : ''}`}
              >
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    aria-label={preset.label}
                    className={`hero-accent-swatch ${accentId === preset.id ? 'is-active' : ''}`}
                    key={preset.id}
                    onClick={() => {
                      setAccentId(preset.id)
                      setIsAccentMenuOpen(false)
                    }}
                    style={{ '--swatch-color': preset.color } as CSSProperties}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            aria-expanded={isProjectControlsOpen}
            aria-label="Toggle project controls"
            className="project-control-button project-control-toggle"
            onClick={() => setIsProjectControlsOpen((open) => !open)}
            type="button"
          >
            <Ellipsis className="size-4" />
          </button>
          <button
            aria-label="Back to top"
            className="back-to-top-button"
            onClick={() => {
              projectScrollLockedRef.current = false
              topNavigationRef.current = true
              setIsProjectControlsOpen(false)
              setIsAccentMenuOpen(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            type="button"
          >
            <span>{t.top}</span>
          </button>
        </div>
      )}
    </main>
  )
}
