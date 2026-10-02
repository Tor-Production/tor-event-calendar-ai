# nambli

Candidate package version: **0.3.0**. Intended developer: **Tor Production**, subject to the owner's publisher verification. Category: **Productivity**. Submission type: **With MCP + skill**. The new-origin listing is prepared and has not been submitted, approved or published.

## Short description

Manage your private calendar

## Long description

Install one plugin to add the nambli skill and its hosted, account-scoped MCP tools. Sign in in the browser, choose the calendar account you want to connect, review the requested permissions, and then ask Codex or ChatGPT to find events, create meetings, prepare platform-specific drafts, move appointments, and manage named files. The proposed directory plugin uses browser OAuth and needs no customer-side Node installation, API token or local proxy. The current GitHub marketplace and manual MCP setup routes remain available while the directory listing is being prepared.

The skill is invoked explicitly and asks for only the missing account, time, timezone, content, or platform-specific parameters. The connection is scoped to the selected calendar account; `get_profile` supplies a stable account ID and a useful account label. `calendar.read` covers reads, `calendar.manage` covers writes, and optional `offline_access` supports persistent authorization when granted. Access can be revoked per connection.

Calendar operations never publish or schedule social content. LinkedIn, X, and Reddit planning fields are distinct; actual publication needs a separate verified publisher and explicit authorization. Files use explicit File fields and attachment metadata; file bytes never enter event JSON. Supported hosts can transfer chat attachments directly. Other hosts use an authenticated browser upload with explicit file selection. Downloads return an exact-file delivery plan, with bounded MCP resource bytes for compatible hosts or authenticated browser/local download. A link or metadata result alone does not prove a file was downloaded. The remote server runs on the existing calendar Worker at `https://nambli.com/mcp`.

## Links

- Website: https://nambli.com
- Installation guide: https://nambli.com/connect-ai
- Compatibility guide: https://tor-production.github.io/tor-event-calendar-ai/
- Privacy: https://nambli.com/privacy
- Terms: https://nambli.com/ai/terms
- Support: https://github.com/Tor-Production/tor-event-calendar-ai/issues
- Public package source: https://github.com/Tor-Production/tor-event-calendar-ai

## Starter prompts

1. Use nambli to show today's events in my connected account.
2. Use nambli to create a project meeting tomorrow at 09:30 in Europe/Kyiv.
3. Use nambli to prepare a Reddit draft and ask for missing content.

The existing release downloads and optional local CLI are documented in the [README](../README.md); the 0.3.0 archives are prepared candidates. The original gradient n logo is retained, and the new wordmark uses Nambli Bold 0.7.3 artwork. Before submission, replace the old footage on `/demo` with the owner's new recording, execute and record the five positive/three negative cases in the actual host, and complete publisher/legal attestations. No public directory install URL has been verified. [Status and gates](status.md) · [OpenAI submission requirements](https://developers.openai.com/plugins/deploy/submission)
