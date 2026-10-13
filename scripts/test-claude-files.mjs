import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,truncate} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runClaudeFiles,safeError} from '../src/claude-files.mjs';
import {CalendarClient} from '../src/client.mjs';
import {CalendarError} from '../src/time.mjs';

const ORIGIN='https://nambli.com';
const ACCOUNT='11111111-1111-4111-8111-111111111111';
const EVENT='22222222-2222-4222-8222-222222222222';
const PROFILE='a'.repeat(24);
const OTHER='33333333-3333-4333-8333-333333333333';
const selectors=['--account',ACCOUNT,'--profile',PROFILE];
const json=data=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});

function harness({scope='manage',profileChanges={},actualAccount=ACCOUNT}={}){
  const profile={id:PROFILE,accountId:ACCOUNT,email:'tester@example.test',origin:ORIGIN,scope,
    credentialKey:'synthetic-keyring-key',tokenId:'not-for-output',...profileChanges};
  const h={keyReads:0,calls:[],postCount:0,writeCount:0,profile,uploads:new Map(),files:new Map(),
    event:{id:EVENT,revision:1,customFieldTypes:{image:'File',brief_pdf:'File'},
      customFields:{private_note:'PRIVATE_EVENT_SENTINEL'},attachments:[]}};
  h.profiles={async resolve(){return {...profile};},async list(){return [{...profile}];},
    store:{async get(){h.keyReads++;return 'synthetic-secret';}}};
  h.fetcher=async(url,options={})=>{
    const {origin,pathname}=new URL(url),method=options.method??'GET';
    assert.equal(origin,ORIGIN);assert.equal(options.redirect,'error');
    h.calls.push({method,pathname});
    if(pathname==='/api/me')return h.revoked?new Response(JSON.stringify({error:'Unauthorized'}),{status:401}):json({accountId:actualAccount,email:profile.email,scope});
    if(pathname==='/api/capabilities')return json({calendarLimits:{fileBytes:25*1024*1024}});
    if(pathname===`/api/calendar-entries/${EVENT}`&&method==='GET')return json(h.event);
    if(pathname===`/api/calendar-entries/${EVENT}/files`&&method==='POST'){
      h.postCount++;
      assert.ok(options.body instanceof FormData);
      assert.equal(options.headers['X-Calendar-Account'],ACCOUNT);
      assert.equal(options.headers.Authorization,'Bearer synthetic-secret');
      const form=options.body,file=form.get('file'),id=form.get('uploadId'),field=form.get('fieldName');
      if(h.uploads.has(id))return json(h.uploads.get(id));
      if(h.raceBeforePost){h.event.revision++;h.raceBeforePost=false;}
      if(Number(form.get('eventRevision'))!==h.event.revision)return new Response(JSON.stringify({code:'STALE_REVISION'}),{status:409});
      // Match the Worker contract, including its stored-filename limit.
      const attachment={id,fieldName:field,filename:file.name.slice(0,240),contentType:file.type,size:file.size};
      h.uploads.set(id,attachment);h.files.set(id,Buffer.from(await file.arrayBuffer()));
      h.event.attachments=h.event.attachments.filter(item=>item.fieldName!==field);
      h.event.attachments.push(attachment);h.event.revision++;h.writeCount++;
      if(h.raceAfterPost){h.event.attachments=h.event.attachments.map(item=>({...item,id:OTHER}));h.event.revision++;}
      if(h.losePostResponse){h.losePostResponse=false;throw new Error('synthetic network failure after commit');}
      return json(attachment);
    }
    if(pathname.startsWith('/api/files/')&&method==='GET'){
      const bytes=h.files.get(pathname.split('/').at(-1));
      assert.ok(bytes);return new Response(bytes,{headers:{'content-length':String(bytes.length)}});
    }
    throw new Error(`Unexpected synthetic route ${method} ${pathname}`);
  };
  return h;
}

async function fixture(t){
  const directory=await mkdtemp(path.join(tmpdir(),'nambli-claude-files-'));
  t.after(()=>rm(directory,{recursive:true,force:true}));
  const file=path.join(directory,'тест image 你好.png'),bytes=Buffer.from([137,80,78,71,13,10,26,10,42]);
  await writeFile(file,bytes);return {directory,file,bytes};
}
const uploadArgs=(file,revision=1)=>['upload',EVENT,'image',file,...selectors,'--revision',String(revision)];

