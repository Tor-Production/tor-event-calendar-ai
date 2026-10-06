# nambli 0.3.2 package and catalog readiness — 7 October 2026

GitHub package distribution and OpenAI catalog submission are separate. The release source synchronizes root, Codex, Claude and optional CLI versions to 0.3.2, preserves the original artwork, and includes selected-account guidance without owner-private app bindings. Earlier tags/assets remain unchanged. The historical 3 October record is preserved in the [v0.3.0 source](https://github.com/Tor-Production/tor-event-calendar-ai/blob/v0.3.0/submission/status.md).

## Verified Portal preparation

The new nambli 0.3.2 draft belongs to Tor Production. Metadata and skill scans passed. The domain is verified, the isolated synthetic reviewer is authorized, and all 16 MCP tools are configured with a clean scan. Calendar PRs [#118](https://github.com/Tor-Production/tor-event-calendar/pull/118) and [#119](https://github.com/Tor-Production/tor-event-calendar/pull/119) deployed the exact domain proof and corrected `move_event`'s destructive annotation. The five positive and three negative cases, demo URL and secure reviewer instructions are saved. Reviewer credentials never belong in this repository or release artifacts.

The frozen Portal archive is `nambli-store-0.3.2.zip`, SHA-256 `8243348b2d54720078e92ccd7ff72f1d093e22990a5003d23043b77121b0f9b2`, 3,611,768 bytes and 35 files. Its minimal public tree excludes internal reports/build scripts. The broader GitHub source distribution retains those public development and setup materials; its checksum is intentionally different. It does not change the already uploaded draft.

The new draft is **Not submitted / Not published**. Cancellation of the separate old 0.2.3 review succeeded on 6 October. Its retained entry now shows **Changes required / Not published**; it was not deleted or published. No public directory URL is claimed; `docs/install-config.json` retains `listingStatus: draft` and `listingURL: null`.

## Recorded workflows and remaining acceptance

All eight workflows appear in the updated English [review video](https://nambli.com/demo), with a separate [product demo](https://nambli.com/product-demo), deployed through calendar PR #117. P03 now shows saved typed `publication_draft_settings`; active `publishingSettings: null` is valid for an unpublished draft. P04 includes actual download/open/comparison in a labelled separate take. P05 shows preserved content and exact-fixture cleanup. No video retake is currently requested.

The filmed P04 fixture was 108 bytes; the reusable public fixture is 44 bytes. A new run must compare its own actual input/output, not a copied historical size/hash. N02 records a refusal to share anonymously after read-only checks. It therefore does not prove the final package's stricter zero-nambli-invocation expectation. Videos also do not establish the exact installed public package version. Record real exact-package test outcomes separately instead of inferring them from backend checks or the walkthrough.

Codex CLI 0.155.1 discovers the exact unmodified public package's nambli MCP tools through deferred tool metadata. The portable root `mcp.json` works; no speculative manifest pointer change was needed. The isolated native run now verifies all eight cases: P01–P05 and N01–N03. N01–N03 each completed with zero nambli calls, independently establishing the stricter N02 boundary that the video alone did not prove. P04 downloaded the real 44-byte attachment through the native flow and verified its SHA-256 against the input.

A fresh connection with the necessary grant also passed natural access-token expiry and OAuth refresh after more than 15 minutes. This is observed native refresh evidence, not an inference from advertised metadata. After the server-only guidance fix in calendar [PR #121](https://github.com/Tor-Production/tor-event-calendar/pull/121), strict P02 and P03 read-back passed. P03 verifies the exact canonical `post_text`, String `social_network: LinkedIn`, and JSON `publication_draft_settings` with the requested personal/public-feed/public audience choices and no reaction, comment or Featured action. The stable event ID and 11:00Z / 14:00 Europe/Bucharest start are preserved; `publicationStatus: not_published`, `publicationAutomated: false` and active `publishingSettings: null` are correct. The exact public package and frozen Portal ZIP remain unchanged, and the final Portal scan still reports no issues across all 16 tools.

The separate native IDE matrix is still open: post-restart VS Code 1.140 tool use and Cursor/Insiders execution remain unverified. A VS Code 1.120 connection previously discovered 16 tools and Copilot successfully called `get_profile`; that does not establish the later client results. These IDE checks do not block GitHub package distribution. The developer's six legal declarations, final review submission and store publication remain separate steps.

Search Console confirms that all six public sitemap pages are indexed. Indexing does not guarantee ranking; HTTP-only checks do not establish physical-mobile browser acceptance.

## Release validation

Use Node 22.18+ and Python 3.12+. Run `npm ci --ignore-scripts`, `npm test`, `python scripts/claude_code.py validate`, and `python scripts/test_claude_code.py`. Create `dist/`, run `npm pack --pack-destination dist`, `python scripts/package.py`, and `python scripts/test_package.py`. Package checks verify source bytes, versions, no private app bindings, review-case agreement, explicit invocation, wrapped skill layout and checksums. Synthetic tests make no production calendar or social writes. Source/build tests do not establish native OAuth or model acceptance.
