import type { Project } from '~/lib/github/projects'

export type SortKey = 'activity' | 'stars' | 'name' | 'size'

export type BrowseQuery = {
  text: string
  language: string | null
}

export const SORT_KEYS: readonly SortKey[] = [
  'activity',
  'stars',
  'name',
  'size',
]

const LANGUAGE_PREFIXES = ['language:', 'lang:']
const TOPIC_PREFIX = 'topic:'

function prefixedValue(token: string, prefix: string) {
  return token.slice(prefix.length).trim()
}

// Splits the raw box value into structured filters. Prefix keys are
// case-insensitive; a bare `language:` / `topic:` carries no value and is
// ignored rather than becoming a filter or leaking into the free text.
export function parseSearchQuery(
  raw: string
): BrowseQuery & { topics: string[] } {
  const query: BrowseQuery & { topics: string[] } = {
    language: null,
    text: '',
    topics: [],
  }
  const words: string[] = []

  for (const token of raw.trim().split(/\s+/)) {
    if (!token) continue

    const lower = token.toLowerCase()
    const languagePrefix = LANGUAGE_PREFIXES.find((prefix) =>
      lower.startsWith(prefix)
    )

    if (languagePrefix) {
      const value = prefixedValue(token, languagePrefix)
      if (value) query.language = value
      continue
    }

    if (lower.startsWith(TOPIC_PREFIX)) {
      const value = prefixedValue(token, TOPIC_PREFIX)
      if (value) query.topics.push(value)
      continue
    }

    words.push(token)
  }

  query.text = words.join(' ')
  return query
}

function searchableText(project: Project) {
  return [
    project.name,
    project.displayName,
    project.description,
    project.primaryLanguage ?? '',
    ...project.topics,
  ]
    .join('\n')
    .toLowerCase()
}

const PINYIN_BOUNDARIES: [string, string][] = [
  ['a', '啊'],
  ['b', '芭'],
  ['c', '擦'],
  ['d', '搭'],
  ['e', '蛾'],
  ['f', '发'],
  ['g', '噶'],
  ['h', '哈'],
  ['j', '击'],
  ['k', '喀'],
  ['l', '垃'],
  ['m', '妈'],
  ['n', '拿'],
  ['o', '哦'],
  ['p', '啪'],
  ['q', '期'],
  ['r', '然'],
  ['s', '撒'],
  ['t', '塌'],
  ['w', '挖'],
  ['x', '昔'],
  ['y', '压'],
  ['z', '匝'],
]

export function toPinyinInitials(str: string): string {
  let res = ''
  for (const ch of str) {
    if (/[\u4e00-\u9fa5]/.test(ch)) {
      let found = ''
      for (let i = PINYIN_BOUNDARIES.length - 1; i >= 0; i--) {
        if (ch.localeCompare(PINYIN_BOUNDARIES[i][1], 'zh-CN') >= 0) {
          found = PINYIN_BOUNDARIES[i][0]
          break
        }
      }
      res += found
    } else if (/[a-zA-Z0-9]/.test(ch)) {
      res += ch.toLowerCase()
    }
  }
  return res
}

export function matchesQuery(
  project: Project,
  query: BrowseQuery & { topics: string[] }
): boolean {
  if (query.language) {
    if (
      (project.primaryLanguage ?? '').toLowerCase() !==
      query.language.toLowerCase()
    ) {
      return false
    }
  }

  for (const topic of query.topics) {
    const needle = topic.toLowerCase()
    if (!project.topics.some((entry) => entry.toLowerCase() === needle)) {
      return false
    }
  }

  const terms = query.text.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length > 0) {
    const haystack = searchableText(project)
    const initials = toPinyinInitials(haystack)
    for (const term of terms) {
      if (!haystack.includes(term) && !initials.includes(term)) {
        return false
      }
    }
  }

  return true
}

function activityTimestamp(project: Project) {
  const raw = project.pushedAt || project.updatedAt || project.createdAt || ''
  const time = new Date(raw).getTime()
  return Number.isNaN(time) ? 0 : time
}

// Ties always fall through to displayName (then name) so the order never
// depends on the input sequence.
function compareByName(a: Project, b: Project) {
  const byDisplay = a.displayName.localeCompare(b.displayName)
  return byDisplay !== 0 ? byDisplay : a.name.localeCompare(b.name)
}

function descending(a: number, b: number) {
  return a === b ? 0 : a > b ? -1 : 1
}

export function sortProjects(projects: Project[], key: SortKey): Project[] {
  const sorted = [...projects]

  sorted.sort((a, b) => {
    let primary = 0

    switch (key) {
      case 'activity':
        primary = descending(activityTimestamp(a), activityTimestamp(b))
        break
      case 'stars':
        primary = descending(a.stars, b.stars)
        break
      case 'size':
        primary = descending(a.codeSize, b.codeSize)
        break
      case 'name':
        return compareByName(a, b)
    }

    return primary !== 0 ? primary : compareByName(a, b)
  })

  return sorted
}

export function browseProjects(
  projects: Project[],
  rawQuery: string,
  sort: SortKey
): Project[] {
  const query = parseSearchQuery(rawQuery)
  const matched = projects.filter((project) => matchesQuery(project, query))
  return sortProjects(matched, sort)
}
