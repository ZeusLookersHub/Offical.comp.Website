import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
// Lookers AI Mission Engine. The implementation is the committed bundle `_bundle.mjs`
// (built from server/engine + core/mission-engine). The deployed entrypoint imports it
// from this repo at a pinned, immutable commit; it calls Deno.serve on import.
// Build: npm run build:engine-function. See docs/mission-engine/README.md.
import './_bundle.mjs';
