// Transport tests: the gate's only exit. These pin the dry-run default, the
// exact wire payload, authentication, failure reporting, and timeout handling.

import { strict as assert } from 'node:assert'
import { createServer } from 'node:http'
import test from 'node:test'
import { createTransport } from '../src/transport.js'

function draft(extra) {
  return Object.assign({
    id: 'wg_test_1',
    chat: { id: 'wxid_alice', name: 'Alice' },
    text: '明天下午三点见。',
    quoted: { text: '明天见？', sender: 'Alice', at: 1, kind: 'text', messageId: '' },
    voice: null,
    origin: 'bridge',
    createdAt: 1_700_000_000_000,
    expiresAt: 1_700_000_600_000,
  }, extra)
}

function listen(handler) {
  return new Promise(function (resolve) {
    const server = createServer(handler)
    server.listen(0, '127.0.0.1', function () {
      const address = server.address()
      resolve({ server: server, url: 'http://127.0.0.1:' + address.port })
    })
  })
}

test('no bridge URL means dry-run and no network call', async () => {
  const transport = createTransport({})
  assert.equal(transport.kind, 'dry-run')
  assert.equal(transport.configured, false)
  const out = await transport.send(draft())
  assert.equal(out.ok, true)
  assert.equal(out.receipt.transport, 'dry-run')
  assert.match(out.receipt.messageId, /^dry-wg_test_1$/)
})

test('a configured bridge receives the exact draft and an idempotency key', async () => {
  let captured = null
  const server = await listen(function (req, res) {
    let body = ''
    req.on('data', function (chunk) { body += chunk })
    req.on('end', function () {
      captured = { method: req.method, headers: req.headers, body: JSON.parse(body) }
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ messageId: 'wx-42' }))
    })
  })
  try {
    const transport = createTransport({ url: server.url + '/send', token: 'secret-token' })
    const out = await transport.send(draft())
    assert.equal(out.ok, true)
    assert.equal(out.receipt.transport, 'http')
    assert.equal(out.receipt.messageId, 'wx-42')
    assert.equal(captured.method, 'POST')
    assert.equal(captured.headers.authorization, 'Bearer secret-token')
    assert.equal(captured.headers['idempotency-key'], 'draft:wg_test_1')
    assert.equal(captured.body.kind, 'wechat.outbound')
    assert.equal(captured.body.draftId, 'wg_test_1')
    assert.equal(captured.body.text, '明天下午三点见。')
    assert.equal(captured.body.chat.id, 'wxid_alice')
    assert.equal(captured.body.quoted.text, '明天见？')
  } finally {
    server.server.close()
  }
})

test('a token can come from an environment variable', async () => {
  let authorization = null
  const server = await listen(function (req, res) {
    authorization = req.headers.authorization
    res.end('{}')
  })
  process.env.DSH_DRAFT_GATE_TEST_TOKEN = 'env-token'
  try {
    const transport = createTransport({ url: server.url + '/send', tokenEnv: 'DSH_DRAFT_GATE_TEST_TOKEN' })
    const out = await transport.send(draft())
    assert.equal(out.ok, true)
    assert.equal(authorization, 'Bearer env-token')
  } finally {
    delete process.env.DSH_DRAFT_GATE_TEST_TOKEN
    server.server.close()
  }
})

test('a non-2xx bridge answer fails and reports the status', async () => {
  const server = await listen(function (req, res) {
    res.statusCode = 503
    res.end('bridge is down')
  })
  try {
    const transport = createTransport({ url: server.url + '/send' })
    const out = await transport.send(draft())
    assert.equal(out.ok, false)
    assert.match(out.error, /bridge HTTP 503/)
    assert.match(out.error, /bridge is down/)
  } finally {
    server.server.close()
  }
})

test('a 2xx body without JSON still counts as delivered', async () => {
  const server = await listen(function (req, res) {
    res.end('ok')
  })
  try {
    const transport = createTransport({ url: server.url + '/send' })
    const out = await transport.send(draft())
    assert.equal(out.ok, true)
    assert.equal(out.receipt.messageId, null)
  } finally {
    server.server.close()
  }
})

test('a bridge that never answers is reported as a timeout', async () => {
  const server = await listen(function () {
    // Deliberately never responds.
  })
  try {
    const transport = createTransport({ url: server.url + '/send', timeoutMs: 50 })
    const out = await transport.send(draft())
    assert.equal(out.ok, false)
    assert.match(out.error, /timeout after 50ms/)
  } finally {
    server.server.closeAllConnections()
    await new Promise(function (resolve) { server.server.close(resolve) })
  }
})

test('the advertised endpoint hides query credentials', () => {
  const transport = createTransport({ url: 'http://127.0.0.1:1234/send?token=super-secret' })
  assert.equal(transport.endpoint, 'http://127.0.0.1:1234/send')
  assert.equal(JSON.stringify(transport).includes('super-secret'), false)
})
