// Draft gate core: the two-stage approval state machine behind every WeChat
// reply. Nothing here talks to WeChat; it only decides whether a staged reply
// is still editable, has expired, or may be released to the transport.
//
// The store is a plain JSON file written atomically (temp file + rename), so a
// crash never leaves a half-written draft box. The JSONL ledger is append-only
// and records why a draft left the pending state, including the exact expiry
// reason.

import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

export const VERSION = 1
export const DEFAULT_TTL_MS = 30 * 60 * 1000
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.75
export const DEFAULT_HISTORY_LIMIT = 200
export const DEFAULT_MAX_DRAFTS = 500

const MAX_TEXT = 8000
const MAX_QUOTE = 4000
const MAX_TRANSCRIPT = 4000

const VOICE_LABELS = {
  'local-whisper': '本地 Whisper',
  'mlx-whisper': '本地 MLX Whisper',
  'faster-whisper': '本地 faster-whisper',
  'whisper-cpp': '本地 whisper.cpp',
  'cloud-asr': '云端 ASR',
  'manual': '人工录入',
  'unknown': '未知来源',
}

const QUOTE_KINDS = new Set(['text', 'voice', 'image', 'file', 'unknown'])

function clip(value, max) {
  if (typeof value !== 'string') return ''
  const text = value.trim()
  return text.length > max ? text.slice(0, max) : text
}

