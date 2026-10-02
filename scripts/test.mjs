import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,symlink,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {dayRange,localInstant,validateInstant} from '../src/time.mjs';
import {planCreate} from '../src/plan.mjs';
import {installSkill} from '../src/cli.mjs';
import {Profiles,DEFAULT_ORIGIN,canonicalOrigin} from '../src/profiles.mjs';
const directory=await mkdtemp(path.join(tmpdir(),'tor-calendar-consumer-'));
const packageVersion=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
try{
  assert.equal(DEFAULT_ORIGIN,'https://nembli.com');
  assert.equal(canonicalOrigin(),'https://nembli.com');
  assert.equal(dayRange('2026-09-06','America/Santiago').hours,23);
  assert.throws(()=>localInstant('2026-11-01','01:30','America/New_York'),{code:'DST_OVERLAP'});
  assert.throws(()=>validateInstant('2026-02-30T12:00:00Z'),{code:'INVALID_DATE'});
  assert.equal(planCreate({title:'Meeting',scheduledAt:'2026-10-12T09:30:00+03:00',timeZone:'Europe/Kyiv'}).ready,true);
  const store=new Map(),profiles=new Profiles({directory:path.join(directory,'connection-state'),store:{async set(k,v){store.set(k,v)},async get(k){return store.get(k)},async delete(k){store.delete(k)}}});
  for(const [accountId,email]of [['CaseSensitiveA','a@example.test'],['CaseSensitiveB','b@example.test']])await profiles.save({accountId,email,origin:'https://calendar.example.test',tokenId:crypto.randomUUID(),scope:'read'},'synthetic-secret');
  await assert.rejects(profiles.resolve(),{code:'ACCOUNT_REQUIRED'});assert.equal((await profiles.resolve('CaseSensitiveA')).accountId,'CaseSensitiveA');
  const former=await profiles.save({accountId:'Migrating',email:'migrate@example.test',origin:'https://eventcalendar.torproduction.com',tokenId:crypto.randomUUID(),scope:'read'},'old-synthetic-secret');
  const migrated=await profiles.save({accountId:'Migrating',email:'migrate@example.test',origin:DEFAULT_ORIGIN,tokenId:crypto.randomUUID(),scope:'read'},'new-synthetic-secret');
  assert.notEqual(former.profile.id,migrated.profile.id,'different origins require separate profiles');
  assert.equal((await profiles.resolve(former.profile.id)).origin,'https://eventcalendar.torproduction.com');
  assert.equal(await profiles.store.get(former.profile.credentialKey),'old-synthetic-secret','new-origin pairing preserves the old credential');
  await assert.rejects(profiles.resolve('migrate@example.test'),{code:'ACCOUNT_REQUIRED'});
  const before=await readFile(profiles.file,'utf8');assert.ok(!before.includes('synthetic-secret'));
  for(const client of ['codex','claude','hermes','gemini','cursor','copilot']){
    const target=path.join(directory,client);const installed=await installSkill(client,{directory:target});
    assert.equal(installed.version,packageVersion,'installed skill version matches package.json');
    const text=await readFile(path.join(target,'skills','tor-event-calendar','SKILL.md'),'utf8');assert.match(text,/name: tor-event-calendar/);
    if(['claude','cursor','copilot'].includes(client))assert.match(text,/disable-model-invocation: true/);
    await installSkill(client,{directory:target});await installSkill(client,{directory:target,uninstall:true});
    await assert.rejects(readFile(path.join(target,'skills','tor-event-calendar','SKILL.md')),{code:'ENOENT'});
  }
  assert.equal(await readFile(profiles.file,'utf8'),before,'upgrade/uninstall never touches connected profiles');
  const occupied=path.join(directory,'occupied','skills','tor-event-calendar');await mkdir(occupied,{recursive:true});await writeFile(path.join(occupied,'SKILL.md'),'unowned skill');
  await assert.rejects(installSkill('codex',{directory:path.join(directory,'occupied')}),{code:'UNOWNED_SKILL'});
  console.log(JSON.stringify({result:'PASS',directoryAdapters:6,isolatedProfiles:4,credentialExposure:false,nativeClientExecution:false,productionRequests:0}));
}finally{await rm(directory,{recursive:true,force:true});}

await import('./test-download.mjs');
