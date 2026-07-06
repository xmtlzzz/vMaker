import assert from 'node:assert/strict'

import {
  buildProjectPayload,
  createFallbackPayload,
  githubHeaders,
  mapWithConcurrency,
} from './projects'

const repo = (name: string, pushedAt: string, extra: Partial<Record<string, unknown>> = {}) => ({
  archived: false,
  created_at: '2026-01-01T00:00:00Z',
  description: `${name} repository`,
  fork: false,
  forks_count: 0,
  full_name: `xmtlzzz/${name}`,
  homepage: null,
  html_url: `https://github.com/xmtlzzz/${name}`,
  language: 'TypeScript',
  name,
  pushed_at: pushedAt,
  stargazers_count: 0,
  topics: ['demo'],
  updated_at: pushedAt,
  ...extra,
})

async function testBuildProjectPayload() {
  const payload = buildProjectPayload(
    [
      repo('alpha', '2026-02-01T00:00:00Z'),
      repo('vMaker', '2026-01-01T00:00:00Z'),
      repo('forked', '2026-03-01T00:00:00Z', { fork: true }),
    ],
    {
      alpha: {
        commits: [{ date: '2026-02-01T00:00:00Z', message: 'Ship alpha', sha: 'abcdef1', url: 'https://example.com/a' }],
        languages: { JavaScript: 200 },
      },
      vMaker: {
        commits: [{ date: '2026-01-01T00:00:00Z', message: 'Ship vMaker', sha: 'abcdef2', url: 'https://example.com/v' }],
        languages: { TypeScript: 800 },
      },
    },
  )

  assert.deepEqual(payload.projects.map((project) => project.name), ['vMaker', 'alpha'])
  assert.equal(payload.projects[0].description, '用于集中展示个人项目的现代化作品集网站。')
  assert.equal(payload.summary.totalProjects, 2)
  assert.equal(payload.summary.totalCodeSize, 1000)
  assert.deepEqual(payload.summary.primaryLanguages, ['TypeScript', 'JavaScript'])
}

async function testFallbackPayload() {
  const payload = createFallbackPayload('GitHub unavailable')

  assert.equal(payload.error, 'GitHub unavailable')
  assert.ok(payload.projects.length > 0)
  assert.equal(payload.projects[0].name, 'vMaker')
  assert.equal(payload.summary.totalProjects, payload.projects.length)
  assert.equal(payload.summary.latestActivity, null)
}

async function testMapWithConcurrency() {
  let active = 0
  let maxActive = 0

  const result = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
    active += 1
    maxActive = Math.max(maxActive, active)
    await new Promise((resolve) => setTimeout(resolve, 5))
    active -= 1
    return value * 2
  })

  assert.deepEqual(result, [2, 4, 6, 8, 10])
  assert.equal(maxActive, 2)
}

async function testGithubHeadersIgnorePlaceholderToken() {
  const originalToken = process.env.GITHUB_TOKEN

  try {
    process.env.GITHUB_TOKEN = 'your_github_token'
    assert.equal(githubHeaders().Authorization, undefined)

    process.env.GITHUB_TOKEN = '  real-token  '
    assert.equal(githubHeaders().Authorization, 'Bearer real-token')
  } finally {
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN
    } else {
      process.env.GITHUB_TOKEN = originalToken
    }
  }
}

await testBuildProjectPayload()
await testFallbackPayload()
await testMapWithConcurrency()
await testGithubHeadersIgnorePlaceholderToken()
