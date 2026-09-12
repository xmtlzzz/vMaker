import { ArrowLeft, Moon, Sun } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link, data, isRouteErrorResponse } from 'react-router'

import { ProjectDetailAside } from '~/components/sections/project-detail-aside'
import { RelatedProjects } from '~/components/sections/related-projects'
import { ACCENT_PRESETS } from '~/data/accents'
import type { Locale } from '~/data/copy'
import { useSitePreferences } from '~/hooks/use-site-preferences'
import { resolveSiteUrl } from '~/lib/config'
import {
  documentEtag,
  documentHeaders,
  notModifiedResponse,
  projectSignature,
} from '~/lib/document-cache'
import { formatDate } from '~/lib/format'
import { etagMatches } from '~/lib/http-cache'
import { repoOgImage } from '~/lib/github/client'
import {
  githubTokenFromContext,
  siteUrlFromContext,
} from '~/lib/github/context'
import { getProjects, ownerLabel } from '~/lib/github/projects'
import type { Project } from '~/lib/github/projects'
import { languageColor } from '~/lib/language'
import { getRelatedProjects } from '~/lib/projects-view'
import type { Route } from './+types/project'

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const payload = await getProjects(githubTokenFromContext(context))
  const project = payload.projects.find((item) => item.name === params.name)

  if (!project) {
    throw new Response('Project not found', {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const etag = documentEtag(projectSignature(project))

  if (etagMatches(request.headers.get('If-None-Match'), etag)) {
    throw notModifiedResponse(etag)
  }

  return data(
    {
      owner: payload.owner,
      project,
      related: getRelatedProjects(payload.projects, project),
      siteUrl: resolveSiteUrl({
        configured: siteUrlFromContext(context),
        request,
      }),
    },
    { headers: documentHeaders(etag) }
  )
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.project) {
    return [{ title: 'vMaker' }]
  }

  const { owner, project } = data
  const title = `${project.displayName} · vMaker`
  const canonical = `${resolveSiteUrl({ configured: data.siteUrl })}/projects/${project.name}`
  const image = repoOgImage(owner.login, project.name)

  return [
    { title },
    { name: 'description', content: project.description },
    { tagName: 'link', rel: 'canonical', href: canonical },
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: 'vMaker' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: project.description },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: 'zh_CN' },
    { property: 'og:locale:alternate', content: 'en_US' },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '600' },
    { property: 'og:image:alt', content: title },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: project.description },
    { name: 'twitter:image', content: image },
  ]
}

function LanguageComposition({
  project,
  t,
}: {
  project: Project
  t: Record<string, string>
}) {
  if (project.languageShares.length === 0) {
    return null
  }

  return (
    <section>
      <h2 className="detail-section-label">{t.languages}</h2>
      <div aria-hidden="true" className="detail-lang-bar">
        {project.languageShares.map((share) => (
          <span
            key={share.name}
            style={{
              background: languageColor(share.name),
              flexGrow: share.percent,
            }}
          />
        ))}
      </div>
      <ul className="detail-lang-legend">
        {project.languageShares.map((share) => (
          <li key={share.name}>
            <i
              aria-hidden="true"
              style={{ background: languageColor(share.name) }}
            />
            {share.name} {share.percent}%
          </li>
        ))}
      </ul>
    </section>
  )
}

function Releases({
  project,
  locale,
  t,
}: {
  project: Project
  locale: Locale
  t: Record<string, string>
}) {
  if (project.releases.length === 0) {
    return null
  }

  return (
    <section>
      <h2 className="detail-section-label">{t.releases}</h2>
      <ul className="detail-releases">
        {project.releases.map((release) => (
          <li
            className="detail-release-item"
            key={release.tagName || release.url}
          >
            <a
              className="detail-release-link"
              href={release.url}
              rel="noreferrer"
              target="_blank"
            >
              <span className="detail-release-name">{release.name}</span>
              <span className="detail-release-tag">{release.tagName}</span>
            </a>
            <span className="detail-release-date">
              {formatDate(release.publishedAt, locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ProjectRoute({ loaderData }: Route.ComponentProps) {
  const { owner, project, related } = loaderData
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
  } = useSitePreferences(ownerLabel(owner))

  // overrides.cover wins; otherwise reuse GitHub's own per-repository social card
  const cover = project.cover ?? repoOgImage(owner.login, project.name)

  function cycleAccent() {
    const index = ACCENT_PRESETS.findIndex((preset) => preset.id === accentId)
    const next = ACCENT_PRESETS[(index + 1) % ACCENT_PRESETS.length]

    setAccentId(next.id)
  }

  return (
    <main
      className="detail-page theme-shell home-canvas text-white"
      lang={locale === 'zh' ? 'zh-CN' : 'en'}
      style={
        {
          '--vmaker-accent': activeAccent.color,
          '--vmaker-accent-rgb': activeAccent.rgb,
        } as CSSProperties
      }
    >
      <div className="detail-container">
        <header className="detail-header">
          <span className="detail-wordmark">vMaker</span>
          <nav className="detail-header-nav">
            <Link
              className="detail-back"
              to={{ hash: `#${project.name}`, pathname: '/' }}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t.backToIndex}
            </Link>
            <button
              aria-label={t.changeLocale}
              className="detail-control"
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
              type="button"
            >
              {locale === 'en' ? '中' : 'EN'}
            </button>
            <button
              aria-label={t.changeTheme}
              className="detail-control"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              type="button"
            >
              {isDark ? (
                <Sun aria-hidden="true" className="size-4" />
              ) : (
                <Moon aria-hidden="true" className="size-4" />
              )}
            </button>
            <button
              aria-label={t.changeAccent}
              className="detail-control"
              onClick={cycleAccent}
              type="button"
            >
              <span
                className="detail-accent-swatch"
                style={{ background: activeAccent.color }}
              />
            </button>
          </nav>
        </header>

        <div className="detail-grid">
          <div className="detail-main">
            <div className="detail-title-row">
              <h1 className="detail-title">{project.displayName}</h1>
              {project.featured && (
                <span className="detail-badge detail-badge-accent">
                  {t.featured}
                </span>
              )}
              {project.archived && (
                <span className="detail-badge">{t.archived}</span>
              )}
            </div>
            <p className="detail-summary">{project.description}</p>

            <img
              alt={`${project.displayName} preview`}
              className="detail-preview"
              decoding="async"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={cover}
            />

            <LanguageComposition project={project} t={t} />

            <Releases locale={locale} project={project} t={t} />

            {project.topics.length > 0 && (
              <section>
                <h2 className="detail-section-label">{t.topics}</h2>
                <ul className="detail-topics">
                  {project.topics.map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="detail-aside">
            <ProjectDetailAside locale={locale} project={project} t={t} />
          </div>
        </div>

        <RelatedProjects projects={related} t={t} />
      </div>
    </main>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useSitePreferences()
  const isNotFound = isRouteErrorResponse(error) && error.status === 404

  return (
    <main className="detail-page theme-shell home-canvas text-white">
      <div className="detail-container detail-notfound">
        <h1 className="detail-title">
          {isNotFound ? t.projectNotFound : t.unavailable}
        </h1>
        <Link className="detail-back" to="/">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t.backToIndex}
        </Link>
      </div>
    </main>
  )
}
