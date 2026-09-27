export class CalendarError extends Error { code:string; details?:unknown; constructor(code:string,message:string,details?:unknown); }
export function requireZone(zone:unknown):string;
export function validateInstant(value:unknown):string;
export function localInstant(date:string,time:string,zone:string,offset?:string):string;
export function dayRange(date:string,zone:string):{date:string;timeZone:string;from:string;to:string;hours:number};
export function relativeDate(value:string,zone:string,now?:Date):string;
export function dateInZone(now:Date,zone:string):string;
export function addDays(date:string,n:number):string;
