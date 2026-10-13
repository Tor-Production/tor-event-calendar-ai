import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {inventory,setup,requireNode,run} from '../ecosystems/claude-code/local-files.mjs';

const temporary=await mkdtemp(path.join(tmpdir(),'nambli bootstrap spaces '));
let installs=0;
try{
  assert.throws(()=>requireNode('22.17.9'),{code:'NODE_REQUIRED'});
  requireNode('22.18.0');requireNode('24.0.0');
  const source=await inventory();
  assert(source.files.some(f=>f.name==='src/claude-files.mjs'));
  assert(source.files.some(f=>f.name==='package-lock.json'));
  const install=async directory=>{installs++;await mkdir(path.join(directory,'node_modules/@napi-rs/keyring'),{recursive:true});await writeFile(path.join(directory,'node_modules/@napi-rs/keyring/package.json'),'{}');};
  const verify=async()=>{};
  const first=await setup(source,{cache:temporary,install,verify});
  assert.equal(first.reused,false);
  for(const {name,bytes}of source.files)assert((await readFile(path.join(first.directory,name))).equals(bytes));
  assert.equal((await setup(source,{cache:temporary,install,verify})).reused,true);
  assert.equal(installs,1);
  await assert.rejects(()=>setup(source,{cache:temporary,install,verify:async()=>{throw Object.assign(Error('missing native binary'),{code:'KEYCHAIN_RUNTIME_UNAVAILABLE'});}}),{code:'KEYCHAIN_RUNTIME_UNAVAILABLE'});
  await writeFile(path.join(first.directory,'src/cli.mjs'),'changed');
  await assert.rejects(()=>setup(source,{cache:temporary,install,verify}),{code:'RUNTIME_CHANGED'});
  assert.equal(await readFile(path.join(first.directory,'src/cli.mjs'),'utf8'),'changed');
  const failedCache=path.join(temporary,'failed');
  await assert.rejects(()=>setup(source,{cache:failedCache,install:async()=>{throw Error('synthetic');},verify}),/synthetic/);
  assert.equal((await setup(source,{cache:failedCache,install,verify})).reused,false);
  const arg="space ; $(not-a-command) ' українська.pdf";
  const check=path.join(temporary,'argv.mjs');
  await writeFile(check,"import assert from 'node:assert/strict'; assert.equal(process.argv[2],"+JSON.stringify(arg)+");");
  assert.equal(await run(process.execPath,[check,arg],{quiet:true}),0);
  console.log('PASS Claude bootstrap: locked cache, reuse, source drift, failure recovery, shell-free Unicode paths, minimum Node. No account or network accessed.');
}finally{await rm(temporary,{recursive:true,force:true});}
