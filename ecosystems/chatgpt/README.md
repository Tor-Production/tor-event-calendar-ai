# ChatGPT installation and package

ChatGPT supports plugins in Chat and Work. Its public directory is shared with Codex, but a local Codex marketplace installation is not a cloud ChatGPT App installation. A ZIP attached to a conversation is input data until an available installer or Plugin Creator successfully imports it. A model saying “installed in Codex” does not verify installation, tools or connected accounts in ordinary ChatGPT. See [OpenAI's plugin overview](https://learn.chatgpt.com/docs/plugins).

## Before public publication

First inspect the installed nambli entry in this ChatGPT account and reuse its existing connection. The owner's private development App and connected accounts are not distributed by the public source ZIP. Its private App ID must never be copied into another user's package. Account settings are a host App feature, not proof of the portable ZIP's version or a feature exclusive to developer mode.

If no matching ChatGPT plugin exists, use the available account plugin import/Plugin Creator workflow with the ChatGPT candidate below. Check its actual component diagnostics and retained remote MCP connection; do not claim an import succeeded from static ZIP checks alone. If the host offers no working import, its supported test route is Plugins → plus button → **Add custom MCP server**, URL `https://nambli.com/mcp`, OAuth, then **Create as a plugin**. This creates a personal remote connection; it does not by itself install the three packaged skills. Add them to that same eligible App-backed plugin with Plugin Creator when available, preserving its App ID and connection. These routes depend on the account/workspace features and permissions exposed by OpenAI. [Official custom MCP quickstart](https://developers.openai.com/plugins/quickstart), [plugin packaging](https://developers.openai.com/plugins/build/plugins).

Complete OAuth in the browser for the intended nambli account. Verify `get_profile`, actual granted scope and the exposed tools in a new ordinary Chat; then repeat in Work when needed. Calendar edits require `calendar.manage`. Missing write tools with a manage grant call for refresh of that exact connection, not automatic reinstallation or another grant. Use its Apps/Connected accounts controls when present. Direct MCP settings and a separate local helper can have independent grants. See [connection diagnosis](../../skills/nambli/references/connections.md).

When an upload fails, retain the exact installer error and the archive's SHA-256. Distinguish a ZIP validation error, an unavailable installer, failed MCP conversion/authorization and stale tools. A model's response is not an archive-upload validator diagnostic. Do not tell a user that every ZIP or every ChatGPT plugin requires developer mode.

## Portable ChatGPT candidate

Build from the selected source checkout with Python 3.12+:

```sh
python scripts/package.py --target chatgpt
python scripts/test_chatgpt_package.py
```

The static test needs PyYAML (`python -m pip install PyYAML`). It parses the packaged JSON/YAML, checks all three skills and their resources, preserves the explicit-only core invocation policy, verifies deterministic bytes/checksums, and exercises missing resources, path traversal, private App/credential patterns and symlink rejection. It makes no host upload, OAuth, calendar or social calls.

Output is `dist/nambli-chatgpt-candidate-<version>.zip` with an adjacent `.zip.sha256`. This distinct **candidate** filename does not replace a released dev ZIP or the submitted store ZIP and is not a new release/version declaration. The archive contains one portable plugin root: `plugin.json`, `mcp.json`, all three `skills/` directories with references/assets, referenced listing artwork and `LICENSE`. It excludes marketplaces, other-host manifests, local CLI/runtime dependencies, local Claude helpers and private App bindings. The remote MCP route needs no Node installation or local keychain. Conditional local-helper instructions are usable only through a separately installed complete local package, not from a cloud ChatGPT chat.

The unchanged default `python scripts/package.py` (or `--target source`) still builds the broader source distribution and standalone skill ZIPs after `npm pack`. Those archives serve local/repository distribution. Do not use a broad source ZIP as evidence of a successful ChatGPT account import. Native import, MCP conversion, OAuth and real Chat/Work acceptance remain separate checks.

## Public review and acceptance

Public submission sources remain root `plugin.json`, `mcp.json`, shared skill/artwork and `submission/`. After approval, publish the verified existing listing so users can install it from the universal directory and connect their own calendars. Public uploads declare remote MCP rather than a private `.app.json`; follow the [OpenAI submission workflow](https://developers.openai.com/plugins/deploy/submission). This packaging change does not submit, rescan, cancel or replace the pending entry.

Review uses [the submitted demo URL](https://nambli.com/demo); product presentation uses [product demo](https://nambli.com/product-demo). The server supports OpenAI file inputs, while each active ChatGPT client must expose a usable transport. Native resource/save behavior must be tested separately. [Implementation #68](https://github.com/Tor-Production/tor-event-calendar/issues/68) and [native verification #78](https://github.com/Tor-Production/tor-event-calendar/issues/78) own further work. The old 0.2.3 entry is retained after review cancellation (Changes required / Not published). The current nambli 0.3.2 submission remains pending per the owner's 20 October confirmation; see [catalog status](../../submission/status.md) for the last direct inspection and scan evidence. Existing release and frozen submission archives retain their original bytes.
