# nambli — your private calendar in your AI client

nambli by Tor Production connects your calendar to an AI assistant through account-scoped tools and browser consent.

- Find events in a date range and work with explicit dates, times and timezones.
- Create, read, edit, move and delete calendar entries when you request those actions.
- Keep structured details in typed custom fields and attach files to named File fields.
- Check which account is connected, choose read or manage access, and revoke a connection from nambli settings.

Calendar writes never publish or schedule social posts. They can make reminders eligible if you have already enabled notifications in nambli.

[Open nambli](https://nambli.com) · [Connect your AI client](https://nambli.com/connect-ai) · [Privacy](https://nambli.com/privacy) · [Support](https://github.com/Tor-Production/tor-event-calendar-ai/issues)

## Claude Code

The GitHub `develop` marketplace provides the **nambli** plugin, version `0.3.3-dev.2`. Run this in an interactive Claude Code session:

```text
/plugin install nambli --marketplace Tor-Production/tor-event-calendar-ai#develop
```

Review the marketplace/plugin, choose the installation scope, then open `/mcp` and complete browser sign-in and consent if requested. Confirm your connected calendar account before using its data. Invoke `/nambli:nambli` explicitly and ask, for example: **Show my connected account and today's events in Europe/Bucharest.** The MCP server appears as `plugin:nambli:nambli`. The package targets Claude Code 2.1.283+; the interactive one-command syntax requires 2.1.275+.

Claude Code can also upload and download accessible local files through the bundled helper. This optional route requires Node 22.18+, an unlocked OS keychain and separate browser pairing to the same calendar account. Its first setup downloads lockfile-pinned dependencies from npm into a separate local cache with install scripts disabled. The helper checks the account, origin, scope and current event revision before upload. An app attachment must expose its actual bytes or a readable local path; the assistant must not invent a path or recreate a substitute file. See [automatic file setup and limitations](ecosystems/claude-code/AUTO-UPLOAD.md).

Claude Free does not include Claude Code. A plan with Code access, such as Pro, or separately billed API access is required. [Claude Code setup and manual MCP fallback](ecosystems/claude-code/README.md) · [Official plugin installation](https://code.claude.com/docs/en/discover-plugins)

The [13–14 October native acceptance report](docs/claude-code-native-2026-10-14.md) records final-source installation, decline/manual fallback, account and scope isolation, revocation, controlled upload response loss, retry and cleanup. It preserves earlier Mac CRUD and attachment evidence under the exact versions tested. Intermittent production Cloudflare 1102 during OAuth/settings requests remains unresolved; successful retries do not establish a fix. The packaged checklist is retained with the tested artifact; the dated report supplies its later results.

**Anthropic Directory submission is being prepared and is not submitted or published.** The GitHub marketplace above is available independently. Directory sync and the official Claude Code marketplace are separate publication routes; see [submission preparation and status](docs/anthropic-directory.md).

## Codex installation

[Open an existing Personal marketplace installation in Codex](codex://plugins/install/tor-event-calendar-ai?marketplace=personal). If it is missing, add the GitHub marketplace `https://github.com/Tor-Production/tor-event-calendar-ai` in Codex's plugin browser, open **nambli**, and install it. Choose **Connect** if requested, complete browser consent, and verify the intended account in a new chat.

If your Codex version offers only custom MCP setup, use **Settings → Plugins → MCPs → Add → custom MCP**, name it **nambli**, choose **Streamable HTTP**, and enter `https://nambli.com/mcp`. This manual route connects calendar tools; it does not install the packaged skill.

The optional terminal route is:

```sh
codex plugin marketplace add Tor-Production/tor-event-calendar-ai --ref main
codex plugin add tor-event-calendar-ai@nambli
```

The combined plugin includes the remote calendar tools, light/dark artwork and explicitly invoked `nambli` skill. Ask to use nambli or invoke `$nambli`; implicit invocation stays disabled. Codex and npm retain the `tor-event-calendar-ai` package identity. Installing a skill alone does not connect an account. The [7 October OpenAI catalog record](submission/status.md) remains separate from GitHub distribution and Anthropic submission.

Recording a Codex demo with an existing installation? Follow the [English recording guide](submission/recording-guide.txt), using only its designated demo identity and examples.

## Updating an existing Codex installation

The [v0.3.2 nambli package release](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.3.2) uses nambli.com and the renamed skill. Refresh a Git-backed marketplace with `codex plugin marketplace upgrade nambli`, then update its installation with `codex plugin add tor-event-calendar-ai@nambli` and reload the client. For a Personal marketplace pinned to an older commit, update that entry's source ref to `v0.3.2` before refreshing `tor-event-calendar-ai@personal`. Existing [v0.2.4 release assets](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.2.4) retain their original Nembli identity. A source update does not transfer an OAuth grant between domains; reconnect at nambli.com and confirm the account.

Version 0.3.2 adds selected-account verification, generic host account-management guidance and explicit no-lookup boundaries for unsupported public sharing, email search and date arithmetic. It contains no owner-private app binding. The 0.3.2 package uses **nambli** for the MCP connection and skill name, with new connections at nambli.com. Invoke `$nambli` in Codex or `/nambli` for a standalone slash skill. The package ID stays stable so existing marketplace installations can update. Codex may request a fresh connection under the new MCP name: sign in, approve the intended account, and check its profile before using it. Existing calendar records and website grants are not deleted or transferred.

The local CLI's `install-skill CLIENT` installs `skills/nambli`. On upgrade it moves an older CLI-managed `tor-event-calendar` skill into `skill-backups` outside skill discovery, preserving all its files for rollback. Owner-managed junctions and unowned skills are preserved and reported for deliberate migration. The new standalone archive is `nambli-skill-0.3.2.zip`, with one top-level `nambli/` folder. Restart or reload the client after updating; old published packages retain their original skill name.

## Your calendar connection

The MCP endpoint is `https://nambli.com/mcp`. Browser consent binds one grant to one calendar account. `get_profile` confirms its stable ID and verified email. Read access uses `calendar.read`; edits use `calendar.manage`; refresh may request `offline_access`. Review or revoke grants in [Connections & tokens](https://nambli.com/?settings=connections). Changing the website login does not change an existing MCP connection.

Use an exact date, time and IANA timezone for changes. Custom values stay in `customFields`; types stay in `customFieldTypes`. Named File fields accept chat attachments through `upload_file` in hosts that support file inputs, including supported Codex and ChatGPT flows, with a 25 MiB file limit. Attach a file and ask nambli to add it to a specific event and File field. Claude Code can use the optional local helper described above; other hosts retain an authenticated browser upload fallback. [API reference](skills/nambli/references/api.md) · [Publication rules](skills/nambli/references/publication.md)

## Other AI clients

The examples below describe remote MCP configuration. They do not establish native acceptance for every listed host. See the [setup guide](https://tor-production.github.io/tor-event-calendar-ai/#other-clients) and each client's linked instructions.

### Ask your AI to set it up

Copy this request into your AI client:

```text
Help me connect nambli to this AI client. Use the client's official MCP setup method for a remote Streamable HTTP server named nambli at https://nambli.com/mcp, with browser OAuth. Inspect the existing configuration and preserve other connections. If you can configure it here, do so; otherwise give me the exact steps for this client. Let me finish sign-in and account consent in my browser. Then verify the connection by showing my connected account and today's events in Europe/Bucharest. If this client cannot use remote OAuth MCP, explain the supported local helper alternative at https://github.com/Tor-Production/tor-event-calendar-ai. Do not claim success until the connection is verified.
```

### Manual setup

#### Claude Code

Use this when installing only remote calendar tools. The [Claude Code connector guide](ecosystems/claude-code/README.md) covers plugin updates and disposable verification; the [dated native report](docs/claude-code-native-2026-10-14.md) records completed acceptance and the remaining reliability defect.

Run the command below, then open /mcp in Claude Code and authenticate nambli in your browser.

```text
claude mcp add --transport http --scope local nambli https://nambli.com/mcp
```

[Official instructions](https://code.claude.com/docs/en/mcp)

#### Claude web and Desktop

Open Customize → Connectors, add a custom connector named nambli with the server URL below, then connect it. Enable it for your conversation. Custom connectors depend on your plan and workspace permissions.

This remote connector is separate from the Claude Code plugin and its local file helper. The local helper has not been verified in claude.ai or Cowork; the Mac file report concerns the application's **Code** tab.

```text
https://nambli.com/mcp
```

[Official instructions](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp)

#### Cursor

Merge this entry into your global ~/.cursor/mcp.json or project .cursor/mcp.json. Open the MCP settings and connect nambli to finish browser sign-in.

```json
{
  "mcpServers": {
    "nambli": { "url": "https://nambli.com/mcp" }
  }
}
```

[Official instructions](https://cursor.com/docs/mcp)

#### VS Code / GitHub Copilot

Run MCP: Add Server from the Command Palette. Choose an HTTP server, enter the URL below, name it nambli, and choose where to save it. Start the server and finish authentication when prompted.

```text
https://nambli.com/mcp
```

[Official instructions](https://code.visualstudio.com/docs/agent-customization/mcp-servers)

#### GitHub Copilot CLI

Run the command below, then open /mcp in Copilot CLI to check the server and finish authentication.

```text
copilot mcp add --transport http nambli https://nambli.com/mcp
```

[Official instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/overview)

#### Gemini CLI

Merge this entry into ~/.gemini/settings.json. Restart Gemini CLI, then run /mcp auth nambli to complete browser sign-in.

```json
{
  "mcpServers": {
    "nambli": { "httpUrl": "https://nambli.com/mcp" }
  }
}
```

[Official instructions](https://geminicli.com/docs/tools/mcp-server/)

#### Hermes Agent

Merge this entry into ~/.hermes/config.yaml. From a fresh terminal, run hermes mcp login nambli and finish browser sign-in. Restart your chat to load the connection.

```yaml
mcp_servers:
  nambli:
    url: "https://nambli.com/mcp"
    auth: oauth
```

[Official instructions](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp/)

For another client, add a remote Streamable HTTP server named **nambli** at `https://nambli.com/mcp`, finish browser OAuth, and verify your connected account. Merge configuration examples with existing settings. If remote OAuth MCP is unavailable, use the optional local helper below. Manual MCP setup does not install the packaged skill.

## Optional local CLI

The local helper supports Codex, Claude, Cursor, GitHub Copilot CLI, Gemini CLI, and Hermes. It needs Node 22.18+ and an unlocked OS keychain; ordinary remote plugin use needs neither. Use the [connection reference](skills/nambli/references/connections.md#optional-local-cli) only when you choose this route.

To install the helper and skill for your client, use a locally built development tarball and replace `codex` with `claude`, `cursor`, `copilot`, `gemini`, or `hermes`:

```sh
npm install --global ./dist/tor-event-calendar-ai-0.3.2.tgz
tor-calendar install-skill codex
tor-calendar connect
tor-calendar whoami
```

Follow the browser approval link printed by `connect`, approve the matching device and calendar account, and return to the terminal. The helper stores credentials in the OS keychain; never paste them into a conversation. Invoke the installed calendar skill explicitly when you want to use it.

## Source validation and support

From a clean checkout run `npm ci --ignore-scripts`, `npm test`, create `dist/`, then run `npm pack --pack-destination dist`, `python scripts/package.py`, and `python scripts/test_package.py`. Package checks do not establish catalog approval or OAuth acceptance. [Support](https://github.com/Tor-Production/tor-event-calendar-ai/issues) · [Privacy](https://nambli.com/privacy) · [Terms](https://nambli.com/ai/terms) · [Catalog status](submission/status.md)

## Plugin development workspace

All ecosystem plugins live in this repository; the private calendar repository owns the server. See [ecosystem ownership and task map](ecosystems/README.md). Shared upload/download recovery is documented in [file workflow](skills/nambli/references/files.md), including setup when no connector is installed. Server download support is deployed on nambli.com.

The [7 October catalog record](submission/status.md) documents the OpenAI 0.3.2 draft checks, eight native Codex review cases, natural OAuth refresh and remaining submission/IDE work as of that date. It is not an Anthropic approval record. Earlier GitHub release tags and assets remain unchanged.

The [14 October Claude Code report](docs/claude-code-native-2026-10-14.md) identifies the exact tested commit, dev.2 archive hash and all 36 packaged file comparisons. This README and the companion Directory preparation documents are outside that archive. Updating listing text does not change the tested plugin bytes or turn the documentation commit into the tested runtime revision.
