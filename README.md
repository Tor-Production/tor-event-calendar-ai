# Tor Event Calendar AI · 0.1.0

Manage your own calendar from a local AI workspace. Install once, approve a browser connection once, and reuse it in later sessions. This public package contains the portable client, explicitly invoked skill and API references. The calendar application's source repository remains private.

```sh
npm install -g https://github.com/Tor-Production/tor-event-calendar-ai/releases/download/v0.1.0/tor-event-calendar-ai-0.1.0.tgz
tor-calendar install-skill codex
tor-calendar connect
tor-calendar whoami
```

Choose `claude`, `hermes`, `gemini`, `cursor` or `copilot` instead of `codex` for the local skill directory. Requires Node 22.18+ and an unlocked OS keychain. Choose the correct verified email/account and matching code/device in the browser. `connect --scope read` requests read-only access. `connect --no-browser` gives the public verification URI/code for a separate browser; it never prints the device secret or token.

Use `$tor-event-calendar` explicitly in Codex or `/tor-event-calendar` in clients supporting slash skills. Example: “Use tor-event-calendar to show today's posts in my connected account.” Ask the skill to create a generic event with title, exact time and IANA timezone; complete instructions need no generic approval. Missing post content offers an empty draft or supplied text/media. X and Reddit have their own planning fields.

Set a known timezone once using `preferences set preferences.json`, where the file contains `{"timeZone":"Europe/Kyiv"}`. `today --posts` uses that preference; `--zone IANA` overrides it for the operation. Multiple accounts use `accounts list`, `accounts default EMAIL_OR_ID`, or per-command `--account EMAIL_OR_ID`; a batch pins its verified identity. Account identity is distinct from a social publishing actor.

| Client / runtime | Versioned installation / invocation | Actual verification |
|---|---|---|
| Codex local desktop/CLI | CLI `install-skill codex` → `~/.agents/skills`; `$tor-event-calendar`; implicit selection disabled | Windows CLI/keychain and package validators exercised; existing source junction preserved |
| Claude Code | CLI `install-skill claude` → `~/.claude/skills`; explicit slash skill, model invocation disabled | Documented directory route; native client unavailable here |
| Hermes | CLI `install-skill hermes` → `$HERMES_HOME/skills`, or `%LOCALAPPDATA%/hermes/skills` on Windows, `~/.hermes/skills` elsewhere; explicitly request skill | Documented directory route; native client unavailable here |
| Gemini CLI | CLI `install-skill gemini` → `~/.gemini/skills`; host activation consent remains | Documented directory route; native client unavailable here |
| Cursor | CLI `install-skill cursor` → `~/.cursor/skills`; `/tor-event-calendar`; model invocation disabled | Documented directory route; native client unavailable here |
| GitHub Copilot CLI | CLI `install-skill copilot` → `~/.copilot/skills`; `/skills reload`, explicit skill | Documented directory route; native client unavailable here |
| Other machine/container/cloud | Separate pairing with available keychain, or explicit runtime secret injection | Linux/macOS native stores not tested here |
| ChatGPT cloud | Local keychain unavailable; no remote MCP/OAuth connector shipped | Not advertised as connected |

Primary docs checked 2026-09-28: [OpenAI skills](https://learn.chatgpt.com/docs/build-skills), [Claude skills](https://code.claude.com/docs/en/skills), [Hermes CLI](https://hermes-agent.nousresearch.com/docs/reference/cli-commands), [Gemini skills](https://geminicli.com/docs/cli/using-agent-skills/), [Cursor skills](https://cursor.com/docs/skills), [Copilot skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills). No invented client installer/deep-link or registry package is required: the exact release tarball installs our maintained CLI and its directory adapter. Native client host consent/reload behavior remains the client's responsibility.

`doctor` performs a read-only public service check and a synthetic keychain probe that it removes. `whoami` verifies the selected account. Tokens never enter prompts/argv/URLs/config/Git/stdout. Profiles are non-secret user-scoped metadata outside the install location. See [connections](skills/tor-event-calendar/references/connections.md) for multi-account/headless behavior and [API](skills/tor-event-calendar/references/api.md) for payloads, errors, ownership, timezones/files and complete [OpenAPI](skills/tor-event-calendar/references/openapi.json).

`publish-today --all` implements the scoped workflow and returns truthful per-item blocks when a publisher is absent. The portable CLI has **no social credentials**. LinkedIn requires a separately verified publisher for your account/actor/target; X/Reddit support planning only. External links are references, not ready video. Claims, pending receipt reconciliation and fake-adapter concurrency tests are implemented; no real social content was published to test this package. See [publication](skills/tor-event-calendar/references/publication.md).

Upgrade by installing the next exact release tarball, then reinstalling the marked skill directory. Uninstall a skill with `tor-calendar uninstall-skill CLIENT`; profiles survive. `tor-calendar disconnect --account SELECTOR` revokes only that connection; `npm uninstall -g tor-event-calendar-ai` removes the CLI. Existing unowned skills/junctions are refused and preserved. Existing helper tokens/automations are not rotated.

If keychain is unavailable, there is no silent plaintext fallback. Use a runtime secret manager with explicit `--environment --account IMMUTABLE_ACCOUNT_ID` as documented in the connection reference. Never paste a token into a setup prompt. Report issues at [GitHub support](https://github.com/Tor-Production/tor-event-calendar-ai/issues).

Official OpenAI catalog submission uses the same Skills-only ZIP/Platform review process as Session Exporter. A public release or personal marketplace is not catalog acceptance; the submission record states the actual review/publication status.

To validate a source checkout, run `npm ci --ignore-scripts` and `npm test` (isolated profiles and six directory adapters; no production or social requests). To package: `npm pack --pack-destination dist`, then `python scripts/package.py`. The ZIP uses sorted allowlisted files, fixed timestamps and permissions; repeated runs produce identical SHA-256. The npm tarball and plugin ZIP include the same versioned skill/client; release checksums are published beside them.
