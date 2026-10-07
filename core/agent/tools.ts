import { PROJECT_ENGINES } from '../projects/engines';
import { getQuestionSchema } from '../question-engine';
import { equal, exact, text } from './validation';
import type { AgentTool, AgentToolId, ToolContext } from './types';

export class ToolUnavailable extends Error {}
const keys: Record<AgentToolId, string[]> = {
  get_project_schema: [], get_engine_definition: [], get_question_definition: ['questionId'],
  get_tool_profile: ['profileId'], get_reference: ['referenceId'], validate_prompt: ['prompt'],
  save_project_state: [], get_owner_memory: [],
};
const descriptions: Record<AgentToolId, string> = {
  get_project_schema: 'Read the current validated canonical schema.',
  get_engine_definition: 'Read the selected engine from the Core registry.',
  get_question_definition: 'Read an existing question definition for this engine.',
  get_tool_profile: 'Report profile capability as unavailable until its stage.',
  get_reference: 'Read one included reference in this project, without extraction.',
  validate_prompt: 'Check text structure only; no factual or quality certification.',
  save_project_state: 'Save the supplied canonical snapshot through the application port.',
  get_owner_memory: 'Authorization boundary only; memory is not implemented.',
};
const structuralPrompt = (prompt: string) => ({ valid: !!prompt.trim(), scope: 'structure', length: prompt.length });
function expected(id: AgentToolId, input: Record<string, unknown>, c: ToolContext): unknown {
  switch (id) {
    case 'get_project_schema': return { ...c.project.schema, references: c.project.schema.references.filter(r => r.included) };
    case 'get_engine_definition': return PROJECT_ENGINES.find(e => e.id === c.project.engineId && e.kind === 'engine');
    case 'get_question_definition': return getQuestionSchema(c.project.engineId).definitions.find(q => q.id === input.questionId);
    case 'get_tool_profile': return { available: false, profileId: input.profileId };
    case 'get_reference': return c.project.schema.references.find(r => r.id === input.referenceId && r.included);
    case 'validate_prompt': return structuralPrompt(input.prompt as string);
    case 'save_project_state': return { saved: true, projectId: c.project.id, updatedAt: c.project.updatedAt };
    case 'get_owner_memory': return { available: false };
  }
}
export function createAgentTools(): AgentTool[] {
  return (Object.keys(keys) as AgentToolId[]).map(id => ({
    id, description: descriptions[id], inputSchema: { required: keys[id], additionalProperties: false },
    validateInput: input => exact(input, keys[id]) && keys[id].every(key => key === 'prompt'
      ? typeof input[key] === 'string' && input[key].length <= 100000 : text(input[key])),
    authorize: (input, c) => {
      if (c.access.projectId !== c.project.id) return false;
      if (id === 'save_project_state') return c.access.canSave === true && c.project.status !== 'archived';
      if (id === 'get_owner_memory') return !!c.project.ownerId && c.access.ownerId === c.project.ownerId;
      if (id === 'get_reference') return c.project.schema.references.some(r => r.id === input.referenceId && r.included);
      return true;
    },
    execute: async (input, c) => {
      if (c.signal.aborted) throw new Error('aborted');
      if (id === 'save_project_state') {
        if (!c.persistence) throw new ToolUnavailable();
        return c.persistence.save(structuredClone(c.project), c.signal);
      }
      const value = expected(id, input, c);
      if (value === undefined) throw new ToolUnavailable();
      return structuredClone(value);
    },
    validateOutput: (value, input, c) => {
      const wanted = expected(id, input, c);
      return wanted !== undefined && equal(value, wanted);
    },
  }));
}
