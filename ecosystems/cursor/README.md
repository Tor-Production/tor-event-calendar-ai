# nambli for Cursor

This Cursor candidate bundles the canonical nambli calendar, content and publication skills, the remote OAuth MCP connection, an official Microsoft Playwright browser MCP, and a Cursor-specific LinkedIn browser workflow with a durable local receipt journal. It contains no personal series/tracker, LinkedIn credentials or owner-private App binding. Calendar operations never publish social posts.

Source checks do not establish native Cursor behavior. Use [the acceptance matrix](ACCEPTANCE.md) to record actual install, OAuth, file and browser results. The initial 19 October Codex run and its recovery do not certify Cursor. The existing OpenAI submission and its frozen 0.3.2 archive are independent and unchanged by preparing this host package.

## Install a development candidate

The public repository's `.cursor-plugin/plugin.json` explicitly selects three shared skills plus `nambli-cursor-publish`, a scoped always-loaded Cursor runtime rule and `ecosystems/cursor/mcp.json`. The lightweight rule applies its account-reuse and immediate-followup instructions when a nambli task is performed; loading it does not invoke the explicit-only calendar skill or authorize a calendar/social action. The focused ZIP built by `python scripts/cursor_plugin.py build` contains only the Cursor plugin components; it excludes the other host manifests, submission documents, CLI credentials and private work files.

1. Build the ZIP from the reviewed source and verify its `build-receipt.json` SHA-256. Extract its contents into a new real directory at `~/.cursor/plugins/local/nambli` (`C:\Users\<you>\.cursor\plugins\local\nambli` on Windows). The manifest must be at `nambli/.cursor-plugin/plugin.json`; avoid an extra enclosing ZIP folder. Copy files, not a symlink to an external repository. Preserve any existing installation and its connections rather than overwriting an unowned folder.
2. Reload Cursor and inspect **Customize**. Check the plugin identity/version, all four skills, the runtime rule with `alwaysApply: true`, and two distinct MCP servers: `nambli` for the calendar and `nambli-browser` for the headed browser. The browser server is not a duplicate calendar connection and has no nambli OAuth grant. Disable a duplicate manual calendar server only after confirming which existing connection belongs to the intended account; do not blindly create a second calendar connection or revoke unrelated grants.
3. Connect nambli only if this Cursor client has no valid intended grant. Review the actual account and requested calendar scope in the browser. `calendar.read` supports reads; writes, uploads, claims and receipts require `calendar.manage`. Reuse/refresh the existing grant when valid. Verify `get_profile` before private work. Never copy a grant or token from Codex, another account or a helper.

Historical Cursor testing required a static public native client ID after default dynamic registration omitted `application_type`. This candidate therefore uses Cursor's documented static OAuth configuration with the existing **public** native client ID, requested `calendar.read`, `calendar.manage` and `offline_access` scopes, and no client secret or authorization header. Server metadata for that exact native client must permit PKCE S256, the documented desktop/hosted Cursor callbacks, code/refresh grants and these scopes before the advertised install route is ready. Allowed client scopes do not upgrade an existing user's grant; an actual read-only/revoked grant can require one normal consent upgrade on the existing connection. Retest the current host's complete OAuth flow and reuse before advertising one-click operation. Do not create repeated helper connections to work around failure. The other hosts' root `mcp.json` is unchanged.

The remote calendar MCP itself needs no local Node installation or API key. Browser publication requires Node 22.18+, `npx`, installed Google Chrome and an available local shell. The pinned stdio command is `npx -y @playwright/mcp@0.0.83 --browser chrome`; first startup can download that pinned official package from npm. No runtime or browser is installed automatically by nambli. It starts its own headed browser with a persistent profile; LinkedIn sign-in there is separate from nambli OAuth, the built-in Cursor browser and Codex. Keep a stable private publication workspace/profile and respect Cursor's tool approvals and the browser MCP's workspace file boundaries. Do not add CDP attachment, unrestricted file-access or browser-sandbox disabling flags.

Native testing of Cursor 3.23.23 found no supported built-in local file-upload tool; its built-in browser therefore cannot be used as an image-publication fallback. The bundled official Playwright MCP has separately passed both a headless fixture variant and the exact configured headed command using its real `browser_file_upload`: exact image bytes/hash, exact textarea/alt input, contenteditable paragraph presence, profile persistence across restart, rejected outside-workspace upload and blocked `file://` navigation. Its contenteditable rendered line-break count differed from the supplied input, so exact composer spacing still requires inspection. That fixture proves browser transport capability, not a real LinkedIn image post or native Cursor-host execution. Both must retain their own acceptance evidence. See [the upstream browser MCP](https://github.com/microsoft/playwright-mcp).

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

Maintainers with an explicit checkout of the private provider and its dependencies can additionally run `node --experimental-transform-types scripts/test-cursor-provider.mjs --provider-root /actual/provider/checkout`. It sends generated journal bodies through the actual local MCP schema and Worker handlers using synthetic grants and an in-memory migrated database, with no production requests or social sends. It verifies completed followup guards, unknown recovery, evidence-size limits and exact receipt replay after a later content revision. It does not test Cursor UI or a real OAuth login.

For the browser transport, run `node scripts/test-cursor-browser.mjs --client-root /checkout/with/official/mcp/client` with `@modelcontextprotocol/client` 2.1 installed there, Node/npx and Chrome available. By default it starts the exact configured headed command against a temporary local fixture; optional `--headless` is a distinct CI variant. It advertises one synthetic workspace root, verifies real image bytes and exact textarea/alt transport, reports contenteditable spacing separately, tests forbidden file access and restarts the default profile. It makes no nambli auth calls or social sends. Results are saved under `work/cursor-browser-*-receipt.json`; the browser MCP's managed synthetic profile is left intact. This does not establish native Cursor or LinkedIn behavior.

## Marketplace and website button

Cursor distributes full plugins from reviewed repository content. After native acceptance, follow [the marketplace checklist](MARKETPLACE.md), submit the exact reviewed public source and wait for the actual listing. Use that listing's supported **Add to Cursor** action for a full-plugin website button. The older `cursor://anysphere.cursor-deeplink/mcp/install` URL installs only MCP configuration; label it as MCP-only and do not present it as the complete skill package. Do not invent a marketplace URL or mark submission as publication.

Publishing a plugin is free under [Cursor's publisher terms](https://cursor.com/marketplace-publisher-terms). Cursor's Free plan has limited Agent usage; full plugin/MCP/browser availability and sufficient quota must be tested on an actual Free account without an active paid trial before claiming this complete workflow is free. No paid plan is required merely by this package's configuration.

Official references: [plugin format and fields](https://cursor.com/docs/reference/plugins), [local testing and installation](https://cursor.com/docs/plugins#test-plugins-locally), [MCP and OAuth](https://cursor.com/docs/mcp), [browser tools](https://cursor.com/docs/agent/tools/browser), [current billing](https://cursor.com/help/account-and-billing/pricing).
