# Tor Event Calendar

Candidate version: **0.2.0**. Developer: **Tor Production**. Category: **Productivity**. Submission type: **With MCP + skill**. The public listing is a saved draft, not a published install destination.

## Short description

Manage your private calendar with a connected plugin.

## Long description

Install one plugin to add the Tor Event Calendar skill and its hosted, account-scoped MCP tools. Sign in in the browser, choose the calendar account you want to connect, review the requested permissions, and then ask Codex or ChatGPT to find events, create meetings, prepare platform-specific drafts, move appointments, and manage supported File links. No customer-side Node installation, API token, local proxy, or separate MCP URL is needed for the directory plugin.

The skill is invoked explicitly and asks for only the missing account, time, timezone, content, or platform-specific parameters. The connection is scoped to the selected calendar account; `get_profile` supplies a stable account ID and a useful account label. `calendar.read` covers reads, `calendar.manage` covers writes, and optional `offline_access` supports persistent authorization when granted. Access can be revoked per connection.

Calendar operations never publish or schedule social content. LinkedIn, X, and Reddit planning fields are distinct; actual publication needs a separate verified publisher and explicit authorization. File bytes use the calendar's authenticated browser-owned upload link, not MCP JSON. The remote server runs on the existing Tor Event Calendar Worker at `https://eventcalendar.torproduction.com/mcp`.

## Links

- Website and installation guide: https://tor-production.github.io/tor-event-calendar-ai/
- Privacy: https://tor-production.github.io/tor-event-calendar-ai/privacy.html
- Terms: https://tor-production.github.io/tor-event-calendar-ai/terms.html
- Support: https://github.com/Tor-Production/tor-event-calendar-ai/issues
- Public package source: https://github.com/Tor-Production/tor-event-calendar-ai

## Starter prompts

1. Use tor-event-calendar to show today's events in my connected account.
2. Use tor-event-calendar to create a project meeting tomorrow at 09:30 in Europe/Kyiv.
3. Use tor-event-calendar to prepare a Reddit draft and ask for missing content.

The current release download and optional local CLI are documented in the [README](../README.md). The proposed listing is **not yet submitted, approved, or published**; no public install URL has been verified. [Status and gates](status.md) · [OpenAI submission requirements](https://developers.openai.com/plugins/deploy/submission)
