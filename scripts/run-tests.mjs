// Discovers every *.test.ts under app/ and runs it through vite-node, so adding a
// test file never requires editing this script or package.json again.
import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const testDir = path.join(root, 'app')

function discover(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...discover(full))
    else if (entry.name.endsWith('.test.ts')) found.push(full)
  }
  return found
}

const files = discover(testDir).sort()
if (files.length === 0) {
  console.error('No *.test.ts files found under app/')
  process.exit(1)
}

function run(file) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [path.join(root, 'node_modules', 'vite-node', 'vite-node.mjs'), file],
      { cwd: root, stdio: 'inherit' }
    )
    child.on('close', (code) => resolve(code ?? 1))
  })
}

let failed = 0
for (const file of files) {
  const relative = path.relative(root, file)
  console.log(`\n> ${relative}`)
  const code = await run(relative)
  if (code !== 0) failed += 1
}

const summary = `${files.length - failed}/${files.length} test files passed`
if (failed > 0) {
  console.error(`\nFAIL: ${summary}`)
  process.exit(1)
}
console.log(`\nOK: ${summary}`)
