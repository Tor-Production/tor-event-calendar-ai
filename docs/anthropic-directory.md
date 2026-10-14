# Anthropic Directory preparation — 14 October 2026

**Status: preparation only; not submitted, accepted or published.** Submission is waiting for an eligible paid Claude account; API credits do not satisfy that prerequisite. The existing GitHub marketplace installation is available independently. This document records the proposed listing and owner steps; it is not an approval receipt. See [Directory publishing requirements](https://claude.com/docs/directory/publish).

## Product and existing distribution

| Item | Prepared value |
| --- | --- |
| Plugin name | nambli |
| Publisher in the plugin manifest | Tor Production |
| Public repository | https://github.com/Tor-Production/tor-event-calendar-ai |
| Plugin directory in the repository | Repository root (`.`) |
| Branch/tag for submission | `develop`; `main` contains the older plugin |
| Current Claude Code plugin version | `0.3.3-dev.2` on `develop` |
| Product | https://nambli.com |
| Remote MCP URL | https://nambli.com/mcp |
| Setup | https://nambli.com/connect-ai?client=claude |
| Privacy / terms | https://nambli.com/privacy / https://nambli.com/ai/terms |
| Support | https://github.com/Tor-Production/tor-event-calendar-ai/issues |

The [root README](../README.md) supplies the plugin's listing description. It describes calendar management, typed custom fields, File attachments, account consent and revocation. Calendar writes never publish or schedule social content; already-enabled reminders may become eligible. The declared publisher name does not establish an Anthropic organization, domain-verification result or legal attestation.

The tested installation route remains:

```text
/plugin install nambli --marketplace Tor-Production/tor-event-calendar-ai#develop
```

Invoke the packaged skill explicitly with `/nambli:nambli`. This repository marketplace is separate from Directory sync (`nambli@synced`) and from the official Claude Code marketplace. Official marketplace distribution has a separate partner process; this preparation does not claim inclusion there. See [Claude Code publishing](https://code.claude.com/docs/en/plugins/publish).

## Submission sequence

1. The owner signs in to a paid claude.ai account, chooses the intended owning organization and links a GitHub identity with push access to the repository. Organization ownership and repository/path selection must be deliberate: the repository and plugin path are selected on initial submission. Start at [Directory management](https://claude.ai/directory/manage/new), following [Directory publishing requirements](https://claude.com/docs/directory/publish) and [plugin submission instructions](https://claude.com/docs/plugins/submit).
2. Submit the owned remote MCP connector first. A plugin which includes its own remote MCP server needs the connector submission as well as the plugin submission. Use the canonical endpoint above and browser OAuth; reviewer account access belongs in the portal's appropriate secure fields, never in this repository. The connector's **Submit** action can automatically publish a Community listing after the scan passes, so it is a publication action rather than a draft-only save. See [Directory publishing](https://claude.com/docs/directory/publish) and [plugin pre-submission requirements](https://claude.com/docs/plugins/pre-submission-checklist).
3. Prepare the plugin submission from this repository's root, explicitly selecting **Branch/tag: `develop`**. Do not accept `main` for this candidate: it contains the older plugin. Review the exact selected source revision, the README rendered as its long description, manifest metadata, support/privacy links, reviewer access and requested permissions. The current GitHub source is a development version; no new release or version bump is implied by this document.
4. Complete the plugin bundle's checks and owner attestations, then use its separate **Publish** step when ready. Record the connector and plugin identifiers and resulting statuses separately, and claim each public listing only after its portal outcome confirms publication. The connector's Submit/automatic-publication flow and the bundle's Publish step are different actions. See [plugin submission instructions](https://claude.com/docs/plugins/submit).

The required paid-account eligibility is not yet available. The owning organization, linked GitHub permission and portal checks remain unverified; no portal interaction or submission was performed for this preparation. No reviewer credentials or submission identifiers are included.

## Runtime and review boundaries

The plugin bundles the optional local tor-calendar file helper with `package.json` and `package-lock.json`. Its setup installs the dependencies declared by those files, which triggers manual review under the current [pre-submission checklist](https://claude.com/docs/plugins/pre-submission-checklist). This is not a claim that every manifest alone requires manual review. The files are retained because the helper uses that pinned runtime; a manual-review hold is not evidence of rejection or a reason to remove working dependencies solely to pass an automated check.

Ordinary calendar tools use remote MCP and browser OAuth. The local file helper additionally requires Node 22.18+, an unlocked OS keychain, explicit browser pairing and access to the real file bytes. It checks the expected MCP account, fixed service origin, permission scope and current event revision. It must not synthesize a substitute for an inaccessible app attachment. The [automatic-file guide](../ecosystems/claude-code/AUTO-UPLOAD.md) documents its setup.

Claude Code functional acceptance is recorded in the [13–14 October report](claude-code-native-2026-10-14.md). Final-source Windows tests and earlier exact-artifact Mac reports are distinguished. Neither the local helper in claude.ai/Cowork nor Directory sync installation has been tested. Portal acceptance and those host-specific capabilities must not be inferred from Claude Code results.

Intermittent production Cloudflare 1102 on OAuth/settings remains an unresolved reliability defect. The CPU-reduction candidate has not been deployed to production. The directory submission must not describe the service as having resolved that defect.

## Staging addendum — 14 October 2026

After the dated native acceptance report, CPU-reduction candidate `556ea9d` in private [PR #132](https://github.com/Tor-Production/tor-event-calendar/pull/132) was deployed **only to staging**, observed Worker version `0229909b`. All three staging OAuth protocol test groups passed. Cleanup received HTTP acknowledgements; no credential readback was performed, so no stronger cleanup verification is claimed here.

The captured CPU tail sample was an anonymous `/api/me` request reporting 34 ms. It did not measure `/authorize` and had no comparative baseline. These checks do not establish a production CPU improvement, cold-request compliance or resolution of intermittent 1102. The [native report](claude-code-native-2026-10-14.md) remains unchanged as the earlier dated audit; production and tested plugin/archive bytes are unchanged by this staging addendum.

## Preserve tested source

The tested Claude Code source is commit `25c4c8ce2df976ab53497645d773942a8a3d4c06`. The preserved `nambli-claude-code-0.3.3-dev.2.zip` has SHA-256 `090721585d13eee2b6146e07fd674ad581571aade711c6dd97a88b5a7d52a3cb`; all 36 packaged files matched the final-source installed bytes.

This preparation changes only the root README and standalone `docs/` records. They are outside that archive. No manifest, version, helper, hook, packaged skill/checklist or existing archive is changed, and the later documentation commit must not be reported as a newly tested runtime revision.
