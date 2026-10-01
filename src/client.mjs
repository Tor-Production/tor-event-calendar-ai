import {readFile,stat,open,link,rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {CalendarError,requireZone,validateInstant} from './time.mjs';
import {canonicalOrigin} from './profiles.mjs';
const uuid=id=>{if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id??''))throw new CalendarError('EXACT_ID_REQUIRED','Choose the exact event UUID.');return id;};
export async function publicRequest(origin,route,{fetcher=fetch,method='GET',body}={}){
  let response;try{response=await fetcher(`${canonicalOrigin(origin)}${route}`,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});}catch{throw new CalendarError('NETWORK_UNCERTAIN','The connection response was not confirmed. Do not retry a consumed pairing code.');}
  const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new CalendarError(/^[A-Z_]+$/.test(data.code??'')?data.code:`HTTP_${response.status}`,'Calendar request failed.'),{status:response.status});return data;
}
export class CalendarClient {
  constructor(profile,token,{fetcher=fetch}={}){this.profile=Object.freeze({...profile,origin:canonicalOrigin(profile.origin)});this.token=token;this.fetcher=fetcher;this.schemas=new Map();this.verified=false;}
  async request(route,{method='GET',body,raw=false}={}){if(!route.startsWith('/api/')||route.startsWith('//')||new URL(route,this.profile.origin).origin!==this.profile.origin)throw new CalendarError('INVALID_ROUTE','Only same-origin calendar API routes are allowed.');
    let response;for(let attempt=0;attempt<2;attempt++){try{response=await this.fetcher(`${this.profile.origin}${route}`,{method,headers:{Authorization:`Bearer ${this.token}`,'X-Calendar-Account':this.profile.accountId,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(30000)});break;}catch{if(method!=='GET'||attempt===1)throw new CalendarError('NETWORK_UNCERTAIN','Response unconfirmed. Inspect the same event/claim before retrying a write.');}}
    if(response.status===204)return null;if(raw&&response.ok)return response;
    const data=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new CalendarError(/^[A-Z_]+$/.test(data.code??'')?data.code:`HTTP_${response.status}`,response.status===401?'Connection revoked or expired. Reconnect this account.':response.status===409?'Revision, account, or publication conflict. Read current state; do not blindly retry.':'Calendar request failed.'),{status:response.status});return data;
  }
  async verify(){const me=await this.request('/api/me');if(me.accountId!==this.profile.accountId)throw new CalendarError('ACCOUNT_MISMATCH','Credential belongs to a different server account. Operation stopped.');this.verified=true;this.identity={accountId:me.accountId,email:me.email,origin:this.profile.origin,scope:me.scope};return this.identity;}
  async list(from,to,{posts=false}={}){validateInstant(from);validateInstant(to);let offset=0,events=[];do{const page=await this.request(`/api/calendar-entries?${new URLSearchParams({from,to,limit:'500',offset:String(offset)})}`);events.push(...page.events);if(!page.truncated)break;if(page.nextOffset===null||page.nextOffset<=offset||page.nextOffset>100000)throw new CalendarError('PAGINATION_LIMIT','Calendar range exceeds supported pagination. Narrow the range.');offset=page.nextOffset;}while(true);if(posts)events=events.filter(e=>e.customFields?.social_network||e.publicationStatus!=='not_published'||e.resultOutcome);return events.map(({id,title,scheduledAt,publicationStatus,executionMethod,basePostReadiness,revision,customFields})=>({id,title,scheduledAt,platform:customFields?.social_network??null,publicationStatus,executionMethod,basePostReadiness,revision}));}
  get(id){return this.request(`/api/calendar-entries/${uuid(id)}`);}
  async platform(id){if(!/^[a-z]+$/.test(id))throw new CalendarError('PLATFORM_REQUIRED','Choose a platform.');if(!this.schemas.has(id))this.schemas.set(id,await this.request(`/api/publishing/platforms/${id}`));return this.schemas.get(id);}
  async limits(){this.capabilities??=await publicRequest(this.profile.origin,'/api/capabilities',{fetcher:this.fetcher});return this.capabilities;}
  async create(input){const {files,...body}=input;if(!body.id)throw new CalendarError('CREATE_ID_REQUIRED','Supply a stable UUID; keep it after an uncertain response.');uuid(body.id);validateInstant(body.scheduledAt);requireZone(body.timeZone);this.fileFields(files,body.customFieldTypes);await this.precheckFiles(files);await this.request('/api/calendar-entries',{method:'POST',body});for(const [field,file]of Object.entries(files??{}))await this.upload(body.id,field,file);return this.get(body.id);}
  async update(id,input){uuid(id);const {files,...body}=input,before=await this.get(id);this.fileFields(files,body.customFieldTypes??before.customFieldTypes);await this.precheckFiles(files);body.eventRevision??=before.revision;await this.request(`/api/calendar-entries/${id}`,{method:'PATCH',body});for(const [field,file]of Object.entries(files??{}))await this.upload(id,field,file);return this.get(id);}
  fileFields(files,types){if(files===undefined)return;if(!files||typeof files!=='object'||Array.isArray(files))throw new CalendarError('INVALID_FILES','files must map explicit File fields to paths.');for(const [field,file]of Object.entries(files))if(types?.[field]!=='File'||typeof file!=='string')throw new CalendarError('INVALID_FILES','Declare the File field explicitly before upload.');}
  async precheckFiles(files){for(const file of Object.values(files??{}))await this.precheck(file);}
  async precheck(file){const limit=(await this.limits()).calendarLimits.fileBytes;const info=await stat(file);if(!info.isFile()||info.size>limit)throw new CalendarError('MEDIA_TOO_LARGE','Use smaller media or save an external reference URL.',{limitBytes:limit,sizeBytes:info.size});return info;}
  async upload(id,field,file){uuid(id);const event=await this.get(id);if(event.customFieldTypes?.[field]!=='File')throw new CalendarError('NOT_FILE_FIELD','Declare the target File field before upload.');const before=await this.precheck(file);const bytes=await readFile(file);if(bytes.length!==before.size||bytes.length>(await this.limits()).calendarLimits.fileBytes)throw new CalendarError('MEDIA_CHANGED','File changed during precheck; retry after it is stable.');const filename=path.basename(file),mime=({'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.pdf':'application/pdf'})[path.extname(file).toLowerCase()]||'application/octet-stream';const hash=createHash('sha256').update(id).update('\0').update(field).update('\0').update(filename).update('\0').update(mime).update('\0').update(bytes).digest();hash[6]=(hash[6]&15)|80;hash[8]=(hash[8]&63)|128;const h=hash.subarray(0,16).toString('hex'),uploadId=`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;const form=new FormData();form.append('file',new Blob([bytes],{type:mime}),filename);form.append('fieldName',field);form.append('uploadId',uploadId);form.append('eventRevision',String(event.revision));await this.request(`/api/calendar-entries/${id}/files`,{method:'POST',body:form});return this.get(id);}
  task(id){return this.request(`/api/calendar-entries/${uuid(id)}/publishing-task`);}
  async download(id,attachmentId,destination){
    uuid(id);uuid(attachmentId);
    if(typeof destination!=='string'||!destination.trim())throw new CalendarError('DESTINATION_REQUIRED','Supply an explicit local destination path.');
    await this.verify();
    const event=await this.get(id),file=event.attachments?.find(item=>item.id===attachmentId);
    if(!file||file.fieldName!==null&&event.customFieldTypes?.[file.fieldName]!=='File')throw new CalendarError('FILE_NOT_FOUND','Choose an attachment from this event and its explicit File field.');
    const limit=Math.min((await this.limits()).calendarLimits.fileBytes,25*1024*1024);
    if(!Number.isSafeInteger(limit)||!Number.isSafeInteger(file.size)||file.size<0||file.size>limit)throw new CalendarError('MEDIA_TOO_LARGE','File exceeds the supported download limit.');
    const response=await this.request(`/api/files/${attachmentId}`,{raw:true});
    const length=response.headers.get('Content-Length');
    if(length!==null&&Number(length)!==file.size){await response.body?.cancel();throw new CalendarError('FILE_CONTENT_MISMATCH','File size differs from the event metadata.');}
    const reader=response.body?.getReader(),chunks=[];let size=0;
    try{if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>file.size||size>limit)throw new CalendarError('FILE_CONTENT_MISMATCH','File exceeded the declared size.');chunks.push(value);}}
    catch(error){await reader?.cancel().catch(()=>{});if(error instanceof CalendarError)throw error;throw new CalendarError('DOWNLOAD_UNCONFIRMED','File transfer failed. No destination was saved.');}
    finally{reader?.releaseLock();}
    if(size!==file.size)throw new CalendarError('FILE_CONTENT_MISMATCH','File transfer ended before its declared size.');
    const latest=await this.get(id);
    if(latest.revision!==event.revision||!latest.attachments?.some(item=>item.id===attachmentId&&item.fieldName===file.fieldName))throw new CalendarError('STALE_REVISION','Event changed during the download. Read it again before saving.');
    const bytes=Buffer.concat(chunks,size),target=path.resolve(destination),temporary=path.join(path.dirname(target),`.nembli-download-${randomUUID()}.tmp`);
    let temporaryCreated=false;
    try{const handle=await open(temporary,'wx',0o600);temporaryCreated=true;try{await handle.writeFile(bytes);}finally{await handle.close();}await link(temporary,target);}
    catch(error){if(error.code==='EEXIST')throw new CalendarError('DESTINATION_EXISTS','Destination already exists. Choose another path; existing files are never overwritten.');throw error;}
    finally{if(temporaryCreated)await rm(temporary);}
    return {accountId:this.profile.accountId,eventId:id,eventRevision:event.revision,attachmentId,fieldName:file.fieldName,filename:file.filename,contentType:file.contentType,size,path:target,sha256:createHash('sha256').update(bytes).digest('hex'),saved:true};
  }
  result(id,body){return this.request(`/api/calendar-entries/${uuid(id)}/publication-result`,{method:'POST',body});}
  claim(id,revision,intentionalNow){return this.request(`/api/calendar-entries/${uuid(id)}/publication-claim`,{method:'POST',body:{eventRevision:revision,runId:randomUUID(),intentionalNow}});}
  async delete(id){await this.request(`/api/calendar-entries/${uuid(id)}`,{method:'DELETE'});try{await this.get(id);}catch(e){if(e.status===404)return {id,deleted:true};throw e;}throw new CalendarError('DELETE_UNCONFIRMED','Event remains readable.');}
}
