import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  answer, blueprintForTopic, blueprints, buildBrief, buildComposeRequest, confirmBrief, createSession,
  nextStep, planLaunch, repairInstruction, runGates, skip, submitIntake, suggest, validateBlueprint, type Session,
} from '../core/mission-engine/index.ts';
import { leaksPrivateData } from '../core/mission-engine/public.ts';
import { publicBlueprints } from '../core/mission-engine/public-blueprints.generated.ts';
import { productPhoto as bp } from '../core/mission-engine/blueprints/product-photo.ts';

const ok = <T>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if ('error' in r) assert.fail(r.error);
  return (r as { value: T }).value;
};

/** Walk the chat answering with the given map until the brief appears; returns asked slot ids. */
function walk(session: Session, answers: Record<string, string>): { session: Session; asked: string[] } {
  const asked: string[] = [];
  for (let i = 0; i < 10; i++) {
    const step = nextStep(session, bp);
    if (step.type !== 'question') break;
    asked.push(step.question.slot);
    const value = answers[step.question.slot];
    assert.ok(value, `unexpected question ${step.question.slot}`);
    session = ok(answer(session, bp, step.question.slot, value));
  }
  return { session, asked };
}

test('every blueprint is structurally valid and reachable from its mission topic', () => {
  for (const b of blueprints) assert.deepEqual(validateBlueprint(b), []);
  assert.equal(blueprintForTopic('product-photography')?.id, 'product-photo');
});

test('rich Arabic idea: extracts brand, mood and usage, asks only the product', () => {
  let s = createSession(bp, 'ar', 't1');
  assert.equal(nextStep(s, bp).type, 'intake');
  s = ok(submitIntake(s, bp, 'عايز صورة لبرفان DAVIDOFF فخمة لستوري'));
  assert.equal(s.values.brandName?.value, 'DAVIDOFF');
  assert.equal(s.values.style?.value, 'luxury-dark');
  assert.equal(s.values.usage?.value, 'story');
  const { session, asked } = walk(s, { product: 'زجاجة برفان كحلي بغطا فضي' });
  assert.deepEqual(asked, ['product']);
  const brief = buildBrief(session, bp);
  assert.equal(brief.ready, true);
  assert.equal(session.values.ratio?.value, '9:16', 'size follows usage');
  assert.ok(brief.assumptions.some(a => a.slot === 'ratio' && a.reason));
  assert.ok(brief.facts.some(f => f.slot === 'brandName' && f.value === 'DAVIDOFF'));
});

test('sparse idea: never more than product + 3 questions, defaults become visible assumptions', () => {
  let s = ok(submitIntake(createSession(bp, 'en', 't2'), bp, 'a product photo please'));
  const { session, asked } = walk(s, { product: 'Matte black water bottle', brandName: 'HYDRO', usage: 'listing', style: 'clean-studio' });
  assert.deepEqual(asked, ['product', 'brandName', 'usage', 'style']);
  assert.equal(session.phase, 'brief');
  const brief = buildBrief(session, bp);
  assert.ok(brief.assumptions.find(a => a.slot === 'exactText')?.reason);
  assert.equal(session.values.ratio?.value, '1:1');
  s = session;
  assert.equal(nextStep(s, bp).type, 'brief');
});

test('model candidates need evidence; exact values must be verbatim', () => {
  const s = createSession(bp, 'en', 't3');
  const text = 'Shot of our davidoff bottle on marble';
  const r = ok(submitIntake(s, bp, text, [
    { slot: 'brandName', value: 'DAVIDOFF', evidence: 'davidoff' },           // not verbatim → rejected
    { slot: 'product', value: 'Perfume bottle', evidence: 'invented words' },  // no evidence → rejected
    { slot: 'scene', value: 'marble surface', evidence: 'on marble' },         // ok
  ]));
  assert.equal(r.values.brandName, undefined);
  assert.equal(r.values.product, undefined);
  assert.equal(r.values.scene?.value, 'marble surface');
  assert.equal(r.values.scene?.evidence, 'on marble');
});

test('quoted text goes to the slot named right before it', () => {
  const r = ok(submitIntake(createSession(bp, 'ar', 't4'), bp, 'بوست لعطر ومكتوب عليه "اكتشف ريحتك المميزة"'));
  assert.equal(r.values.exactText?.value, 'اكتشف ريحتك المميزة');
  assert.equal(r.values.usage?.value, 'ig-post');
});

