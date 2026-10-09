import { ChevronDown, Ellipsis, Moon, Palette, Search, Sun } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { data, useLocation, useSearchParams } from 'react-router'

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
import { resolveSiteUrl, SITE_REPO } from '~/lib/config'
import { repoOgImage } from '~/lib/github/client'
import {
  githubTokenFromContext,
  projectsCacheFromContext,
  siteUrlFromContext,
} from '~/lib/github/context'
import { matchesQuery, parseSearchQuery, sortProjects } from '~/lib/browse'
import type { SortKey } from '~/lib/browse'
import {
  documentEtag,
  documentHeaders,
  indexSignature,
  notModifiedResponse,
} from '~/lib/document-cache'
import { formatBytes, formatDate } from '~/lib/format'
import { etagMatches } from '~/lib/http-cache'
import { getProjects, ownerLabel } from '~/lib/github/projects'
import { indexTotals, topTopics } from '~/lib/insights'
import { languageId, languageNavLabel } from '~/lib/language'
import {
  getLatestCommitTimeline,
  groupProjectsByLanguage,
} from '~/lib/projects-view'
import type { Route } from './+types/home'

export function meta({ data }: Route.MetaArgs) {
  const owner = data?.owner
  const ownerName = owner ? ownerLabel(owner) : 'GitHub'
  const title = 'vMaker - Project Index'
  const description = `A curated, searchable index of ${ownerName} public GitHub projects, grouped by language with stars, code size, language composition and recent commit activity.`
  const siteUrl = resolveSiteUrl({ configured: data?.siteUrl })
  // GitHub's per-repository social card; the owner is always present because the
  // loader resolves one even on the offline fallback path.
  const ogImage = repoOgImage(owner?.login ?? 'github', SITE_REPO)

  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: `${siteUrl}/` },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'vMaker' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: `${siteUrl}/` },
    { property: 'og:locale', content: 'zh_CN' },
    { property: 'og:locale:alternate', content: 'en_US' },
    { property: 'og:image', content: ogImage },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '600' },
    { property: 'og:image:alt', content: title },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: ogImage },
    {
      tagName: 'link',
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'vMaker',
      href: `${siteUrl}/feed.xml`,
    },
  ]
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const payload = await getProjects(
    githubTokenFromContext(context),
    projectsCacheFromContext(context)
  )
  const etag = documentEtag(indexSignature(payload))
  const headers = documentHeaders(etag)

  // The body cannot be hashed before it is rendered, so the tag is derived from the
  // data that produces it. A matching validator means the client's copy is still
  // correct, and returning early skips the render entirely.
  if (etagMatches(request.headers.get('If-None-Match'), etag)) {
    throw notModifiedResponse(etag)
  }

  return data(
    {
      ...payload,
      siteUrl: resolveSiteUrl({
        configured: siteUrlFromContext(context),
        request,
      }),
    },
    { headers }
  )
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
}: {
  currentUrl: URL
  nextUrl: URL
  [key: string]: unknown
}) {
  return currentUrl.pathname !== nextUrl.pathname
}

const VALID_SORT_KEYS: readonly (SortKey | 'default')[] = [
  'default',
  'activity',
  'stars',
  'name',
  'size',
]

