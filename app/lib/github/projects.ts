import { projectOverrides } from '~/data/project-overrides'
import {
  githubFetch,
  resolveGithubLogin,
  resolveGithubToken,
} from '~/lib/github/client'
import { fetchRepoIndexFromGraphql } from '~/lib/github/graphql'
import type {
  GitHubCommit,
  GitHubOwner,
  GitHubRepo,
  Project,
  ProjectPayload,
  ProjectSummary,
  RepoDetailMap,
  RepoDetails,
  RepoIndex,
} from '~/lib/github/types'

export { githubHeaders, resolveGithubToken } from '~/lib/github/client'
export { ownerLabel } from '~/lib/github/types'
export type {
  CommitSummary,
  GitHubOwner,
  GitHubRepo,
  Project,
  ProjectPayload,
  ProjectSummary,
  RepoDetails,
  RepoIndex,
} from '~/lib/github/types'

// The owner shown when GitHub cannot tell us who we are - the offline fallback and
// the unauthenticated REST path. The login is known, the human name is not, so the
// UI falls back to rendering the login instead of inventing a name.
export function fallbackOwner(login = resolveGithubLogin()): GitHubOwner {
  return {
    avatarUrl: null,
    login,
    name: null,
    url: `https://github.com/${login}`,
  }
}

const DETAIL_FETCH_CONCURRENCY = 5

const CACHE_TTL = 1000 * 60 * 10
let cachedPayload: { payload: ProjectPayload; timestamp: number } | null = null

function describeError(error: unknown) {
  return error instanceof Error ? error.message : 'GitHub API request failed'
}

async function getRepoLanguages(login: string, repo: string, token?: string) {
  try {
    return await githubFetch<Record<string, number>>(
      `/repos/${login}/${repo}/languages`,
      token
    )
  } catch {
    return {}
  }
}

async function getRepoReleases(login: string, repo: string, token?: string) {
  try {
    const releases = await githubFetch<
      Array<{
        name: string | null
        published_at: string | null
        tag_name: string
        html_url: string
      }>
    >(`/repos/${login}/${repo}/releases?per_page=5`, token)

    return releases.map((release) => ({
      name: release.name || release.tag_name || 'Release',
      publishedAt: release.published_at ?? '',
      tagName: release.tag_name,
      url: release.html_url,
    }))
  } catch {
    return []
  }
}

async function getRepoCommits(login: string, repo: string, token?: string) {
  let commits: GitHubCommit[] = []

  try {
    commits = await githubFetch<GitHubCommit[]>(
      `/repos/${login}/${repo}/commits?per_page=5`,
      token
    )
  } catch {
    return []
  }

  return commits.map((item) => ({
    ...(item.commit.author?.name ? { author: item.commit.author.name } : {}),
    date: item.commit.author?.date ?? '',
    message: item.commit.message.split('\n')[0] ?? 'Update project',
    sha: item.sha.slice(0, 7),
    url: item.html_url,
  }))
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('Concurrency must be a positive integer')
  }

  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(items[index], index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  )

  return results
}

// The REST reader costs 1 + 2N requests: the repo list, then languages and
// commits for every repo. It stays as the unauthenticated path and as the
// fallback when the GraphQL read fails. Exported so it can be tested against a
// stubbed fetch rather than the live rate limit.
export async function fetchRepoIndexFromRest(
  token?: string
): Promise<RepoIndex> {
  const login = resolveGithubLogin()
  const [profile, repos] = await Promise.all([
    getOwnerProfile(login, token),
    githubFetch<GitHubRepo[]>(
      `/users/${login}/repos?sort=pushed&per_page=100`,
      token
    ),
  ])
  const visibleRepos = repos.filter(
    (repo) => !repo.fork && !projectOverrides[repo.name]?.hidden
  )

  const detailsEntries = await mapWithConcurrency(
    visibleRepos,
    DETAIL_FETCH_CONCURRENCY,
    async (repo) => {
      const [languages, commits, releases] = await Promise.all([
        getRepoLanguages(login, repo.name, token),
        getRepoCommits(login, repo.name, token),
        getRepoReleases(login, repo.name, token),
      ])

      return [
        repo.name,
        {
          commits,
          languages,
          openIssues: repo.open_issues_count ?? 0,
          releaseCount: releases.length,
          releases,
        },
      ] as const
    }
  )

  return {
    details: Object.fromEntries(detailsEntries),
    ...(profile ? { owner: profile } : {}),
    repos,
  }
}

type RestProfile = {
  avatar_url?: string | null
  html_url?: string | null
  login?: string | null
  name?: string | null
}

// A failure here only costs the display name, so it degrades to undefined and the
// caller falls back to the login rather than failing the whole index.
async function getOwnerProfile(
  login: string,
  token?: string
): Promise<GitHubOwner | undefined> {
  try {
    const profile = await githubFetch<RestProfile>(`/users/${login}`, token)
    const resolvedLogin = profile.login?.trim()

    if (!resolvedLogin) {
      return undefined
    }

    return {
      avatarUrl: profile.avatar_url?.trim() || null,
      login: resolvedLogin,
      name: profile.name?.trim() || null,
      url: profile.html_url?.trim() || `https://github.com/${resolvedLogin}`,
    }
  } catch {
    return undefined
  }
}

