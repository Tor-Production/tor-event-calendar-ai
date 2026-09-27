# Tor Event Calendar

Version: 0.1.0. Developer: Tor Production. Category: Productivity. Skills only.

Manage your private calendar from your local AI workspace.

Connect a verified calendar account once in the browser, then ask your local agent to find events, create meetings, prepare social drafts, move appointments and attach files. The explicitly invoked skill uses a shared Node CLI with account-scoped connections stored in the OS keychain. Every private operation pins an immutable account ID and canonical service origin.

Calendar changes never publish or schedule social posts. LinkedIn, X and Reddit have distinct planning fields. Actual social publishing requires a separately verified publisher, social authorization and explicit publication instruction; this release includes no live social adapter. The CLI returns truthful per-item connection or capability blocks.

Requires a local execution environment, Node 22.18+ and an unlocked OS keychain. Installing this skill in a cloud-only host does not make local credentials or executable tools available. A cloud/headless runtime needs explicit secret injection and expected server account ID; no hosted MCP connector is included.

Website: https://tor-production.github.io/tor-event-calendar-ai/
Privacy: https://tor-production.github.io/tor-event-calendar-ai/privacy.html
Terms: https://tor-production.github.io/tor-event-calendar-ai/terms.html
Support: https://github.com/Tor-Production/tor-event-calendar-ai/issues
Source: https://github.com/Tor-Production/tor-event-calendar-ai

Starter prompts:
- Use tor-event-calendar to show today's events in my connected account.
- Use tor-event-calendar to create a project meeting tomorrow at 09:30 in Europe/Kyiv.
- Use tor-event-calendar to prepare a Reddit draft and ask for missing content.

Availability: public download from GitHub Releases; official catalog status is recorded separately in status.md. No payment, no hidden client installer, no social publication test required.
