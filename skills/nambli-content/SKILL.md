---
name: nambli-content
description: Create or revise social content for a nambli calendar draft, including copy, media briefs and saved assets. Use for requests to turn an idea or source into a post in nambli; publication is a separate workflow.
---

# nambli content

Turn the user's idea and evidence into a usable draft. Preserve their voice, language, audience and chosen creative tools. A user's own writing or image skill can supply the content; nambli stores the result. Do not require another installed skill or a particular AI provider.

## Develop the draft

Use supplied sources and ask only for missing decisions that change the content. Distinguish supported facts from proposed phrasing; do not invent results, quotes, product capabilities or personal experiences. Use available research or media tools when the brief calls for them. A media brief or reference URL is not a generated or uploaded asset. Show the text and actual assets for review when review is requested; creating a draft does not authorize publication. Preserve approved paragraph breaks, blank lines and Unicode characters in the canonical saved text. If a text attachment and `post_text` disagree, resolve which is authoritative instead of silently normalizing or merging them; the publisher must verify the actual composer layout before sending.

If the user only asks for text or an image, return it without calendar access. When they ask to save or revise a nambli draft, that request authorizes the scoped calendar operation. Do not select unrelated records or create an extra event for an ordinary revision.

## Save in the selected calendar

1. Discover the available nambli tools and confirm the host's selected connection with `get_profile`. Keep its stable account ID fixed. If several accounts could match, resolve the account before reading private data. Sign-in and OAuth consent stay in the host/browser; never request or expose tokens.
2. For an existing draft, use its immutable ID and read `get_event` with `includeContent: true` for current revision, content and File metadata; retrieve any truncated content using the advertised chunk tool before editing it. For a new event, use `prepare_event`, resolve an exact date/time and IANA timezone or the user's saved preference, then retain its stable UUID and payload for `create_event`. Do not invent noon, all-day or the machine's timezone. If time is undecided, finish the content and ask before creating a timed event.
3. Read `get_platform_schema` only for the selected platform. Keep the social author, destination and audience separate from the calendar account; retain supplied settings and ask only for necessary missing values. Use the live nested schema. Store copy as `customFields.post_text` with type `String`, platform as `social_network` with type `String`, and supplied alt text as `alt_text` with type `String`. Update only requested fields with `update_event` and the current `eventRevision`.
4. Use explicit named `File` fields and the host-supported `upload_file` input for real media. Use a current event revision and one `uploadId` per upload; verify saved attachment ID, field, filename and size. Follow the available host's file workflow or authenticated browser upload fallback if its transport is unsupported. Never put file bytes, local paths or invented File IDs in `customFields`.
5. Read back the saved content, time, settings and attachments with `get_event(includeContent: true)`. On stale revision, reread and reconcile the user's requested changes without overwriting another edit. After an uncertain create, inspect the same UUID before an identical retry. Report the event ID and any unresolved content or media requirements.

Leave a new draft `not_published`; preserve an existing record's publication result. Calendar time is not a configured social schedule. Never set `publication_automated` from a plan or content readiness. A request to publish can continue through an available publication workflow, but this skill alone performs no social send.
