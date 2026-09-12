// Shared shapes for the GitHub data layer. Both the REST and the GraphQL reader
// normalise into GitHubRepo + RepoDetails, so buildProjectPayload stays the single
// place that turns transport data into what the UI consumes.

export type GitHubRepo = {
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
  open_issues_count?: number
  pushed_at: string | null
  stargazers_count: number
  topics?: string[]
  updated_at: string
}

export type GitHubCommit = {
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
  author?: string
  date: string
  message: string
  sha: string
  url: string
}

// The account the index is rendered *for*. `login` is the handle used in links,
// `name` is the human display name used in prose, and both come from GitHub rather
// than a constant so a deployment labels itself with its own account.
export type GitHubOwner = {
  avatarUrl: string | null
  login: string
  name: string | null
  url: string
}

// The name to render in prose: the human display name when GitHub has one, the
// handle otherwise. Never empty, so copy never reads "from ."
export function ownerLabel(owner: GitHubOwner) {
  return owner.name?.trim() || owner.login
}

export type ProjectRelease = {
  name: string
  publishedAt: string
  tagName: string
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
  lastCommitAuthor: string | null
  name: string
  openIssues: number
  openPullRequests: number
  primaryLanguage: string | null
  pushedAt: string | null
  releaseCount: number
  releases: ProjectRelease[]
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
  owner: GitHubOwner
  projects: Project[]
  summary: ProjectSummary
}

export type RepoDetails = {
  commits: CommitSummary[]
  languages: Record<string, number>
  openIssues?: number
  openPullRequests?: number
  releaseCount?: number
  releases?: ProjectRelease[]
}

export type RepoDetailMap = Record<string, Partial<RepoDetails> | undefined>

// What a reader (REST or GraphQL) hands back to the payload builder.
export type RepoIndex = {
  details: RepoDetailMap
  // Present when the reader can see the account itself (GraphQL `viewer`). The REST
  // reader has no such endpoint, so it leaves this unset and falls back to the login.
  owner?: GitHubOwner
  repos: GitHubRepo[]
  // set when the source knows the account has more repositories than were read
  truncatedFrom?: number
}
