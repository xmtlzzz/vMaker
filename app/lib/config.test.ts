import assert from 'node:assert/strict'

import { resolveSiteUrl, SITE_URL } from '~/lib/config'
import { ownerLabel } from '~/lib/github/types'

// The site origin must be resolved per request so a preview deploy advertises its own
// host instead of claiming to be production.
function testExplicitConfiguredUrlWins() {
  const request = new Request('https://preview.vmaker.workers.dev/')

  assert.equal(
    resolveSiteUrl({ configured: 'https://vmaker.xmtlz.dev', request }),
    'https://vmaker.xmtlz.dev'
  )
  // trailing slashes are stripped so `${site}/path` never doubles up
  assert.equal(
    resolveSiteUrl({ configured: 'https://example.com/', request }),
    'https://example.com'
  )
}

function testFallsBackToRequestOrigin() {
  const request = new Request(
    'https://abc123.vmaker.workers.dev/projects/x?y=1'
  )

  assert.equal(resolveSiteUrl({ request }), 'https://abc123.vmaker.workers.dev')
  assert.equal(
    resolveSiteUrl({ configured: '   ', request }),
    'https://abc123.vmaker.workers.dev'
  )
}

function testFallsBackToDefaultWithoutARequest() {
  assert.equal(resolveSiteUrl(), SITE_URL)
  assert.equal(resolveSiteUrl({ configured: '' }), SITE_URL)
}

function testOwnerLabelPrefersTheDisplayName() {
  assert.equal(
    ownerLabel({
      avatarUrl: null,
      login: 'xmtlzzz',
      name: 'Xmtlzzz',
      url: 'https://github.com/xmtlzzz',
    }),
    'Xmtlzzz'
  )

  // no display name, or a blank one, falls back to the handle
  const base = {
    avatarUrl: null,
    login: 'xmtlzzz',
    url: 'https://github.com/xmtlzzz',
  }
  assert.equal(ownerLabel({ ...base, name: null }), 'xmtlzzz')
  assert.equal(ownerLabel({ ...base, name: '   ' }), 'xmtlzzz')
}

testExplicitConfiguredUrlWins()
testFallsBackToRequestOrigin()
testFallsBackToDefaultWithoutARequest()
testOwnerLabelPrefersTheDisplayName()

console.log('config tests passed')
