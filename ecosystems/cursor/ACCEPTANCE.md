# Cursor native acceptance

Use synthetic content and a dedicated account for reversible calendar tests. Real social publication requires the user's chosen post and authorization; do not turn a source or installation test into a LinkedIn send. Keep private account IDs, screenshots and journals out of this public package. Record UTC timestamps and the user's display timezone separately.

Record the exact Cursor version, operating system, plugin source commit/version, ZIP SHA-256, actual installed path/scope, MCP name and endpoint, current Free/paid/trial state, and each observed result. Keep installation, calendar transport and social publication verdicts separate. A source validator pass does not fill a native row.

| Case | Action | Required evidence |
| --- | --- | --- |
| C01 installation | Copy the full plugin to a real local-plugin directory and reload. | Customize shows the intended manifest, four skills, contextual rule and one intended nambli server. |
| C02 first authorization | Use the current host's supported OAuth flow if no grant exists. | Correct account, callback/PKCE success and actual read/manage/refresh scope evidence. If bare URL DCR fails, record it; do not count a different helper as success. |
| C03 connection reuse | Restart Cursor and repeat a bounded account/calendar read. | Same intended account/grant; no new calendar connection, token transfer or pairing. |
| C04 stale tool discovery | Compare advertised claim/result tools against the known existing scope; use supported refresh. | Existing connection preserved; missing schema not treated as missing authorization. |
| C05 calendar CRUD | Explicitly create one disposable UUID at supplied local time, read it, revise one field, reread, delete that exact UUID. | Correct timezone/instant, compare-and-swap revision and expected missing event after cleanup. |
| C06 stale edit | Preserve a newer edit, attempt an older-revision update, then reread. | Stale update rejected; newer text remains. No destructive overwrite. |
| C07 files | Upload one harmless file to an explicit named File field and download the same attachment. | Actual local receipt and input/download SHA-256 match; metadata/link alone does not pass. Test native input separately from authenticated browser fallback. |
| C08 content boundary | Prepare/save a draft and ask for preview only. | Saved canonical text/paragraphs/media and `not_published`; no social submit, claim or new LinkedIn connection. |
| C09 scope/identity negative | A second account, unsupported org/group or unknown prior attempt is encountered. | Resolve intended account or stop before submit. Do not guess actor, copy credentials or repost. |
| C10 browser preflight | Prepare chosen personal/public post without sending. | Current browser can supply images and alt text; actor/audience, canonical paragraphs, exact comment/reaction/Featured operations are verified. Unsupported required steps block before submit. |
| C11 authorized full run | Publish only the future user-selected post with its configured followups. | One base post; durable receipt, immediate requested followups with no calendar/audit pause; same post ID, final event status/link and independent outcomes. |
| C12 ambiguous/recovery | Run synthetic journal regressions, then reconcile any real unknown step from platform evidence. | No second submit/comment; exact pending callback key/body survives restart/failure and later sync. Do not induce a real duplicate to test this. |
| C13 Free plan | Repeat C01-C10 on Free without active paid trial; record quota/runtime gates. | Actual eligibility and behavior. Paid/trial success cannot establish Free support. |

Default state for this source candidate: **native verification pending**. C11 is intentionally deferred until the owner supplies a future post. An earlier host's passing calendar/profile check or recovered post is not this package's end-to-end acceptance. Any updated native receipt must identify the exact package and completed rows rather than marking the whole matrix passed.

Automated package and [journal](JOURNAL.md) checks cover deterministic archive parity, component routing, endpoint/secret exclusion, exact text retention, one-shot submit guard, media hash changes, independent followup outcomes, unknown/reconciliation, missing URL truth and callback ordering/replay. They use synthetic data and no external accounts.
