import assert from 'node:assert/strict'

import {
  SORT_KEYS,
  browseProjects,
  matchesQuery,
  parseSearchQuery,
  sortProjects,
} from '~/lib/browse'
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

const noQuery = { language: null, text: '', topics: [] }

async function testParseSearchQuery() {
  assert.deepEqual(parseSearchQuery('language:TypeScript router'), {
    language: 'TypeScript',
    text: 'router',
    topics: [],
  })

  // lang is an alias for language, prefix matching is case-insensitive
  assert.deepEqual(parseSearchQuery('Lang:Go cli'), {
    language: 'Go',
    text: 'cli',
    topics: [],
  })

  // topics accumulate, text keeps its order
  assert.deepEqual(parseSearchQuery('topic:cli topic:tool cloud'), {
    language: null,
    text: 'cloud',
    topics: ['cli', 'tool'],
  })

  // plain text only
  assert.deepEqual(parseSearchQuery('router'), {
    language: null,
    text: 'router',
    topics: [],
  })
}

async function testParseSearchQueryEdgeCases() {
  // extra whitespace collapses, nothing empty survives
  assert.deepEqual(parseSearchQuery('   language:TypeScript    router   '), {
    language: 'TypeScript',
    text: 'router',
    topics: [],
  })

  // empty string is a clean no-op query
  assert.deepEqual(parseSearchQuery(''), noQuery)
  assert.deepEqual(parseSearchQuery('   '), noQuery)

  // bare prefixes carry no filter value
  assert.deepEqual(parseSearchQuery('language:'), noQuery)
  assert.deepEqual(parseSearchQuery('lang:'), noQuery)
  assert.deepEqual(parseSearchQuery('topic:'), noQuery)

  // last language prefix wins, unknown prefixes fall through to text
  assert.deepEqual(parseSearchQuery('language:Go language:Rust'), {
    language: 'Rust',
    text: '',
    topics: [],
  })
  assert.deepEqual(parseSearchQuery('label:bug'), {
    language: null,
    text: 'label:bug',
    topics: [],
  })
}

async function testMatchesQueryFields() {
  const subject = project('vmaker', {
    description: 'A static portfolio generator',
    displayName: 'vMaker',
    primaryLanguage: 'TypeScript',
    topics: ['cli', 'portfolio'],
  })

  // name, displayName, description, topic, primaryLanguage all match by substring
  assert.equal(matchesQuery(subject, { ...noQuery, text: 'vmak' }), true)
  assert.equal(matchesQuery(subject, { ...noQuery, text: 'MAKER' }), true)
  assert.equal(matchesQuery(subject, { ...noQuery, text: 'STATIC' }), true)
  assert.equal(matchesQuery(subject, { ...noQuery, text: 'portfolio' }), true)
  assert.equal(matchesQuery(subject, { ...noQuery, text: 'typescript' }), true)

  // multiple text tokens must all match
  assert.equal(
    matchesQuery(subject, { ...noQuery, text: 'maker static' }),
    true
  )
  assert.equal(
    matchesQuery(subject, { ...noQuery, text: 'maker missing' }),
    false
  )
  assert.equal(matchesQuery(subject, { ...noQuery, text: 'nope' }), false)

  // empty text matches everything
  assert.equal(matchesQuery(subject, noQuery), true)
}

async function testMatchesQueryStructuredFilters() {
  const subject = project('vmaker', {
    primaryLanguage: 'TypeScript',
    topics: ['CLI', 'Portfolio'],
  })

  // language filter is case-insensitive and exact on the primary language
  assert.equal(
    matchesQuery(subject, { ...noQuery, language: 'typescript' }),
    true
  )
  assert.equal(matchesQuery(subject, { ...noQuery, language: 'Go' }), false)

  // topic filter is case-insensitive membership
  assert.equal(matchesQuery(subject, { ...noQuery, topics: ['cli'] }), true)
  assert.equal(
    matchesQuery(subject, { ...noQuery, topics: ['cli', 'PORTFOLIO'] }),
    true
  )
  assert.equal(
    matchesQuery(subject, { ...noQuery, topics: ['cli', 'missing'] }),
    false
  )

  // structured filters AND with the free-text match
  assert.equal(
    matchesQuery(subject, { language: 'TypeScript', text: 'nope', topics: [] }),
    false
  )

  // a null primary language never satisfies a language filter
  const other = project('other', { primaryLanguage: null, topics: [] })
  assert.equal(
    matchesQuery(other, { ...noQuery, language: 'TypeScript' }),
    false
  )
}

async function testSortByActivity() {
  const sorted = sortProjects(
    [
      project('old', { displayName: 'Old', pushedAt: '2026-01-01T00:00:00Z' }),
      project('new', { displayName: 'New', pushedAt: '2026-06-01T00:00:00Z' }),
      project('mid', { displayName: 'Mid', pushedAt: '2026-03-01T00:00:00Z' }),
    ],
    'activity'
  )

  assert.deepEqual(
    sorted.map((item) => item.name),
    ['new', 'mid', 'old']
  )

  // falls back to updatedAt then createdAt when pushedAt is missing
  const fallback = sortProjects(
    [
      project('pushed', {
        displayName: 'Pushed',
        pushedAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }),
      project('updated', {
        displayName: 'Updated',
        pushedAt: null,
        updatedAt: '2026-05-01T00:00:00Z',
      }),
      project('created', {
        createdAt: '2026-08-01T00:00:00Z',
        displayName: 'Created',
        pushedAt: null,
        updatedAt: '',
      }),
    ],
    'activity'
  )

  assert.deepEqual(
    fallback.map((item) => item.name),
    ['created', 'updated', 'pushed']
  )
}

