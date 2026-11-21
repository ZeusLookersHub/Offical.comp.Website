/**
 * Writes .engine/blueprints.json (gitignored): blueprints without UI-only copy
 * (questions in Arabic, examples, vocabulary, visuals). The server needs ids, kinds,
 * options, limits, strategy, contract, gates and tools. Run: npm run build:engine-blueprints
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { blueprints } from '../core/mission-engine/registry.ts';

export const serverShape = () => blueprints.map(bp => ({
  id: bp.id, version: bp.version, title: bp.title, topics: bp.topics,
  intake: { question: { en: '', ar: '' }, why: { en: '', ar: '' }, starters: [] },
  questionBudget: bp.questionBudget,
  slots: bp.slots.map(s => ({
    id: s.id, kind: s.kind, layer: s.layer, importance: s.importance,
    label: { en: s.label.en, ar: '' }, question: { en: s.question.en, ar: '' }, why: { en: '', ar: '' }, example: { en: '', ar: '' },
    ...(s.options ? { options: s.options.map(o => ({ value: o.value, label: { en: o.label.en, ar: '' } })) } : {}),
    ...(s.maxLength ? { maxLength: s.maxLength } : {}),
  })),
  output: bp.output, gates: bp.gates, tools: bp.tools, role: bp.role, strategy: bp.strategy, examples: bp.examples,
}));

if (process.argv.includes('build-engine-blueprints')) {
  // NOT committed: this payload is the prompt engineering itself. It is uploaded to the
  // locked lookers_engine_blueprints table (npm run upload:blueprints), never published.
  mkdirSync('.engine', { recursive: true });
  const payload = JSON.stringify(serverShape());
  const sha256 = createHash('sha256').update(payload).digest('hex');
  writeFileSync('.engine/blueprints.json', payload);
  writeFileSync('.engine/blueprints.sha256', sha256);
  console.log('written .engine/blueprints.json', payload.length, 'bytes, sha256', sha256);
}
