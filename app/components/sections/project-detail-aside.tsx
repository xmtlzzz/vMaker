import { ExternalLink } from 'lucide-react'

import type { Locale } from '~/data/copy'
import { formatBytes, formatDate } from '~/lib/format'
import type { Project } from '~/lib/github/projects'
import { languageName } from '~/lib/language'

export function ProjectDetailAside({
  project,
  locale,
  t,
}: {
  project: Project
  locale: Locale
  t: Record<string, string>
}) {
  const metrics = [
    { label: t.primaryLanguage, value: languageName(project) },
    { label: t.stars, value: String(project.stars) },
    { label: t.forks, value: String(project.forks) },
    { label: t.codeSize, value: formatBytes(project.codeSize) },
    ...(project.openIssues > 0
      ? [{ label: t.issues, value: String(project.openIssues) }]
      : []),
    ...(project.openPullRequests > 0
      ? [{ label: t.pullRequests, value: String(project.openPullRequests) }]
      : []),
  ]

  return (
    <div>
      <div className="detail-metrics">
        {metrics.map((metric) => (
          <div className="detail-metric" key={metric.label}>
            <span className="detail-metric-label">{metric.label}</span>
            <span className="detail-metric-value">{metric.value}</span>
          </div>
        ))}
      </div>

      <dl className="detail-meta">
        <div className="detail-meta-row">
          <dt>{t.lastPush}</dt>
          <dd>{formatDate(project.pushedAt, locale)}</dd>
        </div>
        <div className="detail-meta-row">
          <dt>{t.createdAt}</dt>
          <dd>{formatDate(project.createdAt, locale)}</dd>
        </div>
        {project.lastCommitAuthor && (
          <div className="detail-meta-row">
            <dt>{t.lastCommit}</dt>
            <dd>{project.lastCommitAuthor}</dd>
          </div>
        )}
      </dl>

      <div className="detail-actions">
        <a
          className="detail-action"
          href={project.url}
          rel="noreferrer"
          target="_blank"
        >
          {t.repository}
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </a>
        {project.homepage && (
          <a
            className="detail-action detail-action-secondary"
            href={project.homepage}
            rel="noreferrer"
            target="_blank"
          >
            {t.demo}
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
