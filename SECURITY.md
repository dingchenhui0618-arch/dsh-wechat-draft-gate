# Security

## Threat model

This plugin is an **outbound gate**, not a WeChat client.

- It stores drafts, quoted inbound text, and voice transcripts in
  `$DSH_HOME/wechat-draft-gate/` on the local machine. That directory is local
  application state and must not be committed or shared.
- It never stores WeChat credentials, cookies, tokens, or login material.
- The only network request it can make is the configured `transportUrl`
  (plus nothing at all when no URL is configured: dry-run).
- It does not bypass the Harness permission layer, tool approval, filesystem
  permissions, or sandbox policy.

## Secrets

- Prefer `transportTokenEnv` over `transportToken` so no bearer token is
  written into `cordis.patch.yml`.
- The advertised transport endpoint redacts URL query strings, so a token in
  `?token=...` is not echoed into the panel state.
- Draft payloads may contain personal conversation text. Treat `drafts.json`,
  `ledger.jsonl`, and any bridge capture files as private data.

## Exposure

The panel/bridge API is registered on the Harness web server under
`/dsh-wechat-draft-gate`. That route does not add its own login layer; the
Harness server's browser session is the boundary. Treat the port (3080 by
default) like a local admin socket:

- do not expose it to untrusted networks;
- if you tunnel it, put an authenticating reverse proxy in front;
- keep `transportUrl` on loopback unless the bridge itself is authenticated.

Any local process that can reach the port can call `/confirm`. That is the same
trust model as the Harness UI itself, not a separate grant.

## The one promise

There is no automatic send path. A draft leaves the pending state only through:

1. `POST /confirm` from the panel button (human),
2. the `/send <id>` command (human),

or it expires with a recorded reason. If you add another caller to the confirm
path, you have removed the gate; don't.

## Reporting

Open an issue at
https://github.com/dingchenhui0618-arch/dsh-wechat-draft-gate/issues
without pasting real conversation content, tokens, or state files.
