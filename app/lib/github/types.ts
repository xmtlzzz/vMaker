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

export type RepoDetails = {
  commits: CommitSummary[]
  languages: Record<string, number>
}

export type RepoDetailMap = Record<string, Partial<RepoDetails> | undefined>

// What a reader (REST or GraphQL) hands back to the payload builder.
export type RepoIndex = {
  details: RepoDetailMap
  repos: GitHubRepo[]
  // set when the source knows the account has more repositories than were read
  truncatedFrom?: number
}
