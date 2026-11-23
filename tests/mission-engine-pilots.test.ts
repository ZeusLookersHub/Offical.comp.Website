import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  answer, blueprintById, blueprintForTopic, blueprints, compileSystemPrompt, confirmBrief, createSession, listResources,
  buildComposeRequest, nextStep, plannedQuestions, runGates, submitIntake, type Blueprint, type Session,
} from '../core/mission-engine/index.ts';

const ok = <T>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if ('error' in r) assert.fail(r.error);
  return (r as { value: T }).value;
};
const bp = (topic: string): Blueprint => blueprintForTopic(topic)!;

function walk(blueprint: Blueprint, session: Session, answers: Record<string, string | string[]>) {
  const asked: string[] = [];
  for (let i = 0; i < 12; i++) {
    const step = nextStep(session, blueprint);
    if (step.type !== 'question') break;
    asked.push(step.question.slot);
    const value = answers[step.question.slot];
    assert.ok(value, `unexpected question ${step.question.slot}`);
    session = ok(answer(session, blueprint, step.question.slot, value));
  }
  return { session, asked };
}

test('the pilot missions open from their planet topics', () => {
  assert.equal(bp('product-photography').id, 'product-photo');
  assert.equal(bp('product-commercial').id, 'product-video');
  assert.equal(bp('investor-pitch').id, 'pitch-deck');
  assert.equal(bp('landing-page').id, 'landing-page');
  assert.equal(bp('growth-strategy').id, 'growth-strategy');
  assert.equal(bp('business-plan').id, 'business-plan');
  assert.equal(bp('feasibility-study').id, 'feasibility-study');
  assert.equal(bp('competitor-analysis').id, 'competitor-analysis');
});

test('business strategy: few questions, phased plan, invented numbers caught', () => {
  const g = bp('growth-strategy');
  let s = ok(submitIntake(createSession(g, 'ar', 'g1'), g, 'عايز نضاعف حجوزات العيادة في ٦ شهور، المشكلة إن الزوار مش بيحجزوا'));
  const walked = walk(g, s, { company: 'عيادة أسنان في القاهرة بتكسب من الكشف والعلاج', goal: 'نضاعف الحجوزات في ٦ شهور', horizon: '90-day', brandName: 'Smile' });
  s = ok(confirmBrief(walked.session, g));
  assert.equal(walked.asked.length <= 4, true, 'stays within a few questions');
  assert.equal(s.values.horizon?.value, '90-day');
  const base = {
    title: 'استراتيجية نمو Smile', sections: { goal: 'g', approach: 'a', rules: 'r', output: 'o' },
    prompt: 'Objective for "Smile", a dental clinic in Cairo earning from check-ups and treatment: lift bookings in 90 days. Right-to-left layout. Fix booking funnel first.',
    coverage: { company: 'a dental clinic in Cairo', goal: 'lift bookings in 90 days', horizon: 'in 90 days' },
    planOutline: ['المرحلة 1: تحسين صفحة الحجز — معدل التحويل'], missingData: ['عدد الحجوزات الحالي'],
    variants: { universal: 'Growth plan for "Smile"' }, checklist: ['a', 'b', 'c', 'd'], summary: 's',
  };
  assert.equal(runGates(g, s, base).ok, true, JSON.stringify(runGates(g, s, base).results.filter(r => !r.ok)));
  const invented = runGates(g, s, { ...base, planOutline: ['المرحلة 1: نوصل 5000 عميل و300% نمو'] });
  assert.equal(invented.results.find(r => r.id === 'no-invented-numbers')!.ok, false);
  const noRtl = runGates(g, s, { ...base, prompt: 'Objective for "Smile": lift bookings in 90 days.' });
  assert.equal(noRtl.results.find(r => r.id === 'rtl')!.ok, false);
});

test('internal system prompt is built from the four layers, in order, with examples', () => {
  for (const b of blueprints) {
    const system = compileSystemPrompt(b);
    const order = ['UNDERSTANDING', 'INTELLIGENCE', 'CONTROL', 'DELIVERY'].map(h => system.indexOf(h));
    assert.ok(order.every((v, i) => v > 0 && (i === 0 || v > order[i - 1])), b.id);
    assert.match(system, /^ROLE: /);
    assert.match(system, /EXAMPLE\nGood:/);
    assert.match(system, /Contract fields: /);
  }
});

