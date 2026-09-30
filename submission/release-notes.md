# Nembli AI 0.2.2

Nembli combines an explicitly invoked calendar skill with hosted, account-scoped MCP tools and browser OAuth. Manage entries, typed draft fields and named File links without a local runtime. This update uses the owner-provided Nembli artwork, preserves it during packaging, and adds the real product demo and review scenarios. Calendar writes never publish or schedule social posts.

The public GitHub package release is separate from OpenAI directory review and approval. Earlier v0.2.1 artifacts remain unchanged.
# 0.2.3 — Nembli branding and easier setup

- Show the approved Nembli artwork in plugin and skill settings and name the MCP connection `nembli`.
- Open an installed Personal marketplace plugin directly from the Codex button; provide a plugin-browser and manual setup fallback.
- Include a repository marketplace for first Codex installations.
- Keep instructions for Claude Code, Claude web/Desktop, Cursor, VS Code/Copilot, Copilot CLI, Gemini CLI, Hermes and other MCP clients, with a copyable request asking their AI to configure Nembli.
- Preserve all six optional local helper adapters, explicit skill invocation and account-scoped consent. Renaming the MCP key may require a new browser sign-in.

This release does not publish the draft OpenAI directory listing. Calendar writes do not publish or schedule social posts.

# 0.2.4 — Attach files from chat

- Prefer the new hosted `upload_file` MCP tool for Codex/ChatGPT attachment inputs.
- Preserve the account-bound browser upload fallback for hosts without file-input support.
- Require an explicitly typed File field, current revision and stable upload UUID; verify attachment metadata after upload.
- No API tokens, base64 or local paths are sent in remote MCP JSON. Host file links are temporary and are not saved in calendar records.

Local official-SDK tests verify upload/replacement/retry, account and scope isolation, bounded downloads, URL restrictions and the 25 MiB limit. Native Codex and ChatGPT attachment transport still needs a user-host acceptance run; server/schema support is not a claim that every client version exposes it.
