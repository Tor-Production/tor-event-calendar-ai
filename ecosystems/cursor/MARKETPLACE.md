# Cursor marketplace release checklist

The owner authorized Cursor implementation/testing and submission/publication **if ready** on 21 October 2026. That does not certify unfinished native tests. Cursor review and actual listing are separate from submission; the existing OpenAI review remains frozen.

## Submission material

- Plugin name: `nambli`; author: Tor Production; license: MIT.
- Public repository: `https://github.com/Tor-Production/tor-event-calendar-ai`.
- Homepage: `https://nambli.com`; privacy: `https://nambli.com/privacy`; terms: `https://nambli.com/terms`.
- Support: `https://github.com/Tor-Production/tor-event-calendar-ai/issues`.
- Logo: existing approved `assets/logo.png`, preserved byte-for-byte.
- Short description: “Manage your private calendar and prepare social drafts with nambli.”
- Listing scope: account-scoped calendar reads/writes, explicit named File fields, content drafts and publication coordination. Describe any LinkedIn browser action only to the extent verified on this Cursor version; no shared social credentials, organization/group adapter or unattended scheduler is supplied. Browser publication requires an already-installed Node 22.18+, Google Chrome and initial npm package setup through the local launcher/private cache; the calendar MCP itself has no local runtime dependency. An upload link is the immediate calendar fallback when the browser cannot start; it is not a working LinkedIn image publisher.

## Gates before submission

1. Pin the public source branch/commit and full `.cursor-plugin/plugin.json` package. Use a reviewed release route; do not silently submit a stale default `main` branch while the Cursor implementation exists only on a task branch. Preserve stable tags and immutable OpenAI artifacts.
2. Run source/package/journal tests and inspect the generated allowlist and per-file hashes. Verify no credentials, private profiles, personal series trackers or unrelated host/App configuration entered the Cursor ZIP.
3. Record actual [native acceptance](ACCEPTANCE.md), especially first OAuth, reuse/refresh, CRUD, stale revisions and real file round trip. Resolve the historical automatic DCR/native-callback issue in the actual advertised installation route. A local static-client workaround or Node helper cannot silently stand in for one-click OAuth acceptance.
4. Record browser preflight and exact supported social scope. Do not advertise a verified complete publisher until the owner-selected full run with immediate followups and receipts passes. If that live run is still deferred, hold the full-publication listing or explicitly narrow and re-review the proposed first release to verified calendar/draft capabilities; do not relabel pending publication acceptance as passed.
5. Inspect current [submission requirements](https://cursor.com/marketplace/publish) and [publisher terms](https://cursor.com/marketplace-publisher-terms). Use existing intended publisher login; legal declarations needing the owner's personal assertion stay with the owner. Fill only factual verified metadata.
6. Submit the exact reviewed repository/ref supported by the form. Retain the actual submission receipt/status; stop duplicate submissions on uncertain response. Cursor manually reviews entries, so submitted does not mean approved or published.
7. Once listed, verify the actual public listing and full-package installation using its supported Add to Cursor flow. Then wire the website's full-plugin button to that actual listing; test it with a fresh profile. Until then keep any existing direct MCP button explicitly labeled as MCP-only. Never invent a full-plugin deeplink.

No submission, listing or native Free-plan pass is established by this document or a successful build. Free-plan limits and the browser's per-workspace session are described in the [Cursor guide](README.md).

The owner-side form inspection on 23 October showed a public GitHub repository URL field without a branch/ref selector. Confirm which reviewed default source the actual form ingests before submitting; do not assume a task branch is selected. Its Submit action also accepts the publisher terms, so the owner's action-time legal confirmation remains a final gate. No submission or acceptance of terms was performed by these source checks.
