import type { SupabaseClient } from '@supabase/supabase-js';
import type { Candidate, ComposeRequest, DeepQuestion, GateReport, Session, SmartOptions, TurnResult } from '../core/mission-engine/client';

/**
 * Browser client for the lookers-ai-engine function and the learning events table.
 * Uses the same anonymous Supabase session as lookersAiTransport.
 */
type Client = Pick<SupabaseClient, 'functions' | 'from'>;
export type EngineEvent = 'intake' | 'question_shown' | 'answered' | 'skipped' | 'suggestion_used' | 'brief_shown'
  | 'brief_edited' | 'brief_confirmed' | 'composed' | 'copied' | 'tool_opened' | 'feedback' | 'followed_up';

export function createEngineClient(getClient: () => Promise<Client>) {
  const call = async <T>(body: Record<string, unknown>): Promise<T> => {
    const client = await getClient();
    const { data, error } = await client.functions.invoke('lookers-ai-engine', { body });
    if (error) {
      // Keep the server's own code: the chat tells a missing mission apart from a busy model.
      let code = 'engine_unavailable';
      try {
        const context: unknown = (error as { context?: unknown }).context;
        if (context instanceof Response) {
          const body: unknown = await context.clone().json();
          if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
            code = (body as { error: string }).error;
          }
        }
      } catch { /* the body may not be JSON; the generic code stands */ }
      throw new Error(code);
    }
    return data as T;
  };
  return {
    intake: (blueprintId: string, text: string) => call<{ candidates: Candidate[] }>({ op: 'intake', blueprintId, text }).then(r => r.candidates ?? []),
    ideas: (blueprintId: string, slot: string, typed: string, context: string, lang: Session['lang']) =>
      call<{ ideas: string[] }>({ op: 'ideas', blueprintId, slot, typed, context, lang }).then(r => r.ideas ?? []),
    /** A typed reply to an open question: what the person meant (answer, confused, asking, you-choose…). */
    turn: (blueprintId: string, slot: string, text: string, context: string, lang: Session['lang'], probesLeft: number) =>
      call<TurnResult>({ op: 'turn', blueprintId, slot, text, context, lang, probesLeft }),
    /** Smart options for the question on screen. */
    options: (blueprintId: string, slot: string, context: string, lang: Session['lang']) =>
      call<SmartOptions>({ op: 'options', blueprintId, slot, context, lang }),
    /** The questions that would make the prompt stronger. */
    deepen: (blueprintId: string, context: string, lang: Session['lang']) =>
      call<{ questions: DeepQuestion[] }>({ op: 'deepen', blueprintId, context, lang }).then(r => r.questions ?? []),
    compose: (session: Session, sessionId?: string) =>
      call<{ output: Record<string, unknown>; report: GateReport; attempts: number; model: string; resultId: string | null }>({ op: 'compose', session, sessionId }),
    /** Follow-up: the user pasted the tool's reply; get what is done and the next message to paste. */
    next: (session: Session, input: { sent: string; reply: string; note?: string; done: string[] }) =>
      call<{ done: string[]; received: string; issues: string[]; next: string; message: string; finished: boolean; model: string }>({ op: 'next', session, ...input }),
        /** "Explain this image": description + evidence-checked candidates. Served by whichever vision
     *  model the server has configured; the answer reports which one looked at the image. */
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
