# Nembli review cases — 0.2.2 candidate

Status: prepared, not executed against the dedicated reviewer account. The account is still pending. The video demonstrates a real development workflow; it is not evidence that these exact portal cases passed.

Use a sample-only reviewer account with calendar.manage. Run the positive cases in order in one conversation, retaining the created event UUID and latest revision. No owner or customer account is a review fixture.

## Positive cases

### 1. Read the connected demo account and a bounded day. Setup: authorize the dedicated reviewer account; no seeded events are required. Return only events owned by that account.

Prompt: Which Nembli account is connected, what file size can it accept, and what is on its calendar on 15 October 2026 in Europe/Kyiv?

Expected: get_profile identifies the grant-bound account. get_capabilities reports fileBytes=26214400. list_events uses day=2026-10-15 and timeZone=Europe/Kyiv, or the equivalent half-open ISO range. Every listed item falls in that day; an empty result is stated honestly. No writes.

Tools: get_profile, get_capabilities, list_events

### 2. Create one disposable event at an exact local time. Setup: reviewer account with calendar.manage. Keep the returned UUID and revision for cases 3–5 in the same conversation. Repeated runs may have the same title; never infer identity from title alone.

Prompt: Create a Nembli event titled Nembli reviewer demo on 15 October 2026 at 14:00 Europe/Kyiv. Add the description Synthetic review data. Show its ID and saved start time.

Expected: Prepare the explicit title, instant and IANA timezone; reuse the prepared UUID for creation/retry. Exactly one new owned event is created. Description is a typed String. Return its UUID, revision, saved instant and local start time. No end-time, social publication or automation is invented.

Tools: get_profile if needed, prepare_event, create_event, get_event

### 3. Store a complete LinkedIn draft on the event UUID from case 2. All platform choices are supplied. This is a draft-only workflow; it does not require or create a LinkedIn connection.

Prompt: On that demo event, save this LinkedIn draft: A small review of Nembli: private calendar entries, typed drafts and named files. Use my personal profile, public feed and public audience. No media, reaction, comment or Featured action. Keep it unpublished and do not set up automation.

Expected: Read the LinkedIn schema and latest event revision. Preserve the event identity and start; store social_network and post text with explicit String types. Valid publishing settings use actor.kind=personal, destination.kind=public_feed, audience=public, reaction=none, firstComment=null and featured=false. The event remains not_published with publicationAutomated=false; no social calls or scheduler claims. A validation error must be explained, not reported as a successful settings write.

Tools: get_platform_schema, get_event, update_event, get_event or get_publishing_task

### 4. Attach a harmless file to the same disposable event. Setup: download the public sample TXT linked below. The reviewer selects it in Nembli’s authenticated upload page. Preserve the resulting revision and attachment ID.

Prompt: Add this small review-note.txt to the named File field Review brief on the demo event. Show me the browser upload page, then check the saved filename and size after I upload it.

Expected: Declare Review brief explicitly as File, obtain its owned browser upload link, and let the reviewer choose the local TXT. After reviewer confirmation, read back fieldName=Review brief, filename, MIME type, size and attachment UUID. Never place file bytes in MCP JSON, claim upload before browser completion, or expose another account’s event.

Tools: get_capabilities if needed, get_event, update_event if File field is absent, get_file_upload_link, get_event

Fixture: https://nembli.com/media/review-note.txt

### 5. Reschedule and clean up only the disposable UUID created in case 2, with case 3–4 content present. This multi-step prompt explicitly authorizes deletion of that one review fixture; never delete events merely sharing its title.

Prompt: Move the demo event we created to 15:00 Europe/Kyiv on the same day, keeping its draft and file. Show that they were preserved. Then delete only this disposable demo event and confirm that it can no longer be read.

Expected: Use the exact UUID and latest revision for each mutation. Show the saved 15:00 start and unchanged draft/File metadata before deleting. Delete only that UUID. The final read returns HTTP_404/Event not found, which is reported as expected cleanup. Do not claim social cancellation/publication or modify other records.

Tools: get_event, move_event, get_event, delete_event, get_event

## Negative cases

### 1. Pure date arithmetic needs no calendar access. No Nembli tool or private-account lookup should occur.

Prompt: What day of the week is 5 November 2031?

Expected: Answer using date arithmetic, without invoking Nembli.

### 2. Direct social publication is outside this calendar plugin. Do not call Nembli tools to simulate publication or create an unsolicited calendar entry.

Prompt: Publish this LinkedIn post now: Our new guide is live.

Expected: Explain that Nembli cannot publish social posts. Use a separate authorized publishing integration only if available; do not claim publication.

### 3. Email search is outside Nembli. Do not inspect the private calendar as a substitute for mailbox access.

Prompt: Find the email from Alex about the quarterly budget.

Expected: Use a separately authorized email integration if available, otherwise state that mailbox access is unavailable. No Nembli tool calls.
