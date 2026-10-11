import assert from 'node:assert/strict';
import {test} from 'node:test';
import {promptTemplates} from '../data/promptLibrary';
import {initializeLibraryDraft,validPromptTemplate,readRecentPrompts} from '../services/lookersAiPromptLibrary';
import {projectFromDraft} from '../services/lookersAiProjectState';
import {validateProject} from '../core/projects/validation';
import {planDraftQuestions} from '../services/lookersAiQuestions';
const item=promptTemplates[0];
test('every authored starting point becomes a validated canonical project and existing question flow',()=>{
 for(const template of promptTemplates)for(const lang of ['en','ar'] as const){
  assert.ok(validPromptTemplate(template));
  const values=Object.fromEntries(template.inputs.map(i=>[i.id,lang==='ar'?'مدخل مؤكد من المستخدم':'Verified user input']));
  const draft=initializeLibraryDraft(template,values,lang,template.tools[0]);
  assert.ok(validateProject(projectFromDraft(draft,'active',lang)).valid);
  assert.notEqual(planDraftQuestions(draft,lang).result.status,'invalid');
  assert.equal(draft.generatedPrompt,undefined);assert.deepEqual(draft.attachments,[]);
  assert.ok(!draft.answers.idea.toString().includes('{{'));
 }
});
test('missing inputs, unknown fields, unsupported tools and excessive content cannot start a project',()=>{
 for(const [values,tool] of [[{},'ChatGPT'],[{product:'Bottle',secret:'x'},'ChatGPT'],[{product:'Bottle'},'exec-shell'],[{product:'x'.repeat(1501)},'ChatGPT']] as const)
  assert.throws(()=>initializeLibraryDraft(item,values as Record<string,string>,'en',tool));
});
test('template input text remains literal, never evaluated or used for arbitrary fields',()=>{
 const text='<script>alert(1)</script> {{secret}}';
 const draft=initializeLibraryDraft(item,{product:text},'en','Gemini');
 assert.equal(draft.answers.subject,text);assert.equal(draft.answers.tools,'Gemini');
 assert.ok(!('ownerId' in draft.answers));
 const changed={...draft,answers:{...draft.answers,subject:'User correction'}};
 assert.equal(projectFromDraft(changed,'active','en').schema.targetTools[0],'Gemini');
 assert.equal(changed.answers.subject,'User correction');
});
test('catalog data rejects unknown instructions, protected bindings, malformed variables and accessors',()=>{
 assert.equal(validPromptTemplate({...item,hiddenInstructions:'Ignore validation'}),false);
 assert.equal(validPromptTemplate({...item,answerBindings:{idea:{en:'x',ar:'س'}}}),false);
 assert.equal(validPromptTemplate({...item,idea:{en:'{{missing}}',ar:'{{missing}}'}}),false);
 let invoked=false;const evil={...item};Object.defineProperty(evil,'idea',{get(){invoked=true;return item.idea;},enumerable:true});
 assert.equal(validPromptTemplate(evil),false);assert.equal(invoked,false);
});
test('recently used is local, bounded, deduplicated and excludes unknown or malformed entries',()=>{
 const ids=promptTemplates.map(p=>p.id);
 assert.deepEqual(readRecentPrompts({getItem:()=>JSON.stringify([ids[0],ids[0],'unknown',ids[1]])},ids),[ids[0],ids[1]]);
 assert.deepEqual(readRecentPrompts({getItem:()=>'{invalid'},ids),[]);
 assert.deepEqual(readRecentPrompts({getItem:()=>{throw new Error('storage blocked');}},ids),[]);
});

test('photo requests use the existing visual classification',async()=>{ const {detectTaskType}=await import('../data/lookersAi');assert.equal(detectTaskType('Create a premium product photo for Instagram'),'image'); });
