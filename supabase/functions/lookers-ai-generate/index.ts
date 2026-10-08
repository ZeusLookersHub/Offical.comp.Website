import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createServerAILayer } from '../../../server/ai/bootstrap.ts';
import { createAIHandler } from '../../../server/ai/handler.ts';

const env = (name: string) => Deno.env.get(name);
Deno.serve(createAIHandler({ env, layer: createServerAILayer(env) }));
