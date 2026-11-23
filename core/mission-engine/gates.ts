import type { Blueprint, ContractField, GateReport, GateResult, Session } from './types.ts';
import { NONE } from './planner.ts';
import { nearMisses, t } from './text.ts';

type Output = Record<string, unknown>;

/** Read "a.b" or "variants.*" (all values of a record). */
export function readPath(output: Output, path: string): unknown[] {
  const parts = path.split('.');
  let current: unknown[] = [output];
  for (const part of parts) {
    current = current.flatMap(node => {
      if (!node || typeof node !== 'object') return [];
      if (part === '*') return Object.values(node as Record<string, unknown>);
      return part in (node as Record<string, unknown>) ? [(node as Record<string, unknown>)[part]] : [];
    });
  }
  return current;
}

const strings = (output: Output, paths: string[]) => paths.flatMap(p => readPath(output, p)).flatMap(v => Array.isArray(v) ? v : [v]).filter((v): v is string => typeof v === 'string');

/** Shape check against the output contract. */
export function validateContract(blueprint: Blueprint, output: unknown): string[] {
  if (!output || typeof output !== 'object' || Array.isArray(output)) return ['output must be an object'];
  const errors: string[] = [];
  const check = (field: ContractField) => {
    const found = readPath(output as Output, field.path);
    if (!found.length || found[0] === undefined || found[0] === null || found[0] === '') {
      if (field.required) errors.push(`${field.path} is required`);
      return;
    }
    const value = found[0];
    const ok = field.type === 'string' ? typeof value === 'string'
      : field.type === 'string[]' ? Array.isArray(value) && value.every(v => typeof v === 'string')
      : field.type === 'record' ? typeof value === 'object' && !Array.isArray(value) && Object.values(value as object).every(v => typeof v === 'string')
      : typeof value === 'object' && !Array.isArray(value);
    if (!ok) errors.push(`${field.path} must be ${field.type}`);
    if (ok && field.maxLength && typeof value === 'string' && value.length > field.maxLength) errors.push(`${field.path} is too long`);
  };
  blueprint.output.fields.forEach(check);
  return errors;
}

/**
 * Deterministic quality gates. They certify the contract (names, exact text, format, leaks),
 * not the beauty of the final image — that needs the model critic and a real generation.
 */
