// Client styles for dsh-wechat-draft-gate.
//
// All colours come from host theme tokens (with neutral fallbacks), so the tab
// inherits light/dark from the Harness instead of shipping a second palette.
// Spacing uses one 4/8pt scale declared on the root; no ad-hoc values.

module.exports = [
  '.wg-root{--wg-1:4px;--wg-2:8px;--wg-3:12px;--wg-4:16px;--wg-6:24px;--wg-8:32px;--wg-16:64px;display:flex;flex-direction:column;gap:var(--wg-4);height:100%;overflow:auto;padding:var(--wg-4);padding-bottom:calc(var(--wg-16) * 2);color:var(--dsw-alias-label-primary,inherit);background:var(--dsw-alias-bg-base,transparent);font-size:14px;line-height:1.5;font-family:inherit}',

  '.wg-head,.wg-stats,.wg-section,.wg-banner{width:100%;max-width:880px;margin-left:auto;margin-right:auto;box-sizing:border-box}',
  '.wg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--wg-4);flex-wrap:wrap;padding-bottom:var(--wg-1)}',
  '.wg-title{margin:0;font-size:16px;font-weight:600;line-height:1.4;letter-spacing:.01em}',
  '.wg-sub{margin:var(--wg-1) 0 0;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-head-side{display:flex;align-items:center;gap:var(--wg-2);flex-wrap:wrap}',
  '.wg-transport{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:999px;padding:var(--wg-1) var(--wg-3);white-space:nowrap}',
  '.wg-transport-dry{color:var(--dsw-alias-state-warn-primary,#b45309);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 8%,transparent)}',

  '.wg-banner{border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);padding:var(--wg-3) var(--wg-4);font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);background:var(--dsw-alias-bg-layer-1,transparent)}',
  '.wg-banner-error{color:var(--dsw-alias-state-error-primary,#b91c1c);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#b91c1c) 40%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#b91c1c) 6%,transparent)}',
  '.wg-root.wg-dry .wg-banner:first-of-type{color:var(--dsw-alias-state-warn-primary,#b45309);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 35%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 6%,transparent)}',

  '.wg-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--wg-2)}',
  '.wg-stat{border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);padding:var(--wg-3) var(--wg-4);background:var(--dsw-alias-bg-layer-1,transparent)}',
  '.wg-stat b{display:block;font-size:20px;font-weight:600;line-height:1.2;font-variant-numeric:tabular-nums}',
  '.wg-stat span{display:block;margin-top:var(--wg-1);font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-stat-live b{color:var(--dsw-alias-brand-primary,#2563eb)}',
  '.wg-stat-good b{color:var(--dsw-alias-state-success-primary,#15803d)}',
  '.wg-stat-warn b{color:var(--dsw-alias-state-warn-primary,#b45309)}',

  '.wg-section{display:flex;flex-direction:column;gap:var(--wg-2)}',
  '.wg-section-head{display:flex;align-items:baseline;justify-content:space-between;gap:var(--wg-3)}',
  '.wg-section-head h4{margin:0;font-size:12px;font-weight:600;letter-spacing:.04em;color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-section-note{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-list{display:flex;flex-direction:column;gap:var(--wg-2)}',

  '.wg-card{display:flex;flex-direction:column;gap:var(--wg-3);border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);padding:var(--wg-4);background:var(--dsw-alias-bg-layer-1,transparent)}',
  '.wg-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--wg-3);flex-wrap:wrap}',
  '.wg-recipient{display:flex;align-items:center;gap:var(--wg-3);min-width:0}',
  '.wg-avatar{display:grid;place-items:center;width:32px;height:32px;border-radius:var(--wg-2);flex:none;background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 14%,transparent);color:var(--dsw-alias-brand-primary,#2563eb);font-weight:600;font-size:14px}',
  '.wg-who{min-width:0}',
  '.wg-who b{display:block;font-size:14px;font-weight:600;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.wg-id{display:block;margin-top:2px;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46ch}',
  '.wg-card-meta{display:flex;flex-direction:column;align-items:flex-end;gap:var(--wg-1);flex:none}',
  '.wg-count{font-size:12px;font-variant-numeric:tabular-nums}',
  '.wg-count-live{color:var(--dsw-alias-label-secondary,#7a7a7a)}',

  '.wg-quote{margin:0;display:flex;flex-direction:column;gap:var(--wg-2);padding:var(--wg-3);border-left:2px solid var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-radius:0 var(--wg-2) var(--wg-2) 0;background:color-mix(in srgb,var(--dsw-alias-label-primary,currentColor) 4%,transparent)}',
  '.wg-quote-head{display:flex;align-items:center;gap:var(--wg-2);flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-quote-label{font-weight:600;color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-quote-kind{font-size:12px;padding:0 var(--wg-2);border-radius:999px;border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28))}',
  '.wg-quote-sender{color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-quote-time{font-variant-numeric:tabular-nums}',
  '.wg-quote-text{margin:0;font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word}',
  '.wg-no-quote{border:1px dashed var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-radius:var(--wg-2);padding:var(--wg-2) var(--wg-3);font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}',

  '.wg-voice{display:flex;align-items:center;gap:var(--wg-2);flex-wrap:wrap;padding:var(--wg-2) var(--wg-3);border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);font-size:12px;background:var(--dsw-alias-bg-layer-2,transparent)}',
  '.wg-voice-src{color:var(--dsw-alias-label-primary,inherit)}',
  '.wg-voice-model{color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-conf{color:var(--dsw-alias-label-secondary,#7a7a7a);font-variant-numeric:tabular-nums}',
  '.wg-muted{color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-warn{color:var(--dsw-alias-state-warn-primary,#b45309)}',
  '.wg-transcript{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);background:var(--dsw-alias-bg-layer-2,transparent);border-radius:var(--wg-2);padding:var(--wg-2) var(--wg-3);white-space:pre-wrap;word-break:break-word}',

  '.wg-chip{display:inline-flex;align-items:center;font-size:12px;line-height:1.4;padding:0 var(--wg-2);border-radius:999px;border:1px solid transparent;white-space:nowrap}',
  '.wg-chip-voice{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 12%,transparent);color:var(--dsw-alias-brand-primary,#2563eb);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 28%,transparent)}',
  '.wg-chip-pending{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 12%,transparent);color:var(--dsw-alias-brand-primary,#2563eb);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 28%,transparent)}',
  '.wg-chip-sent{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#15803d) 12%,transparent);color:var(--dsw-alias-state-success-primary,#15803d);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#15803d) 28%,transparent)}',
  '.wg-chip-voided{background:color-mix(in srgb,var(--dsw-alias-label-primary,currentColor) 6%,transparent);color:var(--dsw-alias-label-secondary,#7a7a7a);border-color:var(--dsw-alias-border-l1,rgba(128,128,128,.28))}',
  '.wg-chip-expired{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 12%,transparent);color:var(--dsw-alias-state-warn-primary,#b45309);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 28%,transparent)}',
  '.wg-chip-dry{background:transparent;color:var(--dsw-alias-label-secondary,#7a7a7a);border-color:var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-style:dashed}',

  '.wg-field{display:flex;flex-direction:column;gap:var(--wg-1)}',
  '.wg-field-label{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-textarea{width:100%;box-sizing:border-box;min-height:96px;resize:vertical;border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-radius:var(--wg-2);padding:var(--wg-3);background:var(--dsw-alias-bg-base,transparent);color:inherit;font:inherit;font-size:14px;line-height:1.5}',
  '.wg-textarea:focus{outline:none;border-color:var(--dsw-alias-brand-primary,#2563eb);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary,#2563eb) 18%,transparent)}',
  '.wg-edit-meta{display:flex;gap:var(--wg-1);flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-dirty{color:var(--dsw-alias-state-warn-primary,#b45309)}',
  '.wg-card-error{margin:0;font-size:12px;color:var(--dsw-alias-state-error-primary,#b91c1c)}',

  '.wg-actions{display:flex;align-items:center;gap:var(--wg-2);padding-top:var(--wg-3);border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));flex-wrap:wrap}',
  '.wg-actions-spacer{flex:1}',
  '.wg-btn{font:inherit;font-size:12px;line-height:1.4;border-radius:var(--wg-2);padding:var(--wg-2) var(--wg-3);border:1px solid transparent;background:transparent;color:inherit;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s,opacity .15s}',
  '.wg-btn:disabled{opacity:.45;cursor:not-allowed}',
  '.wg-btn-ghost{border-color:var(--dsw-alias-border-l1,rgba(128,128,128,.28));color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-btn-ghost:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary,currentColor) 6%,transparent);color:var(--dsw-alias-label-primary,inherit)}',
  '.wg-btn-secondary{border-color:var(--dsw-alias-border-l2,rgba(128,128,128,.45));color:var(--dsw-alias-label-primary,inherit)}',
  '.wg-btn-secondary:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary,currentColor) 6%,transparent)}',
  '.wg-btn-primary{background:var(--dsw-alias-label-primary,currentColor);border-color:var(--dsw-alias-label-primary,currentColor);color:var(--dsw-alias-bg-base,#fff);font-weight:500}',
  '.wg-btn-primary:hover:not(:disabled){opacity:.9}',
  '.wg-btn-danger-ghost{border-color:transparent;color:var(--dsw-alias-state-error-primary,#b91c1c);padding-left:0}',
  '.wg-btn-danger-ghost:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#b91c1c) 8%,transparent)}',

  '.wg-history{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28));border-radius:var(--wg-2);overflow:hidden}',
  '.wg-history-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:var(--wg-3);padding:var(--wg-3) var(--wg-4)}',
  '.wg-history-row + .wg-history-row{border-top:1px solid var(--dsw-alias-border-l1,rgba(128,128,128,.28))}',
  '.wg-history-main{min-width:0}',
  '.wg-history-title{font-size:14px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.wg-history-title b{font-weight:500}',
  '.wg-history-reason{margin-top:2px;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);word-break:break-word}',
  '.wg-history-time{font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a);font-variant-numeric:tabular-nums;white-space:nowrap}',

  '.wg-empty{display:flex;flex-direction:column;align-items:center;gap:var(--wg-1);padding:var(--wg-6) var(--wg-4);border:1px dashed var(--dsw-alias-border-l2,rgba(128,128,128,.45));border-radius:var(--wg-2);text-align:center;font-size:12px;color:var(--dsw-alias-label-secondary,#7a7a7a)}',
  '.wg-empty b{font-size:14px;font-weight:500;color:var(--dsw-alias-label-primary,inherit)}',
  '.wg-empty-small{padding:var(--wg-4)}',

  '@media (max-width:720px){.wg-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.wg-card-head{flex-direction:column;align-items:stretch}.wg-card-meta{flex-direction:row;align-items:center;justify-content:space-between}.wg-actions-spacer{display:none}.wg-actions .wg-btn-primary{margin-left:auto}}',
].join('')
