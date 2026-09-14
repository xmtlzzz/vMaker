import assert from 'node:assert/strict'

import {
  buildProjectPayload,
  createFallbackPayload,
  getProjects,
  githubHeaders,
  mapWithConcurrency,
  resetProjectsCache,
} from './projects'

const repo = (
  name: string,
  pushedAt: string,
  extra: Partial<Record<string, unknown>> = {}
) => ({
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
        commits: [
          {
            date: '2026-02-01T00:00:00Z',
            message: 'Ship alpha',
            sha: 'abcdef1',
            url: 'https://example.com/a',
          },
        ],
        languages: { JavaScript: 200 },
      },
      vMaker: {
        commits: [
          {
            date: '2026-01-01T00:00:00Z',
            message: 'Ship vMaker',
            sha: 'abcdef2',
            url: 'https://example.com/v',
          },
        ],
        languages: { TypeScript: 800 },
      },
    }
  )

  assert.deepEqual(
    payload.projects.map((project) => project.name),
    ['vMaker', 'alpha']
  )
  assert.equal(
    payload.projects[0].description,
    '用于集中展示个人项目的现代化作品集网站。'
  )
  assert.equal(payload.summary.totalProjects, 2)
  assert.equal(payload.summary.totalCodeSize, 1000)
  assert.deepEqual(payload.summary.primaryLanguages, [
    'TypeScript',
    'JavaScript',
  ])
}

async function testFeaturedSortsFirst() {
  const payload = buildProjectPayload(
    [
      repo('alpha', '2026-06-01T00:00:00Z'),
      repo('vMaker', '2026-01-01T00:00:00Z'),
    ],
    {
      alpha: { commits: [], languages: { JavaScript: 100 } },
      vMaker: { commits: [], languages: { TypeScript: 300 } },
    }
  )

  // vMaker 在 overrides 中 featured: true，应排在更新时间更晚的 alpha 之前
  assert.deepEqual(
    payload.projects.map((project) => project.name),
    ['vMaker', 'alpha']
  )
}

async function testLanguageSharesAndCodeSize() {
  const payload = buildProjectPayload([repo('alpha', '2026-02-01T00:00:00Z')], {
    alpha: { commits: [], languages: { TypeScript: 300, CSS: 100 } },
  })

  const project = payload.projects[0]
  assert.equal(project.codeSize, 400)
  assert.equal(project.languageShares[0].name, 'TypeScript')
  assert.equal(project.languageShares[0].percent, 75)
  assert.equal(project.languageShares[1].percent, 25)
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

    // GitHub API 强制要求 User-Agent（Workers fetch 不会自动附带）
    assert.match(
      githubHeaders()['User-Agent'] ?? '',
      /^vMaker \(https:\/\/vmaker\.xmtlz\.dev\)$/
    )
  } finally {
    if (originalToken === undefined) {
      delete process.env.GITHUB_TOKEN
    } else {
      process.env.GITHUB_TOKEN = originalToken
    }
  }
}

// ── getProjects 分层缓存（内存 → KV → GitHub，SWR + 写租约）────────────────

const CACHE_KEY = 'github:index:v1'
const FRESH_FOR_MS = 10_000

const GRAPHQL_INDEX_FIXTURE = {
  data: {
    viewer: {
      avatarUrl: 'https://example.com/avatar.png',
      login: 'tester',
      name: 'Tester',
      url: 'https://github.com/tester',
      repositories: {
        totalCount: 1,
        nodes: [
          {
            createdAt: '2026-01-01T00:00:00Z',
            defaultBranchRef: null,
            description: 'fresh from GitHub',
            forkCount: 0,
            homepageUrl: null,
            isArchived: false,
            isFork: false,
            issues: { totalCount: 0 },
            languages: { edges: [{ node: { name: 'TypeScript' }, size: 100 }] },
            name: 'alpha',
            nameWithOwner: 'tester/alpha',
            primaryLanguage: { name: 'TypeScript' },
            pullRequests: { totalCount: 0 },
            pushedAt: '2026-02-01T00:00:00Z',
            releases: { nodes: [], totalCount: 0 },
            repositoryTopics: { nodes: [] },
            stargazerCount: 1,
            updatedAt: '2026-02-01T00:00:00Z',
            url: 'https://github.com/tester/alpha',
          },
        ],
      },
    },
  },
}

