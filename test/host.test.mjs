// Host-half tests: these drive the real apply() against a stub ctx, so the
// three human-facing surfaces (panel route, /send command, staging tool) and
// the expiry path are pinned without a running Harness.

import { strict as assert } from 'node:assert'
import { mkdtempSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import test from 'node:test'
import { apply, name, inject } from '../src/host.js'

function makeHome() {
  return mkdtempSync(join(tmpdir(), 'draft-gate-host-'))
}

function setup(config, options) {
  const settings = options || {}
  const home = settings.home || makeHome()
  const routes = []
  const tools = []
  const commands = []
  const disposers = []

  const webServer = {
    register(route) {
      if (settings.registerThrows === true) throw new Error('webServer.register is unavailable')
      routes.push(route)
      return function () {
        const index = routes.indexOf(route)
        if (index >= 0) routes.splice(index, 1)
      }
    },
  }

  const services = { webServer: webServer }
  if (settings.noTools !== true) {
    services.tools = {
      register(definition) {
        tools.push(definition)
        return function () {
          const index = tools.indexOf(definition)
          if (index >= 0) tools.splice(index, 1)
        }
      },
    }
  }
  if (settings.noCommands !== true) {
    services.commands = {
      register(definition) {
        commands.push(definition)
        return function () {
          const index = commands.indexOf(definition)
          if (index >= 0) commands.splice(index, 1)
        }
      },
    }
  }

  const ctx = {
    webServer: webServer,
    get(serviceName) { return services[serviceName] },
    effect(fn) {
      const dispose = fn()
      disposers.push(typeof dispose === 'function' ? dispose : function () {})
      return dispose
    },
    on() { return function () {} },
  }

  const plugin = apply(ctx, Object.assign({ dshHome: home }, config || {}))

  async function callRoute(method, path, body) {
    const route = routes[0]
    assert.ok(route, 'the panel route is registered')
    let status = 0
    let payload
    const res = {
      setHeader() {},
      end(text) {
        status = this.statusCode
        payload = text ? JSON.parse(text) : undefined
      },
    }
    const chunks = body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]
    const req = Readable.from(chunks)
    req.method = method
    req.url = path
    await route.handler(req, res)
    return { status: status, body: payload }
  }

  return {
    home: home,
    routes: routes,
    tools: tools,
    commands: commands,
    plugin: plugin,
    dispose() {
      const pending = disposers.splice(0)
      for (const dispose of pending) dispose()
    },
    callRoute: callRoute,
    command(commandName) {
      const found = commands.find(function (definition) { return definition.name === commandName })
      assert.ok(found, 'command /' + commandName + ' is registered')
      return found
    },
    tool() {
      assert.equal(tools.length, 1, 'the staging tool is registered')
      return tools[0]
    },
  }
}

test('the plugin exports the expected host identity', () => {
  assert.equal(name, 'dsh-wechat-draft-gate')
  assert.deepEqual(inject, ['webServer'])
})

test('apply registers one route, one tool and two commands', () => {
  const h = setup()
  assert.equal(h.routes.length, 1)
  assert.equal(h.routes[0].kind, 'prefix')
  assert.equal(h.routes[0].path, '/dsh-wechat-draft-gate')
  assert.equal(h.tools.length, 1)
  assert.equal(h.tools[0].name, 'wechat_stage_draft')
  assert.deepEqual(h.commands.map(function (c) { return c.name }).sort(), ['drafts', 'send'])
})

test('staging over HTTP creates a pending draft and the state route lists it', async () => {
  const h = setup()
  const staged = await h.callRoute('POST', '/dsh-wechat-draft-gate/stage', {
    chatId: 'wxid_alice',
    chatName: 'Alice',
    text: '明天下午三点见。',
    quotedText: '明天见？',
    quotedSender: 'Alice',
    quotedKind: 'voice',
    voiceSource: 'local-whisper',
    voiceConfidence: 0.86,
  })
  assert.equal(staged.status, 201)
  assert.equal(staged.body.ok, true)
  assert.equal(staged.body.draft.status, 'pending')

  const state = await h.callRoute('GET', '/dsh-wechat-draft-gate/state')
  assert.equal(state.status, 200)
  assert.equal(state.body.pending.length, 1)
  assert.equal(state.body.pending[0].id, staged.body.draft.id)
  assert.equal(state.body.pending[0].voice.sourceLabel, '本地 Whisper')
  assert.equal(state.body.config.transport.kind, 'dry-run')
  assert.equal(state.body.stats.pending, 1)
})

