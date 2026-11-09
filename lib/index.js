// Host half of dsh-wechat-draft-gate.
//
// The gate owns one rule: an outbound WeChat reply is never sent by this plugin
// unless a human confirmed it. Three surfaces share the same draft box:
//
//   GET/POST /dsh-wechat-draft-gate/*   the panel and any local bridge
//   wechat_stage_draft                  the agent stages a reply draft
//   /send <id>                          a human releases one draft
//
// With no transport bridge configured every confirmation is a dry run: the
// state machine and its audit trail are real, but no network call is made.

import { homedir } from 'node:os'
import { join } from 'node:path'
import { createGate } from './gate.js'
import { createTransport } from './transport.js'

export const name = 'dsh-wechat-draft-gate'
export const inject = ['webServer']

const ROUTE = '/dsh-wechat-draft-gate'
const MAX_BODY = 1024 * 1024

function dshHome() {
  const fromEnv = process.env.DSH_HOME
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv
  return join(homedir(), '.dsh')
}

function positive(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise(function (resolve) {
    let raw = ''
    req.on('data', function (chunk) {
      raw += chunk
      if (raw.length > MAX_BODY) req.destroy()
    })
    req.on('end', function () {
      try {
        const parsed = raw.length > 0 ? JSON.parse(raw) : {}
        resolve(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {})
      } catch (error) {
        resolve(undefined)
      }
    })
    req.on('error', function () {
      resolve(undefined)
    })
  })
}

function methodFromUrl(url) {
  const path = String(url || '').split('?')[0]
  const rest = path.replace(/^\/dsh-wechat-draft-gate\/?/, '')
  return rest || 'state'
}

function statusFor(code) {
  if (code === 'invalid') return 400
  if (code === 'not-found') return 404
  if (code === 'not-pending' || code === 'expired') return 409
  if (code === 'transport-failed') return 502
  return 500
}

function failure(res, result) {
  sendJson(res, statusFor(result.code), result)
}

function describeFailure(result) {
  if (result.code === 'expired') return '草稿已过期作废：' + result.error
  if (result.code === 'transport-failed') return '发送失败，草稿仍在待确认：' + result.error
  if (result.code === 'not-found') return result.error
  if (result.code === 'not-pending') return '这条草稿已经处理过，不能再次操作'
  return result.error || '操作失败'
}

function draftSummary(draft) {
  const who = draft.chat.name || draft.chat.id
  return draft.id + ' · ' + who + ' · ' + draft.text.length + ' 字'
}

