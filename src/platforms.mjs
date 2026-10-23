// One registry for the browser, Worker, CLI and on-demand skill questions.
export const SCHEMA_VERSION = '2026-10-22.1';
export const LINKEDIN_REACTION_OPTIONS = Object.freeze([
  {value:'none',label:'No reaction'},
  {value:'like',label:'Like'},
  {value:'celebrate',label:'Celebrate'},
  {value:'support',label:'Support'},
  {value:'love',label:'Love'},
  {value:'insightful',label:'Insightful'},
  {value:'funny',label:'Funny'},
].map(Object.freeze));
export const LINKEDIN_REACTIONS = Object.freeze(LINKEDIN_REACTION_OPTIONS.map(option=>option.value));
export const LINKEDIN_REACTION_LABELS = Object.freeze(Object.fromEntries(LINKEDIN_REACTION_OPTIONS.map(option=>[option.value,option.label])));
export const CALENDAR_LIMITS = Object.freeze({jsonBytes:262144,fileBytes:26214400,listPage:500,maxOffset:100000,mime:'any; served as authenticated attachment',remainingQuota:null});
const field = (key,label,options=null,required=false) => ({key,label,options,required});
const planningPlatform=(id,label,docs,fields,types,limits)=>({id,label,docs,fields,
  platformCapabilities:{publicContentPlanning:true,publisher:'requires a separately authorized publisher; not installed'},
  adapter:{id:null,actions:[],runtime:'unsupported',socialAuthorization:'unknown'},media:{types,limits}});