test('accounts exposes only profile selection metadata and never reads keyring',async()=>{
  const h=harness(),result=await runClaudeFiles(['accounts'],h);
  assert.deepEqual(Object.keys(result.accounts[0]).sort(),['accountId','email','origin','profileId','scope'].sort());
  assert.equal(result.accounts[0].profileId,PROFILE);assert.equal(h.keyReads,0);assert.equal(h.calls.length,0);
  assert.ok(!JSON.stringify(result).includes('synthetic-keyring-key'));
  assert.ok(!JSON.stringify(result).includes('not-for-output'));
});

test('exact account, profile and origin are checked before retrieving credentials',async()=>{
  for(const profileChanges of [{accountId:OTHER},{id:'b'.repeat(24)},{origin:'https://example.test'}]){
    const h=harness({profileChanges});
    await assert.rejects(runClaudeFiles(['status',...selectors],h),{code:'ACCOUNT_MISMATCH'});
    assert.equal(h.keyReads,0);assert.equal(h.calls.length,0);
  }
});

test('reject missing selectors, ambiguous email selectors and unexpected arguments',async()=>{
  const h=harness();
  for(const args of [['status'],['accounts',...selectors],['status','--account',ACCOUNT,'--profile','tester@example.test'],
    ['status',...selectors,'--environment'],['status',...selectors,'--origin',ORIGIN],
    ['status',...selectors,'--profile',PROFILE],['status',...selectors,'--revision','1'],
    ['upload',EVENT,'image',path.resolve('missing.png'),...selectors],
    ['upload',EVENT,'image','relative.png',...selectors,'--revision','1']])await assert.rejects(runClaudeFiles(args,h));
  assert.equal(h.keyReads,0);assert.equal(h.calls.length,0);
});

test('server identity must still match and status is a fresh authenticated read',async()=>{
  const wrong=harness({actualAccount:OTHER});
  await assert.rejects(runClaudeFiles(['status',...selectors],wrong),{code:'ACCOUNT_MISMATCH'});
  assert.equal(wrong.calls.length,1);assert.equal(wrong.postCount,0);
  const h=harness(),result=await runClaudeFiles(['status',...selectors],h);
  assert.deepEqual(result,{connected:true,profileId:PROFILE,accountId:ACCOUNT,email:'tester@example.test',origin:ORIGIN,scope:'manage'});
  assert.deepEqual(h.calls,[{method:'GET',pathname:'/api/me'}]);
});

test('read-only scope rejects upload before local-file access or event lookup',async()=>{
  const h=harness({scope:'read'});
  await assert.rejects(runClaudeFiles(uploadArgs(path.resolve('does-not-exist.png')),h),{code:'INSUFFICIENT_SCOPE'});
  assert.deepEqual(h.calls,[{method:'GET',pathname:'/api/me'}]);assert.equal(h.postCount,0);
});

test('stale MCP revision fails before local-file access and upload',async()=>{
  const h=harness();h.event.revision=2;
  await assert.rejects(runClaudeFiles(uploadArgs(path.resolve('does-not-exist.png')),h),{code:'STALE_REVISION'});
  assert.equal(h.postCount,0);assert.equal(h.calls.length,2);
});

test('undeclared File field fails before reading a local file or posting bytes',async()=>{
  const h=harness();delete h.event.customFieldTypes.image;
  await assert.rejects(runClaudeFiles(uploadArgs(path.resolve('does-not-exist.png')),h),{code:'NOT_FILE_FIELD'});
  assert.equal(h.postCount,0);assert.deepEqual(h.calls,[{method:'GET',pathname:'/api/me'},{method:'GET',pathname:`/api/calendar-entries/${EVENT}`}]);
});

test('a file above 25 MiB is refused before any multipart POST',async t=>{
  const {directory}=await fixture(t),h=harness(),large=path.join(directory,'oversized.png');
  await writeFile(large,'');await truncate(large,25*1024*1024+1);
  await assert.rejects(runClaudeFiles(uploadArgs(large),h),{code:'MEDIA_TOO_LARGE'});
  assert.equal(h.postCount,0);assert.equal(h.writeCount,0);assert.equal(h.event.attachments.length,0);
});

