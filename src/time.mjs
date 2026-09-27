export class CalendarError extends Error { constructor(code,message,details){super(message);this.code=code;this.details=details;} }
export function requireZone(zone){try{if(typeof zone!=='string'||!zone.trim())throw 0;new Intl.DateTimeFormat('en',{timeZone:zone}).format();return zone;}catch{throw new CalendarError('TIMEZONE_REQUIRED','Choose an IANA timezone, for example Europe/Kyiv.');}}
export function parts(instant,zone){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:requireZone(zone),year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
export function dateInZone(now,zone){const p=parts(now,zone);return `${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;}
export function addDays(date,n){const d=new Date(`${date}T00:00:00Z`);if(!Number.isFinite(+d))throw new CalendarError('DATE_REQUIRED','Choose an exact date.');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function relativeDate(value,zone,now=new Date()){
  const today=dateInZone(now,zone);if(value==='today')return today;if(value==='tomorrow')return addDays(today,1);
  const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];const m=/^next (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/i.exec(value??'');
  if(m){const current=new Date(`${today}T00:00:00Z`).getUTCDay(),delta=(weekdays.indexOf(m[1].toLowerCase())-current+7)%7;return addDays(today,delta||7);}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value??''))throw new CalendarError('DATE_REQUIRED','Choose an exact date.');return value;
}
export function localInstant(date,time,zone,offset){
  requireZone(zone);if(!/^\d{4}-\d{2}-\d{2}$/.test(date??''))throw new CalendarError('DATE_REQUIRED','Choose an exact date.');
  if(!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time??''))throw new CalendarError('TIME_REQUIRED','Choose an exact 24-hour time; date-only/all-day events are not supported.');
  const local=new Date(`${date}T${time.length===5?time+':00':time}Z`),want=[...date.split('-'),...time.split(':'),...(time.length===5?['00']:[])].map(Number);
  if(!Number.isFinite(+local)||local.toISOString().slice(0,10)!==date)throw new CalendarError('INVALID_DATE','Date does not exist.');
  const offsets=new Set();for(let delta=-36;delta<=36;delta+=3){const sample=new Date(+local+delta*3600000),p=parts(sample,zone);offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-(+sample));}
  const matches=[...offsets].map(o=>new Date(+local-o)).filter(d=>{const p=parts(d,zone);return [p.year,p.month,p.day,p.hour,p.minute,p.second].every((v,i)=>v===want[i]);}).sort((a,b)=>a-b);
  if(!matches.length)throw new CalendarError('DST_GAP','This local time does not exist. Choose another time.');
  if(offset){if(!/^[+-]\d{2}:\d{2}$/.test(offset))throw new CalendarError('INVALID_OFFSET','Use a UTC offset such as +03:00.');const d=new Date(`${date}T${time}${offset}`);if(matches.some(x=>+x===+d))return d.toISOString();throw new CalendarError('OFFSET_MISMATCH','UTC offset does not match this timezone/date.');}
  if(matches.length>1)throw new CalendarError('DST_OVERLAP','This local time occurs twice. Choose the UTC offset.',{candidates:matches.map(d=>d.toISOString())});return matches[0].toISOString();
}
function dayStart(date,zone,exact=true){
  requireZone(zone);const nominal=new Date(`${date}T00:00:00Z`);if(!Number.isFinite(+nominal)||nominal.toISOString().slice(0,10)!==date)throw new CalendarError('INVALID_DATE','Date does not exist.');
  let lo=+nominal-36*3600000,hi=+nominal+36*3600000;
  // Earliest instant belonging to the date: handles missing/overlapping midnight
  // without asking for an arbitrary event time or assuming a 24-hour UTC day.
  while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(dateInZone(new Date(mid),zone)<date)lo=mid;else hi=mid;}
  if(exact&&dateInZone(new Date(hi),zone)!==date)throw new CalendarError('DATE_SKIPPED','This calendar date does not exist in the selected timezone.');return new Date(hi).toISOString();
}
export function dayRange(date,zone){const from=dayStart(date,zone),to=dayStart(addDays(date,1),zone,false);return {date,timeZone:zone,from,to,hours:(Date.parse(to)-Date.parse(from))/3600000};}
export function validateInstant(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/i.test(value)||!Number.isFinite(Date.parse(value)))throw new CalendarError('TIME_REQUIRED','Use an ISO datetime with an explicit offset.');
  const date=value.slice(0,10),d=new Date(`${date}T00:00:00Z`);if(d.toISOString().slice(0,10)!==date)throw new CalendarError('INVALID_DATE','Date does not exist.');return new Date(value).toISOString();
}
