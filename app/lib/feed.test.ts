import assert from 'node:assert/strict'

import { buildRssFeed, buildSitemap, escapeXml, toDateOnly } from '~/lib/feed'
import type { Project } from '~/lib/github/projects'

function project(name: string, overrides: Partial<Project> = {}): Project {
  return {
    archived: false,
    codeSize: 100,
    commits: [],
    createdAt: '2026-01-01T00:00:00Z',
    description: `${name} description`,
    displayName: name,
    featured: false,
    forks: 0,
    fullName: `xmtlzzz/${name}`,
    homepage: null,
    languages: {},
    languageShares: [],
    lastCommitAuthor: null,
    openIssues: 0,
    openPullRequests: 0,
    name,
    primaryLanguage: 'TypeScript',
    pushedAt: '2026-01-01T00:00:00Z',
    releaseCount: 0,
    releases: [],
    stars: 0,
    topics: [],
    updatedAt: '2026-01-01T00:00:00Z',
    url: `https://github.com/xmtlzzz/${name}`,
    ...overrides,
  }
}

const feedOptions = {
  description: 'desc',
  feedUrl: 'https://x/feed.xml',
  siteUrl: 'https://x',
  title: 'T',
}

async function testEscapeXml() {
  assert.equal(
    escapeXml('a & b < c > d "e" \'f\''),
    'a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;'
  )
  assert.equal(escapeXml('xmtlzzz/vMaker'), 'xmtlzzz/vMaker')
}

async function testRssFeed() {
  const xml = buildRssFeed({
    ...feedOptions,
    projects: [
      project('alpha', {
        displayName: 'Alpha',
        pushedAt: '2026-01-01T00:00:00Z',
        releaseCount: 0,
        releases: [],
      }),
      project('beta', {
        displayName: 'Beta',
        pushedAt: '2026-03-01T00:00:00Z',
        releaseCount: 0,
        releases: [],
        stars: 10,
      }),
    ],
  })

  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
  assert.match(xml, /<rss version="2\.0"/)
  assert.match(xml, /<atom:link href="https:\/\/x\/feed\.xml" rel="self"/)

  // newest activity first
  assert.ok(
    xml.indexOf('<title>Beta</title>') < xml.indexOf('<title>Alpha</title>')
  )

  // item links point at the on-site anchor, the guid is the stable repo url
  assert.match(xml, /<link>https:\/\/x\/#beta<\/link>/)
  assert.match(
    xml,
    /<guid isPermaLink="false">https:\/\/github\.com\/xmtlzzz\/beta<\/guid>/
  )
  assert.match(xml, /<pubDate>Sun, 01 Mar 2026 00:00:00 GMT<\/pubDate>/)
  assert.match(xml, /<category>TypeScript<\/category>/)
}

async function testRssFeedLimitAndEscaping() {
  const many = Array.from({ length: 30 }, (_, index) =>
    project(`p${index}`, {
      pushedAt: `2026-01-01T00:00:0${index % 10}Z`,
    })
  )
  const limited = buildRssFeed({ ...feedOptions, limit: 5, projects: many })
  assert.equal((limited.match(/<item>/g) ?? []).length, 5)

  const tricky = project('a&b', {
    description: '<script>alert(1)</script>',
    displayName: 'A & B',
  })
  const xml = buildRssFeed({ ...feedOptions, projects: [tricky] })
  assert.match(xml, /<title>A &amp; B<\/title>/)
  assert.ok(!xml.includes('<script>'), 'raw markup must be escaped')
}

async function testEmptyFeed() {
  const xml = buildRssFeed({ ...feedOptions, projects: [] })
  assert.equal((xml.match(/<item>/g) ?? []).length, 0)
  assert.match(xml, /<lastBuildDate>[^<]+<\/lastBuildDate>/)
}

async function testSitemap() {
  const xml = buildSitemap([
    {
      changefreq: 'daily',
      lastmod: '2026-03-01',
      loc: 'https://x/',
      priority: '1.0',
    },
  ])

  assert.match(
    xml,
    /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/
  )
  assert.match(xml, /<loc>https:\/\/x\/<\/loc>/)
  assert.match(xml, /<lastmod>2026-03-01<\/lastmod>/)
  assert.match(xml, /<changefreq>daily<\/changefreq>/)
  assert.match(xml, /<priority>1\.0<\/priority>/)

  // optional fields must be omitted, not emitted empty
  const minimal = buildSitemap([{ loc: 'https://x/a' }])
  assert.ok(!minimal.includes('<lastmod>'))
  assert.ok(!minimal.includes('<changefreq>'))
  assert.ok(!minimal.includes('<priority>'))
}

async function testToDateOnly() {
  assert.equal(toDateOnly('2026-03-01T12:34:56Z'), '2026-03-01')
  assert.equal(toDateOnly(''), undefined)
  assert.equal(toDateOnly(null), undefined)
  assert.equal(toDateOnly('not-a-date'), undefined)
}

// Regression: the GitHub-unreachable fallback payload carries empty timestamps,
// which used to render as "<lastBuildDate>Invalid Date</lastBuildDate>".
async function testFeedWithMissingTimestamps() {
  const xml = buildRssFeed({
    ...feedOptions,
    projects: [
      project('legacy', { createdAt: '', pushedAt: null, updatedAt: '' }),
    ],
  })

  assert.ok(!xml.includes('Invalid Date'), 'NaN dates must not leak out')
  assert.ok(!xml.includes('<pubDate>'), 'no pubDate when there is no date')
  assert.match(xml, /<lastBuildDate>[^<]+<\/lastBuildDate>/)
  assert.equal((xml.match(/<item>/g) ?? []).length, 1)
}

await testEscapeXml()
await testRssFeed()
await testRssFeedLimitAndEscaping()
await testEmptyFeed()
await testFeedWithMissingTimestamps()
await testSitemap()
await testToDateOnly()
