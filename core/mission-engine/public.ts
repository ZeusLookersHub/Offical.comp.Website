import type { Blueprint } from './types.ts';

/**
 * The parts of a blueprint the browser is allowed to see.
 *
 * The chat needs labels, questions, options, defaults and extraction patterns to
 * run the conversation locally. It never needs the thinking: the role, the four
 * strategy layers, the worked examples, the quality gates or the per-tool notes.
 * Those are how the prompt is actually written, they are the product, and they
 * stay on the server — the browser only ever sees the finished result.
 *
 * Everything removed here is used exclusively by compileSystemPrompt and the
 * gate runner, both of which run inside the edge function.
 */
export const PRIVATE_FIELDS = ['role', 'strategy', 'examples', 'gates', 'tool notes'] as const;

export function stripPrivate(blueprint: Blueprint): Blueprint {
  return {
    ...blueprint,
    role: '',
    strategy: { understanding: [], intelligence: [], control: [], delivery: [] },
    examples: [],
    gates: [],
    tools: blueprint.tools.map(t => ({ id: t.id, label: t.label, notes: '' })),
  };
}

/** True when a blueprint still carries anything that belongs on the server only. */
export function leaksPrivateData(blueprint: Blueprint): string[] {
  const found: string[] = [];
  if (blueprint.role) found.push('role');
  for (const [layer, rules] of Object.entries(blueprint.strategy)) if (rules.length) found.push(`strategy.${layer}`);
  if (blueprint.examples.length) found.push('examples');
  if (blueprint.gates.length) found.push('gates');
  if (blueprint.tools.some(t => t.notes)) found.push('tools.notes');
  return found;
}