export function apply(ctx, config) {
  const settings = config && typeof config === 'object' ? config : {}
  const home = typeof settings.dshHome === 'string' ? settings.dshHome : dshHome()
  const stateDir = typeof settings.stateDir === 'string' && settings.stateDir.length > 0
    ? settings.stateDir
    : join(home, 'wechat-draft-gate')

  const ttlMs = positive(
    settings.draftTtlMs,
    positive(settings.draftTtlMinutes, 30) * 60000,
  )
  const sweepIntervalMs = positive(settings.sweepIntervalMs, 15000)

  const transport = createTransport({
    url: typeof settings.transportUrl === 'string' ? settings.transportUrl : '',
    token: typeof settings.transportToken === 'string' ? settings.transportToken : '',
    tokenEnv: typeof settings.transportTokenEnv === 'string' ? settings.transportTokenEnv : '',
    timeoutMs: positive(settings.transportTimeoutMs, 10000),
  })

  const gate = createGate({
    stateDir: stateDir,
    ttlMs: ttlMs,
    confidenceThreshold: settings.lowConfidenceThreshold,
    historyLimit: settings.historyLimit,
    maxDrafts: settings.maxDrafts,
    transport: transport,
  })

  // Expiry runs on a timer so a draft becomes 'expired' even while nobody is
  // looking at the panel. Every read sweeps too, so the timer is an optimisation
  // rather than the source of truth.
  ctx.effect(function () {
    const timer = setInterval(function () {
      try {
        gate.sweep()
      } catch (error) {
        // A sweep failure must not kill the interval.
      }
    }, sweepIntervalMs)
    if (typeof timer.unref === 'function') timer.unref()
    return function () { clearInterval(timer) }
  })

  // Model-facing half: the agent can stage a reply, and is told plainly that
  // staging is not sending.
  ctx.effect(function () {
    const tools = ctx.get('tools')
    if (tools === undefined || typeof tools.register !== 'function') return function () {}
    let dispose
    try {
      dispose = tools.register({
        name: 'wechat_stage_draft',
        description:
          '把一条要发给微信联系人的回复放进本机的「待发草稿箱」。' +
          '这不会发送任何消息：草稿必须由人在面板点「确认发送」或用 /send <id> 才会真正发出，' +
          '未被确认的草稿会过期作废。需要引用对方原话时填 quotedText，' +
          '语音转写结果请同时填 voiceSource、voiceModel 与 voiceConfidence（0-1）。',
        parameters: {
          type: 'object',
          properties: {
            chatId: { type: 'string', description: '微信会话或联系人的稳定 id' },
            chatName: { type: 'string', description: '显示名，可选' },
            text: { type: 'string', description: '草稿正文，确认后才发送' },
            quotedText: { type: 'string', description: '这条回复所回应的对方原话，可选' },
            quotedSender: { type: 'string', description: '原话发送者，可选' },
            quotedKind: {
              type: 'string',
              description: '原话类型：text / voice / image / file / unknown',
              enum: ['text', 'voice', 'image', 'file', 'unknown'],
            },
            quotedAt: { type: 'integer', description: '原话时间戳（毫秒），可选' },
            voiceSource: { type: 'string', description: '语音转写来源，如 local-whisper / cloud-asr' },
            voiceModel: { type: 'string', description: '转写模型名，可选' },
            voiceConfidence: { type: 'number', description: '转写置信度 0-1（也接受 0-100）' },
            voiceTranscript: { type: 'string', description: '语音转写原文' },
          },
          required: ['chatId', 'text'],
          additionalProperties: false,
        },
        output: {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              expiresAt: { type: 'integer' },
              note: { type: 'string' },
            },
            required: ['id', 'status', 'expiresAt', 'note'],
            additionalProperties: false,
          },
          render: function (args, value) {
            return [{
              type: 'text',
              text: '已放入待发草稿箱：' + value.id + '（未发送，等待人工确认；过期时间 ' + value.expiresAt + '）',
            }]
          },
        },
        async execute(args) {
          const result = gate.stage({
            chatId: args.chatId,
            chatName: args.chatName,
            text: args.text,
            quotedText: args.quotedText,
            quotedSender: args.quotedSender,
            quotedKind: args.quotedKind,
            quotedAt: args.quotedAt,
            voiceSource: args.voiceSource,
            voiceModel: args.voiceModel,
            voiceConfidence: args.voiceConfidence,
            voiceTranscript: args.voiceTranscript,
            origin: 'tool',
          })
          if (!result.ok) throw new Error(result.error)
          return {
            id: result.draft.id,
            status: result.draft.status,
            expiresAt: result.draft.expiresAt,
            note: 'staged only; a human must confirm',
          }
        },
      })
    } catch (error) {
      dispose = undefined
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[dsh-wechat-draft-gate] could not register the staging tool', error)
      }
    }
    return function () {
      if (typeof dispose === 'function') dispose()
    }
  })

  // Human-facing half: the same confirmation path as the panel button.
  ctx.effect(function () {
    const commands = ctx.get('commands')
    if (commands === undefined || typeof commands.register !== 'function') return function () {}
    const disposers = []
    try {
      disposers.push(commands.register({
        name: 'send',
        description: '确认发送一条待发微信草稿。用法：/send <草稿 id>',
        input: { hint: '草稿 id（面板「待发」页可见）' },
        handler: async function (invocation) {
          const id = String(invocation.rawInput || '').trim()
          if (id.length === 0) return { kind: 'error', text: '用法：/send <草稿 id>，先到「待发」面板看 id' }
          const result = await gate.confirm(id, { by: 'command' })
          if (!result.ok) return { kind: 'error', text: describeFailure(result) }
          const draft = result.draft
          const who = draft.chat.name || draft.chat.id
          return {
            kind: 'success',
            text: '已发送草稿 ' + draft.id + ' 给 ' + who + '（' + draft.text.length + ' 字）',
          }
        },
      }))
      disposers.push(commands.register({
        name: 'drafts',
        description: '列出待发微信草稿（不发送任何消息）',
        handler: async function () {
          const view = gate.state()
          if (view.pending.length === 0) return { kind: 'success', text: '没有待确认的微信草稿' }
          const lines = view.pending.map(function (draft) {
            const remaining = Math.max(0, Math.ceil((draft.expiresAt - view.now) / 60000))
            const voice = draft.voice ? ' · 语音转写' : ''
            return draftSummary(draft) + ' · 剩 ' + remaining + ' 分' + voice
          })
          return { kind: 'success', text: lines.join('\n') }
        },
      }))
    } catch (error) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[dsh-wechat-draft-gate] could not register /send or /drafts', error)
      }
    }
    return function () {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch (error) {
          // One failed disposer must not block the rest.
        }
      }
    }
  })

  // Panel and bridge API. A failure here degrades the UI only; the tool and
  // the commands keep working.
  ctx.effect(function () {
    let disposeRoute
    try {
      disposeRoute = ctx.webServer.register({
        kind: 'prefix',
        path: ROUTE,
        handler: async function (req, res) {
          try {
            const method = methodFromUrl(req.url)
            if (method === 'state') {
              if (req.method !== 'GET') {
                sendJson(res, 405, { error: 'method not allowed' })
                return
              }
              sendJson(res, 200, gate.state())
              return
            }
            if (req.method !== 'POST') {
              sendJson(res, 405, { error: 'method not allowed' })
              return
            }
            const body = await readBody(req)
            if (body === undefined) {
              sendJson(res, 400, { ok: false, code: 'invalid', error: '请求体不是合法 JSON' })
              return
            }
            if (method === 'stage') {
              const result = gate.stage(body)
              if (!result.ok) failure(res, result)
              else sendJson(res, 201, result)
              return
            }
            if (method === 'edit') {
              const result = gate.edit(body.id, body.text, body.by)
              if (!result.ok) failure(res, result)
              else sendJson(res, 200, result)
              return
            }
            if (method === 'confirm') {
              const result = await gate.confirm(body.id, { by: body.by, text: body.text })
              if (!result.ok) failure(res, result)
              else sendJson(res, 200, result)
              return
            }
            if (method === 'discard') {
              const result = gate.discard(body.id, { by: body.by, reason: body.reason })
              if (!result.ok) failure(res, result)
              else sendJson(res, 200, result)
              return
            }
            sendJson(res, 404, { ok: false, code: 'unknown-method', error: 'unknown method ' + method })
          } catch (error) {
            sendJson(res, 500, { ok: false, code: 'internal', error: String((error && error.message) || error) })
          }
        },
      })
    } catch (error) {
      disposeRoute = undefined
    }
    return function () {
      if (typeof disposeRoute === 'function') disposeRoute()
    }
  })

  return { gate: gate }
}