async function readRepoIndex(token?: string): Promise<RepoIndex> {
  const authToken = resolveGithubToken(token)

  // The GraphQL API is authenticated-only, so without a token REST is the only
  // reader available (public repositories still work unauthenticated).
  if (!authToken) {
    return fetchRepoIndexFromRest()
  }

  try {
    return await fetchRepoIndexFromGraphql(authToken)
  } catch (error) {
    console.warn(
      `[vMaker] GitHub GraphQL read failed, falling back to REST — ${describeError(error)}`
    )

    return fetchRepoIndexFromRest(authToken)
  }
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

function toProject(
  repo: GitHubRepo,
  details: Partial<RepoDetails> = {}
): Project {
  const override = projectOverrides[repo.name] ?? {}
  const languages = details.languages ?? {}
  const commits = details.commits ?? []

  return {
    archived: repo.archived,
    codeSize: Object.values(languages).reduce((sum, bytes) => sum + bytes, 0),
    commits,
    cover: override.cover,
    createdAt: repo.created_at,
    description:
      override.summary ?? repo.description ?? '这个项目还没有 GitHub 描述。',
    displayName: override.displayName ?? repo.name,
    featured: override.featured ?? false,
    forks: repo.forks_count,
    fullName: repo.full_name,
    homepage: repo.homepage || null,
    languages,
    languageShares: getLanguageShares(languages),
    lastCommitAuthor: commits[0]?.author ?? null,
    name: repo.name,
    openIssues: details.openIssues ?? repo.open_issues_count ?? 0,
    openPullRequests: details.openPullRequests ?? 0,
    primaryLanguage: repo.language,
    pushedAt: repo.pushed_at,
    releaseCount: details.releaseCount ?? details.releases?.length ?? 0,
    releases: details.releases ?? [],
    stars: repo.stargazers_count,
    topics: repo.topics ?? [],
    updatedAt: repo.updated_at,
    url: repo.html_url,
  }
}

function sortProjects(projects: Project[]) {
  return projects.sort((a, b) => {
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1
    }

    const aOrder = projectOverrides[a.name]?.order ?? Number.MAX_SAFE_INTEGER
    const bOrder = projectOverrides[b.name]?.order ?? Number.MAX_SAFE_INTEGER

    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }

    return (
      new Date(b.pushedAt || b.updatedAt || 0).getTime() -
      new Date(a.pushedAt || a.updatedAt || 0).getTime()
    )
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

  // The array is sorted featured-first, so projects[0] is not necessarily the most
  // recent. Take the maximum timestamp across every project instead.
  const latestActivity =
    projects
      .map((project) => project.pushedAt || project.updatedAt || '')
      .filter((value) => value && !Number.isNaN(new Date(value).getTime()))
      .sort()
      .at(-1) || null

  return {
    latestActivity,
    primaryLanguages,
    totalCodeSize: projects.reduce((sum, project) => sum + project.codeSize, 0),
    totalProjects: projects.length,
  }
}

export function buildProjectPayload(
  repos: GitHubRepo[],
  detailsByRepo: RepoDetailMap = {},
  owner: GitHubOwner = fallbackOwner()
): ProjectPayload {
  const visibleRepos = repos.filter(
    (repo) => !repo.fork && !projectOverrides[repo.name]?.hidden
  )
  const projects = visibleRepos.map((repo) => {
    return toProject(repo, detailsByRepo[repo.name] ?? {})
  })
  const sortedProjects = sortProjects(projects)

  return {
    owner,
    projects: sortedProjects,
    summary: summarize(sortedProjects),
  }
}

function fallbackRepo(name: string): GitHubRepo {
  const override = projectOverrides[name] ?? {}
  const login = resolveGithubLogin()

  return {
    archived: false,
    created_at: '',
    description: override.summary ?? null,
    fork: false,
    forks_count: 0,
    full_name: `${login}/${name}`,
    homepage: null,
    html_url: `https://github.com/${login}/${name}`,
    language: null,
    name,
    pushed_at: null,
    stargazers_count: 0,
    topics: [],
    updated_at: '',
  }
}

export function createFallbackPayload(error?: string): ProjectPayload {
  const fallbackRepos = Object.entries(projectOverrides)
    .filter(([, override]) => !override.hidden)
    .map(([name]) => fallbackRepo(name))

  const payload = buildProjectPayload(fallbackRepos)

  return {
    ...payload,
    error,
  }
}

export async function getProjects(token?: string): Promise<ProjectPayload> {
  const now = Date.now()

  if (cachedPayload && now - cachedPayload.timestamp < CACHE_TTL) {
    return cachedPayload.payload
  }

  try {
    const index = await readRepoIndex(token)

    if (index.truncatedFrom) {
      console.warn(
        `[vMaker] indexed ${index.repos.length} of ${index.truncatedFrom} repositories; the remainder needs pagination`
      )
    }

    const payload = buildProjectPayload(
      index.repos,
      index.details,
      index.owner ?? fallbackOwner()
    )

    cachedPayload = { payload, timestamp: now }
    return payload
  } catch (error) {
    const message = describeError(error)

    if (cachedPayload) {
      return {
        ...cachedPayload.payload,
        error: message,
      }
    }

    return createFallbackPayload(message)
  }
}
