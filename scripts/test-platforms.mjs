import assert from 'node:assert/strict';
import {PLATFORM_IDS,platformSchema,settingsToForm,formToSettings,settingsIssues} from '../src/platforms.mjs';
import {planCreate} from '../src/plan.mjs';
import {OPENAPI} from '../src/api-contract.mjs';
const expected=['linkedin','x','reddit','instagram','facebook','youtube','tiktok','snapchat'];
assert.deepEqual(PLATFORM_IDS,expected);
assert.deepEqual(OPENAPI.paths['/api/publishing/platforms/{platform}'].get.parameters[0].schema.enum,expected);
assert.equal(platformSchema('__proto__'),null);assert.deepEqual(settingsIssues({platform:'constructor'}),['platform']);
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
console.log('PASS eight-platform discovery; five planning-only adapters; settings round-trip, partial-draft resume and unsupported message rejection');
