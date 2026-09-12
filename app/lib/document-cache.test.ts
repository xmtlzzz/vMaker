import assert from 'node:assert/strict'

import {
  DOCUMENT_CACHE_CONTROL,
  documentEtag,
  documentHeaders,
  forwardDocumentHeaders,
  indexSignature,
  notModifiedResponse,
  projectSignature,
} from '~/lib/document-cache'
import type { Project, ProjectPayload } from '~/lib/github/projects'

function project(name: string, overrides: Partial<Project> = {}): Project {
  return {
    archived: false,
    codeSize: 100,
    commits: [],
    createdAt: '2026-01-01T00:00:00Z',
    description: name + ' description',
    displayName: name,
    featured: false,
    forks: 0,
    fullName: 'xmtlzzz/' + name,
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
    url: 'https://github.com/xmtlzzz/' + name,
    ...overrides,
  }
}

function payload(
  projects: Project[],
  overrides: Partial<ProjectPayload> = {}
): ProjectPayload {
  return {
    owner: {
      avatarUrl: null,
      login: 'xmtlzzz',
      name: null,
      url: 'https://github.com/xmtlzzz',
    },
    projects,
    summary: {
      latestActivity: projects[0]?.pushedAt ?? null,
      primaryLanguages: ['TypeScript'],
      totalCodeSize: projects.reduce((sum, item) => sum + item.codeSize, 0),
      totalProjects: projects.length,
    },
    ...overrides,
  }
}

function testEtagIsStableForIdenticalInput() {
  assert.equal(documentEtag('same'), documentEtag('same'))
  assert.notEqual(documentEtag('same'), documentEtag('different'))
}

function testEtagIsAQuotedHeaderValue() {
  const etag = documentEtag('x')
  assert.match(etag, /^"[0-9a-f]+"$/)
}

// The whole point of the tag: any change that could alter the rendered page must
// change the signature, otherwise a conditional request would 304 a stale body.
function testSignatureChangesWhenProjectsChange() {
  const base = payload([project('alpha'), project('beta')])
  const before = indexSignature(base)

  assert.equal(
    indexSignature(payload([project('alpha'), project('beta')])),
    before,
    'identical data must match'
  )

  assert.notEqual(
    indexSignature(
      payload([project('alpha'), project('beta'), project('gamma')])
    ),
    before,
    'added project'
  )
  assert.notEqual(
    indexSignature(payload([project('alpha')])),
    before,
    'removed project'
  )
  assert.notEqual(
    indexSignature(
      payload([
        project('alpha'),
        project('beta', { pushedAt: '2026-05-05T00:00:00Z' }),
      ])
    ),
    before,
    'changed timestamp'
  )
  assert.notEqual(
    indexSignature(payload([project('alpha'), project('beta', { stars: 9 })])),
    before,
    'changed stars'
  )
  assert.notEqual(
    indexSignature(
      payload([project('alpha'), project('beta', { featured: true })])
    ),
    before,
    'changed featured flag'
  )
}

function testSignatureReflectsErrorState() {
  const base = indexSignature(payload([project('alpha')]))
  const errored = indexSignature(
    payload([project('alpha')], { error: 'rate limited' })
  )

  // A degraded payload renders different copy, so it must not collide with the
  // healthy one.
  assert.notEqual(errored, base)
}

function testProjectSignatureChangesWithDescription() {
  const base = projectSignature(project('alpha'))
  assert.equal(projectSignature(project('alpha')), base)

  assert.notEqual(
    projectSignature(project('alpha', { description: 'rewritten' })),
    base
  )
}

// The owner is rendered in the header and hero copy, so switching the GitHub token
// to another account must not leave a cached page claiming the old name.
function testIndexSignatureReflectsTheOwner() {
  const base = indexSignature(payload([project('alpha')]))
  const other = indexSignature(
    payload([project('alpha')], {
      owner: {
        avatarUrl: null,
        login: 'someone-else',
        name: null,
        url: 'https://github.com/someone-else',
      },
    })
  )

  assert.notEqual(other, base)
}

function testNotModifiedResponseHasNoBody() {
  const response = notModifiedResponse('"abc"')

  assert.equal(response.status, 304)
  assert.equal(response.headers.get('ETag'), '"abc"')
  assert.equal(response.headers.get('Cache-Control'), DOCUMENT_CACHE_CONTROL)
  assert.equal(response.body, null)
}

// Regression: the index route has no error boundary, so its 304 bubbles to the root
// boundary. The root must forward the thrown response's ETag, otherwise the 304
// arrives without the validator the client needs to keep revalidating against.
function testForwardDocumentHeadersPrefersErrorResponse() {
  const thrown = notModifiedResponse('"abc"')
  const forwarded = forwardDocumentHeaders({
    errorHeaders: thrown.headers,
    loaderHeaders: new Headers(),
  })

  assert.equal(forwarded.get('ETag'), '"abc"')
  assert.equal(forwarded.get('Cache-Control'), DOCUMENT_CACHE_CONTROL)
}

function testForwardDocumentHeadersFallsBackToLoaderHeaders() {
  const forwarded = forwardDocumentHeaders({
    loaderHeaders: new Headers(documentHeaders('"def"')),
  })

  assert.equal(forwarded.get('ETag'), '"def"')
  assert.equal(forwarded.get('Cache-Control'), DOCUMENT_CACHE_CONTROL)
}

function testForwardDocumentHeadersDoesNotMutateItsInput() {
  const loaderHeaders = new Headers()
  forwardDocumentHeaders({ loaderHeaders })
  assert.equal(loaderHeaders.get('ETag'), null)
}

function testDocumentHeadersAreRevalidating() {
  const headers = documentHeaders('"abc"')

  assert.equal(headers.ETag, '"abc"')
  assert.match(headers['Cache-Control'], /must-revalidate/)
  assert.match(headers['Cache-Control'], /max-age=0/)
}

testEtagIsStableForIdenticalInput()
testEtagIsAQuotedHeaderValue()
testSignatureChangesWhenProjectsChange()
testSignatureReflectsErrorState()
testProjectSignatureChangesWithDescription()
testIndexSignatureReflectsTheOwner()
testNotModifiedResponseHasNoBody()
testForwardDocumentHeadersPrefersErrorResponse()
testForwardDocumentHeadersFallsBackToLoaderHeaders()
testForwardDocumentHeadersDoesNotMutateItsInput()
testDocumentHeadersAreRevalidating()

console.log('document-cache tests passed')