test('every style choice in image and video missions shows an example', () => {
  const needs = listResources(blueprints);
  assert.ok(needs.filter(n => n.media === 'image').length >= 6);
  assert.ok(needs.filter(n => n.media === 'video').length >= 9);
  assert.ok(needs.every(n => n.asset.startsWith('/assets/lookers-ai/examples/') && n.generate.length > 20 && n.description.length > 20));
  const step = nextStep(ok(answer(ok(submitIntake(createSession(bp('product-commercial'), 'ar', 'v0'), bp('product-commercial'), 'فيديو لكوتشي')), bp('product-commercial'), 'product', 'كوتشي أبيض')), bp('product-commercial'));
  assert.equal(step.type, 'question');
  if (step.type === 'question' && step.question.slot === 'style') assert.ok(step.question.options!.every(o => o.description && o.media === 'video'));
});

test('video: one rich Arabic sentence → one question; defaults follow usage and mood', () => {
  const v = bp('product-commercial');
  let s = ok(submitIntake(createSession(v, 'ar', 'v1'), v, 'فيديو ٨ ثواني لكوتشي NIKE بيلف لريلز'));
  assert.equal(s.values.duration?.value, '8');
  assert.equal(s.values.style?.value, 'clean-turntable');
  assert.equal(s.values.usage?.value, 'reel');
  assert.equal(s.values.brandName?.value, 'NIKE');
  const { session, asked } = walk(v, s, { product: 'كوتشي جري أبيض بنعل برتقاني', basis: 'new' });
  assert.deepEqual(asked, ['product', 'basis'], 'the subject, then whether it builds on something that exists');
  assert.equal(session.values.ratio?.value, '9:16');
  assert.equal(session.values.camera?.value, 'static', 'turntable keeps the camera still');
  s = ok(answer(session, v, 'audio', 'voiceover'));
  const step = nextStep(s, v);
  assert.equal(step.type, 'question', 'choosing voice-over asks for the exact script');
  assert.equal(step.type === 'question' && step.question.slot, 'voiceoverScript');
});

test('pitch deck: invented numbers and wrong slide count are caught', () => {
  const d = bp('investor-pitch');
  let s = ok(submitIntake(createSession(d, 'ar', 'd1'), d, 'عرض استثماري لنظام عيادات، احنا في مرحلة Seed'));
  assert.equal(s.values.stage?.value, 'seed');
  const walked = walk(d, s, { company: 'نظام SaaS لإدارة العيادات بنبيعه اشتراك شهري', brandName: 'Shefaa', traction: '40 عيادة بتدفع ونمو 18% شهرياً' });
  assert.deepEqual(walked.asked, ['company', 'brandName', 'traction']);
  s = ok(confirmBrief(walked.session, d));
  assert.equal(s.values.language?.value, 'ar', 'language defaults to the user language');
  const outline = Array.from({ length: 12 }, (_, i) => `Slide ${i + 1}`);
  const good = {
    title: 'عرض Shefaa', sections: { goal: 'g', approach: 'a', rules: 'r', output: 'o' },
    prompt: 'Goal: pitch "Shefaa", a SaaS clinic management system sold as a monthly subscription, at seed stage to VC funds. Proof: 40 paying clinics, 18% monthly growth. Market size: [market size + source]. Layout right-to-left.',
    coverage: { company: 'a SaaS clinic management system', traction: '40 paying clinics, 18% monthly growth', stage: 'at seed stage' },
    slideOutline: outline, missingData: ['حجم السوق ومصدره'], variants: { universal: 'Pitch for "Shefaa", 40 paying clinics.' },
    checklist: ['a', 'b', 'c', 'd'], summary: 's',
  };
  assert.equal(runGates(d, s, good).ok, true, JSON.stringify(runGates(d, s, good).results.filter(r => !r.ok)));
  const invented = runGates(d, s, { ...good, prompt: good.prompt + ' The market is worth $2B and we grew 300%.' });
  const nums = invented.results.find(r => r.id === 'no-invented-numbers')!;
  assert.equal(nums.ok, false);
  assert.match(nums.detail!, /\$2B/);
  assert.match(nums.detail!, /300%/);
  assert.equal(runGates(d, s, { ...good, slideOutline: outline.slice(0, 9) }).results.find(r => r.id === 'slide-count')!.ok, false);
  assert.equal(runGates(d, s, { ...good, prompt: good.prompt.replace('Layout right-to-left.', '') }).results.find(r => r.id === 'rtl')!.ok, false);
});

