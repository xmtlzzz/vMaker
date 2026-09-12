import assert from 'node:assert/strict'

import { projectOverrides } from '~/data/project-overrides'
import { fetchRepoIndexFromRest } from '~/lib/github/projects'
import type { GitHubRepo } from '~/lib/github/types'

// The live API is rate limited for unauthenticated callers, so exercise the REST
// reader against a stub: it still proves the endpoints it asks for, that forks and
// hidden repositories skip the detail fetches, and how failures degrade.
type Route = (url: string) => Response | undefined

function repoFixture(name: string, overrides: Partial<GitHubRepo> = {}) {
  return {
    archived: false,
    created_at: '2024-01-01T00:00:00Z',
    description: `${name} description`,
    fork: false,
    forks_count: 2,
    full_name: `xmtlzzz/${name}`,
    homepage: null,
    html_url: `https://github.com/xmtlzzz/${name}`,
    language: 'TypeScript',
    name,
    pushed_at: '2026-03-01T00:00:00Z',
    stargazers_count: 5,
    topics: ['demo'],
    updated_at: '2026-03-02T00:00:00Z',
    ...overrides,
  } satisfies GitHubRepo
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status,
  })
}

const originalFetch = globalThis.fetch
const originalOverrides = { ...projectOverrides }

function installFetch(route: Route) {
  const calls: string[] = []

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : String(input)
    calls.push(url)

    return route(url) ?? new Response('not found', { status: 404 })
  }) as typeof fetch

  return calls
}

function restoreFetch() {
  globalThis.fetch = originalFetch
}

function restoreOverrides() {
  for (const key of Object.keys(projectOverrides)) {
    delete projectOverrides[key]
  }
  Object.assign(projectOverrides, originalOverrides)
}

async function testReadsEveryEndpoint() {
  // the shipped overrides have no hidden entry, so add one for the duration
  projectOverrides.secret = { hidden: true }

  const calls = installFetch((url) => {
    if (url.includes('/repos?sort=pushed&per_page=100')) {
      // vMaker is visible, forked is a fork, secret is hidden via the overrides
      return json([
        repoFixture('vMaker'),
        repoFixture('forked', { fork: true }),
        repoFixture('secret'),
      ])
    }

    if (url.endsWith('/vMaker/languages')) {
      return json({ TypeScript: 3000, CSS: 1000 })
    }

    if (url.includes('/vMaker/commits?per_page=5')) {
      return json([
        {
          commit: {
            author: { date: '2026-03-01T00:00:00Z', name: 'xmtlzzz' },
            message: 'Add the feed\n\nwith a body',
          },
          html_url: 'https://github.com/xmtlzzz/vMaker/commit/abcdef1234567890',
          sha: 'abcdef1234567890',
        },
      ])
    }

    if (url.includes('/vMaker/releases?per_page=5')) {
      return json([
        {
          html_url: 'https://github.com/xmtlzzz/vMaker/releases/tag/v1.0.0',
          name: 'v1.0.0',
          published_at: '2026-02-01T00:00:00Z',
          tag_name: 'v1.0.0',
        },
      ])
    }

    return undefined
  })

  try {
    const index = await fetchRepoIndexFromRest()

    assert.deepEqual(
      calls.filter((url) => url.includes('/repos?')),
      ['https://api.github.com/users/xmtlzzz/repos?sort=pushed&per_page=100']
    )

    // forks and hidden repositories never get a detail request
    const detailCalls = calls.filter(
      (url) =>
        url.includes('/languages') ||
        url.includes('/commits') ||
        url.includes('/releases')
    )
    assert.equal(detailCalls.length, 3)
    assert.ok(
      detailCalls.every((url) => url.includes('/vMaker/')),
      `unexpected detail calls: ${detailCalls.join(', ')}`
    )

    // the payload builder filters for itself, so every repo is handed over
    assert.deepEqual(
      index.repos.map((repo) => repo.name),
      ['vMaker', 'forked', 'secret']
    )

    assert.deepEqual(index.details.vMaker?.languages, {
      CSS: 1000,
      TypeScript: 3000,
    })
    // only the first line of the message survives, and the sha is shortened
    assert.deepEqual(index.details.vMaker?.commits, [
      {
        author: 'xmtlzzz',
        date: '2026-03-01T00:00:00Z',
        message: 'Add the feed',
        sha: 'abcdef1',
        url: 'https://github.com/xmtlzzz/vMaker/commit/abcdef1234567890',
      },
    ])
    assert.equal(index.details.forked, undefined)
    assert.equal(index.details.secret, undefined)
    assert.equal(index.truncatedFrom, undefined)
  } finally {
    restoreFetch()
    restoreOverrides()
  }
}

async function testDetailFailuresDegrade() {
  installFetch((url) => {
    if (url.includes('/repos?sort=pushed')) return json([repoFixture('vMaker')])
    // both detail endpoints fail, e.g. a secondary rate limit
    if (url.includes('/languages')) return json({ message: 'nope' }, 500)
    if (url.includes('/commits')) return json({ message: 'nope' }, 500)

    return undefined
  })

  try {
    const index = await fetchRepoIndexFromRest()

    assert.deepEqual(index.details.vMaker?.languages, {})
    assert.deepEqual(index.details.vMaker?.commits, [])
    // a failing detail request must not lose the repository itself
    assert.equal(index.repos.length, 1)
  } finally {
    restoreFetch()
  }
}

async function testRepoListFailureThrows() {
  installFetch(() => json({ message: 'API rate limit exceeded' }, 403))

  try {
    await assert.rejects(
      () => fetchRepoIndexFromRest(),
      /403[\s\S]*rate limit exceeded/
    )
  } finally {
    restoreFetch()
  }
}

async function testTokenIsForwarded() {
  const calls: string[] = []
  const headers: Array<Record<string, string>> = []

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(typeof input === 'string' ? input : String(input))
    headers.push((init?.headers ?? {}) as Record<string, string>)

    return json([])
  }) as typeof fetch

  try {
    await fetchRepoIndexFromRest('test-token')

    assert.equal(calls.length, 1)
    assert.equal(headers[0]?.Authorization, 'Bearer test-token')

    // the placeholder documented in the README must never be sent as a token
    await fetchRepoIndexFromRest('your_github_token')
    assert.equal(headers[1]?.Authorization, undefined)
  } finally {
    restoreFetch()
  }
}

await testReadsEveryEndpoint()
await testDetailFailuresDegrade()
await testRepoListFailureThrows()
await testTokenIsForwarded()