async function testSortByStarsAndSize() {
  const stars = sortProjects(
    [
      project('a', { displayName: 'A', stars: 5 }),
      project('b', { displayName: 'B', stars: 50 }),
      project('c', { displayName: 'C', stars: 500 }),
    ],
    'stars'
  )
  assert.deepEqual(
    stars.map((item) => item.name),
    ['c', 'b', 'a']
  )

  const size = sortProjects(
    [
      project('a', { codeSize: 10, displayName: 'A' }),
      project('b', { codeSize: 900, displayName: 'B' }),
      project('c', { codeSize: 400, displayName: 'C' }),
    ],
    'size'
  )
  assert.deepEqual(
    size.map((item) => item.name),
    ['b', 'c', 'a']
  )
}

async function testSortByName() {
  const sorted = sortProjects(
    [
      project('zulu', { displayName: 'zulu' }),
      project('alpha', { displayName: 'Alpha' }),
      project('bravo', { displayName: 'bravo' }),
    ],
    'name'
  )

  assert.deepEqual(
    sorted.map((item) => item.name),
    ['alpha', 'bravo', 'zulu']
  )
}

async function testSortTieBreaksAreDeterministic() {
  // equal stars -> ordered by displayName
  const byStars = sortProjects(
    [
      project('b', { displayName: 'Bravo', stars: 7 }),
      project('a', { displayName: 'Alpha', stars: 7 }),
      project('c', { displayName: 'Charlie', stars: 7 }),
    ],
    'stars'
  )
  assert.deepEqual(
    byStars.map((item) => item.name),
    ['a', 'b', 'c']
  )

  // equal activity timestamps -> ordered by displayName
  const byActivity = sortProjects(
    [
      project('b', { displayName: 'Bravo', pushedAt: '2026-02-02T00:00:00Z' }),
      project('a', { displayName: 'Alpha', pushedAt: '2026-02-02T00:00:00Z' }),
    ],
    'activity'
  )
  assert.deepEqual(
    byActivity.map((item) => item.name),
    ['a', 'b']
  )

  // identical displayNames still break by name, never by input order
  const sameDisplay = [
    project('b', { displayName: 'Dup' }),
    project('a', { displayName: 'Dup' }),
  ]
  assert.deepEqual(
    sortProjects(sameDisplay, 'name').map((item) => item.name),
    ['a', 'b']
  )
  assert.deepEqual(
    sortProjects([...sameDisplay].reverse(), 'name').map((item) => item.name),
    ['a', 'b']
  )
}

async function testDoesNotMutateInput() {
  const input = [
    project('b', { displayName: 'B', stars: 1 }),
    project('a', { displayName: 'A', stars: 9 }),
  ]
  const snapshot = input.map((item) => item.name)

  const sorted = sortProjects(input, 'stars')
  assert.deepEqual(
    input.map((item) => item.name),
    snapshot,
    'sortProjects must not reorder its input'
  )
  assert.notEqual(sorted, input)
  assert.deepEqual(
    sorted.map((item) => item.name),
    ['a', 'b']
  )

  const browsed = browseProjects(input, '', 'stars')
  assert.deepEqual(
    input.map((item) => item.name),
    snapshot,
    'browseProjects must not reorder its input'
  )
  assert.notEqual(browsed, input)
}

async function testBrowseProjects() {
  const projects = [
    project('portfolio', {
      displayName: 'Portfolio',
      primaryLanguage: 'TypeScript',
      stars: 10,
      topics: ['site'],
    }),
    project('cli', {
      displayName: 'Cli',
      primaryLanguage: 'Rust',
      stars: 99,
      topics: ['cli'],
    }),
    project('docs', {
      displayName: 'Docs',
      primaryLanguage: 'TypeScript',
      stars: 5,
      topics: ['cli'],
    }),
  ]

  // no query: everything, just sorted
  assert.deepEqual(
    browseProjects(projects, '', 'stars').map((item) => item.name),
    ['cli', 'portfolio', 'docs']
  )

  // structured language filter composes with the sort
  assert.deepEqual(
    browseProjects(projects, 'language:TypeScript', 'stars').map(
      (item) => item.name
    ),
    ['portfolio', 'docs']
  )

  // topic filter plus free text
  assert.deepEqual(
    browseProjects(projects, 'topic:cli docs', 'name').map((item) => item.name),
    ['docs']
  )

  // no match yields an empty array
  assert.deepEqual(browseProjects(projects, 'language:Go', 'stars'), [])
}

async function testSortKeysAreStable() {
  assert.deepEqual([...SORT_KEYS], ['activity', 'stars', 'name', 'size'])

  // every advertised key is usable
  for (const key of SORT_KEYS) {
    assert.equal(sortProjects([project('a')], key).length, 1)
  }
}

await testParseSearchQuery()
await testParseSearchQueryEdgeCases()
await testMatchesQueryFields()
await testMatchesQueryStructuredFilters()
await testSortByActivity()
await testSortByStarsAndSize()
await testSortByName()
await testSortTieBreaksAreDeterministic()
await testDoesNotMutateInput()
await testBrowseProjects()
await testSortKeysAreStable()

console.log('browse tests passed')