test('landing page: asks offer, action, visitors, brand — and wires WhatsApp properly', () => {
  const l = bp('landing-page');
  let s = ok(submitIntake(createSession(l, 'en', 'l1'), l, 'a page for my dental clinic'));
  const walked = walk(l, s, { offer: 'Teeth whitening in one session', cta: 'whatsapp', audience: 'Adults in Cairo', brandName: 'Smile Lab' });
  assert.deepEqual(walked.asked, ['offer', 'cta', 'audience', 'brandName']);
  s = ok(confirmBrief(walked.session, l));
  const out = {
    title: 't', sections: { goal: 'g', approach: 'a', rules: 'r', output: 'o' },
    prompt: 'Build a mobile-first page for "Smile Lab" selling teeth whitening in one session to adults in Cairo, in a clean, trustworthy look. Button opens https://wa.me/[clinic phone].',
    coverage: { offer: 'teeth whitening in one session', audience: 'adults in Cairo', cta: 'https://wa.me/[clinic phone]', pageStyle: 'a clean, trustworthy look' },
    pageOutline: ['Hero — a whiter smile in one visit'], missingData: ['clinic phone'], variants: { universal: 'Page for "Smile Lab"' }, checklist: ['a', 'b', 'c', 'd'], summary: 's',
  };
  assert.equal(runGates(l, s, out).ok, true, JSON.stringify(runGates(l, s, out).results.filter(r => !r.ok)));
  const noLink = runGates(l, s, { ...out, prompt: 'Build a mobile-first page for "Smile Lab" with a WhatsApp button.' });
  assert.equal(noLink.results.find(r => r.id === 'whatsapp-link')!.ok, false);
  const fake = runGates(l, s, { ...out, pageOutline: ['Reviews — 1000+ happy customers, rated 4.9'] });
  assert.equal(fake.results.find(r => r.id === 'no-invented-numbers')!.ok, false);
});

test('edit missions end with a paste block and never rewrite your facts', () => {
  for (const id of ['cv-improve', 'deck-improve', 'rewrite', 'ai-operator']) {
    const bp = blueprintById(id)!;
    assert.ok(bp, `${id} is registered`);
    assert.ok(bp.gates.some(g => g.id === 'paste-block'), `${id} gates the paste block`);
    const control = bp.strategy.control.join(' ').toLowerCase();
    assert.ok(/never (invent|change|add)/.test(control), `${id} forbids inventing facts`);
    const delivery = bp.strategy.delivery.join(' ');
    assert.ok(delivery.includes('>>>'), `${id} delivery defines the paste marker`);
  }
});

test('the standing assistant asks few questions and keeps its stop line', () => {
  const bp = blueprintById('ai-operator')!;
  const after = ok(submitIntake(createSession(bp, 'ar', 'op1'), bp, 'عايز مساعد يرد على عملاء الصيدلية بتاعتي على واتساب طول اليوم'));
  const asked = plannedQuestions(after, bp).map(q => q.id);
  assert.ok(asked.length <= 5, `asked ${asked.length} questions: ${asked.join(', ')}`);
  assert.ok(bp.slots.some(s => s.id === 'escalation' && s.layer === 'control'), 'escalation is a control slot');
  const control = bp.strategy.control.join(' ');
  assert.ok(/human/i.test(control), 'it must hand over to a human');
});

test('every door on the planets page opens a built mission', async () => {
  const { worlds, missionSelection } = await import('../components/wormhole/worlds.ts');
  const broken: string[] = [];
  let doors = 0;
  for (const world of worlds) {
    for (const task of world.tasks) {
      doors++;
      const topicId = String(missionSelection(world.id, task[0]).answers.topicId);
      if (!blueprintForTopic(topicId)) broken.push(`${world.id}/${task[0]} → ${topicId}`);
    }
  }
  assert.deepEqual(broken, [], 'doors that still fall back to the old chat');
  assert.ok(doors >= blueprints.length, `${doors} doors for ${blueprints.length} missions`);

  // Four missions orbit at a time, so no world may have an orbit that cannot be reached.
  for (const world of worlds) {
    assert.ok(world.tasks.length > 0 && world.tasks.length <= 40, `${world.id} has ${world.tasks.length} doors`);
  }
});

