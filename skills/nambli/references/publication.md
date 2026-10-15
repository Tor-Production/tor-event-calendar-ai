# Publication handoff and receipt recovery

Calendar operations never submit or schedule social content. Read/show, content generation, calendar dates and readiness flags do not authorize publication. Use the user's explicit instruction for selected posts and independently verify the social author, target and audience. Never use another calendar user's credentials or an owner-specific publisher.

## Available tools

Discover the connected server's live tool schemas. `get_publishing_task` reads copy, attachments, revision, readiness and blockers. New server versions may advertise these `calendar.manage` tools:

| Tool | Purpose and inputs |
| --- | --- |
| `claim_publication` | Coordinate one attempt with `eventId`, `eventRevision`, stable UUID `runId`, and Boolean `intentionalNow` reflecting the user's actual immediate-send request. |
| `report_publication_result` | Record external evidence with `eventId` and the result fields below. It never publishes. |
| `repair_publication_url` | Repair a missing URL on an already published event with `eventId`, current `eventRevision`, stable UUID `idempotencyKey`, verified `externalUrl`, `occurredAt` and confirmation `evidence`. |

Do not infer availability from this package version. If a tool is missing, an explicitly chosen portable authenticated helper/API may perform the supported operation for the same account. Otherwise retain evidence and report the unavailable capability/manual reconciliation; never claim the record changed or silently switch credentials. The local CLI `result UUID JSON` records a receipt; it has no general social adapter, and its current command surface may not include URL repair. Use only commands actually advertised by `help`.

## Before a social submit

Refresh the exact event, revision, author and content. Skip social submission for published/cancelled records; a published record can still need receipt, link or followup recovery. A native queued post must be reliably cancelled/reconciled before immediate publication. An unknown attempt requires fresh platform evidence, not another send. A batch needs the user's requested matching scope and truthful per-event results.

A participating automatic bridge must implement account/actor authorization, a server claim and a durable attempt journal before submission. Retain the returned `claimId` and `dedupeKey` to bind all result reports to that claim. The claim is unique per account/event across revisions, devices and sessions and has no automatic expiry/unlock. Active claims freeze publication inputs and attachments. An uncertain claim response does not authorize another attempt. If durable coordination is unavailable, stop automated submission and offer a manual handoff.

The portable client currently reports `CONNECT_VERIFIED_LINKEDIN_PUBLISHER_FOR_THIS_ACCOUNT` without a separately verified LinkedIn publisher. X/Reddit planning does not imply a working publisher. A user's existing authorized adapter can implement `authorize` and `submit`; this package supplies no shared social connection. Host browser availability and platform permission must both be checked. A login alone does not establish a working automatic runner.

## Immediately after the base post

Persist the external receipt, then call `report_publication_result` **before** any comment, reaction or Featured action. Use a stable UUID and exact body for uncertain retries. A claimed result has this shape (placeholders are not real IDs):

```json
{
  "eventId": "<event-uuid>",
  "eventRevision": 4,
  "idempotencyKey": "<receipt-uuid>",
  "outcome": "published",
  "executionMethod": "manual",
  "occurredAt": "<actual-ISO-instant>",
  "externalId": "<confirmed-platform-post-id>",
  "externalUrl": "<verified-HTTPS-permalink>",
  "evidence": {
    "kind": "authorized_publisher",
    "reference": "<returned-claim-id>",
    "details": { "dedupeKey": "<returned-dedupe-key>" }
  },
  "followUps": {}
}
```

Use the actual task/execution contract's `executionMethod` (`manual`, `platform_scheduler`, `automatic_runner`), not the illustrative value. An AI tool call does not establish an automatic runner. Every claimed report, including `unknown` or `failed`, must keep `authorized_publisher` evidence with the same claim ID and dedupe key. Keep the observed platform confirmation in its durable journal/evidence details. The required `followUps` object can be empty to preserve current states.

For an already published manual post without an active claim, use supported confirmation evidence (`manual_confirmation`, `api_confirmation`, or `platform_confirmation`) and its observed reference. Never bypass an active claim with manual evidence. Read `get_event` with `includeContent: true` to verify `published`, the external ID and permalink. Do not use ordinary event edits to mark published.

If an external ID and confirmation are available but the permalink is not, send `externalUrl: null` and `evidence.details.publicationUrlMissing: true`. The server records truthful published status and `publicationResult.publicationUrlStatus: missing`, with `publicationUrlRecoveryRequired: true` and `retryable: false`. Tell the user the link still requires recovery. Never fabricate a permalink or send the post again. Once its URL is verified, use `repair_publication_url` against the latest revision. This also supports old published records missing a URL; it does not change content or create a social post.

If the calendar callback fails, retain the successful social receipt and report published with calendar sync pending. Check the record with `includeContent: true` and retry only the same calendar body/key. A stale revision or conflicting external ID/URL needs reconciliation, not an overwrite or new social submission. On later followup reports, retain the original revision, external ID, execution method and claim binding. The result schema requires `externalUrl`; send `null` to preserve a recorded URL, with the required `followUps` object. A different URL is a conflict. Do not replace saved confirmation evidence with guessed values.

An ambiguous social response is `unknown`, blocking another attempt until fresh evidence resolves it. Use `failed` for an observed failure and `blocked` for a known prerequisite; neither clears a claim or grants retry permission. First comment/reaction/Featured outcomes are independent (`not_requested`, `pending`, `completed`, `blocked`, `failed`, `unknown`). Their failures do not negate a successful base post.

## Helper and scheduling boundaries

The REST equivalents are `POST /api/calendar-entries/:id/publication-claim`, `/publication-result` and, on supporting servers, `/publication-url`; omit `eventId` from the body. Calendar APIs remain account-owned and never call a social platform. Use authenticated tooling without exposing bearer credentials.

The CLI `today --posts` uses an explicit/account IANA timezone and pages the entire local day, including DST transitions. `publish-today --all` is an explicit all-matching request; it does not bypass missing copy/media/authorization, queue cancellation or existing claim guards. Its tests use synthetic actors and fake external responses, not real publication.

`publication_automated` means confirmed end-to-end automatic publishing setup, separate from publication consent and followups. A calendar date, proposed runner, successful manual post or installed skill proves no scheduler. A future unattended workflow needs an independently verified platform queue or available runner with cancellation and durable recovery.
