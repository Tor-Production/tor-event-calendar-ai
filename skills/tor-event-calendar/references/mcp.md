# Remote MCP tool guide

Load this reference for a task that needs tool routing, limits, or recovery details. The installed plugin supplies a remote Streamable HTTP MCP connection with browser-based OAuth. The server enforces account ownership and scope. Do not construct REST calls or seek a local CLI for the ordinary plugin flow.

## Intent → tool

| Intent | Tools and relevant inputs |
| --- | --- |
| Confirm selected account | `get_profile` → stable `id`, optional verified `email`; `get_capabilities` only when limits or supported operations matter. |
| Find events | `list_events` with `from`/`to` ISO instants **or** `localDate` plus IANA `timeZone`; optional `query`, `platform`, `publicationStatus`, `limit` (max 50), `offset`. Follow `nextOffset` if `truncated`. |
| Read one event | `get_event` with immutable `id`; default compact result. Request `includeContent` or up to 20 `customFieldKeys` only when needed. |
| Read truncated content | `get_event_content_chunk` with `id`, exact `eventRevision`, `section`, optional `fieldName` for a single `customFields` value, then `offset`/`limit` until `nextOffset` is null. Concatenate JSON text and parse it; restart if revision changes. |
| Prepare a create | `prepare_event` with title and exact zoned time (`scheduledAt`) or `localDate`, `localTime`, `timeZone` and optional `utcOffset`, plus only supplied fields/settings. Resolve `NEEDS_INPUT`; retain its generated UUID. |
| Create an event | `create_event` with the prepared stable `id` and full intended payload. Repeat only an identical body under that ID after an uncertain response; inspect ID first. |
| Edit or reschedule | `get_event` for revision, then `update_event` for title, typed `customFieldUpdates`, removals or publishing settings; `move_event` for exact `scheduledAt` and `timeZone`. Both require `eventRevision`. |
| Delete an event | `get_event` to verify ID/revision, then `delete_event` with that exact `id` and `eventRevision`. |
| Add/replace a named File | Declare `customFieldTypes[fieldName] = File` with `update_event` or create; then `get_file_upload_link(eventId, fieldName)`. User chooses bytes in the authenticated website; verify `get_event` attachment metadata afterward. |
| Remove a File | `get_event` for exact attachment ID, field name and revision; `remove_file(eventId, eventRevision, fieldName, attachmentId)`. |
| Plan platform-specific content | `get_platform_schema(platform)` for only the selected `linkedin`, `x`, or `reddit`; use returned conditional fields and actual adapter status. |
| Check a publication handoff | `get_publishing_task(eventId)` reads content/readiness/blockers. It does **not** publish or schedule. |

## Boundaries and recovery

- `list_events` uses a half-open range of at most 366 days. Its title/platform/status filters run before pagination. A local calendar day can be 23 or 25 hours, so use `localDate` with an IANA timezone or exact offsets; never derive today's interval from the host clock alone.
- `prepare_event` validates time, typed fields, and platform choices without a write. A large ready result may omit custom sections from its compact return; pass those original supplied sections and the same ID to `create_event`. Do not invent omitted values.
- `update_event` preserves unrelated custom fields, but every changed custom field needs an explicit type (`String`, `Number`, `Boolean`, `Null`, `JSON`, `File`). File values never carry bytes or base64 in `customFields`. Attachment links come from metadata. A named field can be `File` even before upload.
- The calendar limits JSON bodies to 256 KiB and each File to 25 MiB. `get_file_upload_link` requires `calendar.manage`, opens an account-bound browser flow, and does not upload bytes through MCP. An external Drive/media URL is only a reference, not a verified attachment.
- Read-only tools need `calendar.read`; mutations need `calendar.manage`. For persistent connections, the host must obtain `offline_access` along with the calendar scopes. Access tokens expire after 900 seconds; use the host's OAuth refresh/reauthorization path instead of asking for a token. Grants bind to an exact account and server origin. Switching website accounts or redirecting origins does not transfer the grant.
- On `STALE_REVISION`, reread the exact event before another write. On an uncertain create, check the same ID; never generate a fresh ID to retry. On an uncertain edit/delete, inspect the event before acting again. Missing or foreign IDs are not evidence to search another account. Calendar tools never submit social content.
