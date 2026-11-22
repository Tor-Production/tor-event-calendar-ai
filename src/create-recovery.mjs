import {createHash,randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,open,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {CalendarError} from './time.mjs';

function receiptPath(directory,profile,recoveryId){
  if(typeof recoveryId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recoveryId)){
    throw new CalendarError('RECOVERY_ID_REQUIRED','Use the recoveryId from the original create response.');
  }
  const scope=createHash('sha256').update(JSON.stringify([profile.origin,profile.accountId])).digest('hex');
  return path.join(directory,'create-recovery',scope,recoveryId.toLowerCase()+'.json');
}

async function snapshotFiles(files){
  const result=[];
  for(const [field,file] of Object.entries(files??{})){
    const absolute=path.resolve(file),hash=createHash('sha256');
    for await(const bytes of createReadStream(absolute))hash.update(bytes);
    result.push([field,{path:absolute,sha256:hash.digest('hex')}]);
  }
  return Object.fromEntries(result);
}

function uncertain(error){
  return error.code==='EVENT_SAVE_UNCONFIRMED'&&error.details?.retry==='same_id_and_content';
}

function explain(error,recoveryId){
  error.details={...error.details,recoveryId};
  error.message=`Save unconfirmed. Check tor-calendar get ${error.details.eventId} in the same account. To replay the identical content, run tor-calendar retry-create ${recoveryId} on this machine with the same account and origin.`;
}

async function removeFinished(file,recoveryId){
  try{await rm(file,{force:true});}
  catch{process.emitWarning(`The private create request remains on disk. Run tor-calendar discard-create-recovery ${recoveryId} with the same account and origin.`,{code:'RECOVERY_CLEANUP_FAILED'});}
}

export async function createWithRecovery(client,directory,payload){
  const recoveryId=randomUUID(),file=receiptPath(directory,client.profile,recoveryId);
  let written=false;
  try{
    return await client.create(payload,{beforeContentSave:async(body,files)=>{
      const sources=await snapshotFiles(files);
      await mkdir(path.dirname(file),{mode:0o700,recursive:true});
      const handle=await open(file,'wx',0o600);
      written=true;
      try{await handle.writeFile(JSON.stringify({version:1,body,sources}));}
      finally{await handle.close();}
      return sources;
    }});
  }catch(error){
    if(written&&uncertain(error)){explain(error,recoveryId);written=false;}
    throw error;
  }finally{
    if(written)await removeFinished(file,recoveryId);
  }
}

export async function retryCreate(client,directory,recoveryId){
  const file=receiptPath(directory,client.profile,recoveryId);
  let receipt;
  try{receipt=JSON.parse(await readFile(file,'utf8'));}
  catch(error){
    if(error.code==='ENOENT')throw new CalendarError('RECOVERY_NOT_FOUND','No pending create with that recoveryId exists for this account and origin on this machine.');
    throw new CalendarError('RECOVERY_UNREADABLE','The saved create request could not be read.');
  }
  if(receipt?.version!==1||!receipt.body?.id||!receipt.sources||typeof receipt.sources!=='object')throw new CalendarError('RECOVERY_UNREADABLE','The saved create request could not be read.');
  const files=Object.fromEntries(Object.entries(receipt.sources).map(([field,source])=>{
    if(!source||typeof source.path!=='string'||!path.isAbsolute(source.path)||!/^[0-9a-f]{64}$/.test(source.sha256))throw new CalendarError('RECOVERY_UNREADABLE','The saved file reference could not be read.');
    return [field,source.path];
  }));
  let event;
  try{event=await client.create({...receipt.body,files},{sources:receipt.sources});}
  catch(error){
    if(uncertain(error))explain(error,recoveryId);
    if(error.details?.retry==='read_before_retry')await removeFinished(file,recoveryId);
    throw error;
  }
  await removeFinished(file,recoveryId);
  return event;
}

export async function discardCreateRecovery(client,directory,recoveryId){
  const file=receiptPath(directory,client.profile,recoveryId);
  await rm(file,{force:true});
  return {discarded:true,recoveryId};
}
