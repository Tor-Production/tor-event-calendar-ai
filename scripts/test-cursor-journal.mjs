import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm, open} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash, randomUUID} from 'node:crypto';
import {prepare, transition} from '../ecosystems/cursor/publication-journal.mjs';

const plan = () => {
  const source = {accountId: 'synthetic-account', eventId: randomUUID(), eventRevision: 6, runId: randomUUID(),
  claimId: 'synthetic-claim', dedupeKey: 'synthetic-key', executionMethod: 'manual', authorizationReference: 'synthetic test authorization',
  actor: {kind: 'personal', url: 'https://www.linkedin.com/in/synthetic/'}, audience: 'public',
  text: 'Перший абзац.\n\nSecond paragraph.\n\n🙂', media: [],
  requestedFollowUps: {reaction: 'insightful', firstComment: 'Exact synthetic comment.', featured: true},
  followUpOrder: ['firstComment', 'reaction', 'featured']};
  source.claimRequest = {eventId: source.eventId, eventRevision: source.eventRevision, runId: source.runId, intentionalNow: true};
  source.claimResponse = {acquired: true, accountId: source.accountId, eventId: source.eventId, eventRevision: source.eventRevision,
    claimId: source.claimId, dedupeKey: source.dedupeKey};
  return source;
};
const confirmation = () => ({externalId: 'urn:li:share:123', externalUrl: 'https://www.linkedin.com/feed/update/urn:li:share:123/',
  occurredAt: '2026-10-21T10:00:00Z', observation: 'Synthetic observed post evidence'});
const result = (name, outcome = 'completed') => ({name, outcome, occurredAt: '2026-10-21T10:00:01Z', observation: `Synthetic ${name} evidence`});
async function fixture(callback) {
  const directory = await mkdtemp(join(tmpdir(), 'nambli-cursor-journal-'));
  try { await callback(directory); } finally { await rm(directory, {recursive: true, force: true}); }
}

test('complete sequence saves exact copy and base evidence, defers callbacks, and replays exact bodies in order', () => fixture(async directory => {
  const source = plan();
  const {journal} = await prepare(source, directory);
  assert.equal((await prepare(source, directory)).reused, true);
  await transition(journal, 'begin');
  await transition(journal, 'confirm', confirmation());
  const saved = JSON.parse(await readFile(journal, 'utf8'));
  assert.equal(saved.plan.text, source.text);
  assert.equal(saved.plan.requestedFollowUps.firstComment, source.requestedFollowUps.firstComment);
  assert.equal(saved.baseReceipt.evidence.reference, source.claimId);
  assert.equal(saved.baseReceipt.evidence.details.dedupeKey, source.dedupeKey);
  await assert.rejects(transition(journal, 'receipt'), /social steps/);
  for (const name of source.followUpOrder) await transition(journal, 'followup', result(name));
  const bodies = [];
  for (let index = 0; index < 4; index++) {
    const {body} = await transition(journal, 'receipt');
    assert.deepEqual((await transition(journal, 'receipt')).body, body);
    assert.equal(body.eventRevision, source.eventRevision);
    assert.equal(body.externalId, confirmation().externalId);
    bodies.push(body);
    await transition(journal, 'ack', {key: body.idempotencyKey});
  }
  assert.equal(new Set(bodies.map(body => body.idempotencyKey)).size, 4);
  assert.deepEqual(bodies[0].followUps, {});
  assert.deepEqual(bodies[1].followUps, {firstComment: {outcome: 'completed'}});
  assert.equal(bodies[1].externalUrl, null);
  assert.equal((await transition(journal, 'receipt')).body, null);
}));

test('begin is one-shot across restart/new run and media is verified again before submit', () => fixture(async directory => {
  const source = plan();
  const image = join(directory, 'image.png');
  await writeFile(image, 'synthetic image bytes');
  source.media.push({path: image, sha256: createHash('sha256').update('synthetic image bytes').digest('hex'), altText: 'Synthetic alt.'});
  const {journal} = await prepare(source, directory);
  await writeFile(image, 'changed bytes');
  await assert.rejects(transition(journal, 'begin'), /hash mismatch/);
  await writeFile(image, 'synthetic image bytes');
  await transition(journal, 'begin');
  await assert.rejects(transition(journal, 'begin'), /already began/);
  const changed = {...source, runId: randomUUID()};
  changed.claimRequest = {...changed.claimRequest, runId: changed.runId};
  await assert.rejects(prepare(changed, directory), /already exists/);
}));

test('unknown base blocks resubmit/followups and can only reconcile the same confirmed post', () => fixture(async directory => {
  const {journal} = await prepare(plan(), directory);
  await transition(journal, 'begin');
  await transition(journal, 'uncertain', {occurredAt: '2026-10-21T10:00:00Z', observation: 'Synthetic timeout after click'});
  assert.equal((await transition(journal, 'receipt')).body.outcome, 'unknown');
  await assert.rejects(transition(journal, 'begin'), /already began/);
  await assert.rejects(transition(journal, 'followup', result('reaction')), /base post confirmed/);
  await transition(journal, 'confirm', confirmation());
  assert.equal((await transition(journal, 'status')).externalId, confirmation().externalId);
  assert.equal((await transition(journal, 'confirm', confirmation())).reused, true);
  await assert.rejects(transition(journal, 'confirm', {...confirmation(), externalId: 'different'}), /immutable/);
}));

