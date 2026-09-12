import assert from 'node:assert/strict'

import {
  REPO_INDEX_LIMITS,
  REPO_INDEX_QUERY,
  mapGraphqlRepoIndex,
  mapGraphqlRepository,
} from '~/lib/github/graphql'
import type { GraphqlRepositoryNode } from '~/lib/github/graphql'

const fullNode: GraphqlRepositoryNode = {
  createdAt: '2024-01-01T00:00:00Z',
  defaultBranchRef: {
    target: {
      history: {
        nodes: [
          {
            abbreviatedOid: 'abc1234',
            author: { name: 'xmtlzzz' },
            committedDate: '2026-03-01T00:00:00Z',
            messageHeadline: 'Add the feed',
            url: 'https://github.com/xmtlzzz/vMaker/commit/abc1234',
          },
          null,
        ],
      },
    },
  },
  description: 'A portfolio index',
  forkCount: 4,
  homepageUrl: 'https://vmaker.xmtlz.dev',
  isArchived: false,
  isFork: false,
  languages: {
    edges: [
      { node: { name: 'TypeScript' }, size: 3000 },
      { node: { name: 'CSS' }, size: 1000 },
      { node: null, size: 999 },
      null,
    ],
  },
  name: 'vMaker',
  nameWithOwner: 'xmtlzzz/vMaker',
  primaryLanguage: { name: 'TypeScript' },
  pushedAt: '2026-03-01T00:00:00Z',
  repositoryTopics: {
    nodes: [{ topic: { name: 'portfolio' } }, { topic: null }, null],
  },
  stargazerCount: 12,
  updatedAt: '2026-03-02T00:00:00Z',
  url: 'https://github.com/xmtlzzz/vMaker',
}

// What a repository with no description, no commits and no languages looks like.
const bareNode: GraphqlRepositoryNode = { name: 'empty' }

async function testMapFullRepository() {
  const { details, repo } = mapGraphqlRepository(fullNode)

  assert.equal(repo.name, 'vMaker')
  assert.equal(repo.full_name, 'xmtlzzz/vMaker')
  assert.equal(repo.description, 'A portfolio index')
  assert.equal(repo.html_url, 'https://github.com/xmtlzzz/vMaker')
  assert.equal(repo.homepage, 'https://vmaker.xmtlz.dev')
  assert.equal(repo.language, 'TypeScript')
  assert.equal(repo.stargazers_count, 12)
  assert.equal(repo.forks_count, 4)
  assert.equal(repo.archived, false)
  assert.equal(repo.fork, false)
  assert.equal(repo.pushed_at, '2026-03-01T00:00:00Z')
  assert.equal(repo.updated_at, '2026-03-02T00:00:00Z')
  assert.equal(repo.created_at, '2024-01-01T00:00:00Z')
  assert.deepEqual(repo.topics, ['portfolio'])

  // null entries in the connection are dropped, sizes are summed per language
  assert.deepEqual(details.languages, { TypeScript: 3000, CSS: 1000 })

  assert.equal(details.commits.length, 1)
  assert.deepEqual(details.commits[0], {
    author: 'xmtlzzz',
    date: '2026-03-01T00:00:00Z',
    message: 'Add the feed',
    sha: 'abc1234',
    url: 'https://github.com/xmtlzzz/vMaker/commit/abc1234',
  })
}

async function testMapBareRepository() {
  const { details, repo } = mapGraphqlRepository(bareNode)

  assert.equal(repo.archived, false)
  assert.equal(repo.created_at, '')
  assert.equal(repo.description, null)
  assert.equal(repo.fork, false)
  assert.equal(repo.forks_count, 0)
  assert.equal(repo.full_name, 'xmtlzzz/empty')
  assert.equal(repo.homepage, null)
  assert.equal(repo.html_url, '')
  assert.equal(repo.language, null)
  assert.equal(repo.pushed_at, null)
  assert.equal(repo.stargazers_count, 0)
  assert.deepEqual(repo.topics, [])
  assert.equal(repo.updated_at, '')

  assert.deepEqual(details.languages, {})
  assert.deepEqual(details.commits, [])
}

async function testCommitFallbacks() {
  const { details } = mapGraphqlRepository({
    defaultBranchRef: {
      target: {
        history: {
          nodes: [
            {
              abbreviatedOid: null,
              committedDate: null,
              messageHeadline: null,
              url: null,
            },
          ],
        },
      },
    },
    name: 'partial',
  })

  assert.deepEqual(details.commits, [
    { date: '', message: 'Update project', sha: '', url: '' },
  ])
}

async function testMapIndex() {
  const index = mapGraphqlRepoIndex({
    viewer: {
      avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
      login: 'xmtlzzz',
      name: 'Xmtlzzz',
      repositories: { nodes: [fullNode, null, bareNode], totalCount: 5 },
      url: 'https://github.com/xmtlzzz',
    },
  })

  assert.deepEqual(
    index.repos.map((repo) => repo.name),
    ['vMaker', 'empty']
  )
  assert.equal(index.details.vMaker?.commits?.length, 1)
  assert.deepEqual(index.details.empty?.languages, {})
  // totalCount exceeds what was read, so the caller can warn about pagination
  assert.equal(index.truncatedFrom, 5)
  // the account comes from the token's own viewer, not a constant
  assert.deepEqual(index.owner, {
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
    login: 'xmtlzzz',
    name: 'Xmtlzzz',
    url: 'https://github.com/xmtlzzz',
  })

  const complete = mapGraphqlRepoIndex({
    viewer: { repositories: { nodes: [bareNode], totalCount: 1 } },
  })
  assert.equal(complete.truncatedFrom, undefined)
  // a viewer with no login cannot label the site, so the caller falls back
  assert.equal(complete.owner, undefined)

  const empty = mapGraphqlRepoIndex({})
  assert.deepEqual(empty.repos, [])
  assert.equal(empty.truncatedFrom, undefined)
}

// The query runs against GitHub only at runtime, and GraphQL rejects a declared
// variable that the query never uses — so keep the two in sync with a test.
async function testQueryAndVariablesStayInSync() {
  const declared = [...REPO_INDEX_QUERY.matchAll(/\$(\w+)\s*:/g)].map(
    (match) => match[1]
  )
  const unique = [...new Set(declared)].sort()

  assert.deepEqual(unique, [
    'commits',
    'languages',
    'releases',
    'repos',
    'topics',
  ])
  assert.deepEqual(
    Object.keys(REPO_INDEX_LIMITS).sort(),
    unique,
    'the variables we send must match the ones the query declares'
  )

  for (const name of unique) {
    const uses = REPO_INDEX_QUERY.split(`$${name}`).length - 1
    assert.ok(uses >= 2, `$${name} is declared but never used in the query`)
  }
}

await testMapFullRepository()
await testMapBareRepository()
await testCommitFallbacks()
await testMapIndex()
await testQueryAndVariablesStayInSync()
