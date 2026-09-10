import { GITHUB_USER, githubGraphql } from '~/lib/github/client'
import type {
  CommitSummary,
  GitHubRepo,
  RepoDetails,
  RepoIndex,
} from '~/lib/github/types'

// One request replaces the previous 1 + 2N REST calls (repo list, then languages
// and commits per repo). GraphQL requires a token, so the caller only uses this
// reader when one is available.
export const REPO_INDEX_QUERY = `
query ProjectIndex($login: String!, $repos: Int!, $topics: Int!, $languages: Int!, $commits: Int!) {
  user(login: $login) {
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
                nodes { abbreviatedOid committedDate messageHeadline url }
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
  repos: 100,
  topics: 20,
}

type GraphqlCommitNode = {
  abbreviatedOid?: string | null
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
  languages?: {
    edges?: Array<{
      node?: { name?: string | null } | null
      size?: number | null
    } | null> | null
  } | null
  name: string
  nameWithOwner?: string | null
  primaryLanguage?: { name?: string | null } | null
  pushedAt?: string | null
  repositoryTopics?: {
    nodes?: Array<{ topic?: { name?: string | null } | null } | null> | null
  } | null
  stargazerCount?: number | null
  updatedAt?: string | null
  url?: string | null
}

export type GraphqlRepoIndexData = {
  user?: {
    repositories?: {
      nodes?: Array<GraphqlRepositoryNode | null> | null
      totalCount?: number | null
    } | null
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

  const details: RepoDetails = { commits, languages }

  return { details, repo }
}

export function mapGraphqlRepoIndex(data: GraphqlRepoIndexData): RepoIndex {
  const repositories = data.user?.repositories
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

  return {
    details,
    repos,
    // mirrors the existing REST reader, which reads a single page of 100
    ...(totalCount > repos.length ? { truncatedFrom: totalCount } : {}),
  }
}

export async function fetchRepoIndexFromGraphql(token: string) {
  const data = await githubGraphql<GraphqlRepoIndexData>(
    REPO_INDEX_QUERY,
    { login: GITHUB_USER, ...REPO_INDEX_LIMITS },
    token
  )

  return mapGraphqlRepoIndex(data)
}