function positive(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

function ok(draft) {
  return { ok: true, draft: draft }
}

function fail(code, error, draft) {
  const out = { ok: false, code: code, error: error }
  if (draft !== undefined) out.draft = draft
  return out
}

export function voiceSourceLabel(source) {
  if (typeof source !== 'string' || source.length === 0) return VOICE_LABELS.unknown
  return VOICE_LABELS[source] || source
}

function normalizeQuoted(input) {
  const text = clip(input.quotedText, MAX_QUOTE)
  if (text.length === 0) return null
  const kind = QUOTE_KINDS.has(input.quotedKind) ? input.quotedKind : 'unknown'
  const at = typeof input.quotedAt === 'number' && Number.isFinite(input.quotedAt) ? input.quotedAt : null
  return {
    text: text,
    sender: clip(input.quotedSender, 120),
    at: at,
    kind: kind,
    messageId: clip(input.quotedMessageId, 200),
  }
}

// The bridge is the only place that can actually observe ASR confidence, so the
// gate only normalises and annotates what it is handed. It never invents a
// number: a missing confidence stays null and the panel says so.
function normalizeVoice(input, threshold) {
  const wantsVoice =
    input.voiceSource !== undefined ||
    input.voiceModel !== undefined ||
    input.voiceConfidence !== undefined ||
    input.voiceTranscript !== undefined
  if (!wantsVoice) return null

  let confidence = null
  if (typeof input.voiceConfidence === 'number' && Number.isFinite(input.voiceConfidence)) {
    const raw = input.voiceConfidence > 1 && input.voiceConfidence <= 100
      ? input.voiceConfidence / 100
      : input.voiceConfidence
    if (raw >= 0 && raw <= 1) confidence = Math.round(raw * 100) / 100
  }

  const source = clip(input.voiceSource, 60) || 'unknown'
  return {
    source: source,
    sourceLabel: voiceSourceLabel(source),
    model: clip(input.voiceModel, 80),
    confidence: confidence,
    threshold: threshold,
    lowConfidence: confidence !== null && confidence < threshold,
    transcript: clip(input.voiceTranscript, MAX_TRANSCRIPT),
    note: clip(input.voiceNote, 200),
  }
}

function ttlLabel(ttlMs) {
  if (ttlMs < 60 * 1000) {
    const seconds = Math.max(1, Math.round(ttlMs / 1000))
    return seconds + ' 秒'
  }
  const minutes = Math.round(ttlMs / 60000)
  return minutes + ' 分钟'
}

export function createGate(options = {}) {
  const stateDir = typeof options.stateDir === 'string' && options.stateDir.length > 0
    ? options.stateDir
    : process.cwd()
  const ttlMs = positive(options.ttlMs, DEFAULT_TTL_MS)
  const threshold = typeof options.confidenceThreshold === 'number' &&
    Number.isFinite(options.confidenceThreshold) &&
    options.confidenceThreshold >= 0 &&
    options.confidenceThreshold <= 1
    ? options.confidenceThreshold
    : DEFAULT_CONFIDENCE_THRESHOLD
  const historyLimit = positive(options.historyLimit, DEFAULT_HISTORY_LIMIT)
  const maxDrafts = positive(options.maxDrafts, DEFAULT_MAX_DRAFTS)
  const now = typeof options.now === 'function' ? options.now : Date.now
  const transport = options.transport && typeof options.transport.send === 'function'
    ? options.transport
    : { kind: 'dry-run', configured: false, send: async function () { return { ok: true, receipt: { transport: 'dry-run' } } } }

  const draftsPath = join(stateDir, 'drafts.json')
  const ledgerPath = join(stateDir, 'ledger.jsonl')
  const drafts = new Map()
  let storageError = null
  let idSeq = 0

  function mintId(at) {
    idSeq = (idSeq + 1) % 4096
    return 'wg_' + at.toString(36) + idSeq.toString(36) + randomBytes(2).toString('hex')
  }

  function persist() {
    try {
      mkdirSync(stateDir, { recursive: true })
      const payload = {
        version: VERSION,
        updatedAt: now(),
        drafts: Array.from(drafts.values()),
      }
      const tmp = draftsPath + '.tmp-' + process.pid
      writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf8')
      renameSync(tmp, draftsPath)
      storageError = null
    } catch (error) {
      storageError = String((error && error.message) || error)
    }
  }

  function ledger(action, draft, extra) {
    const entry = {
      at: now(),
      action: action,
      id: draft.id,
      chatId: draft.chat.id,
      status: draft.status,
    }
    if (extra !== undefined && extra !== null) {
      for (const key of Object.keys(extra)) entry[key] = extra[key]
    }
    try {
      mkdirSync(stateDir, { recursive: true })
      appendFileSync(ledgerPath, JSON.stringify(entry) + '\n', 'utf8')
    } catch (error) {
      // The ledger is an audit trail, not a precondition for the gate. A full
      // disk must not turn a pending draft into an unconfirmable one.
      storageError = storageError || String((error && error.message) || error)
    }
  }

  function load() {
    try {
      if (!existsSync(draftsPath)) return
      const parsed = JSON.parse(readFileSync(draftsPath, 'utf8'))
      if (!parsed || !Array.isArray(parsed.drafts)) return
      for (const draft of parsed.drafts) {
        if (draft && typeof draft.id === 'string' && typeof draft.status === 'string') {
          drafts.set(draft.id, draft)
        }
      }
    } catch (error) {
      try {
        renameSync(draftsPath, draftsPath + '.corrupt-' + Date.now())
      } catch (inner) {
        // Keep the unreadable file; the in-memory box starts empty.
      }
      storageError = String((error && error.message) || error)
    }
  }

  function prune() {
    if (drafts.size <= maxDrafts) return
    const terminal = Array.from(drafts.values())
      .filter(function (draft) { return draft.status !== 'pending' })
      .sort(function (a, b) { return a.createdAt - b.createdAt })
    while (drafts.size > maxDrafts && terminal.length > 0) {
      const victim = terminal.shift()
      drafts.delete(victim.id)
    }
  }

  function stage(input) {
    const source = input && typeof input === 'object' ? input : {}
    const chatId = clip(source.chatId, 200)
    if (chatId.length === 0) return fail('invalid', 'chatId 不能为空')
    const text = clip(source.text, MAX_TEXT)
    if (text.length === 0) return fail('invalid', '草稿正文不能为空')

    const at = now()
    let id = mintId(at)
    while (drafts.has(id)) id = mintId(at)
    const draft = {
      id: id,
      status: 'pending',
      chat: {
        id: chatId,
        name: clip(source.chatName, 120),
      },
      text: text,
      originalText: text,
      editCount: 0,
      lastEditedAt: null,
      quoted: normalizeQuoted(source),
      voice: normalizeVoice(source, threshold),
      origin: source.origin === 'tool' ? 'tool' : 'bridge',
      createdAt: at,
      updatedAt: at,
      expiresAt: at + ttlMs,
      decidedAt: null,
      decidedBy: null,
      sentAt: null,
      receipt: null,
      voidReason: null,
      attempts: [],
    }
    drafts.set(id, draft)
    prune()
    persist()
    ledger('staged', draft)
    const out = ok(draft)
    if (storageError !== null) out.warning = 'draft box persistence failed: ' + storageError
    return out
  }

  function edit(id, text, by) {
    sweep()
    const draft = drafts.get(String(id || ''))
    if (draft === undefined) return fail('not-found', '找不到草稿 ' + String(id || ''))
    if (draft.status !== 'pending') return fail('not-pending', '草稿已不在待确认状态', draft)
    const next = clip(text, MAX_TEXT)
    if (next.length === 0) return fail('invalid', '草稿正文不能为空', draft)
    if (next === draft.text) return ok(draft)
    const at = now()
    draft.text = next
    draft.editCount = draft.editCount + 1
    draft.lastEditedAt = at
    draft.updatedAt = at
    persist()
    ledger('edited', draft, { by: by === 'command' ? 'command' : 'panel', chars: next.length })
    return ok(draft)
  }

  function sweep(at) {
    const moment = typeof at === 'number' ? at : now()
    let changed = 0
    for (const draft of drafts.values()) {
      if (draft.status !== 'pending') continue
      if (draft.expiresAt > moment) continue
      draft.status = 'expired'
      draft.decidedAt = moment
      draft.decidedBy = null
      draft.updatedAt = moment
      draft.voidReason = {
        code: 'expired',
        detail: '超过 ' + ttlLabel(ttlMs) + '未确认，自动作废',
      }
      changed = changed + 1
      ledger('expired', draft, { expiresAt: draft.expiresAt })
    }
    if (changed > 0) persist()
    return changed
  }

  async function confirm(id, options2) {
    const settings = options2 && typeof options2 === 'object' ? options2 : {}
    const key = String(id || '')
    sweep()
    const draft = drafts.get(key)
    if (draft === undefined) return fail('not-found', '找不到草稿 ' + key)
    if (draft.status === 'expired') {
      return fail('expired', (draft.voidReason && draft.voidReason.detail) || '草稿已过期', draft)
    }
    if (draft.status !== 'pending') return fail('not-pending', '草稿已不在待确认状态', draft)

    if (settings.text !== undefined) {
      const edited = edit(key, settings.text, settings.by)
      if (!edited.ok) return edited
    }

    const at = now()
    let result
    try {
      result = await transport.send(draft)
    } catch (error) {
      result = { ok: false, error: String((error && error.message) || error) }
    }
    if (!result || result.ok !== true) {
      const error = String((result && result.error) || '发送失败')
      draft.attempts.push({ at: at, ok: false, error: error })
      draft.updatedAt = at
      persist()
      ledger('send-failed', draft, { error: error })
      return fail('transport-failed', error, draft)
    }

    draft.status = 'sent'
    draft.decidedAt = at
    draft.decidedBy = settings.by === 'command' ? 'command' : 'panel'
    draft.sentAt = at
    draft.receipt = result.receipt || null
    draft.updatedAt = at
    draft.attempts.push({ at: at, ok: true })
    persist()
    ledger('sent', draft, {
      by: draft.decidedBy,
      transport: draft.receipt && draft.receipt.transport,
    })
    return ok(draft)
  }

  function discard(id, options2) {
    const settings = options2 && typeof options2 === 'object' ? options2 : {}
    const draft = drafts.get(String(id || ''))
    if (draft === undefined) return fail('not-found', '找不到草稿 ' + String(id || ''))
    if (draft.status !== 'pending') return fail('not-pending', '草稿已不在待确认状态', draft)
    const at = now()
    draft.status = 'voided'
    draft.decidedAt = at
    draft.decidedBy = settings.by === 'command' ? 'command' : 'panel'
    draft.updatedAt = at
    draft.voidReason = {
      code: 'withdrawn',
      detail: clip(settings.reason, 200) || '人工作废',
    }
    persist()
    ledger('voided', draft, { detail: draft.voidReason.detail })
    return ok(draft)
  }

  function stats() {
    const counts = { pending: 0, sent: 0, voided: 0, expired: 0, other: 0 }
    let failedAttempts = 0
    for (const draft of drafts.values()) {
      if (Object.prototype.hasOwnProperty.call(counts, draft.status)) counts[draft.status] = counts[draft.status] + 1
      else counts.other = counts.other + 1
      for (const attempt of draft.attempts || []) {
        if (attempt && attempt.ok !== true) failedAttempts = failedAttempts + 1
      }
    }
    return {
      pending: counts.pending,
      sent: counts.sent,
      voided: counts.voided,
      expired: counts.expired,
      other: counts.other,
      failedAttempts: failedAttempts,
      total: drafts.size,
    }
  }

  function state() {
    sweep()
    const all = Array.from(drafts.values())
    const pending = all
      .filter(function (draft) { return draft.status === 'pending' })
      .sort(function (a, b) { return a.createdAt - b.createdAt })
    const history = all
      .filter(function (draft) { return draft.status !== 'pending' })
      .sort(function (a, b) { return (b.decidedAt || b.updatedAt || 0) - (a.decidedAt || a.updatedAt || 0) })
      .slice(0, historyLimit)
    return {
      now: now(),
      stats: stats(),
      pending: pending,
      history: history,
      config: {
        draftTtlMs: ttlMs,
        ttlLabel: ttlLabel(ttlMs),
        lowConfidenceThreshold: threshold,
        historyLimit: historyLimit,
        transport: {
          kind: transport.kind || 'unknown',
          configured: transport.configured === true,
          endpoint: transport.endpoint || '',
        },
      },
      storage: {
        stateDir: stateDir,
        draftsPath: draftsPath,
        ledgerPath: ledgerPath,
        error: storageError,
      },
    }
  }

  load()
  sweep()
  return {
    stage: stage,
    edit: edit,
    confirm: confirm,
    discard: discard,
    sweep: sweep,
    state: state,
    stats: stats,
    get: function (id) { return drafts.get(String(id || '')) },
    paths: { drafts: draftsPath, ledger: ledgerPath, stateDir: stateDir },
  }
}
