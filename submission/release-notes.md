# Nembli AI 0.2.0

Nembli uses `https://nembli.com`, with remote MCP at `/mcp`, installation guidance at `/connect-ai`, privacy at `/privacy`, and AI integration terms at `/ai/terms`. The combined plugin packages the explicitly invoked `tor-event-calendar` skill with account-scoped remote tools and browser OAuth. Its calendar icon now carries an N. Package/repository ID `tor-event-calendar-ai`, CLI command `tor-calendar` and skill/MCP ID remain stable.

New CLI connections default to Nembli. Existing profiles, their saved origins and the OS keyring service are preserved. A grant for an older origin cannot authorize Nembli, and redirects do not transfer it. Approve a fresh browser grant and verify the intended account before revoking an older connection. The v0.1.0 client keeps its original default but supports explicit `--origin https://nembli.com`. [Migration steps](../skills/tor-event-calendar/references/connections.md#moving-an-existing-connection-to-nembli)

The standalone skill ZIP now has one top-level `tor-event-calendar/` folder with seven files. The combined ZIP contains the portable manifest, MCP configuration, compatibility manifests, skill and supporting material. The release includes both ZIPs, the optional CLI tarball and `SHA256SUMS`; [download 0.2.0](https://github.com/Tor-Production/tor-event-calendar-ai/releases/tag/v0.2.0). The v0.1.0 tag and assets are unchanged.

The skill checks account identity, exact time/timezone, platform-specific missing values, arbitrary `customFields`, explicit `customFieldTypes` and File metadata. File bytes use browser-owned links. Calendar writes never publish or schedule social posts; `publication_automated` still requires confirmed end-to-end automatic publishing setup.

The Nembli server and public metadata are deployed. Coordinated server validation passed nine live CRUD/compatibility groups and preserved existing records. Package regression tests passed six skill installers and four synthetic profiles, including old credential retention. Archive checks compare source bytes and verify metadata/checksums. These checks do not establish a native installed-plugin OAuth session.

OpenAI directory status remains **draft**. Nembli domain verification and a pre-release Nembli skill scan passed; the final release skill has changed and needs its own scan. Native OAuth/new-session/refresh, the MCP tools scan, reviewer materials, policy review, submission, approval and public listing remain separate gates. [Current evidence](status.md)
