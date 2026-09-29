# Calendar-site installation handoff

State on **29 September 2026**. This public package is a **0.2.0 candidate** for one installed plugin with an explicit Tor Event Calendar skill and a hosted remote MCP connection. This file is for the calendar website's `/connect-ai` integration; it is not evidence of a published directory listing or completed Codex OAuth. The server maintainer keeps the authoritative implementation and acceptance ledger outside this public package; use the exact live OAuth metadata during integration. Do not expose private server source, credentials or database/storage data in the website or this package.

## Website configuration and button gate

The package site owns [`docs/install-config.json`](../docs/install-config.json). These are the current exact keys and values:

| Key | Current value | Calendar-site use |
| --- | --- | --- |
| `displayName` | `Tor Event Calendar` | Customer-facing label; can change in a later coordinated brand release. |
| `siteURL` | `https://tor-production.github.io/tor-event-calendar-ai/` | Stable public installation guide. |
| `calendarURL` | `https://eventcalendar.torproduction.com/` | Calendar sign-in/account management. |
| `mcpURL` | `https://eventcalendar.torproduction.com/mcp` | Optional manual Streamable HTTP fallback, never a required second step after plugin installation. |
| `listingURL` | `null` | **Exact install URL blocker:** no verified public calendar listing exists yet. |
| `listingStatus` | `draft` | Show a pending state. Do not render an active “Install plugin” action while this remains `draft`. |

The website should place **Install Tor Event Calendar plugin** as its primary route once `listingURL` is set to the calendar's *own verified, public* Plugins Directory listing and `listingStatus` is `published`. Until then, show the honest pending state, link to the guide, and keep **Manual MCP setup** separately labeled as a fallback. Manual MCP setup supplies tools only; the directory plugin is intended to supply both skill and remote MCP connection. Do not use the Platform draft URL, either private ChatGPT test app, the Session Exporter listing, or an unverified `codex://` deep link. A Codex install deep link works only for a marketplace already known to Codex. [Codex link rules](https://learn.chatgpt.com/docs/reference/commands#plugins) · [public directory flow](https://developers.openai.com/plugins/deploy/app-review)

The website can mirror these configuration values in its own deployment; it should not assume that cross-origin fetching the package-site JSON will work without checking its actual CORS response. Keep the install section and fallback reachable through stable anchors on desktop and mobile and after tab/app focus changes. After a verified listing becomes available, test its destination, publisher, installation, browser sign-in/consent, new-session availability and account label before enabling the button.

## Connection contract

| Item | Exact value or behavior |
| --- | --- |
| Streamable HTTP MCP resource and audience | `https://eventcalendar.torproduction.com/mcp` |
| Protected-resource metadata | `https://eventcalendar.torproduction.com/.well-known/oauth-protected-resource/mcp` |
| Authorization-server issuer | `https://eventcalendar.torproduction.com/api/v1/auth` |
| Authorization-server metadata | `https://eventcalendar.torproduction.com/.well-known/oauth-authorization-server/api/v1/auth` |
| Scopes | `calendar.read`, `calendar.manage`, optional `offline_access` for refresh |
| Access / refresh lifetime | 900 seconds / 30 days, with refresh rotation |
| Account identity | Stable calendar account ID from authenticated `get_profile`, with verified email/nickname where available |

The server is hosted on the existing Cloudflare Worker. Browser sign-in and explicit MCP consent choose a calendar account; a grant stays bound to that account, client and exact resource origin. Website account switching does not move a grant. A later display-brand change can retain stable technical IDs, but a new MCP origin/issuer needs fresh OAuth consent; redirects do not migrate access. No API token, bearer secret, local Node helper or proxy belongs in the basic Codex installation. Calendar CRUD and File links do not publish or schedule social posts. File bytes travel through the authenticated browser-owned link, not MCP JSON.

The private server handoff records a deployed canonical-domain SDK read pass and a private ChatGPT persistent three-scope refresh pass. It also records native local Codex **Not logged in** after automatic approval review stopped its exact new consent. These are distinct hosts and grants. Do not claim full installed-plugin OAuth, canonical-domain Codex CRUD/File or public listing acceptance from those observations.

## Release and acceptance fields to fill

| Field | Current value |
| --- | --- |
| Package technical name | `tor-event-calendar-ai` (stable) |
| Candidate version | `0.2.0` (source candidate; **not released**) |
| Published compatibility release | [v0.1.0](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.1.0), local CLI/skill |
| Combined plugin artifact | `tor-event-calendar-ai-plugin-0.2.0.zip` built and validated locally; current checksum is in `dist/SHA256SUMS`, with final rebuild after source freeze |
| Standalone skill artifact | `tor-event-calendar-ai-skill-0.2.0.zip` built and validated locally; uploaded to the draft and safety scan **Passed** |
| Public source / PR | `codex/fix/skill-zip-layout` in [draft PR #1](https://github.com/Tor-Production/tor-event-calendar-ai/pull/1) targeting `develop`; awaiting review and merge |
| Verified public listing/install URL | **None**; `listingURL: null`, `listingStatus: draft` |
| Portal state | Existing [With MCP draft](status.md), saved with canonical MCP/OAuth, current skill safety scan **Passed** after Continue, Back and reload, and **Domain verified** after the canonical Worker challenge returned exact plaintext over HTTPS; **not submitted or published** |
| Server deployment | Existing Cloudflare Worker on the canonical domain; deployment and acceptance provenance are retained in the private server ledger |
| Consent / production gates | Temporary local ZIP installation and skill safety scan passed; account OAuth and new-session tool/read/refresh remain unverified. The portal Submit screen currently flags a demo recording URL, MCP tool scan, test case scenario, and unchecked policy attestations. The tool scan awaits explicit account consent. Review and publication remain pending. |

The packaging owner will fill the listing URL only after it is verified and public; release artifact hashes remain in the generated `dist/SHA256SUMS` so the ZIP does not contain its own checksum. The calendar-site owner can integrate this contract now while leaving the install button inactive. The official [package guide](https://developers.openai.com/plugins/build/plugins) and [submission guide](https://developers.openai.com/plugins/deploy/submission) define the local package and public With MCP paths.
