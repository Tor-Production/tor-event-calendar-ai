# Nembli installation handoff

State on **29 September 2026**. This 0.2.0 candidate packages the explicitly invoked `tor-event-calendar` skill with the Nembli remote MCP connection. The primary public AI guide is `https://nembli.com/connect-ai`; the package's GitHub Pages site remains a compatibility guide. Source configuration does not prove deployment, OAuth acceptance or directory publication. Server deployment and account-specific evidence remain in the private server ledger.

## Website configuration

The package site owns [`docs/install-config.json`](../docs/install-config.json):

| Key | Value | Use |
| --- | --- | --- |
| `displayName` | `Nembli` | Customer-facing name. |
| `siteURL` | `https://nembli.com/connect-ai` | Primary AI installation guide and canonical guide URL. |
| `calendarURL` | `https://nembli.com/` | Calendar sign-in and account management. |
| `mcpURL` | `https://nembli.com/mcp` | Optional manual Streamable HTTP fallback. |
| `listingURL` | `null` | No verified public directory install link. |
| `listingStatus` | `draft` | Show the pending state. |

Once Nembli's own public directory URL is verified and `listingStatus` is `published`, enable the **Install Nembli plugin** action. Until then, keep the pending state and clearly labeled manual MCP fallback. Manual setup connects tools only. Do not substitute a Platform draft, private test app, unrelated listing or guessed deep link. The server can mirror the configuration directly; do not assume cross-origin JSON fetching works without checking CORS.

Public metadata uses homepage `https://nembli.com`, privacy `https://nembli.com/privacy`, and terms `https://tor-production.github.io/tor-event-calendar-ai/terms.html`. The Worker currently has no `/terms` route. Package/repository ID `tor-event-calendar-ai`, skill/MCP ID `tor-event-calendar`, and command `tor-calendar` stay stable.

## Connection contract

| Item | Value |
| --- | --- |
| Streamable HTTP resource and audience | `https://nembli.com/mcp` |
| Protected-resource metadata | `https://nembli.com/.well-known/oauth-protected-resource/mcp` |
| Authorization-server issuer | `https://nembli.com/api/v1/auth` |
| Authorization-server metadata | `https://nembli.com/.well-known/oauth-authorization-server/api/v1/auth` |
| Scopes | `calendar.read`, `calendar.manage`, optional `offline_access` |
| Access / refresh lifetime | 900 seconds / 30 days, with refresh rotation |
| Identity | Stable account ID from authenticated `get_profile`, with verified email/nickname when available |

Use the exact live metadata during integration. A new Nembli connection requires browser sign-in, account choice and fresh OAuth consent. Old grants remain bound to their previous origin; redirects and website account switching do not transfer them. Existing CLI profiles keep their saved origin and keyring credentials. New 0.2.0 CLI connections default to Nembli. Verify the new connection before deliberately revoking an older one; [migration steps](../skills/tor-event-calendar/references/connections.md#moving-an-existing-connection-to-nembli) include exact CLI commands.

The server stays on the existing Cloudflare Worker and storage. Calendar writes never publish or schedule social posts. File bytes travel through authenticated browser-owned links, not MCP JSON. Technical identity continuity does not establish origin-specific OAuth access.

## Release and acceptance handoff

| Field | State |
| --- | --- |
| Candidate / compatibility release | 0.2.0 source candidate; published [v0.1.0](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.1.0) stays unchanged. |
| Combined artifact | `dist/tor-event-calendar-ai-plugin-0.2.0.zip`; rebuild and validate from final source. |
| Skill upload | `dist/tor-event-calendar-ai-skill-0.2.0.zip`, with one top-level `tor-event-calendar/` directory; changed Nembli bytes require a new scan. |
| Checksums | Generated `dist/SHA256SUMS`; the ZIP does not contain its own checksum. |
| Source / PR | `codex/fix/skill-zip-layout`, associated with [draft PR #1](https://github.com/Tor-Production/tor-event-calendar-ai/pull/1) to `develop`; latest migration requires push/review. |
| Portal | Reuse the existing With MCP draft. Previous domain verification and skill scan were pre-Nembli evidence; refresh name/icons, domain, MCP URL and skill, then record their new results. |
| Listing / publication | None verified; keep `listingURL: null`, `listingStatus: draft`. No package release, portal submission or listing publication is implied. |
| OAuth acceptance | Prior SDK/private ChatGPT/temporary ZIP results do not verify a new Nembli native Codex connection. Complete fresh consent, account label, bounded read, new-session and refresh checks. |

See [submission status](status.md) for historical evidence and outstanding reviewer demo, tools scan, test scenarios and policy attestations. The package owner and server owner should record Nembli deployment and portal checks independently before claiming acceptance.
