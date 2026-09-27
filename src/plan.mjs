import {settingsIssues,mergeSettings} from './platforms.mjs';
import {localInstant,relativeDate,requireZone,validateInstant} from './time.mjs';
export function planCreate(input,preferences={}) {
  const payload=structuredClone(input),questions=[];
  const savedDraft=payload.customFields?.publication_draft_settings;
  if(savedDraft&&typeof savedDraft==='object'&&!Array.isArray(savedDraft))payload.publishingSettings=mergeSettings(savedDraft,payload.publishingSettings);
  if(!payload.title?.trim())questions.push({field:'title',question:'What is the event title?'});
  payload.timeZone??=preferences.timeZone;
  try{requireZone(payload.timeZone);}catch{questions.push({field:'timeZone',question:'Which IANA timezone?'});}
  if(payload.scheduledAt){try{payload.scheduledAt=validateInstant(payload.scheduledAt);}catch(e){questions.push({field:'scheduledAt',question:e.message});}}
  else {
    if(!payload.localDate)questions.push({field:'localDate',question:'Which exact date?'});
    if(!payload.localTime)questions.push({field:'localTime',question:'What exact 24-hour time?'});
    if(payload.timeZone&&payload.localDate&&payload.localTime){try{payload.scheduledAt=localInstant(relativeDate(payload.localDate,payload.timeZone),payload.localTime,payload.timeZone,payload.utcOffset);}catch(e){questions.push({field:e.code,question:e.message,details:e.details});}}
  }
  const platform=payload.publishingSettings?.platform||String(payload.customFields?.social_network??'').toLowerCase();
  if(platform){
    const defaults=preferences.platformDefaults?.[platform];
    if(defaults){const supplied=payload.publishingSettings??{};payload.publishingSettings={...structuredClone(defaults),...supplied,...(platform==='linkedin'?{actor:{...defaults.actor,...supplied.actor},destination:{...defaults.destination,...supplied.destination},requestedFollowUps:{...defaults.requestedFollowUps,...supplied.requestedFollowUps}}:{})};}
    if(!payload.customFields?.post_text?.trim()&&!payload.draft)questions.push({field:'content',question:'Create an empty draft now, or supply the missing text/media now?',choices:['Create empty draft','Supply content']});
    if(!payload.draft)for(const field of settingsIssues(payload.publishingSettings))questions.push({field,question:`Choose ${platform} ${field}.`});
    if(payload.draft&&settingsIssues(payload.publishingSettings).length){if(payload.publishingSettings){payload.customFields??={};payload.customFields.publication_draft_settings=structuredClone(payload.publishingSettings);payload.customFieldTypes??={};payload.customFieldTypes.publication_draft_settings='JSON';}payload.publishingSettings=null;payload.customFields??={};payload.customFields.social_network??=platform;}
    else if(payload.publishingSettings&&settingsIssues(payload.publishingSettings).length===0){delete payload.customFields?.publication_draft_settings;delete payload.customFieldTypes?.publication_draft_settings;}
  }
  for(const k of ['localDate','localTime','utcOffset','draft'])delete payload[k];
  return {ready:questions.length===0,questions,...(questions.length?{draftInput:structuredClone(input)}:{}),payload};
}
