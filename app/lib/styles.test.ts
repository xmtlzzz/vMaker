import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const appCss = readFileSync(
  fileURLToPath(new URL('../app.css', import.meta.url)),
  'utf8'
)
const motionCss = readFileSync(
  fileURLToPath(new URL('../styles/motion.css', import.meta.url)),
  'utf8'
)

// Returns the bodies of every `@media (<condition>) { ... }` block, using brace
// counting so nested rules stay intact.
function mediaBlocks(css: string, condition: string): string[] {
  const blocks: string[] = []
  const needle = `@media (${condition})`
  let cursor = 0

  for (;;) {
    const start = css.indexOf(needle, cursor)
    if (start === -1) return blocks

    const open = css.indexOf('{', start)
    if (open === -1) return blocks

    let depth = 0
    for (let i = open; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1
      else if (css[i] === '}') {
        depth -= 1
        if (depth === 0) {
          blocks.push(css.slice(open + 1, i))
          cursor = i + 1
          break
        }
      }
    }
    if (cursor <= start) return blocks
  }
}

const reducedMotionIn = (css: string) =>
  mediaBlocks(css, 'prefers-reduced-motion: reduce')

// `.reveal-block` ships at opacity 0 and is only revealed by the revealUp /
// revealRight animations. app.css disables those animations under reduced
// motion, so visibility must be restored somewhere or the hero stays blank.
async function testReducedMotionDisablesRevealAnimations() {
  const combined = reducedMotionIn(appCss).join('\n')
  assert.ok(
    combined.length > 0,
    'app.css must keep a prefers-reduced-motion block'
  )

  const animationsOff =
    /\.reveal-block\.is-visible\.reveal-up[\s\S]*?animation:\s*none/
  assert.match(combined, animationsOff)
  assert.match(combined, /\.reveal-block\.is-visible\.reveal-right/)
}

async function testReducedMotionRestoresRevealVisibility() {
  const combined = reducedMotionIn(motionCss).join('\n')
  assert.ok(
    combined.length > 0,
    'motion.css must add a prefers-reduced-motion block'
  )

  assert.match(
    combined,
    /\.reveal-block\s*\{[^}]*opacity:\s*1/,
    '.reveal-block must be forced visible under reduced motion'
  )
  assert.match(combined, /transform:\s*none/)
}

async function testSkipLinkIsHiddenUntilFocused() {
  assert.match(
    motionCss,
    /\.skip-link\s*\{[^}]*position:\s*absolute[^}]*\}/,
    '.skip-link must be taken out of flow while hidden'
  )
  assert.match(motionCss, /\.skip-link:focus(-visible)?[^{]*\{[^}]*\}/)
}

async function testFocusVisibleRingUsesAccentToken() {
  const match = motionCss.match(/:focus-visible[^{]*\{([^}]*)\}/)
  assert.ok(match, 'motion.css must define a :focus-visible outline')
  assert.match(match[1], /outline:/)
  assert.match(match[1], /rgb\(var\(--vmaker-accent-rgb\)/)
}

await testReducedMotionDisablesRevealAnimations()
await testReducedMotionRestoresRevealVisibility()
await testSkipLinkIsHiddenUntilFocused()
await testFocusVisibleRingUsesAccentToken()

console.log('styles.test.ts: ok')