test('skip: critical cannot be skipped; optional becomes an assumption', () => {
  let s = ok(submitIntake(createSession(bp, 'en', 't5'), bp, 'photo for my product'));
  assert.equal(skip(s, bp, 'product').ok, false);
  s = ok(answer(s, bp, 'product', 'Ceramic mug, sand colour'));
  const step = nextStep(s, bp);
  assert.equal(step.type, 'question');
  if (step.type !== 'question') return;
  assert.equal(step.question.canSkip, true);
  s = ok(skip(s, bp, step.question.slot));
  assert.equal(s.values[step.question.slot].source, 'default');
});

test('rework after confirm reopens the brief and keeps everything else', () => {
  let s = ok(submitIntake(createSession(bp, 'en', 't6'), bp, 'LUMA candle, luxury, for a story'));
  s = walk(s, { product: 'Amber glass candle jar' }).session;
  s = ok(confirmBrief(s, bp));
  assert.equal(s.phase, 'confirmed');
  const before = s.revision;
  s = ok(answer(s, bp, 'style', 'natural'));
  assert.equal(s.phase, 'brief');
  assert.ok(s.revision > before);
  assert.equal(s.values.brandName?.value, 'LUMA');
  assert.equal(s.values.style?.value, 'natural');
});

test('live suggestions follow what is typed', () => {
  const ar = suggest(bp, 'scene', 'رخ', { lang: 'ar' });
  assert.equal(ar[0], 'رخام إسود');
  const en = suggest(bp, 'product', 'white sneakers, le', { lang: 'en' });
  assert.equal(en[0], 'leather');
  assert.ok(!en.includes('white'), 'already written');
  assert.equal(suggest(bp, 'product', 'كوتشي أبيض بنعل ج', { lang: 'ar' })[0], 'جلد');
  assert.ok(suggest(bp, 'intake', '', { lang: 'ar' }).length >= 3);
});

// ---------- the perfume regression ----------

function perfumeSession(): Session {
  let s = ok(submitIntake(createSession(bp, 'ar', 'perfume'), bp, 'إعلان ممول لبرفان DAVIDOFF فخم'));
  s = walk(s, { product: 'زجاجة برفان زرقا غامقة بغطا فضي' }).session;
  return ok(confirmBrief(s, bp));
}

const goodOutput = {
  title: 'إعلان DAVIDOFF الفاخر',
  prompt: 'Luxury product photo of a deep blue glass perfume bottle with a silver cap, label reads "DAVIDOFF", on black marble, dramatic rim light, clean space at the top for later text.',
  negative: 'text, letters, watermark, extra logos, hands, blur',
  params: { aspectRatio: '4:5' },
  textOverlay: { mode: 'add-later' },
  variants: {
    universal: 'Luxury product photo of a deep blue perfume bottle, label reads "DAVIDOFF", black marble, rim light.',
    midjourney: 'Luxury product photo, deep blue perfume bottle, label reads "DAVIDOFF", black marble --ar 4:5 --style raw --v 7 --no text, watermark',
  },
  checklist: ['اسم DAVIDOFF مكتوب صح', 'شكل الزجاجة مطابق', 'مفيش كلام زيادة', 'المساحة فوق فاضية للنص'],
  summary: 'صورة فخمة للبرفان بخلفية رخام إسود.',
};

test('perfume regression: correct output passes every gate', () => {
  const s = perfumeSession();
  assert.equal(s.values.usage?.value, 'ad');
  assert.equal(s.values.ratio?.value, '4:5');
  const report = runGates(bp, s, goodOutput);
  assert.equal(report.ok, true, JSON.stringify(report.results.filter(r => !r.ok)));
  assert.equal(repairInstruction(report), null);
});

test('perfume regression: DAVIE DOVE is caught, as are leaks, size and Arabic prompts', () => {
  const s = perfumeSession();
  const misspelled = runGates(bp, s, { ...goodOutput, prompt: goodOutput.prompt.replace('DAVIDOFF', 'DAVIE DOVE') });
  const brand = misspelled.results.find(r => r.id === 'brand-verbatim')!;
  assert.equal(brand.ok, false);
  assert.match(brand.detail ?? '', /DAVIE DOVE/);
  assert.match(repairInstruction(misspelled) ?? '', /brand-verbatim/);

  const sneaky = runGates(bp, s, { ...goodOutput, prompt: goodOutput.prompt + ' DAVIDOF logo.' });
  assert.equal(sneaky.results.find(r => r.id === 'brand-verbatim')!.ok, false, 'a respelled duplicate fails even when the real name is present');

  const leak = runGates(bp, s, { ...goodOutput, prompt: goodOutput.prompt + ' Midjourney, 4:5.' });
  assert.equal(leak.results.find(r => r.id === 'no-leak')!.ok, false);

  const size = runGates(bp, s, { ...goodOutput, params: { aspectRatio: '1:1' } });
  assert.equal(size.results.find(r => r.id === 'size')!.ok, false);

  const arabic = runGates(bp, s, { ...goodOutput, prompt: 'صورة فخمة لزجاجة برفان مكتوب عليها "DAVIDOFF" على رخام' });
  assert.equal(arabic.results.find(r => r.id === 'english-prompt')!.ok, false);

  const broken = runGates(bp, s, { prompt: 'x' });
  assert.equal(broken.ok, false);
  assert.equal(broken.results[0].id, 'contract');
});

