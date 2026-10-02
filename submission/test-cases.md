# nambli 0.3.0 candidate test cases

Prepared source; new live target outcomes are Not run until recorded. Exactly five positive and three negative cases. #89 owns matching silent captures.

## P01

Read the connected demo account and a bounded day. Setup: authorize the dedicated reviewer account; no seeded events are required. Return only events owned by that account.

> Which nambli account is connected, what file size can it accept, and what is on its calendar on 15 October 2026 in Europe/Kyiv?

Expected: get_profile identifies the grant-bound account. get_capabilities reports fileBytes=26214400. list_events uses localDate=2026-10-15 and timeZone=Europe/Kyiv, or the equivalent half-open ISO range. Every listed item falls in that day; an empty result is stated honestly. No writes.

## P02

Create one disposable event at an exact local time. Setup: reviewer account with calendar.manage. Keep the returned UUID and revision for cases 3–5 in the same conversation. Repeated runs may have the same title; never infer identity from title alone.

> Create a nambli event titled nambli reviewer demo on 15 October 2026 at 14:00 Europe/Kyiv. Add the description Synthetic review data. Show its ID and saved start time.

Expected: Prepare the explicit title, instant and IANA timezone; reuse the prepared UUID for creation/retry. Exactly one new owned event is created. Description is a typed String. Return its UUID, revision, saved instant and local start time. No end-time, social publication or automation is invented.

## P03

Store a complete LinkedIn draft on the event UUID from case 2. All platform choices are supplied. This is a draft-only workflow; it does not require or create a LinkedIn connection.

> On that demo event, save this LinkedIn draft: A small review of nambli: private calendar entries, typed drafts and named files. Use my personal profile, public feed and public audience. No media, reaction, comment or Featured action. Keep it unpublished and do not set up automation.

Expected: Read the LinkedIn schema and latest event revision. Preserve the event identity and start; store social_network and post text with explicit String types. Valid publishing settings use actor.kind=personal, destination.kind=public_feed, audience=public, reaction=none, firstComment=null and featured=false. The event remains not_published with publicationAutomated=false; no social calls or scheduler claims. A validation error must be explained, not reported as a successful settings write.

## P04

Upload and actually download the harmless fixture on the same disposable event. Setup: attach https://nambli.com/media/review-note.txt through the host file input; retain the original bytes, exact UUID, latest revision and attachment ID. Browser fallback is explicitly labelled if native transport is unavailable.

> Add the attached review-note.txt to the named File field Review brief on the demo event. Check the saved filename and size. Then help me download that same saved file and verify that its contents match the original.

Expected: Declare Review brief explicitly as File, use the current revision and stable upload UUID, then read back exact field/filename/size/attachment ID. Call get_file_download with the current revision and exact attachment. Receive bounded native resource bytes or explicitly download from the authenticated browser/local helper; open the result and compare its bytes/content to the original. A resource link or bytesDelivered=false alone does not prove delivery. Never store file bytes in JSON, expose another account, or claim unsupported native transfer.

## P05

Reschedule and clean up only the disposable UUID created in case 2, with case 3–4 content present. This multi-step prompt explicitly authorizes deletion of that one review fixture; never delete events merely sharing its title.

> Move the demo event we created to 15:00 Europe/Kyiv on the same day, keeping its draft and file. Show that they were preserved. Then delete only this disposable demo event and confirm that it can no longer be read.

Expected: Use the exact UUID and latest revision for each mutation. Show the saved 15:00 start and unchanged draft/File metadata before deleting. Delete only that UUID. The final read returns HTTP_404/Event not found, which is reported as expected cleanup. Do not claim social cancellation/publication or modify other records.

## N01

Pure date arithmetic needs no calendar access. No nambli tool or private-account lookup should occur.

> What day of the week is 5 November 2031?

Expected: Answer using date arithmetic, without invoking nambli.

## N02

Direct social publication is outside this calendar plugin. Do not call nambli tools to simulate publication or create an unsolicited calendar entry.

> Publish this LinkedIn post now: Our new guide is live.

Expected: Explain that nambli cannot publish social posts. Use a separate authorized publishing integration only if available; do not claim publication.

## N03

Email search is outside nambli. Do not inspect the private calendar as a substitute for mailbox access.

> Find the email from Alex about the quarterly budget.

Expected: Use a separately authorized email integration if available, otherwise state that mailbox access is unavailable. No nambli tool calls.
