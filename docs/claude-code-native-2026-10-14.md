# Claude Code native acceptance — 13–14 October 2026

**The three owner-confirmed functional native acceptance groups and targeted cleanup PASS, including independent tool-result audits. Issue #79 remains Open / In Progress because intermittent production 1102 is unresolved.** Times below are UTC; the testing crossed into 14 October in Europe/Kyiv.

## Tested artifact and environment

| Item | Observed provenance |
| --- | --- |
| Public integration commit | `25c4c8ce2df976ab53497645d773942a8a3d4c06` on `Tor-Production/tor-event-calendar-ai` develop |
| Claude plugin | `nambli`, display name `nambli`, version `0.3.3-dev.2` |
| Preserved archive | `nambli-claude-code-0.3.3-dev.2.zip` |
| Archive SHA-256 | `090721585d13eee2b6146e07fd674ad581571aade711c6dd97a88b5a7d52a3cb` |
| Installed-source comparison | All 36 archive files matched the final-source installed bytes |
| Helper runtime/source ID | `f214bccf21b63a6af89c09a099a93e706fb92300bf60b8f32abc85f41e6a83ca` |
| Native host | Windows, Claude Code 2.1.296, Haiku 5.5, API Usage Billing; observed Node 22.18.0 |
| Plugin session | Fresh isolated configuration, one enabled user-scope `nambli@nambli`, server `plugin:nambli:nambli`, explicit `/nambli:nambli`; no `--plugin-dir` |
| Manual fallback session | Separate isolated configuration and local HTTP MCP server `nambli-b`; no duplicate plugin tools |
| Service origin | `https://nambli.com`; exact account identity checked separately for two owner-designated reusable test identities |
| Website deployment | Private PR #130 merged as `9c4bf6c303565c4bfacb4ee5e2741c0d5572129f`; successful Cloudflare Build. Observed Worker version `4d28af51-edff-4a75-9768-dfd03d27c31f` |

This report is a later documentation artifact. Its eventual commit must not be described as the tested plugin source. The archive, its build receipt and its 36 packaged files remain unchanged. Account identifiers, emails, event/file IDs, credentials, OAuth URLs, verification codes and raw transcripts are omitted.

## Final-source onboarding

| Scenario | Evidence and boundary |
| --- | --- |
| Clean GitHub marketplace installation | PASS: final `#develop` source installed the renamed dev.2 plugin in a fresh temporary configuration/project. The packaged file comparison matched. Scoped removal and manual configuration/removal also passed. |
| Interactive installation | PASS: accepted installation in user scope in the dedicated test configuration; one enabled plugin and canonical MCP server. Explicit skill invocation ran the actual bundled setup successfully. |
| Decline paths | PASS: declining Add marketplace cancelled installation and left the plugin list empty. A separate Escape from plugin details/scope selection also cancelled without installation. |
| Entire plugin absent | PASS: with the public setup source supplied, native Claude found no `get_profile` tool, made no fabricated calendar call and supplied the correct setup guidance. Recall of an undisclosed URL was not tested or required. |
| Live website | PASS: deployed Claude panel displayed the final install command and local-scope manual fallback. Clicking copy showed `Copied`; actual live clipboard bytes were not independently read. Local browser tests separately verified exact clipboard text and clipboard-denial recovery. |
| Installed-plugin authentication and read | PASS: after explicit browser approval, native A `get_profile` matched the intended stable identity, followed by successful bounded `list_events` for 2026-10-13, Europe/Kyiv, limit 5, zero events, `truncated:false`. Tool-use/result matching independently verified both reads and no mutation. The time between invocation and result includes human tool approval and is not server latency evidence. |
| Authenticated manual fallback | PASS: separate B browser OAuth and native `mcp__nambli-b__get_profile`/bounded list established the intended B identity and authenticated manual MCP access. |

## Controlled authorization and file checks

