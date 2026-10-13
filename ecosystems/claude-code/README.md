# nambli for Claude Code

Connect Claude Code to your calendar at `https://nambli.com/mcp`, approve the intended account in your browser, then verify it with `get_profile`. A skill alone cannot connect an account. Calendar writes save drafts and can make opted-in calendar reminders eligible; they never publish or schedule LinkedIn posts.

Implementation: [#69](https://github.com/Tor-Production/tor-event-calendar/issues/69). Native verification and subsequent fixes: [#79](https://github.com/Tor-Production/tor-event-calendar/issues/79). Shared file guidance/download: [#65](https://github.com/Tor-Production/tor-event-calendar/issues/65) / [#66](https://github.com/Tor-Production/tor-event-calendar/issues/66). Version 0.3.2 introduced this source integration under the former Claude plugin ID `tor-event-calendar-ai`. The `0.3.3-dev.2` review candidate renames the Claude plugin ID to `nambli` and bundles agent-run local file upload with separate OS-keychain pairing; published assets and hosted branches are not changed by a local edit. This candidate includes the setup-status and sanitized HTTP-error diagnostics corrections after the Mac-tested `0.3.3-dev.1` ZIP. The original archive remains unchanged. Source/package validation does not establish native acceptance.

## Supported host

Target the **local Claude Code terminal**, v2.1.283 or later, on a [supported OS](https://code.claude.com/docs/en/setup#system-requirements). This baseline includes the documented MCP manifest checks. Record `claude --version` during native acceptance; this is a documentation compatibility target, not a claim of a tested native version. Claude Code requires a [Pro, Max, Team or Enterprise subscription, Console account, or supported provider](https://code.claude.com/docs/en/quickstart). Your organization's MCP/plugin policy must permit this server. nambli consent is separate from Claude login.

**Claude Free does not include Claude Code.** [Pro](https://claude.com/pricing) includes Claude Code at US$20/month on monthly billing, subject to usage limits and applicable tax. Console/API usage is billed separately from a Claude subscription. A friend can test using their own eligible Claude and nambli accounts; do not share logins, tokens or account grants.

Official documentation reviewed on 2026-10-11: [HTTP MCP and OAuth](https://code.claude.com/docs/en/mcp), [plugin manifests](https://code.claude.com/docs/en/plugins-reference), [marketplaces](https://code.claude.com/docs/en/plugin-marketplaces), [installation](https://code.claude.com/docs/en/discover-plugins), and [explicit skill invocation](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill). Remote MCP use needs no Node runtime or local helper. The optional helper needs Node 22.18+ and an unlocked OS keychain. Claude web/Desktop connectors and Claude Code cloud sessions have different setup and are outside this local package target.

## Choose one connection route

First inspect `claude mcp list`, `claude plugin list` and `/mcp`. Preserve unrelated servers and accounts. Reuse an existing correct nambli connection. Avoid connecting the plugin and manual MCP route simultaneously: each grant can select a different account and exposes another tool namespace.

### Test the exact local source

The root `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.mcp.json` and shared `skills/nambli` are the native entry points. The current Claude plugin ID, explicit skill name and MCP key are `nambli`. Claude therefore registers `plugin:nambli:nambli`, exposes `mcp__plugin_nambli_nambli__TOOL`, and invokes the skill as `/nambli:nambli`.

This is a Claude-only identity migration from `tor-event-calendar-ai`, whose previous server was `plugin:tor-event-calendar-ai:nambli` and skill command was `/tor-event-calendar-ai:nambli`. `displayName: "nambli"` alone did not change that technical identity in the tester's 2026-10-12 screenshot. The npm package, Codex plugin, repository URLs, MCP endpoint and calendar data retain their existing identities. The renamed candidate is not yet established as published on `#develop`; use the reviewed local ZIP or source for this test.

Extract the candidate into a new source folder and keep the previous ZIP/source for rollback. Run from a separate scratch directory, outside the plugin source root, with only one absolute candidate path:

```sh
claude plugin validate "/ABSOLUTE/PATH/TO/SOURCE/.claude-plugin/plugin.json" --strict
claude --plugin-dir "/ABSOLUTE/PATH/TO/SOURCE"
```

Replace the example path with your actual extraction path. `--plugin-dir` loads that exact source for the session; it does not persistently update an installed marketplace plugin. Use absolute paths to fixtures under the source root. The scratch working directory keeps the root `.mcp.json` from also taking precedence as project configuration.

### Update an existing Claude test

1. Record the old source path, active plugin ID/scope, test account and any pending disposable event UUIDs, current revisions and file hashes. Keep prior test evidence and fixture files for cleanup; do not create duplicate records just because the plugin name changed.
2. Inspect `/plugin`, `claude plugin list` and `/mcp`. If the former plugin is installed, disable only the exact `tor-event-calendar-ai@MARKETPLACE` entry in its observed scope through the plugin manager. Do not assume its marketplace is `nambli` or change unrelated installations. If the old plugin was loaded only with `--plugin-dir`, stop that process and stop passing its path. Do not load both candidate roots. A manual nambli server can take precedence; record which route is actually active and avoid claiming it tests the plugin.
3. Preserve the same scratch working directory and Claude profile. Start a fresh process with the new absolute `--plugin-dir` path. Preserve OAuth grants, credentials and unrelated configuration; this rename does not require clearing them. Update any launcher that still points to the old path.
4. Check that the loaded plugin is `nambli`, its source is the new extraction, and `/mcp` shows `plugin:nambli:nambli`. The skill is now `/nambli:nambli`; tool permissions and hook matchers that named the old prefix must be reviewed individually against `mcp__plugin_nambli_nambli__`. Reapprove only the intended tools if Claude asks, retaining the prior permission scope.
5. Reuse authentication when the host accepts it. If Claude requests sign-in, complete browser OAuth for your own intended nambli account, then call `get_profile` and perform a bounded read. OAuth continuity across the identity change is not guaranteed. Do not copy tokens or revoke old grants as a routine update step. Share redacted results, including whether reauthentication was required.

A successful name/profile/read check verifies the migration only. Continue [native verification](NATIVE-VERIFICATION.md) from existing known test UUIDs where appropriate; pending cleanup remains part of the test.

### Install from the marketplace after publication

The published `v0.3.2` source retains the former Claude plugin identity. The following commands apply only after a maintainer publishes the renamed entry to `#develop`; they do not load this uncommitted candidate. Paste the primary command into an **interactive Claude Code conversation**, not the terminal shell:

```text
/plugin install nambli --marketplace Tor-Production/tor-event-calendar-ai#develop
```

Review the plugin and choose its scope; choose **local** for only the current project. The interactive `--marketplace` option requires v2.1.275+, included in the v2.1.283 target. The equivalent one-command shell option requires v2.1.292+. See the [official installation instructions](https://code.claude.com/docs/en/discover-plugins).

The two-step shell route after publication is:

```sh
claude plugin marketplace add "Tor-Production/tor-event-calendar-ai#develop"
claude plugin install nambli@nambli --scope local
```

Inspect an existing marketplace's registered source before changing it. The old installation does not become `nambli@nambli` through a normal update; use the scoped migration steps above. Once the new identity is installed, refresh its intentionally selected source with `claude plugin marketplace update nambli` and `claude plugin update nambli@nambli`. Hosted versions may remain pinned; use local `--plugin-dir` for unpublished edits. Open `/mcp`, authenticate only when required, verify your account, and explicitly invoke `/nambli:nambli`.

### Remote MCP without the packaged skill

This route works independently of a Claude marketplace. From the project where you want access, run:

```sh
claude mcp add --transport http --scope local nambli https://nambli.com/mcp
claude
```

`local` stores this connection for you in the current project. Choose `--scope user` explicitly if you want it across projects, or `--scope project` to add only this entry to a shared `.mcp.json`. The [mcp.json example](mcp.json) shows that project shape; merge its `mcpServers.nambli` entry, never replace a whole existing configuration. If that key already points elsewhere, preserve it and deliberately choose another name or migrate it after comparing accounts. Do not overwrite a connection or copy its tokens.

Open `/mcp` and authenticate. Let the host discover OAuth metadata and register its client; no static Authorization header, client secret or manually pasted token belongs in this configuration. If the CLI or MCP is unavailable, the [public setup guide](https://nambli.com/connect-ai) and [authenticated calendar](https://nambli.com/) remain usable before a connector is installed. Report the missing connection; do not pretend a tool ran.

## Verify identity, tools and reconnection

Consent binds to one stable calendar account and exact server origin. Review the verified email, selected account and requested permissions. `calendar.read` permits reads; `calendar.manage` permits writes and upload actions; `offline_access` supports refresh. Inspect actual `/mcp` tools separately from `get_capabilities`. Read grants may expose fewer tools.

Try this in Claude Code:

```text
Use nambli to call get_profile and show the stable account ID and verified email. After I confirm the intended account, list today's events in Europe/Kyiv with limit 5. Read full content only for an exact event I select. Report actual available file tools separately from server capability claims. Do not write anything.
```

An observed `get_profile` result plus a bounded successful read verifies the connection. A configured URL, successful manifest check, website login or tool inventory alone does not. Plugin tools use `mcp__plugin_nambli_nambli__TOOL`; manual tools use `mcp__nambli__TOOL`. Use the names actually exposed in your session.

Claude Code refreshes OAuth through the host. If it requests authentication, select **Re-authenticate** on the same server in `/mcp`; on versions that provide it, `claude mcp login nambli` supports the manually configured server. Keep callback URLs in the host's authentication UI. Verify `get_profile` again after reconnecting. Changing the browser login does not change the saved grant. Preserve existing grants during the identity update. For an explicitly requested revocation test, revoke only its disposable test grant after cleanup in [Connections & tokens](https://nambli.com/?settings=connections), then confirm that connection fails; preserve unrelated grants. A grant for an older domain needs new consent for nambli.

## Publication state checked on 2026-10-13

The public GitHub marketplace exists, but `main` and `develop` at `e299d9e09f77181ba3a065ef4aa4bc8e1e5087f8` still list plugin `tor-event-calendar-ai` version 0.3.2 in marketplace `nambli`. This renamed automatic-files candidate is local and unpublished. Installing the hosted repository today does not install this candidate. The install commands above describe the intended route after this source is integrated; test the supplied ZIP/local marketplace meanwhile.

Local Desktop Code provides **+ → Plugins → Add plugin** and shares user-scoped CLI installations. Claude account plugins under **Customize → Plugins** are a separate surface. A user-added GitHub marketplace is distinct from Anthropic's reviewed directory; no nambli Anthropic listing is verified here. See [Desktop setup](https://code.claude.com/docs/en/desktop#install-plugins), [plugin installation](https://code.claude.com/docs/en/discover-plugins), and [publication routes](https://code.claude.com/docs/en/plugins/publish).

The candidate bumps its version and supplies `renames: {"tor-event-calendar-ai": "nambli"}` for existing installed users. Preserve that mapping as migration history. Git/URL users may still need to install the new name once to populate its cache; inspect the actual installation and scope rather than clearing settings. An inline `--plugin-dir` test ends when that process exits; it has no persistent plugin entry to uninstall unless a separate installation is observed. Preserve grants and unrelated plugins.

## Automatic local uploads

When explicitly requested, Claude runs the bundled `tor-calendar` helper for files attached in the local app. The user approves one browser pairing; the agent performs setup, identity checks, upload and readback. See [automatic upload setup and focused tests](AUTO-UPLOAD.md). The new route is unreleased. The supplied 13 October Mac report now confirms app-attached PNG/PDF upload, matching downloaded bytes, unchanged replay, cleanup and new-session credential reuse for the exact candidate; see the native evidence record. Controlled negative cases and published installation remain open. The remote MCP connection itself still needs no Node.

## Files and capabilities

The [Claude Code workflow](../../skills/nambli/references/claude-code.md) contains the runtime instructions loaded by the explicit skill.

| Operation | Implemented route | Native evidence and remaining scope |
| --- | --- | --- |
| Connect and refresh | HTTP MCP, browser OAuth, `/mcp` | Tester reports OAuth/profile and fresh-process reuse on 2.1.296; continuity after 25 minutes, refresh not directly observed; owner's Windows manual Reconnect and full process restart with automatic connection reuse passed; disposable-grant revocation pending |
| Read/create/edit | Exposed calendar tools, stable UUID and current revision | Tester reports disposable create/edit/new-conversation persistence and cleanup |
| Local image/PDF upload | Authenticated `get_file_upload_link` browser form; optional independently paired local helper | Tester reports separate File fields, metadata/hash checks and isolated replacement; uncertain upload retry still pending |
| Remote `upload_file` | Requires host temporary OpenAI/Azure file metadata | No Claude Code bridge demonstrated; local paths are unsupported |
| Saved file download | Shared `get_file_download`, authenticated resource up to 512 KiB, browser page or versioned local helper | Tester reports PNG/PDF resource and browser hash equality on 2.1.296; model interpretation of content not established |
| Social publication or sending an email draft | Separate authorized integrations | A calendar draft proves no publication or email-draft sending capability; opted-in calendar reminders are separate |

See the [dated native evidence and remaining checks](NATIVE-VERIFICATION.md#reported-native-results--2026-10-12) for the exact local ZIP hash and macOS environment. The owner's separate 13 October Windows/API screenshot confirms OAuth, explicit skill invocation, successful own-account profile/bounded calendar reads and manual Reconnect/full process restart with matching identity and no renewed browser sign-in. A controlled disabled-server check also passed: truthful lack-of-access reporting and correct setup links, followed by restored connection/discovery. These results do not establish released installation, Windows writes/files or every host/provider. The macOS write/file results count toward shared plugin acceptance; repeating them on Windows is not a separate requirement of #79. See the three remaining acceptance groups in the native record.

Do not equate attachment metadata, an authenticated action link, or server file capability flags with bytes in Claude's context. Use synthetic files for checks. The browser fallback performs its own account and event verification and enforces 25 MiB per file; it does not consume a local path from the chat.

The [shared download contract](download-contract.json) records #66's exact inputs and delivery choices. Discover `get_file_download` in your current session and pass `eventId`, `eventRevision`, `attachmentId`, and the exact `fieldName`. The response has `bytesDelivered: false`, an authenticated `browserUrl`, and a resource link only for files at most 512 KiB. Use connected `resources/read` only when Claude Code actually makes it available; otherwise open `browserUrl` and choose **Download file**. A missing tool means the current server/host has not exposed it: refresh and use the authenticated event editor's filename download meanwhile. The helper `download` command is included in the 0.3.2 source/tarball; check its installed version before use. The tester reports actual native resource delivery on Claude Code 2.1.296 for the synthetic PNG/PDF in the dated evidence above. `bytesDelivered: false` remains correct for the initial tool response; `resources/read` delivers the bytes separately. Verify actual delivery in other environments; full #79 acceptance remains incomplete.

## Validation and disposable draft

From the repository root with Python 3.10+:

```sh
python scripts/claude_code.py validate
python scripts/test_claude_code.py
python scripts/claude_code.py build
python scripts/claude_code.py probe
```

`validate` checks focused source/configuration invariants. `build` creates a deterministic development ZIP and receipt in `dist/claude-code/`, using tracked source and an explicit required helper-file allowlist; no Git staging is needed for those new candidate files. It exports no private code and publishes no assets. Extract the ZIP and use `claude --plugin-dir PATH_TO_EXTRACTED_ROOT`; persistent marketplace installation uses the repository's catalog, which is outside this focused ZIP. `probe` sends only an unauthenticated initialization request and reads public OAuth metadata; it must observe authentication required. It never registers an OAuth client, accesses an account or writes an event. These checks establish package/config/discovery evidence only. `claude plugin validate . --strict` remains the host's authoritative validation when its binary is available.

Follow the [friend quick check and full native checklist](NATIVE-VERIFICATION.md) for #79. Before creating the historical synthetic fixture, the tester must pause calendar notifications in their own account and confirm that setting; if they prefer not to pause them, perform only read checks. Record the prior setting for restoration after cleanup. The owner still selects a real brief and quality criterion for [#41](https://github.com/Tor-Production/tor-event-calendar/issues/41). Native acceptance requires an authorized Claude host/account; unavailable steps remain unverified. Do not publish posts or send email drafts during connector checks.
