import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdir,mkdtemp,readFile,readdir,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Pass an extracted npm tarball's package directory to test the distributed bin.
const root=process.argv[2]??fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const cli=path.resolve(root,manifest.bin['tor-calendar']);
const account='synthetic-save-recovery',events=new Map(),creates=[];
const temp=await mkdtemp(path.join(tmpdir(),'nambli-cli-save-')),otherCwd=path.join(temp,'other');
await mkdir(otherCwd);
const settings={platform:'linkedin',actor:{kind:'personal',id:'synthetic-actor',url:null},destination:{kind:'public_feed',id:null,url:null},audience:'public',requestedFollowUps:{reaction:'like',firstComment:null,featured:false}};
let responseMode='',updateCount=0,preferences={timeZone:'UTC'},preferenceReads=0,uploads=0;
const server=createServer(async(req,res)=>{
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/api/capabilities')return send(200,{calendarLimits:{fileBytes:1048576}});
  const selected=req.headers['x-calendar-account'];
  if(req.headers.authorization!=='Bearer synthetic-cli-test'||![account,'other'].includes(selected))return send(403,{});
  if(pathname==='/api/me')return send(200,{accountId:selected,email:'fixture@example.test',scope:'manage'});
  if(selected!==account)return send(403,{});
  if(pathname==='/api/account/preferences'){preferenceReads++;return send(200,preferences);}
  const id=pathname.split('/').at(-1),body=[];
  for await(const chunk of req)body.push(chunk);
  if(req.method==='POST'&&pathname.endsWith('/files')){
    const target=events.get(pathname.split('/').at(-2));
    const form=await new Response(Buffer.concat(body),{headers:{'Content-Type':req.headers['content-type']}}).formData();
    const file=form.get('file'),attachment={id:form.get('uploadId'),fieldName:form.get('fieldName'),filename:file.name,size:file.size,contentType:file.type};
    assert.equal(await file.text(),'original file bytes');
    target.attachments.push(attachment);target.revision++;uploads++;return send(201,attachment);
  }
  const payload=body.length?JSON.parse(Buffer.concat(body)):null;
  if(req.method==='GET'&&pathname.startsWith('/api/calendar-entries/')){
    if(responseMode==='readback'){responseMode='';return send(503,{});}
    return send(events.has(id)?200:404,events.get(id)??{});
  }
  let saved,status;
  if(req.method==='POST'&&pathname==='/api/calendar-entries'){
    creates.push(payload);
    if(responseMode==='before'){responseMode='';req.socket.destroy();return;}
    if(responseMode==='quota'){responseMode='';return send(409,{code:'MONTHLY_RECORD_LIMIT'});}
    const prior=events.get(payload.id);
    if(prior&&prior.title!==payload.title)return send(409,{code:'EVENT_ID_CONFLICT'});
    saved=prior??{...payload,revision:1,attachments:[]};events.set(payload.id,saved);
    status=prior?200:201;
  }else if(req.method==='PATCH'&&events.has(id)){
    const prior=events.get(id);
    if(payload.eventRevision!==prior.revision)return send(409,{code:'STALE_REVISION'});
    saved={...prior,title:payload.title,revision:prior.revision+1};events.set(id,saved);updateCount++;status=200;
  }else return send(404,{});
  const mode=responseMode;
  if(mode!=='readback')responseMode='';
  if(mode==='lost'){req.socket.destroy();return;}
  if(mode==='typed')return send(503,{code:'EVENT_SAVE_UNCONFIRMED',eventId:'untrusted response ID',error:'untrusted response text'});
  if(mode==='bodyless'){res.writeHead(503);res.end();return;}
  if(mode==='truncated'){res.writeHead(status,{'Content-Type':'application/json'});res.end('{');return;}
  send(status,saved);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
async function run(args,body,expectedExit,{cwd=temp,selected=account,targetOrigin=origin}={}){
  const child=spawn(process.execPath,[cli,...args,'--origin',targetOrigin,'--environment','--account',selected],{
    env:{...process.env,LOCALAPPDATA:temp,USERPROFILE:temp,HOME:temp,TOR_EVENT_CALENDAR_API_TOKEN:'synthetic-cli-test'},cwd,stdio:['pipe','pipe','pipe'],windowsHide:true,
  });
  let stdout='',stderr='';
  child.stdout.on('data',data=>stdout+=data);child.stderr.on('data',data=>stderr+=data);
  const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  child.stdin.end(body?JSON.stringify(body):undefined);
  assert.equal(await done,expectedExit,stdout+stderr);
  assert.doesNotMatch(stdout+stderr,/synthetic-cli-test|untrusted response/);
  if(expectedExit!==0)assert.doesNotMatch(stdout+stderr,/private-fixture|original file bytes/i);
  return JSON.parse(stdout);
}
const original={title:'Synthetic draft',scheduledAt:'2031-02-03T10:00:00Z',timeZone:'UTC'};
try{
  for(const mode of ['typed','lost','bodyless','truncated']){
    const before=events.size,attempts=creates.length;responseMode=mode;
    const failed=await run(['create','-'],original,1);
    assert.equal(failed.error,'EVENT_SAVE_UNCONFIRMED',JSON.stringify(failed));
    const id=creates.at(-1).id;
    assert.equal(failed.details.eventId,id);assert.equal(failed.details.retry,'same_id_and_content');assert.match(failed.details.recoveryId,/^[0-9a-f-]{36}$/);
    assert.match(failed.message,/identical content/);assert.ok(failed.message.includes(id));
    assert.equal(creates.length,attempts+1,'no automatic second write');
    const retry=await run(['retry-create',failed.details.recoveryId],null,0);
    assert.equal(retry.event.id,id);assert.deepEqual(creates.at(-2),creates.at(-1));assert.equal(events.size,before+1);
  }
  const id=creates.at(-1).id;
  responseMode='typed';
  const edit=await run(['update',id,'-'],{title:'Committed once'},1);
  assert.equal(edit.error,'EVENT_SAVE_UNCONFIRMED');assert.deepEqual(edit.details,{eventId:id,eventRevision:1,retry:'read_before_retry'});
  assert.match(edit.message,/original eventRevision 1/);
  const read=await run(['get',id],null,0);assert.equal(read.event.title,'Committed once');assert.equal(read.event.revision,2);
  const stale=await run(['update',id,'-'],{title:'Old draft',eventRevision:edit.details.eventRevision},1);
  assert.equal(stale.error,'STALE_REVISION');assert.equal(updateCount,1);
  responseMode='quota';assert.equal((await run(['create','-'],original,1)).error,'MONTHLY_RECORD_LIMIT');
  assert.equal((await run(['create','-'],{...original,id,title:'Other input'},1)).error,'EVENT_ID_CONFLICT');
  responseMode='readback';
  const unverified=await run(['create','-'],original,1);
  assert.equal(unverified.error,'HTTP_503');assert.equal(unverified.details.eventId,creates.at(-1).id);
  assert.match(unverified.message,/Event content was saved/);
  const relative={title:'private-fixture title',localDate:'tomorrow',localTime:'10:00',customFields:{post_text:'private-fixture body',social_network:'LinkedIn'},customFieldTypes:{image:'File'},files:{image:'private-fixture.png'}};
  await writeFile(path.join(temp,relative.files.image),'original file bytes');
  preferences={timeZone:'Pacific/Kiritimati',platformDefaults:{linkedin:settings}};
  responseMode='before';
  const lost=await run(['create','-'],relative,1);
  const sent=creates.at(-1),key=lost.details.recoveryId;
  assert.equal(events.has(sent.id),false);assert.equal(sent.id,lost.details.eventId);assert.equal(sent.timeZone,preferences.timeZone);
  assert.equal(sent.publishingSettings.requestedFollowUps.reaction,'like');assert.ok(!('localDate' in sent)&&!('files' in sent));
  assert.equal((await run(['get',sent.id],null,1)).error,'HTTP_404');
  const cfg=path.join(temp,...(process.platform==='win32'?[]:['.config']),'tor-event-calendar','create-recovery');
  const record=(await readdir(cfg,{recursive:true})).find(entry=>entry.endsWith(key+'.json'));
  const persisted=await readFile(path.join(cfg,record),'utf8');
  assert.ok(!persisted.includes('synthetic-cli-test')&&!persisted.includes('original file bytes'));
  if(process.platform!=='win32')assert.equal((await stat(path.join(cfg,record))).mode&0o777,0o600);
  assert.equal((await run(['retry-create',key],null,1,{selected:'other'})).error,'RECOVERY_NOT_FOUND');
  assert.equal((await run(['retry-create',key],null,1,{targetOrigin:origin.replace('127.0.0.1','localhost')})).error,'RECOVERY_NOT_FOUND');
  preferences={timeZone:'America/New_York',platformDefaults:{linkedin:{...settings,requestedFollowUps:{...settings.requestedFollowUps,reaction:'love'}}}};
  const planned=await run(['plan','-'],relative,0);assert.notEqual(planned.payload.scheduledAt,sent.scheduledAt);
  assert.equal(planned.payload.publishingSettings.requestedFollowUps.reaction,'love');
  const reads=preferenceReads;responseMode='before';
  const again=await run(['retry-create',key],null,1,{cwd:otherCwd});assert.equal(again.details.recoveryId,key);
  const recovered=await run(['retry-create',key],null,0,{cwd:otherCwd});
  assert.equal(preferenceReads,reads);assert.deepEqual(creates.at(-1),sent);
  assert.equal(recovered.event.attachments.length,1);assert.equal(uploads,1);
  assert.equal((await run(['retry-create',key],null,1)).error,'RECOVERY_NOT_FOUND');
  responseMode='before';const changed=await run(['create','-'],relative,1);
  await writeFile(path.join(temp,relative.files.image),'replaced file bytes');
  const stopped=await run(['retry-create',changed.details.recoveryId],null,1);
  assert.equal(stopped.error,'MEDIA_CHANGED');assert.equal(stopped.details.retry,'read_before_retry');assert.equal(uploads,1);
  await writeFile(path.join(temp,relative.files.image),'original file bytes');
  responseMode='lost';const interrupted=await run(['create','-'],relative,1);
  const occupied=events.get(interrupted.details.eventId);
  occupied.attachments.push({id:'intervening-file',fieldName:'image'});occupied.revision++;
  const conflict=await run(['retry-create',interrupted.details.recoveryId],null,1);
  assert.equal(conflict.error,'ATTACHMENT_CONFLICT');assert.equal(conflict.details.retry,'read_before_retry');
  assert.deepEqual(occupied.attachments,[{id:'intervening-file',fieldName:'image'}]);assert.equal(uploads,1);
  responseMode='before';const abandoned=await run(['create','-'],original,1);
  assert.equal((await run(['discard-create-recovery',abandoned.details.recoveryId],null,0)).discarded,true);
  assert.equal((await readdir(cfg,{recursive:true})).filter(entry=>entry.endsWith('.json')).length,0);
  console.log('PASS CLI exact create recovery before and after commit, changed date/zone/platform defaults, scoped private receipts, attachment identity, guarded updates and cleanup.');
}finally{await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
