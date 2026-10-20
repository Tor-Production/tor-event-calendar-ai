# Post-approval update preparation

Prepared on 20 October 2026. The owner reports that the current nambli submission is still under OpenAI review and explicitly requested that the next update wait for its approval. The last direct Portal inspection remains 15 October; this document does not claim a new inspection, scan or approval.

## Current boundaries

| Item | Verified state and next boundary |
| --- | --- |
| Submitted OpenAI package | Keep the existing 0.3.2 entry and archive frozen. No replacement upload, cancellation, restart, resubmission, publication, metadata edit or authorization change during the pending review. |
| Public source | Dev.5 was integrated through [PR #36](https://github.com/Tor-Production/tor-event-calendar-ai/pull/36). This later change updates documentation only. |
| Existing dev.5 archives | Validated development reference artifacts pinned below. They do not include this newer document or the other release-hold documentation changes. |
| Installed package | The owner's dev.5 installation and existing account bindings remain unchanged by this preparation. |
| Full publication acceptance | The initial 19 October complete run failed and same-post recovery completed. A fresh uninterrupted run is deliberately deferred to a future owner-authorized real post; it has not passed. |
| Final update archive | Not assembled. Choose the final version and build a distinct immutable archive after current approval and release-scope review. The pinned dev.5 ZIP is not a newly prepared submission ZIP. |
| Submission/publication | Neither performed by this task. Approval of the current submission is not approval of a future package, nor evidence that either version has been published. |

Repository preparation can finish while the live retest is deferred. Do not generate an extra social post merely to close a checklist. Keep the acceptance limit visible in later release notes and review material; a successful recovery or offline suite must not be presented as an uninterrupted end-to-end pass.

## Immutable artifact references

The frozen Portal archive is `nambli-store-0.3.2.zip`: **3,611,768 bytes**, **35 files**, SHA-256:

```text
8243348b2d54720078e92ccd7ff72f1d093e22990a5003d23043b77121b0f9b2
```

Its hash, size, file inventory and ZIP integrity were rechecked on 20 October without modifying it. It is a minimal submission tree; its bytes intentionally differ from the broader GitHub source distribution.

The original dev.5 artifacts were built from source **`259c89c184d0c7ca0786a5f08f1c3b7ede9d2239`**, integrated into `develop` by merge **`4ffa1ac49bca4cd9ae75d545f520cae64a44ea70`**. On 20 October, `python scripts/test_package.py` passed in the original pinned source checkout against these existing files: combined ZIP/source parity, all three skill archives, npm skill payload, version agreement, review cases, explicit invocation, exclusion of private bindings and SHA-256 checks. This was not run against the newer documentation tree as though it matched the old archive.

| Existing artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `tor-event-calendar-ai-plugin-0.3.3-dev.5.zip` | 7,274,428 | `0c22dc435bdbfa5f9f2cbf8f1ddfb9b900ca02e907fba083fa53cdf65caa5c01` |
| `tor-event-calendar-ai-0.3.3-dev.5.tgz` | 4,583,798 | `d96481aeea599a8b948230ddce16c074f7c5c25f48be2bfa47c23191c57846f6` |
| `nambli-skill-0.3.3-dev.5.zip` | 956,341 | `e64dfaa13862795c68c3d4da6a2450595907d401778239929ecdf37b8ecd0cc8` |
| `nambli-content-skill-0.3.3-dev.5.zip` | 2,312 | `97021f0d41a965052383331dfa855540ed9eb8076f984f9c2fff2a0728a56f52` |
| `nambli-publish-skill-0.3.3-dev.5.zip` | 4,730 | `8f6537bda8963edd30d6a39962f357c393727f30bff9f4cda0b56b894e11057b` |

Preserve these files and their original `SHA256SUMS`. Do not rebuild different bytes under any of these filenames or the same version. Newer repository documentation does not silently become part of an existing archive.

## Completed evidence and open acceptance

- [Package status](status.md) separates the frozen submission, current source, local installation and historical review results. [Release notes](release-notes.md) describe dev.5 without claiming a stable catalog release.
- [Codex publication acceptance](../ecosystems/codex/PUBLICATION-ACCEPTANCE.md) records the original spacing/followup failure and the subsequent same-post recovery: one previous-post comment, Insightful and Featured all completed, with fresh nambli readback preserving the original ID/permalink and manual execution.
- Calendar [PR #136](https://github.com/Tor-Production/tor-event-calendar/pull/136) deployed connection-reuse and immediate-followup guidance after full checks and exact staging MCP verification. Production read-only checks matched the changed strings. Refreshing the exact existing App exposed 19 tools and the revised receipt description in a fresh context, without a new connection or authorization. This is metadata-delivery evidence, not an OpenAI review scan.
- A new complete real publication must still verify the planned account/author/audience, exact words and visible paragraphs, complete image alt text, exactly one base post, immediate authorized followups without a serial calendar detour, independent durable receipts, reconciliation without duplicate sends and final calendar readback. The owner will choose the future post.
- Native scheduling, missed-time recovery and other AI-host publishing remain separate unverified capabilities. Instructions reduce execution errors; they do not make a browser workflow a transactional API or guarantee another agent will comply.

## Gates after the current approval

1. **Verify the actual review outcome.** Inspect the same submitted entry and record the current version, status and any reviewer requests. If it is still pending or requires changes, preserve the current hold and report the concrete outcome; do not treat elapsed time as approval. Do not create a second listing to bypass the existing review.
2. **Fix the release scope and version.** Decide which reviewed source changes belong in the update and which live acceptance remains deferred. Keep those limitations explicit. Choose a distinct version for new archive bytes, preserve stable v0.3.2 and all existing assets, and retain the plugin identity. Follow the repository's release branch/PR flow before any stable release or tag.
3. **Assemble and validate the exact new archive.** From its clean pinned checkout, use Node 22.18+ and Python 3.12+: `npm ci --ignore-scripts`, `npm test`, `python scripts/claude_code.py validate`, `python scripts/test_claude_code.py`; create `dist/`, run `npm pack --pack-destination dist`, `python scripts/package.py`, then `python scripts/test_package.py`. Capture commit, version, inventory, sizes and checksums. Any later packaged edit requires a new assembly and validation. Do not apply source/archive parity to a different checkout.
4. **Prepare the exact submission tree.** Check the current submission requirements against that artifact. Preserve the public manifest identity, icons and URLs; exclude `.app.json`, owner-specific IDs, credentials, private receipts and non-null `apps` declarations. If creating a minimal Portal ZIP instead of the broader distribution, independently validate its actual contents, version and checksums and retain the relationship to the tested source. Do not relabel the old dev.5 ZIP as that artifact.
5. **Reconcile the listing and evidence.** Review the current description, domains, privacy/support/terms links, available countries, commerce declaration, positive/negative cases and demo against the final package. Preserve [listing.md](listing.md) as the historical submitted 0.3.2 copy until a deliberate update is prepared. Record actual reviewer requests and unresolved aggregate/server-instruction checks rather than inventing a diagnosis or claiming a clean review from individual tool panels.
6. **Reuse the correct reviewer connection.** Inspect the existing authorized account/grant and refreshed tool catalog first. Missing host metadata does not establish missing authorization. Refresh the same App before diagnosing a scope, expiry or revocation problem; use a previously authorized helper profile only if the workflow needs it. Additional account access or permission changes require the applicable user authorization. Never include reviewer credentials in the repository or public ZIP.
7. **Apply the authorized update only after the gate.** Reuse the approved listing and the exact validated update artifact. Save concrete metadata/archive evidence before submitting; distinguish a saved draft from an actual review submission. The owner completes required human legal declarations. Record the new review outcome separately from the current approval. Publication, public release/tag and any marketplace action remain distinct actions; this preparation performs none of them.

## Next ecosystem priority: Cursor

The owner selected Cursor as the next ecosystem to investigate. Current [Cursor plugin documentation](https://cursor.com/docs/plugins) and [plugin reference](https://cursor.com/docs/reference/plugins) describe portable Agent Plugins with a root `plugin.json`, skills and MCP, as well as Cursor-specific plugin features. This repository already has the portable root manifest and remote MCP configuration; that structural match does not establish native acceptance.

Cursor's [publisher terms](https://cursor.com/marketplace-publisher-terms) require marketplace plugins to be offered free of charge. Its [pricing help](https://cursor.com/help/account-and-billing/pricing) describes a Free plan with limited Agent use. These statements do not prove that the full nambli skills/MCP/browser publishing flow is available on Free. Its [browser documentation](https://cursor.com/docs/agent/tools/browser) describes workspace-isolated persistent sessions; image upload, alt text and the complete LinkedIn flow still need direct verification.

Before claiming Cursor support, verify native plugin discovery and installation scope, account selection and existing-grant reuse, tool refresh, skill invocation, file upload/download, persistent browser login, exact text/media/alt handling, immediate followups and receipt recovery. Establish the minimum actual subscription/runtime requirements. A MCP-only deep link is not evidence that the skills were installed. No Cursor adapter, marketplace submission or live Cursor publication is part of this documentation task.
