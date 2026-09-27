import {homedir} from 'node:os';
import path from 'node:path';
import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {CalendarError} from './time.mjs';
export const DEFAULT_ORIGIN='https://tor-event-calendar.chute-risk9361.workers.dev';
export function canonicalOrigin(input=DEFAULT_ORIGIN){const u=new URL(input);if(u.username||u.password||u.pathname!=='/'||u.search||u.hash||!(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new CalendarError('INVALID_ORIGIN','Choose the canonical HTTPS calendar origin.');return u.origin;}
export class KeyringStore {
  async entry(key){try{const {AsyncEntry}=await import('@napi-rs/keyring');return new AsyncEntry('Tor Event Calendar',key,{linux:{store:'secret-service'}});}catch{throw new CalendarError('KEYCHAIN_UNAVAILABLE','OS credential storage is unavailable. Unlock/install the OS keychain, or explicitly use the headless environment route.');}}
  async get(key){try{return await (await this.entry(key)).getPassword();}catch{throw new CalendarError('KEYCHAIN_UNAVAILABLE','Unable to read OS credential storage. No fallback was used.');}}
  async set(key,value){try{await (await this.entry(key)).setPassword(value);}catch{throw new CalendarError('KEYCHAIN_UNAVAILABLE','Unable to write OS credential storage. No fallback was used.');}}
  async delete(key){try{return await (await this.entry(key)).deleteCredential();}catch{throw new CalendarError('KEYCHAIN_UNAVAILABLE','Unable to remove OS credential. Revoke it in calendar settings.');}}
  async probe(){const key=`probe-${randomUUID()}`,value=randomUUID();try{await this.set(key,value);if(await this.get(key)!==value)throw new Error();}finally{await this.delete(key);}return {available:true};}
}
export class Profiles {
  constructor({directory,store=new KeyringStore()}={}){this.directory=directory||path.join(process.platform==='win32'?(process.env.LOCALAPPDATA||homedir()):path.join(homedir(),'.config'),'tor-event-calendar');this.file=path.join(this.directory,'profiles.json');this.store=store;}
  async read(){try{const c=JSON.parse(await readFile(this.file,'utf8'));if(c.version!==1||!Array.isArray(c.profiles))throw 0;return c;}catch(e){if(e.code==='ENOENT')return {version:1,default:null,profiles:[]};throw new CalendarError('CONFIG_INVALID','Connection metadata is unreadable. Inspect profiles.json; it contains no secrets.');}}
  async edit(fn){await mkdir(this.directory,{recursive:true,mode:0o700});const lock=path.join(this.directory,'profiles.lock');let locked=false;for(let i=0;i<100;i++){try{await mkdir(lock);locked=true;break;}catch(e){if(e.code!=='EEXIST')throw e;await new Promise(r=>setTimeout(r,100));}}if(!locked)throw new CalendarError('CONFIG_BUSY','Another connection update is active. Retry after it completes.');
    const temp=path.join(this.directory,`profiles-${randomUUID()}.tmp`);try{const config=await this.read(),result=await fn(config);await writeFile(temp,JSON.stringify(config,null,2),{mode:0o600,flag:'wx'});await rename(temp,this.file);return result;}finally{await rm(temp,{force:true});await rm(lock,{recursive:true});}}
  async list(){const c=await this.read();return c.profiles.map(p=>({...p,isDefault:p.id===c.default}));}
  async resolve(selector){const c=await this.read();let matches=selector?c.profiles.filter(p=>(p.id===selector||p.accountId===selector||p.email.toLowerCase()===selector.toLowerCase())):c.default?c.profiles.filter(p=>p.id===c.default):c.profiles;
    if(matches.length!==1)throw new CalendarError(matches.length?'ACCOUNT_REQUIRED':'NOT_CONNECTED',matches.length?'Choose a calendar account before reading private data.':'Connect a calendar account first.',{accounts:c.profiles.map(({id,email,origin})=>({id,email,origin}))});return Object.freeze({...matches[0]});}
  async save(identity,token,{makeDefault=false}={}){if(!identity.accountId||!identity.email)throw new CalendarError('IDENTITY_UNVERIFIED','The server did not verify the account/email.');const origin=canonicalOrigin(identity.origin),id=createHash('sha256').update(`${origin}:${identity.accountId}`).digest('hex').slice(0,24),key=`${origin}:${identity.accountId}:${identity.tokenId}`;
    await this.store.set(key,token);try{return await this.edit(c=>{const old=c.profiles.find(p=>p.id===id),profile={id,origin,accountId:identity.accountId,email:identity.email,tokenId:identity.tokenId,credentialKey:key,scope:identity.scope,expiresAt:identity.expiresAt,connectedAt:new Date().toISOString()};c.profiles=c.profiles.filter(p=>p.id!==id);c.profiles.push(profile);if(makeDefault)c.default=id;return {profile,previous:old};});}catch(e){await this.store.delete(key);throw e;}}
  async setDefault(selector){const p=await this.resolve(selector);return this.edit(c=>{c.default=p.id;return p;});}
  async forget(profile){await this.store.delete(profile.credentialKey);await this.edit(c=>{c.profiles=c.profiles.filter(p=>p.id!==profile.id);if(c.default===profile.id)c.default=null;});}
}
