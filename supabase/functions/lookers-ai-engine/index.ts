import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createEngineHandler } from '../../../server/engine/handler.ts';
import { modelFromEnv } from '../../../server/engine/model.ts';
import { visionFromEnv } from '../../../server/engine/vision.ts';
import { pinFromConfig, remoteBlueprints } from '../../../server/engine/remote-blueprints.ts';
import { BLUEPRINTS_SHA256, BLUEPRINTS_URL } from './blueprints-pin.ts';

// Lookers AI Mission Engine. Runs beside lookers-ai-generate; it does not replace it.
const env = (name: string) => Deno.env.get(name);
const blueprints = remoteBlueprints(pinFromConfig(env('SUPABASE_URL') ?? '', env('SUPABASE_ANON_KEY') ?? ''), { url: BLUEPRINTS_URL, sha256: BLUEPRINTS_SHA256 });
Deno.serve(createEngineHandler({ env, model: modelFromEnv(env), vision: visionFromEnv(env), blueprints }));
