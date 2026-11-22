/**
 * The only mission-engine entry the browser may import.
 *
 * It carries what the chat needs to run the conversation — slots, questions, options,
 * local extraction, the brief, the launch links — and nothing that explains how the
 * prompt is written. The role, the four strategy layers, the examples, the gates and
 * the system-prompt compiler live in modules this file does not touch, so they never
 * reach the bundle. Server code imports ./index.ts instead.
 */
export * from './types.ts';
export { createSession, submitIntake, answer, skip, nextStep, confirmBrief, plannedQuestions, effectiveValues, NONE } from './planner.ts';
export { extractDeterministic, applyCandidates } from './intake.ts';
export { buildBrief, displayValue } from './brief.ts';
export { suggest } from './suggest.ts';
export { normalize } from './text.ts';
export { planLaunch, launchableTools, type LaunchMode, type LaunchPlan } from './launch.ts';
// Type only: erased at compile time, so compose.ts never reaches the bundle.
export type { ComposeRequest } from './compose.ts';
export { publicBlueprints as blueprints } from './public-blueprints.generated.ts';

import type { Blueprint } from './types.ts';
import { publicBlueprints } from './public-blueprints.generated.ts';

const byTopic = new Map<string, Blueprint>();
for (const bp of publicBlueprints) for (const topic of bp.topics) if (!byTopic.has(topic)) byTopic.set(topic, bp);
const byId = new Map(publicBlueprints.map(bp => [bp.id, bp] as const));

export const blueprintForTopic = (topicId: string): Blueprint | undefined => byTopic.get(topicId);
export const blueprintById = (id: string): Blueprint | undefined => byId.get(id);
