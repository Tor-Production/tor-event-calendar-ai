# Cursor publication journal

`publication-journal.mjs` is a local, dependency-free Node 22.18+ helper. It makes no network requests and holds no tokens. It records a claim-bound attempt and exact result bodies around browser actions. Run it from the installed plugin's actual path, discovered in Cursor's skill metadata; `${CURSOR_PLUGIN_ROOT}` is a manifest expansion, not an assumed shell variable.

Default private state lives under `%LOCALAPPDATA%/nambli/cursor-publications` on Windows, `~/Library/Application Support/nambli/cursor-publications` on macOS, or `${XDG_STATE_HOME:-~/.local/state}/nambli/cursor-publications` on Linux. Use `--state-dir` only for an explicitly selected private/test location. Never store tokens in these files. The directory's inherited OS user permissions apply; this is not a secret vault.

The agent creates a JSON plan from reviewed source and actual `claim_publication` results. Example shape (all identities below are synthetic; never send them to a real account):

```json
{
  "accountId": "synthetic-account",
  "eventId": "11111111-1111-4111-8111-111111111111",
  "eventRevision": 4,
  "runId": "22222222-2222-4222-8222-222222222222",
  "claimId": "actual-returned-claim-id",
  "dedupeKey": "actual-returned-dedupe-key",
  "claimRequest": {
    "eventId": "11111111-1111-4111-8111-111111111111",
    "eventRevision": 4,
    "runId": "22222222-2222-4222-8222-222222222222",
    "intentionalNow": true
  },
  "claimResponse": {
    "acquired": true,
    "accountId": "synthetic-account",
    "eventId": "11111111-1111-4111-8111-111111111111",
    "eventRevision": 4,
    "claimId": "actual-returned-claim-id",
    "dedupeKey": "actual-returned-dedupe-key"
  },
  "executionMethod": "manual",
  "authorizationReference": "User's explicit instruction in the current conversation",
  "actor": { "kind": "personal", "url": "https://www.linkedin.com/in/example/" },
  "audience": "public",
  "text": "Reviewed first paragraph.\n\nReviewed second paragraph.",
  "media": [],
  "requestedFollowUps": { "reaction": "insightful", "firstComment": "Reviewed comment.", "featured": true },
  "followUpOrder": ["firstComment", "reaction", "featured"]
}
```

For an image, `media` contains `{ "path": "<actual absolute image path>", "sha256": "<actual 64-character SHA-256>", "altText": "<reviewed alt text>" }`. The journal hashes existing regular media files before saving the plan. It preserves text exactly. It does not prove actor identity, browser rendering or truth of supplied evidence; the agent verifies those against live tools.

Keep the actual claim request and returned response in the plan. Their account/event/revision/claim/dedupe fields must match the top-level plan; the requested run UUID must match too. The response must say `acquired: true`. These consistency checks prevent mixing claims, but a local JSON file cannot authenticate a fabricated server response. Only the live server/tool result establishes a real claim. Preserve extra returned server fields as evidence, never invent them.

```sh
node /actual/plugin/ecosystems/cursor/publication-journal.mjs prepare --plan /private/plan.json
node /actual/plugin/ecosystems/cursor/publication-journal.mjs begin --journal /returned/journal.json
node /actual/plugin/ecosystems/cursor/publication-journal.mjs confirm --journal /returned/journal.json --input /private/confirmation.json
node /actual/plugin/ecosystems/cursor/publication-journal.mjs followup --journal /returned/journal.json --input /private/followup.json
node /actual/plugin/ecosystems/cursor/publication-journal.mjs receipt --journal /returned/journal.json
node /actual/plugin/ecosystems/cursor/publication-journal.mjs ack --journal /returned/journal.json --key ACTUAL_RECEIPT_UUID
node /actual/plugin/ecosystems/cursor/publication-journal.mjs status --journal /returned/journal.json
```

`confirmation.json` contains `externalId`, `externalUrl` (observed HTTPS LinkedIn post permalink or null), `occurredAt` (actual ISO instant), and nonempty `observation` describing the platform confirmation. An uncertain base uses `uncertain --input` with `occurredAt` and `observation`; it never grants retry. `followup.json` contains `name` (`firstComment`, `reaction`, `featured`), `outcome` (`completed`, `blocked`, `failed`, `unknown`), `occurredAt` and nonempty `observation`. To resolve a previously recorded failed/blocked/unknown action from new evidence, also supply `reconciled: true`; inspect the same action before any retry. Completed outcomes cannot be downgraded. Exact duplicate writes are harmless.

Each state mutation uses an exclusive file lock and an fsynced atomic replacement. A second begin or a new run for the same account/event is rejected. A crash after begin leaves submission ambiguous and closed to another begin. A lock left after process termination requires manual inspection/recovery of that exact attempt; do not delete it to retry a social send. The server's claim additionally coordinates across devices; this local guard does not replace it.

`receipt` returns the oldest unsynced exact MCP argument object, with its stable idempotency key. It remains identical until `ack`. Do not acknowledge a timeout, a failed callback or a conflicting calendar record. Keep the same claimed revision and receipt identity. A followup body uses `externalUrl: null` to preserve the recorded link. A missing base link uses `publicationUrlMissing: true`; later URL repair is a separate advertised calendar tool, never a repost.

Manual result bodies explicitly use `readiness: not_applicable`, including unknown outcomes. The network evidence is capped at the server's 16 KiB UTF-8 JSON limit. When a long observation needs summarizing, the exact full input remains in the local journal and the callback carries a prefix marked `observationTruncated: true`. External IDs and URLs follow the MCP's 500/1,000-character limits. No observation is evaluated as code or instructions.

An already accepted exact receipt can replay across a later event revision. A new unsynced receipt using an old revision is correctly rejected by the server; the helper retains it and does not silently change its body/key or overwrite newer content. Reread the event and reconcile that specific conflict before preparing any new calendar operation. This is a calendar-sync limitation, never permission for another social send.
