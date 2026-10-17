# Social content planning — 17 October 2026

The shared platform registry drives calendar choices, REST/MCP schemas and the portable planner. It includes LinkedIn, X, Reddit, Instagram, Facebook, YouTube, TikTok and Snapchat. Choosing a platform or saving a date never publishes or schedules a social post.

The five new platforms have `adapter.id: null`, no supported actions and `runtime: unsupported`. A publishing task remains blocked for an automatic adapter. Existing LinkedIn scope and the X/Reddit schemas remain unchanged. Account names/URLs are optional human context; the calendar does not demand numeric API IDs or verify social ownership from them.

| Platform | Required planning choices | Optional context |
| --- | --- | --- |
| Instagram | Image, carousel, reel or story | Account name/URL |
| Facebook | Profile or Page; post, reel or story | Profile/Page name/URL |
| YouTube | Video or Short; public, unlisted or private visibility | Channel name/URL |
| TikTok | Video or photo | Account name/URL |
| Snapchat | Spotlight, public story or saved story | Public Profile name/URL |

Partial choices remain in typed `customFields.publication_draft_settings` until the planner has complete settings. A complete plan means the calendar inputs are complete; it does not establish media validity, platform eligibility, audience consent, a publisher or an unattended runner. The publisher must resolve remaining platform-specific choices from the actual account before any separately authorized send. Snapchat private messages and messenger-only services are outside this registry.

## Platform evidence and integration limits

- Meta's [official Instagram collection](https://www.postman.com/meta/instagram/folder/u4g5a2a/instagram-api-with-facebook-login) documents professional-account publishing and additional restrictions for Stories. The [Pages API guide](https://developers.facebook.com/docs/pages-api/posts/) and [official Facebook collection](https://www.postman.com/meta/facebook/documentation/r56bjfd/facebook-api) describe Page access. These are separate integration prerequisites; no Facebook profile publisher is implied.
- YouTube [video uploads](https://developers.google.com/youtube/v3/docs/videos/insert) and [Shorts upload guidance](https://support.google.com/youtube/answer/12921536) distinguish upload metadata and visibility. The publisher must verify audience/children settings, rights and Shorts eligibility; the calendar does not infer them.
- TikTok's [Direct Post guide](https://developers.tiktok.com/doc/content-posting-api-get-started/) requires an approved client, user authorization and current creator information before selecting permitted audience/options. A stored video/photo choice does not satisfy those prerequisites.
- Snapchat's [Public Profile API](https://developers.snap.com/marketing-api/Public-Profile-API/Introduction) covers public Stories, saved Stories and Spotlights. [Asset management](https://developers.snap.com/marketing-api/Public-Profile-API/ProfileAssetManagement) distinguishes submitted Spotlight content from live content. A submission response alone is not confirmed publication.

## Recording an observed manual result

Receipt reporting and URL repair remain account-scoped, revision-checked and idempotent. They never call a social platform. Recognized HTTPS post links include Instagram posts/reels, Facebook `/posts/`, `/reel/` and `permalink.php`, YouTube watch/Shorts/`youtu.be`, TikTok video/photo posts and Snapchat Spotlight. Tracking parameters/fragments are normalized while identifiers are retained. Profile URLs, redirect links and other shapes are rejected; validation checks structure, not live existence or account ownership.

An unrecognized or unavailable link, including ephemeral Stories, must not lead to a duplicate post. With an observed external ID and supported confirmation evidence, record the truthful published result using `externalUrl: null` and `evidence.details.publicationUrlMissing: true`. Recover a recognized permalink later when possible; a link for expired content may remain unavailable. Never fabricate a URL or resubmit to get one. Existing receipt/claim/conflicting-URL safeguards still apply.

The published-status notification engine remains limited to its existing LinkedIn link path. These planning choices do not add new platform notification or publishing integrations.
