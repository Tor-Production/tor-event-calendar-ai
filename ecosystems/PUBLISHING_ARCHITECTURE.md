# Portable content and publication workflows

Design and source-package scope, 15 October 2026. This document does not certify a deployed publisher or native acceptance in an untested host.

## Shared product contract

Keep one nambli service and shared workflow package. The public `tor-event-calendar-ai` repository owns skills, plugin manifests, the portable client and host adapters. The private calendar repository owns Worker/MCP, authentication, storage, claims and receipt validation. Import only scoped contract snapshots with provenance; do not export the private repository's retired integration package over this source.

| Workflow | Responsibility |
| --- | --- |
| `nambli` | Explicitly requested account, event and file operations; publication handoff and receipt rules. |
| `nambli-content` | Develop and save a draft with the user's chosen creative tools; no social send. |
| `nambli-publish` | Coordinate an authorized publisher, persist confirmed status and permalink immediately, and reconcile incomplete results. |

The two workflow skills can be discovered for relevant nambli requests; the core calendar skill stays explicit-only. Existing user skills may replace content creation or a platform adapter while honoring the same data/receipt contract. Installation supplies neither social credentials nor publication consent.

A skill teaches the workflow; server validation and durable execution enforce the invariants even when a client has no skill installed. Add clear instructions to tool descriptions and compact results as well. OpenAI separates server data/auth/actions from skill instructions and imports MCP-hosted skills as a versioned snapshot, so a server deploy alone does not update an installed skill. [OpenAI skill guidance](https://developers.openai.com/plugins/build/skills).

## One publication attempt

Bind an attempt to calendar account, event revision, social author, destination and audience. Obtain the existing account/event claim and persist a durable journal before external submit. Persist a confirmed platform receipt immediately, then record `published`, external ID, permalink, time and evidence in nambli before optional followups. A failed calendar callback retries only that receipt with the same key/body. An ambiguous social response remains `unknown` and blocks another send. A confirmed post without a retrievable link remains truthfully published with explicit missing-link recovery; repairing the URL never publishes again.

The calendar exposes coordination/result tools only when its deployed version advertises them. They never contact a social platform. The current portable client has no general social adapter, and its local installer still installs only the core `nambli` skill. Combined plugin packages and separate skill ZIPs include the new workflows. Installing the new workflows does not make an older server's tools appear.

## Codex and LinkedIn first

The first acceptance target is one user's Codex desktop session and LinkedIn personal public feed. Check that user's available publisher, social identity, media transport and durable attempt store. A host browser can support an assisted workflow when available and permitted; a login is not evidence of a working unattended publisher. OpenAI documents the built-in browser separately from CLI/IDE capabilities, and local scheduled work requires the computer and app to remain running. [Browser](https://learn.chatgpt.com/docs/browser), [scheduled tasks](https://learn.chatgpt.com/docs/automations).

For a reusable automatic product, prefer each user's LinkedIn OAuth grant and an official API adapter. `w_member_social` supports publishing for the authenticated member. Successful Posts API creation returns `201` and `x-restli-id`; `r_member_social` read access is restricted, so receipt recovery must not assume every application can list or reread member posts. Preserve the create response before doing anything else. [Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin), [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-07).

LinkedIn's current agreement prohibits unauthorized automated access and posting. Browser availability does not grant platform authorization; do not make an unrestricted browser bot the product's foundation. [LinkedIn User Agreement, section 8.2](https://www.linkedin.com/legal/user-agreement).

Calendar authorization and social authorization are separate, scoped to each user and revocable independently. Secrets belong in a protected service/runner store or that user's keychain, never in skills, event JSON or prompts. A future server scheduler should own durable execution, cancellation and receipt recovery so publishing does not depend on which AI wrote the draft or whether its chat remains open. This package does not implement that scheduler or API adapter.

## Other ecosystems

Use the shared remote MCP/OAuth contract and only the host-specific installation, file and permission adapter that is needed. Claude Code, Gemini CLI and VS Code document remote MCP/OAuth support; that is protocol compatibility, not verified nambli publishing. [Claude Code](https://code.claude.com/docs/en/mcp), [Gemini CLI](https://geminicli.com/docs/tools/mcp-server/), [VS Code](https://code.visualstudio.com/api/extension-guides/ai/mcp).

Hosts with an independently verified publisher can run the same workflow. Hosts without one can create drafts and record evidence after manual publication. A server API publisher would be usable from any compatible host without duplicating browser automation. Maintain a capability matrix for each tested combination: connection, file transport, content generation, author/target support, immediate send, scheduling and receipt recovery. Do not promise native browser automation or skill installation for untested hosts.

## Acceptance and release boundary

Test draft creation/resumption separately from real publication: the former proves content survives sessions; the latter proves the correct author/audience, one external submission, immediate receipt sync and recovery after interruption. Synthetic tests must include callback loss, a confirmed post missing its URL, ambiguous submit, account mismatch and an absent publisher. Real publication needs the user's explicit instruction for that post and a verified social connection.

This source change requires review, coordinated server deployment, plugin packaging/update and native acceptance before those new tools/workflows can be advertised as live. Package candidate `0.3.3-dev.4` adds the [five planning platforms](../docs/SOCIAL_PLATFORMS.md) while leaving their automatic adapters unsupported. Its scoped receipt in `contracts/source.json` identifies private commit `5bf5af5136cf3313136a3ff7cc976a725809517c` with `sourceDirty: false`. All eight recorded hashes match that committed source and the public package source bytes. Provenance establishes source identity; deployment and native publication acceptance remain separate checks. No social send or schedule is performed by writing these files.
