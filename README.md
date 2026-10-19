# nambli — your calendar in your AI client

Open nambli, connect your calendar, and ask for what you need.

[**Open nambli in Codex**](codex://plugins/install/tor-event-calendar-ai?marketplace=nambli) · [Setup guide](https://nambli.com/connect-ai)

1. Open the installed **nambli** plugin by **Tor Production** and choose **Connect** if requested.
2. Sign in to your calendar, check the account and requested access, and choose **Allow access**.
3. Start a new Codex chat and try: **Use nambli to show my connected account and today's events in Europe/Bucharest.**

The button opens the plugin from a configured `nambli` marketplace. If nambli is missing, use the setup help in the guide. The OpenAI directory submission is in review and unpublished; the GitHub package and marketplace are separate distribution routes. Installing a skill alone does not connect an account.

Recording a demo with an existing installation? Follow the [English recording guide](submission/recording-guide.txt), with exact prompts, the isolated demo identity and Europe/Bucharest examples. Show the installed plugin and connection; reinstalling is unnecessary.

## First installation

In Codex's plugin browser, add the GitHub marketplace `https://github.com/Tor-Production/tor-event-calendar-ai`, open **nambli**, and install it. If your Codex version offers only custom MCP setup, use **Settings → Plugins → MCPs → Add → custom MCP**, name it **nambli**, choose **Streamable HTTP**, and enter `https://nambli.com/mcp`. This manual route connects calendar tools; it does not install the packaged skill.

The optional terminal route is:

```sh
codex plugin marketplace add Tor-Production/tor-event-calendar-ai --ref main
codex plugin add tor-event-calendar-ai@nambli
```

The stable combined plugin includes the remote calendar tools, approved light/dark artwork, and explicitly invoked `nambli` skill. Ask to use nambli or invoke `$nambli`; implicit invocation stays disabled for this core skill.

## Social planning choices in 0.3.3-dev.4

Adds Instagram, Facebook, YouTube, TikTok and Snapchat alongside LinkedIn, X and Reddit. Save content types and optional account names/URLs without configuring a publisher. All five new automatic adapters remain unsupported; calendar writes never publish. See [platform fields, official sources and receipt limits](docs/SOCIAL_PLATFORMS.md). The connected server must advertise the matching schema; the package alone cannot upgrade it.

## Content and publication workflows in 0.3.3-dev.3

The combined development package also contains [nambli-content](skills/nambli-content/SKILL.md), for creating and saving social drafts, and [nambli-publish](skills/nambli-publish/SKILL.md), for an authorized publication workflow and immediate result/link reconciliation. These two skills can be discovered for relevant nambli requests; the original calendar skill remains explicit-only. Each has a separate standalone ZIP from the package script. The local CLI's `install-skill CLIENT` continues to install only the core `nambli` skill.

The package supplies no social publisher or shared LinkedIn credentials. It targets Codex + LinkedIn first and checks the actual publisher, installed App, selected account, grant and live tool inventory. Claim/result/repair tools require a supporting server and current host metadata; missing tools do not prove missing consent. Candidate `0.3.3-dev.5` preflights the complete requested post/followup plan, checks visual formatting and saves the base receipt durably before continuing the social sequence without calendar or audit detours. Sync runs alongside only without delay, or promptly afterward; recovery never reposts. See [publication rules](skills/nambli/references/publication.md), [portable architecture](ecosystems/PUBLISHING_ARCHITECTURE.md) and the [real-run acceptance review](ecosystems/codex/PUBLICATION-ACCEPTANCE.md). Package validation does not establish native publication acceptance or an OpenAI catalog release.

The stable `main` route serves v0.3.2. Development candidates are integrated into `develop`; select the reviewed commit or `develop` deliberately when testing 0.3.3-dev.5 after integration. See [Codex source selection and update verification](ecosystems/codex/README.md). A server deployment does not update installed skill files.

## Claude Code

The development package uses the Claude plugin ID **nambli**, with skill `/nambli:nambli` and server `plugin:nambli:nambli`. The published v0.3.2 release and `main` use the former ID; `develop` includes the rename and local-file helper. For the revised publication workflows, verify version 0.3.3-dev.5 after its integration or extract its reviewed ZIP and follow the [local update and retest steps](ecosystems/claude-code/README.md#update-an-existing-claude-test).

To use the development source, run this in an interactive Claude Code session:

```text
/plugin install nambli --marketplace Tor-Production/tor-event-calendar-ai#develop
```

The command installs hosted source, so it does not load an unpublished local candidate. Review the marketplace/plugin and choose the installation scope, then open `/mcp` and authenticate if requested. Verify the intended calendar account before using its data. The package targets Claude Code 2.1.283+; the interactive one-command route requires 2.1.275+. Invoke `/nambli:nambli` explicitly when you want the renamed packaged skill. Codex and npm keep their existing `tor-event-calendar-ai` identity.

Claude Free does not include Claude Code. A plan with Code access, such as Pro, or separately billed API access is required. See [Claude Code setup, updates and the manual MCP fallback](ecosystems/claude-code/README.md) and the [native tester checklist](ecosystems/claude-code/NATIVE-VERIFICATION.md). Development checks and package validation do not establish native OAuth/draft/file acceptance. The [12 October tester report](ecosystems/claude-code/NATIVE-VERIFICATION.md#reported-native-results--2026-10-12) records OAuth, calendar and file round trips for the exact renamed local ZIP on Claude Code 2.1.296; remaining installation and authorization checks stay open in #79.

## Updating an existing installation

The [v0.3.2 nambli package release](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.3.2) uses nambli.com and the renamed skill. Inspect `codex plugin marketplace list --json` and `codex plugin list --marketplace nambli --json` first. Refresh a Git-backed marketplace with `codex plugin marketplace upgrade nambli`, then update its installation with `codex plugin add tor-event-calendar-ai@nambli` and start a new session. A local marketplace must first receive the reviewed source in its registered directory; refreshing a Git ref does not update a local source. Never edit the plugin cache. A Personal marketplace pinned to an older commit keeps that version until its source ref is deliberately updated. See the [source-specific update steps](ecosystems/codex/README.md). Existing [v0.2.4 release assets](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.2.4) retain their original Nembli identity. A source update does not transfer an OAuth grant between domains; reconnect only when required and confirm the account.

Version 0.3.2 adds selected-account verification, generic host account-management guidance and explicit no-lookup boundaries for unsupported public sharing, email search and date arithmetic. It contains no owner-private app binding. The 0.3.2 package uses **nambli** for the MCP connection and skill name, with new connections at nambli.com. Invoke `$nambli` in Codex or `/nambli` for a standalone slash skill. The package ID stays stable so existing marketplace installations can update. Codex may request a fresh connection under the new MCP name: sign in, approve the intended account, and check its profile before using it. Existing calendar records and website grants are not deleted or transferred.

The local CLI's `install-skill CLIENT` installs `skills/nambli`. On upgrade it moves an older CLI-managed `tor-event-calendar` skill into `skill-backups` outside skill discovery, preserving all its files for rollback. Owner-managed junctions and unowned skills are preserved and reported for deliberate migration. The new standalone archive is `nambli-skill-0.3.2.zip`, with one top-level `nambli/` folder. Restart or reload the client after updating; old published packages retain their original skill name.

## Your calendar connection

The MCP endpoint is `https://nambli.com/mcp`. Browser consent binds one grant to one calendar account. `get_profile` confirms its stable ID and verified email. Read access uses `calendar.read`; edits use `calendar.manage`; refresh may request `offline_access`. Review or revoke grants in [Connections & tokens](https://nambli.com/?settings=connections). Changing the website login does not change an existing Codex connection.

Use an exact date, time and IANA timezone for changes. Custom values stay in `customFields`; types stay in `customFieldTypes`. Named File fields accept chat attachments through `upload_file` in hosts that support file inputs, including supported Codex and ChatGPT flows, with a 25 MiB file limit. Attach a file and ask nambli to add it to a specific event and File field. Other hosts retain an authenticated browser upload fallback. Calendar actions never publish or schedule social posts. [API reference](skills/nambli/references/api.md) · [Publication rules](skills/nambli/references/publication.md)

## Other AI clients

Codex has a direct opening button. Other clients use the instructions below or the [setup guide](https://tor-production.github.io/tor-event-calendar-ai/#other-clients).

### Ask your AI to set it up

Copy this request into your AI client:

```text
Help me connect nambli to this AI client. Use the client's official MCP setup method for a remote Streamable HTTP server named nambli at https://nambli.com/mcp, with browser OAuth. Inspect the existing configuration and preserve other connections. If you can configure it here, do so; otherwise give me the exact steps for this client. Let me finish sign-in and account consent in my browser. Then verify the connection by showing my connected account and today's events in Europe/Bucharest. If this client cannot use remote OAuth MCP, explain the supported local helper alternative at https://github.com/Tor-Production/tor-event-calendar-ai. Do not claim success until the connection is verified.
```

### Manual setup

#### Claude Code

See the [Claude Code connector guide](ecosystems/claude-code/README.md) for native plugin installation, scoped HTTP MCP configuration, browser OAuth, file fallbacks, updates and disposable verification. Native acceptance is tracked separately in [#79](https://github.com/Tor-Production/tor-event-calendar/issues/79).

Run the command below, then open /mcp in Claude Code and authenticate nambli in your browser.

```text
claude mcp add --transport http nambli https://nambli.com/mcp
```

[Official instructions](https://code.claude.com/docs/en/mcp)

#### Claude web and Desktop

Open Customize → Connectors, add a custom connector named nambli with the server URL below, then connect it. Enable it for your conversation. Custom connectors depend on your plan and workspace permissions.

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

All ecosystem plugins live in this repository; the private calendar repository owns the server. See [ecosystem ownership and task map](ecosystems/README.md). Shared upload/download recovery is documented in [file workflow](skills/nambli/references/files.md), including setup when no connector is installed. Server download support is deployed on nambli.com. The GitHub release, local 0.3.3-dev.3 package and OpenAI listing are separate. The owner completed the six legal declarations and submitted nambli 0.3.2 on 6 October; the Portal still shows **In review / Not published** on 15 October. The old 0.2.3 entry remains **Changes required / Not published** after cancellation, with no itemized reviewer criticism visible. See [current scan state and historical acceptance evidence](submission/status.md). All eight native Codex review cases and natural OAuth refresh passed for the exact 0.3.2 package; they do not certify the later publication workflows. The separate IDE matrix remains open. Earlier GitHub release tags and assets remain unchanged.

## Claude Code automatic-file candidate — 2026-10-13

Candidate `0.3.3-dev.2`, now integrated into `develop`, introduced the tor-calendar helper for agent-run uploads from accessible local Claude Code attachments. Version `0.3.3-dev.3` retains that helper and adds the content/publication workflows above. The helper uses separate browser pairing/OS keychain and checks MCP account, origin, scope and revision before sending file bytes. See [setup and focused native testing](ecosystems/claude-code/AUTO-UPLOAD.md). The supplied 13 October Mac report establishes app-attachment upload/download and credential reuse for the preserved `0.3.3-dev.1` ZIP; dev.2 added two diagnostics corrections. Native negative cases and final advertised installation remain open. The stable `main` marketplace retains the older Claude ID; no Anthropic directory listing is claimed.
