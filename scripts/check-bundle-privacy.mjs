/**
 * Fails if anything that belongs on the server shows up in the browser bundle.
 * Run after a build: node scripts/check-bundle-privacy.mjs <dist dir>
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'docs';
// Phrases that only exist in the private half of the engine, or must never be shipped at all.
const forbidden = [
  'sections.rules must say', 'sections.approach tells', 'no-invented-numbers', 'nearMiss',
  'Senior recruiter', 'strategist', 'PASTE YOUR CV BELOW', 'Fix only what the check',
  'SUPABASE_SERVICE_ROLE_KEY', 'service_role', 'GEMINI_API_KEY', 'DEEPSEEK_API_KEY', 'OPENROUTER_API_KEY',
];
const files = [];
const walk = d => { for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? walk(p) : /\.(js|mjs|css|html|json|map)$/.test(p) && files.push(p); } };
walk(dir);

const hits = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const phrase of forbidden) if (text.includes(phrase)) hits.push(`${file}: ${phrase}`);
  // Any JWT or OpenAI-style key, whatever its name.
  for (const m of text.matchAll(/\b(eyJ[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{24,}|AIza[0-9A-Za-z_-]{30,})/g)) hits.push(`${file}: looks like a key (${m[1].slice(0, 12)}…)`);
}
if (hits.length) { console.error('private data in the bundle:\n' + hits.map(h => '  ' + h).join('\n')); process.exit(1); }
console.log(`bundle clean: ${files.length} files, none carry server-only data`);
