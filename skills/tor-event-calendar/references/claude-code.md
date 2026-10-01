# Claude Code workflow

Use this host guidance with the shared calendar skill. Invoke the installed plugin skill explicitly with `/tor-event-calendar-ai:tor-event-calendar`; a standalone skill is `/tor-event-calendar`. Installing or invoking either skill does not authenticate an account. No skill grants blanket tool approval.

## Connection and discovery

Use the selected `nembli` HTTP MCP connection at `https://nembli.com/mcp`. With the plugin, tools have the prefix `mcp__plugin_tor-event-calendar-ai_nembli__`; a manually added server uses `mcp__nembli__`. Discover the actual exposed tools and input schemas before calling them; tool availability also depends on consent and host policy. `get_capabilities` describes server capabilities, not Claude Code file transport.

If disconnected, explain that no calendar action was performed and direct the user to `https://nembli.com/connect-ai` or the [Claude Code setup guide](https://github.com/Tor-Production/tor-event-calendar-ai/blob/develop/ecosystems/claude-code/README.md). Complete browser OAuth through `/mcp` in an interactive Claude Code session. Never ask for a token, copy a callback URL into a chat, or silently switch to the local helper.

Call `get_profile` and confirm its stable `id` and verified `email` against the intended calendar account before private reads or writes. Pin that connection. Use `list_events` with a bounded range or `localDate` and IANA `timeZone`, then `get_event` for exact IDs only. On missing scope, reauthorize in `/mcp`; on expiry, use the host refresh or re-authentication flow and verify identity again. Website account switching does not transfer a grant.

Use `prepare_event` and its same stable UUID for `create_event`. After an uncertain result, read that UUID before retrying. Read the current `revision` before `update_event` and provide it as `eventRevision`; after a stale revision, reread and resolve the conflict. Read back saved text, time, timezone, typed fields and settings. Calendar writes do not publish LinkedIn posts or send email.

## Upload files

Claude Code local files are not the remote `upload_file.file` contract. That argument requires host-provided temporary metadata (`download_url`, `file_id`, optional MIME/name) from an accepted OpenAI/Azure source. Claude Code has no demonstrated bridge for that contract. A visible `upload_file` tool or a server capability flag does not prove native file input. Do not send a local path, invent temporary URLs or file IDs, base64-encode bytes, or extract credentials. Use the authenticated browser fallback for this host unless its actual transport is separately verified.

1. Identify the exact owned event and requested target field. Read its latest revision. If needed, use `update_event` to declare `customFieldTypes: {"image": "File"}` (substitute the user's field name), with no value for that File field in `customFieldUpdates` or `customFields`. Preserve all other fields.
2. Call `get_file_upload_link` with the exact `eventId` and `fieldName`. Return its observed `uploadUrl`; explain that this action only opens a browser upload form. The browser verifies the account, event ownership and named File field. If the tool is missing, refresh/reconnect; meanwhile the user can open Nembli, select the intended account/event, and use that event's explicit File field in its editor.
3. Let the user choose the file and upload in the authenticated form. Maximum size is 25 MiB per file. The form keeps a stable upload UUID for an unchanged uncertain retry, rereads on conflict, and uses a new UUID for an intentional replacement. Do not overwrite an existing field without the user's intent.
4. After browser confirmation, call `get_event` again. Verify the exact field, stable attachment ID, filename, MIME, size and advanced revision. If a compact result omits attachment data, request full content or read bounded chunks at that revision. This verifies persisted metadata. Download and compare bytes separately before claiming a file round trip.

If the user explicitly chooses the local helper, it uses its own browser pairing and OS keychain. Verify `tor-calendar whoami --account PROFILE_ID` matches MCP's stable account ID and Nembli origin, then use `tor-calendar upload EVENT_ID FIELD_NAME LOCAL_PATH --account PROFILE_ID`. Read back the result through MCP or `tor-calendar get`. This helper sends multipart file bytes directly; it does not change the remote MCP contract. See [local helper connections](connections.md#optional-local-cli). Keep its stable upload behavior; do not invent an upload-ID flag. Replacement/conflict handling must be verified for the installed helper version.

## Download files

Discover `get_file_download` from shared #66. After `get_profile` and `get_event`, pass the exact `eventId`, current `eventRevision`, `attachmentId`, and explicit `fieldName` (null only for a legacy unbound attachment). Its result contains metadata, `browserUrl`, `bytesDelivered: false`, and a `resourceUri`/resource link for files at most 512 KiB. Read scope is sufficient. An advertised link is not delivered bytes.

If Claude Code actually exposes resource reading and delivery, read that exact authenticated `nembli://` resource with `resources/read` through the connected MCP host. Claude's resource references may be available through `@`; use the actual host affordance and record the result. This is not an HTTP URL for a web tool. Confirm observed bytes and host file access before claiming Claude read the image/PDF. Native resource visibility and decoding remain host acceptance checks; never assume a `resource_link` was read automatically.

When resource delivery is unavailable or the file exceeds 512 KiB, return the tool's observed `browserUrl` and let the user sign in to the matching account and choose **Download file**. This browser page checks the exact attachment and revision; the action itself is not a download receipt. If the new tool is not yet deployed/exposed, refresh the tool list and use the authenticated event editor's saved filename download meanwhile. On `STALE_REVISION`, reread the event and request a fresh action. Deleted, foreign-account or revoked access failures do not authorize trying another account.

The independently paired shared helper also provides `tor-calendar download EVENT_ID ATTACHMENT_ID DESTINATION --account PROFILE_ID` when its installed version advertises `download`. Verify the same stable account/origin first. It retrieves authenticated bytes and reports a local save/hash receipt; preserve an existing destination rather than overwriting it implicitly. If an older helper lacks this command, use the browser or a reviewed source build that includes #66. Never claim the old v0.2.4 release has the new command.

Compare SHA-256 hashes with the original synthetic input for a byte round trip. If the user wants Claude to inspect a browser/helper download, supply the resulting local path only after the host can access it. Never fetch an authenticated URL through an unauthenticated web tool or paste cookie/Bearer credentials into a command. Attachment metadata proves the saved reference, not received bytes.
