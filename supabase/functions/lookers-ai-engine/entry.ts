import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createEngineHandler } from '../../../server/engine/handler.ts';
import { routeFromEnv } from '../../../server/engine/router.ts';
import { visionFromEnv } from '../../../server/engine/vision.ts';
import { privateBlueprints } from '../../../server/engine/private-blueprints.ts';

// Lookers AI Mission Engine. Runs beside lookers-ai-generate; it does not replace it.
// The blueprints are read from a locked table with the service key — nothing about how the
// prompts are written is published anywhere. Build: npm run build:engine-function.
const env = (name: string) => Deno.env.get(name);
const blueprints = privateBlueprints(env('SUPABASE_URL') ?? '', env('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const route = routeFromEnv(env);
console.log('engine route', route.plan);
Deno.serve(createEngineHandler({ env, model: route, vision: visionFromEnv(env), blueprints }));