test('HTTP confirm releases the draft through the bridge', async () => {
  let captured = null
  const server = createServer(function (req, res) {
    let body = ''
    req.on('data', function (chunk) { body += chunk })
    req.on('end', function () {
      captured = JSON.parse(body)
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ messageId: 'wx-77' }))
    })
  })
  await new Promise(function (resolve) { server.listen(0, '127.0.0.1', resolve) })
  const url = 'http://127.0.0.1:' + server.address().port + '/send'
  const h = setup({ transportUrl: url })
  try {
    const staged = await h.callRoute('POST', '/dsh-wechat-draft-gate/stage', {
      chatId: 'wxid_alice',
      text: '原文',
      quotedText: '明天见？',
    })
    const id = staged.body.draft.id
    const confirmed = await h.callRoute('POST', '/dsh-wechat-draft-gate/confirm', {
      id: id,
      text: '改过之后的内容',
      by: 'panel',
    })
    assert.equal(confirmed.status, 200)
    assert.equal(confirmed.body.draft.status, 'sent')
    assert.equal(confirmed.body.draft.receipt.messageId, 'wx-77')
    assert.equal(captured.text, '改过之后的内容')
    assert.equal(captured.draftId, id)

    const again = await h.callRoute('POST', '/dsh-wechat-draft-gate/confirm', { id: id })
    assert.equal(again.status, 409)
    assert.equal(again.body.code, 'not-pending')
  } finally {
    server.close()
  }
})

test('HTTP edit saves the new text without sending anything', async () => {
  const h = setup()
  const staged = await h.callRoute('POST', '/dsh-wechat-draft-gate/stage', {
    chatId: 'wxid_a', text: '旧内容',
  })
  const id = staged.body.draft.id
  const edited = await h.callRoute('POST', '/dsh-wechat-draft-gate/edit', { id: id, text: '新内容' })
  assert.equal(edited.status, 200)
  assert.equal(edited.body.draft.text, '新内容')
  assert.equal(edited.body.draft.originalText, '旧内容')
  assert.equal(edited.body.draft.status, 'pending')
})

test('discarding over HTTP records the reason', async () => {
  const h = setup()
  const staged = await h.callRoute('POST', '/dsh-wechat-draft-gate/stage', {
    chatId: 'wxid_a', text: '算了',
  })
  const out = await h.callRoute('POST', '/dsh-wechat-draft-gate/discard', {
    id: staged.body.draft.id,
    reason: '语气不合适',
  })
  assert.equal(out.status, 200)
  assert.equal(out.body.draft.status, 'voided')
  assert.equal(out.body.draft.voidReason.detail, '语气不合适')
})

test('a bridge failure surfaces as 502 and leaves the draft pending', async () => {
  const server = createServer(function (req, res) {
    res.statusCode = 500
    res.end('upstream exploded')
  })
  await new Promise(function (resolve) { server.listen(0, '127.0.0.1', resolve) })
  const h = setup({ transportUrl: 'http://127.0.0.1:' + server.address().port + '/send' })
  try {
    const staged = await h.callRoute('POST', '/dsh-wechat-draft-gate/stage', {
      chatId: 'wxid_a', text: 'hi',
    })
    const out = await h.callRoute('POST', '/dsh-wechat-draft-gate/confirm', { id: staged.body.draft.id })
    assert.equal(out.status, 502)
    assert.equal(out.body.code, 'transport-failed')
    assert.equal(out.body.draft.status, 'pending')
    const state = await h.callRoute('GET', '/dsh-wechat-draft-gate/state')
    assert.equal(state.body.stats.failedAttempts, 1)
  } finally {
    server.close()
  }
})

test('the /send command confirms a draft by id', async () => {
  const h = setup()
  const staged = await h.callRoute('POST', '/dsh-wechat-draft-gate/stage', {
    chatId: 'wxid_alice', chatName: 'Alice', text: '收到。',
  })
  const outcome = await h.command('send').handler({ rawInput: ' ' + staged.body.draft.id })
  assert.equal(outcome.kind, 'success')
  assert.match(outcome.text, /已发送/)
  assert.match(outcome.text, /Alice/)
  const state = await h.callRoute('GET', '/dsh-wechat-draft-gate/state')
  assert.equal(state.body.stats.sent, 1)
})

test('the /send command explains missing and unknown ids', async () => {
  const h = setup()
  const missing = await h.command('send').handler({ rawInput: '   ' })
  assert.equal(missing.kind, 'error')
  const unknown = await h.command('send').handler({ rawInput: 'wg_nope' })
  assert.equal(unknown.kind, 'error')
  assert.match(unknown.text, /找不到草稿/)
})

