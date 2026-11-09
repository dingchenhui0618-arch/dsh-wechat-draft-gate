// Outbound transport for confirmed drafts.
//
// This plugin deliberately ships no WeChat client: logging into a personal
// account belongs to a bridge, not to an approval gate. The transport is one
// HTTP POST to a bridge endpoint the operator configures. With no endpoint the
// gate stays in dry-run: confirmation is recorded, nothing leaves the machine.

const DEFAULT_TIMEOUT_MS = 10000

function positive(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

function redactEndpoint(raw) {
  try {
    const url = new URL(raw)
    return url.origin + url.pathname
  } catch (error) {
    return ''
  }
}

function resolveToken(options) {
  if (typeof options.token === 'string' && options.token.length > 0) return options.token
  const envName = typeof options.tokenEnv === 'string' ? options.tokenEnv.trim() : ''
  if (envName.length > 0) {
    const fromEnv = process.env[envName]
    if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv
  }
  return ''
}

export function createTransport(options = {}) {
  const url = typeof options.url === 'string' ? options.url.trim() : ''
  const token = resolveToken(options)
  const timeoutMs = positive(options.timeoutMs, DEFAULT_TIMEOUT_MS)

  async function send(draft) {
    if (url.length === 0) {
      return {
        ok: true,
        receipt: {
          transport: 'dry-run',
          messageId: 'dry-' + draft.id,
          at: Date.now(),
        },
      }
    }

    const headers = {
      'content-type': 'application/json; charset=utf-8',
      'x-dsh-draft-gate': '1',
      'idempotency-key': 'draft:' + draft.id,
    }
    if (token.length > 0) headers.authorization = 'Bearer ' + token

    const payload = {
      version: 1,
      kind: 'wechat.outbound',
      draftId: draft.id,
      idempotencyKey: 'draft:' + draft.id,
      chat: draft.chat,
      text: draft.text,
      quoted: draft.quoted,
      voice: draft.voice,
      origin: draft.origin,
      stagedAt: draft.createdAt,
      expiresAt: draft.expiresAt,
    }

    const controller = new AbortController()
    const timer = setTimeout(function () { controller.abort() }, timeoutMs)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      const raw = await response.text()
      if (!response.ok) {
        return {
          ok: false,
          error: 'bridge HTTP ' + response.status + (raw.length > 0 ? ': ' + raw.slice(0, 200) : ''),
        }
      }
      let messageId = null
      if (raw.length > 0) {
        try {
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed.messageId === 'string') messageId = parsed.messageId
        } catch (error) {
          // A bridge may answer with an empty or non-JSON body; delivery stands.
        }
      }
      return {
        ok: true,
        receipt: {
          transport: 'http',
          status: response.status,
          messageId: messageId,
          at: Date.now(),
        },
      }
    } catch (error) {
      const aborted = error && error.name === 'AbortError'
      return {
        ok: false,
        error: aborted
          ? 'bridge timeout after ' + timeoutMs + 'ms'
          : String((error && error.message) || error),
      }
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    kind: url.length > 0 ? 'http' : 'dry-run',
    configured: url.length > 0,
    endpoint: redactEndpoint(url),
    timeoutMs: timeoutMs,
    send: send,
  }
}