test('independent followups continue after a failed step; unknown needs reconciliation and completed cannot downgrade', () => fixture(async directory => {
  const {journal} = await prepare(plan(), directory);
  await transition(journal, 'begin');
  await transition(journal, 'confirm', confirmation());
  await transition(journal, 'followup', result('firstComment', 'unknown'));
  await transition(journal, 'followup', result('reaction', 'failed'));
  await transition(journal, 'followup', result('featured'));
  await assert.rejects(transition(journal, 'followup', result('firstComment')), /reconciliation/);
  await transition(journal, 'followup', {...result('firstComment'), reconciled: true});
  await assert.rejects(transition(journal, 'followup', {...result('featured', 'failed'), reconciled: true}), /immutable/);
  const state = await transition(journal, 'status');
  assert.equal(state.followUps.reaction.outcome, 'failed');
  assert.equal(state.phase, 'published');
  assert.equal(state.nextFollowUps.length, 0);
}));

test('invalid/omitted steps, wrong URL, wrong receipt acknowledgement and concurrent access fail closed', () => fixture(async directory => {
  await assert.rejects(prepare({...plan(), followUpOrder: ['reaction']}, directory), /each requested/);
  await assert.rejects(prepare({...plan(), executionMethod: 'automatic_runner'}, directory), /manual executionMethod/);
  const {journal} = await prepare(plan(), directory);
  await transition(journal, 'begin');
  await assert.rejects(transition(journal, 'confirm', {...confirmation(), externalUrl: 'https://evil.example/post'}), /LinkedIn/);
  await transition(journal, 'confirm', confirmation());
  await assert.rejects(transition(journal, 'followup', result('unplanned')), /requested/);
  await assert.rejects(transition(journal, 'ack', {key: randomUUID()}), /social steps/);
  await assert.rejects(transition(journal, 'followup', result('reaction')), /step order/);
  const lock = await open(`${journal}.lock`, 'wx');
  try { await assert.rejects(transition(journal, 'status'), /locked/); } finally { await lock.close(); }
}));

test('claim mismatch, unexpected outcome injection and a mismatched post URL are rejected', () => fixture(async directory => {
  const source = plan();
  await assert.rejects(prepare({...source, claimResponse: {...source.claimResponse, accountId: 'another-account'}}, directory), /claim response/);
  await assert.rejects(prepare({...source, audience: 'connections'}, directory), /public audience only/);
  const {journal} = await prepare(source, directory);
  await transition(journal, 'begin');
  await assert.rejects(transition(journal, 'confirm', {...confirmation(), outcome: 'failed'}), /Unexpected action/);
  await assert.rejects(transition(journal, 'uncertain', {...confirmation(), outcome: 'published'}), /Unexpected action/);
  await assert.rejects(transition(journal, 'confirm', {...confirmation(), externalId: 'urn:li:share:999'}), /different posts/);
  assert.equal((await transition(journal, 'status')).phase, 'submitting');
}));

test('full Unicode observation stays local while callback evidence fits the real server byte cap', () => fixture(async directory => {
  const source = {...plan(), requestedFollowUps: {reaction: 'none', firstComment: null, featured: false}, followUpOrder: []};
  const {journal} = await prepare(source, directory);
  await transition(journal, 'begin');
  const observation = '🙂\u0001'.repeat(10000);
  await transition(journal, 'confirm', {...confirmation(), observation});
  const {body} = await transition(journal, 'receipt');
  assert.ok(Buffer.byteLength(JSON.stringify(body.evidence), 'utf8') <= 16 * 1024);
  assert.equal(body.evidence.details.observationTruncated, true);
  assert.equal(JSON.parse(await readFile(journal, 'utf8')).confirmation.observation, observation);
  assert.equal(body.readiness, 'not_applicable');
}));

test('post-only needs no followup and missing permalink stays explicit without inventing a URL', () => fixture(async directory => {
  const source = {...plan(), requestedFollowUps: {reaction: 'none', firstComment: null, featured: false}, followUpOrder: []};
  const {journal} = await prepare(source, directory);
  await transition(journal, 'begin');
  await transition(journal, 'confirm', {...confirmation(), externalUrl: null});
  const {body} = await transition(journal, 'receipt');
  await assert.rejects(transition(journal, 'ack', {key: randomUUID()}), /oldest pending/);
  assert.equal(body.externalUrl, null);
  assert.equal(body.evidence.details.publicationUrlMissing, true);
  assert.equal((await transition(journal, 'status')).phase, 'published');
}));
