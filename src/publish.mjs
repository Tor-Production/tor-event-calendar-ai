import {randomUUID} from 'node:crypto';
import {settingsIssues} from './platforms.mjs';
// Adapter injection is used by isolated tests and an explicitly authorized host bridge.
// The shipped CLI has NO social credentials/adapters: it reports actionable per-item blocks.
export async function publishBatch(client,snapshots,{authorize=false,adapter=null,journal,intentionalNow=true}={}){
  const identity=await client.verify(),outcomes=[];
  for(const snapshot of snapshots){const result={id:snapshot.id,accountId:identity.accountId,outcome:'blocked'};outcomes.push(result);
    if(!authorize){result.outcome='found';continue;}
    const pending=await journal?.get(snapshot.id);if(pending){
      if(pending.phase!=='terminal'){result.outcome='unknown';result.reason='ACTIVE_OR_UNRESOLVED_SUBMISSION';continue;}
      try{await client.result(snapshot.id,pending.receipt);await journal.remove(snapshot.id);result.outcome=pending.receipt.outcome;result.reconciled=true;}catch{result.outcome='unknown';result.reason='PENDING_RECEIPT_RECONCILIATION';}continue;
    }
    let event;try{event=await client.get(snapshot.id);}catch(e){result.reason=e.code;continue;}
    if(['published','cancelled'].includes(event.publicationStatus)){result.outcome='skipped';result.reason=event.publicationStatus;continue;}
    if(event.publicationStatus==='unknown'){result.outcome='unknown';result.reason='RECONCILIATION_REQUIRED';continue;}
    if(event.revision!==snapshot.revision){result.reason='STALE_REVISION';continue;}
    if(event.executionMethod==='platform_scheduler'){result.reason='NATIVE_QUEUE_RECONCILIATION_REQUIRED';continue;}
    if(!event.customFields?.social_network&&!event.publishingSettings){result.reason='NOT_A_POST';continue;}
    if(!event.customFields?.post_text?.trim()||settingsIssues(event.publishingSettings).length){result.outcome='needs_input';result.reason='CONTENT_OR_PLATFORM_FIELDS_REQUIRED';continue;}
    if(event.customFields.media_url||event.customFields.video_url){result.reason='EXTERNAL_MEDIA_UNRESOLVED';continue;}
    const missingFiles=Object.entries(event.customFieldTypes??{}).filter(([name,type])=>type==='File'&&!event.attachments?.some(a=>a.fieldName===name));if(missingFiles.length){result.outcome='needs_input';result.reason='MEDIA_REQUIRED';continue;}
    if(event.attachments?.some(a=>a.contentType?.startsWith('image/'))&&!event.customFields?.alt_text?.trim()){result.outcome='needs_input';result.reason='ALT_TEXT_REQUIRED';continue;}
    if(!adapter){result.reason=event.publishingSettings.platform==='linkedin'?'CONNECT_VERIFIED_LINKEDIN_PUBLISHER_FOR_THIS_ACCOUNT':'PLATFORM_PUBLISHER_UNSUPPORTED';continue;}
    let capability;try{capability=await adapter.authorize({identity,event});}catch{result.reason='SOCIAL_AUTHORIZATION_UNCONFIRMED';continue;}
    if(!capability?.authorized||capability.calendarAccountId!==identity.accountId||capability.actorId!==event.publishingSettings.actor?.id||!capability.supports(event.publishingSettings)){result.reason='SOCIAL_ACTOR_OR_TARGET_UNAUTHORIZED';continue;}
    if(!journal){result.reason='DURABLE_RECEIPT_JOURNAL_REQUIRED';continue;}
    let claim;try{claim=await client.claim(event.id,event.revision,intentionalNow);}catch(e){result.reason=e.code;continue;}if(!claim.acquired){result.reason='RECONCILIATION_REQUIRED';continue;}
    // Persist unknown BEFORE submission: a crash never permits another base post.
    const method=event.executionMethod==='automatic_runner'?'automatic_runner':'manual';
    const body={eventRevision:event.revision,idempotencyKey:randomUUID(),outcome:'unknown',executionMethod:method,readiness:method==='manual'?'not_applicable':'unknown',occurredAt:new Date().toISOString(),externalId:null,externalUrl:null,evidence:{kind:'authorized_publisher',reference:claim.claimId,details:{intentionalNow,scheduledAt:event.scheduledAt,dedupeKey:claim.dedupeKey}},followUps:{}};
    await journal.set(event.id,{phase:'submitting',receipt:body});
    let receipt;try{receipt=await adapter.submit({identity,event,claim});}catch{result.outcome='unknown';result.reason='REMOTE_RESPONSE_AMBIGUOUS';}
    if(receipt?.confirmed&&receipt.externalId&&receipt.externalUrl){body.outcome='published';body.readiness=method==='manual'?'not_applicable':'ready';body.externalId=receipt.externalId;body.externalUrl=receipt.externalUrl;body.occurredAt=receipt.occurredAt||new Date().toISOString();body.followUps=receipt.followUps??{};result.outcome='published';}
    else if(receipt?.definitelyNotSubmitted){body.outcome='failed';result.outcome='failed';result.reason='SUBMISSION_REJECTED';}
    else{result.outcome='unknown';result.reason??='REMOTE_RESPONSE_AMBIGUOUS';}
    await journal.set(event.id,{phase:'terminal',receipt:body});
    try{await client.result(event.id,body);await journal.remove(event.id);}catch{result.reason='PENDING_RECEIPT_RECONCILIATION';result.outcome='unknown';result.externalOutcome=body.outcome;}
  }
  return {identity,outcomes};
}
