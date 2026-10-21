# nambli for Cursor

This Cursor candidate bundles the canonical nambli calendar, content and publication skills, the remote OAuth MCP connection, and a Cursor-specific LinkedIn browser workflow with a durable local receipt journal. It contains no personal series/tracker, LinkedIn credentials or owner-private App binding. Calendar operations never publish social posts.

Source checks do not establish native Cursor behavior. Use [the acceptance matrix](ACCEPTANCE.md) to record actual install, OAuth, file and browser results. The initial 19 October Codex run and its recovery do not certify Cursor. The existing OpenAI submission and its frozen 0.3.2 archive are independent and unchanged by preparing this host package.

## Install a development candidate

The public repository's `.cursor-plugin/plugin.json` explicitly selects three shared skills plus `nambli-cursor-publish`, a contextual Cursor rule and `ecosystems/cursor/mcp.json`. The focused ZIP built by `python scripts/cursor_plugin.py build` contains only the Cursor plugin components; it excludes the other host manifests, submission documents, CLI credentials and private work files.

1. Build the ZIP from the reviewed source and verify its `build-receipt.json` SHA-256. Extract its contents into a new real directory at `~/.cursor/plugins/local/nambli` (`C:\Users\<you>\.cursor\plugins\local\nambli` on Windows). The manifest must be at `nambli/.cursor-plugin/plugin.json`; avoid an extra enclosing ZIP folder. Copy files, not a symlink to an external repository. Preserve any existing installation and its connections rather than overwriting an unowned folder.
2. Reload Cursor and inspect **Customize**. Check the plugin identity/version, all four skills, the contextual rule and the named nambli MCP. Disable a duplicate manual server only after confirming which existing connection belongs to the intended account; do not blindly create a second connection or revoke unrelated grants.
3. Connect nambli only if this Cursor client has no valid intended grant. Review the actual account and requested calendar scope in the browser. `calendar.read` supports reads; writes, uploads, claims and receipts require `calendar.manage`. Reuse/refresh the existing grant when valid. Verify `get_profile` before private work. Never copy a grant or token from Codex, another account or a helper.

Historical Cursor testing required a static public native client ID after default dynamic registration omitted `application_type`. This candidate therefore uses Cursor's documented static OAuth configuration with the existing **public** native client ID, requested `calendar.read`, `calendar.manage` and `offline_access` scopes, and no client secret or authorization header. Server metadata for that exact native client must permit PKCE S256, the documented desktop/hosted Cursor callbacks, code/refresh grants and these scopes before the advertised install route is ready. Allowed client scopes do not upgrade an existing user's grant; an actual read-only/revoked grant can require one normal consent upgrade on the existing connection. Retest the current host's complete OAuth flow and reuse before advertising one-click operation. Do not create repeated helper connections to work around failure. The other hosts' root `mcp.json` is unchanged.

Ordinary remote calendar use needs no local Node installation or API key. The browser publication journal requires Node 22.18+ and an available local shell. Cursor browser login is separate from nambli OAuth and from the browser in Codex. Its stored session is workspace-specific, so use a stable workspace for publication. Respect Cursor's tool-approval controls.

## Try a bounded task

Ask: “Use nambli to show the connected account and today's events in my saved timezone. Do not change anything.” Confirm the reported account ID and bounded date range. For a disposable draft, supply an exact date/time/timezone and explicitly authorize creating and deleting only that fixture. Use explicit named File fields and verify actual uploaded/downloaded bytes; metadata alone is not delivery.

For content, ask `nambli-content` to prepare and save the selected draft. For publication, follow `nambli-publish` and the Cursor browser adapter. The complete agreed plan must be preflighted before posting, then the confirmed base receipt is saved locally and requested followups run immediately before calendar callbacks. See [journal operation and recovery](JOURNAL.md). A post can remain published while calendar sync or one followup needs recovery. Never submit it again for that reason.

## Reproduce source checks

From the repository root, run:

```sh
python scripts/cursor_plugin.py validate
python scripts/test_cursor_plugin.py
node --test scripts/test-cursor-journal.mjs
python scripts/cursor_plugin.py build
```

These commands make no authenticated calendar calls or social sends. On restricted Windows runners where the OS temp directory disallows atomic rename, set `TEMP` and `TMP` to a writable isolated test directory before the tests. Build receipts pin every included file and state that native acceptance is not established. Keep release/install evidence separately from private draft and journal data.

## Marketplace and website button

Cursor distributes full plugins from reviewed repository content. After native acceptance, follow [the marketplace checklist](MARKETPLACE.md), submit the exact reviewed public source and wait for the actual listing. Use that listing's supported **Add to Cursor** action for a full-plugin website button. The older `cursor://anysphere.cursor-deeplink/mcp/install` URL installs only MCP configuration; label it as MCP-only and do not present it as the complete skill package. Do not invent a marketplace URL or mark submission as publication.

Publishing a plugin is free under [Cursor's publisher terms](https://cursor.com/marketplace-publisher-terms). Cursor's Free plan has limited Agent usage; full plugin/MCP/browser availability and sufficient quota must be tested on an actual Free account without an active paid trial before claiming this complete workflow is free. No paid plan is required merely by this package's configuration.

Official references: [plugin format and fields](https://cursor.com/docs/reference/plugins), [local testing and installation](https://cursor.com/docs/plugins#test-plugins-locally), [MCP and OAuth](https://cursor.com/docs/mcp), [browser tools](https://cursor.com/docs/agent/tools/browser), [current billing](https://cursor.com/help/account-and-billing/pricing).
