> **Prepared 30 September 2026: 0.2.3 release preparation.** Codex now opens the installed Personal marketplace plugin directly. The MCP display key becomes `nembli`; package and skill IDs stay stable. Skill icons use copies of the approved transparent artwork. Public directory status remains draft; this work does not submit or publish that listing.

> **30 September 2026 update:** version 0.2.2 includes owner-approved artwork, non-overwriting packaging, the demo at https://nembli.com/demo, and five positive/three negative review cases. GitHub publication is tracked separately from this OpenAI draft; historical v0.2.1 evidence remains below. Native Nembli OAuth and read-only profile/capabilities were confirmed on 29 September; the owner subsequently confirmed the post-release work. Dedicated reviewer access, exact-case execution, legal attestations and final submission remain pending. Historical evidence below is retained; do not treat its superseded native-connection status as current.

# OpenAI directory and Nembli release status

**State on 29 September 2026:** package release version **0.2.1**; existing OpenAI With MCP submission **draft**, not submitted, approved or published in the directory. The existing [Platform draft](https://platform.openai.com/plugins/edit/asdk_app_6ab9941edbfc819188d6307e41435bb3/asdk_app_v_6ab994203b188191bdad2b2739431a4d?section=Submit) belongs to Tor Production. No public Nembli directory install URL is verified. [`docs/install-config.json`](../docs/install-config.json) retains `listingStatus: "draft"` and `listingURL: null`.

## Public package and connection routes

The [0.2.0 release](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.2.0) contains a CLI tarball, combined plugin ZIP, standalone skill ZIP and SHA256SUMS. Its source changes were integrated through [PR #1](https://github.com/Tor-Production/tor-event-calendar-ai/pull/1), merged to `develop` as `1fdf78df3eb1498ecf5d7e9ede34e02b12bc6b34`, then prepared through the release branch for `main`. The [v0.1.0 compatibility release](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.1.0) is unchanged. Package release availability is independent of OpenAI directory publication.

Current URLs are homepage `https://nembli.com`, primary guide `/connect-ai`, MCP `/mcp`, privacy `/privacy`, and AI integration terms `/ai/terms`. GitHub Pages remains a compatibility guide, served from `main:/docs`. Confirm its actual build status after a release; a source merge alone does not establish deployment. Stable IDs are package/repository `tor-event-calendar-ai`, skill/MCP `tor-event-calendar`, and command `tor-calendar`.

New CLI connections default to Nembli. Existing profiles keep their saved origin, profile directory and OS keyring credential. An older OAuth grant does not transfer across origins; use a fresh browser sign-in and consent, confirm account identity, then deliberately revoke an older connection if desired. [Migration guidance](../skills/tor-event-calendar/references/connections.md#moving-an-existing-connection-to-nembli)

## Evidence and separate acceptance gates

| Area | Recorded result | Remaining gate |
| --- | --- | --- |
| Package tests | `npm test` passed six local installation adapters and four synthetic profiles, including Nembli default, exact origin separation and preservation of older credentials. Static guide gating, icon inspection and serialized OpenAPI checks passed. | Rebuild archives after any source edit and verify against final source; these tests do not prove native OAuth. |
| Archive layout | Both ZIPs compare with source; the standalone skill has one top-level `tor-event-calendar/` folder with seven files. SHA256SUMS covers the tarball and both ZIPs. | Use the exact release skill bytes in the portal scan. |
| Remote service | The coordinating server release deployed Nembli homepage, privacy, OAuth metadata and MCP; nine live CRUD/compatibility check groups passed with existing records preserved. | Native installed-plugin OAuth, account labeling, fresh-session reads and refresh remain separate client checks. |
| Platform domain and skill | Nembli domain verification passed. The pre-release Nembli skill ZIP safety scan passed; earlier root-layout failures and previous-domain scans are historical. | The final release updates skill references and needs a new safety scan. Complete the authorized MCP tools scan with a fresh Nembli grant. |
| Native Codex | A previous temporary package installation confirmed skill/MCP files; no Nembli native OAuth/tool/refresh pass is recorded. | Complete installed-plugin account consent, bounded read, fresh-session and refresh checks. |
| Submission | Still draft. Last required reviewer items included demo recording URL, MCP tools scan, test scenarios and policy attestations. | Complete reviewer materials, support/country/policy review and human attestations before an authorized submission. Review and publication occur afterward. |
| Customer directory install | No verified public listing URL exists. | Verify Nembli's own public listing after approval/publication before enabling the directory install action. |

## Reproduce local package validation

Use Node 22.18+ and Python 3.12+. Run `npm ci --ignore-scripts`, `npm test`, create `dist/`, then `npm pack --pack-destination dist`, `python scripts/package.py`, and `python scripts/test_package.py`. The archive check validates source bytes, metadata, wrapped skill layout and every checksum. Synthetic profile tests use no live account or social calls. Rebuild after packaged source changes; avoid interpreting a local archive pass as a portal or OAuth result.

The [OpenAI submission guide](https://developers.openai.com/plugins/deploy/submission) distinguishes With MCP submission from local packaging: provide the HTTPS server URL and upload/import the skill. A Skills-only upload excludes the remote configuration. [Calendar-site contract](calendar-site-handoff.md) · [review cases](test-cases.md)
