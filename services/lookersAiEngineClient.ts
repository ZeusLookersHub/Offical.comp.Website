import type { SupabaseClient } from '@supabase/supabase-js';
import type { Candidate, ComposeRequest, GateReport, Session } from '../core/mission-engine';

/**
 * Browser client for the lookers-ai-engine function and the learning events table.
 * Uses the same anonymous Supabase session as lookersAiTransport.
 */
type Client = Pick<SupabaseClient, 'functions' | 'from'>;
export type EngineEvent = 'intake' | 'question_shown' | 'answered' | 'skipped' | 'suggestion_used' | 'brief_shown'
  | 'brief_edited' | 'brief_confirmed' | 'composed' | 'copied' | 'tool_opened' | 'feedback';

export function createEngineClient(getClient: () => Promise<Client>) {
  const call = async <T>(body: Record<string, unknown>): Promise<T> => {
    const client = await getClient();
    const { data, error } = await client.functions.invoke('lookers-ai-engine', { body });
    if (error) throw new Error('engine_unavailable');
    return data as T;
  };
  return {
    intake: (blueprintId: string, text: string) => call<{ candidates: Candidate[] }>({ op: 'intake', blueprintId, text }).then(r => r.candidates ?? []),
    ideas: (blueprintId: string, slot: string, typed: string, context: string, lang: Session['lang']) =>
      call<{ ideas: string[] }>({ op: 'ideas', blueprintId, slot, typed, context, lang }).then(r => r.ideas ?? []),
    compose: (session: Session, sessionId?: string) =>
      call<{ output: Record<string, unknown>; report: GateReport; attempts: number; model: string; resultId: string | null }>({ op: 'compose', session, sessionId }),
    /** "Explain this image": description + evidence-checked candidates (needs GEMINI_API_KEY on the server). */
    describe: (blueprintId: string, image: { mimeType: string; data: string }, lang: Session['lang']) =>
      call<{ description: string; candidates: Candidate[] }>({ op: 'describe', blueprintId, image, lang }),
    /** Fire-and-forget; never carries user text, only ids and counts. */
    track: async (event: EngineEvent, blueprintId: string, extra: { sessionId?: string; slot?: string; meta?: Record<string, string | number | boolean> } = {}) => {
      try {
        const client = await getClient();
        await client.from('lookers_engine_events').insert({ event, blueprint_id: blueprintId, session_id: extra.sessionId ?? null, slot: extra.slot ?? null, meta: extra.meta ?? {} });
      } catch { /* analytics must never break the chat */ }
    },
  };
}
export type { ComposeRequest };

import { getAnonymousSupabase } from './lookersAiTransport';
/** Default browser engine client on the Lookers Supabase project. */
export const lookersEngine = createEngineClient(getAnonymousSupabase);
