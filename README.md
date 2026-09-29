# Nembli AI · 0.2.0 candidate

Manage your own calendar through one plugin that combines an explicitly invoked skill with a remote, account-scoped MCP server. Nembli runs on the existing calendar Cloudflare Worker. The intended Codex flow is **install plugin → sign in and choose a calendar account in the browser → review and allow scopes → start a new task**. A customer does not need Node, a local helper, an API token, or a separate MCP URL for this route.

**Directory status:** the [OpenAI Platform submission is still a draft](submission/status.md). There is no verified public listing or install URL yet. The updated [installation-page source](docs/index.html) shows that pending state and a clearly labeled manual MCP fallback; the [Nembli installation guide](https://nembli.com/connect-ai) is the primary destination, with [GitHub Pages](https://tor-production.github.io/tor-event-calendar-ai/) as a compatibility fallback. Source changes require their respective deployment before they appear online. Do not use a private test app or another plugin's listing as the calendar install link. The latest published GitHub release is [v0.1.0](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.1.0); 0.2.0 is not yet a published release.

## How the combined plugin works

The package's root [`plugin.json`](plugin.json) supplies the stable technical identity `tor-event-calendar-ai`, display metadata, and version. [`mcp.json`](mcp.json) supplies the remote Streamable HTTP endpoint `https://nembli.com/mcp`. [`skills/tor-event-calendar/SKILL.md`](skills/tor-event-calendar/SKILL.md) supplies the workflow, with implicit invocation disabled; explicitly request `$tor-event-calendar` when you want that guidance. The skill loads detailed references only for the relevant operation. The MCP server supplies live data, authorization, and 14 account-scoped tools; installing the skill alone does not grant account access. See the [package and submission distinction](submission/status.md) and [OpenAI's plugin packaging guide](https://developers.openai.com/plugins/build/plugins).

The browser consent binds a grant to one selected calendar account and the exact MCP resource. `get_profile` returns its stable account ID and available verified email/label so you can distinguish connections. If multiple connected accounts could satisfy a request, select one before private lookups or writes. The server advertises `calendar.read`, `calendar.manage`, and optional `offline_access` for refresh; grant only the scopes you intend to use. The user can revoke an individual connection in the calendar account UI. Changing the website account does not transfer an existing MCP grant, and changing the MCP origin requires a new grant. Never paste credentials into a prompt or package file. [Connection contract](skills/tor-event-calendar/references/connections.md) · [server handoff](submission/calendar-site-handoff.md)

Use an exact date, time, and IANA timezone for scheduled events. The skill asks only for missing platform-specific values and preserves arbitrary `customFields` with explicit `customFieldTypes`. A missing post body can be an explicitly chosen empty draft or supplied material. File fields use named, typed attachment metadata and a browser-owned upload link; file bytes do not pass through MCP JSON. Calendar writes never publish or schedule social posts, and `publication_automated` requires confirmed end-to-end publishing evidence. A request to “find today's posts and publish now” must first resolve account, local day, targets, and actual publishing capability; the calendar tools cannot perform the publication. [API reference](skills/tor-event-calendar/references/api.md) · [publication rules](skills/tor-event-calendar/references/publication.md)

After the public listing is approved and published, open **Nembli** by **Tor Production** in the Plugins Directory, select **+**, complete browser sign-in and consent when prompted, then start a new Codex task. The public directory is shared by ChatGPT and Codex, but native combined-plugin installation, canonical-domain Codex OAuth, account labeling, refresh, and tool calls are still acceptance gates for this candidate. The existing server's SDK and private ChatGPT connection results do not by themselves pass those plugin gates. [OpenAI install guide](https://learn.chatgpt.com/docs/plugins) · [current evidence](submission/status.md)

## Moving to Nembli

Use [Nembli](https://nembli.com), the [AI installation guide](https://nembli.com/connect-ai), and [privacy policy](https://nembli.com/privacy). Stable package, command and skill IDs remain `tor-event-calendar-ai`, `tor-calendar`, and `tor-event-calendar`.

Existing connections to `eventcalendar.torproduction.com` or workers.dev keep their original origin. OAuth grants do not transfer to Nembli: configure `https://nembli.com/mcp`, sign in again, choose the intended account and approve the new grant, then verify the account before revoking an old connection. The 0.2.0 CLI defaults new pairing to Nembli while preserving stored profiles and OS credentials. The published v0.1.0 client can use `tor-calendar connect --origin https://nembli.com --default`. See [connection migration](skills/tor-event-calendar/references/connections.md#moving-an-existing-connection-to-nembli) for exact steps and profile selection.

## Optional local CLI from v0.1.0

The [v0.1.0 local client](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.1.0) remains available for advanced or offline-compatible workflows. It is a separate route; customers installing the future public plugin should not run these commands to make MCP work.

```sh
npm install -g https://github.com/Tor-Production/tor-event-calendar-ai/releases/download/v0.1.0/tor-event-calendar-ai-0.1.0.tgz
tor-calendar install-skill codex
tor-calendar connect
tor-calendar whoami
```

The local CLI requires Node 22.18+ and an unlocked OS keychain. Its browser pairing, account selection, and `--scope read` mode remain documented in [connections](skills/tor-event-calendar/references/connections.md). It can install local skill directories for Claude Code, Hermes, Gemini CLI, Cursor, and GitHub Copilot CLI; those host installations are separate from the remote plugin and are not native-host acceptance evidence. Its `doctor`, `preferences`, `publish-today`, upgrade, and uninstall commands remain available in v0.1.0. The CLI has no live social publishing credentials; its publication workflow reports capability blocks rather than claiming a post was published.

## Source validation and support

For the 0.2.0 candidate, run `npm ci --ignore-scripts`, `npm test`, `npm pack --pack-destination dist`, `python scripts/package.py`, and `python scripts/test_package.py` from a clean source checkout. The packaging script creates deterministic plugin and standalone skill ZIPs; the standalone ZIP places all skill files under `tor-event-calendar/`, the layout whose previous portal scan passed. A local package test is distinct from installing the combined plugin in Codex and from approval in the public directory. Final artifact checksums will be recorded only after the final package is built. See [evaluation cases](submission/test-cases.md) and [release notes](submission/release-notes.md).

Report package issues at [GitHub Issues](https://github.com/Tor-Production/tor-event-calendar-ai/issues). The calendar application's source repository and its server secrets remain private; no secret belongs in this public package.
