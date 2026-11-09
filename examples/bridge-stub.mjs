#!/usr/bin/env node
// Reference bridge stub: accepts confirmed drafts and records them.
//
// This is deliberately NOT a WeChat client. It proves the gate's outbound
// contract end to end without touching an account: no login, no network, no
// credentials. Replace it with a real bridge that sends through your WeChat
// transport, keeping the same request/response shape.
//
//   node examples/bridge-stub.mjs
//   BRIDGE_PORT=47832 WECHAT_GATE_TOKEN=... node examples/bridge-stub.mjs

import { createServer } from 'node:http'
import { appendFileSync } from 'node:fs'
import { join } from 'node:path'

const PORT = Number(process.env.BRIDGE_PORT || 47832)
const OUT = process.env.BRIDGE_OUT || join(process.cwd(), 'bridge-received.jsonl')
const TOKEN = process.env.WECHAT_GATE_TOKEN || ''
const MAX_BODY = 1024 * 1024

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

const server = createServer(function (req, res) {
  if (req.method !== 'POST' || req.url !== '/wechat/send') {
    sendJson(res, 404, { error: 'not found' })
    return
  }
  if (TOKEN.length > 0 && req.headers.authorization !== 'Bearer ' + TOKEN) {
    sendJson(res, 401, { error: 'bad token' })
    return
  }

  let raw = ''
  req.on('data', function (chunk) {
    raw += chunk
    if (raw.length > MAX_BODY) req.destroy()
  })
  req.on('end', function () {
    let payload
    try {
      payload = JSON.parse(raw)
    } catch (error) {
      sendJson(res, 400, { error: 'invalid json' })
      return
    }
    appendFileSync(OUT, JSON.stringify(payload) + '\n', 'utf8')
    console.log('[bridge-stub] would send to ' + payload.chat.id + ': ' + payload.text)
    sendJson(res, 200, { messageId: 'stub-' + Date.now() })
  })
  req.on('error', function () {
    sendJson(res, 400, { error: 'request error' })
  })
})

server.listen(PORT, '127.0.0.1', function () {
  console.log('[bridge-stub] listening on http://127.0.0.1:' + PORT + '/wechat/send')
  console.log('[bridge-stub] recording payloads to ' + OUT)
  if (TOKEN.length === 0) console.log('[bridge-stub] WECHAT_GATE_TOKEN is empty: no auth required')
})
