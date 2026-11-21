/**
 * Measures the thing that decides whether a mission feels good: how much it understands from
 * the first message, and how many questions it still has to ask.
 *
 * Offline (no keys, no network): runs the deterministic intake and the question planner over a
 * file of real requests and reports, per mission, how many of the critical slots were filled
 * straight from the message and how many questions remain.
 *
 *   npm run benchmark                      # uses tests/benchmark/requests.jsonl, else the sample
 *   npm run benchmark -- path/to/file.jsonl
 *
 * One JSON object per line:
 *   {"blueprint":"cv-resume","lang":"ar","text":"…what the person would actually type…"}
 *   optional: "expect":{"slots":{"role":"marketing manager"}}  — values that should be extracted
 *
 * The number to watch is "asks": the fewest questions for the best result is the whole promise.
 */
import { existsSync, readFileSync } from 'node:fs';
import { blueprintById, createSession, submitIntake, plannedQuestions, effectiveValues } from '../core/mission-engine/index.ts';
import type { Lang } from '../core/mission-engine/types.ts';

type Request = { blueprint: string; text: string; lang?: Lang; expect?: { slots?: Record<string, string> } };

const file = process.argv.find(a => a.endsWith('.jsonl'))
  ?? (existsSync('tests/benchmark/requests.jsonl') ? 'tests/benchmark/requests.jsonl' : 'tests/benchmark/requests.sample.jsonl');

const requests: Request[] = readFileSync(file, 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'))
  .map((line, i) => { try { return JSON.parse(line); } catch { throw new Error(`line ${i + 1} is not valid JSON`); } });

type Row = { mission: string; n: number; asks: number[]; filled: number; criticals: number; misses: string[] };
const rows = new Map<string, Row>();
const problems: string[] = [];

for (const [i, req] of requests.entries()) {
  const bp = blueprintById(req.blueprint);
  if (!bp) { problems.push(`line ${i + 1}: unknown mission "${req.blueprint}"`); continue; }
  const lang: Lang = req.lang ?? 'ar';

  // Exactly what the chat does before it asks anything, minus the model's own extraction.
  const started = submitIntake(createSession(bp, lang, `bench-${i}`), bp, req.text);
  if (!started.ok) { problems.push(`line ${i + 1}: intake refused (${String((started as { error?: string }).error)})`); continue; }
  const session = started.value;
  const values = effectiveValues(session, bp);
  const criticals = bp.slots.filter(s => s.importance === 'critical');
  const raw = (id: string): unknown => values[id]?.value;
  const filled = criticals.filter(s => {
    const v = raw(s.id);
    return typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : false;
  }).length;
  const asks = plannedQuestions(session, bp).length;

  const row = rows.get(bp.id) ?? { mission: bp.id, n: 0, asks: [], filled: 0, criticals: 0, misses: [] };
  row.n++; row.asks.push(asks); row.filled += filled; row.criticals += criticals.length;
  for (const [slot, want] of Object.entries(req.expect?.slots ?? {})) {
    const got = raw(slot);
    const hit = typeof got === 'string' && got.toLowerCase().includes(want.toLowerCase());
    if (!hit) row.misses.push(`${slot}: wanted "${want}", got ${got === undefined ? 'nothing' : `"${String(got)}"`}`);
  }
  rows.set(bp.id, row);
}

const pct = (a: number, b: number) => b === 0 ? '—' : `${Math.round((a / b) * 100)}%`;
const avg = (xs: number[]) => xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '—';

console.log(`\n${requests.length} requests from ${file}\n`);
console.log('mission'.padEnd(22) + 'reqs'.padStart(5) + 'avg asks'.padStart(10) + 'max'.padStart(5) + '  criticals caught by rules');
console.log('-'.repeat(76));
const sorted = [...rows.values()].sort((a, b) => Number(avg(b.asks)) - Number(avg(a.asks)));
for (const r of sorted) {
  console.log(r.mission.padEnd(22) + String(r.n).padStart(5) + avg(r.asks).padStart(10)
    + String(Math.max(...r.asks)).padStart(5) + '  ' + pct(r.filled, r.criticals).padStart(5)
    + (r.misses.length ? `   ${r.misses.length} extraction miss(es)` : ''));
}

const allAsks = sorted.flatMap(r => r.asks);
console.log('-'.repeat(76));
console.log(`across all: avg ${avg(allAsks)} questions, worst ${allAsks.length ? Math.max(...allAsks) : 0}, `
  + `criticals caught by rules alone ${pct(sorted.reduce((a, r) => a + r.filled, 0), sorted.reduce((a, r) => a + r.criticals, 0))}`);
console.log('(rules only: no model here. In the live chat the model also extracts, so the real question count is this or lower.)');

const missed = sorted.filter(r => r.misses.length);
if (missed.length) {
  console.log('\nextraction misses — each one is a pattern or a keyword the mission should learn:');
  for (const r of missed) for (const m of r.misses.slice(0, 4)) console.log(`  ${r.mission}  ${m}`);
}
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }

const coveredMissions = rows.size;
console.log(`\n${coveredMissions} mission(s) covered. Ten real requests each is the target — the thin ones are where to look first.`);
if (problems.length) process.exit(1);
