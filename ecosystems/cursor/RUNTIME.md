# Cursor browser runtime and upload recovery

The calendar's remote OAuth MCP has no Node or Chrome requirement. `nambli-browser` is a separate local process. Cursor starts the bundled `browser-launcher.cjs` with the `node` command and expands `${CURSOR_PLUGIN_ROOT}` to the actual installed plugin path. The small CommonJS bootstrap is compatible with Node 14.21.3; Playwright and the publication journal still require an existing Node 22.18+ runtime. Having an old Node first on PATH is not sufficient reason to change a global `node`/`npx` wrapper.

The launcher probes the current executable, absolute PATH entries and bounded standard Node installation/version-manager locations (including nvm, Volta, fnm, asdf and mise). It executes candidates directly with `--version` and a timeout, rather than sourcing a shell profile. `NAMBLI_BROWSER_NODE` can explicitly select an existing absolute Node executable. An invalid explicit choice fails clearly instead of silently using another runtime. `NAMBLI_BROWSER_CHROME` can select an existing absolute Google Chrome executable; otherwise standard OS installation locations are checked before any package setup.

It never installs Node or Chrome, edits global executables/symlinks, changes PATH or a shell profile, creates a calendar connection, or reads calendar/LinkedIn tokens. If no usable runtime or Chrome exists, the browser process fails before dependency installation. An installed modern Node normally includes npm; if npm is absent and the pinned package is not already cached, report that prerequisite rather than invoking a global npx wrapper.

First use may download the exact official Microsoft package `@playwright/mcp@0.0.83` from the public npm registry. The selected modern Node runs its bundled npm directly, with lifecycle scripts/browser downloads disabled, an isolated package directory, an isolated npm cache and empty user/global npm config files. Existing global npm packages and configuration are not changed. The completed package is checked before reuse and started with the selected Node and actual Chrome executable. The default browser stays headed and retains the upstream per-workspace profile and MCP-root file boundaries; no CDP, unrestricted-file or no-sandbox flags are added. Package cache defaults are `%LOCALAPPDATA%/nambli/cursor-browser`, `~/Library/Caches/nambli/cursor-browser`, or `${XDG_CACHE_HOME:-~/.cache}/nambli/cursor-browser`. `NAMBLI_BROWSER_CACHE` may select an absolute private/test directory. Failed setup diagnostics use stderr; stdout is reserved for the browser's MCP protocol.

For a read-only prerequisite check, use a documented shell tool and the installed plugin's actual absolute path:

```sh
node /actual/plugin/ecosystems/cursor/browser-launcher.cjs --doctor
```

The JSON identifies the selected Node/Chrome and whether the pinned package is already cached; it does not install dependencies, authenticate, open a page or prove a LinkedIn workflow. When running the publication journal, use the returned modern Node executable explicitly if the shell's default Node is old. `${CURSOR_PLUGIN_ROOT}` is a Cursor manifest expansion, not an assumed shell variable. A failed doctor needs no account reconnection.

## Give the upload link before runtime troubleshooting

For an authorized calendar file upload, a browser startup failure must not leave the user waiting through Node diagnostics. Through the already selected calendar connection, read the current event and verify its explicit named File declaration. Use the current revision only if a necessary event patch is required. Then request `get_file_upload_link` with its actual advertised schema: the current tool accepts only `eventId` and `fieldName`, not `eventRevision`. Immediately render a clickable Markdown link labelled **Upload the selected image**, using the tool's actual returned URL as its target. Do this before asking the user to restart or repair the browser server. Do not invent an upload URL, copy credentials, create a helper/second calendar connection or claim that showing the link uploaded the file. The user can open it, sign in to the matching calendar account if required, and select the file. Verify the resulting attachment and revision afterward; actual download bytes/hash remain a separate check.

If `get_file_upload_link` itself is absent, refresh the existing connection's tools once when supported, then report the precise unavailable capability and use the shared signed-in calendar fallback. Keep a received account-bound link in the private conversation, not source code, public logs, screenshots or submission artifacts. A calendar upload fallback does not provide a LinkedIn image-upload transport. Missing browser/journal capability still blocks a new social submission before Post, with the full agreed followups retained for a later verified run.

After runtime repair, restart only `nambli-browser` and inspect its actual tool availability; retain the working calendar connection. The tested older ZIP and its acceptance evidence remain separate from this changed candidate. Native macOS startup of this launcher, a Marketplace installation and a real LinkedIn composer/full publication require their own evidence.

References: [Cursor plugin path expansion](https://cursor.com/docs/reference/plugins), [official Playwright MCP](https://github.com/microsoft/playwright-mcp).
