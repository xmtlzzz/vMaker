import { GITHUB_USER, githubGraphql } from '~/lib/github/client'
import type {
  CommitSummary,
  GitHubRepo,
  GitHubOwner,
  ProjectRelease,
  RepoDetails,
  RepoIndex,
} from '~/lib/github/types'

// One request replaces the previous 1 + 2N REST calls (repo list, then languages
// and commits per repo). GraphQL requires a token, so the caller only uses this
// reader when one is available.
//
// The read is rooted at `viewer`, so the indexed account - and the name the site
// renders - come from the token itself rather than a constant. Pointing the token at
// a different account is therefore all it takes to re-label a deployment.
export const REPO_INDEX_QUERY = `
query ProjectIndex($repos: Int!, $topics: Int!, $languages: Int!, $commits: Int!, $releases: Int!) {
  viewer {
    avatarUrl
    login
    name
    url
    repositories(
      first: $repos
      ownerAffiliations: [OWNER]
      isFork: false
      privacy: PUBLIC
      orderBy: { field: PUSHED_AT, direction: DESC }
    ) {
      totalCount
      nodes {
        name
        nameWithOwner
        description
        url
        homepageUrl
        isArchived
        isFork
        stargazerCount
        forkCount
        issues(states: OPEN) { totalCount }
        pullRequests(states: OPEN) { totalCount }
        releases(first: $releases, orderBy: { field: CREATED_AT, direction: DESC }) {
          totalCount
          nodes { name tagName publishedAt url }
        }
        createdAt
        updatedAt
        pushedAt
        primaryLanguage { name }
        repositoryTopics(first: $topics) { nodes { topic { name } } }
        languages(first: $languages, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name } }
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: $commits) {
                nodes {
                  abbreviatedOid
                  committedDate
                  messageHeadline
                  url
                  author { name }
                }
              }
            }
          }
        }
      }
    }
  }
}
`

export const REPO_INDEX_LIMITS = {
  commits: 5,
  languages: 25,
  releases: 5,
  repos: 100,
  topics: 20,
}

type GraphqlCommitNode = {
  abbreviatedOid?: string | null
  author?: { name?: string | null } | null
  committedDate?: string | null
  messageHeadline?: string | null
  url?: string | null
}

export type GraphqlRepositoryNode = {
  createdAt?: string | null
  defaultBranchRef?: {
    target?: {
      history?: { nodes?: Array<GraphqlCommitNode | null> | null } | null
    } | null
  } | null
  description?: string | null
  forkCount?: number | null
  homepageUrl?: string | null
  isArchived?: boolean | null
  isFork?: boolean | null
  issues?: { totalCount?: number | null } | null
  languages?: {
    edges?: Array<{
      node?: { name?: string | null } | null
      size?: number | null
    } | null> | null
  } | null
  name: string
  nameWithOwner?: string | null
  primaryLanguage?: { name?: string | null } | null
  pullRequests?: { totalCount?: number | null } | null
  pushedAt?: string | null
  releases?: {
    nodes?: Array<{
      name?: string | null
      publishedAt?: string | null
      tagName?: string | null
      url?: string | null
    } | null> | null
    totalCount?: number | null
  } | null
  repositoryTopics?: {
    nodes?: Array<{ topic?: { name?: string | null } | null } | null> | null
  } | null
  stargazerCount?: number | null
  updatedAt?: string | null
  url?: string | null
}

export type GraphqlRepoIndexData = {
  viewer?: {
    avatarUrl?: string | null
    login?: string | null
    name?: string | null
    repositories?: {
      nodes?: Array<GraphqlRepositoryNode | null> | null
      totalCount?: number | null
    } | null
    url?: string | null
  } | null
}

