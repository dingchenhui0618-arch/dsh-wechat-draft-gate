// Client half of dsh-wechat-draft-gate: the 待发 Tab in the conversation view.
//
// Must stay CommonJS - the build wraps this in window.__ModuleLoader__.load()
// and React is supplied by the harness.

const React = require('react')
const h = React.createElement
const CSS = require('./client-css.cjs')

const API = '/dsh-wechat-draft-gate'
const POLL_MS = 1000
const HISTORY_SHOWN = 30

let snap = { data: null, error: '', at: 0 }
const listeners = new Set()
let timer = null

function emit() {
  Array.from(listeners).forEach(function (fn) {
    try {
      fn(snap)
    } catch (error) {
      if (typeof console !== 'undefined' && console.warn) console.warn('[dsh-wechat-draft-gate] listener failed', error)
    }
  })
}

function load() {
  fetch(API + '/state', { headers: { accept: 'application/json' } })
    .then(function (res) { return res.json() })
    .then(function (data) {
      snap = { data: data, error: '', at: Date.now() }
      emit()
    })
    .catch(function (error) {
      snap = { data: snap.data, error: String((error && error.message) || error), at: Date.now() }
      emit()
    })
}

function post(method, body) {
  return fetch(API + '/' + method, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
    .then(function (res) {
      return res.json().then(function (data) {
        return { status: res.status, data: data }
      })
    })
    .then(function (out) {
      load()
      return out
    })
}

function subscribe(fn) {
  listeners.add(fn)
  if (timer === null) {
    load()
    timer = setInterval(load, POLL_MS)
  }
  fn(snap)
  return function () {
    listeners.delete(fn)
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
}

function pad(n) {
  return n < 10 ? '0' + n : String(n)
}

function clock(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '--:--'
  const d = new Date(ms)
  return pad(d.getHours()) + ':' + pad(d.getMinutes())
}

function dayTime(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '-'
  const d = new Date(ms)
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + clock(ms)
}

function remainingLabel(expiresAt, now) {
  const ms = expiresAt - now
  if (!Number.isFinite(ms) || ms <= 0) return '已到期'
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (minutes >= 60) return Math.floor(minutes / 60) + ' 小时 ' + (minutes % 60) + ' 分'
  return minutes + ' 分 ' + (seconds < 10 ? '0' : '') + seconds + ' 秒'
}

function pct(value) {
  return Math.round(value * 100) + '%'
}

const KIND_LABEL = { text: '文字', voice: '语音', image: '图片', file: '文件', unknown: '来源未知' }
const STATUS_LABEL = { sent: '已发送', voided: '已作废', expired: '已过期' }

function Stat(props) {
  return h('div', { className: 'wg-stat' + (props.tone ? ' wg-stat-' + props.tone : '') },
    h('b', null, String(props.value)),
    h('span', null, props.label),
  )
}

function Avatar(props) {
  const name = String(props.name || props.id || '?')
  return h('span', { className: 'wg-avatar', 'aria-hidden': 'true' }, name.slice(0, 1))
}

function VoiceRow(props) {
  const voice = props.voice
  return h('div', { className: 'wg-voice' },
    h('span', { className: 'wg-chip wg-chip-voice' }, '语音转写'),
    h('span', { className: 'wg-voice-src' },
      voice.sourceLabel || voice.source || '未知来源',
      voice.model ? h('span', { className: 'wg-voice-model' }, ' · ' + voice.model) : null,
    ),
    voice.confidence === null
      ? h('span', { className: 'wg-conf wg-muted' }, '未提供置信度')
      : h('span', { className: 'wg-conf' }, '置信度 ' + pct(voice.confidence)),
    voice.lowConfidence
      ? h('span', { className: 'wg-warn' }, '低于 ' + pct(voice.threshold) + '，请核对原文')
      : null,
  )
}

function DraftCard(props) {
  const draft = props.draft
  const now = props.now
  const [text, setText] = React.useState(draft.text)
  const [busy, setBusy] = React.useState('')
  const [error, setError] = React.useState('')
  const [armed, setArmed] = React.useState(false)
  const armTimer = React.useRef(null)

  React.useEffect(function () {
    setText(draft.text)
    setError('')
  }, [draft.id])

  React.useEffect(function () {
    return function () {
      if (armTimer.current !== null) clearTimeout(armTimer.current)
    }
  }, [])

  const dirty = text !== draft.text
  const voice = draft.voice
  const quoted = draft.quoted

  function save() {
    setBusy('save')
    setError('')
    post('edit', { id: draft.id, text: text, by: 'panel' }).then(function (out) {
      setBusy('')
      if (!out.data || out.data.ok !== true) setError((out.data && out.data.error) || '保存失败')
      else setText(out.data.draft.text)
    }).catch(function (e) {
      setBusy('')
      setError(String((e && e.message) || e))
    })
  }

  function confirm() {
    setBusy('send')
    setError('')
    post('confirm', { id: draft.id, text: text, by: 'panel' }).then(function (out) {
      setBusy('')
      if (!out.data || out.data.ok !== true) setError((out.data && out.data.error) || '发送失败')
    }).catch(function (e) {
      setBusy('')
      setError(String((e && e.message) || e))
    })
  }

  function discard() {
    if (!armed) {
      setArmed(true)
      if (armTimer.current !== null) clearTimeout(armTimer.current)
      armTimer.current = setTimeout(function () {
        setArmed(false)
        armTimer.current = null
      }, 4000)
      return
    }
    if (armTimer.current !== null) clearTimeout(armTimer.current)
    armTimer.current = null
    setArmed(false)
    setBusy('discard')
    setError('')
    post('discard', { id: draft.id, by: 'panel' }).then(function (out) {
      setBusy('')
      if (!out.data || out.data.ok !== true) setError((out.data && out.data.error) || '作废失败')
    }).catch(function (e) {
      setBusy('')
      setError(String((e && e.message) || e))
    })
  }

  return h('article', { className: 'wg-card' },
    h('header', { className: 'wg-card-head' },
      h('div', { className: 'wg-recipient' },
        h(Avatar, { name: draft.chat.name, id: draft.chat.id }),
        h('div', { className: 'wg-who' },
          h('b', null, draft.chat.name || draft.chat.id),
          h('span', { className: 'wg-id' }, draft.chat.id),
        ),
      ),
      h('div', { className: 'wg-card-meta' },
        h('span', { className: 'wg-count wg-count-live' }, remainingLabel(draft.expiresAt, now)),
        h('span', { className: 'wg-chip wg-chip-pending' }, '待确认'),
      ),
    ),
    quoted
      ? h('blockquote', { className: 'wg-quote' },
        h('div', { className: 'wg-quote-head' },
          h('span', { className: 'wg-quote-label' }, '引用原文'),
          h('span', { className: 'wg-quote-kind' }, KIND_LABEL[quoted.kind] || '来源未知'),
          quoted.sender ? h('span', { className: 'wg-quote-sender' }, quoted.sender) : null,
          quoted.at ? h('time', { className: 'wg-quote-time' }, clock(quoted.at)) : null,
        ),
        h('p', { className: 'wg-quote-text' }, quoted.text),
      )
      : h('div', { className: 'wg-no-quote' }, '桥接端未提供引用原文'),
    voice ? h(VoiceRow, { voice: voice }) : null,
    voice && voice.transcript && voice.transcript !== (quoted && quoted.text)
      ? h('div', { className: 'wg-transcript' }, '转写原文：' + voice.transcript)
      : null,
    h('label', { className: 'wg-field' },
      h('span', { className: 'wg-field-label' }, '将要发出的内容'),
      h('textarea', {
        className: 'wg-textarea',
        value: text,
        rows: 4,
        spellCheck: false,
        'aria-label': '草稿正文',
        onChange: function (event) { setText(event.target.value) },
      }),
    ),
    h('div', { className: 'wg-edit-meta' },
      draft.editCount > 0 ? '已编辑 ' + draft.editCount + ' 次 · ' : '',
      '原文 ' + draft.originalText.length + ' 字',
      dirty ? h('span', { className: 'wg-dirty' }, ' · 有未保存修改') : null,
    ),
    error ? h('p', { className: 'wg-card-error', role: 'alert' }, error) : null,
    h('footer', { className: 'wg-actions' },
      h('button', {
        className: 'wg-btn wg-btn-danger-ghost',
        type: 'button',
        disabled: busy !== '',
        onClick: discard,
      }, armed ? '再点一次确认作废' : '作废'),
      h('span', { className: 'wg-actions-spacer' }),
      h('button', {
        className: 'wg-btn wg-btn-ghost',
        type: 'button',
        disabled: busy !== '' || text === draft.originalText,
        onClick: function () { setText(draft.originalText) },
      }, '恢复原文'),
      h('button', {
        className: 'wg-btn wg-btn-secondary',
        type: 'button',
        disabled: busy !== '' || !dirty,
        onClick: save,
      }, busy === 'save' ? '保存中…' : '保存修改'),
      h('button', {
        className: 'wg-btn wg-btn-primary',
        type: 'button',
        disabled: busy !== '',
        onClick: confirm,
      }, busy === 'send' ? '发送中…' : '确认发送'),
    ),
  )
}

function HistoryRow(props) {
  const d = props.draft
  const transport = d.receipt && d.receipt.transport
  const who = d.chat.name || d.chat.id
  return h('div', { className: 'wg-history-row' },
    h('span', { className: 'wg-chip wg-chip-' + d.status }, STATUS_LABEL[d.status] || d.status),
    h('div', { className: 'wg-history-main' },
      h('div', { className: 'wg-history-title' },
        h('b', null, who),
        h('span', { className: 'wg-muted' }, ' · ' + d.text.length + ' 字'),
        transport === 'dry-run' ? h('span', { className: 'wg-chip wg-chip-dry' }, '演练') : null,
      ),
      d.voidReason ? h('div', { className: 'wg-history-reason' }, d.voidReason.detail) : null,
      d.status === 'sent'
        ? h('div', { className: 'wg-history-reason' },
          (d.decidedBy === 'command' ? '命令' : '面板') + '确认 · ' + dayTime(d.sentAt),
        )
        : null,
      d.attempts && d.attempts.some(function (a) { return a && a.ok !== true })
        ? h('div', { className: 'wg-history-reason wg-warn' },
          '发送失败 ' + d.attempts.filter(function (a) { return a && a.ok !== true }).length + ' 次',
        )
        : null,
    ),
    h('time', { className: 'wg-history-time' }, dayTime(d.decidedAt || d.updatedAt)),
  )
}

function GateView() {
  const [state, setState] = React.useState(snap)
  React.useEffect(function () { return subscribe(setState) }, [])

  const data = state.data
  const stats = (data && data.stats) || { pending: 0, sent: 0, voided: 0, expired: 0 }
  const config = (data && data.config) || null
  const pending = (data && data.pending) || []
  const history = ((data && data.history) || []).slice(0, HISTORY_SHOWN)
  const dryRun = config !== null && config.transport && config.transport.configured !== true
  const storageError = data && data.storage && data.storage.error

  return h('div', { className: 'wg-root' + (dryRun ? ' wg-dry' : '') },
    h('header', { className: 'wg-head' },
      h('div', null,
        h('h3', { className: 'wg-title' }, '待发草稿'),
        h('p', { className: 'wg-sub' }, '微信回复先停在这里，确认后才离开本机'),
      ),
      h('div', { className: 'wg-head-side' },
        h('span', { className: 'wg-transport' + (dryRun ? ' wg-transport-dry' : '') },
          dryRun ? '未配置发送桥接 · 演练模式' : '发送桥接 · HTTP',
        ),
        h('button', {
          className: 'wg-btn wg-btn-ghost',
          type: 'button',
          onClick: function () { load() },
        }, '刷新'),
      ),
    ),
    dryRun
      ? h('div', { className: 'wg-banner' }, '演练模式：点「确认发送」只记录结果，不会真的发出微信消息。配置 transportUrl 后才会走桥接发送。')
      : null,
    storageError ? h('div', { className: 'wg-banner wg-banner-error' }, '草稿箱落盘失败：' + storageError) : null,
    state.error ? h('div', { className: 'wg-banner wg-banner-error' }, '与 host 通信失败：' + state.error) : null,
    h('div', { className: 'wg-stats' },
      h(Stat, { label: '待确认', value: stats.pending, tone: stats.pending > 0 ? 'live' : '' }),
      h(Stat, { label: '已发送', value: stats.sent, tone: 'good' }),
      h(Stat, { label: '已作废', value: stats.voided }),
      h(Stat, { label: '已过期', value: stats.expired, tone: stats.expired > 0 ? 'warn' : '' }),
    ),
    h('section', { className: 'wg-section' },
      h('div', { className: 'wg-section-head' },
        h('h4', null, '待确认'),
        h('span', { className: 'wg-section-note' },
          config ? '草稿 ' + config.ttlLabel + '未确认自动作废' : '',
        ),
      ),
      pending.length === 0
        ? h('div', { className: 'wg-empty' },
          h('b', null, '没有待确认的草稿'),
          h('span', null, 'Agent 的微信回复会先落在这里；确认前不会发出。'),
        )
        : h('div', { className: 'wg-list' }, pending.map(function (draft) {
          return h(DraftCard, { key: draft.id, draft: draft, now: (data && data.now) || Date.now() })
        })),
    ),
    h('section', { className: 'wg-section' },
      h('div', { className: 'wg-section-head' },
        h('h4', null, '处理记录'),
        h('span', { className: 'wg-section-note' }, history.length > 0 ? '最近 ' + history.length + ' 条' : ''),
      ),
      history.length === 0
        ? h('div', { className: 'wg-empty wg-empty-small' }, h('span', null, '还没有发送或作废记录。'))
        : h('div', { className: 'wg-history' }, history.map(function (draft) {
          return h(HistoryRow, { key: draft.id, draft: draft })
        })),
    ),
  )
}

function apply(ctx) {
  ctx.effect(function () {
    return function () {
      if (timer !== null) {
        clearInterval(timer)
        timer = null
      }
      listeners.clear()
      snap = { data: null, error: '', at: 0 }
    }
  })

  ctx.effect(function () {
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-wechat-draft-gate'
    style.textContent = CSS
    document.head.appendChild(style)
    return function () { style.remove() }
  })

  ctx.slots.inject('conversation.view', function () {
    let disposeView
    try {
      disposeView = ctx.slots.register(
        { name: 'conversation.view', id: 'wechat-draft-gate', order: 15, label: '待发' },
        GateView,
      )
    } catch (error) {
      disposeView = undefined
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[dsh-wechat-draft-gate] could not register the 待发 view', error)
      }
    }
    return typeof disposeView === 'function' ? disposeView : function () {}
  })
}

module.exports = {
  name: 'dsh-wechat-draft-gate',
  inject: ['slots'],
  apply: apply,
}
