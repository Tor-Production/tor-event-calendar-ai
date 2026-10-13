#!/usr/bin/env node
// Agent-invoked helper bootstrap. Never installs at plugin startup or edits a plugin cache.
import {readFile,writeFile,mkdir,readdir,lstat,realpath,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';

const sourceRoot=fileURLToPath(new URL('../../',import.meta.url));
const output=value=>process.stdout.write(`${JSON.stringify(value)}\n`);
const fail=(code,message)=>Object.assign(new Error(message),{code});
export function requireNode(version=process.versions.node){
  const [major,minor]=version.split('.').map(Number);
  if(major<22||major===22&&minor<18)throw fail('NODE_REQUIRED','Install Node.js 22.18 or later with npm, then retry setup.');
}
export async function inventory(root=sourceRoot){
  const names=['package.json','package-lock.json'];
  if(!(await lstat(path.join(root,'src'))).isDirectory()||(await lstat(path.join(root,'src'))).isSymbolicLink())throw fail('SOURCE_INVALID','Expected bundled helper source.');
  for(const name of await readdir(path.join(root,'src'))){
    if(!name.endsWith('.mjs')&&!name.endsWith('.d.mts'))throw fail('SOURCE_INVALID','Unexpected helper source file.');
    names.push(`src/${name}`);
  }
  const files=[];
  for(const name of names.sort()){
    const info=await lstat(path.join(root,name));
    if(!info.isFile()||info.isSymbolicLink())throw fail('SOURCE_INVALID','Helper source must contain regular files only.');
    files.push({name,bytes:await readFile(path.join(root,name))});
  }
  const lock=JSON.parse(files.find(f=>f.name==='package-lock.json').bytes);
  for(const [name,entry] of Object.entries(lock.packages??{}))if(name&&(!entry.resolved?.startsWith('https://registry.npmjs.org/')||!entry.integrity))throw fail('LOCK_INVALID','Dependencies must have pinned npm registry URLs and integrity hashes.');
  const digest=createHash('sha256');
  for(const {name,bytes} of files)digest.update(name).update('\0').update(bytes).update('\0');
  digest.update(`${process.platform}:${process.arch}:${process.versions.modules}`);
  return {files,id:digest.digest('hex'),version:JSON.parse(files.find(f=>f.name==='package.json').bytes).version};
}
async function npmCLI(){
  const bin=path.dirname(process.execPath),candidates=[path.join(bin,'node_modules/npm/bin/npm-cli.js'),path.resolve(bin,'../lib/node_modules/npm/bin/npm-cli.js')];
  for(const dir of (process.env.PATH??'').split(path.delimiter).filter(Boolean)){
    candidates.push(path.join(dir,'node_modules/npm/bin/npm-cli.js'));
    if(process.platform!=='win32')try{candidates.push(await realpath(path.join(dir,'npm')));}catch{}
  }
  for(const candidate of candidates)try{if(path.basename(candidate)==='npm-cli.js'&&(await lstat(candidate)).isFile())return candidate;}catch{}
  throw fail('NPM_REQUIRED','This Node installation has no npm CLI. Install Node.js with npm, then retry setup.');
}
export function run(executable,args,{cwd,quiet=false}={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(executable,args,{cwd,shell:false,windowsHide:true,stdio:quiet?'ignore':'inherit'});
    child.once('error',()=>reject(fail('PROCESS_FAILED','Could not start the helper dependency command.')));
    child.once('exit',code=>resolve(code??1));
  });
}
async function ready(directory,source){
  try{
    if(JSON.parse(await readFile(path.join(directory,'ready.json'),'utf8')).id!==source.id)return false;
    for(const {name,bytes} of source.files)if(!(await readFile(path.join(directory,name))).equals(bytes))return false;
    return (await lstat(path.join(directory,'node_modules/@napi-rs/keyring/package.json'))).isFile();
  }catch{return false;}
}
async function verifyNative(directory){
  if(await run(process.execPath,['--input-type=module','-e',"const {AsyncEntry}=await import('@napi-rs/keyring'); if(typeof AsyncEntry!=='function')process.exit(1);"],{cwd:directory,quiet:true})!==0)throw fail('KEYCHAIN_RUNTIME_UNAVAILABLE','The native keychain module could not load. Preserve the runtime and check this OS/architecture and its installed dependencies.');
}
export async function setup(source,{cache,install,verify=verifyNative}={}){
  const base=cache??path.join(process.platform==='win32'?(process.env.LOCALAPPDATA||homedir()):path.join(homedir(),'.cache'),'tor-event-calendar','claude-helper');
  const directory=path.join(base,source.id);
  if(await ready(directory,source)){await verify(directory);return {directory,reused:true};}
  // Preserve incomplete/changed destinations for inspection instead of deleting somebody's files.
  try{await lstat(directory);throw fail('RUNTIME_CHANGED','Cached helper is incomplete or modified. Preserve it and inspect before retrying.');}catch(error){if(error.code!=='ENOENT')throw error;}
  await mkdir(base,{recursive:true,mode:0o700});
  const temporary=path.join(base,`.setup-${randomUUID()}`);
  await mkdir(path.join(temporary,'src'),{recursive:true,mode:0o700});
  try{
    for(const {name,bytes} of source.files)await writeFile(path.join(temporary,name),bytes,{flag:'wx',mode:0o600});
    if(install)await install(temporary);
    else {
      if(await run(process.execPath,[await npmCLI(),'ci','--omit=dev','--include=optional','--ignore-scripts','--no-audit','--no-fund'],{cwd:temporary,quiet:true})!==0)throw fail('DEPENDENCY_SETUP_FAILED','Pinned dependency installation failed. Check npm/network availability and retry setup.');
    }
    await verify(temporary);
    await writeFile(path.join(temporary,'ready.json'),JSON.stringify({id:source.id,version:source.version}),{flag:'wx',mode:0o600});
    try{await rename(temporary,directory);}catch(error){if(!await ready(directory,source))throw error;}
    return {directory,reused:false};
  }finally{await rm(temporary,{recursive:true,force:true});}
}
export async function main(args=process.argv.slice(2)){
  requireNode();
  const [command,...rest]=args;
  if(!['setup','connect','doctor','accounts','status','upload','download'].includes(command))throw fail('COMMAND_REQUIRED','Use setup, connect, doctor, accounts, status, upload or download.');
  if(['setup','connect','doctor','accounts'].includes(command)&&rest.length)throw fail('UNEXPECTED_ARGUMENT','This command accepts no extra arguments.');
  const source=await inventory(),base=path.join(process.platform==='win32'?(process.env.LOCALAPPDATA||homedir()):path.join(homedir(),'.cache'),'tor-event-calendar','claude-helper'),directory=path.join(base,source.id);
  if(command==='setup'){const result=await setup(source);output({ready:true,version:source.version,runtimeId:source.id,...result,accountStatus:'not_checked'});return;}
  if(!await ready(directory,source))throw fail('SETUP_REQUIRED','Run this bundled local-files.mjs setup once before using the helper.');
  const cli=path.join(directory,'src/cli.mjs'),guard=path.join(directory,'src/claude-files.mjs');
  const forwarded=command==='connect'?[cli,'connect','--origin','https://nambli.com','--scope','manage','--name','Claude Code local files']:command==='doctor'?[cli,'doctor','--origin','https://nambli.com']:[guard,command,...rest];
  process.exitCode=await run(process.execPath,forwarded);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{
  output({error:typeof error.code==='string'?error.code:'SETUP_FAILED',message:error.code&&/^[A-Z_]+$/.test(error.code)?error.message:'Local helper failed. No credentials were printed.'});process.exitCode=1;
});