export function mapGraphqlRepository(node: GraphqlRepositoryNode) {
  const languages: Record<string, number> = {}

  for (const edge of node.languages?.edges ?? []) {
    const name = edge?.node?.name
    if (!name) continue

    languages[name] = (languages[name] ?? 0) + (edge?.size ?? 0)
  }

  const commits: CommitSummary[] = (
    node.defaultBranchRef?.target?.history?.nodes ?? []
  )
    .filter((commit): commit is GraphqlCommitNode => Boolean(commit))
    .map((commit) => ({
      ...(commit.author?.name ? { author: commit.author.name } : {}),
      date: commit.committedDate ?? '',
      message: commit.messageHeadline || 'Update project',
      sha: (commit.abbreviatedOid ?? '').slice(0, 7),
      url: commit.url ?? '',
    }))

  const repo: GitHubRepo = {
    archived: Boolean(node.isArchived),
    created_at: node.createdAt ?? '',
    description: node.description ?? null,
    fork: Boolean(node.isFork),
    forks_count: node.forkCount ?? 0,
    full_name: node.nameWithOwner ?? `${GITHUB_USER}/${node.name}`,
    homepage: node.homepageUrl || null,
    html_url: node.url ?? '',
    language: node.primaryLanguage?.name ?? null,
    name: node.name,
    pushed_at: node.pushedAt ?? null,
    stargazers_count: node.stargazerCount ?? 0,
    topics: (node.repositoryTopics?.nodes ?? [])
      .map((entry) => entry?.topic?.name)
      .filter((name): name is string => Boolean(name)),
    updated_at: node.updatedAt ?? '',
  }

  const releases: ProjectRelease[] = (node.releases?.nodes ?? [])
    .filter((release): release is NonNullable<typeof release> =>
      Boolean(release)
    )
    .map((release) => ({
      name: release.name || release.tagName || 'Release',
      publishedAt: release.publishedAt ?? '',
      tagName: release.tagName ?? '',
      url: release.url ?? '',
    }))

  const details: RepoDetails = {
    commits,
    languages,
    openIssues: node.issues?.totalCount ?? 0,
    openPullRequests: node.pullRequests?.totalCount ?? 0,
    releaseCount: node.releases?.totalCount ?? 0,
    releases,
  }

  return { details, repo }
}

export function mapGraphqlRepoIndex(data: GraphqlRepoIndexData): RepoIndex {
  const repositories = data.viewer?.repositories
  const nodes = (repositories?.nodes ?? []).filter(
    (node): node is GraphqlRepositoryNode => Boolean(node)
  )

  const repos: GitHubRepo[] = []
  const details: RepoIndex['details'] = {}

  for (const node of nodes) {
    const mapped = mapGraphqlRepository(node)
    repos.push(mapped.repo)
    details[mapped.repo.name] = mapped.details
  }

  const totalCount = repositories?.totalCount ?? repos.length
  const owner = mapGraphqlOwner(data)

  return {
    details,
    ...(owner ? { owner } : {}),
    repos,
    // mirrors the existing REST reader, which reads a single page of 100
    ...(totalCount > repos.length ? { truncatedFrom: totalCount } : {}),
  }
}

// `viewer` is always resolvable for a valid token, but the mapper stays defensive:
// a token that can read repositories should never fail the whole index just because
// the profile fields came back empty.
export function mapGraphqlOwner(
  data: GraphqlRepoIndexData
): GitHubOwner | undefined {
  const login = data.viewer?.login?.trim()

  if (!login) {
    return undefined
  }

  return {
    avatarUrl: data.viewer?.avatarUrl?.trim() || null,
    login,
    name: data.viewer?.name?.trim() || null,
    url: data.viewer?.url?.trim() || `https://github.com/${login}`,
  }
}

export async function fetchRepoIndexFromGraphql(token: string) {
  const data = await githubGraphql<GraphqlRepoIndexData>(
    REPO_INDEX_QUERY,
    { ...REPO_INDEX_LIMITS },
    token
  )

  return mapGraphqlRepoIndex(data)
}