export function runGates(blueprint: Blueprint, session: Session, output: unknown): GateReport {
  const lang = session.lang;
  const results: GateResult[] = [];
  const contractErrors = validateContract(blueprint, output);
  results.push({ id: 'contract', ok: !contractErrors.length, message: t({ en: 'Output has every required part', ar: 'الناتج فيه كل الأجزاء المطلوبة' }, lang), detail: contractErrors.join('; ') || undefined });
  if (contractErrors.length) return report(results);
  const out = output as Output;
  const slotValue = (id: string) => session.values[id]?.value;

  for (const gate of blueprint.gates) {
    const message = t(gate.message, lang);
    if (gate.kind === 'verbatim') {
      const value = slotValue(gate.slot);
      if (typeof value !== 'string' || !value || value === NONE) continue;
      const texts = strings(out, gate.fields);
      const missingIn = texts.filter(s => !s.includes(value)).length;
      const misses = gate.nearMiss ? [...new Set(texts.flatMap(s => nearMisses(s, value)))] : [];
      results.push({ id: gate.id, ok: texts.length > 0 && missingIn === 0 && misses.length === 0, message,
        detail: [missingIn ? `missing in ${missingIn} field(s)` : '', misses.length ? `altered spelling: ${misses.join(', ')}` : ''].filter(Boolean).join('; ') || undefined });
    } else if (gate.kind === 'equals-slot') {
      const value = slotValue(gate.slot);
      if (typeof value !== 'string' || value === NONE) continue;
      const found = readPath(out, gate.field)[0];
      results.push({ id: gate.id, ok: found === value, message, detail: found === value ? undefined : `expected ${value}, got ${String(found)}` });
    } else if (gate.kind === 'no-leak') {
      const extra = (gate.slotTerms ?? []).flatMap(id => {
        const v = slotValue(id);
        const slot = blueprint.slots.find(s => s.id === id);
        const labels = typeof v === 'string' && v !== NONE ? [v, ...(slot?.options?.filter(o => o.value === v).map(o => o.label.en) ?? [])] : [];
        return labels.filter(l => l.length > 2);
      });
      const terms = [...gate.terms, ...extra];
      const texts = strings(out, gate.fields);
      const leaked = terms.filter(term => texts.some(s => s.toLowerCase().includes(term.toLowerCase())));
      results.push({ id: gate.id, ok: leaked.length === 0, message, detail: leaked.length ? `found: ${leaked.join(', ')}` : undefined });
    } else if (gate.kind === 'no-invented-text') {
      const allEmpty = gate.whenEmpty.every(id => { const v = slotValue(id); return v === undefined || v === NONE || v === ''; });
      if (!allEmpty) continue;
      const prompt = strings(out, [gate.field]).join(' ');
      const negative = strings(out, [gate.negativeField]).join(' ').toLowerCase();
      const quoted = /["“«][^"”»]{2,}["”»]/.test(prompt);
      const ok = !quoted && /\b(text|letters|typography|words|watermark|logo)\b/.test(negative);
      results.push({ id: gate.id, ok, message, detail: ok ? undefined : quoted ? 'prompt asks for quoted text' : 'negative prompt does not exclude text' });
    } else if (gate.kind === 'no-invented-numbers') {
      const known = new Set<string>();
      const sources = [session.idea ?? '', ...Object.values(session.values).flatMap(v => Array.isArray(v.value) ? v.value : [v.value])];
      for (const src of sources) for (const n of numbersIn(src)) known.add(n.value);
      const invented = strings(out, gate.fields).flatMap(numbersIn).filter(n => n.significant && !known.has(n.value)).map(n => n.raw);
      results.push({ id: gate.id, ok: invented.length === 0, message, detail: invented.length ? `numbers not from the user: ${[...new Set(invented)].join(', ')}` : undefined });
    } else if (gate.kind === 'array-length') {
      const want = Number(slotValue(gate.slot));
      if (!Number.isFinite(want)) continue;
      const found = readPath(out, gate.field)[0];
      const n = Array.isArray(found) ? found.length : -1;
      results.push({ id: gate.id, ok: n === want, message, detail: n === want ? undefined : `expected ${want}, got ${n}` });
    } else if (gate.kind === 'includes-when') {
      const applies = gate.when.every(c => {
        const v = slotValue(c.slot);
        const wanted = c.equals === undefined ? [] : Array.isArray(c.equals) ? c.equals : [c.equals];
        return Array.isArray(v) ? v.some(x => wanted.includes(x)) : typeof v === 'string' && wanted.includes(v);
      });
      if (!applies) continue;
      const text = strings(out, [gate.field]).join(' ').toLowerCase();
      const hit = gate.anyOf.some(term => text.includes(term.toLowerCase()));
      results.push({ id: gate.id, ok: hit, message, detail: hit ? undefined : `missing any of: ${gate.anyOf.join(' / ')}` });
    } else if (gate.kind === 'filled-when') {
      const applies = gate.whenAny.some(c => {
        const v = slotValue(c.slot);
        const wanted = c.equals === undefined ? [] : Array.isArray(c.equals) ? c.equals : [c.equals];
        return Array.isArray(v) ? v.some(x => wanted.includes(x)) : typeof v === 'string' && wanted.includes(v);
      });
      if (!applies) continue;
      const found = readPath(out, gate.field)[0];
      const ok = Array.isArray(found) && found.filter(x => typeof x === 'string' && x.trim()).length >= 2;
      results.push({ id: gate.id, ok, message, detail: ok ? undefined : `${gate.field} must list the steps` });
    } else if (gate.kind === 'coverage') {
      const given = gate.slots.filter(id => {
        const v = session.values[id];
        return v && v.source !== 'default' && v.value !== NONE && (Array.isArray(v.value) ? v.value.length > 0 : v.value.trim().length > 0);
      });
      if (!given.length) continue;
      const flat = (x: string) => x.toLowerCase().replace(/\s+/g, ' ').trim();
      const text = flat(strings(out, [gate.field]).join(' '));
      const map = (readPath(out, gate.map)[0] ?? {}) as Record<string, unknown>;
      const missing = given.filter(id => {
        const phrase = typeof map[id] === 'string' ? flat(map[id] as string) : '';
        return phrase.length < 3 || !text.includes(phrase);
      });
      results.push({ id: gate.id, ok: missing.length === 0, message,
        detail: missing.length ? `not realised in ${gate.field} (give each a phrase copied from it): ${missing.join(', ')}` : undefined });
    } else if (gate.kind === 'latin-ratio') {
      let text = strings(out, [gate.field]).join(' ');
      for (const id of gate.exceptSlots) { const v = slotValue(id); if (typeof v === 'string' && v !== NONE) text = text.split(v).join(' '); }
      const letters = [...text].filter(c => /\p{L}/u.test(c));
      const latin = letters.filter(c => /\p{Script=Latin}/u.test(c)).length;
      const ratio = letters.length ? latin / letters.length : 1;
      results.push({ id: gate.id, ok: ratio >= gate.min, message, detail: ratio >= gate.min ? undefined : `latin ratio ${ratio.toFixed(2)}` });
    }
  }
  return report(results);
}

/** Numbers in text. Ratios (16:9), placeholders and plain years are ignored; small counts are not significant. */
export function numbersIn(text: string): { raw: string; value: string; significant: boolean }[] {
  const clean = text.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/\d+\s*:\s*\d+/g, ' ').replace(/\[[^\]]*\]/g, ' ');
  const out: { raw: string; value: string; significant: boolean }[] = [];
  for (const m of clean.matchAll(/([$€£]\s?)?(\d[\d,]*(?:\.\d+)?)\s*(%|٪|[kKmMbB](?![a-zA-Z])|ألف|مليون|مليار)?/g)) {
    const value = m[2].replace(/,/g, '');
    const num = Number(value);
    const unit = !!(m[1] || m[3]);
    const year = !unit && /^(19|20)\d\d$/.test(value);
    out.push({ raw: m[0].trim(), value, significant: !year && (unit || num >= 21) });
  }
  return out;
}

function report(results: GateResult[]): GateReport {
  const passed = results.filter(r => r.ok).length;
  return { passed, total: results.length, ok: passed === results.length, results };
}
