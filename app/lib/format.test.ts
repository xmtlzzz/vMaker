import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { copy, formatCopy } from '~/data/copy'
import { formatBytes, formatDate, NO_RECORD } from '~/lib/format'

// The en/zh dictionaries must stay key-for-key identical: a key added to only one
// locale is a missing translation, not a fallback.
function testCopyParity() {
  const enKeys = Object.keys(copy.en).sort()
  const zhKeys = Object.keys(copy.zh).sort()

  assert.deepEqual(zhKeys, enKeys, 'zh must define exactly the en key set')

  for (const key of enKeys) {
    const value = copy.en[key as keyof typeof copy.en]
    assert.equal(typeof value, 'string')
    assert.notEqual(value.trim(), '', 'en.' + key + ' must not be blank')

    const zhValue = copy.zh[key as keyof typeof copy.zh]
    assert.equal(typeof zhValue, 'string')
    assert.notEqual(zhValue.trim(), '', 'zh.' + key + ' must not be blank')
  }
}

// Guards the bug that let `t.releases` / `t.issues` / `t.pullRequests` render as
// `undefined`: every `t.<key>` used anywhere under app/ must exist in the dictionary.
function testEveryUsedKeyExists() {
  const root = fileURLToPath(new URL('..', import.meta.url))

  function walk(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(full)
      return /\.tsx?$/.test(entry.name) ? [full] : []
    })
  }

  const used = new Set<string>()
  for (const file of walk(root)) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/\bt\.([a-zA-Z][a-zA-Z0-9]*)\b/g)) {
      used.add(match[1])
    }
  }

  const known = new Set(Object.keys(copy.en))
  const missing = [...used].filter((key) => !known.has(key)).sort()

  assert.deepEqual(missing, [], 'missing copy keys: ' + missing.join(', '))
}

function testFormatBytes() {
  assert.equal(formatBytes(0), '0 B')
  assert.equal(formatBytes(512), '512 B')
  assert.equal(formatBytes(1024), '1 KB')
  assert.equal(formatBytes(1024 * 1024), '1 MB')
}

function testFormatDateIsLocaleAware() {
  const value = '2026-03-01T00:00:00Z'

  const en = formatDate(value, 'en')
  const zh = formatDate(value, 'zh')

  assert.match(en, /2026/)
  assert.match(zh, /2026/)
  assert.notEqual(en, zh, 'the two locales must not render identically')
}

function testFormatDateHandlesMissingValues() {
  assert.equal(formatDate(null, 'en'), NO_RECORD.en)
  assert.equal(formatDate('', 'zh'), NO_RECORD.zh)
  assert.equal(formatDate('not-a-date', 'en'), NO_RECORD.en)
}

function testFormatCopyFillsPlaceholders() {
  assert.equal(formatCopy('Hello {owner}', { owner: 'Ada' }), 'Hello Ada')
  assert.equal(
    formatCopy('{owner} and {owner}', { owner: 'Ada' }),
    'Ada and Ada'
  )
  // an unknown placeholder is left intact rather than silently blanked
  assert.equal(formatCopy('{missing}', {}), '{missing}')
  // text without placeholders is returned untouched
  assert.equal(formatCopy('plain text', { owner: 'Ada' }), 'plain text')
}

// The account is a runtime value now, so no dictionary string may embed the handle.
// A leftover literal would render one account's name on another account's deploy.
function testCopyHasNoHardcodedHandle() {
  for (const locale of ['en', 'zh'] as const) {
    for (const value of Object.values(copy[locale])) {
      assert.ok(
        !value.includes('xmtlzzz'),
        `copy.${locale} must not hardcode an account: ${value}`
      )
    }
  }

  // the strings that name the account must carry the placeholder instead
  for (const key of ['dataLeft', 'heroDescription', 'subtitle'] as const) {
    assert.match(copy.en[key], /\{owner\}/)
    assert.match(copy.zh[key], /\{owner\}/)
  }
}

testCopyParity()
testEveryUsedKeyExists()
testFormatBytes()
testFormatDateIsLocaleAware()
testFormatDateHandlesMissingValues()
testFormatCopyFillsPlaceholders()
testCopyHasNoHardcodedHandle()

console.log('format tests passed')
