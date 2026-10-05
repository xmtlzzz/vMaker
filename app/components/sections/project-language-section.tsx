import { languageIconConfig } from '~/components/language-badges'
import type { Locale } from '~/data/copy'
import { ProjectPanel } from '~/components/sections/project-panel'
import type { ProjectGroup } from '~/lib/projects-view'

export function ProjectLanguageSection({
  group,
  hoveredProjectId,
  isDark,
  locale,
  onProjectHover,
  t,
  unavailable = false,
}: {
  group: ProjectGroup
  hoveredProjectId: string | null
  isDark: boolean
  locale: Locale
  onProjectHover: (projectId: string | null) => void
  t: Record<string, string>
  unavailable?: boolean
}) {
  const { accentClassName, icon: LanguageIcon } = languageIconConfig(
    group.language
  )

  return (
    <section
      className="language-section scroll-mt-24 rounded-[1.25rem]"
      id={`language-${group.id}`}
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="project-group-count">
            {group.projects.length} {t.projectCount}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`inline-flex size-10 items-center justify-center rounded-2xl border ${accentClassName}`}
            >
              <LanguageIcon className="size-5" />
            </span>
            <h3 className="language-section-title project-group-title">
              {group.featured ? t.featured : group.language}
            </h3>
          </div>
        </div>
        <a
          className="project-back-link inline-flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1 text-xs transition-colors hover:border-border hover:text-foreground"
          href="#projects"
        >
          <span>↑</span> {t.projectsTop}
        </a>
      </div>
      <div className="project-card-grid">
        {group.projects.map((project) => (
          <ProjectPanel
            isActive={hoveredProjectId === project.name}
            isDark={isDark}
            key={project.name}
            locale={locale}
            onHover={onProjectHover}
            project={project}
            t={t}
            unavailable={unavailable}
          />
        ))}
      </div>
    </section>
  )
}
