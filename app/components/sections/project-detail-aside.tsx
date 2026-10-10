import { Check, Copy, ExternalLink, Share2 } from 'lucide-react'
import { useState } from 'react'

import type { Locale } from '~/data/copy'
import { formatBytes, formatDate } from '~/lib/format'
import type { Project } from '~/lib/github/projects'
import { languageName } from '~/lib/language'

export function ProjectDetailAside({
  project,
  locale,
  t,
  unavailable = false,
}: {
  project: Project
  locale: Locale
  t: Record<string, string>
  unavailable?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  const handleCopyClone = (e: React.MouseEvent) => {
    e.preventDefault()
    const cloneCmd = `git clone ${project.url}.git`
    try {
      navigator.clipboard.writeText(cloneCmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleCopyShare = (e: React.MouseEvent) => {
    e.preventDefault()
    const shareText = `${project.displayName} - ${project.description}\n${window.location.href}`
    try {
      navigator.clipboard.writeText(shareText)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
    } catch {
      // fallback
    }
  }

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
            <span className="detail-metric-value">
              {unavailable ? '-' : metric.value}
            </span>
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
        <button
          className="detail-action detail-action-secondary cursor-pointer"
          onClick={handleCopyClone}
          title={`git clone ${project.url}.git`}
          type="button"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span className="text-emerald-500">
                {locale === 'zh' ? '已复制 Clone' : 'Copied!'}
              </span>
            </>
          ) : (
            <>
              <Copy className="size-3.5 opacity-70" />
              <span>Clone</span>
            </>
          )}
        </button>
        <button
          className="detail-action detail-action-secondary cursor-pointer"
          onClick={handleCopyShare}
          title={locale === 'zh' ? '复制分享链接与描述' : 'Copy share link'}
          type="button"
        >
          {copiedShare ? (
            <>
              <Check className="size-3.5 text-emerald-500" />
              <span className="text-emerald-500">
                {locale === 'zh' ? '已复制分享' : 'Copied!'}
              </span>
            </>
          ) : (
            <>
              <Share2 className="size-3.5 opacity-70" />
              <span>{locale === 'zh' ? '分享' : 'Share'}</span>
            </>
          )}
        </button>
        {project.homepage && (
          <a
            className="detail-action detail-action-secondary inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400"
            href={project.homepage}
            rel="noreferrer"
            target="_blank"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>{t.demo}</span>
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
