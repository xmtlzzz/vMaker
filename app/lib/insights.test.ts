import assert from 'node:assert/strict'

import {
  aggregateLanguages,
  commitActivityByDay,
  indexTotals,
  topTopics,
} from '~/lib/insights'
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
    name,
    openIssues: 0,
    openPullRequests: 0,
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

function commit(date: string, message = 'update', sha = 'abc1234') {
  return {
    date,
    message,
    sha,
    url: `https://github.com/xmtlzzz/x/commit/${sha}`,
  }
}

async function testAggregateLanguages() {
  const projects = [
    project('alpha', {
      languages: { TypeScript: 600, CSS: 200 },
    }),
    project('beta', {
      languages: { TypeScript: 200, Rust: 100, CSS: 100 },
    }),
  ]

  const totals = aggregateLanguages(projects)

  assert.deepEqual(
    totals.map((entry) => entry.name),
    ['TypeScript', 'CSS', 'Rust']
  )
  assert.deepEqual(totals[0], { bytes: 800, name: 'TypeScript', percent: 67 })
  assert.deepEqual(totals[1], { bytes: 300, name: 'CSS', percent: 25 })
  assert.deepEqual(totals[2], { bytes: 100, name: 'Rust', percent: 8 })
}

async function testAggregateLanguagesEmptyAndZero() {
  assert.deepEqual(aggregateLanguages([]), [])

  // no bytes at all: names still surface, share is 0 instead of NaN
  const zero = aggregateLanguages([
    project('alpha', { languages: { TypeScript: 0, CSS: 0 } }),
  ])
  assert.deepEqual(zero, [
    { bytes: 0, name: 'CSS', percent: 0 },
    { bytes: 0, name: 'TypeScript', percent: 0 },
  ])
}

async function testAggregateLanguagesDoesNotMutate() {
  const languages = { TypeScript: 10, CSS: 30 }
  const projects = [project('alpha', { languages })]

  aggregateLanguages(projects)

  assert.deepEqual(languages, { TypeScript: 10, CSS: 30 })
  assert.deepEqual(projects[0].languages, { TypeScript: 10, CSS: 30 })
}

async function testTopTopics() {
  const projects = [
    project('alpha', { topics: ['react', 'typescript', 'cli'] }),
    project('beta', { topics: ['typescript', 'cli', 'rust'] }),
    project('gamma', { topics: ['cli', 'rust'] }),
    project('delta', { topics: ['typescript'] }),
  ]

  assert.deepEqual(topTopics(projects), [
    { count: 3, topic: 'cli' },
    { count: 3, topic: 'typescript' },
    { count: 2, topic: 'rust' },
    { count: 1, topic: 'react' },
  ])
}

async function testTopTopicsRespectsLimitAndDedupes() {
  const projects = [
    // a repo repeating the same topic must only count it once
    project('alpha', { topics: ['react', 'react', 'a', 'b'] }),
    project('beta', { topics: ['b', 'c'] }),
    project('gamma', { topics: ['b', 'd'] }),
  ]

  assert.deepEqual(topTopics(projects, 1), [{ count: 3, topic: 'b' }])
  assert.equal(topTopics(projects).length, 5)
  assert.deepEqual(topTopics([], 3), [])
  assert.deepEqual(topTopics(projects, 0), [])
}

async function testCommitActivityByDay() {
  const now = new Date('2026-03-10T12:00:00Z')
  const projects = [
    project('alpha', {
      commits: [
        commit('2026-03-09T08:00:00Z'),
        commit('2026-03-09T19:30:00Z'),
        commit('2026-03-10T01:00:00Z'),
      ],
    }),
    project('beta', {
      commits: [
        // same UTC day as the last alpha commit, still one bucket
        commit('2026-03-10T11:00:00Z'),
        commit('2026-03-01T00:00:00Z'),
      ],
    }),
  ]

  assert.deepEqual(commitActivityByDay(projects, { now }), [
    { count: 1, date: '2026-03-01' },
    { count: 2, date: '2026-03-09' },
    { count: 2, date: '2026-03-10' },
  ])
}