test('every built mission is reachable from the planets page', async () => {
  const { worlds, missionSelection } = await import('../components/wormhole/worlds.ts');
  const reachable = new Set<string>();
  for (const world of worlds) for (const task of world.tasks) reachable.add(String(missionSelection(world.id, task[0]).answers.topicId));
  const orphans = blueprints.filter(bp => !bp.topics.some(topic => reachable.has(topic))).map(bp => bp.id);
  assert.deepEqual(orphans, [], 'missions with no door on the planets page');
});

test('built on something existing: asks what stays, needs the reference, and the result must say how to attach it', () => {
  const d = blueprintById('social-post-design')!;
  let s = ok(submitIntake(createSession(d, 'ar', 'b1'), d, 'بوست خصم ٢٠٪ على الجواكت لبراندي، نفس الستايل بتاعنا'));
  assert.equal(s.values.basis?.value, 'existing', 'the user words select "existing"');
  const { session, asked } = walk(d, s, { subject: 'خصم ٢٠٪ على كل الجواكت', keep: 'اللوجو الدهبي واللون الأخضر الغامق', reference: 'yes', style: 'bold-type', usage: 'ig-post', brandName: 'GREENLEAF', exactText: 'NONE' });
  assert.ok(asked.includes('keep') && asked.includes('reference'), asked.join(','));
  assert.ok(!asked.includes('change'), 'change is only for edits');
  s = ok(confirmBrief({ ...session, references: ['Dark green square logo with a gold leaf mark.'] }, d));
  const req = buildComposeRequest(d, s);
  assert.deepEqual(req.brief.references, ['Dark green square logo with a gold leaf mark.']);
  assert.match(String(req.brief.values.keep?.asked), /stay exactly/);
  assert.match(req.system, /basis = existing/);
  const out = {
    title: 't', prompt: 'Using the attached image as the brand reference, bold typographic post: keep the exact gold logo and the dark green colour, huge headline, clean grid, "GREENLEAF" lockup in a corner.',
    negative: 'other brands, watermark, text, letters', params: { aspectRatio: '4:5' }, textOverlay: { mode: 'none' }, variants: { universal: 'Post for "GREENLEAF"' }, checklist: ['a', 'b', 'c', 'd'], summary: 's',
    coverage: { keep: 'keep the exact gold logo and the dark green colour', subject: 'huge headline', style: 'bold typographic post', usage: 'clean grid' },
  };
  const missingGuide = runGates(d, s, out);
  assert.equal(missingGuide.results.find(r => r.id === 'reference-guide')!.ok, false);
  const withGuide = runGates(d, s, { ...out, referenceGuide: ['ارفع اللوجو', 'في ChatGPT دوس + وارفعها مع البرومبت'] });
  assert.equal(withGuide.results.find(r => r.id === 'reference-guide')!.ok, true);
  const vague = runGates(d, s, { ...out, referenceGuide: ['a', 'b'], coverage: { ...out.coverage, keep: 'brand colours preserved' } });
  const cov = vague.results.find(r => r.id === 'coverage')!;
  assert.equal(cov.ok, false);
  assert.match(cov.detail!, /keep/);
});

test('a new piece skips the reference question and the guide', () => {
  const d = blueprintById('poster-design')!;
  const s = ok(submitIntake(createSession(d, 'en', 'b2'), d, 'A brand new poster for a jazz night'));
  assert.equal(plannedQuestions(s, d).some(q => q.id === 'reference' || q.id === 'keep'), false);
});

test('edits ask what changes and cannot skip what the edit is built on', () => {
  const d = blueprintById('illustration')!;
  const s = ok(submitIntake(createSession(d, 'en', 'b3'), d, 'I want to edit my illustration of a fox'));
  assert.equal(s.values.basis?.value, 'edit');
  const ids = plannedQuestions(s, d).map(q => q.id);
  assert.ok(ids.includes('keep') && ids.includes('change') && ids.includes('reference'), ids.join(','));
});
