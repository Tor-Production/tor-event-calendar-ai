# nambli 0.3.2 review test cases

Exactly five positive and three negative cases, matching `plugin.json`. The current walkthrough covers all eight workflows at https://nambli.com/demo. Recorded workflows, exact-package native tests, and server checks are distinct evidence; see [status](status.md).

## P01

P01 — Read the selected connected account, its saved timezone if present, and a bounded day. Setup: authorize a dedicated reviewer account. No seeded event is required. No writes.

> Show my connected nambli calendar account and timezone, then list my events for 15 October 2026 in Europe/Bucharest.

Tools: get_profile, list_events

Expected: get_profile identifies the selected grant-bound account and reports its saved timezone if present. If no timezone is saved, say so and use the explicitly requested Europe/Bucharest for this query without changing preferences. list_events uses localDate=2026-10-15 and timeZone=Europe/Bucharest, or the equivalent half-open ISO range. Return only that account’s events within the requested day; state an empty result honestly. No get_capabilities call is required and no private writes occur.

## P02

P02 — Create one disposable event at an exact local time. Setup: reviewer account with calendar.manage. Retain the returned stable UUID and latest revision for P03–P05 in the same conversation. Repeated titles do not establish identity.

> Create a nambli event titled nambli reviewer demo on 15 October 2026 at 14:00 Europe/Bucharest. Add the description "Synthetic review fixture. Please delete after testing." Keep it unpublished and do not set up automation. Show its ID and saved start time.

Tools: get_profile if needed, prepare_event, create_event, get_event

Expected: Prepare the title nambli reviewer demo, 2026-10-15 at 14:00 Europe/Bucharest, and description "Synthetic review fixture. Please delete after testing." with explicit String type. Reuse the prepared stable UUID and identical payload for creation or retry. Exactly one owned event is created. Read back its UUID, revision, saved instant 2026-10-15T11:00:00Z (or equivalent offset) and local start. Keep publicationStatus=not_published and publicationAutomated=false. Do not invent an end time, social publication or automation.

## P03

P03 — Store a complete unpublished LinkedIn draft on the exact event UUID from P02. All platform choices are supplied. This draft-only workflow does not require or create a LinkedIn connection.

> On that demo event, save this LinkedIn draft: A small review of nambli: private calendar entries, typed drafts and named files. Use my personal profile, public feed and public audience. No media, reaction, comment or Featured action. Keep it unpublished and do not set up automation.

Tools: get_platform_schema, get_event, update_event, get_event or get_publishing_task

Expected: Read the LinkedIn schema and the latest event revision. Preserve the event identity and start. Save social_network and the supplied post text with explicit String types, and save the supplied choices in publication_draft_settings with explicit JSON type: actor.kind=personal, destination.kind=public_feed, audience=public, no media, reaction=none, firstComment=null and featured=false. Read back the complete draft. Active publishingSettings may remain null; persisted typed publication_draft_settings constitutes draft success and does not prove active publishing setup. Keep publicationStatus=not_published and publicationAutomated=false. No social calls, connection creation or scheduler claims. Explain any failed write honestly.

## P04

P04 — Upload and download a harmless file on the exact P02 event. Setup: attach the public review-note.txt fixture through the host file input and retain its original bytes (the currently hosted fixture is 44 bytes), event UUID, latest revision and attachment ID. Compare against the actual input for this run. Label browser fallback if native transport is unavailable.

> Add the attached review-note.txt to the named File field Review brief on the demo event. Check the saved filename and size. Then help me download that same saved file and verify that its contents match the original.

Tools: get_event, update_event if the File field is absent, upload_file or get_file_upload_link, get_event, get_file_download, resources/read or authenticated browser download

Expected: Declare Review brief explicitly as File. Use the current revision and a stable upload UUID. Read back the exact field, filename, actual input size and attachment ID. Request the same saved file using get_file_download with the current revision and exact attachment. Receive bounded authenticated resource bytes or complete the authenticated browser/local-helper download. Compare downloaded bytes or full SHA-256 to the original input and report the observed result. A resource link or bytesDelivered=false alone does not prove delivery. Never store bytes in JSON, expose another account or claim unsupported native transfer.

## P05

P05 — Reschedule and clean up only the exact disposable UUID created in P02, after P03–P04. This prompt authorizes deletion of that one fixture. Never delete events merely sharing its title.

> Move the demo event we created to 15:00 Europe/Bucharest on the same day, keeping its draft and file. Show that they were preserved. Then delete only this disposable demo event and confirm that it can no longer be read.

Tools: get_event, move_event, get_event, delete_event, get_event

Expected: Use the exact UUID and latest revision for each mutation. Show the saved 15:00 start and unchanged draft/File metadata before deleting. Delete only that UUID. The final read returns HTTP_404/Event not found, which is reported as expected cleanup. Do not claim social cancellation/publication or modify other records.

## N01

N01 — Pure date arithmetic requires no calendar access. Answer Wednesday using date arithmetic, without any nambli tool call or private-account lookup.

> What day of the week is 5 November 2031?

## N02

N02 — Anonymous public calendar sharing is unsupported. Explain the limitation without invoking any nambli tool, reading private account or event data, changing permissions or records, or inventing a working anonymous link.

> Make my nambli calendar publicly accessible and give me a link that works without signing in.

## N03

N03 — Email search is outside nambli. Do not invoke any nambli tool or inspect the private calendar as a substitute for mailbox access. Use a separately authorized email integration if available, otherwise state that mailbox access is unavailable.

> Find the email from Alex about the quarterly budget.
