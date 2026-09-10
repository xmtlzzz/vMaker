import type { Project } from '~/lib/github/projects'
import { languageId, languageName } from '~/lib/language'

export type ProjectGroup = {
  id: string
  language: string
  projects: Project[]
}

export type CommitTimelineItem = {
  date: string
  message: string
  projectId: string
  projectName: string
  sha: string
  url: string
}

export function groupProjectsByLanguage(projects: Project[]): ProjectGroup[] {
  const groups = new Map<string, Project[]>()

  for (const project of projects) {
    const language = languageName(project)
    groups.set(language, [...(groups.get(language) ?? []), project])
  }

  return [...groups.entries()]
    .map(([language, groupedProjects]) => ({
      id: languageId(language),
      language,
      projects: groupedProjects,
    }))
    .sort((a, b) => {
      if (a.language === 'Other') return 1
      if (b.language === 'Other') return -1
      return a.language.localeCompare(b.language)
    })
}

export function getLatestCommitTimeline(
  projects: Project[]
): CommitTimelineItem[] {
  return projects
    .map((project) => {
      const latestCommit = project.commits[0]
      if (!latestCommit?.date) return null

      return {
        date: latestCommit.date,
        message: latestCommit.message,
        projectId: project.name,
        projectName: project.displayName,
        sha: latestCommit.sha,
        url: latestCommit.url,
      }
    })
    .filter((item): item is CommitTimelineItem => item !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
