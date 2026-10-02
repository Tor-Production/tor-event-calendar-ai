# Ecosystem plugin workspace

`tor-event-calendar-ai` owns plugin manifests, marketplace entries, the shared skill, the optional local client, setup guides and host-specific adapters. The private calendar repository owns the website, Worker/MCP, authentication, storage and domain contract sources. The organization was approved in [#90](https://github.com/Tor-Production/tor-event-calendar/issues/90).

Keep one repository and one shared client. Add a host directory when implementation begins; do not create ten repositories or empty installable packages. Browser-only hosts may need a connector guide rather than a ZIP. Each implemented directory documents its supported transport, setup, validation target and native verification issue. Configuration checks do not establish native file delivery.

| Host | Implementation | Native verification | Current source ownership |
| --- | --- | --- | --- |
| Codex | [#67](https://github.com/Tor-Production/tor-event-calendar/issues/67) | [#77](https://github.com/Tor-Production/tor-event-calendar/issues/77) | Root `.codex-plugin`, `.agents/plugins/marketplace.json`, shared skill |
| ChatGPT | [#68](https://github.com/Tor-Production/tor-event-calendar/issues/68) | [#78](https://github.com/Tor-Production/tor-event-calendar/issues/78) | Root `plugin.json`, `mcp.json`, `submission/` |
| Claude Code | [#69](https://github.com/Tor-Production/tor-event-calendar/issues/69) | [#79](https://github.com/Tor-Production/tor-event-calendar/issues/79) | Root `.claude-plugin`, `.mcp.json`; `ecosystems/claude-code/` implementation in parallel |
| Claude web/Desktop | [#70](https://github.com/Tor-Production/tor-event-calendar/issues/70) | [#80](https://github.com/Tor-Production/tor-event-calendar/issues/80) | Dedicated host guide/adapter in its implementation task |
| Perplexity | [#71](https://github.com/Tor-Production/tor-event-calendar/issues/71) | [#81](https://github.com/Tor-Production/tor-event-calendar/issues/81) | Dedicated instructions in its implementation task |
| Cursor | [#72](https://github.com/Tor-Production/tor-event-calendar/issues/72) | [#82](https://github.com/Tor-Production/tor-event-calendar/issues/82) | Host configuration/adapter in its implementation task |
| VS Code/Copilot | [#73](https://github.com/Tor-Production/tor-event-calendar/issues/73) | [#83](https://github.com/Tor-Production/tor-event-calendar/issues/83) | Host configuration/adapter in its implementation task |
| Copilot CLI | [#74](https://github.com/Tor-Production/tor-event-calendar/issues/74) | [#84](https://github.com/Tor-Production/tor-event-calendar/issues/84) | Host configuration/adapter in its implementation task |
| Gemini CLI | [#75](https://github.com/Tor-Production/tor-event-calendar/issues/75) | [#85](https://github.com/Tor-Production/tor-event-calendar/issues/85) | Host configuration/extension in its implementation task |
| Hermes | [#76](https://github.com/Tor-Production/tor-event-calendar/issues/76) | [#86](https://github.com/Tor-Production/tor-event-calendar/issues/86) | Host configuration/skill in its implementation task |

All hosts share [file workflow](../skills/nambli/references/files.md). Implementation can finish independently; manual checks depend on its implementation plus #65/#66. Further native fixes stay in the manual issue. Claude Code is part of the vertical slice; the other hosts can run before or after it.

Preserve existing root installation paths and IDs. Keep optional skill invocation explicit. Changes target `develop` through isolated `codex/feature/...` branches; released `main` and existing version/tag assets remain unchanged. No publishing/resubmission while 0.2.3 review is pending without the owner's release decision. Import only scoped domain/contract snapshots from the private repository, with a source revision/hash receipt; never run its retired full-package exporter over this repository.
