// Draft-gate core tests: the state machine, expiry, provenance annotations,
// persistence, and the audit ledger, all without a running Harness.

import { strict as assert } from 'node:assert'
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createGate, voiceSourceLabel } from '../src/gate.js'

function makeDir() {
  return mkdtempSync(join(tmpdir(), 'draft-gate-test-'))
}

function stubTransport(result) {
  const sent = []
  return {
    kind: 'stub',
    configured: true,
    endpoint: 'stub://local',
    sent: sent,
    async send(draft) {
      sent.push(JSON.parse(JSON.stringify(draft)))
      if (typeof result === 'function') return result(draft)
      return result || { ok: true, receipt: { transport: 'stub', messageId: 'm-1' } }
    },
  }
}

function setup(options = {}) {
  let t = options.start || 1_700_000_000_000
  const transport = options.transport || stubTransport()
  const gate = createGate({
    stateDir: options.stateDir || makeDir(),
    ttlMs: options.ttlMs || 60_000,
    confidenceThreshold: 0.75,
    transport: transport,
    now: function () { return t },
    historyLimit: options.historyLimit,
    maxDrafts: options.maxDrafts,
  })
  return {
    gate: gate,
    transport: transport,
    advance(ms) { t = t + ms },
  }
}

function stageInput(extra) {
  return Object.assign({
    chatId: 'wxid_alice',
    chatName: 'Alice',
    text: '明天下午三点见。',
    quotedText: '我们明天见吧？',
    quotedSender: 'Alice',
    quotedKind: 'text',
    quotedAt: 1_699_999_000_000,
  }, extra)
}

test('staging creates a pending draft that is not sent', async () => {
  const h = setup()
  const out = h.gate.stage(stageInput())
  assert.equal(out.ok, true)
  assert.equal(out.draft.status, 'pending')
  assert.equal(out.draft.text, '明天下午三点见。')
  assert.equal(out.draft.chat.id, 'wxid_alice')
  assert.equal(out.draft.quoted.text, '我们明天见吧？')
  assert.equal(out.draft.expiresAt, out.draft.createdAt + 60_000)
  assert.equal(h.transport.sent.length, 0, 'staging never calls the transport')
})

test('a staged reply keeps the quoted original and its kind', () => {
  const h = setup()
  const out = h.gate.stage(stageInput({ quotedKind: 'voice' }))
  assert.equal(out.ok, true)
  assert.deepEqual(out.draft.quoted, {
    text: '我们明天见吧？',
    sender: 'Alice',
    at: 1_699_999_000_000,
    kind: 'voice',
    messageId: '',
  })
})

test('missing chat id or empty text is rejected', () => {
  const h = setup()
  assert.equal(h.gate.stage({ text: 'hi' }).code, 'invalid')
  assert.equal(h.gate.stage({ chatId: 'wxid_a', text: '   ' }).code, 'invalid')
  assert.equal(h.gate.state().stats.total, 0)
})

test('voice provenance is annotated, not invented', () => {
  const h = setup()
  const out = h.gate.stage(stageInput({
    quotedKind: 'voice',
    voiceSource: 'local-whisper',
    voiceModel: 'small',
    voiceConfidence: 0.86,
    voiceTranscript: '我们明天见吧？',
  }))
  assert.equal(out.ok, true)
  assert.equal(out.draft.voice.sourceLabel, '本地 Whisper')
  assert.equal(out.draft.voice.confidence, 0.86)
  assert.equal(out.draft.voice.lowConfidence, false)
  assert.equal(out.draft.voice.model, 'small')
})

test('confidence percentages are normalised and low confidence is flagged', () => {
  const h = setup()
  const out = h.gate.stage(stageInput({
    voiceSource: 'cloud-asr',
    voiceConfidence: 61,
  }))
  assert.equal(out.draft.voice.confidence, 0.61)
  assert.equal(out.draft.voice.lowConfidence, true)
  assert.equal(out.draft.voice.threshold, 0.75)
})

test('a missing confidence stays null instead of guessing', () => {
  const h = setup()
  const out = h.gate.stage(stageInput({ voiceSource: 'manual', voiceTranscript: '手打' }))
  assert.equal(out.draft.voice.confidence, null)
  assert.equal(out.draft.voice.lowConfidence, false)
  assert.equal(out.draft.voice.note, '')
})

test('unrecognised voice sources keep their raw label', () => {
  assert.equal(voiceSourceLabel('some-local-engine'), 'some-local-engine')
  assert.equal(voiceSourceLabel(''), '未知来源')
})

