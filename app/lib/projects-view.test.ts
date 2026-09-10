import assert from 'node:assert/strict'

import type { Project } from '~/lib/github/projects'
import { getRelatedProjects } from '~/lib/projects-view'

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

const names = (list: Project[]) => list.map((item) => item.name)

async function testSelfIsNeverRelated() {
  const target = project('vMaker', { topics: ['portfolio'] })
  const related = getRelatedProjects(
    [target, project('other', { topics: ['portfolio'] })],
    target
  )

  assert.deepEqual(names(related), ['other'])
}

async function testNothingInCommonIsDropped() {
  const target = project('vMaker', {
    languages: { TypeScript: 100 },
    primaryLanguage: 'TypeScript',
    topics: ['portfolio'],
  })
  const stranger = project('unrelated', {
    languages: { Rust: 100 },
    primaryLanguage: 'Rust',
    topics: ['cli'],
  })

  assert.deepEqual(getRelatedProjects([target, stranger], target), [])
}

async function testSharedTopicsOutweighLanguage() {
  const target = project('vMaker', {
    languages: { TypeScript: 100 },
    primaryLanguage: 'TypeScript',
    topics: ['portfolio', 'react-router'],
  })

  // two shared topics = 4 points
  const topicTwin = project('topic-twin', {
    languages: { Rust: 100 },
    primaryLanguage: 'Rust',
    topics: ['portfolio', 'react-router'],
  })
  // same primary language only = 1 point
  const languageTwin = project('language-twin', {
    languages: { TypeScript: 100 },
    primaryLanguage: 'TypeScript',
    topics: ['cli'],
  })

  assert.deepEqual(
    names(getRelatedProjects([topicTwin, languageTwin, target], target)),
    ['topic-twin', 'language-twin']
  )
}

async function testSharedSecondaryLanguageCounts() {
  const target = project('vMaker', {
    languages: { TypeScript: 100, CSS: 40 },
    primaryLanguage: 'TypeScript',
    topics: [],
  })

  // shares CSS, which is not the target's primary language
  const cssTwin = project('css-twin', {
    languages: { Rust: 100, CSS: 40 },
    primaryLanguage: 'Rust',
    topics: [],
  })

  const unrelated = project('unrelated', {
    languages: { Go: 100 },
    primaryLanguage: 'Go',
    topics: [],
  })

  assert.deepEqual(
    names(getRelatedProjects([cssTwin, unrelated, target], target)),
    ['css-twin']
  )
}

async function testTopicMatchingIgnoresCaseAndSpace() {
  const target = project('vMaker', { topics: ['Portfolio'] })
  const twin = project('twin', { topics: ['  portfolio '] })

  assert.deepEqual(names(getRelatedProjects([twin, target], target)), ['twin'])
}

async function testLimitAndTieBreak() {
  const target = project('vMaker', { topics: ['portfolio'] })

  const tied = [
    project('charlie', { stars: 1, topics: ['portfolio'] }),
    project('alpha', { stars: 9, topics: ['portfolio'] }),
    project('bravo', { stars: 9, topics: ['portfolio'] }),
    project('delta', { stars: 2, topics: ['portfolio'] }),
  ]

  // equal score -> more stars first, then name
  assert.deepEqual(names(getRelatedProjects([...tied, target], target, 4)), [
    'alpha',
    'bravo',
    'delta',
    'charlie',
  ])

  // default limit is 3
  assert.equal(getRelatedProjects([...tied, target], target).length, 3)
}

async function testInputOrderIsStable() {
  const target = project('vMaker', { topics: ['portfolio'] })
  const pool = [
    project('b', { topics: ['portfolio'] }),
    project('a', { topics: ['portfolio'] }),
  ]

  const forward = names(getRelatedProjects([...pool, target], target))
  const reversed = names(
    getRelatedProjects([...pool.reverse(), target], target)
  )

  assert.deepEqual(forward, ['a', 'b'])
  assert.deepEqual(reversed, forward, 'result must not depend on input order')
}

await testSelfIsNeverRelated()
await testNothingInCommonIsDropped()
await testSharedTopicsOutweighLanguage()
await testSharedSecondaryLanguageCounts()
await testTopicMatchingIgnoresCaseAndSpace()
await testLimitAndTieBreak()
await testInputOrderIsStable()
