# Nembli AI · 0.2.1

Connect an AI workspace to your Nembli calendar through account-scoped remote MCP tools or the optional local CLI. This release also packages the explicitly invoked `tor-event-calendar` skill with the remote MCP definition. Nembli runs on the existing calendar Cloudflare Worker.

**Downloads:** [v0.2.1 release and checksums](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.2.1) · [combined plugin ZIP](https://github.com/Tor-Production/tor-event-calendar-ai/releases/download/v0.2.1/tor-event-calendar-ai-plugin-0.2.1.zip) · [standalone skill ZIP](https://github.com/Tor-Production/tor-event-calendar-ai/releases/download/v0.2.1/tor-event-calendar-ai-skill-0.2.1.zip). The skill ZIP contains one `tor-event-calendar/` folder. The [v0.1.0 release](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.1.0) remains available for compatibility.

**OpenAI directory:** the [With MCP submission remains a draft](https://github.com/Tor-Production/tor-event-calendar-ai/blob/main/submission/status.md); no public listing or directory install URL is verified. A GitHub package release does not establish directory approval or native OAuth acceptance. For current connection choices, use the [Nembli AI guide](https://nembli.com/connect-ai), with [GitHub Pages](https://tor-production.github.io/tor-event-calendar-ai/) as a compatibility guide. Do not use a private test app or another plugin's listing as a Nembli install link.

## Remote tools and the combined plugin

The remote Streamable HTTP endpoint is `https://nembli.com/mcp`. A client that supports browser OAuth can add it manually; this connects the tools without installing the skill. The combined package supplies both the remote definition in [`mcp.json`](mcp.json) and the explicitly invoked workflow in [`skills/tor-event-calendar/SKILL.md`](skills/tor-event-calendar/SKILL.md). Implicit invocation is disabled; request `$tor-event-calendar` when you want the skill. Installing a skill alone does not grant account access.

After a future public listing is approved and published, the intended directory flow is **install Nembli by Tor Production → sign in and choose a calendar account → review scopes → start a new task**. That route needs no local Node helper, API token or separate MCP URL. Native combined-plugin OAuth, account labeling, fresh-session tool calls and refresh remain acceptance gates; existing server checks and a local package installation are separate evidence. [Package guide](https://developers.openai.com/plugins/build/plugins) · [current evidence](https://github.com/Tor-Production/tor-event-calendar-ai/blob/main/submission/status.md)

Browser consent binds a grant to one selected calendar account and the exact MCP resource. `get_profile` returns a stable account ID and available verified email/label. If several connected accounts could satisfy a request, select one before private lookups or writes. The server advertises `calendar.read`, `calendar.manage`, and optional `offline_access` for refresh. Revoke an individual connection through calendar account settings. Changing website accounts or MCP origins does not transfer a grant; never paste credentials into a prompt or package file.

Use an exact date, time and IANA timezone. The skill preserves arbitrary `customFields`, explicit `customFieldTypes` and File metadata. File bytes use authenticated browser-owned links rather than MCP JSON. Calendar writes never publish or schedule social posts, and `publication_automated` requires confirmed end-to-end automatic publishing evidence. Actual publication requires a separate authorized publisher. [API guide](skills/tor-event-calendar/references/api.md) · [publication rules](skills/tor-event-calendar/references/publication.md)

## Optional local CLI

Use Node 22.18+ and an unlocked OS keychain:

```sh
npm install -g https://github.com/Tor-Production/tor-event-calendar-ai/releases/download/v0.2.1/tor-event-calendar-ai-0.2.1.tgz
tor-calendar install-skill codex
tor-calendar connect --origin https://nembli.com --default
tor-calendar whoami
```

The CLI is a separate connection route. It can install local skills for Codex, Claude Code, Hermes, Gemini CLI, Cursor and GitHub Copilot CLI. Those directory adapters are not evidence of native-host OAuth acceptance. Browser pairing, explicit account selection and `--scope read` are documented in [connections](skills/tor-event-calendar/references/connections.md#optional-local-cli). The CLI includes `doctor`, `preferences` and `publish-today`; it has no live social publishing credentials and reports capability blocks instead of claiming publication.

## Moving an existing connection to Nembli

The current home is [nembli.com](https://nembli.com), with [privacy](https://nembli.com/privacy) and [AI integration terms](https://nembli.com/ai/terms). Package/repository ID `tor-event-calendar-ai`, command `tor-calendar`, and skill/MCP ID `tor-event-calendar` stay stable.

Existing connections to `eventcalendar.torproduction.com` or workers.dev keep their saved origin. Configure `https://nembli.com/mcp`, sign in again, choose the intended account and approve a fresh grant. Verify its profile and a bounded read before deliberately revoking an older connection. The 0.2.0 CLI defaults new pairing to Nembli while preserving old profiles and OS credentials. A v0.1.0 client can also use `tor-calendar connect --origin https://nembli.com --default`; upgrading never silently rewrites its stored origin. See [migration steps](skills/tor-event-calendar/references/connections.md#moving-an-existing-connection-to-nembli).

## Source validation and support

From a clean checkout, run `npm ci --ignore-scripts`, `npm test`, create `dist/`, then run `npm pack --pack-destination dist`, `python scripts/package.py`, and `python scripts/test_package.py`. The scripts build deterministic ZIPs, compare packaged content and metadata with source, and verify the three hashes in `dist/SHA256SUMS`. A package test does not establish directory approval or native OAuth acceptance. [Evaluation cases](https://github.com/Tor-Production/tor-event-calendar-ai/blob/main/submission/test-cases.md) · [release notes](https://github.com/Tor-Production/tor-event-calendar-ai/blob/main/submission/release-notes.md)

Report package issues at [GitHub Issues](https://github.com/Tor-Production/tor-event-calendar-ai/issues). The calendar application's source repository and server secrets remain private; no secret belongs in this public package.