Notifications for A were observed disabled with zero connected push devices before fixture writes. A fresh check was required before the write stage. The helper test setup uses isolated metadata directories and separate OS-keyring credentials for A-manage, A-read and B-manage; normal helper profiles are preserved. The three browser-approved pairing receipts passed account/scope binding. Pairing is separate from MCP OAuth.

| Scenario | Current result |
| --- | --- |
| One disposable fixture | PASS, independently audited through 21:38: fresh A profile, one `prepare_event`, one `create_event` with the prepared UUID, historical time and explicit `image`/`response_loss_image` File fields. Responses reported `publicationAction:none`; initial readback had zero attachments. |
| Initial helper upload | PASS, independently audited: actual native Bash invocation uploaded the approved 100-byte PNG into `image`; compact receipt and fresh native `get_event` matched metadata/hash and exactly one attachment. |
| Read-only helper/server refusal | PASS, independently audited: unchanged helper returned `INSUFFICIENT_SCOPE`; direct server attempt returned HTTP 403; receipt reported unchanged event. Fresh MCP read independently confirmed the same revision and identical one-attachment array. |
| Native foreign event denial | PASS, independently audited: B matched its own identity; requesting the exact A fixture returned `HTTP_404`, HTTP 404, `ok:false`, without a data field. |
| Foreign helper/file denial | PASS, independently audited at 21:40:18: B's exact foreign event, file and helper-upload attempts returned HTTP 404. |
| Disposable A-read revocation | PASS, independently audited at 21:40:51: only the disposable A-read grant was revoked; subsequent status/file requests returned HTTP 401, while A-manage and B-manage controls remained usable. |
| Uncertain upload response and unchanged retry | PASS, independently audited: one instrumented POST received server HTTP 201 at 21:42:25, then the helper received `NETWORK_UNCERTAIN`. Fresh native MCP read at 21:42:52 showed revision 3 and two attachments, exactly one in the response-loss field. Ordinary helper retry at 21:43:22 reused the original PNG inputs and freshly read revision 3, returning the same attachment ID, revision 3, 100-byte size and hash. A further MCP read at 21:44:00 confirmed unchanged revision, attachment count and updatedAt. This was not a stale-revision retry. |
| Actual response-loss file download | PASS, independently audited at 21:48:24: downloaded bytes were 100 bytes and matched expected SHA-256 `821a965fadbf4b9ba66356c6ada78cf53e53359225193b889510a5d1a4ff61ee`. |
| Disposable B helper cleanup | PASS, independently audited at 21:49:18: the exact test grant was revoked, HTTP 401 confirmed, and only its exact isolated profile/keyring entry removed. The reusable B account and unrelated connections were preserved. |
| A fixture/grant cleanup | PASS, independently audited: exact authorized event deletion at revision 3 completed at 21:50:43; native `get_event` returned HTTP 404 at 21:51:18. Both direct file checks returned HTTP 404 at 21:51:52 and 21:52:12. Exact A-manage revocation/profile/keyring cleanup completed at 21:52:40. Fresh native MCP `get_profile` at 21:53:08 still matched the intended A identity. |
| Post-cleanup browser verification | PASS, freshly observed by the controlling task: notifications remained unchecked, zero connected push devices, 0 MB storage and zero saved files. A-read and A-manage were visibly revoked; the separate MCP connection remained present. Reusable accounts and unrelated working connections were preserved. |

The uncertainty scenario uses test-only instrumentation around the unchanged guarded helper, pinned to the approved account, event, field, file and runtime. The instrument drops one completed successful POST response after real commit and performs no automatic retry. Describe the result as **controlled application-transport response loss after commit**, not an observed ISP outage. Direct MCP calls, native agent-executed helper calls and the wrapper's server probes are distinct evidence. Native quota counters and R2 PUT count were not measured; the separately recorded isolated integration tests cover those storage-side properties.

## Preserved earlier evidence

