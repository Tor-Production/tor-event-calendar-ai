# Automatic local files in Claude Code

This unreleased candidate bundles the existing `tor-calendar` source and a guarded Claude file runner. Remote MCP remains the route for account/calendar operations. Local files travel from this machine directly to the same nambli account through the helper; no OpenAI temporary file URL is needed.

## Setup performed by the agent

The user explicitly choosing automatic local uploads authorizes this helper route. The agent runs the following steps; the user does not need to type terminal commands. Plugin installation alone does not pair an account or authorize a file upload.

1. Call MCP `get_profile` now. Keep its stable account ID and the canonical origin `https://nambli.com`. Confirm the intended account. If MCP is disabled/unavailable, restore that connection first; do not silently switch to helper-only account access.
2. Resolve the actual absolute plugin root from the loaded skill, not the working directory. Check `node --version` is at least 22.18 and npm is installed. If missing, explain that this optional local route needs Node with npm; offer the browser upload fallback. Do not use an unpinned `npx` helper or alter global Claude permissions.
3. Run `node "ABSOLUTE_PLUGIN_ROOT/ecosystems/claude-code/local-files.mjs" setup`. This copies the bundled helper into a source-hash-specific user cache and installs the exact lockfile dependencies with lifecycle scripts disabled. It keeps the plugin directory/cache unchanged, installs nothing globally, and verifies the OS-specific keyring binary can load. macOS arm64/x64 and Windows native dependencies are pinned. Internet is needed for first dependency installation. Setup does not pair or check an account: `accountStatus: "not_checked"` is deliberate. Only an explicit `status --account ... --profile ...` checks the selected connection. The tested ZIP emitted a misleading hardcoded `accountConnected: false`; that value was not an account check.
4. Run the same entrypoint with `doctor`, then `accounts`. Doctor checks the OS keychain with a disposable probe; it does not change calendar data. Accounts lists nonsecret connection metadata. Choose only a profile whose origin and immutable account ID match fresh MCP identity. Never select a default by convenience or reuse an email as the account selector.
5. If no matching manage profile exists, run the entrypoint with `connect` and keep the process alive for browser approval. The user confirms their account/device/permission in the browser. This is a separate local-helper connection; the existing MCP OAuth grant remains. The user may see a macOS Keychain permission dialog, but no dialog is required for a successful check; the reported Mac run completed and reused its credential without one. Never request, print, extract or copy its credential. A connection failure is not permission to bypass OS storage. Re-pairing the same helper account replaces its local credential entry; other accounts and MCP grants remain.
6. Run `accounts` again, then `status --account MCP_ACCOUNT_ID --profile PROFILE_ID`. The guarded runner checks the origin/account before credential access, verifies live identity, and reports whether local uploads are ready. If the browser paired a different account or a read-only profile is selected, stop and explain the mismatch; never upload anyway. Keep the selected profile for this task, but recheck fresh MCP identity in a new session.

`setup` is safe to repeat: it reuses an intact cache for identical source/OS/architecture/Node ABI. Updated plugin source gets a new cache, while account pairing remains in the OS keychain. If the cache is modified/incomplete, preserve it for inspection. Never delete all Claude or helper configuration to repair one installation.

## Each requested upload

In Desktop's local Code tab, the tester attaches the original PNG/PDF with the attachment button or drag/drop. The agent must discover actual readable original bytes from that attachment; do not substitute a generated fixture or guess a file path from its visible name. The [Desktop guide](https://code.claude.com/docs/en/desktop#add-files-and-context-to-prompts) documents images/PDF attachment, but does not guarantee a shell-readable path. Record that part of the native test separately. This is not a request for the user to paste a filesystem path.

Use an explicit skill invocation such as `/nambli:nambli` plus the user's file and target intent. The agent performs the commands, including paths with spaces/Unicode; quote arguments for the actual shell. Examples use placeholders, not literal values to execute.

1. Get fresh MCP identity, identify the exact owned event, inspect its current revision and explicit File field. If the field needs creation, update only `customFieldTypes` through MCP and reread. Do not infer File from the key name or save local paths/file values into JSON. Replacing an existing field needs the user's replacement intent.
2. Check the matching local profile with `status`. Invoke:

   ```text
   node "ABSOLUTE_PLUGIN_ROOT/ecosystems/claude-code/local-files.mjs" upload EVENT_ID FIELD_NAME "ABSOLUTE_LOCAL_FILE" --account MCP_ACCOUNT_ID --profile PROFILE_ID --revision CURRENT_EVENT_REVISION
   ```

   The runner rejects mismatched accounts/origins, read scope and stale revisions. It uses `tor-calendar` multipart upload, the same 25 MiB per-file limit, and a stable upload UUID derived from the event/field/filename/MIME/bytes. It returns a compact verified receipt, not the full event text. A receipt hash describes uploaded bytes; it is not a download round trip.
3. Read back through MCP `get_event` and compare the exact File field, attachment ID, filename, MIME, size and revision. After an uncertain response, first read the same event. If a retry is still needed, use the same unchanged file/field/event and newly observed revision: the helper retains the deterministic upload UUID. Do not blindly retry conflicts, change bytes under the same intent, or generate a different event.
4. For a requested download or a synthetic byte comparison, use the exact attachment ID from the latest event:

   ```text
   node "ABSOLUTE_PLUGIN_ROOT/ecosystems/claude-code/local-files.mjs" download EVENT_ID ATTACHMENT_ID "ABSOLUTE_NEW_DESTINATION" --account MCP_ACCOUNT_ID --profile PROFILE_ID
   ```

   Compare the returned download SHA-256 with the original fixture. Existing destinations are preserved. Metadata alone does not prove downloaded bytes or model understanding.

On absent Node/npm, inaccessible keychain, missing consent, denied tool permission or unavailable local files, state the specific blocker. Offer the existing authenticated `get_file_upload_link` browser route; do not fabricate a successful upload. Never bypass host permissions. Local Code sessions are the target; web/cloud execution is not established by this package.

## Focused native check for the new route

Prior macOS browser-file/CRUD and Windows API read/reconnect evidence remains valid for its exact older artifact. It does not establish this new automatic helper route. Record candidate version/hash, OS/architecture, Node/npm and Claude versions.

- Setup, matching profile, safe repeat setup, fresh process reuse without new helper browser consent.
- Before synthetic writes, confirm notifications are paused in the tester's own account and record the prior setting. Use the historical `fixtures/post-draft.json` and the synthetic PNG/PDF generator from `NATIVE-VERIFICATION.md`; no social publishing or email drafts.
- Agent uploads both fixtures itself to separate explicit File fields, including a copied fixture with spaces/Unicode in its name. Read back each; download to new local paths and compare SHA-256.
- Repeat the same unchanged fixture at the latest revision. Confirm the same attachment ID, no duplicate and no extra revision. This verifies replay; only label a real interrupted/uncertain transfer scenario passed if it was actually exercised.
- Replace only the image with deliberately different bytes, keeping the PDF untouched. Check stale revision is refused without a second mutation. Offline tests cover wrong-account/read-only guards; controlled native grant checks remain separately unverified until performed.
- Delete only the synthetic test event, verify event/file cleanup, restore the prior notification setting. Preserve MCP/helper grants and unrelated data.

Record each actual result or blocker in a redacted report. Existing acceptance gates for published installation and controlled authorization negatives still apply. Source/offline checks do not establish Mac or Windows native upload success.
