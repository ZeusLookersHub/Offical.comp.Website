import type { SupabaseClient } from '@supabase/supabase-js';
import { bounded } from '../core/agent/bounded';
import type { AgentAITransport } from './lookersAiAgentReasoner';

// Public Supabase credentials, not a provider secret. Auth is anonymous in V1.
const url = 'https://cdmthlmnuqcmarboaxfb.supabase.co';
const publishableKey = 'sb_publishable_pvrQxH1MlficSSz6rIC39g___-r7Qbn';
let client: SupabaseClient | undefined;
export function createAnonymousAITransport(getClient: () => Pick<SupabaseClient, 'auth' | 'functions'> | Promise<Pick<SupabaseClient, 'auth' | 'functions'>>): AgentAITransport {
  return (body, parent) => bounded(async signal => {
  const active = await getClient();
  const { data, error } = await active.auth.getSession();
  if (error) throw new Error('ai_unavailable');
  let session = data.session;
  if (!session) {
    const signed = await active.auth.signInAnonymously();
    if (signed.error) throw new Error('ai_unavailable');
    session = signed.data.session;
  }
  if (!session?.user.is_anonymous || signal.aborted) throw new Error('ai_unavailable');
  const result = await active.functions.invoke('lookers-ai-generate', { body, signal });
  if (result.error || signal.aborted) throw new Error('ai_unavailable');
  return result.data;
}, 20000, parent);
}
export const lookersAiTransport = createAnonymousAITransport(async () => {
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(url, publishableKey);
  }
  return client;
});
