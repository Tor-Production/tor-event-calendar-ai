# nambli for Cursor — preview

Manage your private calendar and prepare social content drafts with nambli. This preview bundles calendar, content and publication guidance, an account-scoped remote MCP connection, a scoped runtime rule and an optional local browser MCP.

## Supported scope

Read, create, update, move and delete calendar events using the intended existing connection. Prepare and save content drafts, custom field types and publication settings. Calendar changes do not publish or schedule social posts. Check the connected account before private work; create a connection only when no valid intended connection exists.

Direct chat-file transfer varies by host. If unavailable, the agent must provide a clickable authenticated upload link before browser troubleshooting; the maximum file size is 25 MiB. Earlier native Mac testing covered real PNG/PDF uploads and exact downloaded bytes. File replacement, uncertain-upload recovery, authorization negatives and the changed launcher's native Mac startup remain pending. See [the exact earlier artifact and evidence](ecosystems/cursor/ACCEPTANCE.md). That test used Cursor 3.26.13, macOS 13.7.8 and Pro; Free-plan behavior is not established.

## Install and connect

After Cursor approves and lists this preview, use its actual Marketplace page's **Add to Cursor** action. Submission alone does not create a public listing. Until then, maintainers can copy this directory's contents into `~/.cursor/plugins/local/nambli` and reload Cursor. The manifest must be at `nambli/.cursor-plugin/plugin.json`, without another enclosing folder. Preserve an existing installation and its account connection when updating.

In **Customize**, verify nambli, four skills, its runtime rule and two MCP servers. `nambli` is the calendar. `nambli-browser` is an optional local browser, without a second calendar grant. Reuse the existing calendar connection; authenticate only if needed and verify the actual account and permissions. The calendar skill remains explicit-only; loading instructions authorizes no changes.

The remote calendar connection needs no local Node installation or API key. The optional headed browser requires an already installed Node 22.18+, npm for initial setup and Google Chrome. Its launcher selects a compatible existing runtime and uses a private package cache without changing global Node/npx, PATH or shell profiles. See [browser setup and immediate upload-link fallback](ecosystems/cursor/RUNTIME.md).

## Publication preview

Publication skills and the Cursor browser adapter are included as preview workflows. A complete real LinkedIn publication with exact composer formatting, immediate followups and durable receipts has not yet been verified in Cursor. This listing claims no verified complete or unattended social publisher. LinkedIn requires the user's separate browser login and explicit publication instruction. A calendar draft remains unpublished until a separately authorized publisher acts. If browser preflight or receipt persistence is unavailable, stop before publishing.

This Cursor preview is independent of the existing OpenAI submission. Stable root Codex, Claude and portable plugin files remain unchanged.

## Maintainer verification

This directory is a reviewed export, not a separate implementation. [PROVENANCE.json](PROVENANCE.json) pins the canonical source, original 28-file allowlist, exact source/export hashes and intentional metadata changes. The distinct preview version `0.3.3-cursor.1` does not replace earlier dev.5 archives.

From the repository root, using Git and Python 3.12+:

```sh
# Only if a shallow clone lacks the pinned canonical source commit:
git fetch origin develop
python plugins/cursor/nambli/release/validate.py
python plugins/cursor/nambli/release/validate.py --self-test
```

Validation checks exact export provenance, nested component/Markdown references and confinement of the release diff to this plugin plus the root Cursor marketplace manifest. Its self-test corrupts temporary copies to verify failures. Official schema URLs/hashes and the separately run official template validator are recorded in provenance; the local script is not a general JSON Schema engine. It makes no calendar calls, installs no packages and publishes nothing. Native and runtime acceptance remain separate.

[Homepage](https://nambli.com) · [Privacy](https://nambli.com/privacy) · [Terms](https://nambli.com/terms) · [Support](https://github.com/Tor-Production/tor-event-calendar-ai/issues) · [Release checklist](ecosystems/cursor/MARKETPLACE.md)
