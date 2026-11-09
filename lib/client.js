/* dsh-wechat-draft-gate client bundle - generated from src/client.cjs */
window.__ModuleLoader__.load({
  id: "dsh-wechat-draft-gate",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
// Client half of dsh-wechat-draft-gate: the 待发 Tab in the conversation view.
//
// Must stay CommonJS - the build wraps this in window.__ModuleLoader__.load()
// and React is supplied by the harness.

const React = require('react')
const h = React.createElement
const CSS = ".wg-root{--wg-1:4px;--wg-2:8px;--wg-3:12px;--wg-4:16px;--wg-6:24px;--wg-8:32px;--wg-16:64px;display:flex;flex-direction:column;gap:var(--wg-4);height:100%;overflow:auto;padding:var(--wg-4);padding-bottom:calc(var(--wg-16) * 2);color:var(--dsw-alias-label-primary,inherit);background:var(--dsw-alias-bg-base,transparent);font-size:14px;line-height:1.5;font-family:inherit}.wg-head,.wg-stats,.wg-section,.wg-banner{width:100%;max-width:880px;margin-left:auto;margin-right:auto;box-sizing:border-box}.wg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--wg-4);flex-wrap:wrap;padding-bottom:var(--wg-1)}.wg-title{margin:0;font-size:16px;font-weight:600;line-height:1.4;letter-spacing:.01em}.wg-sub{margin:var(--wg-1) 0 0;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-head-side{display:flex;align-items:center;gap:var(--wg-2);flex-wrap:wrap}.wg-transport{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:999px;padding:var(--wg-1) var(--wg-3);white-space:nowrap}.wg-transport-dry{color:var(--dsw-alias-state-warn-primary,#b45309);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 8%,transparent)}.wg-banner{border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);padding:var(--wg-3) var(--wg-4);font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);background:var(--dsw-alias-bg-layer-1,transparent)}.wg-banner-error{color:var(--dsw-alias-state-error-primary,#b91c1c);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#b91c1c) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#b91c1c) 6%,transparent)}.wg-root.wg-dry .wg-banner:first-of-type{color:var(--dsw-alias-state-warn-primary,#b45309);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 35%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 6%,transparent)}.wg-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--wg-2)}.wg-stat{border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);padding:var(--wg-3) var(--wg-4);background:var(--dsw-alias-bg-layer-1,transparent)}.wg-stat b{display:block;font-size:20px;font-weight:600;line-height:1.2;font-variant-numeric:tabular-nums}.wg-stat span{display:block;margin-top:var(--wg-1);font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-stat-live b{color:var(--dsw-alias-brand-primary,#2563eb)}.wg-stat-good b{color:var(--dsw-alias-state-success-primary,#15803d)}.wg-stat-warn b{color:var(--dsw-alias-state-warn-primary,#b45309)}.wg-section{display:flex;flex-direction:column;gap:var(--wg-2)}.wg-section-head{display:flex;align-items:baseline;justify-content:space-between;gap:var(--wg-3)}.wg-section-head h4{margin:0;font-size:12px;font-weight:600;letter-spacing:.04em;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-section-note{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-list{display:flex;flex-direction:column;gap:var(--wg-2)}.wg-card{display:flex;flex-direction:column;gap:var(--wg-3);border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);padding:var(--wg-4);background:var(--dsw-alias-bg-layer-1,transparent)}.wg-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--wg-3);flex-wrap:wrap}.wg-recipient{display:flex;align-items:center;gap:var(--wg-3);min-width:0}.wg-avatar{display:grid;place-items:center;width:32px;height:32px;border-radius:var(--wg-2);flex:none;background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 14%,transparent);color:var(--dsw-alias-brand-primary,#2563eb);font-weight:600;font-size:14px}.wg-who{min-width:0}.wg-who b{display:block;font-size:14px;font-weight:600;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wg-id{display:block;margin-top:2px;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46ch}.wg-card-meta{display:flex;flex-direction:column;align-items:flex-end;gap:var(--wg-1);flex:none}.wg-count{font-size:12px;font-variant-numeric:tabular-nums}.wg-count-live{color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-quote{margin:0;display:flex;flex-direction:column;gap:var(--wg-2);padding:var(--wg-3);border-left:2px solid var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-radius:0 var(--wg-2) var(--wg-2) 0;background:color-mix(in srgb,var(--dsw-alias-label-primary,currentColor) 4%,transparent)}.wg-quote-head{display:flex;align-items:center;gap:var(--wg-2);flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-quote-label{font-weight:600;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-quote-kind{font-size:12px;padding:0 var(--wg-2);border-radius:999px;border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28))}.wg-quote-sender{color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-quote-time{font-variant-numeric:tabular-nums}.wg-quote-text{margin:0;font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word}.wg-no-quote{border:1px dashed var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-radius:var(--wg-2);padding:var(--wg-2) var(--wg-3);font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-voice{display:flex;align-items:center;gap:var(--wg-2);flex-wrap:wrap;padding:var(--wg-2) var(--wg-3);border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);font-size:12px;background:var(--dsw-alias-bg-layer-2,transparent)}.wg-voice-src{color:var(--dsw-alias-label-primary,inherit)}.wg-voice-model{color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-conf{color:var(--dsw-alias-label-secondary,#7a7a7a);font-variant-numeric:tabular-nums}.wg-muted{color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-warn{color:var(--dsw-alias-state-warn-primary,#b45309)}.wg-transcript{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);background:var(--dsw-alias-bg-layer-2,transparent);border-radius:var(--wg-2);padding:var(--wg-2) var(--wg-3);white-space:pre-wrap;word-break:break-word}.wg-chip{display:inline-flex;align-items:center;font-size:12px;line-height:1.4;padding:0 var(--wg-2);border-radius:999px;border:1px solid transparent;white-space:nowrap}.wg-chip-voice{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 12%,transparent);color:var(--dsw-alias-brand-primary,#2563eb);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 28%,transparent)}.wg-chip-pending{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 12%,transparent);color:var(--dsw-alias-brand-primary,#2563eb);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 28%,transparent)}.wg-chip-sent{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#15803d) 12%,transparent);color:var(--dsw-alias-state-success-primary,#15803d);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#15803d) 28%,transparent)}.wg-chip-voided{background:color-mix(in srgb,var(--dsw-alias-label-primary,currentColor) 6%,transparent);color:var(--dsw-alias-label-secondary,#7a7a7a);border-color:var(--dsw-alias-border-l1,rgba(128,128,128,.28))}.wg-chip-expired{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 12%,transparent);color:var(--dsw-alias-state-warn-primary,#b45309);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 28%,transparent)}.wg-chip-dry{background:transparent;color:var(--dsw-alias-label-secondary,#7a7a7a);border-color:var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-style:dashed}.wg-field{display:flex;flex-direction:column;gap:var(--wg-1)}.wg-field-label{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-textarea{width:100%;box-sizing:border-box;min-height:96px;resize:vertical;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-radius:var(--wg-2);padding:var(--wg-3);background:var(--dsw-alias-bg-base,transparent);color:inherit;font:inherit;font-size:14px;line-height:1.5}.wg-textarea:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#2563eb);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 18%,transparent)}.wg-edit-meta{display:flex;gap:var(--wg-1);flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-dirty{color:var(--dsw-alias-state-warn-primary,#b45309)}.wg-card-error{margin:0;font-size:12px;color:var(--dsw-alias-state-error-primary,#b91c1c)}.wg-actions{display:flex;align-items:center;gap:var(--wg-2);padding-top:var(--wg-3);border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));flex-wrap:wrap}.wg-actions-spacer{flex:1}.wg-btn{font:inherit;font-size:12px;line-height:1.4;border-radius:var(--wg-2);padding:var(--wg-2) var(--wg-3);border:1px solid transparent;background:transparent;color:inherit;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,opacity .15s}.wg-btn:disabled{opacity:.45;cursor:not-allowed}.wg-btn-ghost{border-color:var(--dsw-alias-border-l1,rgba(128,128,128,.28));color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-btn-ghost:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary,currentColor) 6%,transparent);color:var(--dsw-alias-label-primary,inherit)}.wg-btn-secondary{border-color:var(--dsw-alias-border-l2,rgba(128,128,128,.45));color:var(--dsw-alias-label-primary,inherit)}.wg-btn-secondary:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary,currentColor) 6%,transparent)}.wg-btn-primary{background:var(--dsw-alias-label-primary,currentColor);border-color:var(--dsw-alias-label-primary,currentColor);color:var(--dsw-alias-bg-base,#fff);font-weight:500}.wg-btn-primary:hover:not(:disabled){opacity:.9}.wg-btn-danger-ghost{border-color:transparent;color:var(--dsw-alias-state-error-primary,#b91c1c);padding-left:0}.wg-btn-danger-ghost:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#b91c1c) 8%,transparent)}.wg-history{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);overflow:hidden}.wg-history-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:var(--wg-3);padding:var(--wg-3) var(--wg-4)}.wg-history-row + .wg-history-row{border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28))}.wg-history-main{min-width:0}.wg-history-title{font-size:14px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wg-history-title b{font-weight:500}.wg-history-reason{margin-top:2px;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);word-break:break-word}.wg-history-time{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);font-variant-numeric:tabular-nums;white-space:nowrap}.wg-empty{display:flex;flex-direction:column;align-items:center;gap:var(--wg-1);padding:var(--wg-6) var(--wg-4);border:1px dashed var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-radius:var(--wg-2);text-align:center;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}.wg-empty b{font-size:14px;font-weight:500;color:var(--dsw-alias-label-primary,inherit)}.wg-empty-small{padding:var(--wg-4)}@media (max-width:720px){.wg-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.wg-card-head{flex-direction:column;align-items:stretch}.wg-card-meta{flex-direction:row;align-items:center;justify-content:space-between}.wg-actions-spacer{display:none}.wg-actions .wg-btn-primary{margin-left:auto}}"

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
    return module.exports;
  },
});
