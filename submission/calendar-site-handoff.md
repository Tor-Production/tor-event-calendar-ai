# Nembli installation and release handoff

State on **29 September 2026**. Package release version **0.2.1** supplies the explicit `tor-event-calendar` skill, remote Nembli MCP configuration and optional local CLI. The primary guide is `https://nembli.com/connect-ai`; GitHub Pages is a compatibility guide. A package release does not establish directory publication or native OAuth acceptance.

## Website configuration

[`docs/install-config.json`](../docs/install-config.json) contains:

| Key | Value | Use |
| --- | --- | --- |
| `displayName` | `Nembli` | Customer-facing name. |
| `siteURL` | `https://nembli.com/connect-ai` | Canonical AI guide. |
| `calendarURL` | `https://nembli.com/` | Sign-in and account management. |
| `mcpURL` | `https://nembli.com/mcp` | Optional manual Streamable HTTP connection. |
| `listingURL` | `null` | No verified public directory install URL. |
| `listingStatus` | `draft` | Keep the directory action pending. |

Homepage is `https://nembli.com`; privacy `/privacy`; AI integration terms `/ai/terms`. The terms page covers this public integration. Enable the **Install Nembli plugin** action only after Nembli's own public directory URL is verified and the state is `published`. Do not substitute the draft URL, a private app or an unrelated listing. Manual MCP connects the tools without installing the skill.

## Connection and migration contract

| Item | Value |
| --- | --- |
| MCP resource/audience | `https://nembli.com/mcp` |
| Protected-resource metadata | `https://nembli.com/.well-known/oauth-protected-resource/mcp` |
| Authorization issuer | `https://nembli.com/api/v1/auth` |
| Authorization metadata | `https://nembli.com/.well-known/oauth-authorization-server/api/v1/auth` |
| Scopes | `calendar.read`, `calendar.manage`, optional `offline_access` |
| Access/refresh lifetime | 900 seconds / 30 days with refresh rotation |
| Identity | Stable ID from authenticated `get_profile`, plus verified email/nickname when available |

Use live metadata during client integration. Old-origin grants never migrate by redirect or website account switching. New CLI connections default to Nembli; saved profiles and keyring credentials keep their original origin. Complete fresh browser consent, verify the new profile/read, then deliberately revoke an older connection if desired. [Migration steps](../skills/tor-event-calendar/references/connections.md#moving-an-existing-connection-to-nembli)

The existing Worker and storage continue to serve the calendar. Calendar writes never publish or schedule social posts; File bytes use authenticated browser-owned links, not MCP JSON. Stable package/repository ID `tor-event-calendar-ai`, skill/MCP ID `tor-event-calendar` and command `tor-calendar` remain unchanged.

## Release and verification

- [0.2.1 release](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.2.1): `tor-event-calendar-ai-0.2.1.tgz`, `tor-event-calendar-ai-plugin-0.2.1.zip`, `tor-event-calendar-ai-skill-0.2.1.zip` and `SHA256SUMS`. The skill ZIP has seven files inside `tor-event-calendar/`.
- Published v0.1.0 compatibility artifacts remain unchanged. New installations should use 0.2.1.
- The package site is served from `main:/docs`. Verify its Pages build and actual release assets before changing the private site's download version to 0.2.1.
- Coordinated Nembli deployment passed nine live server CRUD/compatibility groups without resetting existing records. Server checks and temporary local plugin installation do not establish native Nembli OAuth.
- Nembli domain verification and the pre-release Nembli skill scan passed in the existing OpenAI draft. The final release's skill references changed: upload these exact bytes and obtain a new scan result. Tools scan, native OAuth/new-session/refresh, reviewer materials and policy review remain pending.

Record exact hashes through the release's generated `SHA256SUMS`; the plugin ZIP does not contain its own checksum. Keep GitHub package, Pages deployment, OAuth acceptance and public directory publication as separate observed states. [Submission status](status.md)