test('a missing OS credential cannot fall back to another account or environment',async()=>{
  const h=harness();h.profiles.store.get=async()=>{h.keyReads++;return null;};
  await assert.rejects(runClaudeFiles(uploadArgs(path.resolve('does-not-exist.png')),h),{code:'CREDENTIAL_MISSING'});
  assert.equal(h.keyReads,1);assert.equal(h.calls.length,0);assert.equal(h.postCount,0);
});

test('an unavailable keyring fails closed before network or file access',async()=>{
  const h=harness();h.profiles.store.get=async()=>{h.keyReads++;throw new CalendarError('KEYCHAIN_UNAVAILABLE','Unlock the OS keychain.');};
  await assert.rejects(runClaudeFiles(uploadArgs(path.resolve('does-not-exist.png')),h),{code:'KEYCHAIN_UNAVAILABLE'});
  assert.equal(h.keyReads,1);assert.equal(h.calls.length,0);assert.equal(h.postCount,0);
});

test('a revoked credential stops at profile verification without reading or posting files',async()=>{
  const h=harness();h.revoked=true;
  await assert.rejects(runClaudeFiles(uploadArgs(path.resolve('does-not-exist.png')),h),error=>{
    assert.equal(error.code,'HTTP_401');assert.equal(error.status,401);
    assert.deepEqual(safeError(error),{error:'HTTP_401',message:'Connection revoked or expired. Reconnect this account.'});
    return true;
  });
  assert.equal(h.keyReads,1);assert.deepEqual(h.calls,[{method:'GET',pathname:'/api/me'}]);assert.equal(h.postCount,0);
});

test('a missing event preserves HTTP_404 without exposing response secrets or local paths',async()=>{
  const h=harness(),fetcher=h.fetcher,hidden='synthetic-secret /private/path';
  h.fetcher=async(url,options)=>new URL(url).pathname===`/api/calendar-entries/${EVENT}`
    ?new Response(JSON.stringify({error:hidden,path:hidden}),{status:404}):fetcher(url,options);
  await assert.rejects(runClaudeFiles(uploadArgs(path.resolve('private-does-not-exist.png')),h),error=>{
    assert.equal(error.code,'HTTP_404');assert.equal(error.status,404);
    assert.deepEqual(safeError(error),{error:'HTTP_404',message:'Calendar request failed.'});
    assert.ok(!JSON.stringify(safeError(error)).includes(hidden));
    return true;
  });
  assert.equal(h.postCount,0);assert.equal(h.writeCount,0);
});

test('multipart upload verifies Unicode filename, bytes, hash and idempotent retry',async t=>{
  const {file,bytes,directory}=await fixture(t),h=harness();
  const first=await runClaudeFiles(uploadArgs(file),h);
  assert.equal(first.uploaded,true);assert.equal(first.eventRevision,2);assert.equal(first.filename,path.basename(file));
  assert.equal(first.contentType,'image/png');assert.equal(first.size,bytes.length);
  assert.equal(first.sha256,createHash('sha256').update(bytes).digest('hex'));
  assert.deepEqual(h.files.get(first.attachmentId),bytes);
  assert.ok(!JSON.stringify(first).includes(directory));assert.ok(!JSON.stringify(first).includes('PRIVATE_EVENT_SENTINEL'));
  const repeated=await runClaudeFiles(uploadArgs(file,2),h);
  assert.equal(repeated.attachmentId,first.attachmentId);assert.equal(repeated.eventRevision,2);
  assert.equal(h.writeCount,1);assert.equal(h.event.attachments.length,1);
  assert.equal(h.postCount,2,'same retry is checked by server without a duplicate mutation');
});

test('receipt uses the server-truncated filename after a successful long-name upload',async t=>{
  const {directory,bytes}=await fixture(t),h=harness(),filename=`${'f'.repeat(241)}.png`,file=path.join(directory,filename);
  await writeFile(file,bytes);
  const result=await runClaudeFiles(uploadArgs(file),h);
  assert.equal(result.uploaded,true);assert.equal(result.filename,filename.slice(0,240));
  assert.equal(result.contentType,'image/png');assert.equal(result.size,bytes.length);
  assert.equal(result.sha256,createHash('sha256').update(bytes).digest('hex'));
  const repeated=await runClaudeFiles(uploadArgs(file,result.eventRevision),h);
  assert.equal(repeated.attachmentId,result.attachmentId);assert.equal(h.writeCount,1);
});

