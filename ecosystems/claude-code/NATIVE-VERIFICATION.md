# Claude Code native verification (#79)

Run in an authorized local Claude Code session. Keep the checklist in [#79](https://github.com/Tor-Production/tor-event-calendar/issues/79), including any fixes and retests. Do not mark this check passed from Python/package results. The implementation issue is [#69](https://github.com/Tor-Production/tor-event-calendar/issues/69); final download verification also requires shared #65/#66.

1. Record date, OS, `claude --version`, plan/provider, organizational permissions, selected route/scope, source commit, package version and actual exposed tools. Avoid recording private event content or credentials. Follow the [setup guide](README.md) from a fresh session. Check `get_profile` and compare stable identity with the browser account before reads/writes. Use a bounded local-day read in `Europe/Kyiv` with limit 5, followed by an exact `get_event` where authorized.
2. Generate synthetic bytes with `python ecosystems/claude-code/fixtures/make_files.py`. The script writes only `work/claude-code-fixtures/`, with an image, PDF and `SHA256SUMS`. Read [post-draft.json](fixtures/post-draft.json), retaining its exact `2026-10-12T14:00:00+03:00` and `Europe/Kyiv` for this synthetic test. Ask Claude explicitly:

   ```text
   /tor-event-calendar-ai:tor-event-calendar Use the disposable synthetic fixture in ecosystems/claude-code/fixtures/post-draft.json. Verify my account, get only the LinkedIn platform schema, prepare the event, then create it with the same prepared UUID and payload. Keep all named File fields explicitly typed, with no File values in customFields. Read it back. Save only a calendar draft; no social publication or email. Remember the event UUID, current revision and persisted fields for this test.
   ```

   On a manual MCP route without the skill, use the same request without its slash command. Do not add permissions or bypass approvals. Record the actual prepare/create/read tool results. The fixture is input to the planner, not a pre-created event; do not reuse a fixture UUID across accounts. If a response is uncertain, read the returned stable UUID before any identical retry.
3. Ask to change only `post_text` to `Synthetic connector test: revision two, verified from a new session. Do not publish.` Read the exact event revision first and pass it to `update_event` with an explicit String type. Read back text, time, timezone, LinkedIn personal/public settings, field types and advanced revision. Start a new conversation, verify the same account, and read the exact saved UUID; ensure unrelated fields persist and no duplicate event was created.
4. Ask to attach generated `image.png` to `image` and `brief.pdf` to `brief_pdf`. Observe Claude identifying its host transport limit and returning real `get_file_upload_link` actions. Upload in the browser with the matching account. Read back after each: attachment ID, field name, filename, MIME, size, revision. Retry an unchanged uncertain upload only with its retained UUID. Test an intentional replacement on this disposable field, verify the latest revision and new ID, and ensure the other field is unchanged. Never reuse an upload UUID for changed bytes. If the chosen local helper is used, record its version and exact account profile separately.
5. Call shared #66 `get_file_download` with `eventId`, current `eventRevision`, `attachmentId` and exact `fieldName` for each saved file. Check metadata and `bytesDelivered: false`; for the synthetic files under 512 KiB, inspect the returned resource link and try connected `resources/read` only if the host exposes it. Record resource visibility, actual content and whether Claude decoded/read it. Otherwise open the returned authenticated `browserUrl`, match the account, and choose **Download file**; also verify this fallback when resources work. Compare SHA-256 against `work/claude-code-fixtures/SHA256SUMS`. On PowerShell use `Get-FileHash -Algorithm SHA256 -LiteralPath 'PATH_TO_DOWNLOADED_FILE'`. A paired helper that includes #66 may use `tor-calendar download EVENT_ID ATTACHMENT_ID DESTINATION --account PROFILE_ID`; record its version and save receipt. If the tool is not yet exposed, record that blocker and use the event editor's filename download without claiming the new contract passed. Record separately: action returned, bytes downloaded, hash equality, and whether Claude read a host-accessible local file. Metadata readback alone is insufficient.
6. In a fresh conversation with the connector but without invoking the skill, repeat an upload request on this test record; shared server guidance should offer the working host fallback. With nambli disabled for a separate test session, request setup; expect the public setup link and no fabricated tool calls. Restore the prior enablement afterward.
7. Reconnect and verify identity; test expiry/refresh after the server's 900-second access-token lifetime. Revoke only this test grant in the matching account's connection controls and verify it fails closed. With separately authorized read-only and second-account fixtures, check upload rejection and wrong-account denial; do not explore another real account or mutate its records. If those fixtures are unavailable, mark those steps blocked. Test deleted-file download on only a disposable attachment. Reread on stale revisions; never silently replace concurrent changes.
8. Delete only this test UUID after recording results, using its latest revision, and verify it is gone. Revoke only test grants when finished. Keep existing events, connections, tokens and installations intact. Record failures, expected/actual behavior, reproduction and focused fixes in #79. The real post brief, email draft and authorized publishing/sending checks stay in #41–#43.

## Evidence record

| Item | Observed value/result |
| --- | --- |
| Test date, OS, host/version, plan/provider | |
| Source commit, plugin version, installation route/scope | |
| Actual exposed tools and grant scope | |
| Stable account identity checked against browser | |
| Bounded range and timezone | |
| Disposable event UUID; create/edit/new-session revisions | |
| Persisted text, exact time, types and LinkedIn settings | |
| Image/PDF fields, attachment IDs, names, MIME, sizes | |
| Download contract/server revision, bytes and hashes | |
| File access in Claude vs browser delivery | |
| Retry/replacement, wrong-account/read-only/deleted-file results | |
| Refresh/reconnection/revocation | |
| Cleanup, remaining blockers and linked fixes | |
