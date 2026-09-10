import { ExternalLink, GitFork, HardDrive, Star } from 'lucide-react'

import { BorderGlow } from '~/components/react-bits/BorderGlow'
import { formatBytes, formatDate } from '~/lib/github/projects'
import type { Project } from '~/lib/github/projects'
import { languageColor } from '~/lib/language'

export function ProjectPanel({
  isActive,
  isDark,
  onHover,
  project,
  t,
}: {
  isActive: boolean
  isDark: boolean
  onHover: (projectId: string | null) => void
  project: Project
  t: Record<string, string>
}) {
  return (
    <BorderGlow className='scroll-mt-24' id={project.name}>
      <article
        className={`project-panel ${isDark ? 'project-panel-dark' : 'project-panel-light'} ${isActive ? 'project-panel-active' : ''}`}
        onMouseEnter={() => onHover(project.name)}
        onMouseLeave={() => onHover(null)}
      >
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <h3 className='project-panel-title'>{project.displayName}</h3>
            {project.featured && <span className='project-featured'>{t.featured}</span>}
          </div>
          <a aria-label={`Open ${project.displayName}`} className='project-panel-link' href={project.homepage || project.url} rel='noreferrer' target='_blank'><ExternalLink className='size-4' /></a>
        </div>
        <p className='project-panel-description'>{project.description}</p>
        {project.languageShares.length > 0 && (
          <div aria-label={t.languages} className='project-lang' role='group'>
            <div aria-hidden='true' className='project-lang-bar'>
              {project.languageShares.slice(0, 4).map((share) => (
                <span
                  key={share.name}
                  style={{ background: languageColor(share.name), flexGrow: share.percent }}
                />
              ))}
            </div>
            <div className='project-lang-legend'>
              {project.languageShares.slice(0, 3).map((share) => (
                <span className='project-lang-legend-item' key={share.name}>
                  <i aria-hidden='true' style={{ background: languageColor(share.name) }} />
                  {share.name} {share.percent}%
                </span>
              ))}
            </div>
          </div>
        )}
        <div className='mt-5 flex flex-wrap gap-2'>
          {project.topics.slice(0, 4).map((topic) => <span className='project-topic' key={topic}>{topic}</span>)}
        </div>
        <div className='project-panel-stats'>
          <span className='project-stat' title={t.stars}>
            <Star aria-hidden='true' className='size-3.5' />
            <span>{project.stars}</span>
          </span>
          <span className='project-stat' title={t.forks}>
            <GitFork aria-hidden='true' className='size-3.5' />
            <span>{project.forks}</span>
          </span>
          <span className='project-stat' title={t.codeSize}>
            <HardDrive aria-hidden='true' className='size-3.5' />
            <span>{formatBytes(project.codeSize)}</span>
          </span>
        </div>
        <div className='mt-6 flex flex-wrap gap-4 text-sm'>
          <a className='project-action' href={project.url} rel='noreferrer' target='_blank'>Repository</a>
          {project.homepage && <a className='project-action' href={project.homepage} rel='noreferrer' target='_blank'>Demo</a>}
          <span className='project-updated'>{t.updated} {formatDate(project.pushedAt ?? project.updatedAt)}</span>
        </div>
      </article>
    </BorderGlow>
  )
}