The macOS reports remain associated with their exact tested artifacts; these Windows results do not relabel them as new dev.2 Mac tests.

- The 12 October report covered the renamed `0.3.2` development ZIP, SHA-256 `1798197fb2d4915e10ba928c9bef33b89649888210ed064947cfd2b878fdcc6d`, on macOS/Claude Code 2.1.296 with a reported Pro plan. It reported explicit skill/discovery and renewed OAuth; prepare/create/read/text edit/new-conversation persistence; browser PNG/PDF uploads and image replacement preserving the PDF; resource/browser byte-hash downloads; 404/409 negatives; connection reuse beyond 25 minutes; and cleanup. Direct token rotation was not observed.
- The 13 October automatic-file report covered `0.3.3-dev.1`, SHA-256 `237adc19b8ff30af2e06998151e7ccde2527dcac09aac55d3e360bc16462a53a`, on macOS 13.2.1 arm64, local Claude application Code tab, Claude Code 2.1.296, Node 24.20.0/npm 11.19.0. It reported original UI PNG delivered as a 100-byte session copy and a 634-byte PDF via original-file reference, autonomous helper upload to separate fields, SHA-256 and byte comparison on download, unchanged replay without a duplicate, cleanup, and fresh-process saved-connection reuse.
- Those Mac results are tester-reported; the remote raw execution/installed bytes were not independently inspected. Absence of a Keychain dialog is not a failure. No credential contents or Keychain ACL inspection is claimed.
- Earlier owner Windows/API evidence covers explicit invocation, correct-account reads, manual Reconnect, complete process restart without repeated browser OAuth and truthful disabled-server guidance. No requirement was added to repeat every accepted Mac CRUD/file case on Windows.

The dev.2 changes after the preserved Mac dev.1 report were diagnostics: setup reports `accountStatus:not_checked`, and sanitized HTTP error codes retain digits. The earlier Mac archive was not modified. Replacement/stale-revision evidence remains accepted in its original browser/native context; it is not new helper-native replacement evidence. Visual/text interpretation of PNG/PDF contents and direct inspection of refresh-token rotation are not claimed or separate remaining gates in the owner-confirmed scope.

## Unresolved production reliability

Intermittent Cloudflare 1102/HTTP 503 occurred on OAuth/settings requests, including A and B authorization attempts. One sanitized trace reported `exceededCpu` at the 10 ms CPU boundary. Subsequent unchanged-production retries reached consent, and native A/B access succeeded. Successful retries do not establish that the reliability defect is resolved. Hosting remains Cloudflare Free; no billing change was made.

A separate local candidate on `codex/fix/auth-initialization-cpu` reuses only bounded, configuration-pinned synchronous MCP plugin definitions while keeping fresh Better Auth contexts and D1 adapters. Independent source reviews and full `pnpm run check` passed, including the new concurrency/configuration tests and build/dry-run. A local Node/in-memory-D1 comparison measured 150 authenticated authorize calls at 1407 ms CPU with definitions rebuilt versus 937 ms with reuse (about 33% lower). This is not Cloudflare CPU evidence, does not establish cold-request compliance with Free limits, and does not prove production 1102 fixed. The candidate has not been committed, published or deployed by this audit.

## Completion boundary

The three owner-confirmed functional acceptance groups and targeted fixture/helper cleanup PASS, including the final independent cleanup tool-result audit. Issue #79 remains Open / In Progress for the unresolved intermittent production 1102 defect. The local CPU candidate is not a deployed fix. Anthropic directory submission/listing is a separate later stage; no directory publication is claimed.

Local supporting records: `NATIVE-PROGRESS.md`, the original redacted Mac reports as summarized in the preserved packaged checklist, dev.2 `build-receipt.json`, the public installation receipt, matched native tool-use/tool-result records, redacted authorization/response-loss receipts, and the separate local CPU-candidate evidence note. Raw private data is not part of this report.