test('no brand and no text: invented quoted words are rejected', () => {
  let s = ok(submitIntake(createSession(bp, 'en', 'plain'), bp, 'clean studio shot of a ceramic mug for my store'));
  s = walk(s, { product: 'Sand ceramic mug', brandName: 'none' }).session;
  s = ok(confirmBrief(s, bp));
  const invented = { ...goodOutput, params: { aspectRatio: '1:1' }, prompt: 'Ceramic mug with the words "Morning Joy" on a white background', variants: { universal: 'Ceramic mug' } };
  const report = runGates(bp, s, invented);
  assert.equal(report.results.find(r => r.id === 'no-invented-text')!.ok, false);
});

test('compose request only after confirmation, with verbatim flags and empty slots named', () => {
  let s = ok(submitIntake(createSession(bp, 'ar', 'c1'), bp, 'برفان DAVIDOFF فخم لستوري'));
  s = walk(s, { product: 'زجاجة كحلي' }).session;
  assert.throws(() => buildComposeRequest(bp, s), /brief_not_confirmed/);
  s = ok(confirmBrief(s, bp));
  const req = buildComposeRequest(bp, s);
  assert.equal(req.brief.values.brandName.verbatim, true);
  assert.equal(req.brief.values.ratio.assumed, true);
  assert.equal(req.brief.values.style.label, 'Luxury · dark & dramatic');
  assert.match(req.system, /deliberately left empty.*exactText/);
  assert.equal(req.brief.values.exactText, undefined);
});

test('launch: chat AIs carry the prompt in the URL, others copy first', () => {
  const short = planLaunch('chatgpt', 'A tidy prompt');
  assert.equal(short?.mode, 'query');
  assert.ok(short!.url.startsWith('https://chatgpt.com/?q='));
  assert.ok(decodeURIComponent(short!.url).includes('A tidy prompt'));

  const long = planLaunch('chatgpt', 'x'.repeat(3000));
  assert.equal(long?.mode, 'copy', 'a prompt too long for a URL falls back to copy');
  assert.equal(long?.url, 'https://chatgpt.com/');

  const mj = planLaunch('midjourney', 'cinematic bottle');
  assert.equal(mj?.mode, 'copy');
  assert.ok(mj!.url.startsWith('https://'));

  assert.equal(planLaunch('universal', 'anything'), null, 'universal has no destination');
  assert.equal(planLaunch('not-a-tool', 'anything'), null);
});

test('launch: every tool a blueprint offers has a destination or is universal', () => {
  const missing: string[] = [];
  for (const bp of blueprints) {
    for (const target of bp.tools) {
      if (target.id === 'universal') continue;
      if (!planLaunch(target.id, 'test')) missing.push(`${bp.id}:${target.id}`);
    }
  }
  assert.deepEqual(missing, [], 'tool targets without a launch destination');
});

test('privacy: the browser copy carries no prompt engineering', () => {
  assert.equal(publicBlueprints.length, blueprints.length, 'every blueprint has a public copy');
  const leaks = publicBlueprints.flatMap(bp => leaksPrivateData(bp).map(f => `${bp.id}.${f}`));
  assert.deepEqual(leaks, [], 'private fields left in the public copy');
  // The full blueprints must still carry it — the split is a projection, not a deletion.
  for (const bp of blueprints) {
    assert.ok(bp.role.length > 0, `${bp.id} keeps its role on the server`);
    assert.ok(bp.strategy.control.length > 0, `${bp.id} keeps its control rules on the server`);
    assert.ok(bp.gates.length > 0, `${bp.id} keeps its gates on the server`);
  }
  // And the public copy must still be usable: labels, questions and options survive.
  for (const bp of publicBlueprints) {
    assert.ok(bp.slots.length > 0 && bp.slots.every(s => s.label.ar && s.question.ar), `${bp.id} keeps its questions`);
    assert.ok(bp.intake.starters.length > 0, `${bp.id} keeps its starters`);
  }
});