function fakeStore(initial = new Map<string, string>()) {
  const calls = { gets: 0, puts: 0 }

  return {
    calls,
    map: initial,
    async get(_key: string, options: { type: 'json' }) {
      calls.gets += 1

      if (options?.type !== 'json') {
        throw new Error('unexpected get type')
      }

      const raw = initial.get(_key)

      return raw === undefined ? null : JSON.parse(raw)
    },
    async put(key: string, value: string) {
      calls.puts += 1
      initial.set(key, value)
    },
  }
}

function waitUntilCollector() {
  const pending: Promise<unknown>[] = []

  return {
    async drained() {
      await Promise.allSettled(pending)
    },
    pending,
    waitUntil(promise: Promise<unknown>) {
      pending.push(promise)
    },
  }
}

function stubGithubFetch(payload: unknown, gate?: Promise<void>) {
  const original = globalThis.fetch
  const calls: string[] = []

  globalThis.fetch = (async () => {
    calls.push('github')

    if (gate) {
      await gate
    }

    return {
      ok: true,
      status: 200,
      json: async () => payload,
    } as Response
  }) as typeof fetch

  return {
    calls,
    restore: () => {
      globalThis.fetch = original
    },
  }
}

function seedStore(
  store: ReturnType<typeof fakeStore>,
  payload: unknown,
  ageMs = 0
) {
  store.map.set(
    CACHE_KEY,
    JSON.stringify({ fetchedAt: Date.now() - ageMs, payload })
  )
}

async function readStoredEntry(store: ReturnType<typeof fakeStore>) {
  return JSON.parse(store.map.get(CACHE_KEY) as string) as {
    fetchedAt: number
    payload: { projects: Array<{ name: string }> }
  }
}

async function testGetProjectsColdFetchWritesKv() {
  resetProjectsCache()
  const store = fakeStore()
  const hooks = waitUntilCollector()
  const stub = stubGithubFetch(GRAPHQL_INDEX_FIXTURE)

  try {
    const payload = await getProjects('test-token', {
      store,
      waitUntil: hooks.waitUntil,
    })

    assert.equal(payload.projects[0]?.name, 'alpha')
    assert.equal(payload.owner.login, 'tester')
    assert.equal(stub.calls.length, 1)
    assert.equal(store.calls.gets, 1)
    assert.equal(store.calls.puts, 1)

    const stored = await readStoredEntry(store)

    assert.equal(stored.payload.projects[0]?.name, 'alpha')
    assert.ok(Math.abs(stored.fetchedAt - Date.now()) < FRESH_FOR_MS)
  } finally {
    stub.restore()
  }
}

async function testGetProjectsFreshKvSkipsGithub() {
  resetProjectsCache()
  const store = fakeStore()
  const hooks = waitUntilCollector()
  const stub = stubGithubFetch(GRAPHQL_INDEX_FIXTURE)

  try {
    const seeded = buildProjectPayload([repo('seeded', '2026-01-01T00:00:00Z')])
    seedStore(store, seeded)

    const payload = await getProjects('test-token', {
      freshForMs: FRESH_FOR_MS,
      store,
      waitUntil: hooks.waitUntil,
    })

    assert.equal(payload.projects[0]?.name, 'seeded')
    assert.equal(stub.calls.length, 0)
    assert.equal(store.calls.puts, 0)
  } finally {
    stub.restore()
  }
}

async function testGetProjectsStaleKvServesStaleThenRefreshes() {
  resetProjectsCache()
  const store = fakeStore()
  const hooks = waitUntilCollector()
  const gate = new Promise<void>((resolve) => setTimeout(resolve, 25))
  const stub = stubGithubFetch(GRAPHQL_INDEX_FIXTURE, gate)

  try {
    const seeded = buildProjectPayload([repo('stale', '2026-01-01T00:00:00Z')])
    seedStore(store, seeded, FRESH_FOR_MS * 6)

    const payload = await getProjects('test-token', {
      freshForMs: FRESH_FOR_MS,
      store,
      waitUntil: hooks.waitUntil,
    })

    // 立即返回旧数据，GitHub 拉取在后台进行
    assert.equal(payload.projects[0]?.name, 'stale')
    assert.equal(stub.calls.length, 1)

    await hooks.drained()

    const stored = await readStoredEntry(store)

    assert.equal(stored.payload.projects[0]?.name, 'alpha')
    assert.equal(store.calls.puts, 1)

    // 刷新完成后内存已是新鲜数据：不再读 KV，也不再打 GitHub
    const again = await getProjects('test-token', {
      freshForMs: FRESH_FOR_MS,
      store,
      waitUntil: hooks.waitUntil,
    })

    assert.equal(again.projects[0]?.name, 'alpha')
    assert.equal(stub.calls.length, 1)
    // gets = 2：首次读 KV + 写 KV 前的租约复查；"again" 命中内存不再读
    assert.equal(store.calls.gets, 2)
  } finally {
    stub.restore()
  }
}

