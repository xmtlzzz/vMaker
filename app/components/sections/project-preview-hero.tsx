import {
  Check,
  Code2,
  Copy,
  ExternalLink,
  GitBranch,
  GitFork,
  HardDrive,
  Star,
  Terminal,
} from 'lucide-react'
import { useState } from 'react'
import type { Locale } from '~/data/copy'
import { formatBytes } from '~/lib/format'
import type { GitHubOwner, Project } from '~/lib/github/projects'
import { languageColor } from '~/lib/language'

export function ProjectPreviewHero({
  isDark,
  locale,
  owner,
  project,
  showcase,
  t,
}: {
  isDark: boolean
  locale: Locale
  owner: GitHubOwner
  project: Project
  showcase?: { previewCaption?: string }
  t: Record<string, string>
}) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Has a dedicated product screenshot (e.g. /previews/vmaker.jpg)
  const hasRealCover = Boolean(project.cover)

  const handleCopyClone = (e: React.MouseEvent) => {
    e.preventDefault()
    const cloneCmd = `git clone ${project.url}.git`
    try {
      navigator.clipboard.writeText(cloneCmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard fallback
    }
  }

  // If a real screenshot exists and hasn't errored out, render the screenshot
  if (hasRealCover && !imageError) {
    return (
      <figure className="detail-preview-figure mt-6">
        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20">
          {!imageLoaded && (
            <div className="flex h-64 w-full animate-pulse items-center justify-center bg-white/5">
              <span className="font-mono text-xs opacity-50">
                Loading preview...
              </span>
            </div>
          )}
          <img
            alt={showcase?.previewCaption || `${project.displayName} preview`}
            className={`detail-preview w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            decoding="async"
            loading="lazy"
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            src={project.cover}
          />
        </div>
        {showcase?.previewCaption && (
          <figcaption className="detail-preview-caption mt-3 text-xs opacity-60">
            {showcase.previewCaption}
          </figcaption>
        )}
      </figure>
    )
  }

  // Otherwise, render the interactive Repository Visual Showcase Card
  return (
    <figure className="detail-preview-figure mt-6">
      <div
        className={`detail-preview-card relative overflow-hidden rounded-[1.35rem] border transition-all duration-200 ${
          isDark
            ? 'border-white/10 bg-zinc-950/80 text-zinc-100 shadow-2xl shadow-black/40'
            : 'border-zinc-200 bg-white/90 text-zinc-800 shadow-xl shadow-zinc-200/50'
        }`}
      >
        {/* Ambient accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-15 blur-3xl"
          style={{ background: 'var(--vmaker-accent, #6366f1)' }}
        />

        {/* macOS Terminal style Window Header */}
        <div
          className={`flex items-center justify-between border-b px-4 py-3 sm:px-6 ${
            isDark
              ? 'border-white/10 bg-white/[0.02]'
              : 'border-zinc-200/80 bg-zinc-50/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-rose-500/80 transition-opacity hover:opacity-100" />
            <span className="size-3 rounded-full bg-amber-500/80 transition-opacity hover:opacity-100" />
            <span className="size-3 rounded-full bg-emerald-500/80 transition-opacity hover:opacity-100" />
            <span className="ml-2 font-mono text-xs tracking-tight opacity-60">
              github.com/{owner.login}/{project.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] opacity-60">
              <GitBranch className="size-3" />
              main
            </span>
            <a
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium opacity-70 transition-all hover:text-[var(--vmaker-accent)] hover:opacity-100"
              href={project.url}
              rel="noreferrer"
              target="_blank"
              title="GitHub"
            >
              <ExternalLink className="size-3" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>

        {/* Window Content */}
        <div className="relative z-10 p-5 sm:p-7">
          {/* Top Info */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <Code2 className="size-5 text-[var(--vmaker-accent,#6366f1)]" />
                <h3 className="font-mono text-xl font-bold tracking-tight sm:text-2xl">
                  {project.displayName}
                </h3>
                {project.primaryLanguage && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{
                        background: languageColor(project.primaryLanguage),
                      }}
                    />
                    {project.primaryLanguage}
                  </span>
                )}
              </div>
              <p className="max-w-xl text-sm leading-relaxed opacity-75">
                {project.description ||
                  (locale === 'zh'
                    ? '暂无项目描述。'
                    : 'No description provided.')}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1 font-mono text-xs font-medium opacity-85">
                <Star className="size-3.5 fill-amber-400/20 text-amber-400" />
                <span>
                  {project.stars} {t.stars}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1 font-mono text-xs font-medium opacity-85">
                <GitFork className="size-3.5 text-sky-400" />
                <span>
                  {project.forks} {t.forks}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1 font-mono text-xs font-medium opacity-85">
                <HardDrive className="size-3.5 opacity-60" />
                <span>{formatBytes(project.codeSize)}</span>
              </div>
            </div>
          </div>

          {/* Interactive Clone Terminal Box */}
          <div className="mt-5 rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-xs sm:p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto text-zinc-300">
                <Terminal className="size-4 shrink-0 text-emerald-400" />
                <span className="text-emerald-400 select-none">$</span>
                <span className="select-all">git clone {project.url}.git</span>
              </div>
              <button
                className="inline-flex shrink-0 items-center gap-1 rounded bg-white/10 px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/20 active:scale-95"
                onClick={handleCopyClone}
                type="button"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-emerald-400" />
                    <span>{locale === 'zh' ? '已复制' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>{locale === 'zh' ? '复制' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Languages Mini Progress Bar */}
          {project.languageShares.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <div className="flex h-2 w-full overflow-hidden rounded-full border border-white/5 bg-white/5">
                {project.languageShares.map((share) => (
                  <span
                    key={share.name}
                    style={{
                      background: languageColor(share.name),
                      width: `${share.percent}%`,
                    }}
                    title={`${share.name}: ${share.percent}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] opacity-70">
                {project.languageShares.slice(0, 4).map((share) => (
                  <span
                    className="inline-flex items-center gap-1"
                    key={share.name}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: languageColor(share.name) }}
                    />
                    {share.name} {share.percent}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showcase?.previewCaption ? (
        <figcaption className="detail-preview-caption mt-3 text-xs opacity-60">
          {showcase.previewCaption}
        </figcaption>
      ) : (
        <figcaption className="detail-preview-caption mt-3 text-xs opacity-60">
          {project.displayName} ·{' '}
          {locale === 'zh' ? '开源工程架构预览' : 'Open-source project preview'}
        </figcaption>
      )}
    </figure>
  )
}
