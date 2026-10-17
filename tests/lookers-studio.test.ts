import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyVision, readVision, visionFamilies, visionNodes, type VisionState } from '../services/lookersAiVision';
import { compileLookersPrompt, createProjectDraft } from '../data/lookersAi';
import { planDraftQuestions } from '../services/lookersAiQuestions';
import { projectFromDraft } from '../services/lookersAiProjectState';

test('every family and every image option updates the user brief without answering the questionnaire',()=>{
  for(const lang of ['ar','en'] as const){
    for(const family of visionFamilies){const next=applyVision({idea:'User text'},{family:family.value as VisionState['family'],choices:{},generated:''},lang);assert.ok(String(next.idea).startsWith('User text'));assert.ok(String(next.idea).length>9);assert.equal(readVision(next).family,family.value);}
    const state:VisionState={family:'image',choices:{action:'create',usage:'product',style:'3d',material:'glass',lighting:'studio',composition:'pedestal'},generated:''};
    for(const node of visionNodes(state))for(const option of node.options){const next=applyVision({idea:'My own details'}, {...state,choices:{...state.choices,[node.id]:option.value}},lang);assert.notEqual(String(next.idea),'My own details');assert.ok(!String(next.idea).includes('undefined'));assert.equal(next[node.id],undefined);}
  }
});
test('vision preserves manual edits and supports persistence plus dependent branches',()=>{
  let state:VisionState={family:'image',choices:{action:'create'},generated:''};
  let answers=applyVision({idea:'عطر نور'},state,'ar');
  state=readVision(answers);answers.idea=String(answers.idea).replace('صورة جديدة','صورة إعلانية للمنتج');
  answers=applyVision(answers,{...state,choices:{...state.choices,usage:'product'}},'ar');
  assert.ok(String(answers.idea).includes('صورة إعلانية للمنتج'));
  assert.ok(String(answers.idea).includes('تصوير منتج'));
  assert.equal(visionNodes({...state,choices:{action:'analyze'}}).length,1);
  assert.ok(!visionNodes({...state,choices:{action:'create',style:'illustration'}}).some(n=>n.id==='lighting'));
});
test('written option answers and a custom task description survive the real question and prompt adapters',()=>{
  const draft=createProjectDraft();draft.taskType='image';draft.answers={idea:'A perfume campaign image',subject:'The actual amber bottle',format:'Portrait 4:5 with room for the headline',action:'Keep the bottle; change only the background',purpose:'Promote the perfume',taskDescription:'A mixed image and social content brief'};
  assert.ok(!planDraftQuestions(draft,'en').missing.some(q=>['format','action'].includes(q.id)));
  const prompt=compileLookersPrompt(draft,'en');assert.ok(prompt.includes(String(draft.answers.taskDescription)));assert.ok(prompt.includes(String(draft.answers.action)));
  assert.ok(projectFromDraft(draft,'active','en').schema.context.includes(String(draft.answers.taskDescription)));
});


test('uploaded reference excerpts are included fairly and stay inside existing AI request budgets',()=>{
  for(const lang of ['ar','en'] as const){
    const draft=createProjectDraft();draft.answers={idea:'لوحة مبيعات للشركة',purpose:'مراجعة أداء الفروع',subject:'Confirmed product',format:'4:5',action:'create'};
    draft.attachments=Array.from({length:3},(_,i)=>({id:String(i),name:`Sheet-${i}.xlsx`,mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',size:2000,kind:'file' as const,include:true,note:'Content read',text:`APPROVED_SHEET_${i} `+'إيراد القاهرة 42000 وفرع الجيزة 18000. '.repeat(800)}));
    const prompt=compileLookersPrompt(draft,lang);for(let i=0;i<3;i++)assert.ok(prompt.includes(`APPROVED_SHEET_${i}`));
    assert.ok(prompt.length<=12000);assert.ok(new TextEncoder().encode(JSON.stringify({prompt,language:lang})).length<=20000);
    draft.attachments[1].include=false;assert.ok(!compileLookersPrompt(draft,lang).includes('APPROVED_SHEET_1'));
  }
});
