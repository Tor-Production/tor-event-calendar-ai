# Codex package

Installation sources are at the repository root: `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `skills/`, and shared artwork. The package ID stays `tor-event-calendar-ai` in marketplace `nambli`. Ordinary remote MCP uses `https://nambli.com/mcp` with browser OAuth.

Version `0.3.3-dev.5` retains the explicitly invoked `$nambli` calendar skill and two workflows discoverable for relevant nambli requests: `nambli-content` and `nambli-publish`. It clarifies existing-connection metadata refresh, formatting checks and one preflighted post/followup sequence with durable recovery. Publication still requires a separately available authorized publisher and a deployed server exposing the receipt tools. The five additional public-content planning platforms retain unsupported automatic adapters. Installing the package does not publish a post or prove native acceptance.

## Select the source and update

Inspect the existing source and installation before changing them:

```sh
codex plugin marketplace list --json
codex plugin list --marketplace nambli --json
```

The stable `main` source remains v0.3.2. `develop` is the integration branch; use a reviewed commit for a reproducible candidate or `develop` when intentionally following development updates. Check the manifest version after integration instead of assuming a branch contains an unpublished local change. For a new Git-backed candidate installation:

```sh
codex plugin marketplace add Tor-Production/tor-event-calendar-ai --ref develop
codex plugin add tor-event-calendar-ai@nambli --json
```

For an existing Git-backed marketplace, preserve its chosen ref, run `codex plugin marketplace upgrade nambli`, then `codex plugin add tor-event-calendar-ai@nambli --json`. A pinned tag or commit stays pinned; select a new ref deliberately. Avoid registering a second source with the same marketplace name while an existing local source is active.

For a local marketplace, update its registered source directory with the reviewed package first, then run `codex plugin add tor-event-calendar-ai@nambli --json`. Keep a checksum inventory and backup of the old source. Preserve local account/app bindings, connection configuration, unrelated files and settings; public archives contain no owner-specific bindings. Do not edit the installed cache, clear credentials or revoke grants as an update step. A Git marketplace refresh does not update a separate local source.

Start a new session after updating; restart the desktop app if it still shows old files. Verify the installed version, all three skill entrypoints and unchanged explicit-only policy for the core skill. Verify actual tool discovery separately from skill installation. When checking the connection, use `get_profile` for the intended account and a bounded read; reauthenticate only if the host requests it. A calendar server deployment alone does not refresh skill files.

If only some tools are missing, inspect the installed App/connection ID, selected account, scopes and actual tools. Use that existing App's supported metadata **Refresh**, then a fresh tool context if required; do not reconnect to refresh schemas. A similarly named Portal entry or direct MCP server can be a different App/grant. Follow [connection diagnosis](../../skills/nambli/references/connections.md#missing-tools-or-stale-metadata), including existing helper profiles before optional pairing. The [19 October acceptance review](PUBLICATION-ACCEPTANCE.md) records the observed 16-to-19-tool refresh without a new grant and the remaining live regression gates.

The installed CLI must support these commands; check `codex plugin --help` if unavailable. Source and cache behavior are documented in [OpenAI's package guide](https://developers.openai.com/plugins/build/plugins), with command options in the [CLI reference](https://learn.chatgpt.com/docs/cli/reference). No archive upload or native package update tool is assumed.

Validate with the shared package checks in the root README. Host file transport must be observed from the actual exposed `openai/fileParams` schema; MCP resource delivery is a separate capability. [Implementation #67](https://github.com/Tor-Production/tor-event-calendar/issues/67) and [native verification #77](https://github.com/Tor-Production/tor-event-calendar/issues/77) own further Codex work.
