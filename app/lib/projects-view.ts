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

export type ProjectSortKey = 'activity' | 'stars' | 'name' | 'size'

export type ProjectFilter = {
  demoOnly: boolean
  featuredOnly: boolean
  language: string
  query: string
}

export const DEFAULT_SORT_KEY: ProjectSortKey = 'activity'

export const ALL_LANGUAGES = 'all'

const SORT_KEYS: readonly string[] = ['activity', 'stars', 'name', 'size']

export function isProjectSortKey(
  value: string | null
): value is ProjectSortKey {
  return value !== null && SORT_KEYS.includes(value)
}

function lastActivity(project: Project) {
  return new Date(project.pushedAt || project.updatedAt || 0).getTime()
}

export function filterProjects(
  projects: Project[],
  filter: ProjectFilter
): Project[] {
  const text = filter.query.trim().toLowerCase()

  return projects.filter((project) => {
    if (filter.featuredOnly && !project.featured) return false
    if (filter.demoOnly && !project.homepage) return false
    if (
      filter.language !== ALL_LANGUAGES &&
      languageName(project) !== filter.language
    ) {
      return false
    }
    if (!text) return true

    return [
      project.displayName,
      project.description,
      project.primaryLanguage,
      ...project.topics,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(text)
  })
}

export function sortProjectsForView(
  projects: Project[],
  key: ProjectSortKey
): Project[] {
  // copy first: callers pass the loader payload straight through
  const sorted = [...projects]

  switch (key) {
    case 'stars':
      return sorted.sort(
        (a, b) =>
          b.stars - a.stars || a.displayName.localeCompare(b.displayName)
      )
    case 'name':
      return sorted.sort((a, b) => a.displayName.localeCompare(b.displayName))
    case 'size':
      return sorted.sort(
        (a, b) =>
          b.codeSize - a.codeSize || a.displayName.localeCompare(b.displayName)
      )
    default:
      return sorted.sort((a, b) => lastActivity(b) - lastActivity(a))
  }
}
