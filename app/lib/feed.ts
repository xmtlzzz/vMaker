import type { Project } from '~/lib/github/projects'
import { languageName } from '~/lib/language'

const FEED_ITEM_LIMIT = 20

export type SitemapEntry = {
  changefreq?: string
  lastmod?: string
  loc: string
  priority?: string
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function projectTimestamp(project: Project) {
  return project.pushedAt || project.updatedAt || project.createdAt || ''
}

// A fallback payload (GitHub unreachable) has empty timestamps, and `new Date('')`
// is NaN — so never let a raw string reach the date formatters.
export function projectTime(project: Project) {
  const time = new Date(projectTimestamp(project)).getTime()
  return Number.isNaN(time) ? 0 : time
}

export function toRfc822(value: string | null | undefined) {
  if (!value) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  return date.toUTCString()
}

export function toDateOnly(value: string | null | undefined) {
  if (!value) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  return date.toISOString().slice(0, 10)
}

type RssOptions = {
  description: string
  feedUrl: string
  limit?: number
  projects: Project[]
  siteUrl: string
  title: string
}

export function buildRssFeed({
  description,
  feedUrl,
  limit = FEED_ITEM_LIMIT,
  projects,
  siteUrl,
  title,
}: RssOptions) {
  const items = [...projects]
    .sort((a, b) => projectTime(b) - projectTime(a))
    .slice(0, limit)

  let lastBuildDate = new Date().toUTCString()
  for (const item of items) {
    const stamp = toRfc822(projectTimestamp(item))
    if (stamp) {
      lastBuildDate = stamp
      break
    }
  }

  const itemsXml = items
    .map((project) => {
      const language = languageName(project)
      const summary = [
        project.description,
        `${language} · ${project.stars} stars`,
        project.url,
      ].join(' — ')

      const lines = [
        `      <title>${escapeXml(project.displayName)}</title>`,
        `      <link>${escapeXml(`${siteUrl}/#${project.name}`)}</link>`,
        `      <guid isPermaLink="false">${escapeXml(project.url)}</guid>`,
      ]

      const pubDate = toRfc822(projectTimestamp(project))
      if (pubDate) lines.push(`      <pubDate>${pubDate}</pubDate>`)

      lines.push(
        `      <category>${escapeXml(language)}</category>`,
        `      <description>${escapeXml(summary)}</description>`
      )

      return ['    <item>', ...lines, '    </item>'].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(siteUrl)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    '    <language>zh-CN</language>',
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    itemsXml,
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

export function buildSitemap(entries: SitemapEntry[]) {
  const urlsXml = entries
    .map((entry) => {
      const lines = [`    <loc>${escapeXml(entry.loc)}</loc>`]
      if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`)
      if (entry.changefreq) {
        lines.push(`    <changefreq>${entry.changefreq}</changefreq>`)
      }
      if (entry.priority)
        lines.push(`    <priority>${entry.priority}</priority>`)

      return ['  <url>', ...lines, '  </url>'].join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlsXml,
    '</urlset>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n')
}
