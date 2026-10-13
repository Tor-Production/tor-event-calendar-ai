#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Profiles} from './profiles.mjs';
import {CalendarClient} from './client.mjs';
import {CalendarError} from './time.mjs';

const ORIGIN='https://nambli.com';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(code,message)=>{throw new CalendarError(code,message);};

function parse(args){
  const [command,...rest]=args;
  if(!['accounts','status','upload','download'].includes(command))fail('COMMAND_REQUIRED','Choose accounts, status, upload or download.');
  const options={},positional=[];
  for(let i=0;i<rest.length;i++){
    const value=rest[i];
    if(!value.startsWith('--')){positional.push(value);continue;}
    const name=value.slice(2);
    if(!['account','profile','revision'].includes(name)||Object.hasOwn(options,name))fail('INVALID_OPTION','Unknown or repeated helper option.');
    if(!rest[i+1]||rest[i+1].startsWith('--'))fail('OPTION_VALUE_REQUIRED','Supply the requested helper option value.');
    options[name]=rest[++i];
  }
  if(command==='accounts'){
    if(positional.length||Object.keys(options).length)fail('INVALID_ARGUMENTS','accounts takes no arguments.');
    return {command,options,positional};
  }
  if(!options.account||!options.profile)fail('ACCOUNT_REQUIRED','Supply the exact MCP account ID and local profile ID through --account and --profile.');
  if(!/^[a-f0-9]{24}$/.test(options.profile))fail('PROFILE_REQUIRED','Use the exact local profile ID from accounts.');
  if(options.account.trim()!==options.account||options.account.length>256||/[\u0000-\u001f\u007f]/.test(options.account))fail('ACCOUNT_REQUIRED','Use the exact stable MCP account ID.');
  if(command==='status'){
    if(positional.length||options.revision!==undefined)fail('INVALID_ARGUMENTS','status takes only account and profile selectors.');
  }else{
    if(positional.length!==3||!UUID.test(positional[0]))fail('INVALID_ARGUMENTS','Supply an exact event UUID, the field or attachment ID, and an absolute local path.');
    if(!path.isAbsolute(positional[2]))fail('ABSOLUTE_PATH_REQUIRED','Supply an absolute local path.');
    if(command==='upload'){
      if(!positional[1].trim()||positional[1].length>120||/[\u0000-\u001f\u007f]/.test(positional[1]))fail('FIELD_REQUIRED','Supply the exact File field name.');
      if(!/^[1-9]\d*$/.test(options.revision??'')||!Number.isSafeInteger(Number(options.revision)))fail('REVISION_REQUIRED','Supply the current MCP event revision with --revision.');
      options.revision=Number(options.revision);
    }else if(!UUID.test(positional[1])||options.revision!==undefined)fail('INVALID_ARGUMENTS','download requires an exact attachment UUID and no revision option.');
  }
  return {command,options,positional};
}

// Dependencies are injected for offline tests; production always uses the OS keyring.
export async function runClaudeFiles(args,{profiles=new Profiles(),fetcher=globalThis.fetch}={}){
  const {command,options,positional}=parse(args);
  if(command==='accounts')return {accounts:(await profiles.list()).map(p=>({profileId:p.id,accountId:p.accountId,email:p.email,origin:p.origin,scope:p.scope}))};
  const profile=await profiles.resolve(options.profile);
  // Check both identities and the exact origin before retrieving any credential.
  if(profile.id!==options.profile||profile.accountId!==options.account||profile.origin!==ORIGIN)fail('ACCOUNT_MISMATCH','The local profile must match the exact MCP account and nambli origin.');
  const token=await profiles.store.get(profile.credentialKey);
  if(!token)fail('CREDENTIAL_MISSING','This profile has no OS credential. Reconnect this exact account.');
  const client=new CalendarClient(profile,token,{fetcher});
  const identity=await client.verify();
  if(command==='status')return {connected:true,profileId:profile.id,accountId:identity.accountId,email:identity.email,origin:identity.origin,scope:identity.scope};
  if(command==='upload'){
    if(identity.scope!=='manage')fail('INSUFFICIENT_SCOPE','This local connection needs manage permission to upload.');
    return client.upload(...positional,{eventRevision:options.revision,receiptOnly:true});
  }
  const {path:localPath,...receipt}=await client.download(...positional);
  return receipt;
}

export function safeError(error){
  return {error:error instanceof CalendarError&&/^[A-Z_][A-Z0-9_]*$/.test(error.code)?error.code:'CLIENT_ERROR',
    message:error instanceof CalendarError?error.message:'Operation failed; credentials and local paths were not printed.'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  runClaudeFiles(process.argv.slice(2)).then(result=>process.stdout.write(`${JSON.stringify(result)}\n`)).catch(error=>{
    process.stdout.write(`${JSON.stringify(safeError(error))}\n`);process.exitCode=1;
  });
}
