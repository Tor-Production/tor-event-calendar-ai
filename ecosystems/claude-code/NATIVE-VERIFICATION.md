# Claude Code native verification (#79)

Run in an authorized local Claude Code session. Keep the checklist in [#79](https://github.com/Tor-Production/tor-event-calendar/issues/79), including any fixes and retests. Do not mark this check passed from Python/package results. The implementation issue is [#69](https://github.com/Tor-Production/tor-event-calendar/issues/69); final download verification also requires shared #65/#66.

## Remaining acceptance checks — isolated integration and public install, 2026-10-13

The owner explicitly confirmed the remaining scope: final website/marketplace onboarding including decline/fallback; controlled read-only/foreign-account/revoked-grant negatives; unchanged retry after an uncertain upload response. Previously accepted replacement and stale-revision checks do not need a duplicate native run for this agreed scope. Their earlier browser evidence is retained; this does not relabel it as new helper-native evidence.

The actual current public helper and current private Worker passed a combined local integration run using real authorization/upload routes, migrations, in-memory SQLite/R2 and disposable synthetic identities. Results:

- A read grant is rejected by the helper before opening the local file; an independent multipart request is rejected by the Worker with 403 and no mutation.
- A different account gets 404 for the owned event, file and helper upload/download. The foreign file request does not read R2/KV.
- Revoking one disposable grant produces 401 while three unrelated test grants remain usable. An allowed read grant still downloads identical bytes.
- Actual loopback HTTP sockets are closed before commit and after a successful Worker 201 commit. Both cases return NETWORK_UNCERTAIN without automatic POST retry. After a fresh event read, retry uses the same upload UUID, exactly one attachment and one R2 put; hashes match on download and quota is not double-counted. After-commit replay returns 200 without advancing revision or updatedAt. Cleanup restores storage totals.

These are isolated integration PASS results, not native Claude UI, OS-keychain or deployed-service acceptance. The receipt records 49 runtime/migration source hashes, zero external network attempts/production requests, and successful cleanup. Reproduce from the private server repository with Node 22.18+:

```sh
node --experimental-transform-types scripts/test-claude-client-acceptance.mjs /absolute/public-plugin-source /absolute/new-receipt.json
```

The test creates only local synthetic users/grants and never loads real profile or credential storage. Two separately approved disposable identities are still needed for live native authorization checks. Do not reconnect a working helper account with a different scope: the standard CLI replaces its same-origin/same-account profile credential. Use isolated test profiles or strictly disposable identities.

Public onboarding was also exercised with Claude Code 2.1.296 in a new temporary config/project. Before this candidate is integrated, `claude plugin install nambli --marketplace Tor-Production/tor-event-calendar-ai#develop --scope local --json` fails with `not_found`: the fetched catalog still contains `tor-event-calendar-ai`. The live `nambli.com/connect-ai` Claude panel still offers manual MCP setup only. Its exact manual command successfully created the canonical HTTP MCP entry in the disposable local profile; removing that entry succeeded. No model call, OAuth approval or production calendar write was performed. Interactive decline and end-to-end authenticated fallback remain unverified.

Review candidate `0.3.3-dev.2` includes the two diagnostics corrections after the preserved Mac-tested `0.3.3-dev.1` archive. Final advertised installation remains open until the intended branch and website are updated and retested. Anthropic directory publication remains a separate later step. Keep #79 Open / In Progress.

## New automatic-upload candidate — 2026-10-13

Candidate `0.3.3-dev.1` adds agent-run local helper upload. Follow [AUTO-UPLOAD.md](AUTO-UPLOAD.md) for setup and focused native checks. The Mac tester must attach PNG/PDF in the Claude application UI, then let the agent resolve the actual accessible files and upload them. A manual path upload alone does not establish that end-to-end path. The owner delegated new write/file testing to the friend. The 13 October report below now establishes the new Mac app-attachment and reuse scenarios; the older evidence remains associated with its own exact ZIP.

## Reported Mac app-attachment and reuse results — 2026-10-13

The supplied redacted `REPORT-nambli-auto-files (2).md` reports tests in the local Claude desktop application Code tab on macOS 13.2.1 arm64, Claude Code 2.1.296, Node 24.20.0 and npm 11.19.0. It identifies candidate `0.3.3-dev.1` by shortened ZIP hash `237adc19…a53a`, matching the expected archive SHA-256 `237adc19b8ff30af2e06998151e7ccde2527dcac09aac55d3e360bc16462a53a`. These are tester-reported results; raw execution and the remote installed bytes were not independently inspected. The exact tested ZIP remains unchanged.

| Scenario | Reported result |
| --- | --- |
| Local app installation | PASS: one enabled user-scope `nambli@nambli-local-test`, version 0.3.3-dev.1; server `plugin:nambli:nambli`, 16 tools; no inline plugin duplicate |
| Helper pairing and account | PASS: setup/doctor, separate browser-approved manage pairing, and fresh status matching MCP stable account/origin |
| Original app attachments | PASS: PNG delivered as a session `images/1.png` copy (100 bytes), PDF as an original-file `@` reference (634 bytes); observed original bytes, no generated substitutes or guessed paths |
| Autonomous upload/readback | PASS: image revision 1→2 and PDF 2→3; exactly two attachments in the intended explicit File fields, matching metadata |
| Download byte comparison | PASS: both helper downloads matched input SHA-256 and `cmp` byte equality |
| Unchanged replay | PASS: same PNG attachment ID, revision 3 and updatedAt preserved; no duplicate. A genuinely interrupted/uncertain transfer was not exercised |
| Cleanup | PASS: only the historical synthetic event deleted; subsequent event read 404 and bounded list empty; deleted attachment download failed. Notifications were already disabled and remained unchanged |
| New session/process reuse | PASS: setup reused the cache; one matching manage profile; connect skipped; live status matched fresh MCP identity without new browser approval or calendar writes |

The user separately confirms that no macOS Keychain dialog appeared. A dialog is not an acceptance requirement. The report's fresh-process authenticated status plus the shipped runner's mandatory OS-keyring read supports saved credential reuse; no environment-token or plaintext fallback exists in that runner. Keychain UI policy and the item's ACL were not independently inspected. Do not force re-pairing or alter grants just to produce a dialog.

Two source-only diagnostics corrections follow this report: setup reports `accountStatus: "not_checked"` instead of the hardcoded `accountConnected: false` (it never examined account/default status); sanitized error codes now preserve numeric HTTP codes such as `HTTP_404`. No credential/default lookup was added to setup. These edits are not in the tested ZIP and do not change its hash. The helper stores the app-provided PNG name `1.png`; the original name is unavailable in that host result, while bytes match.

Remaining in the owner-confirmed scope: controlled read-only/foreign-account/revoked-grant checks; a genuinely uncertain native transfer retry; final published installation/onboarding. Existing automated guards and previous browser replacement evidence remain supporting evidence, not new native helper passes. This report completes the requested app-attachment upload/download and saved-connection reuse scenarios. #79 remains Open / In Progress for the remaining scope; Anthropic directory publication is a later separate stage.

## Reported native results — 2026-10-12

Reviewed on 2026-10-13 from the supplied redacted `REPORT-nambli-id-2026-10-12.md`. These are tester-reported results; raw transcripts were not independently reviewed. The tested development ZIP is `nambli-claude-code-0.3.2-dev.zip`, version 0.3.2, SHA-256 `1798197fb2d4915e10ba928c9bef33b89649888210ed064947cfd2b878fdcc6d`. It was loaded with `--plugin-dir` on macOS 13.2 using Claude Code 2.1.296; the tester reports a Claude Pro plan. This is local-candidate evidence, not acceptance of a released marketplace or website installation route. Later documentation edits do not change that tested archive.

| Check | Reported outcome |
| --- | --- |
| Identity and discovery | PASS: plugin `nambli`, server `plugin:nambli:nambli`, skill `/nambli:nambli`, sixteen tools under `mcp__plugin_nambli_nambli__`, canonical MCP origin; old server absent |
| Rename and account | PASS: rename required browser OAuth again; profile matched the intended account; old grant preserved |
| Bounded reads | PASS: Kyiv and Bucharest local-day reads with limit 5; both zones had the same UTC offset on the tested date, so this does not test differing offsets |
| Disposable calendar record | PASS: prepare/create with the same UUID, read, text-only edit and persistence in a new conversation; historical time, types and unrelated fields retained |
| File upload and replacement | PASS: authenticated browser PNG/PDF upload into separate File fields; replacing the image preserved the PDF; no invented native upload transport |
| File download | PASS: both `resources/read` and browser download delivered synthetic PNG/PDF bytes with matching SHA-256; model interpretation of their visual/text content was not established |
| Negative cases | PASS: deleted/replaced attachment returned 404; stale event update and file download returned 409 without overwriting data |
| Connection continuity | PASS: ten fresh processes reused the connection; calls more than 25 minutes after login succeeded without renewed login. Token refresh/rotation itself was not directly observed |
| Cleanup and notifications | PASS: disposable event and its files removed and absence checked; notifications were already disabled and remained disabled |

The report labels scenario 19 a partial FAIL: a session with the plugin absent did not provide the exact public setup URL, but did not fabricate tool calls. No public setup source was supplied to that session. This does not establish a plugin defect; step 6 below now separates missing-connection guidance with instructions available from a completely absent plugin. Keep the original result. The corrected disabled-connection case passed on Windows/API on 13 October: with the plugin/skill still available and only its MCP server disabled, Claude reported get_profile unavailable, claimed no fresh tool call, did not reuse old account data as fresh evidence, and supplied both nambli.com/connect-ai and the packaged Claude setup-guide link. The supplied screenshot then shows the same server connected again with sixteen tools after Enable. No post-Enable tool result was supplied; this establishes connection/discovery restoration. The fully absent-plugin case with a supplied public setup source remains separate and unverified.

`get_file_download.bytesDelivered: false` describes that tool response; successful subsequent `resources/read` is a separate delivery. The planner-only `draft: true` flag is not a persisted event status: complete publishing settings can remain present while publication automation remains disabled. Neither observation establishes a product defect.

### Acceptance scope across the two testers

The tester's same-candidate macOS/Pro results count as evidence for calendar writes, new-conversation persistence, browser uploads, file download hashes, replacement and cleanup. The owner's Windows/API evidence complements those checks with account reads, manual reconnect, process restart and disabled-server guidance. The agreed #79 checklist does not require repeating every CRUD/file case on every OS/provider. Windows-specific file acceptance remains unclaimed, but its absence does not invalidate the tested routes or create a mandatory duplicate test. A changed upload implementation or an explicit Windows-specific support claim would need focused verification.

Three acceptance groups remain in #79:

1. Clean installation through the final advertised website/marketplace route, using the intended renamed artifact, including declined/unavailable/fallback paths. The local `--plugin-dir` route is verified. Setup guidance with the entire plugin absent and a supplied public source belongs to this onboarding check; recall of an undisclosed URL is not an acceptance requirement. Catalog publication remains a separate owner action.
2. Native authorization negatives with separately authorized fixtures/grants: read-only upload rejection, foreign-account denial and a revoked disposable grant failing closed. Preserve the working grants. Existing server tests are supporting evidence, not a substitute for the unperformed native cases.
3. An unchanged upload retry after an uncertain result, using the same upload UUID and verifying no duplicate. Successful replacement and stale-revision rejection do not establish this case.

Repeated browser OAuth solely to add another checkbox is not a separate gate: renewed OAuth after the rename already passed. Session continuity and automatic grant reuse have observed evidence; direct token refresh/rotation inspection was not performed and is not claimed. Reading the visual/text contents of PNG/PDF is separate from the verified byte/hash transport and is only required for that additional product claim. Issue #79 remains open/In Progress.

Separate owner evidence on 2026-10-13: the supplied Windows screenshot shows Claude Code 2.1.296, Haiku 5.5, API Usage Billing, successful OAuth to `plugin:nambli:nambli` and explicit `/nambli:nambli` invocation. The owner confirmed the intended account. Two native MCP calls, `get_profile` and `list_events`, succeeded; the requested 2026-10-13 Europe/Kyiv read with limit 5 returned zero events and the response reported no writes. The local isolated model check had returned `API_OK`. This establishes owner-account API authentication and the initial profile/calendar read. A subsequent owner screenshot and confirmation establish manual Reconnect PASS: `/mcp` displayed reconnection to the same server, the stable account ID matched the previous tool result, and `get_profile` plus `list_events` succeeded with zero events, `truncated: false` and no writes. Full process restart also passed: the owner confirmed automatic nambli reconnection without another browser OAuth sign-in; get_profile/list_events succeeded for the same locally verified email with zero events, truncated=false and no writes. This establishes saved-connection reuse, not direct observation of token refresh/rotation. Windows write/file checks are deferred by the owner's current read-only testing choice; notification preferences were not changed. The preceding screenshot for the other account was explicitly identified by the owner as the friend's result and is not Windows/API evidence.

## Quick check for a friend

Use your own eligible Claude Code account/provider and your own nambli account. Claude Free does not include Claude Code; Pro includes it subject to usage limits. Share results and redacted errors, never credentials or private calendar content.

1. Follow the [scoped update and retest steps](README.md#update-an-existing-claude-test). Extract the renamed candidate to a new known folder; call its absolute path `SOURCE_ROOT`. Keep the old source and pending test UUIDs/revisions/file hashes. Preserve the same scratch working directory and Claude profile, stop the old session, and start a fresh process with only `claude --plugin-dir "ABSOLUTE_SOURCE_ROOT"`. Inspect and disable only an exact old installed plugin entry in its observed scope if present. Do not clear credentials or revoke grants for the rename. Hosted `#develop` and published v0.3.2 may still use the former ID; do not use them as proof of this candidate. Record the archive hash and local changes.
2. Confirm the active candidate ID `nambli`, server `plugin:nambli:nambli`, skill `/nambli:nambli` and tools `mcp__plugin_nambli_nambli__…`. Review only permissions that reference the old identity. Complete browser OAuth only if the host requests it; verify `get_profile` matches your account. Ask for today's events with your timezone and limit 5. This requires no test-record writes; five is a sample query limit. Record whether authentication carried over or was renewed.
3. Before write checks, pause notifications in your own nambli account and confirm that setting. Record the prior setting. If you prefer not to pause them, stop after reads and mark writes unverified. Asking Claude for no email does not disable account notifications.
4. Invoke `/nambli:nambli` and follow full-checklist steps 2–3 using the supplied historical fixture. If an earlier run left an exact disposable UUID, verify its owner and latest state first, then continue or clean up that record; never create a duplicate automatically. Otherwise create the synthetic fixture, read it back, edit only its text, then open another conversation and read the same UUID.
5. Delete only your test UUID with its latest revision, verify removal, then restore your chosen notification setting. Report version, source, installation route and pass/fail for identity/read/create/edit/new-conversation/cleanup. Files, hashes and reconnection remain separate checks below.

A quick pass covers only the steps performed; it does not complete all of #79.

## Full native checklist

Pause your account's notifications before fixture writes, as above. Keep the fixture historical and leave publication automation unset. Preserve earlier disposable-record UUIDs, revisions and file hashes until their cleanup is verified. Do not delete real events or reset connections when changing plugin identity.

1. Record date, OS, `claude --version`, plan/provider, organizational permissions, selected route/scope, source commit or development archive hash, package version and actual exposed tools. Avoid recording private event content or credentials. Follow the [setup guide](README.md) from a fresh session. Check `get_profile` against the browser account before reads/writes. Use a bounded local-day read in `Europe/Bucharest` with limit 5, followed by an exact `get_event` where authorized.
2. Set `SOURCE_ROOT` to the absolute checked-out or extracted source location from the quick check. Run `python "SOURCE_ROOT/ecosystems/claude-code/fixtures/make_files.py"`, replacing `SOURCE_ROOT` with that actual path. It writes only `SOURCE_ROOT/work/claude-code-fixtures/`, with an image, PDF and `SHA256SUMS`. Read [post-draft.json](fixtures/post-draft.json), retaining its historical `2020-01-15T14:00:00+02:00` and `Europe/Bucharest`. Replace `ABSOLUTE_SOURCE_ROOT` in this request before pasting it into Claude:

   ```text
   /nambli:nambli Use the disposable synthetic fixture at "ABSOLUTE_SOURCE_ROOT/ecosystems/claude-code/fixtures/post-draft.json". Before writing, ask me to confirm that I paused notifications in my own nambli account. Verify my account and check any known pending disposable test UUID before creating anything. If one exists, read its latest state and continue or clean up that exact authorized record without creating a duplicate. For a new test record, get only the LinkedIn platform schema, prepare the event, then create it with the same prepared UUID and payload. Preserve the historical date and timezone and explicit File types without File values in customFields. Read it back. Save only a calendar draft; leave publication automation unset and do not publish or send an email draft. Remember the event UUID, current revision and persisted fields.
   ```

   On a manual MCP route without the skill, use the same request without its slash command. Do not add permissions or bypass approvals. Record the actual prepare/create/read tool results. The fixture is input to the planner, not a pre-created event; do not reuse a fixture UUID across accounts. If a response is uncertain, read the returned stable UUID before any identical retry.
3. Ask to change only `post_text` to `Synthetic connector test: revision two, verified from a new session. Do not publish.` Read the exact event revision first and pass it to `update_event` with an explicit String type. Read back text, time, timezone, LinkedIn personal/public settings, field types and advanced revision. Start a new conversation, verify the same account, and read the exact saved UUID; ensure unrelated fields persist and no duplicate event was created.
4. Ask to attach `SOURCE_ROOT/work/claude-code-fixtures/image.png` to `image` and `SOURCE_ROOT/work/claude-code-fixtures/brief.pdf` to `brief_pdf`, replacing `SOURCE_ROOT` with the actual absolute path. Observe Claude identifying its host transport limit and returning real `get_file_upload_link` actions. Upload in the browser with the matching account. Read back after each: attachment ID, field name, filename, MIME, size, revision. Retry an unchanged uncertain upload only with its retained UUID. Test an intentional replacement on this disposable field, verify the latest revision and new ID, and ensure the other field is unchanged. Never reuse an upload UUID for changed bytes. If the chosen local helper is used, record its version and exact account profile separately.
5. Call shared #66 `get_file_download` with `eventId`, current `eventRevision`, `attachmentId` and exact `fieldName` for each saved file. Check metadata and `bytesDelivered: false`; for the synthetic files under 512 KiB, inspect the returned resource link and try connected `resources/read` only if the host exposes it. Record resource visibility, actual content and whether Claude decoded/read it. Otherwise open the returned authenticated `browserUrl`, match the account, and choose **Download file**; also verify this fallback when resources work. Compare SHA-256 against `SOURCE_ROOT/work/claude-code-fixtures/SHA256SUMS`, using the actual absolute source path. On PowerShell use `Get-FileHash -Algorithm SHA256 -LiteralPath 'PATH_TO_DOWNLOADED_FILE'`. A paired helper that includes #66 may use `tor-calendar download EVENT_ID ATTACHMENT_ID DESTINATION --account PROFILE_ID`; record its version and save receipt. If the tool is not yet exposed, record that blocker and use the event editor's filename download without claiming the new contract passed. Record separately: action returned, bytes downloaded, hash equality, and whether Claude read a host-accessible local file. Metadata readback alone is insufficient.
6. In a fresh conversation with the connector but without invoking the skill, repeat an upload request on this test record; shared server guidance should offer the working host fallback. Test missing-connection guidance with the nambli instructions available but its MCP connection absent: expect the known public setup link and no fabricated tool calls. In a separate session with the entire plugin absent, supply the public setup page or its relevant instructions if checking the exact setup URL; without that source, require truthful lack-of-access reporting, not recall of an undisclosed URL. Record which source was available. Restore the prior enablement afterward.
7. Reconnect and verify identity; test expiry/refresh after the server's 900-second access-token lifetime. Keep the primary test grant active until cleanup. With separately authorized read-only and second-account fixtures, check upload rejection and wrong-account denial; do not explore another real account or mutate its records. If those fixtures are unavailable, mark those steps blocked. Test deleted-file download on only a disposable attachment. Reread on stale revisions; never silently replace concurrent changes.
8. Delete only this test UUID after recording results, using its latest revision, and verify it is gone. Restore the tester's chosen notification setting after cleanup. For the full revocation check, revoke only a disposable grant created for this test and verify it fails closed. If the test reused an existing grant, preserve it and mark revocation unverified; the identity update itself does not authorize revoking an existing connection. Keep existing events, unrelated connections, tokens and installations intact. Record failures, expected/actual behavior, reproduction and fixes in #79. Real publishing/sending is outside this connector check.

## Evidence record

| Item | Observed value/result |
| --- | --- |
| Test date, OS, host/version, plan/provider | |
| Source commit/archive hash, plugin version, installation route/scope | |
| Active plugin/server/skill names; old installed scope disabled if present | |
| Prior test UUIDs retained; OAuth reused or renewed; relevant permissions reviewed | |
| Actual exposed tools and grant scope | |
| Stable account identity checked against browser | |
| Bounded range and timezone | |
| Notifications paused before writes; prior setting restored after cleanup | |
| Disposable event UUID; create/edit/new-session revisions | |
| Persisted text, exact time, types and LinkedIn settings | |
| Image/PDF fields, attachment IDs, names, MIME, sizes | |
| Download contract/server revision, bytes and hashes | |
| File access in Claude vs browser delivery | |
| Retry/replacement, wrong-account/read-only/deleted-file results | |
| Refresh/reconnection/revocation | |
| Cleanup, remaining blockers and linked fixes | |

## Коротке завдання для Claude Code

Спочатку запусти новий кандидат за інструкцією вище. У запиті заміни `ABSOLUTE_SOURCE_ROOT` на повний шлях до розпакованого ZIP. Цей запит не замінює вхід у власний обліковий запис і погодження доступу.

```text
/nambli:nambli Перевір оновлений локальний плагін nambli за інструкціями "ABSOLUTE_SOURCE_ROOT/ecosystems/claude-code/README.md" і "ABSOLUTE_SOURCE_ROOT/ecosystems/claude-code/NATIVE-VERIFICATION.md".

Спочатку підтвердь фактично завантажені назви: плагін nambli, сервер plugin:nambli:nambli, навичка /nambli:nambli та префікс інструментів mcp__plugin_nambli_nambli__. Якщо завантажена попередня версія чи лише ручне MCP-підключення, поясни це і не зараховуй перевірку нового плагіна. Не встановлюй версію з GitHub замість цього ZIP.

Збережи наявні налаштування, токени, дозволи й сторонні підключення. Повторний OAuth виконуй лише якщо його вимагає клієнт; дай мені завершити вхід і погодження в браузері. Через get_profile перевір мій власний обліковий запис, потім виконай обмежене читання з limit 5 у моєму часовому поясі. П’ять — лише розмір тестового запиту.

Перед записами отримай моє підтвердження, що я призупинив сповіщення у власному nambli. Якщо лишився тестовий запис від попереднього запуску, збережи його UUID, перечитай актуальну ревізію та продовж або прибери саме його; не створюй дублікати. Для нового запису використовуй лише наданий історичний синтетичний fixture. Перевір створення, читання, зміну лише тексту та повторне читання тієї самої події в новій розмові. Для дій у браузері й початку нової розмови повідом, коли потрібна моя участь.

Виконай доступні перевірки файлів із повного чекліста; не видавай посилання чи метадані за отримані байти. Не публікуй дописи, не надсилай листи, не вмикай автоматичну публікацію й не змінюй справжні події. Після фіксації результатів видали лише погоджені тестові записи за останньою ревізією та перевір очищення; я відновлю попередні налаштування сповіщень. Не відкликай наявний OAuth-дозвіл заради перейменування. Недоступні перевірки познач неперевіреними.

Збережи короткий локальний звіт: версія Claude, хеш ZIP, завантажені ідентифікатори, результат входу/читання/запису/файлів/нової розмови/очищення та точні помилки. Приховай токени, приватні адреси й вміст календаря; познач залишкові тестові UUID для подальшого очищення. Нічого не публікуй у GitHub і не надсилай іншим людям.
```