test('a concurrent revision change rejects upload without automatic write retry',async t=>{
  const {file}=await fixture(t),h=harness();h.raceBeforePost=true;
  await assert.rejects(runClaudeFiles(uploadArgs(file),h),{code:'STALE_REVISION'});
  assert.equal(h.postCount,1);assert.equal(h.writeCount,0);
});

test('uncertain upload reconciles via fresh revision and keeps the same upload ID',async t=>{
  const {file}=await fixture(t),h=harness();h.losePostResponse=true;
  await assert.rejects(runClaudeFiles(uploadArgs(file),h),{code:'NETWORK_UNCERTAIN'});
  assert.equal(h.writeCount,1);const id=h.event.attachments[0].id;
  await assert.rejects(runClaudeFiles(uploadArgs(file),h),{code:'STALE_REVISION'});
  const result=await runClaudeFiles(uploadArgs(file,h.event.revision),h);
  assert.equal(result.attachmentId,id);assert.equal(h.writeCount,1);assert.equal(h.event.attachments.length,1);
});

test('changed content replaces one field while leaving the other attachment intact',async t=>{
  const {file}=await fixture(t),h=harness();
  h.event.attachments.push({id:OTHER,fieldName:'brief_pdf',filename:'brief.pdf',contentType:'application/pdf',size:4});
  const first=await runClaudeFiles(uploadArgs(file),h);
  await writeFile(file,Buffer.from([137,80,78,71,1,2,3]));
  const second=await runClaudeFiles(uploadArgs(file,first.eventRevision),h);
  assert.notEqual(second.attachmentId,first.attachmentId);assert.equal(h.writeCount,2);
  assert.equal(h.event.attachments.find(item=>item.fieldName==='brief_pdf').id,OTHER);
});

test('replacement between POST and readback is not reported as upload success',async t=>{
  const {file}=await fixture(t),h=harness();h.raceAfterPost=true;
  await assert.rejects(runClaudeFiles(uploadArgs(file),h),{code:'UPLOAD_UNCONFIRMED'});
  assert.equal(h.postCount,1);
});

test('shared upload retains its legacy event return when receiptOnly is absent',async t=>{
  const {file}=await fixture(t),h=harness(),client=new CalendarClient(h.profile,'synthetic-secret',{fetcher:h.fetcher});
  const result=await client.upload(EVENT,'image',file);
  assert.equal(result.id,EVENT);assert.equal(result.revision,2);assert.equal(result.customFields.private_note,'PRIVATE_EVENT_SENTINEL');
});

test('download permits read scope, returns a compact receipt and preserves destination',async t=>{
  const {file,bytes,directory}=await fixture(t),h=harness();
  const uploaded=await runClaudeFiles(uploadArgs(file),h),reader=harness({scope:'read'});
  reader.event=structuredClone(h.event);reader.files=h.files;
  const destination=path.join(directory,'downloaded file.png');
  const args=['download',EVENT,uploaded.attachmentId,destination,...selectors];
  const result=await runClaudeFiles(args,reader);
  assert.equal(result.saved,true);assert.equal(result.sha256,uploaded.sha256);assert.ok(!('path' in result));
  assert.ok(!JSON.stringify(result).includes(directory));assert.deepEqual(await readFile(destination),bytes);
  await assert.rejects(runClaudeFiles(args,reader),{code:'DESTINATION_EXISTS'});
  assert.deepEqual(await readFile(destination),bytes);assert.equal(reader.postCount,0);
});

test('unexpected errors and structured details cannot leak local paths or secrets',()=>{
  const hidden='synthetic-secret /private/path';
  assert.ok(!JSON.stringify(safeError(new Error(hidden))).includes(hidden));
  const result=safeError(new CalendarError('NOT_CONNECTED','Connect this account.',{token:hidden,path:hidden}));
  assert.deepEqual(result,{error:'NOT_CONNECTED',message:'Connect this account.'});
  assert.deepEqual(safeError(new CalendarError('HTTP_404','Calendar request failed.',{token:hidden,path:hidden})),
    {error:'HTTP_404',message:'Calendar request failed.'});
});
