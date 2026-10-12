import assert from 'node:assert/strict'
import { healthResponse } from './health'

const get = healthResponse(new Request('https://vmaker.example/api/health'))
assert.equal(get.status, 200)
assert.deepEqual(await get.json(), {
  status: 'UP',
  service: 'vmaker',
  check: 'liveness',
})
assert.equal(get.headers.get('Cache-Control'), 'no-store')
assert.match(get.headers.get('Content-Type')!, /application\/json/)
assert.equal(get.headers.get('X-Content-Type-Options'), 'nosniff')

const head = healthResponse(
  new Request('https://vmaker.example/api/health', { method: 'HEAD' })
)
assert.equal(head.status, 200)
assert.equal(head.body, null)
assert.equal(head.headers.get('Cache-Control'), 'no-store')

const post = healthResponse(
  new Request('https://vmaker.example/api/health', { method: 'POST' })
)
assert.equal(post.status, 405)
assert.equal(post.headers.get('Allow'), 'GET, HEAD')
console.log('health tests passed')
