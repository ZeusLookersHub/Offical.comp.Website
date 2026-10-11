import { validateProject } from '../projects/validation';
import { bounded, BoundedError } from './bounded';
import { createAgentTools, ToolUnavailable } from './tools';
import { dataOnly, exact, record, toolId } from './validation';
import type { AgentTool, ToolContext, ToolResult } from './types';

/** Internal Agent tools only, not the future product/tool-profile registry. */
export class AgentToolRegistry {
  private readonly tools = new Map<string, AgentTool>();
  constructor(tools: AgentTool[] = createAgentTools()) {
    for (const tool of tools) {
      if (!toolId(tool.id) || this.tools.has(tool.id)) throw new Error('invalid_tool_registration');
      this.tools.set(tool.id, tool);
    }
  }
  reasoningTools() {
    // The reasoning port cannot initiate writes, access memory, or supply arbitrary prompts.
    return [...this.tools.values()].filter(t => ['get_project_schema', 'get_engine_definition', 'get_question_definition', 'get_tool_profile'].includes(t.id))
      .map(t => structuredClone({ id: t.id, description: t.description, inputSchema: t.inputSchema }));
  }
  async invoke(raw: unknown, context: ToolContext, timeoutMs = 1000): Promise<ToolResult> {
    if (!dataOnly(raw) || !exact(raw, ['toolId', 'input']) || typeof raw.toolId !== 'string') return { ok: false, error: 'invalid_tool_input' };
    const tool = this.tools.get(raw.toolId);
    if (!tool) return { ok: false, error: 'unknown_tool' };
    const failure = (error: Exclude<ToolResult, { ok: true }>['error']): ToolResult => ({ ok: false, toolId: tool.id, error });
    try {
      if (!dataOnly(context.project) || !validateProject(context.project).valid || !Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000)
        return failure('invalid_tool_input');
      const input = structuredClone(raw.input);
      if (!record(input) || !tool.validateInput(input)) return failure('invalid_tool_input');
      // Each tool receives isolated data, never the Agent's authoritative snapshot.
      const baseline = { ...context, project: structuredClone(context.project), access: structuredClone(context.access) };
      if (!tool.authorize(input, baseline)) return failure('unauthorized');
      const value = await bounded(signal => tool.execute(structuredClone(input), {
        ...baseline, project: structuredClone(baseline.project), access: structuredClone(baseline.access), signal,
      }), timeoutMs, context.signal);
      if (!dataOnly(value) || !tool.validateOutput(value, input, baseline)) return failure('invalid_tool_output');
      return { ok: true, toolId: tool.id, value: structuredClone(value) };
    } catch (error) {
      if (error instanceof BoundedError) return failure(error.code === 'timeout' ? 'tool_timeout' : 'aborted');
      return failure(error instanceof ToolUnavailable ? 'unavailable' : 'tool_failed');
    }
  }
}
