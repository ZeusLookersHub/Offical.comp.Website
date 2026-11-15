import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createEngineHandler } from '../../../server/engine/handler.ts';
import { modelFromEnv } from '../../../server/engine/model.ts';
import { remoteBlueprints } from '../../../server/engine/remote-blueprints.ts';
import { BLUEPRINTS_SHA256, BLUEPRINTS_URL } from './blueprints-pin.ts';

// Lookers AI Mission Engine. Runs beside lookers-ai-generate; it does not replace it.
const env = (name: string) => Deno.env.get(name);
Deno.serve(createEngineHandler({ env, model: modelFromEnv(env), blueprints: remoteBlueprints(BLUEPRINTS_URL, BLUEPRINTS_SHA256) }));
