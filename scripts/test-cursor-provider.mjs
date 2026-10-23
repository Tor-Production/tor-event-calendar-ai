/** Run generated journal receipts through the actual local Worker + MCP schemas.
 * Requires an explicit private provider checkout; in-memory synthetic data only.
 * node --experimental-transform-types scripts/test-cursor-provider.mjs --provider-root /provider
 */
import assert from 'node:assert/strict';
import {createHash, generateKeyPairSync, randomUUID, sign} from 'node:crypto';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {prepare, transition} from '../ecosystems/cursor/publication-journal.mjs';

assert.equal(process.argv[2], '--provider-root', 'Pass --provider-root with the explicit local provider checkout');
assert.equal(process.argv.length, 4, 'Exactly one provider-root is required');
const provider = resolve(process.argv[3]);
const dependency = createRequire(join(provider, 'package.json'));
const {Client, StreamableHTTPClientTransport} = await import(pathToFileURL(dependency.resolve('@modelcontextprotocol/client')));
const {harness} = await import(pathToFileURL(join(provider, 'scripts/test-harness.mjs')));
const h = await harness();
const {sqlite, origin} = h, resource = `${origin}/mcp`, issuer = `${origin}/api/v1/auth`;
const now = Date.now(), clientId = 'cursor-journal-provider-test', keyId = 'cursor-journal-test-rsa';
const {publicKey, privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
const row = (sql, ...values) => sqlite.prepare(sql).run(...values);
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const userId = randomUUID(), accountId = randomUUID(), grantId = randomUUID();
row('INSERT INTO jwks(id,public_key,private_key,created_at,alg) VALUES(?,?,?,?,?)', keyId,
  JSON.stringify({...publicKey.export({format: 'jwk'}), kid: keyId, alg: 'RS256', use: 'sig'}),
  JSON.stringify(privateKey.export({format: 'jwk'})), now, 'RS256');
row('INSERT INTO oauth_clients(id,client_id,redirect_uris,scopes,token_endpoint_auth_method,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',
  randomUUID(), clientId, JSON.stringify(['https://client.example.test/callback']), JSON.stringify(['calendar.read', 'calendar.manage']), 'none', now, now);
row('INSERT INTO users(id,name,email,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,?)', userId, 'Synthetic Cursor journal', 'cursor-journal@example.test', 1, now, now);
row('INSERT INTO calendar_accounts(id,user_id,created_at) VALUES(?,?,?)', accountId, userId, new Date(now).toISOString());
row('INSERT INTO oauth_consents(id,client_id,user_id,reference_id,resources,scopes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)',
  randomUUID(), clientId, userId, accountId, JSON.stringify([resource]), JSON.stringify(['calendar.read', 'calendar.manage']), now, now);
row('INSERT INTO mcp_grants(id,account_id,user_id,client_id,scopes,created_at) VALUES(?,?,?,?,?,?)', grantId, accountId, userId, clientId, JSON.stringify(['calendar.read', 'calendar.manage']), now);
const payload = {iss: issuer, aud: resource, sub: userId, client_id: clientId, scope: 'calendar.read calendar.manage',
  iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + 3600, jti: randomUUID(),
  calendar_account_id: accountId, mcp_issued_at_ms: now, mcp_grant_id: grantId, mcp_grant_epoch: 0};
const unsigned = `${encode({alg: 'RS256', kid: keyId, typ: 'at+jwt'})}.${encode(payload)}`;
const token = `${unsigned}.${sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url')}`;
const transport = new StreamableHTTPClientTransport(new URL(resource), {authProvider: {token: async () => token},
  requestInit: {headers: {Origin: origin}}, fetch: async (url, init) => h.fetch(new Request(url, init))});
const client = new Client({name: 'cursor-journal-local-provider-test', version: '1.0.0'}, {versionNegotiation: {mode: {pin: '2026-07-28'}}});
const directory = await mkdtemp(join(tmpdir(), 'nambli-cursor-provider-'));
const good = result => {
  assert.equal(result.isError, undefined, JSON.stringify(result.content));
  assert.equal(result.structuredContent?.ok, true, JSON.stringify(result));
  return result.structuredContent.data;
};
const call = async (name, args) => client.callTool({name, arguments: args});
const create = async followups => good(await call('create_event', {id: randomUUID(), title: 'TEST ONLY Cursor journal provider contract',
  scheduledAt: '2020-01-01T12:00:00Z', timeZone: 'Europe/Kyiv', customFields: {post_text: 'Synthetic first.\n\nSynthetic second.', social_network: 'LinkedIn'},
  customFieldTypes: {post_text: 'String', social_network: 'String'},
  publishingSettings: {platform: 'linkedin', actor: {kind: 'personal', id: 'synthetic-person', url: null},
    destination: {kind: 'public_feed', id: null, url: null}, audience: 'public', requestedFollowUps: followups}}));
const confirmation = externalId => ({externalId: `urn:li:activity:${externalId}`,
  externalUrl: `https://www.linkedin.com/feed/update/urn:li:activity:${externalId}/`, occurredAt: '2026-10-21T12:00:00Z',
  observation: 'Synthetic provider observation 🙂'.repeat(1600)});
const errorCode = result => JSON.parse(result.content[0].text).code;
const sendReceipt = async journal => {
  const {body} = await transition(journal, 'receipt');
  const saved = good(await call('report_publication_result', body));
  assert.equal(good(await call('report_publication_result', body)).idempotentReplay, true);
  await transition(journal, 'ack', {key: body.idempotencyKey});
  return {body, saved};
};
const journalFor = async (event, requestedFollowUps, followUpOrder) => {
  const claimRequest = {eventId: event.id, eventRevision: event.revision, runId: randomUUID(), intentionalNow: true};
  const claimResponse = good(await call('claim_publication', claimRequest));
  const plan = {accountId, eventId: event.id, eventRevision: event.revision, runId: claimRequest.runId,
    claimId: claimResponse.claimId, dedupeKey: claimResponse.dedupeKey, claimRequest, claimResponse,
    executionMethod: 'manual', authorizationReference: 'Synthetic in-memory test only',
    actor: {kind: 'personal', url: 'https://www.linkedin.com/in/synthetic/'}, audience: 'public',
    text: 'Synthetic first.\n\nSynthetic second.', media: [], requestedFollowUps, followUpOrder};
  return (await prepare(plan, directory)).journal;
};

try {
  await client.connect(transport);
  const requested = {reaction: 'insightful', firstComment: 'Synthetic comment.', featured: true};
  const event = await create(requested), journal = await journalFor(event, requested, ['firstComment', 'reaction', 'featured']);
  await transition(journal, 'begin');
  await transition(journal, 'confirm', confirmation('7000000000000000701'));
  const baseSnapshot = JSON.parse(await readFile(journal, 'utf8')).baseReceipt;
  await assert.rejects(transition(journal, 'receipt'), /social steps/);
  for (const name of ['firstComment', 'reaction', 'featured']) await transition(journal, 'followup', {
    name, outcome: 'completed', occurredAt: '2026-10-21T12:00:01Z', observation: `Synthetic observed ${name}`});
  const receipts = [];
  for (let index = 0; index < 4; index++) receipts.push(await sendReceipt(journal));
  assert.deepEqual(receipts[0].body, baseSnapshot);
  assert.equal(receipts[0].body.evidence.details.observationTruncated, true);
  const final = good(await call('get_event', {id: event.id, includeContent: true}));
  assert.equal(final.publicationStatus, 'published');
  assert.equal(final.revision, event.revision, 'receipt updates preserve content revision');
  for (const name of ['firstComment', 'reaction', 'featured']) assert.equal(final.followUpResults[name].outcome, 'completed');
  const downgrade = {...receipts[3].body, idempotencyKey: randomUUID(), followUps: {reaction: {outcome: 'failed'}}};
  assert.equal(errorCode(await call('report_publication_result', downgrade)), 'HTTP_409');
  assert.deepEqual(JSON.parse(await readFile(journal, 'utf8')).baseReceipt, baseSnapshot);

  const none = {reaction: 'none', firstComment: null, featured: false};
  const uncertainEvent = await create(none), uncertainJournal = await journalFor(uncertainEvent, none, []);
  await transition(uncertainJournal, 'begin');
  await transition(uncertainJournal, 'uncertain', {occurredAt: '2026-10-21T12:00:00Z', observation: 'Synthetic browser interruption'});
  const unknown = await sendReceipt(uncertainJournal);
  assert.equal(unknown.saved.publicationStatus, 'unknown');
  assert.equal(unknown.saved.retryable, false);
  await assert.rejects(transition(uncertainJournal, 'begin'), /already began/);
  await transition(uncertainJournal, 'confirm', {...confirmation('7000000000000000702'), externalUrl: null});
  const recovered = await sendReceipt(uncertainJournal);
  assert.equal(recovered.saved.publicationStatus, 'published');
  assert.equal(recovered.saved.publicationUrlRecoveryRequired, true);
  assert.equal(recovered.saved.eventRevision, uncertainEvent.revision);

  // A later content edit does not invalidate replay of an already accepted exact receipt.
  const changed = good(await call('update_event', {id: event.id, eventRevision: event.revision, title: 'TEST ONLY later editor change'}));
  assert.equal(changed.revision, event.revision + 1);
  assert.equal(good(await call('report_publication_result', receipts[0].body)).idempotentReplay, true);
  // New stale receipts are intentionally rejected; no helper silently rebases or overwrites them.
  assert.equal(errorCode(await call('report_publication_result', {...receipts[3].body, idempotencyKey: randomUUID()})), 'HTTP_409');
  console.log(JSON.stringify({result: 'PASS', providerRoot: provider, generatedReceiptMcpSchema: true, actualWorkerHandlers: true,
    fullSequence: true, immutableBaseReceipt: true, independentFollowups: true, unknownRecovery: true,
    exactReplayAcrossLaterRevision: true, staleNewReceiptRejected: true, evidenceByteCap: true,
    productionRequests: 0, socialSends: 0, sourceHash: createHash('sha256').update(await readFile(new URL('../ecosystems/cursor/publication-journal.mjs', import.meta.url))).digest('hex')}));
} finally {
  await client.close().catch(() => {});
  sqlite.close();
  await rm(directory, {recursive: true, force: true});
}
