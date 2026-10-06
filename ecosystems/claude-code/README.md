# nambli for Claude Code

Connect Claude Code to your calendar at `https://nambli.com/mcp`, approve the intended account in your browser, then verify it with `get_profile`. A skill alone cannot connect an account. Calendar writes save drafts; they never publish LinkedIn posts or send email.

Implementation: [#69](https://github.com/Tor-Production/tor-event-calendar/issues/69). Native verification and subsequent fixes: [#79](https://github.com/Tor-Production/tor-event-calendar/issues/79). Shared file guidance/download: [#65](https://github.com/Tor-Production/tor-event-calendar/issues/65) / [#66](https://github.com/Tor-Production/tor-event-calendar/issues/66). Version 0.3.2 includes this source integration. Source/package validation does not establish the separate native acceptance result; existing v0.3.0 assets and the OpenAI submission are unchanged.

## Supported host

Target the **local Claude Code terminal**, v2.1.283 or later, on a [supported OS](https://code.claude.com/docs/en/setup#system-requirements). This baseline includes the documented MCP manifest checks. Record `claude --version` during native acceptance; this is a documentation compatibility target, not a claim of a tested native version. Claude Code requires a [Pro, Max, Team or Enterprise subscription, Console account, or supported provider](https://code.claude.com/docs/en/quickstart). Your organization's MCP/plugin policy must permit this server. nambli consent is separate from Claude login.

Official documentation reviewed on 2026-10-01: [HTTP MCP and OAuth](https://code.claude.com/docs/en/mcp), [plugin manifests](https://code.claude.com/docs/en/plugins-reference), [marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), [installation](https://code.claude.com/docs/en/discover-plugins), and [explicit skill invocation](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill). Remote MCP use needs no Node runtime or local helper. The optional helper needs Node 22.18+ and an unlocked OS keychain. Claude web/Desktop connectors and Claude Code cloud sessions have different setup and are outside this local package target.

## Choose one connection route

First inspect `claude mcp list`, `claude plugin list` and `/mcp`. Preserve unrelated servers and accounts. Reuse an existing correct nambli connection. Avoid connecting the plugin and manual MCP route simultaneously: each grant can select a different account and exposes another tool namespace.

### Native plugin from this source

The root `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.mcp.json` and shared `skills/nambli` are the native entry points. The plugin package ID remains `tor-event-calendar-ai`; both the explicit skill and MCP connection are named `nambli`.

For review, run from this checked-out branch:

```sh
claude plugin validate . --strict
claude --plugin-dir .
```

`--plugin-dir` loads this source for that session without changing your installed plugin or marketplace. In Claude Code, open `/mcp`, select the plugin's nambli server, and authenticate in the browser. Invoke `/tor-event-calendar-ai:nambli` explicitly when you want the skill. Its frontmatter disables model invocation.

For a persistent **development** installation from this branch (keep the quotes around the source):

```sh
claude plugin marketplace add "Tor-Production/tor-event-calendar-ai#codex/feature/claude-code-connector"
claude plugin install tor-event-calendar-ai@nambli --scope local
```

Run the install from the project where you want it enabled. If a Claude marketplace named `nambli` already exists, inspect its registered source in `/plugin` first; update the intended source deliberately instead of removing it or other installed plugins. After merge, a maintainer can use `#develop` for development. Use the reviewed `v0.3.2` release ref for this source distribution. The existing Codex marketplace is separate and unchanged.

Refresh an intentionally selected development marketplace with `claude plugin marketplace update nambli`, then `claude plugin update tor-event-calendar-ai@nambli`. Start a fresh session. Local `--plugin-dir` testing reads the source directly; hosted plugin updates remain subject to version pinning, so use `--plugin-dir` when checking unversioned development edits. Refreshing a package does not transfer OAuth grants or choose an account.

### Remote MCP without the packaged skill

This route works independently of a Claude marketplace. From the project where you want access, run:

```sh
claude mcp add --transport http --scope local nambli https://nambli.com/mcp
claude
```

`local` stores this connection for you in the current project. Choose `--scope user` explicitly if you want it across projects, or `--scope project` to add only this entry to a shared `.mcp.json`. The [mcp.json example](mcp.json) shows that project shape; merge its `mcpServers.nambli` entry, never replace a whole existing configuration. If that key already points elsewhere, preserve it and deliberately choose another name or migrate it after comparing accounts. Do not overwrite a connection or copy its tokens.

Open `/mcp` and authenticate. Let the host discover OAuth metadata and register its client; no static Authorization header, client secret or manually pasted token belongs in this configuration. If the CLI or MCP is unavailable, the [public setup guide](https://nambli.com/connect-ai) and [authenticated calendar](https://nambli.com/) remain usable before a connector is installed. Report the missing connection; do not pretend a tool ran.

## Verify identity, tools and reconnection

Consent binds to one stable calendar account and exact server origin. Review the verified email, selected account and requested permissions. `calendar.read` permits reads; `calendar.manage` permits writes and upload actions; `offline_access` supports refresh. Inspect actual `/mcp` tools separately from `get_capabilities`. Read grants may expose fewer tools.

Try this in Claude Code:

```text
Use nambli to call get_profile and show the stable account ID and verified email. After I confirm the intended account, list today's events in Europe/Kyiv with limit 5. Read full content only for an exact event I select. Report actual available file tools separately from server capability claims. Do not write anything.
```

An observed `get_profile` result plus a bounded successful read verifies the connection. A configured URL, successful manifest check, website login or tool inventory alone does not. Plugin tools use `mcp__plugin_tor-event-calendar-ai_nambli__TOOL`; manual tools use `mcp__nambli__TOOL`. Use the names actually exposed in your session.

Claude Code refreshes OAuth through the host. If it requests authentication, select **Re-authenticate** on the same server in `/mcp`; on versions that provide it, `claude mcp login nambli` supports the manually configured server. Keep callback URLs in the host's authentication UI. Verify `get_profile` again after reconnecting. Changing the browser login does not change the saved grant. Inspect/revoke exact account grants in [Connections & tokens](https://nambli.com/?settings=connections), then confirm the revoked connection fails; preserve unrelated grants. A grant for an older domain needs new consent for nambli.

## Files and capabilities

The [Claude Code workflow](../../skills/nambli/references/claude-code.md) contains the runtime instructions loaded by the explicit skill.

| Operation | Implemented route | What still needs native proof |
| --- | --- | --- |
| Connect and refresh | HTTP MCP, browser OAuth, `/mcp` | Actual CLI/plan, account identity, refresh/revocation |
| Read/create/edit | Exposed calendar tools, stable UUID and current revision | Disposable persisted draft and return from another session |
| Local image/PDF upload | Authenticated `get_file_upload_link` browser form; optional independently paired local helper | Correct File field, stable upload ID, metadata and bytes |
| Remote `upload_file` | Requires host temporary OpenAI/Azure file metadata | No Claude Code bridge demonstrated; local paths are unsupported |
| Saved file download | Shared `get_file_download`, authenticated resource up to 512 KiB, browser page or versioned local helper | Byte/hash equality and whether Claude can access the resulting file |
| Social publication/email | Separate authorized integrations | A calendar draft proves no publication or sending capability |

Do not equate attachment metadata, an authenticated action link, or server file capability flags with bytes in Claude's context. Use synthetic files for checks. The browser fallback performs its own account and event verification and enforces 25 MiB per file; it does not consume a local path from the chat.

The [shared download contract](download-contract.json) records #66's exact inputs and delivery choices. Discover `get_file_download` in your current session and pass `eventId`, `eventRevision`, `attachmentId`, and the exact `fieldName`. The response has `bytesDelivered: false`, an authenticated `browserUrl`, and a resource link only for files at most 512 KiB. Use connected `resources/read` only when Claude Code actually makes it available; otherwise open `browserUrl` and choose **Download file**. A missing tool means the current server/host has not exposed it: refresh and use the authenticated event editor's filename download meanwhile. The helper `download` command is included in the 0.3.2 source/tarball; check its installed version before use. Native resource delivery remains unverified until #79.

## Validation and disposable draft

From the repository root with Python 3.10+:

```sh
python scripts/claude_code.py validate
python scripts/test_claude_code.py
python scripts/claude_code.py build
python scripts/claude_code.py probe
```

`validate` checks focused source/configuration invariants. `build` creates a deterministic development ZIP and receipt in `dist/claude-code/`, using Git-tracked source only; stage intended new source files before a development build. It exports no private code and publishes no assets. Extract the ZIP and use `claude --plugin-dir PATH_TO_EXTRACTED_ROOT`; persistent marketplace installation uses the repository's catalog, which is outside this focused ZIP. `probe` sends only an unauthenticated initialization request and reads public OAuth metadata; it must observe authentication required. It never registers an OAuth client, accesses an account or writes an event. These checks establish package/config/discovery evidence only. `claude plugin validate . --strict` remains the host's authoritative validation when its binary is available.

Follow [NATIVE-VERIFICATION.md](NATIVE-VERIFICATION.md) for #79. The supplied fixture is a disposable synthetic LinkedIn calendar draft; the owner still selects a real brief and quality criterion for [#41](https://github.com/Tor-Production/tor-event-calendar/issues/41). Native acceptance requires an installed authorized Claude host and account. Leave unavailable steps unverified in #79; do not publish posts or send email during connector checks.
