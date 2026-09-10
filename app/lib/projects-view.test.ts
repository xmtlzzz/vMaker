import assert from 'node:assert/strict'

import type { Project } from '~/lib/github/projects'
import {
  ALL_LANGUAGES,
  filterProjects,
  isProjectSortKey,
  sortProjectsForView,
} from '~/lib/projects-view'

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
    name,
    primaryLanguage: 'TypeScript',
    pushedAt: '2026-01-01T00:00:00Z',
    stars: 0,
    topics: [],
    updatedAt: '2026-01-01T00:00:00Z',
    url: `https://github.com/xmtlzzz/${name}`,
    ...overrides,
  }
}

const noFilter = {
  demoOnly: false,
  featuredOnly: false,
  language: ALL_LANGUAGES,
  query: '',
}

async function testFilterProjects() {
  const projects = [
    project('alpha', { primaryLanguage: 'Rust', topics: ['cli'] }),
    project('beta', {
      featured: true,
      homepage: 'https://example.com/beta',
      primaryLanguage: 'TypeScript',
    }),
    project('gamma', {
      description: 'a searchable thing',
      primaryLanguage: 'TypeScript',
    }),
  ]

  const names = (list: Project[]) => list.map((item) => item.name)

  assert.equal(filterProjects(projects, noFilter).length, 3)

  // query matches name, description and topics, case-insensitively
  assert.deepEqual(
    names(filterProjects(projects, { ...noFilter, query: 'ALPHA' })),
    ['alpha']
  )
  assert.deepEqual(
    names(filterProjects(projects, { ...noFilter, query: 'searchable' })),
    ['gamma']
  )
  assert.deepEqual(
    names(filterProjects(projects, { ...noFilter, query: 'cli' })),
    ['alpha']
  )

  assert.deepEqual(
    names(filterProjects(projects, { ...noFilter, language: 'TypeScript' })),
    ['beta', 'gamma']
  )
  assert.deepEqual(
    names(filterProjects(projects, { ...noFilter, featuredOnly: true })),
    ['beta']
  )
  assert.deepEqual(
    names(filterProjects(projects, { ...noFilter, demoOnly: true })),
    ['beta']
  )
  // a project with no primary language groups as Other
  assert.deepEqual(
    names(filterProjects(projects, { ...noFilter, language: 'Other' })),
    []
  )
}

async function testSortProjectsForView() {
  const projects = [
    project('alpha', {
      codeSize: 300,
      displayName: 'Alpha',
      pushedAt: '2026-01-01T00:00:00Z',
      stars: 3,
    }),
    project('beta', {
      codeSize: 100,
      displayName: 'Beta',
      pushedAt: '2026-03-01T00:00:00Z',
      stars: 10,
    }),
  ]

  const names = (list: Project[]) => list.map((item) => item.name)

  assert.deepEqual(names(sortProjectsForView(projects, 'stars')), [
    'beta',
    'alpha',
  ])
  assert.deepEqual(names(sortProjectsForView(projects, 'size')), [
    'alpha',
    'beta',
  ])
  assert.deepEqual(names(sortProjectsForView(projects, 'name')), [
    'alpha',
    'beta',
  ])
  assert.deepEqual(names(sortProjectsForView(projects, 'activity')), [
    'beta',
    'alpha',
  ])

  // sorting must not mutate the array handed in by the loader
  assert.deepEqual(names(projects), ['alpha', 'beta'])
}

async function testSortKeyGuard() {
  assert.equal(isProjectSortKey('stars'), true)
  assert.equal(isProjectSortKey('activity'), true)
  assert.equal(isProjectSortKey('nope'), false)
  assert.equal(isProjectSortKey(null), false)
}

await testFilterProjects()
await testSortProjectsForView()
await testSortKeyGuard()