test('the /drafts command lists pending drafts without sending', async () => {
  const h = setup()
  const empty = await h.command('drafts').handler({})
  assert.match(empty.text, /没有待确认/)

  await h.callRoute('POST', '/dsh-wechat-draft-gate/stage', {
    chatId: 'wxid_alice', chatName: 'Alice', text: '你好',
  })
  const listed = await h.command('drafts').handler({})
  assert.equal(listed.kind, 'success')
  assert.match(listed.text, /Alice/)
  assert.match(listed.text, /剩/)
  const state = await h.callRoute('GET', '/dsh-wechat-draft-gate/state')
  assert.equal(state.body.stats.sent, 0)
})

test('the staging tool creates a draft and says it was not sent', async () => {
  const h = setup()
  const tool = h.tool()
  const value = await tool.execute({
    chatId: 'wxid_bob',
    chatName: 'Bob',
    text: '晚点回你。',
    quotedText: '在吗？',
    voiceSource: 'cloud-asr',
    voiceConfidence: 0.4,
  }, {})
  assert.match(value.id, /^wg_/)
  assert.equal(value.status, 'pending')
  assert.equal(value.note, 'staged only; a human must confirm')
  assert.ok(value.expiresAt > 0)

  const rendered = tool.output.render({}, value)
  assert.equal(rendered[0].type, 'text')
  assert.match(rendered[0].text, /未发送/)

  const state = await h.callRoute('GET', '/dsh-wechat-draft-gate/state')
  assert.equal(state.body.stats.pending, 1)
  assert.equal(state.body.pending[0].voice.lowConfidence, true)
})

test('the staging tool rejects an empty reply', async () => {
  const h = setup()
  await assert.rejects(function () {
    return h.tool().execute({ chatId: 'wxid_bob', text: '  ' }, {})
  }, /草稿正文不能为空/)
})

test('an unconfirmed draft expires and cannot be confirmed afterwards', async () => {
  const h = setup({ draftTtlMs: 40, sweepIntervalMs: 60000 })
  const staged = await h.callRoute('POST', '/dsh-wechat-draft-gate/stage', {
    chatId: 'wxid_a', text: '会过期',
  })
  await new Promise(function (resolve) { setTimeout(resolve, 80) })
  const state = await h.callRoute('GET', '/dsh-wechat-draft-gate/state')
  assert.equal(state.body.pending.length, 0)
  assert.equal(state.body.history.length, 1)
  assert.equal(state.body.history[0].status, 'expired')
  assert.match(state.body.history[0].voidReason.detail, /自动作废/)

  const confirm = await h.callRoute('POST', '/dsh-wechat-draft-gate/confirm', {
    id: staged.body.draft.id,
  })
  assert.equal(confirm.status, 409)
  assert.equal(confirm.body.code, 'expired')
})

test('the panel route rejects malformed JSON and unknown methods', async () => {
  const h = setup()
  const bad = await h.callRoute('POST', '/dsh-wechat-draft-gate/stage', '{ nope')
  assert.equal(bad.status, 400)
  assert.equal(bad.body.code, 'invalid')

  const unknown = await h.callRoute('POST', '/dsh-wechat-draft-gate/nope', {})
  assert.equal(unknown.status, 404)

  const wrongVerb = await h.callRoute('PUT', '/dsh-wechat-draft-gate/state')
  assert.equal(wrongVerb.status, 405)
})

test('confirming an unknown id is a 404', async () => {
  const h = setup()
  const out = await h.callRoute('POST', '/dsh-wechat-draft-gate/confirm', { id: 'wg_missing' })
  assert.equal(out.status, 404)
  assert.equal(out.body.code, 'not-found')
})

test('the state route tolerates a query string', async () => {
  const h = setup()
  const out = await h.callRoute('GET', '/dsh-wechat-draft-gate/state?x=1')
  assert.equal(out.status, 200)
  assert.equal(out.body.ok, undefined)
  assert.equal(typeof out.body.stats.pending, 'number')
})

test('unloading removes the route, tool and commands', () => {
  const h = setup()
  assert.equal(h.routes.length, 1)
  assert.equal(h.tools.length, 1)
  assert.equal(h.commands.length, 2)
  h.dispose()
  assert.equal(h.routes.length, 0)
  assert.equal(h.tools.length, 0)
  assert.equal(h.commands.length, 0)
})

test('a webServer that cannot register does not take the gate down', async () => {
  const h = setup({}, { registerThrows: true })
  assert.equal(h.routes.length, 0)
  assert.equal(h.tools.length, 1)
  assert.equal(h.commands.length, 2)
  const staged = await h.tool().execute({ chatId: 'wxid_a', text: '仍然可用' }, {})
  assert.equal(staged.status, 'pending')
})

test('a profile without tools or commands still serves the panel route', () => {
  const h = setup({}, { noTools: true, noCommands: true })
  assert.equal(h.routes.length, 1)
  assert.equal(h.tools.length, 0)
  assert.equal(h.commands.length, 0)
})