export const PLATFORMS = Object.freeze({
  linkedin:{id:'linkedin',label:'LinkedIn',docs:'https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api',
    fields:[field('actorKind','Actor',['personal','organization'],true),field('actorId','Actor ID'),field('destinationKind','Destination',['public_feed','group'],true),field('destinationId','Destination ID'),field('audience','Audience',['public','connections','group'],true),field('reaction','Reaction',LINKEDIN_REACTIONS,true),field('firstComment','First comment (empty means none)'),field('featured','Add to Featured',['false','true'],true)],
    platformCapabilities:{personal:true,organization:true,publicFeed:true,groups:'browser-dependent',featured:'personal browser only'},
    adapter:{id:'linkedin-personal-public-v1',scope:{actorKind:'personal',destinationKind:'public_feed',audience:'public'},actions:['publish',...LINKEDIN_REACTIONS.filter(value=>value!=='none').map(value=>`reaction_${value}`)],runtime:'unknown',socialAuthorization:'unknown'},
    media:{types:['text','image','video','document'],limits:'Resolve current platform/post-type limits with the authorized publisher; calendar limits are separate.'}},
  x:{id:'x',label:'X',docs:'https://docs.x.com/x-api/posts/create-post',
    fields:[field('actorId','X user ID',null,true),field('postType','Post type',['post','thread','reply'],true),field('destinationKind','Destination',['timeline','community'],true),field('communityId','Community ID'),field('replyToId','Reply to post ID'),field('replySettings','Who can reply',['everyone','mentionedUsers','following','subscribers','verified'],true),field('firstReply','First reply (empty means none)')],
    platformCapabilities:{posts:true,threads:true,replies:true,communities:true},adapter:{id:null,actions:[],runtime:'unsupported',socialAuthorization:'unknown'},media:{types:['text','image','video','gif'],limits:'Account/tier dependent; unknown until verified.'}},
  reddit:{id:'reddit',label:'Reddit',docs:'https://www.reddit.com/dev/api/#POST_api_submit',
    fields:[field('actorId','Reddit username',null,true),field('subreddit','Subreddit',null,true),field('postType','Post type',['self','link','image','video'],true),field('postTitle','Reddit post title',null,true),field('flairId','Post flair template ID'),field('nsfw','NSFW',['false','true'],true),field('spoiler','Spoiler',['false','true'],true),field('firstComment','First comment (empty means none)')],
    platformCapabilities:{posts:true,flair:true,communityRules:'must be checked'},adapter:{id:null,actions:[],runtime:'unsupported',socialAuthorization:'unknown'},media:{types:['self','link','image','video'],limits:'Subreddit and API permissions dependent; unknown until verified.'}},
  instagram:planningPlatform('instagram','Instagram','https://developers.facebook.com/docs/instagram-platform/content-publishing/',
    [field('account','Instagram account (name or URL)'),field('postType','Content type',['image','carousel','reel','story'],true)],
    ['image','video','carousel'],'Planning only. API publishing requires an eligible professional account; post-type permissions and media limits must be verified by the publisher.'),
  facebook:planningPlatform('facebook','Facebook','https://developers.facebook.com/docs/pages-api/posts/',
    [field('account','Facebook profile or Page (name or URL)'),field('actorKind','Publish as',['profile','page'],true),field('postType','Content type',['post','reel','story'],true)],
    ['text','image','video','link'],'Planning only. Profile and Page workflows differ; Page API access does not authorize profile publishing. Verify destination, audience and media requirements with the publisher.'),
  youtube:planningPlatform('youtube','YouTube','https://developers.google.com/youtube/v3/docs/videos/insert',
    [field('account','YouTube channel (name or URL)'),field('postType','Content type',['video','short'],true),field('visibility','Visibility',['public','unlisted','private'],true)],
    ['video'],'Planning only. Shorts eligibility, audience/children settings, rights, upload limits and requested visibility must be verified by the publisher.'),
  tiktok:planningPlatform('tiktok','TikTok','https://developers.tiktok.com/doc/content-posting-api-get-started/',
    [field('account','TikTok account (name or URL)'),field('postType','Content type',['video','photo'],true)],
    ['video','image'],'Planning only. The publisher must obtain current creator capabilities, an explicit permitted audience and content disclosures. API approval and user authorization are separate.'),
  snapchat:planningPlatform('snapchat','Snapchat','https://developers.snap.com/marketing-api/Public-Profile-API/Introduction',
    [field('account','Snapchat Public Profile (name or URL)'),field('postType','Content type',['spotlight','public_story','saved_story'],true)],
    ['image','video'],'Public content planning only, not private messages. Verify profile eligibility, destination, media requirements and live publication status; submission alone may await moderation.')
});
export const PLATFORM_IDS = Object.freeze(Object.keys(PLATFORMS));
export function platformSchema(id) {
  const key=String(id).toLowerCase();if(!Object.hasOwn(PLATFORMS,key))return null;const p=PLATFORMS[key];
  return {contractVersion:2,schemaVersion:SCHEMA_VERSION,...p,calendarLimits:CALENDAR_LIMITS,
    // Compatibility consumers still receive their existing capability shape.
    ...(p.id==='linkedin'?{fields:{actorKinds:['personal','organization'],destinationKinds:['public_feed','group'],reactionValues:LINKEDIN_REACTIONS,supportedReactionValues:LINKEDIN_REACTIONS},formFields:p.fields,
      adapters:[{...p.adapter,mode:'supported',support:'supported',runtimeAvailability:'unknown',supportedActions:p.adapter.actions}],capabilities:{personalPublicPublish:'supported',organizationPublicFeed:'manual_required',groupDestination:'manual_required',nativeScheduling:'manual_required',reaction:'supported',firstComment:'manual_required',featured:'manual_required'}}:{formFields:p.fields})};
}
export function settingsToForm(settings) {
  if(!settings)return {};
  return settings.platform==='linkedin'?{actorKind:settings.actor?.kind,actorId:settings.actor?.id??'',destinationKind:settings.destination?.kind,destinationId:settings.destination?.id??'',audience:settings.audience??'',reaction:settings.requestedFollowUps?.reaction,firstComment:settings.requestedFollowUps?.firstComment??'',featured:settings.requestedFollowUps?.featured===undefined?'':String(settings.requestedFollowUps.featured)}:{...settings};
}
export function mergeSettings(base,supplied){
  if(base?.platform&&supplied?.platform&&base.platform!==supplied.platform)return structuredClone(supplied);
  const merged={...structuredClone(base??{}),...structuredClone(supplied??{})};
  if(merged.platform==='linkedin')for(const key of ['actor','destination','requestedFollowUps'])merged[key]={...base?.[key],...supplied?.[key]};
  return merged;
}
export function formToSettings(platform,form) {
  const boolean=v=>v===true||v==='true'?true:v===false||v==='false'?false:undefined;
  if(platform==='linkedin')return {platform,actor:{kind:form.actorKind,id:form.actorId||null,url:null},destination:{kind:form.destinationKind,id:form.destinationId||null,url:null},audience:form.audience,requestedFollowUps:{reaction:form.reaction,firstComment:form.firstComment||null,featured:boolean(form.featured)}};
  return {platform,...form,...(platform==='reddit'?{nsfw:boolean(form.nsfw),spoiler:boolean(form.spoiler)}:{})};
}
export function settingsIssues(settings,{legacy=false}={}) {
  if(!Object.hasOwn(PLATFORMS,settings?.platform))return ['platform'];const p=PLATFORMS[settings.platform];
  const form=settingsToForm(settings),missing=[];
  const raw=p.id==='linkedin'?{...form,featured:settings.requestedFollowUps?.featured,firstComment:settings.requestedFollowUps?.firstComment}:settings;
  for(const f of p.fields){const v=raw[f.key],boolean=['featured','nsfw','spoiler'].includes(f.key),nullable=['actorId','destinationId','flairId','firstComment','firstReply'].includes(f.key);if(v!==undefined&&!(v===null&&nullable)&&typeof v!==(boolean?'boolean':'string'))missing.push(f.key);}
  for(const key of ['firstComment','firstReply'])if(typeof raw[key]==='string'&&raw[key].length>5000)missing.push(key);
  for(const f of p.fields){const v=form[f.key];if(f.required&&(v===undefined||v===null||v==='')&&!(legacy&&settings.platform==='linkedin'&&f.key==='audience'))missing.push(f.key);else if(v!==undefined&&v!==null&&v!==''&&f.options&&!f.options.includes(String(v)))missing.push(f.key);}
  if(['instagram','facebook','youtube','tiktok','snapchat'].includes(p.id))for(const f of p.fields){const v=raw[f.key];if(typeof v==='string'&&(v.length>2000||/[\u0000-\u001f\u007f]/.test(v)||(f.required&&!v.trim())))missing.push(f.key);}
  if(p.id==='linkedin'){
    if(!legacy)for(const key of ['reaction','firstComment','featured'])if(!Object.hasOwn(settings.requestedFollowUps??{},key))missing.push(key);
    if(form.actorKind==='organization'&&!form.actorId)missing.push('actorId');
    if(form.destinationKind==='group'&&(!form.destinationId||form.audience!=='group'))missing.push('destinationId/audience');
    if(form.destinationKind==='public_feed'&&form.audience==='group')missing.push('audience');
    if(form.featured==='true'&&(form.actorKind!=='personal'||form.destinationKind!=='public_feed'))missing.push('featured unsupported for target');
  }
  if(p.id==='x'){if(!Object.hasOwn(settings,'firstReply'))missing.push('firstReply');if(form.destinationKind==='community'&&!form.communityId)missing.push('communityId');if(form.postType==='reply'&&!form.replyToId)missing.push('replyToId');}
  if(p.id==='reddit'&&!Object.hasOwn(settings,'firstComment'))missing.push('firstComment');
  if(p.id==='reddit'&&form.subreddit&&!/^[A-Za-z0-9_]{2,50}$/.test(form.subreddit))missing.push('subreddit');
  return [...new Set(missing)];
}
