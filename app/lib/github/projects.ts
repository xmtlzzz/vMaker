import { projectOverrides } from '~/data/project-overrides'

const GITHUB_USER = 'xmtlzzz'
const GITHUB_API = 'https://api.github.com'

type GitHubRepo = {
  archived: boolean
  created_at: string
  description: string | null
  fork: boolean
  forks_count: number
  full_name: string
  homepage: string | null
  html_url: string
  language: string | null
  name: string
  pushed_at: string | null
  stargazers_count: number
  topics?: string[]
  updated_at: string
}

type GitHubCommit = {
  html_url: string
  sha: string
  commit: {
    author: {
      date: string
      name: string
    } | null
    message: string
  }
}

export type CommitSummary = {
  date: string
  message: string
  sha: string
  url: string
}

export type Project = {
  archived: boolean
  codeSize: number
  commits: CommitSummary[]
  cover?: string
  createdAt: string
  description: string
  displayName: string
  featured: boolean
  forks: number
  fullName: string
  homepage: string | null
  languages: Record<string, number>
  languageShares: Array<{ name: string; bytes: number; percent: number }>
  name: string
  primaryLanguage: string | null
  pushedAt: string | null
  stars: number
  topics: string[]
  updatedAt: string
  url: string
}

export type ProjectSummary = {
  latestActivity: string | null
  primaryLanguages: string[]
  totalCodeSize: number
  totalProjects: number
}

export type ProjectPayload = {
  error?: string
  projects: Project[]
  summary: ProjectSummary
}

const EMPTY_SUMMARY: ProjectSummary = {
  latestActivity: null,
  primaryLanguages: [],
  totalCodeSize: 0,
  totalProjects: 0,
}

const CACHE_TTL = 1000 * 60 * 10
let cachedPayload: { payload: ProjectPayload; timestamp: number } | null = null

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
  })

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

async function getRepoLanguages(repo: string) {
  try {
    return await githubFetch<Record<string, number>>(`/repos/${GITHUB_USER}/${repo}/languages`)
  } catch {
    return {}
  }
}

async function getRepoCommits(repo: string) {
  let commits: GitHubCommit[] = []

  try {
    commits = await githubFetch<GitHubCommit[]>(`/repos/${GITHUB_USER}/${repo}/commits?per_page=5`)
  } catch {
    return []
  }

  return commits.map((item) => ({
    date: item.commit.author?.date ?? '',
    message: item.commit.message.split('\n')[0] ?? 'Update project',
    sha: item.sha.slice(0, 7),
    url: item.html_url,
  }))
}

function getLanguageShares(languages: Record<string, number>) {
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)

  if (total === 0) {
    return []
  }

  return Object.entries(languages)
    .map(([name, bytes]) => ({
      bytes,
      name,
      percent: Math.round((bytes / total) * 100),
    }))
    .sort((a, b) => b.bytes - a.bytes)
}

function toProject(repo: GitHubRepo, languages: Record<string, number> = {}, commits: CommitSummary[] = []): Project {
  const override = projectOverrides[repo.name] ?? {}

  return {
    archived: repo.archived,
    codeSize: Object.values(languages).reduce((sum, bytes) => sum + bytes, 0),
    commits,
    cover: override.cover,
    createdAt: repo.created_at,
    description: override.summary ?? repo.description ?? '这个项目还没有 GitHub 描述。',
    displayName: override.displayName ?? repo.name,
    featured: override.featured ?? false,
    forks: repo.forks_count,
    fullName: repo.full_name,
    homepage: repo.homepage || null,
    languages,
    languageShares: getLanguageShares(languages),
    name: repo.name,
    primaryLanguage: repo.language,
    pushedAt: repo.pushed_at,
    stars: repo.stargazers_count,
    topics: repo.topics ?? [],
    updatedAt: repo.updated_at,
    url: repo.html_url,
  }
}

function sortProjects(projects: Project[]) {
  return projects.sort((a, b) => {
    const aOrder = projectOverrides[a.name]?.order ?? Number.MAX_SAFE_INTEGER
    const bOrder = projectOverrides[b.name]?.order ?? Number.MAX_SAFE_INTEGER

    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }

    return new Date(b.pushedAt ?? b.updatedAt).getTime() - new Date(a.pushedAt ?? a.updatedAt).getTime()
  })
}

function summarize(projects: Project[]): ProjectSummary {
  const languageTotals = new Map<string, number>()

  for (const project of projects) {
    for (const [language, bytes] of Object.entries(project.languages)) {
      languageTotals.set(language, (languageTotals.get(language) ?? 0) + bytes)
    }
  }

  const primaryLanguages = [...languageTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([language]) => language)

  return {
    latestActivity: projects[0]?.pushedAt ?? projects[0]?.updatedAt ?? null,
    primaryLanguages,
    totalCodeSize: projects.reduce((sum, project) => sum + project.codeSize, 0),
    totalProjects: projects.length,
  }
}

export async function getProjects(): Promise<ProjectPayload> {
  const now = Date.now()

  if (cachedPayload && now - cachedPayload.timestamp < CACHE_TTL) {
    return cachedPayload.payload
  }

  try {
    const repos = await githubFetch<GitHubRepo[]>(`/users/${GITHUB_USER}/repos?sort=pushed&per_page=100`)
    const visibleRepos = repos.filter((repo) => !repo.fork && !projectOverrides[repo.name]?.hidden)

    const projects = await Promise.all(
      visibleRepos.map(async (repo) => {
        const [languages, commits] = await Promise.all([
          getRepoLanguages(repo.name),
          getRepoCommits(repo.name),
        ])

        return toProject(repo, languages, commits)
      }),
    )

    const sortedProjects = sortProjects(projects)
    const payload = {
      projects: sortedProjects,
      summary: summarize(sortedProjects),
    }

    cachedPayload = { payload, timestamp: now }
    return payload
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub API request failed'

    if (cachedPayload) {
      return {
        ...cachedPayload.payload,
        error: message,
      }
    }

    return {
      error: message,
      projects: [],
      summary: EMPTY_SUMMARY,
    }
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 102.4) / 10} KB`
  }

  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`
}

export function formatDate(value: string | null) {
  if (!value) {
    return '暂无记录'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
