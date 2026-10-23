# Cursor preview marketplace release

On 23 October 2026, the owner explicitly requested submission of the working Cursor plugin now, with remaining file/runtime work to follow. This authorizes the narrower calendar/draft preview listing without waiting for the full LinkedIn workflow. Pending native checks remain pending. The existing OpenAI review and frozen archives remain unchanged.

## Submitted scope

- Name: `nambli`; version: `0.3.3-cursor.1`; author: Tor Production; license: MIT.
- Description: “Manage your private calendar and prepare social content drafts with nambli.”
- Repository: `https://github.com/Tor-Production/tor-event-calendar-ai`.
- The root Cursor marketplace entry resolves `plugins/cursor/nambli`; all Cursor components are self-contained there. Stable root Codex, Claude and portable plugin files stay unchanged.
- Homepage: `https://nambli.com`; privacy: `https://nambli.com/privacy`; terms: `https://nambli.com/terms`; support: `https://github.com/Tor-Production/tor-event-calendar-ai/issues`.
- Advertise calendar reads/writes, drafts, existing-account reuse and host-dependent File handling with an immediate authenticated upload-link fallback. Do not claim verified full LinkedIn publication, direct file transfer on every host, Free-plan acceptance or unattended scheduling.
- Browser and publication components are previews requiring existing Node 22.18+, npm for initial setup, Chrome, a separate browser login and explicit publication authorization. New-launcher native Mac startup, file replacement/negative cases and the complete real LinkedIn sequence remain unverified.

## Submission and listing

1. Run the exact export/release verification documented in the [preview README](../../README.md). [PROVENANCE.json](../../PROVENANCE.json) identifies canonical source `266e2739a27b81574198e3715a8d914bab5835d9` and the reviewed metadata delta.
2. Merge the reviewed Cursor-only release PR to default `main` and propagate it back to `develop` through a visible PR. Do not promote unrelated development source or change stable/OpenAI artifacts.
3. Submit the canonical repository URL using the existing publisher login and factual preview description. The root `.cursor-plugin/marketplace.json` selects the nested Cursor source through the [official documented layout](https://cursor.com/docs/reference/plugins#cursor-multi-plugin-repositories).
4. Keep personal legal declarations and acceptance of [Publisher Terms](https://cursor.com/marketplace-publisher-terms) with the owner. Save the actual submission receipt; do not repeat an uncertain submission.
5. Cursor manually reviews submissions. Submission does not establish approval, publication or native Marketplace installation.
6. When an actual public listing exists, verify its **Add to Cursor** action and installed preview version. Only then enable the website's full-plugin link using that verified listing URL. Keep the current calendar-only fallback accurately labeled until then.

The earlier Mac test includes real PNG/PDF round trips; missing direct local-file transport does not mean all file handling failed. [ACCEPTANCE.md](ACCEPTANCE.md) preserves those results against their original artifact. Source checks and a headed fixture do not establish native Mac launcher acceptance or a real LinkedIn send. Deferred checks stay open for follow-up releases.