async function testCommitActivityByDayWindowAndGarbage() {
  const now = new Date('2026-03-10T12:00:00Z')
  const projects = [
    project('alpha', {
      commits: [
        commit('2026-03-10T00:00:00Z'),
        // 8 days back is inside a 10 day window, 30 days back is not
        commit('2026-03-02T00:00:00Z'),
        commit('2026-02-08T00:00:00Z'),
        commit(''),
        commit('not-a-date'),
        commit('2026-03-11T00:00:00Z'),
      ],
    }),
  ]

  assert.deepEqual(
    commitActivityByDay(projects, { days: 10, now }).map((entry) => entry.date),
    ['2026-03-02', '2026-03-10']
  )

  // a one day window is exactly "today"
  assert.deepEqual(commitActivityByDay(projects, { days: 1, now }), [
    { count: 1, date: '2026-03-10' },
  ])

  assert.deepEqual(commitActivityByDay([], { now }), [])
  assert.deepEqual(commitActivityByDay([project('alpha')], { now }), [])
}

async function testIndexTotals() {
  const totals = indexTotals([
    project('alpha', {
      archived: true,
      codeSize: 1000,
      featured: true,
      forks: 2,
      stars: 10,
    }),
    project('beta', { codeSize: 500, forks: 1, stars: 5 }),
  ])

  assert.deepEqual(totals, {
    archivedCount: 1,
    featuredCount: 1,
    latestActivity: '2026-01-01T00:00:00.000Z',
    totalCodeSize: 1500,
    totalForks: 3,
    totalProjects: 2,
    totalStars: 15,
  })
}

// Regression: the payload array is sorted featured-first, so taking the first
// project's timestamp silently reports a stale "latest activity". The newest
// project here is deliberately NOT the first element.
async function testIndexTotalsLatestActivityIsMax() {
  const projects = [
    project('featured-but-old', {
      featured: true,
      pushedAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-02-01T00:00:00Z',
    }),
    project('middle', {
      pushedAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    }),
    project('newest', {
      pushedAt: '2026-05-20T04:05:06Z',
      updatedAt: '2026-06-01T00:00:00Z',
    }),
  ]

  assert.equal(indexTotals(projects).latestActivity, '2026-05-20T04:05:06.000Z')

  // and the max survives a reordering of the same input
  assert.equal(
    indexTotals([...projects].reverse()).latestActivity,
    '2026-05-20T04:05:06.000Z'
  )
}

async function testIndexTotalsLatestActivityFallbacks() {
  // pushedAt empty -> updatedAt; pushedAt null -> updatedAt
  assert.equal(
    indexTotals([
      project('alpha', { pushedAt: '', updatedAt: '2026-04-01T00:00:00Z' }),
    ]).latestActivity,
    '2026-04-01T00:00:00.000Z'
  )

  assert.equal(
    indexTotals([
      project('alpha', {
        createdAt: '2026-02-02T00:00:00Z',
        pushedAt: null,
        updatedAt: '2026-07-07T00:00:00Z',
      }),
    ]).latestActivity,
    '2026-07-07T00:00:00.000Z'
  )

  // every timestamp unparseable -> null, never "Invalid Date" / NaN
  assert.equal(
    indexTotals([
      project('legacy', { createdAt: '', pushedAt: null, updatedAt: '' }),
      project('broken', {
        createdAt: 'nope',
        pushedAt: null,
        updatedAt: 'also-nope',
      }),
    ]).latestActivity,
    null
  )
}

async function testIndexTotalsEmpty() {
  assert.deepEqual(indexTotals([]), {
    archivedCount: 0,
    featuredCount: 0,
    latestActivity: null,
    totalCodeSize: 0,
    totalForks: 0,
    totalProjects: 0,
    totalStars: 0,
  })
}

await testAggregateLanguages()
await testAggregateLanguagesEmptyAndZero()
await testAggregateLanguagesDoesNotMutate()
await testTopTopics()
await testTopTopicsRespectsLimitAndDedupes()
await testCommitActivityByDay()
await testCommitActivityByDayWindowAndGarbage()
await testIndexTotals()
await testIndexTotalsLatestActivityIsMax()
await testIndexTotalsLatestActivityFallbacks()
await testIndexTotalsEmpty()

console.log('insights tests passed')
