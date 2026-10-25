import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import LookersAIPage from '../pages/LookersAIPage';
import { LanguageContext } from '../LanguageContext';
import { createProjectDraft, type ProjectDraft } from '../data/lookersAi';
import { lookersAiProjectState } from '../services/lookersAiProjectState';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'window', { value: { localStorage: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
} }, configurable: true });
function render(draft = createProjectDraft(), language: 'en' | 'ar' = 'en', archived: ProjectDraft[] = []) {
  storage.clear();
  lookersAiProjectState.save({ version: 1, current: draft, archived }, language);
  return renderToStaticMarkup(<MemoryRouter><LanguageContext.Provider value={{lang: language, setLang: () => {}}}><LookersAIPage /></LanguageContext.Provider></MemoryRouter>);
}

test('home keeps references in their own step and places vision choices below the brief', () => {
  const html = render();
  assert.ok(html.indexOf('id="lai-idea"') < html.indexOf('class="lai-vision-choices"'));
  assert.ok(!html.includes('class="lai-attachments"'));
  assert.ok(html.includes('Previous Projects'));
  assert.ok(!html.includes('Saved on this device'));
  assert.ok(!html.includes('type="password"'));
});
test('Arabic renders true RTL with translated trend navigation and the AI mark', () => {
  const html = render(createProjectDraft(), 'ar');
  assert.ok(html.includes('dir="rtl" lang="ar"'));
  assert.ok(html.includes('aria-label="Lookers AI"'));
  for (const title of ['ترندات صور AI','ترندات فيديو AI','ترندات السوشيال ميديا','ترندات البرومبتات','تجارب إبداعية','مكتبة البرومبت']) assert.ok(html.includes(title));
  assert.ok(html.includes('وكل خطوة تفتح اللي بعدها.'));
});
test('details shows one accessible task question while preserving existing user choices', () => {
  const draft = createProjectDraft(); draft.step = 'details'; draft.taskType = 'image';
  draft.answers = { idea: 'Product photo', purpose: 'A square image', format: '1:1' };
  const html = render(draft);
  assert.equal((html.match(/id="lai-subject"/g) || []).length, 0);
  assert.ok(html.includes('id="lai-taskDescription"'));
  assert.ok(!html.includes('lai-task-selector'));
  assert.ok(html.includes('Optional ideas to help you write'));
  assert.ok(!html.includes('id="lai-purpose"'));
  assert.ok(html.includes('lai-question-card-body'));
  assert.ok(html.includes('Explain:'));
});
test('reference status distinguishes preview, excerpt and uninspected from inclusion', () => {
  const draft = createProjectDraft(); draft.step = 'files';
  draft.attachments = [
    {id:'image',name:'photo.jpg',mime:'image/jpeg',size:20,kind:'image',include:true,note:'',dataUrl:'data:image/jpeg;base64,AA=='},
    {id:'text',name:'notes.txt',mime:'text/plain',size:20,kind:'text',include:false,note:'',text:'Some reference text'},
    {id:'pdf',name:'brief.pdf',mime:'application/pdf',size:20,kind:'file',include:true,note:''},
  ];
  const html = render(draft);
  for (const status of ['Image preview','Content ready for prompt','Needs attention','Excluded']) assert.ok(html.includes(status));
});
test('local fallback survives navigation activity and editable result has an accessible label', () => {
  const draft = createProjectDraft(); draft.step='result'; draft.generatedPrompt='User-owned prompt';
  draft.activity = [{at: draft.createdAt,action:'prompt_generated_local'},{at:draft.createdAt,action:'opened_result'}];
  const html=render(draft);
  assert.ok(html.includes('AI was unavailable.'));
  assert.ok(html.includes('aria-label="Your prompt"'));
  assert.ok(html.includes('User-owned prompt'));
  assert.ok(html.includes('Review next step'));
  assert.ok(html.includes('image analysis is not available'));
});
test('untrusted reference and project content remain escaped text', () => {
  const draft=createProjectDraft(); draft.step='review'; draft.answers.idea='<script>alert(1)</script>';
  const html=render(draft);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
test('local archived projects are exposed without a fabricated trending feed', () => {
  const archived=createProjectDraft();archived.title='Saved campaign';
  const html=render(createProjectDraft(),'en',[archived]);
  assert.equal(lookersAiProjectState.load('en').archived[0].title,'Saved campaign');
  assert.ok(html.includes('Previous Projects'));
  assert.ok(html.includes('aria-controls="lai-project-history"'));
  assert.ok(!html.includes('success rate'));
});

import LookersAdaptiveChat, { ChatQuestionControl } from '../components/LookersAdaptiveChat';
import { nextChatTurn } from '../services/lookersAiChatWorkflow';
const chatProps = (draft: ProjectDraft) => ({ draft, lang: 'en' as const, busy: false, generating: false,
  notice: '', prompt: '', onCommit: () => {}, onGenerate: () => {}, onAttach: () => {},
  onUniverses: () => {}, onCopy: () => {}, onDownload: () => {}, onEditPrompt: () => {}, onImprove: () => {} });

test('adaptive chat renders one required question and no generate action before readiness', () => {
  const html = renderToStaticMarkup(<LookersAdaptiveChat {...chatProps(createProjectDraft())} />);
  assert.equal((html.match(/data-testid="active-question"/g) || []).length, 1);
  assert.ok(!html.includes('Generate result'));
  assert.ok(html.includes('Explain this question'));
  assert.ok(html.includes('Attach file'));
});

test('adaptive ready state exposes explicit generation without auto-generating or mandatory refinements', () => {
  const draft = createProjectDraft(); draft.answers = { idea: 'A support reply', outcome: 'Explain the confirmed policy' };
  let calls = 0;
  const html = renderToStaticMarkup(<LookersAdaptiveChat {...chatProps(draft)} onGenerate={() => {calls++;}} />);
  assert.equal(calls, 0);
  assert.ok(html.includes('Generate result'));
  assert.ok(html.includes('Add optional refinements'));
  assert.ok(!html.includes('data-testid="active-question"'));
});

test('adaptive single and multiple choice controls render real staged inputs with Send confirmation', () => {
  const draft = createProjectDraft(); draft.answers = { idea: 'video', contentType: 'video', videoSubject: 'Bottle' };
  const turn = nextChatTurn(draft, 'en'); assert.equal(turn.status, 'question');
  if (turn.status !== 'question') return;
  const renderControl = (question: typeof turn.question) => renderToStaticMarkup(<ChatQuestionControl question={question} lang="en" disabled={false} explanation={() => 'Help'} onSubmit={() => true} />);
  const single = renderControl(turn.question); assert.ok(single.includes('type="radio"'));
  const multi = renderControl({ ...turn.question, control: {type:'multi', options:[{value:'meta',label:'Meta'},{value:'google',label:'Google'}],doneLabel:'Done · Send'} });
  assert.equal((multi.match(/type="checkbox"/g)||[]).length,2);
  assert.ok(multi.includes('type="submit"')); assert.ok(multi.includes('Done · Send'));
});

test('adaptive result remains escaped and accessible; generation stays out of the result view', () => {
  const draft = createProjectDraft(); draft.step='result'; draft.generatedPrompt='<script>untrusted</script>';
  draft.answers = {idea:'Reply',outcome:'Explain'};
  const html = renderToStaticMarkup(<LookersAdaptiveChat {...chatProps(draft)} prompt={draft.generatedPrompt} />);
  assert.ok(html.includes('for="lai-chat-result"'));
  assert.ok(!html.includes('<script>untrusted</script>'));
  assert.ok(!html.includes('Generate result'));
});
