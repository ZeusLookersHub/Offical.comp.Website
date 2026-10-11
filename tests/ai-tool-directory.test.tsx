import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {aiTools,toolCategories,type AITool} from '../data/aiTools';
import {createProjectDraft,detectTaskType,compileLookersPrompt,questions} from '../data/lookersAi';
import {deriveToolContext,rankTools,isNewInAI,newInAITools} from '../services/lookersAiTools';
import {presentationTemplates} from '../data/promptLibrary';
import {initializeLibraryDraft} from '../services/lookersAiPromptLibrary';
import {projectFromDraft,isLegacyDraft} from '../services/lookersAiProjectState';
import {createApplicationGenerator} from '../services/lookersAiApplicationGeneration';
import LookersAIToolDirectory from '../components/LookersAIToolDirectory';

const now=new Date('2026-10-11T12:00:00Z');
test('all sixteen task families have curated relevant tools and every official destination is safe',()=>{
 assert.equal(toolCategories.length,16);
 for(const c of toolCategories) assert.ok(aiTools.some(t=>t.active&&t.curated&&t.supportedTaskTypes.includes(c.id)),c.id);
 assert.equal(new Set(aiTools.map(t=>t.id)).size,aiTools.length);
 for(const t of aiTools) {
   for(const value of [t.officialUrl,t.verificationSource]) {
     const u=new URL(value);assert.equal(u.protocol,'https:');assert.equal(u.search,'');assert.equal(u.username,'');
   }
   assert.ok(t.name&&t.description.en&&t.description.ar&&t.capabilities.length&&t.modality.length);
   assert.ok(t.supportedTaskTypes.every(id=>toolCategories.some(c=>c.id===id)));
 }
 assert.equal(aiTools.filter(t=>t.category==='presentation').length,7);
});
test('presentation routes before campaign and data keywords and uses the existing powerpoint engine',()=>{
 for(const text of ['عايز أعمل presentation للشركة عشان أعرض خطة التسويق.','Marketing campaign presentation','Data storytelling slide deck']) assert.equal(detectTaskType(text),'presentation');
 const d=createProjectDraft();d.taskType='presentation';d.answers={idea:'Company deck',purpose:'Decision',presentationType:'business',audience:'Leadership',presentationFormat:'Editable slides'};
 assert.equal(projectFromDraft(d,'active','en').engineId,'powerpoint');
 assert.equal(projectFromDraft(d,'active','en').schema.output.format,'Editable slides');assert.ok(isLegacyDraft(d));
 assert.ok(!questions.presentation.some(q=>q.id==='format'||q.id==='subject'));
 assert.ok(questions.presentation.filter(q=>!q.optional).length<=2);
});
test('presentation intent changes recommended order instead of an alphabetical list',()=>{
 for(const [intent,expected] of [
   ['pitch',['gamma','canva','pitch','beautiful-ai']],['business',['gamma','canva','powerpoint','beautiful-ai']],
   ['data',['canva','powerpoint','google-slides','gamma']],['education',['canva','gamma','google-slides','powerpoint']],
 ] as const) {
   const d=createProjectDraft();d.taskType='presentation';d.answers={idea:'Deck',purpose:'Presentation',presentationType:intent};
   assert.deepEqual(rankTools(deriveToolContext(d)).slice(0,4).map(t=>t.id),expected);
 }
});
test('output, modality, capabilities and explicit preferences affect task fit',()=>{
 const d=createProjectDraft();d.taskType='campaign';d.answers={idea:'Marketing campaign',purpose:'Video advert'};
 assert.equal(deriveToolContext(d).modality,'video');assert.equal(rankTools(deriveToolContext(d))[0].id,'runway');
 d.taskType='presentation';d.answers={idea:'Pitch deck',purpose:'Presentation',presentationType:'pitch',tools:'Prezi'};
 assert.equal(rankTools(deriveToolContext(d))[0].id,'prezi');
 d.answers={idea:'Business presentation',purpose:'Editable PowerPoint PPTX',presentationType:'business'};
 assert.equal(rankTools(deriveToolContext(d))[0].id,'powerpoint');
 d.taskType='general';d.answers={idea:'Create a song',purpose:'Music'};
 assert.equal(rankTools(deriveToolContext(d))[0].id,'suno');
 d.answers={idea:'Debug code',purpose:'Working code'};
 assert.ok(rankTools(deriveToolContext(d)).every(t=>t.supportedTaskTypes.includes('coding')));
 assert.ok(!rankTools(deriveToolContext(d)).some(t=>t.id==='midjourney'));
 assert.ok(!rankTools(deriveToolContext(d),aiTools.map(t=>({...t,active:false}))).length);
});
test('new badge requires editorial marking and expires without mutating catalog metadata',()=>{
 const base=aiTools[0];const original=JSON.stringify(base);
 assert.ok(isNewInAI(base,now));
 assert.equal(isNewInAI({...base,newInAi:false},now),false);
 assert.equal(isNewInAI({...base,active:false},now),false);
 assert.equal(isNewInAI({...base,addedAt:'2026-10-12'},now),false);
 assert.equal(isNewInAI({...base,addedAt:'2026-02-31'},now),false);
 assert.equal(isNewInAI(base,new Date('2026-11-10T00:00:00Z')),false);
 assert.equal(isNewInAI(base,new Date('2026-11-09T23:59:59Z')),true);
 assert.equal(isNewInAI(base,new Date('2026-10-13T00:00:00Z'),2),false);
 assert.equal(isNewInAI(base,now,NaN),false);
 assert.equal(newInAITools([base],new Date('2030-01-01')).length,0);
 assert.ok(aiTools.includes(base));assert.equal(JSON.stringify(base),original);
 const older={...base,id:'older',addedAt:'2026-10-10'};assert.deepEqual(newInAITools([older,base],now).map(t=>t.id),[base.id,'older']);
 // Editorial resurfacing explicitly marks the record and updates its directory addition date.
 assert.ok(isNewInAI({...older,newInAi:true,addedAt:'2026-10-11'},now));
});
test('sixteen original bilingual presentation guides pass the same Agent gate and preserve supplied facts',async()=>{
 assert.equal(presentationTemplates.length,16);
 for(const template of presentationTemplates) for(const lang of ['en','ar'] as const) {
   const draft=initializeLibraryDraft(template,{topic:'CONFIRMED_TOPIC',audience:'CONFIRMED_AUDIENCE',slides:'12'},lang);
   assert.equal(draft.taskType,'presentation');assert.equal(draft.answers.tools,'');
   const prompt=compileLookersPrompt(draft,lang);
   assert.ok(prompt.includes('CONFIRMED_TOPIC')&&prompt.includes('CONFIRMED_AUDIENCE')&&prompt.includes('12'));
   assert.ok(!prompt.includes('Aspect ratio:')&&!prompt.includes('نسبة الأبعاد:'));
   let calls=0;
   const r=await createApplicationGenerator(async()=>{calls++;return {data:{id:'result',output:{title:'Deck',prompt:'Prepared prompt',summary:'Review'},provenance:{providerId:'test',modelId:'test'}},identity:{userId:'anonymous',isAnonymous:true}};})(draft,lang,new AbortController().signal);
   assert.equal(r.agent.decision.action,'complete',template.id);assert.equal(r.enhancement.status,'ready');assert.equal(calls,1);
   assert.equal(r.agent.project?.engineId,'powerpoint');
 }
});
test('directory renders task recommendations before editorial additions and safe official handoffs in both languages',()=>{
 const d=createProjectDraft();d.taskType='presentation';d.generatedPrompt='User reviewed prompt';d.answers={idea:'Marketing deck',purpose:'Business presentation',presentationType:'business'};
 for(const lang of ['en','ar'] as const){
   const html=renderToStaticMarkup(<LookersAIToolDirectory lang={lang} draft={d} onUse={()=>{}} onCopy={()=>{}}/>);
   assert.ok(html.indexOf('data-tool-section="recommended"')<html.indexOf('data-tool-section="new"'));
   assert.ok(html.indexOf('data-tool-section="new"')<html.indexOf('data-tool-section="categories"'));
   assert.ok(html.includes(lang==='ar'?'أدوات مناسبة للعرض':'Tools suited to your presentation'));
   assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'));
   assert.ok(!html.includes('Most popular')&&!html.includes('Trending AI')&&!html.includes('success rate'));
 }
});