test('editing changes the outgoing text but preserves the staged original', () => {
  const h = setup()
  const draft = h.gate.stage(stageInput()).draft
  const edited = h.gate.edit(draft.id, '明天下午四点见。', 'panel')
  assert.equal(edited.ok, true)
  assert.equal(edited.draft.text, '明天下午四点见。')
  assert.equal(edited.draft.originalText, '明天下午三点见。')
  assert.equal(edited.draft.editCount, 1)
  assert.equal(h.gate.get(draft.id).lastEditedAt, 1_700_000_000_000)
})

test('an edit to empty text is rejected', () => {
  const h = setup()
  const draft = h.gate.stage(stageInput()).draft
  const edited = h.gate.edit(draft.id, '   ')
  assert.equal(edited.ok, false)
  assert.equal(edited.code, 'invalid')
  assert.equal(h.gate.get(draft.id).text, '明天下午三点见。')
})

test('confirming sends the edited text and marks the draft sent', async () => {
  const transport = stubTransport()
  const h = setup({ transport: transport })
  const draft = h.gate.stage(stageInput()).draft
  const out = await h.gate.confirm(draft.id, { by: 'panel', text: '改成明天四点。' })
  assert.equal(out.ok, true)
  assert.equal(out.draft.status, 'sent')
  assert.equal(out.draft.decidedBy, 'panel')
  assert.equal(transport.sent.length, 1)
  assert.equal(transport.sent[0].text, '改成明天四点。', 'the transport sees the edited text')
  assert.equal(transport.sent[0].originalText, '明天下午三点见。', 'the staged original is still attached')
})

test('the command surface is recorded distinctly', async () => {
  const h = setup()
  const draft = h.gate.stage(stageInput()).draft
  const out = await h.gate.confirm(draft.id, { by: 'command' })
  assert.equal(out.ok, true)
  assert.equal(out.draft.decidedBy, 'command')
})

test('a transport failure keeps the draft pending and records the attempt', async () => {
  let fail = true
  const transport = stubTransport(function () {
    return fail ? { ok: false, error: 'bridge HTTP 503' } : { ok: true, receipt: { transport: 'stub' } }
  })
  const h = setup({ transport: transport })
  const draft = h.gate.stage(stageInput()).draft

  const first = await h.gate.confirm(draft.id)
  assert.equal(first.ok, false)
  assert.equal(first.code, 'transport-failed')
  assert.equal(h.gate.get(draft.id).status, 'pending')
  assert.equal(h.gate.get(draft.id).attempts.length, 1)
  assert.equal(h.gate.get(draft.id).attempts[0].ok, false)

  fail = false
  const second = await h.gate.confirm(draft.id)
  assert.equal(second.ok, true)
  assert.equal(second.draft.status, 'sent')
  assert.equal(second.draft.attempts.length, 2)
})

test('a sent draft cannot be sent twice', async () => {
  const h = setup()
  const draft = h.gate.stage(stageInput()).draft
  await h.gate.confirm(draft.id)
  const again = await h.gate.confirm(draft.id)
  assert.equal(again.ok, false)
  assert.equal(again.code, 'not-pending')
  assert.equal(h.transport.sent.length, 1)
})

test('a draft expires on time and records why', () => {
  const h = setup({ ttlMs: 30_000 })
  const draft = h.gate.stage(stageInput()).draft
  h.advance(29_999)
  assert.equal(h.gate.get(draft.id).status, 'pending')
  h.advance(1)
  assert.equal(h.gate.sweep(), 1)
  const expired = h.gate.get(draft.id)
  assert.equal(expired.status, 'expired')
  assert.equal(expired.voidReason.code, 'expired')
  assert.match(expired.voidReason.detail, /30 秒/)
  assert.match(expired.voidReason.detail, /自动作废/)
})

test('an expired draft cannot be edited or sent', async () => {
  const h = setup({ ttlMs: 1_000 })
  const draft = h.gate.stage(stageInput()).draft
  h.advance(2_000)
  assert.equal(h.gate.edit(draft.id, 'too late').code, 'not-pending')
  const out = await h.gate.confirm(draft.id)
  assert.equal(out.ok, false)
  assert.equal(out.code, 'expired')
  assert.equal(h.transport.sent.length, 0)
})

test('discarding voids a draft with a reason', async () => {
  const h = setup()
  const draft = h.gate.stage(stageInput()).draft
  const out = h.gate.discard(draft.id, { reason: '语气不对，重写' })
  assert.equal(out.ok, true)
  assert.equal(out.draft.status, 'voided')
  assert.equal(out.draft.voidReason.detail, '语气不对，重写')
  const confirm = await h.gate.confirm(draft.id)
  assert.equal(confirm.code, 'not-pending')
  assert.equal(h.transport.sent.length, 0)
})