async function testGetProjectsServesMemoryWhileRefreshInFlight() {
  resetProjectsCache()
  const store = fakeStore()
  const hooks = waitUntilCollector()
  const gate = new Promise<void>((resolve) => setTimeout(resolve, 25))
  const stub = stubGithubFetch(GRAPHQL_INDEX_FIXTURE, gate)

  try {
    const seeded = buildProjectPayload([repo('stale', '2026-01-01T00:00:00Z')])
    seedStore(store, seeded, FRESH_FOR_MS * 6)

    const options = {
      freshForMs: FRESH_FOR_MS,
      store,
      waitUntil: hooks.waitUntil,
    }
    const first = await getProjects('test-token', options)

    assert.equal(first.projects[0]?.name, 'stale')

    // 刷新在途时并发请求直接用内存顶住：不读 KV、不打 GitHub
    const second = await getProjects('test-token', options)

    assert.equal(second.projects[0]?.name, 'stale')
    assert.equal(stub.calls.length, 1)
    assert.equal(store.calls.gets, 1)

    await hooks.drained()
  } finally {
    stub.restore()
  }
}

async function testGetProjectsLeaseSkipsWriteWhenOthersRefreshed() {
  resetProjectsCache()
  const store = fakeStore()
  const hooks = waitUntilCollector()
  const gate = new Promise<void>((resolve) => setTimeout(resolve, 25))
  const stub = stubGithubFetch(GRAPHQL_INDEX_FIXTURE, gate)

  try {
    const seeded = buildProjectPayload([repo('stale', '2026-01-01T00:00:00Z')])
    seedStore(store, seeded, FRESH_FOR_MS * 6)

    const payload = await getProjects('test-token', {
      freshForMs: FRESH_FOR_MS,
      store,
      waitUntil: hooks.waitUntil,
    })

    assert.equal(payload.projects[0]?.name, 'stale')

    // 模拟另一个 isolate 在我们拉取期间写入了更新的数据
    const winner = buildProjectPayload([repo('winner', '2026-03-01T00:00:00Z')])
    store.map.set(
      CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now() + 5_000, payload: winner })
    )

    await hooks.drained()

    // 租约检查发现远端更新，本次写入被跳过
    const stored = await readStoredEntry(store)

    assert.equal(stored.payload.projects[0]?.name, 'winner')
    assert.equal(store.calls.puts, 0)
  } finally {
    stub.restore()
  }
}

async function testGetProjectsKvReadFailureStillWorks() {
  resetProjectsCache()
  const hooks = waitUntilCollector()
  const stub = stubGithubFetch(GRAPHQL_INDEX_FIXTURE)
  const failingStore = {
    async get() {
      throw new Error('KV quota exceeded')
    },
    async put() {
      throw new Error('KV quota exceeded')
    },
  }

  try {
    const payload = await getProjects('test-token', {
      store: failingStore,
      waitUntil: hooks.waitUntil,
    })

    // KV 读写全部失败时退化为直连 GitHub，页面照常渲染
    assert.equal(payload.projects[0]?.name, 'alpha')
    assert.equal(stub.calls.length, 1)
  } finally {
    stub.restore()
  }
}

await testBuildProjectPayload()
await testFeaturedSortsFirst()
await testLanguageSharesAndCodeSize()
await testFallbackPayload()
await testMapWithConcurrency()
await testGithubHeadersIgnorePlaceholderToken()
await testGetProjectsColdFetchWritesKv()
await testGetProjectsFreshKvSkipsGithub()
await testGetProjectsStaleKvServesStaleThenRefreshes()
await testGetProjectsServesMemoryWhileRefreshInFlight()
await testGetProjectsLeaseSkipsWriteWhenOthersRefreshed()
await testGetProjectsKvReadFailureStillWorks()
