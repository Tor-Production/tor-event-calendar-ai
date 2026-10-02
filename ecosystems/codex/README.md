# Codex package

Installation sources are at the repository root: `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `skills/nambli`, and shared artwork. The explicit skill is `$nambli`; the plugin's package ID remains stable for marketplace updates. Ordinary remote MCP uses `https://nambli.com/mcp` with browser OAuth.

Validate with the shared package checks in the root README. Host file transport must be observed from the actual exposed `openai/fileParams` schema; MCP resource delivery is a separate capability. [Implementation #67](https://github.com/Tor-Production/tor-event-calendar/issues/67) and [native verification #77](https://github.com/Tor-Production/tor-event-calendar/issues/77) own further Codex work.
