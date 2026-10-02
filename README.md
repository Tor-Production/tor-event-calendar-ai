# nambli — your calendar in your AI client

Open nambli, connect your calendar, and ask for what you need.

[**Open nambli in Codex**](codex://plugins/install/tor-event-calendar-ai?marketplace=personal) · [Setup guide](https://nambli.com/connect-ai)

1. Open the installed **nambli** plugin by **Tor Production** and choose **Connect** if requested.
2. Sign in to your calendar, check the account and requested access, and choose **Allow access**.
3. Start a new Codex chat and try: **Use nambli to show my connected account and today's events in Europe/Kyiv.**

The button opens an existing Personal marketplace installation. If nambli is missing, use the setup help in the guide. The public OpenAI directory listing remains a draft; the GitHub package and marketplace are separate distribution routes. Installing a skill alone does not connect an account.

## First installation

In Codex's plugin browser, add the GitHub marketplace `https://github.com/Tor-Production/tor-event-calendar-ai`, open **nambli**, and install it. If your Codex version offers only custom MCP setup, use **Settings → Plugins → MCPs → Add → custom MCP**, name it **nambli**, choose **Streamable HTTP**, and enter `https://nambli.com/mcp`. This manual route connects calendar tools; it does not install the packaged skill.

The optional terminal route is:

```sh
codex plugin marketplace add Tor-Production/tor-event-calendar-ai --ref main
codex plugin add tor-event-calendar-ai@nambli
```

The combined plugin includes the remote calendar tools, approved light/dark artwork, and explicitly invoked `nambli` skill. Ask to use nambli or invoke `$nambli`; implicit invocation stays disabled.

## Updating an existing installation

The 0.3.0 nambli source is being prepared. No v0.3.0 release is published yet. Existing [v0.2.4 release assets](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.2.4) retain their original Nembli identity. Once the new source is released, refresh your marketplace and reconnect at nambli.com.

The 0.3.0 candidate uses **nambli** for the MCP connection and skill name, with new connections at nambli.com. Invoke `$nambli` in Codex or `/nambli` for a standalone slash skill. The package ID stays stable so existing marketplace installations can update. Codex may request a fresh connection under the new MCP name: sign in, approve the intended account, and check its profile before using it. Existing calendar records and website grants are not deleted or transferred.

The local CLI's `install-skill CLIENT` installs `skills/nambli`. On upgrade it moves an older CLI-managed `tor-event-calendar` skill into `skill-backups` outside skill discovery, preserving all its files for rollback. Owner-managed junctions and unowned skills are preserved and reported for deliberate migration. The new standalone archive is `nambli-skill-0.3.0.zip`, with one top-level `nambli/` folder. Restart or reload the client after updating; old published packages retain their original skill name.

## Your calendar connection

The MCP endpoint is `https://nambli.com/mcp`. Browser consent binds one grant to one calendar account. `get_profile` confirms its stable ID and verified email. Read access uses `calendar.read`; edits use `calendar.manage`; refresh may request `offline_access`. Review or revoke grants in [Connections & tokens](https://nambli.com/?settings=connections). Changing the website login does not change an existing Codex connection.

Use an exact date, time and IANA timezone for changes. Custom values stay in `customFields`; types stay in `customFieldTypes`. Named File fields accept chat attachments through `upload_file` in hosts that support file inputs, including supported Codex and ChatGPT flows, with a 25 MiB file limit. Attach a file and ask nambli to add it to a specific event and File field. Other hosts retain an authenticated browser upload fallback. Calendar actions never publish or schedule social posts. [API reference](skills/nambli/references/api.md) · [Publication rules](skills/nambli/references/publication.md)

## Other AI clients

Codex has a direct opening button. Other clients use the instructions below or the [setup guide](https://tor-production.github.io/tor-event-calendar-ai/#other-clients).

### Ask your AI to set it up

Copy this request into your AI client:

```text
Help me connect nambli to this AI client. Use the client's official MCP setup method for a remote Streamable HTTP server named nambli at https://nambli.com/mcp, with browser OAuth. Inspect the existing configuration and preserve other connections. If you can configure it here, do so; otherwise give me the exact steps for this client. Let me finish sign-in and account consent in my browser. Then verify the connection by showing my connected account and today's events in Europe/Kyiv. If this client cannot use remote OAuth MCP, explain the supported local helper alternative at https://github.com/Tor-Production/tor-event-calendar-ai. Do not claim success until the connection is verified.
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
npm install --global ./dist/tor-event-calendar-ai-0.3.0.tgz
tor-calendar install-skill codex
tor-calendar connect
tor-calendar whoami
```

Follow the browser approval link printed by `connect`, approve the matching device and calendar account, and return to the terminal. The helper stores credentials in the OS keychain; never paste them into a conversation. Invoke the installed calendar skill explicitly when you want to use it.

## Source validation and support

From a clean checkout run `npm ci --ignore-scripts`, `npm test`, create `dist/`, then run `npm pack --pack-destination dist`, `python scripts/package.py`, and `python scripts/test_package.py`. Package checks do not establish catalog approval or OAuth acceptance. [Support](https://github.com/Tor-Production/tor-event-calendar-ai/issues) · [Privacy](https://nambli.com/privacy) · [Terms](https://nambli.com/ai/terms) · [Catalog status](submission/status.md)

## Plugin development workspace

All ecosystem plugins live in this repository; the private calendar repository owns the server. See [ecosystem ownership and task map](ecosystems/README.md). Shared upload/download recovery is documented in [file workflow](skills/nambli/references/files.md), including setup when no connector is installed. Server download support is deployed on nambli.com; the public 0.3.0 package is a prepared candidate awaiting recorded host acceptance, final videos and owner publication decisions. The existing 0.2.3 review and released 0.2.4 artifacts are preserved.
