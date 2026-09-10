import { languageIconConfig } from '~/components/language-badges'
import { ProjectPanel } from '~/components/sections/project-panel'
import type { ProjectGroup } from '~/lib/projects-view'

export function ProjectLanguageSection({
  group,
  hoveredProjectId,
  isDark,
  onProjectHover,
  t,
}: {
  group: ProjectGroup
  hoveredProjectId: string | null
  isDark: boolean
  onProjectHover: (projectId: string | null) => void
  t: Record<string, string>
}) {
  const { accentClassName, icon: LanguageIcon } = languageIconConfig(group.language)

  return (
    <section className='language-section scroll-mt-24 rounded-[1.25rem]' id={`language-${group.id}`}>
      <div className='mb-4 flex items-end justify-between gap-4'>
        <div>
          <p className='project-group-count'>{group.projects.length} projects</p>
          <div className='mt-2 flex items-center gap-3'>
            <span className={`inline-flex size-10 items-center justify-center rounded-2xl border ${accentClassName}`}>
              <LanguageIcon className='size-5' />
            </span>
            <h3 className='language-section-title project-group-title'>{group.language}</h3>
          </div>
        </div>
        <a className='project-back-link' href='#projects'>{t.projectsTop}</a>
      </div>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {group.projects.map((project) => (
          <ProjectPanel
            isActive={hoveredProjectId === project.name}
            isDark={isDark}
            key={project.name}
            onHover={onProjectHover}
            project={project}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}
