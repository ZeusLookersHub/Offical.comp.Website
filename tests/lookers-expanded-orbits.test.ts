import assert from 'node:assert/strict';
import { test } from 'node:test';
import { worlds, missionSelection } from '../components/wormhole/worlds';
import { createProjectDraft, compileLookersPrompt } from '../data/lookersAi';
import { nextChatTurn, submitChatAnswer, getChatRefinements, explainChatQuestion } from '../services/lookersAiChatWorkflow';
import { topicQuestions } from '../services/lookersAiTopicQuestions';
import { createApplicationGenerator } from '../services/lookersAiApplicationGeneration';
import { resolveTopic } from '../services/lookersAiTopicRegistry';

for (const world of worlds) {
  test(`${world.id}: eight distinct missions with real registered routes`, () => {
    assert.equal(world.tasks.length, 8);
    assert.equal(new Set(world.tasks.map(t=>t[0])).size, 8);
    for (const task of world.tasks) assert.ok(resolveTopic(missionSelection(world.id, task[0]).answers.topicId));
  });
  for (const task of world.tasks) test(`${world.id}/${task[0]}: localized interview, distinct hints and prompt retention`, async () => {
    const selection = missionSelection(world.id, task[0]);
    assert.equal(topicQuestions(selection.answers.topicId).length, 1);
    for (const lang of ['ar','en'] as const) {
      let draft = {...createProjectDraft(), taskType: selection.taskType, answers: {...selection.answers, idea:'A project brief'}};
      const seen = new Set<string>(), help = new Set<string>(); let count=0;
      while (true) {
        const turn=nextChatTurn(draft,lang);
        if(turn.status==='ready') break;
        const q=turn.question;
        assert.ok(!seen.has(q.id),q.id); seen.add(q.id);
        assert.ok(!help.has(q.help),q.help); help.add(q.help);
        assert.ok(q.help.includes(lang==='ar'?'مثال':'For example'));
        if(q.control.type==='text'||q.control.type==='textarea') assert.notEqual(q.control.placeholder,'اكتب إجابة قصيرة وواضحة هنا…');
        const before=JSON.stringify(draft); assert.equal(explainChatQuestion(draft,lang),q.help); assert.equal(JSON.stringify(draft),before);
        const answer=q.control.type==='single'?q.control.options[0].value:q.control.type==='multi'?[q.control.options[0].value]:'ANSWER_'+q.id;
        const result=submitChatAnswer(draft,lang,q.id,answer); assert.ok(result.ok);
        if(result.ok) draft=result.draft as typeof draft;
        assert.ok(++count<12);
      }
      assert.ok(seen.has(`topic_${selection.answers.topicId}_detail`));
      let calls=0;
      const result=await createApplicationGenerator(async()=>{calls++;return {data:{id:'test',output:{title:'test',prompt:'test output',summary:'test'},provenance:{providerId:'test',modelId:'test'}},identity:{userId:'test',isAnonymous:true}};})(draft,lang,new AbortController().signal);
      assert.equal(result.agent.decision.action,'complete',task[0]+': '+JSON.stringify(result.agent.decision));
      assert.equal(calls,1,task[0]+': canonical generation was skipped');
      const prompt=compileLookersPrompt(draft,lang);
      assert.ok(prompt.includes(`ANSWER_topic_${selection.answers.topicId}_detail`));
      const refinements=getChatRefinements(draft,lang); assert.ok(refinements.questions.every(q=>q.help.length>25));
    }
  });
}
test('reject mission names from another world',()=> assert.throws(()=>missionSelection('design','Debugging')));
