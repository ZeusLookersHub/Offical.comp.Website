import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createEngineHandler } from '../../../server/engine/handler.ts';
import { modelFromEnv } from '../../../server/engine/model.ts';

// Lookers AI Mission Engine. Runs beside lookers-ai-generate; it does not replace it.
const env = (name: string) => Deno.env.get(name);
Deno.serve(createEngineHandler({ env, model: modelFromEnv(env) }));