export default function Home({ loaderData }: Route.ComponentProps) {
  const { error, owner, projects, summary } = loaderData
  const [searchParams, setSearchParams] = useSearchParams()
  const qParam = searchParams.get('q') ?? ''
  const sortParam = searchParams.get('sort')
  const sortKey: SortKey | 'default' = VALID_SORT_KEYS.includes(
    sortParam as SortKey | 'default'
  )
    ? (sortParam as SortKey | 'default')
    : 'default'

  const [query, setQuery] = useState(qParam)

  // Keep query in sync when searchParams changes (e.g. browser back/forward)
  const [prevQ, setPrevQ] = useState(qParam)
  if (prevQ !== qParam) {
    setPrevQ(qParam)
    setQuery(qParam)
  }

  const {
    accentId,
    activeAccent,
    isDark,
    locale,
    setAccentId,
    setLocale,
    t,
    theme,
    toggleTheme,
  } = useSitePreferences(ownerLabel(owner))
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccentMenuOpen, setIsAccentMenuOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const [isProjectControlsOpen, setIsProjectControlsOpen] = useState(false)

  // Reset menus during render when active index or locale changes
  const [prevNavState, setPrevNavState] = useState({ activeIndex, locale })
  if (
    prevNavState.activeIndex !== activeIndex ||
    prevNavState.locale !== locale
  ) {
    setPrevNavState({ activeIndex, locale })
    setIsMenuOpen(false)
    setIsAccentMenuOpen(false)
    setIsMoreMenuOpen(false)
  }
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const timelineContainerRef = useRef<HTMLDivElement | null>(null)
  const timelineItemRefs = useRef(new Map<string, HTMLAnchorElement | null>())
  const heroSectionRef = useRef<HTMLElement | null>(null)
  const projectsSectionRef = useRef<HTMLElement | null>(null)
  const moreMenuRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()

  // Global keyboard shortcuts: "/" focuses search, "Escape" clears & blurs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeTag = document.activeElement?.tagName.toLowerCase()
        const isEditable = (document.activeElement as HTMLElement)
          ?.isContentEditable
        if (activeTag !== 'input' && activeTag !== 'textarea' && !isEditable) {
          e.preventDefault()
          searchInputRef.current?.focus()
          searchInputRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      } else if (e.key === 'Escape') {
        if (document.activeElement === searchInputRef.current || query) {
          setQuery('')
          searchInputRef.current?.blur()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [query])

  // Sync query state back to URL search params (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim()
      const currentQ = searchParams.get('q') ?? ''
      if (trimmed !== currentQ) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            if (trimmed) {
              next.set('q', trimmed)
            } else {
              next.delete('q')
            }
            return next
          },
          { replace: true, preventScrollReset: true }
        )
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, searchParams, setSearchParams])

  const langParam = searchParams.get('lang') ?? ''

  const handleLangToggle = (langId: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (next.get('lang') === langId) {
          next.delete('lang')
        } else {
          next.set('lang', langId)
        }
        return next
      },
      { replace: true, preventScrollReset: true }
    )
  }

  const handleSortChange = (newSort: SortKey | 'default') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (newSort === 'default') {
          next.delete('sort')
        } else {
          next.set('sort', newSort)
        }
        return next
      },
      { replace: true, preventScrollReset: true }
    )
  }

  // Filtering always preserves the loader order (featured first). Only an explicit
  // sort choice reorders the list, so the default view is byte-for-byte what it was.
  const filteredProjects = useMemo(() => {
    let matched = projects
    if (langParam) {
      matched = matched.filter((project) => {
        if (!project.primaryLanguage) return false
        return (
          languageId(project.primaryLanguage) === langParam.toLowerCase() ||
          project.primaryLanguage.toLowerCase() === langParam.toLowerCase()
        )
      })
    }
    const trimmed = query.trim()
    if (trimmed) {
      matched = matched.filter((project) =>
        matchesQuery(project, parseSearchQuery(trimmed))
      )
    }

    return sortKey === 'default' ? matched : sortProjects(matched, sortKey)
  }, [langParam, projects, query, sortKey])
  const projectGroups = useMemo(
    () => groupProjectsByLanguage(filteredProjects, sortKey === 'default'),
    [filteredProjects, sortKey]
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
    const hero = heroSectionRef.current
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowBackToTop(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(hero)
    return () => observer.disconnect()
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

  function handleThemeToggle(nextDark?: boolean) {
    toggleTheme(nextDark)
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
          {HERO_SLIDES.map((slide, index) => {
            const currentImg =
              theme === 'light' ? slide.imageUrlDay : slide.imageUrl
            return (
              <img
                alt=""
                className={`hero-background-image ${index === activeIndex ? 'is-active' : ''}`}
                decoding={index === activeIndex ? 'sync' : 'async'}
                fetchPriority={index === 0 ? 'high' : 'low'}
                key={`${slide.imageUrl}-${theme === 'light' ? 'day' : 'night'}`}
                src={currentImg}
              />
            )
          })}
        </div>
        <div className="absolute inset-0 z-[1] bg-black/10" />
        <div className="hero-scrim absolute inset-0 z-[1]" />

        <SiteHeader
          accentId={accentId}
          accentPresets={ACCENT_PRESETS}
          isAccentMenuOpen={isAccentMenuOpen}
          isMenuOpen={isMenuOpen}
          locale={locale}
          onAccentChange={(nextAccentId) => setAccentId(nextAccentId)}
          onAccentMenuToggle={() => setIsAccentMenuOpen((open) => !open)}
          onMenuToggle={() => setIsMenuOpen((open) => !open)}
          onThemeToggle={handleThemeToggle}
          owner={owner}
          setLocale={setLocale}
          t={t}
          theme={theme}
        />

        <div className="hero-layout relative z-[2] mx-auto flex min-h-svh w-full max-w-[1340px] flex-col justify-end gap-[48px] px-[24px] pt-[96px] lg:gap-[64px] lg:pt-[112px]">
          <div className="hero-top-row flex w-full items-start justify-between gap-10">
            <div className="flex-[4]">
              <p className="hero-eyebrow mb-6">{t.heroEyebrow}</p>
              <div className="flex flex-col gap-3">
                {HERO_SLIDES.map((slide, index) => (
                  <button
                    className={`hero-switcher role-link text-left text-xs font-medium tracking-[-0.12px] uppercase transition-opacity ${index === activeIndex ? 'opacity-100' : 'opacity-55 hover:opacity-75'}`}
                    aria-pressed={index === activeIndex}
                    key={slide.imageUrl}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    {[t.scenePenguin, t.sceneBird, t.sceneDeer][index]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-bottom-row flex w-full items-end justify-between gap-10 pb-[40px] lg:pb-[54px]">
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
          <header className="projects-heading">
            <p className="projects-kicker">{t.works}</p>
            <h2 className="projects-title">{t.title}</h2>
            <p className="projects-subtitle">{t.subtitle}</p>
          </header>
          <div className="projects-layout">
            <div className="projects-intro">
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
                    value={error ? '-' : totals.totalStars.toString()}
                  />
                  <Metric
                    isDark={isDark}
                    label={t.totalCode}
                    value={error ? '-' : formatBytes(totals.totalCodeSize)}
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
              <p className="project-meta-label mt-8">{t.recentActivity}</p>
              <div className="project-timeline mt-4" ref={timelineContainerRef}>
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

            <div className="projects-catalog">
              <div className="projects-toolbar">
                <div className="projects-nav-wrap">
                  <div className="projects-anchor-list">
                    {topLanguageGroups.length > 0 ? (
                      topLanguageGroups.map((group) => {
                        const isActive =
                          langParam.toLowerCase() === group.id.toLowerCase()
                        return (
                          <button
                            className={`projects-anchor-chip cursor-pointer ${isActive ? 'is-active bg-emerald-500/10 font-semibold ring-1 ring-emerald-500/50' : ''}`}
                            key={group.language}
                            onClick={() => handleLangToggle(group.id)}
                            title={`${group.language} (${group.projects.length})`}
                            type="button"
                          >
                            <span>{languageNavLabel(group.language)}</span>
                            {isActive && (
                              <span className="ml-1 text-[10px] opacity-70">
                                ✕
                              </span>
                            )}
                          </button>
                        )
                      })
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
                            moreLanguageGroups.map((group) => {
                              const isActive =
                                langParam.toLowerCase() ===
                                group.id.toLowerCase()
                              return (
                                <button
                                  className={`projects-anchor-dropdown-item w-full cursor-pointer text-left ${isActive ? 'is-active font-semibold text-emerald-500' : ''}`}
                                  key={group.language}
                                  onClick={() => {
                                    handleLangToggle(group.id)
                                    setIsMoreMenuOpen(false)
                                  }}
                                  role="menuitem"
                                  type="button"
                                >
                                  <span>{group.language}</span>
                                  <span>{group.projects.length}</span>
                                </button>
                              )
                            })
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
                      handleSortChange(
                        event.target.value as SortKey | 'default'
                      )
                    }
                    value={sortKey}
                  >
                    <option value="default">{t.sortDefault}</option>
                    <option value="activity">{t.sortActivity}</option>
                    <option value="stars">{t.sortStars}</option>
                    <option value="name">{t.sortName}</option>
                    <option value="size">{t.sortSize}</option>
                  </select>
                </label>
                <label className="projects-search relative">
                  <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground dark:text-white/45" />
                  <input
                    ref={searchInputRef}
                    aria-label={t.search}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t.search}
                    value={query}
                  />
                  <div className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 items-center gap-1 sm:flex">
                    {query ? (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('')
                          searchInputRef.current?.focus()
                        }}
                        className="pointer-events-auto rounded p-0.5 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <span className="text-xs">✕</span>
                      </button>
                    ) : (
                      <kbd className="inline-flex h-5 items-center rounded border border-current/20 bg-black/5 px-1.5 font-mono text-[10px] font-medium opacity-60 select-none dark:bg-white/10">
                        /
                      </kbd>
                    )}
                  </div>
                </label>
              </div>

              {/* Accessible live region for filter announcements */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {filteredProjects.length === 0
                  ? error
                    ? `${error}. ${t.tokenHelp}`
                    : t.tryAnother
                  : `${filteredProjects.length} ${t.works || 'projects'}`}
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
                      unavailable={Boolean(error)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyProjects
                  error={error}
                  isDark={isDark}
                  t={t}
                  onClear={query ? () => setQuery('') : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {showBackToTop && (
        <div className="project-floating-actions">
          <div
            id="project-display-controls"
            className="project-control-menu is-open"
            hidden={!isProjectControlsOpen}
          >
            <button
              aria-label={t.changeLocale}
              className="project-control-button"
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              type="button"
            >
              {locale === 'en' ? '中' : 'EN'}
            </button>
            <button
              aria-label={t.changeTheme}
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
                aria-label={t.changeAccent}
                className="project-control-button"
                onClick={() => setIsAccentMenuOpen((open) => !open)}
                type="button"
              >
                <Palette className="size-4" />
              </button>
              <div
                hidden={!isAccentMenuOpen}
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
            aria-label={t.projectControls}
            aria-controls="project-display-controls"
            className="project-control-button project-control-toggle"
            onClick={() => setIsProjectControlsOpen((open) => !open)}
            type="button"
          >
            <Ellipsis className="size-4" />
          </button>
          <button
            aria-label={t.top}
            className="back-to-top-button"
            onClick={() => {
              setIsProjectControlsOpen(false)
              setIsAccentMenuOpen(false)
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                  .matches
                  ? 'auto'
                  : 'smooth',
              })
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
