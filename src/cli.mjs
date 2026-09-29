#!/usr/bin/env node
import {readFile,writeFile,mkdir,rm,cp,lstat} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {randomBytes,createHash,randomUUID} from 'node:crypto';
import {Profiles,KeyringStore,canonicalOrigin,DEFAULT_ORIGIN} from './profiles.mjs';
import {CalendarClient,publicRequest} from './client.mjs';
import {CalendarError,relativeDate,dayRange} from './time.mjs';
import {planCreate} from './plan.mjs';
import {publishBatch} from './publish.mjs';
const VERSION='0.2.1',output=value=>process.stdout.write(`${JSON.stringify(value)}\n`);
function argumentsOf(args){const positional=[],options={};for(let i=0;i<args.length;i++){const a=args[i];if(a.startsWith('--')){const key=a.slice(2);if(['help','no-browser','default','environment','all','posts','local-only'].includes(key))options[key]=true;else{if(!args[i+1]||args[i+1].startsWith('--'))throw new CalendarError('OPTION_VALUE_REQUIRED',`Supply --${key}.`);options[key]=args[++i];}}else positional.push(a);}return {positional,options};}
async function input(file){let text;if(file==='-'){text='';for await(const chunk of process.stdin){text+=chunk;if(Buffer.byteLength(text)>262144)throw new CalendarError('JSON_TOO_LARGE','Input exceeds 256 KiB.');}}else{text=await readFile(file,'utf8');}if(Buffer.byteLength(text)>262144)throw new CalendarError('JSON_TOO_LARGE','Input exceeds 256 KiB.');try{const b=JSON.parse(text);if(!b||typeof b!=='object'||Array.isArray(b))throw 0;return b;}catch{throw new CalendarError('INVALID_JSON','Supply a JSON object via a file or stdin.');}}
function openBrowser(url){const [exe,args]=process.platform==='win32'?['rundll32.exe',['url.dll,FileProtocolHandler',url]]:process.platform==='darwin'?['open',[url]]:['xdg-open',[url]];const child=spawn(exe,args,{stdio:'ignore',detached:true,windowsHide:true});child.on('error',()=>{});child.unref();}
async function connect(profiles,options){
  const origin=canonicalOrigin(options.origin),scope=options.scope??'manage';if(!['read','manage'].includes(scope))throw new CalendarError('INVALID_SCOPE','Choose read or manage.');await profiles.store.probe();
  const verifier=randomBytes(32).toString('base64url'),codeChallenge=createHash('sha256').update(verifier).digest('base64url');
  const started=await publicRequest(origin,'/api/ai/device/start',{method:'POST',body:{clientName:options.name??`${process.platform} · Nembli CLI`,codeChallenge,scope}});
  output({action:'approve_connection',url:started.verificationUri,userCode:started.userCode,client:options.name??'Nembli CLI',scope,expiresIn:started.expiresIn});
  if(!options['no-browser'])openBrowser(`${started.verificationUri}?code=${encodeURIComponent(started.userCode)}`);
  const deadline=Date.now()+started.expiresIn*1000;let delay=started.interval*1000;
  while(Date.now()<deadline){await new Promise(r=>setTimeout(r,delay));let approved;try{approved=await publicRequest(origin,'/api/ai/device/poll',{method:'POST',body:{deviceCode:started.deviceCode,codeVerifier:verifier}});}catch(e){if(e.code==='AUTHORIZATION_PENDING')continue;if(e.code==='SLOW_DOWN'){delay+=5000;continue;}throw e;}
    const client=new CalendarClient({...approved,origin},approved.token);const identity=await client.verify();let saved;
    try{saved=await profiles.save({...approved,...identity,origin},approved.token,{makeDefault:!!options.default});}catch(e){await client.request('/api/account/connection',{method:'DELETE'}).catch(()=>{});throw e;}
    // Reconnect only replaces this account's local profile. Old tokens remain visible/revocable
    // in browser settings; unrelated integrations and their schedules are untouched.
    if(saved.previous)await profiles.store.delete(saved.previous.credentialKey);
    output({connected:true,...identity,profile:saved.profile.id,expiresAt:approved.expiresAt});return;
  }throw new CalendarError('PAIRING_EXPIRED','Connection approval expired. Run connect again.');
}
async function clientFor(profiles,options){
  if(options.environment){if(!options.account)throw new CalendarError('ACCOUNT_REQUIRED','Headless mode requires --account with the expected server account ID.');const token=process.env.TOR_EVENT_CALENDAR_API_TOKEN;if(!token)throw new CalendarError('SECRET_INJECTION_REQUIRED','Inject TOR_EVENT_CALENDAR_API_TOKEN through the runtime secret manager.');const origin=canonicalOrigin(options.origin);const temp=new CalendarClient({origin,accountId:options.account},token);await temp.verify();return temp;}
  const p=await profiles.resolve(options.account);if(options.origin&&canonicalOrigin(options.origin)!==p.origin)throw new CalendarError('ORIGIN_MISMATCH','Selected connection belongs to another origin.');const token=await profiles.store.get(p.credentialKey);if(!token)throw new CalendarError('CREDENTIAL_MISSING','This profile has no OS credential. Reconnect this exact account.');const client=new CalendarClient(p,token);const me=await client.verify();if(me.email&&me.email!==p.email)await profiles.edit(c=>{const current=c.profiles.find(v=>v.id===p.id&&v.credentialKey===p.credentialKey);if(current)current.email=me.email;});return client;
}
export class ReceiptJournal {
  constructor(directory,profile){this.directory=path.join(directory,'receipts',createHash('sha256').update(`${profile.origin}:${profile.accountId}`).digest('hex'));}
  file(id){if(!/^[0-9a-f-]{36}$/i.test(id))throw new CalendarError('EXACT_ID_REQUIRED','Choose exact event ID.');return path.join(this.directory,`${id}.json`);}
  async get(id){try{return JSON.parse(await readFile(this.file(id),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw new CalendarError('JOURNAL_INVALID','Pending receipt needs manual inspection. Do not repost.');}}
  async set(id,body){await mkdir(this.directory,{recursive:true,mode:0o700});const file=this.file(id),temp=`${file}.${randomUUID()}.tmp`;await writeFile(temp,JSON.stringify(body),{mode:0o600,flag:'wx'});const {rename}=await import('node:fs/promises');await rename(temp,file);}
  async remove(id){await rm(this.file(id),{force:true});}
}
export async function installSkill(client,{uninstall=false,directory}={}){
  const homes={codex:'.agents',claude:'.claude',hermes:'.hermes',gemini:'.gemini',cursor:'.cursor',copilot:'.copilot'};
  if(!homes[client])throw new CalendarError('CLIENT_REQUIRED','Choose codex, claude, hermes, gemini, cursor or copilot.');
  const dataRoot=directory??(client==='hermes'?(process.env.HERMES_HOME||(process.platform==='win32'?path.join(process.env.LOCALAPPDATA||homedir(),'hermes'):path.join(homedir(),'.hermes'))):path.join(homedir(),homes[client]));
  const target=path.join(dataRoot,'skills','tor-event-calendar'),marker=path.join(target,'.tor-calendar-install.json');let existing;
  try{existing=await lstat(target);}catch(e){if(e.code!=='ENOENT')throw e;}
  if(existing){if(existing.isSymbolicLink())throw new CalendarError('EXISTING_JUNCTION','Existing skill is a link/junction. Preserve it and upgrade its owner-managed source separately.');try{const receipt=JSON.parse(await readFile(marker,'utf8'));if(receipt.owner!=='tor-event-calendar-ai')throw 0;}catch{throw new CalendarError('UNOWNED_SKILL','Existing skill is not managed by this installer. Preserve it before choosing another installation.');}}
  if(uninstall){if(existing)await rm(target,{recursive:true});return {uninstalled:!!existing,target,profilesPreserved:true};}
  const source=fileURLToPath(new URL('../skills/tor-event-calendar/',import.meta.url));
  await mkdir(target,{recursive:true});await cp(source,target,{recursive:true});
  if(['claude','cursor','copilot'].includes(client)){const skill=await readFile(path.join(target,'SKILL.md'),'utf8');await writeFile(path.join(target,'SKILL.md'),skill.replace('description:','disable-model-invocation: true\ndescription:'));}
  await writeFile(marker,JSON.stringify({owner:'tor-event-calendar-ai',version:VERSION,client}));return {installed:true,target,version:VERSION,profilesPreserved:true,restartClient:true};
}
export async function main(args=process.argv.slice(2)){
  const {positional:[command,...rest],options}=argumentsOf(args),profiles=new Profiles();
  if(options.help){output({usage:'tor-calendar help'});return;}
  const allowed=['account','origin','scope','name','no-browser','default','environment','all','posts','local-only','zone','date'];for(const key of Object.keys(options))if(!allowed.includes(key))throw new CalendarError('UNKNOWN_OPTION',`Unknown option --${key}.`);
  if(!command||['help','--help'].includes(command)){output({version:VERSION,commands:['connect [--scope read|manage]','accounts list|default EMAIL_OR_ID','whoami','doctor','disconnect','preferences get|set JSON','capabilities','platform PLATFORM','plan JSON','create JSON','get ID','list FROM TO','today [--date today|tomorrow|YYYY-MM-DD] [--zone IANA] [--posts]','publish-today --all','task ID','result ID JSON','update ID JSON','move ID ISO --zone IANA','upload ID FIELD PATH','delete ID','install-skill CLIENT','uninstall-skill CLIENT'],account:'--account VERIFIED_EMAIL_OR_ID (required when multiple connections have no explicit default)',headless:'--environment --account IMMUTABLE_ACCOUNT_ID; secret injected externally'});return;}
  if(command==='version'){output({version:VERSION});return;}
  if(command==='install-skill'||command==='uninstall-skill'){output(await installSkill(rest[0],{uninstall:command==='uninstall-skill'}));return;}
  if(command==='accounts'){if(rest[0]==='default'){output({default:await profiles.setDefault(rest[1])});}else output({accounts:await profiles.list()});return;}
  if(command==='connect'){await connect(profiles,options);return;}
  if(command==='capabilities'){output(await publicRequest(canonicalOrigin(options.origin),'/api/capabilities'));return;}
  if(command==='doctor'){const keychain=await new KeyringStore().probe();output({version:VERSION,node:process.version,keychain,capabilities:await publicRequest(canonicalOrigin(options.origin),'/api/capabilities'),profiles:(await profiles.list()).map(({id,email,origin,isDefault})=>({id,email,origin,isDefault}))});return;}
  const client=await clientFor(profiles,options),identity=client.identity;
  if(['whoami','status'].includes(command)){output(identity);return;}
  if(command==='disconnect'){if(!options['local-only'])await client.request('/api/account/connection',{method:'DELETE'});if(!options.environment)await profiles.forget(client.profile);output({disconnected:true,revoked:!options['local-only'],...identity});return;}
  if(command==='preferences'){output({identity,result:await client.request('/api/account/preferences',rest[0]==='set'?{method:'PATCH',body:await input(rest[1])}:{})});return;}
  if(command==='platform'){output({identity,schema:await client.platform(rest[0])});return;}
  if(command==='plan'||command==='create'){const prefs=await client.request('/api/account/preferences'),plan=planCreate(await input(rest[0]),prefs);if(!plan.ready||command==='plan'){output({identity,...plan});if(!plan.ready)process.exitCode=2;return;}plan.payload.id??=randomUUID();output({identity,event:await client.create(plan.payload)});return;}
  if(command==='get'){output({identity,event:await client.get(rest[0])});return;}
  if(command==='list'){output({identity,events:await client.list(rest[0],rest[1],{posts:!!options.posts})});return;}
  if(command==='today'||command==='publish-today'){const prefs=await client.request('/api/account/preferences'),zone=options.zone??prefs.timeZone,date=relativeDate(options.date??'today',zone),range=dayRange(date,zone),events=await client.list(range.from,range.to,{posts:command==='publish-today'||!!options.posts});
    if(command==='publish-today'&&!options.all)throw new CalendarError('SCOPE_REQUIRED','Use --all only when the user explicitly requested all matching posts. Otherwise select event IDs in the host workflow.');
    output(command==='today'?{identity,range,events}:{range,...await publishBatch(client,events,{authorize:true,journal:new ReceiptJournal(profiles.directory,client.profile)})});return;}
  if(command==='update'){output({identity,event:await client.update(rest[0],await input(rest[1]))});return;}
  if(command==='move'){if(!options.zone)throw new CalendarError('TIMEZONE_REQUIRED','Specify the target IANA timezone.');output({identity,event:await client.update(rest[0],{scheduledAt:rest[1],timeZone:options.zone})});return;}
  if(command==='upload'){output({identity,event:await client.upload(...rest)});return;}
  if(command==='delete'){output({identity,...await client.delete(rest[0])});return;}
  if(command==='task'){output({identity,task:await client.task(rest[0])});return;}
  if(command==='result'){output({identity,result:await client.result(rest[0],await input(rest[1]))});return;}
  throw new CalendarError('UNKNOWN_COMMAND','Run tor-calendar help.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{output({error:e.code??'CLIENT_ERROR',message:e instanceof CalendarError?e.message:'Operation failed; no credentials were printed.',...(e.details?{details:e.details}:{})});process.exitCode=1;});
