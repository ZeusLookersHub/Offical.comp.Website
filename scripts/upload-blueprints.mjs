/**
 * Uploads .engine/blueprints.json into the locked lookers_engine_blueprints table.
 * The payload is the prompt engineering itself: it goes straight from your machine to the
 * database and is never committed or published.
 *
 *   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run upload:blueprints
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API).');
  process.exit(1);
}
const payload = readFileSync('.engine/blueprints.json', 'utf8');
const list = JSON.parse(payload);
if (!Array.isArray(list) || !list.length) { console.error('.engine/blueprints.json is empty — run npm run build:blueprints'); process.exit(1); }
const missing = list.filter(bp => !bp.role || !bp.strategy || !Array.isArray(bp.gates)).map(bp => bp.id);
if (missing.length) { console.error('blueprints missing their private half:', missing.join(', ')); process.exit(1); }

const res = await fetch(`${url}/rest/v1/lookers_engine_blueprints?on_conflict=id`, {
  method: 'POST',
  headers: {
    apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify([{
    id: 'current', payload: list, count: list.length,
    sha256: createHash('sha256').update(payload).digest('hex'),
    updated_at: new Date().toISOString(),
  }]),
});
if (!res.ok) { console.error('upload failed:', res.status, await res.text()); process.exit(1); }
console.log(`uploaded ${list.length} blueprints (${payload.length} bytes). Live within 5 minutes, no redeploy.`);