test('state separates pending drafts from terminal history', async () => {
  const h = setup()
  const a = h.gate.stage(stageInput({ text: '第一条' })).draft
  const b = h.gate.stage(stageInput({ text: '第二条' })).draft
  await h.gate.confirm(a.id)
  h.gate.discard(b.id)
  const view = h.gate.state()
  assert.equal(view.pending.length, 0)
  assert.equal(view.history.length, 2)
  assert.deepEqual(view.stats, {
    pending: 0,
    sent: 1,
    voided: 1,
    expired: 0,
    other: 0,
    failedAttempts: 0,
    total: 2,
  })
})

test('the audit ledger records stage, send, discard and expiry', async () => {
  const dir = makeDir()
  const h = setup({ stateDir: dir, ttlMs: 1_000 })
  const sent = h.gate.stage(stageInput({ text: '要发的' })).draft
  const expired = h.gate.stage(stageInput({ text: '会过期的' })).draft
  const voided = h.gate.stage(stageInput({ text: '要作废的' })).draft
  await h.gate.confirm(sent.id)
  h.gate.discard(voided.id, { reason: '不发了' })
  h.advance(2_000)
  h.gate.sweep()

  const lines = readFileSync(join(dir, 'ledger.jsonl'), 'utf8').trim().split('\n').map(JSON.parse)
  const actions = lines.map((line) => line.action)
  assert.ok(actions.includes('staged'))
  assert.ok(actions.includes('sent'))
  assert.ok(actions.includes('voided'))
  assert.ok(actions.includes('expired'))
  const expiredLine = lines.find((line) => line.action === 'expired' && line.id === expired.id)
  assert.equal(expiredLine.status, 'expired')
  assert.equal(expiredLine.expiresAt, expired.expiresAt)
})

test('drafts persist across a reload and pending drafts stay confirmable', async () => {
  const dir = makeDir()
  const first = setup({ stateDir: dir })
  const draft = first.gate.stage(stageInput()).draft

  const second = createGate({
    stateDir: dir,
    ttlMs: 60_000,
    transport: stubTransport(),
    now: () => 1_700_000_000_000,
  })
  const loaded = second.get(draft.id)
  assert.ok(loaded, 'the draft was reloaded from disk')
  assert.equal(loaded.text, '明天下午三点见。')
  assert.equal(second.state().stats.pending, 1)
})

test('a reload expires drafts whose deadline passed while the host was down', () => {
  const dir = makeDir()
  const first = setup({ stateDir: dir, ttlMs: 1_000 })
  const draft = first.gate.stage(stageInput()).draft

  const later = createGate({
    stateDir: dir,
    ttlMs: 1_000,
    transport: stubTransport(),
    now: () => 1_700_000_010_000,
  })
  assert.equal(later.get(draft.id).status, 'expired')
  assert.match(later.get(draft.id).voidReason.detail, /自动作废/)
})

test('a corrupt draft box is moved aside and the gate starts empty', () => {
  const dir = makeDir()
  writeFileSync(join(dir, 'drafts.json'), '{ not json', 'utf8')
  const gate = createGate({ stateDir: dir, transport: stubTransport() })
  assert.equal(gate.state().stats.total, 0)
  assert.equal(gate.get('anything'), undefined)
  const corrupt = readdirSync(dir).find(function (file) { return file.startsWith('drafts.json.corrupt-') })
  assert.ok(corrupt, 'the unreadable draft box was moved aside')
})

test('terminal drafts are pruned once the box exceeds its cap', async () => {
  const h = setup({ maxDrafts: 2 })
  const a = h.gate.stage(stageInput({ text: 'a' })).draft
  const b = h.gate.stage(stageInput({ text: 'b' })).draft
  const c = h.gate.stage(stageInput({ text: 'c' })).draft
  await h.gate.confirm(a.id)
  await h.gate.confirm(b.id)
  h.gate.stage(stageInput({ text: 'd' }))
  assert.equal(h.gate.stats().total, 2)
  assert.equal(h.gate.get(c.id).status, 'pending', 'pending drafts are never pruned')
})

test('every draft id is unique', () => {
  const h = setup()
  const ids = new Set()
  for (let i = 0; i < 50; i += 1) {
    const out = h.gate.stage(stageInput({ text: 'n' + i }))
    assert.equal(out.ok, true)
    ids.add(out.draft.id)
  }
  assert.equal(ids.size, 50)
})

test('state exposes transport mode without leaking a token', () => {
  const h = setup()
  const view = h.gate.state()
  assert.equal(view.config.transport.kind, 'stub')
  assert.equal(view.config.transport.configured, true)
  assert.equal(JSON.stringify(view).includes('token'), false)
})

test('the ledger directory is created on demand', () => {
  const dir = join(makeDir(), 'nested')
  const gate = createGate({ stateDir: dir, transport: stubTransport() })
  assert.equal(gate.stage(stageInput()).ok, true)
  assert.equal(existsSync(join(dir, 'ledger.jsonl')), true)
  assert.equal(existsSync(join(dir, 'drafts.json')), true)
})
