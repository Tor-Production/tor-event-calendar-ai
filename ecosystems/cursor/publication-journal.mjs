#!/usr/bin/env node
/** Local attempt/receipt journal. No network, credentials or social API calls. */
import {createHash, randomUUID} from 'node:crypto';
import {open, mkdir, readFile, rename, unlink, lstat} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join, dirname, resolve, isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';

const names = ['firstComment', 'reaction', 'featured'];
const outcomes = ['completed', 'blocked', 'failed', 'unknown'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requireValue = (test, message) => { if (!test) throw new Error(message); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const instant = value => typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const onlyKeys = (value, allowed) => requireValue(value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).every(key => allowed.includes(key)), 'Unexpected action input key');

export function defaultStateDirectory() {
  if (process.platform === 'win32') return join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'nambli', 'cursor-publications');
  if (process.platform === 'darwin') return join(homedir(), 'Library', 'Application Support', 'nambli', 'cursor-publications');
  return join(process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'nambli', 'cursor-publications');
}

export async function validatePlan(plan) {
  requireValue(plan && typeof plan === 'object', 'Plan must be an object');
  for (const key of ['accountId', 'claimId', 'dedupeKey', 'authorizationReference', 'text']) requireValue(text(plan[key]), `Missing ${key}`);
  for (const key of ['eventId', 'runId']) requireValue(uuid.test(plan[key]), `Invalid ${key}`);
  requireValue(Number.isInteger(plan.eventRevision) && plan.eventRevision > 0, 'Invalid eventRevision');
  const request = plan.claimRequest, response = plan.claimResponse;
  requireValue(request && request.eventId === plan.eventId && request.eventRevision === plan.eventRevision
    && request.runId === plan.runId && request.intentionalNow === true, 'Recorded claim request must match this immediate publication plan');
  requireValue(response?.acquired === true && response.accountId === plan.accountId && response.eventId === plan.eventId
    && response.eventRevision === plan.eventRevision && response.claimId === plan.claimId && response.dedupeKey === plan.dedupeKey,
    'Acquired server claim response must match account/event/revision/claim/dedupe binding');
  requireValue(plan.executionMethod === 'manual', 'Cursor browser adapter requires manual executionMethod; no automatic runner is established');
  requireValue(plan.actor?.kind === 'personal' && /^https:\/\/www\.linkedin\.com\/in\/[^/?#]+\/?$/.test(plan.actor.url), 'Exact personal LinkedIn actor URL required');
  requireValue(plan.audience === 'public', 'Current claim adapter supports explicit public audience only');
  requireValue(plan.claimId.length <= 2000 && plan.dedupeKey.length <= 2000, 'Claim evidence exceeds server limits');
  boundedEvidence(plan, '', false);
  const follow = plan.requestedFollowUps;
  requireValue(follow && ['none', 'like', 'celebrate', 'support', 'love', 'insightful', 'funny'].includes(follow.reaction)
    && (follow.firstComment === null || text(follow.firstComment)) && typeof follow.featured === 'boolean', 'Complete requestedFollowUps required');
  const requested = names.filter(name => name === 'firstComment' ? follow.firstComment !== null : name === 'reaction' ? follow.reaction !== 'none' : follow.featured);
  requireValue(Array.isArray(plan.followUpOrder) && plan.followUpOrder.length === requested.length
    && new Set(plan.followUpOrder).size === requested.length && requested.every(name => plan.followUpOrder.includes(name)), 'followUpOrder must cover each requested step exactly once');
  requireValue(Array.isArray(plan.media), 'media must be an array');
  for (const item of plan.media) {
    requireValue(isAbsolute(item.path || '') && /^[a-f0-9]{64}$/i.test(item.sha256 || '') && typeof item.altText === 'string', 'Media requires absolute path, SHA-256 and explicit altText');
    const info = await lstat(item.path);
    requireValue(info.isFile() && !info.isSymbolicLink() && info.size <= 25 * 1024 * 1024, 'Media must be an existing regular file no larger than 25 MiB');
    requireValue(hash(await readFile(item.path)) === item.sha256.toLowerCase(), 'Media hash mismatch');
  }
  return structuredClone(plan);
}

async function atomicWrite(path, state) {
  const temp = `${path}.${randomUUID()}.tmp`;
  let handle;
  try {
    handle = await open(temp, 'wx', 0o600);
    await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`, 'utf8');
    await handle.sync();
    await handle.close(); handle = null;
    await rename(temp, path);
    // POSIX needs the directory entry flushed too; Windows does not expose this handle.
    if (process.platform !== 'win32') {
      const directory = await open(dirname(path), 'r');
      try { await directory.sync(); } finally { await directory.close(); }
    }
  } finally {
    if (handle) await handle.close();
    await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}

async function locked(path, action) {
  const lockPath = `${path}.lock`;
  const lock = await open(lockPath, 'wx', 0o600).catch(error => {
    if (error.code === 'EEXIST') throw new Error('Journal locked; inspect this attempt before recovery, never retry the post');
    throw error;
  });
  try { return await action(); }
  finally { await lock.close(); await unlink(lockPath); }
}

async function readState(path) {
  const info = await lstat(path);
  requireValue(info.isFile() && !info.isSymbolicLink(), 'Journal must be a regular file');
  const state = JSON.parse(await readFile(path, 'utf8'));
  requireValue(state.schemaVersion === 1 && state.plan && Array.isArray(state.receipts), 'Unknown journal format');
  return state;
}

export async function prepare(plan, directory = defaultStateDirectory()) {
  plan = await validatePlan(plan);
  const directoryPath = resolve(directory);
  await mkdir(directoryPath, {recursive: true, mode: 0o700});
  const info = await lstat(directoryPath);
  requireValue(info.isDirectory() && !info.isSymbolicLink(), 'State directory must not be a symlink');
  const path = join(directoryPath, `${hash(`${plan.accountId}\0${plan.eventId}`)}.json`);
  return locked(path, async () => {
    let existing;
    try { existing = await readState(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (existing) {
      requireValue(equal(existing.plan, plan), 'An attempt already exists for this account/event; reconcile it instead of starting another');
      return {journal: path, phase: existing.phase, reused: true};
    }
    const state = {schemaVersion: 1, plan, phase: 'prepared', baseKey: randomUUID(), receipts: [], followUps: {}};
    await atomicWrite(path, state);
    return {journal: path, phase: state.phase, reused: false};
  });
}

function boundedEvidence(plan, observation, missingUrl) {
  const evidence = {kind: 'authorized_publisher', reference: plan.claimId, details: {dedupeKey: plan.dedupeKey, observation,
    ...(missingUrl ? {publicationUrlMissing: true} : {})}};
  const bytes = () => Buffer.byteLength(JSON.stringify(evidence), 'utf8');
  if (bytes() <= 16 * 1024) return evidence;
  // Keep complete observations in the journal; send a bounded truthful summary.
  const points = Array.from(observation);
  evidence.details.observationTruncated = true;
  evidence.details.observation = '';
  requireValue(bytes() <= 16 * 1024, 'Claim evidence alone exceeds server limits');
  let low = 0, high = points.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    evidence.details.observation = points.slice(0, middle).join('');
    if (bytes() <= 16 * 1024) low = middle; else high = middle - 1;
  }
  evidence.details.observation = points.slice(0, low).join('');
  return evidence;
}

function receipt(state, {outcome, occurredAt, externalId = null, externalUrl = null, observation, followUps = {}}) {
  const plan = state.plan;
  return {eventId: plan.eventId, eventRevision: plan.eventRevision, idempotencyKey: outcome === 'published' && !state.baseReceipt ? state.baseKey : randomUUID(),
    outcome, executionMethod: plan.executionMethod, readiness: 'not_applicable', occurredAt, externalId, externalUrl,
    evidence: boundedEvidence(plan, observation,
      outcome === 'published' && externalUrl === null && (!state.baseReceipt || state.baseReceipt.externalUrl === null)), followUps};
}

function verifyObservation(input) {
  requireValue(input && instant(input.occurredAt) && text(input.observation), 'Observed evidence and actual ISO occurredAt required');
}

function pendingSteps(state) { return state.plan.followUpOrder.filter(name => !state.followUps[name]); }

export async function transition(path, action, input = {}) {
  path = resolve(path);
  return locked(path, async () => {
    const state = await readState(path);
    let result;
    if (action === 'begin') {
      onlyKeys(input, []);
      requireValue(state.phase === 'prepared', 'Submission already began; reconcile the same attempt, never submit again');
      // Recheck image bytes immediately before granting the one browser click.
      await validatePlan(state.plan);
      state.phase = 'submitting';
      result = {phase: state.phase, next: 'one authorized browser submit; save observed confirmation immediately'};
    } else if (action === 'confirm') {
      onlyKeys(input, ['externalId', 'externalUrl', 'occurredAt', 'observation']);
      verifyObservation(input);
      requireValue(text(input.externalId) && input.externalId.length <= 500, 'Confirmed externalId of at most 500 characters required');
      requireValue(input.externalUrl === null || (typeof input.externalUrl === 'string'
        && input.externalUrl.length <= 1000
        && /^https:\/\/www\.linkedin\.com\/(?:feed\/update\/urn:li:(?:share|activity|ugcPost):\d+\/?|posts\/[^?#]+)(?:\?[^#]*)?$/.test(input.externalUrl)), 'Observed HTTPS LinkedIn post permalink or explicit null required');
      const permalinkId = input.externalUrl?.match(/\/feed\/update\/urn:li:(?:share|activity|ugcPost):(\d+)/)?.[1];
      const externalNumber = input.externalId.match(/^(?:urn:li:(?:share|activity|ugcPost):)?(\d+)$/)?.[1];
      requireValue(!permalinkId || !externalNumber || permalinkId === externalNumber, 'Permalink and externalId refer to different posts');
      if (state.baseReceipt) {
        requireValue(equal(state.confirmation, input), 'Confirmed base receipt is immutable; reconcile without overwriting it');
        return {phase: state.phase, nextFollowUps: pendingSteps(state), reused: true};
      }
      requireValue(['submitting', 'unknown'].includes(state.phase), 'begin must precede confirmation');
      state.confirmation = structuredClone(input);
      state.baseReceipt = receipt(state, {outcome: 'published', externalId: input.externalId,
        externalUrl: input.externalUrl, occurredAt: input.occurredAt, observation: input.observation});
      state.receipts.push({body: state.baseReceipt, acknowledged: false});
      state.phase = 'published';
      result = {phase: state.phase, nextFollowUps: pendingSteps(state), next: 'perform these social steps now; calendar sync is deferred'};
    } else if (action === 'uncertain') {
      onlyKeys(input, ['occurredAt', 'observation']);
      verifyObservation(input);
      requireValue(state.phase === 'submitting', 'Only an unresolved begun attempt may become unknown');
      state.phase = 'unknown';
      state.uncertainty = structuredClone(input);
      state.receipts.push({body: receipt(state, {outcome: 'unknown', occurredAt: input.occurredAt, observation: input.observation}), acknowledged: false});
      result = {phase: state.phase, next: 'reconcile this attempt from platform evidence; do not submit or run dependent followups'};
    } else if (action === 'followup') {
      onlyKeys(input, ['name', 'outcome', 'occurredAt', 'observation', 'reconciled']);
      verifyObservation(input);
      requireValue(state.phase === 'published' && state.plan.followUpOrder.includes(input.name), 'Followup must be requested and base post confirmed');
      requireValue(outcomes.includes(input.outcome), 'Invalid followup outcome');
      const old = state.followUps[input.name];
      requireValue(old || pendingSteps(state)[0] === input.name, 'Follow the recorded social step order');
      if (old && equal(old, input)) return {phase: state.phase, nextFollowUps: pendingSteps(state), reused: true};
      requireValue(!old || old.outcome !== 'completed', 'Completed followup is immutable');
      requireValue(!old || input.reconciled === true, 'Prior action requires fresh reconciliation evidence before another result');
      state.followUps[input.name] = structuredClone(input);
      const body = receipt(state, {outcome: 'published', occurredAt: input.occurredAt,
        externalId: state.baseReceipt.externalId, observation: input.observation,
        followUps: {[input.name]: {outcome: input.outcome}}});
      state.receipts.push({body, acknowledged: false});
      result = {phase: state.phase, nextFollowUps: pendingSteps(state)};
    } else if (action === 'receipt') {
      onlyKeys(input, []);
      requireValue(state.phase === 'unknown' || (state.phase === 'published' && pendingSteps(state).length === 0), 'Complete/record requested social steps before calendar callbacks');
      return {body: state.receipts.find(item => !item.acknowledged)?.body ?? null};
    } else if (action === 'ack') {
      onlyKeys(input, ['key']);
      requireValue(state.phase === 'unknown' || (state.phase === 'published' && pendingSteps(state).length === 0), 'Complete/record requested social steps before calendar callbacks');
      const item = state.receipts.find(item => !item.acknowledged);
      requireValue(item && item.body.idempotencyKey === input.key, 'Acknowledge only the oldest pending confirmed calendar callback');
      item.acknowledged = true;
      result = {acknowledged: input.key, pendingReceipts: state.receipts.filter(item => !item.acknowledged).length};
    } else if (action === 'status') {
      onlyKeys(input, []);
      return {phase: state.phase, accountId: state.plan.accountId, eventId: state.plan.eventId,
        runId: state.plan.runId, externalId: state.baseReceipt?.externalId ?? null,
        nextFollowUps: pendingSteps(state), followUps: state.followUps,
        pendingReceipts: state.receipts.filter(item => !item.acknowledged).length};
    } else throw new Error('Unknown journal action');
    await atomicWrite(path, state);
    return result;
  });
}

async function main() {
  const [action, ...args] = process.argv.slice(2);
  const options = {};
  requireValue(args.length % 2 === 0, 'Options require explicit values');
  for (let index = 0; index < args.length; index += 2) {
    requireValue(['--journal', '--plan', '--state-dir', '--input', '--key'].includes(args[index]) && !Object.hasOwn(options, args[index]), 'Unknown/duplicate option');
    options[args[index]] = args[index + 1];
  }
  const load = async key => JSON.parse(await readFile(options[key], 'utf8'));
  let result;
  if (action === 'prepare') result = await prepare(await load('--plan'), options['--state-dir']);
  else {
    requireValue(text(options['--journal']), '--journal is required');
    result = await transition(options['--journal'], action, options['--input'] ? await load('--input') : action === 'ack' ? {key: options['--key']} : {});
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
