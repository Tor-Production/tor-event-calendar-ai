import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PLATFORM_IDS,LINKEDIN_REACTION_OPTIONS,LINKEDIN_REACTIONS,LINKEDIN_REACTION_LABELS,platformSchema,settingsToForm,formToSettings,settingsIssues} from '../src/platforms.mjs';
import {planCreate} from '../src/plan.mjs';
import {OPENAPI} from '../src/api-contract.mjs';
import {CalendarClient} from '../src/client.mjs';
import {publishBatch} from '../src/publish.mjs';
const expected=['linkedin','x','reddit','instagram','facebook','youtube','tiktok','snapchat'];
assert.deepEqual(PLATFORM_IDS,expected);
assert.deepEqual(OPENAPI.paths['/api/publishing/platforms/{platform}'].get.parameters[0].schema.enum,expected);
assert.equal(platformSchema('__proto__'),null);assert.deepEqual(settingsIssues({platform:'constructor'}),['platform']);
const reactions=['none','like','celebrate','support','love','insightful','funny'];
const labels=['No reaction','Like','Celebrate','Support','Love','Insightful','Funny'];
assert.deepEqual(LINKEDIN_REACTION_OPTIONS,reactions.map((value,index)=>({value,label:labels[index]})));
assert.deepEqual(LINKEDIN_REACTIONS,reactions);
assert.deepEqual(LINKEDIN_REACTION_LABELS,Object.fromEntries(reactions.map((value,index)=>[value,labels[index]])));
assert.ok(Object.isFrozen(LINKEDIN_REACTION_OPTIONS)&&LINKEDIN_REACTION_OPTIONS.every(Object.isFrozen));
const linkedin=platformSchema('linkedin');
assert.deepEqual(linkedin.formFields.find(field=>field.key==='reaction').options,reactions);
assert.deepEqual(linkedin.fields.reactionValues,reactions);
assert.deepEqual(linkedin.fields.supportedReactionValues,reactions);
assert.deepEqual(linkedin.adapter.actions,['publish',...reactions.slice(1).map(value=>`reaction_${value}`)]);
assert.equal(linkedin.adapter.runtime,'unknown');assert.equal(linkedin.adapter.socialAuthorization,'unknown');
assert.equal(linkedin.adapters[0].runtimeAvailability,'unknown');
assert.deepEqual(OPENAPI.components.schemas.LinkedInSettings.properties.requestedFollowUps.properties.reaction.enum,reactions);
const settingsFor=reaction=>({platform:'linkedin',actor:{kind:'personal',id:'synthetic-person',url:null},destination:{kind:'public_feed',id:null,url:null},audience:'public',requestedFollowUps:{reaction,firstComment:null,featured:false}});
const defaults={platformDefaults:{linkedin:settingsFor('insightful')}};
for(const reaction of reactions){
  const settings=settingsFor(reaction);
  assert.deepEqual(settingsIssues(settings),[],`${reaction} settings accepted`);
  assert.deepEqual(formToSettings('linkedin',settingsToForm(settings)),settings,`${reaction} form roundtrip`);
  const planned=planCreate({title:'TEST ONLY reaction handoff',scheduledAt:'2026-10-22T12:00:00Z',timeZone:'UTC',customFields:{post_text:'Synthetic post.'},publishingSettings:settings},defaults);
  assert.equal(planned.ready,true);assert.deepEqual(planned.payload.publishingSettings,settings,'explicit selection overrides series defaults');
  const partial=planCreate({title:'TEST ONLY partial reaction draft',scheduledAt:'2026-10-22T12:00:00Z',timeZone:'UTC',draft:true,publishingSettings:{platform:'linkedin',requestedFollowUps:{reaction}}});
  assert.equal(partial.payload.customFields.publication_draft_settings.requestedFollowUps.reaction,reaction);
  const resumed=planCreate({...partial.payload,customFields:{...partial.payload.customFields,post_text:'Synthetic post.'},publishingSettings:{actor:settings.actor,destination:settings.destination,audience:'public',requestedFollowUps:{firstComment:null,featured:false}}},defaults);
  assert.equal(resumed.ready,true);assert.equal(resumed.payload.publishingSettings.requestedFollowUps.reaction,reaction,'resume never substitutes a default reaction');

  // An isolated HTTP fixture tests the shared client's transport and injected
  // publisher handoff. It does not establish a live social connection or send.
  const accountId=randomUUID(),event={id:randomUUID(),revision:3,...planned.payload,publicationStatus:'not_published',executionMethod:'manual'};
  const task={eventId:event.id,eventRevision:event.revision,platform:{id:'linkedin',settings},requestedFollowUps:{reaction:{value:reaction,status:reaction==='none'?'not_requested':'pending'},firstComment:{text:null,status:'not_requested'},featured:{requested:false,status:'not_requested'}},adapter:{runtimeAvailability:'unknown',socialAuthorization:'unknown'}};
  const calls=[],receipts=[],origin='https://calendar.example.test';
  const client=new CalendarClient({accountId,origin},'synthetic-secret',{fetcher:async(url,options)=>{
    assert.equal(new URL(url).origin,origin);assert.equal(options.redirect,'error');
    assert.equal(options.headers['X-Calendar-Account'],accountId);assert.equal(options.headers.Authorization,'Bearer synthetic-secret');
    const route=new URL(url).pathname;calls.push([options.method,route]);
    if(route==='/api/me')return Response.json({accountId,scope:'manage'});
    if(route===`/api/calendar-entries/${event.id}/publishing-task`)return Response.json(task);
    if(route===`/api/calendar-entries/${event.id}`)return Response.json(event);
    if(route===`/api/calendar-entries/${event.id}/publication-claim`)return Response.json({acquired:true,claimId:'synthetic-claim',dedupeKey:'synthetic-dedupe'});
    if(route===`/api/calendar-entries/${event.id}/publication-result`){receipts.push(JSON.parse(options.body));return Response.json({publicationStatus:'published'});}
    assert.fail(`Unexpected fixture route ${route}`);
  }});
  const receivedTask=await client.task(event.id);
  assert.deepEqual(receivedTask,task,'publishing task preserves the selected reaction');
  assert.equal(receivedTask.requestedFollowUps.reaction.value,reaction,'the publisher takes the string value, not the reaction task object');
  assert.equal(receivedTask.platform.settings.requestedFollowUps.reaction,reaction,'canonical and compatibility task values agree');
  const entries=new Map(),journal={get:async id=>entries.get(id),set:async(id,value)=>entries.set(id,structuredClone(value)),remove:async id=>entries.delete(id)};
  let submits=0;
  const adapter={
    async authorize({identity,event:actual}){assert.equal(identity.accountId,accountId);assert.deepEqual(actual.publishingSettings,settings);return {authorized:true,calendarAccountId:accountId,actorId:settings.actor.id,supports:actualSettings=>actualSettings.requestedFollowUps.reaction===reaction};},
    async submit({event:actual}){submits++;assert.equal(actual.publishingSettings.requestedFollowUps.reaction,reaction);return {confirmed:true,externalId:'synthetic-post',externalUrl:'https://www.linkedin.com/feed/update/urn:li:activity:7000000000000000001/',followUps:{reaction:{outcome:reaction==='none'?'not_requested':'completed'}}};}
  };
  const result=await publishBatch(client,[{id:event.id,revision:event.revision}],{authorize:true,adapter,journal});
  assert.equal(result.outcomes[0].outcome,'published');assert.equal(submits,1);
  assert.equal(receipts[0].followUps.reaction.outcome,reaction==='none'?'not_requested':'completed');
  assert.equal(entries.size,0);assert.equal(calls.filter(([method])=>method==='POST').length,2,'one claim and one receipt; no social HTTP request');
}
for(const reaction of ['curious','Support','',null,undefined,1]){
  const invalid=settingsFor(reaction);
  assert.ok(settingsIssues(invalid).includes('reaction'),'unknown or missing selections cannot become a default');
  const planned=planCreate({title:'TEST ONLY invalid reaction',scheduledAt:'2026-10-22T12:00:00Z',timeZone:'UTC',customFields:{post_text:'Synthetic post.'},publishingSettings:invalid},defaults);
  assert.equal(planned.ready,false);
}
const choices={instagram:{postType:'carousel'},facebook:{actorKind:'page',postType:'post'},youtube:{postType:'short',visibility:'public'},tiktok:{postType:'photo'},snapchat:{postType:'spotlight'}};
for(const [platform,fields]of Object.entries(choices)){
  const schema=platformSchema(platform),settings={platform,account:'TEST ONLY human account',...fields};
  assert.equal(schema.adapter.runtime,'unsupported');assert.equal(schema.adapter.id,null);assert.deepEqual(schema.adapter.actions,[]);
  assert.deepEqual(settingsIssues(settings),[]);assert.deepEqual(formToSettings(platform,settingsToForm(settings)),settings);
  assert.ok(settingsIssues({...settings,postType:'private_message'}).includes('postType'));
  const draft=planCreate({title:'TEST ONLY draft',scheduledAt:'2026-10-17T12:00:00Z',timeZone:'UTC',draft:true,publishingSettings:{platform,account:settings.account}});
  assert.equal(draft.ready,true);assert.equal(draft.payload.publishingSettings,null);assert.equal(draft.payload.customFields.publication_draft_settings.account,settings.account);
  const resumed=planCreate({...draft.payload,customFields:{...draft.payload.customFields,post_text:'TEST ONLY post'},publishingSettings:fields});
  assert.equal(resumed.ready,true);assert.deepEqual(resumed.payload.publishingSettings,settings);assert.equal(resumed.payload.customFields.publication_draft_settings,undefined);
}
console.log('PASS eight-platform discovery; seven exact LinkedIn reaction choices, draft/default preservation, unknown rejection and synthetic task/publisher handoff; runtime unverified; production/social requests: 0');
