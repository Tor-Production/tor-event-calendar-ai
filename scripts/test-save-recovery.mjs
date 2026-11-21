import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Pass an extracted npm tarball's package directory to test the distributed bin.
const root=process.argv[2]??fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const cli=path.resolve(root,manifest.bin['tor-calendar']);
const account='synthetic-save-recovery',events=new Map(),creates=[];
let responseMode='',updateCount=0;
const server=createServer(async(req,res)=>{
  const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
  if(req.headers.authorization!=='Bearer synthetic-cli-test'||req.headers['x-calendar-account']!==account)return send(403,{});
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/api/me')return send(200,{accountId:account,email:'fixture@example.test',scope:'manage'});
  if(pathname==='/api/account/preferences')return send(200,{timeZone:'UTC'});
  const id=pathname.split('/').at(-1),body=[];
  for await(const chunk of req)body.push(chunk);
  const payload=body.length?JSON.parse(Buffer.concat(body)):null;
  if(req.method==='GET'&&pathname.startsWith('/api/calendar-entries/')){
    if(responseMode==='readback'){responseMode='';return send(503,{});}
    return send(events.has(id)?200:404,events.get(id)??{});
  }
  let saved,status;
  if(req.method==='POST'&&pathname==='/api/calendar-entries'){
    creates.push(payload);
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
async function run(args,body,expectedExit){
  const child=spawn(process.execPath,[cli,...args,'--origin',origin,'--environment','--account',account],{
    env:{...process.env,TOR_EVENT_CALENDAR_API_TOKEN:'synthetic-cli-test'},stdio:['pipe','pipe','pipe'],windowsHide:true,
  });
  let stdout='',stderr='';
  child.stdout.on('data',data=>stdout+=data);child.stderr.on('data',data=>stderr+=data);
  const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  child.stdin.end(body?JSON.stringify(body):undefined);
  assert.equal(await done,expectedExit,stdout+stderr);
  assert.doesNotMatch(stdout+stderr,/synthetic-cli-test|untrusted response/);
  return JSON.parse(stdout);
}
const original={title:'Synthetic draft',scheduledAt:'2031-02-03T10:00:00Z',timeZone:'UTC'};
try{
  for(const mode of ['typed','lost','bodyless','truncated']){
    const before=events.size,attempts=creates.length;responseMode=mode;
    const failed=await run(['create','-'],original,1);
    assert.equal(failed.error,'EVENT_SAVE_UNCONFIRMED',JSON.stringify(failed));
    const id=creates.at(-1).id;
    assert.deepEqual(failed.details,{eventId:id,retry:'same_id_and_content'});
    assert.match(failed.message,/identical content/);assert.ok(failed.message.includes(id));
    assert.equal(creates.length,attempts+1,'no automatic second write');
    const retry=await run(['create','-'],{...original,id:failed.details.eventId},0);
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
  console.log('PASS CLI create recovery after typed 503, response loss, bodyless 503 and truncated receipt. Exact replay, guarded update, quota, ID conflict and failed readback verified.');
}finally{await new Promise(resolve=>server.close(resolve));}
