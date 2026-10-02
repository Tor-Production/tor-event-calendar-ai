import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {CalendarClient} from '../src/client.mjs';

const directory=await mkdtemp(path.join(tmpdir(),'nembli-download-'));
const accountId=randomUUID(),id=randomUUID(),attachmentId=randomUUID(),origin='https://calendar.example.test';
const bytes=Buffer.from('%PDF-1.4\nsynthetic\0\xff\n%%EOF','binary');
let event={id,revision:3,customFieldTypes:{document:'File'},attachments:[{id:attachmentId,fieldName:'document',filename:'../untrusted-ї.pdf',contentType:'application/pdf',size:bytes.length}]};
let response=()=>new Response(bytes,{headers:{'Content-Length':String(bytes.length)}}),credentialAccount=accountId,status=200;
const client=new CalendarClient({origin,accountId},'synthetic-secret',{fetcher:async(url,options)=>{
  assert.equal(new URL(url).origin,origin);assert.equal(options.redirect,'error');
  if(new URL(url).pathname==='/api/capabilities')return Response.json({calendarLimits:{fileBytes:25*1024*1024}});
  assert.equal(options.headers.Authorization,'Bearer synthetic-secret');assert.equal(options.headers['X-Calendar-Account'],accountId);
  if(status!==200)return Response.json({code:'UNAUTHORIZED'},{status});
  if(new URL(url).pathname==='/api/me')return Response.json({accountId:credentialAccount});
  if(new URL(url).pathname===`/api/calendar-entries/${id}`)return Response.json(event);
  if(new URL(url).pathname===`/api/files/${attachmentId}`)return response();
  return Response.json({code:'NOT_FOUND'},{status:404});
}});
const target=path.join(directory,'saved.pdf');
try{
  const receipt=await client.download(id,attachmentId,target);
  assert.deepEqual(await readFile(target),bytes);assert.equal(receipt.sha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(receipt.path,target);assert.equal(receipt.saved,true);
  assert.ok(!JSON.stringify(receipt).includes('synthetic-secret'));assert.deepEqual(await readdir(directory),['saved.pdf'],'server filename is never used as a path');
  await assert.rejects(client.download(id,attachmentId,target),{code:'DESTINATION_EXISTS'});assert.deepEqual(await readFile(target),bytes);
  credentialAccount=randomUUID();await assert.rejects(client.download(id,attachmentId,path.join(directory,'wrong')), {code:'ACCOUNT_MISMATCH'});credentialAccount=accountId;
  for(const denied of [401,403]){status=denied;await assert.rejects(client.download(id,attachmentId,path.join(directory,'revoked')));assert.deepEqual(await readdir(directory),['saved.pdf']);}status=200;
  await assert.rejects(client.download(id,randomUUID(),path.join(directory,'foreign')), {code:'FILE_NOT_FOUND'});
  event.customFieldTypes.document='String';await assert.rejects(client.download(id,attachmentId,path.join(directory,'wrong-field')), {code:'FILE_NOT_FOUND'});event.customFieldTypes.document='File';
  const normal=response;
  response=()=>new Response(bytes.subarray(0,1));await assert.rejects(client.download(id,attachmentId,path.join(directory,'short')), {code:'FILE_CONTENT_MISMATCH'});
  response=()=>new Response(Buffer.concat([bytes,Buffer.from('extra')]));await assert.rejects(client.download(id,attachmentId,path.join(directory,'long')), {code:'FILE_CONTENT_MISMATCH'});
  response=()=>{event={...event,revision:event.revision+1};return normal();};await assert.rejects(client.download(id,attachmentId,path.join(directory,'stale')), {code:'STALE_REVISION'});
  response=()=>new Response(new ReadableStream({pull(controller){controller.error(new Error('transport interrupted'));}}));await assert.rejects(client.download(id,attachmentId,path.join(directory,'failed')), {code:'DOWNLOAD_UNCONFIRMED'});
  assert.deepEqual(await readdir(directory),['saved.pdf'],'failed transfers and existing destinations leave no temporary output');
  event.attachments[0].size=0;event.attachments[0].fieldName=null;response=()=>new Response(null,{headers:{'Content-Length':'0'}});
  assert.equal((await client.download(id,attachmentId,path.join(directory,'empty'))).size,0);assert.equal((await readFile(path.join(directory,'empty'))).length,0);
  event.attachments[0].size=25*1024*1024+1;await assert.rejects(client.download(id,attachmentId,path.join(directory,'oversized')), {code:'MEDIA_TOO_LARGE'});
  console.log(JSON.stringify({result:'PASS',downloadBytesHash:true,noOverwrite:true,accountAndAuthGuards:true,emptyFile:true,boundedTransfers:true,productionRequests:0}));
}finally{await rm(directory,{recursive:true,force:true});}
