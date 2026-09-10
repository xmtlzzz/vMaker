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

export const RELATED_PROJECT_LIMIT = 3

const SHARED_TOPIC_WEIGHT = 2
const SAME_PRIMARY_LANGUAGE_WEIGHT = 1
const SHARED_LANGUAGE_WEIGHT = 0.5

// Relatedness is derived only from data already in the payload, so the detail page
// costs no extra GitHub requests. A project with nothing in common scores 0 and is
// dropped, which lets the caller hide the whole section instead of showing an empty
// state. Ties break on stars and then name so the output is stable.
export function getRelatedProjects(
  projects: Project[],
  target: Project,
  limit = RELATED_PROJECT_LIMIT
): Project[] {
  const targetTopics = new Set(
    target.topics.map((topic) => topic.trim().toLowerCase())
  )
  const targetLanguages = new Set(Object.keys(target.languages))

  return projects
    .filter((project) => project.name !== target.name)
    .map((project) => {
      const sharedTopics = project.topics.filter((topic) =>
        targetTopics.has(topic.trim().toLowerCase())
      ).length
      const samePrimaryLanguage =
        Boolean(target.primaryLanguage) &&
        project.primaryLanguage === target.primaryLanguage
      const sharedLanguages = Object.keys(project.languages).filter(
        (language) =>
          targetLanguages.has(language) && language !== target.primaryLanguage
      ).length

      const score =
        sharedTopics * SHARED_TOPIC_WEIGHT +
        (samePrimaryLanguage ? SAME_PRIMARY_LANGUAGE_WEIGHT : 0) +
        sharedLanguages * SHARED_LANGUAGE_WEIGHT

      return { project, score }
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.project.stars - a.project.stars ||
        a.project.displayName.localeCompare(b.project.displayName)
    )
    .slice(0, limit)
    .map((entry) => entry.project)
}
