import { Link } from 'react-router'

import type { Project } from '~/lib/github/projects'
import { languageName } from '~/lib/language'

export function RelatedProjects({
  projects,
  t,
}: {
  projects: Project[]
  t: Record<string, string>
}) {
  if (projects.length === 0) {
    return null
  }

  return (
    <section className="related-section">
      <h2 className="detail-section-label">{t.relatedProjects}</h2>
      <div className="related-grid">
        {projects.map((project) => (
          <Link
            className="related-card"
            key={project.name}
            to={`/projects/${project.name}`}
          >
            <span className="related-card-title">{project.displayName}</span>
            <span className="related-card-description">
              {project.description}
            </span>
            <span className="related-card-meta">
              {languageName(project)} · {project.stars} {t.stars}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
