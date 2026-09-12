import type { Project } from '~/lib/github/projects'

const DEFAULT_TOPIC_LIMIT = 5
const DEFAULT_ACTIVITY_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseTime(value: string | null | undefined) {
  if (!value) return undefined

  const time = new Date(value).getTime()
  return Number.isNaN(time) ? undefined : time
}

export function aggregateLanguages(
  projects: Project[]
): Array<{ name: string; bytes: number; percent: number }> {
  const totals = new Map<string, number>()

  for (const project of projects) {
    for (const [name, bytes] of Object.entries(project.languages)) {
      totals.set(name, (totals.get(name) ?? 0) + bytes)
    }
  }

  const total = [...totals.values()].reduce((sum, bytes) => sum + bytes, 0)

  return [...totals.entries()]
    .map(([name, bytes]) => ({
      bytes,
      name,
      percent: total === 0 ? 0 : Math.round((bytes / total) * 100),
    }))
    .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name))
}

export function topTopics(
  projects: Project[],
  limit = DEFAULT_TOPIC_LIMIT
): Array<{ topic: string; count: number }> {
  const counts = new Map<string, number>()

  for (const project of projects) {
    for (const topic of new Set(project.topics)) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([topic, count]) => ({ count, topic }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic))
    .slice(0, Math.max(0, limit))
}

export function commitActivityByDay(
  projects: Project[],
  options: { days?: number; now?: Date } = {}
): Array<{ date: string; count: number }> {
  const { days = DEFAULT_ACTIVITY_DAYS, now = new Date() } = options
  const nowTime = now.getTime()

  if (Number.isNaN(nowTime)) {
    return []
  }

  const since = nowTime - Math.max(0, days) * DAY_MS
  const buckets = new Map<string, number>()

  for (const project of projects) {
    for (const commit of project.commits) {
      const time = parseTime(commit.date)

      if (time === undefined || time > nowTime || time < since) {
        continue
      }

      const key = dayKey(new Date(time))
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }
  }

  return [...buckets.entries()]
    .map(([date, count]) => ({ count, date }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function indexTotals(projects: Project[]) {
  let totalStars = 0
  let totalForks = 0
  let totalCodeSize = 0
  let archivedCount = 0
  let featuredCount = 0
  let latestTime: number | undefined

  for (const project of projects) {
    totalStars += project.stars
    totalForks += project.forks
    totalCodeSize += project.codeSize
    if (project.archived) archivedCount += 1
    if (project.featured) featuredCount += 1

    const time = parseTime(
      project.pushedAt || project.updatedAt || project.createdAt
    )

    if (time !== undefined && (latestTime === undefined || time > latestTime)) {
      latestTime = time
    }
  }

  return {
    archivedCount,
    featuredCount,
    latestActivity:
      latestTime === undefined ? null : new Date(latestTime).toISOString(),
    totalCodeSize,
    totalForks,
    totalProjects: projects.length,
    totalStars,
  }
}
