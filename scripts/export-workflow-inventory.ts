import { writeFileSync, mkdirSync } from 'node:fs';
import { worlds, missionSelection } from '../components/wormhole/worlds';
import { workflowSchemas } from '../services/lookersAiWorkflowSchemas';
import { topicRegistry } from '../services/lookersAiTopicRegistry';
import { topicQuestions } from '../services/lookersAiTopicQuestions';
const output=process.argv[2];if(!output)throw new Error('Specify output folder');mkdirSync(output,{recursive:true});
writeFileSync(output+'/inventory.json',JSON.stringify({
  scope:'Phase 1 prompt briefs; no external workflow execution',
  worlds: worlds.map(world=>({id:world.id,en:world.en,ar:world.ar,missions:world.tasks.map((task,index)=>{const selection=missionSelection(world.id,task[0]);return {name:task[0],ar:task[1],orbit:Math.floor(index/4)+1,...selection,detail:topicQuestions(selection.answers.topicId)};})})),
  families:workflowSchemas,topics:topicRegistry,
},null,2));
