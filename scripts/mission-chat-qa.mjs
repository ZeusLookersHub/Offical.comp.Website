// Browser journey for the mission-engine chat. Engine responses are mocked at the network edge.
// Run: QA_CHROMIUM_EXECUTABLE=/usr/bin/google-chrome node scripts/mission-chat-qa.mjs
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.MISSION_QA_OUTPUT || 'node_modules/.cache/mission-chat-qa';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5290, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] });
const checks = [], errors = [], engineCalls = [];

const prompt = 'Luxury product photograph of a deep navy-blue glass perfume bottle with a polished silver cap, label reads "DAVIDOFF", standing on wet black marble, single hard rim light, deep shadows, 85mm lens, clean dark space above for later text.';
const composed = {
  output: {
    title: 'صورة إعلان فخمة لبرفان DAVIDOFF', prompt,
    negative: 'text, letters, watermark, extra logos, other brands', params: { aspectRatio: '1:1' }, textOverlay: { mode: 'none' },
    variants: { universal: prompt, midjourney: prompt + ' --ar 1:1 --style raw', chatgpt: 'Create a photo of ' + prompt },
    checklist: ['اسم DAVIDOFF مكتوب صح', 'الزجاجة كحلي بغطا فضي', 'مفيش كلام زيادة', 'المنتج واضح ومش مقطوع'],
    summary: 'صورة فخمة وغامقة لبرفان DAVIDOFF على رخام إسود.',
  },
  report: { passed: 5, total: 5, ok: true, results: ['contract', 'brand-verbatim', 'size', 'no-leak', 'english-prompt'].map(id => ({ id, ok: true, message: id })) },
  attempts: 1, model: 'mock', resultId: null,
};

async function mockEngine(context) {
  await context.route('**/auth/v1/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    access_token: 'h.' + Buffer.from(JSON.stringify({ sub: 'u1', exp: 4102444800, role: 'authenticated', is_anonymous: true })).toString('base64url') + '.s',
    token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, refresh_token: 'r', user: { id: 'u1', is_anonymous: true, aud: 'authenticated', role: 'authenticated' } }) }));
  await context.route('**/rest/v1/**', route => route.fulfill({ status: 201, body: '' }));
  await context.route('**/functions/v1/lookers-ai-engine', async route => {
    const body = JSON.parse(route.request().postData() || '{}');
    engineCalls.push(body.op);
    const reply = body.op === 'intake'
      ? { candidates: [{ slot: 'brandName', value: 'DAVIDOFF', evidence: 'DAVIDOFF' }, { slot: 'style', value: 'luxury-dark', evidence: 'فخمة' }] }
      : body.op === 'ideas' ? { ideas: ['زجاج مطفي', 'غطا معدن لامع'] } : composed;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reply) });
  });
}

let page;
try {
  for (const [width, height, label] of [[390, 844, 'mobile'], [1440, 900, 'desktop']]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    await mockEngine(context);
    page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5290/#/lookers-ai');
    await page.getByRole('button', { name: 'DESIGN', exact: true }).waitFor();
    await page.waitForTimeout(900);
    await page.getByRole('button', { name: 'عربي', exact: true }).click();
    await page.getByRole('button', { name: 'التصميم', exact: true }).click();
    await page.locator('.mission-rings button').nth(1).click();
    await page.getByRole('button', { name: /تصوير منتج/ }).click();

    const chat = page.getByTestId('mission-chat');
    await chat.waitFor();
    assert.match(await chat.innerText(), /احكيلي عن صورة المنتج/);
    assert.ok(await page.locator('.lmc-chips button').count() >= 3, 'starter ideas shown');
    checks.push(`${label}: Product Photo mission opens the engine chat with starter ideas`);
    await page.screenshot({ path: `${output}/${label}-1-intake.png` });

    await page.locator('.lmc-input').fill('عايز صورة إعلان لبرفان DAVIDOFF فخمة لستوري إنستجرام');
    await page.keyboard.press('Enter');
    const question = page.getByTestId('question-content');
    await question.waitFor();
    assert.equal(await question.getAttribute('data-slot'), 'product');
    const transcript = await chat.innerText();
    assert.match(transcript, /فهمت/);
    assert.match(transcript, /DAVIDOFF/);
    checks.push(`${label}: one message → understood brand and mood; asks only what is missing`);

    await page.locator('.lmc-input').fill('زجاجة كحلي ل');
    await page.waitForTimeout(150);
    const chips = await page.locator('.lmc-chips button').allInnerTexts();
    assert.ok(chips.includes('لامع'), 'local suggestion follows the word being typed: ' + chips.join('|'));
    await page.waitForTimeout(900);
    assert.ok((await page.locator('.lmc-chips button').allInnerTexts()).includes('زجاج مطفي'), 'AI ideas appear while typing');
    checks.push(`${label}: suggestions follow typing (local + AI ideas)`);
    await page.screenshot({ path: `${output}/${label}-2-question.png` });
    await page.getByRole('button', { name: 'لامع', exact: true }).click();
    await page.locator('.lmc-input').press('End');
    await page.locator('.lmc-input').type('بغطا فضي');
    await page.getByRole('button', { name: 'إرسال' }).click();

    // "إعلان … لستوري" is ambiguous between ad and story, so the engine asks instead of guessing.
    await page.getByTestId('question-content').and(page.locator('[data-slot=usage]')).waitFor();
    await page.locator('.lmc-option', { hasText: 'ستوري' }).click();
    await page.getByRole('button', { name: 'إرسال' }).click();
    checks.push(`${label}: ambiguous placement is asked, not guessed`);
    const brief = page.getByTestId('brief');
    await brief.waitFor();
    const briefText = await brief.innerText();
    assert.match(briefText, /9:16/);
    assert.match(briefText, /الستوري طولي كامل/);
    checks.push(`${label}: brief shows facts and visible assumptions with reasons`);
    await page.screenshot({ path: `${output}/${label}-3-brief.png`, fullPage: false });

    const ratioRow = brief.locator('li', { hasText: 'المقاس' });
    await ratioRow.getByRole('button', { name: 'غيّر' }).click();
    await brief.locator('.lmc-option', { hasText: 'مربع' }).click();
    await page.getByRole('button', { name: 'إرسال' }).click();
    await page.waitForFunction(() => document.querySelector('[data-testid=brief]')?.textContent?.includes('1:1'));
    checks.push(`${label}: an assumption can be changed in place`);

    await brief.getByRole('button', { name: 'تمام كده · اكتب البرومبت' }).click();
    const result = page.getByTestId('result');
    await result.waitFor();
    const resultText = await result.innerText();
    assert.match(resultText, /عدّى 5 من 5 فحوصات/);
    assert.match(resultText, /label reads "DAVIDOFF"/);
    await result.getByRole('tab', { name: 'Midjourney' }).click();
    assert.match(await result.locator('.lmc-prompt pre').first().innerText(), /--ar 1:1/);
    checks.push(`${label}: result shows checks, per-tool versions and copy`);
    await page.screenshot({ path: `${output}/${label}-4-result.png` });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `no horizontal overflow (${overflow}px)`);
    await context.close();
  }

  // Other missions keep the existing chat; pilot missions route to the engine.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await mockEngine(context);
  page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5290/#/lookers-ai');
  await page.getByRole('button', { name: 'BUSINESS', exact: true }).waitFor();
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: 'BUSINESS', exact: true }).click();
  await page.getByRole('button', { name: /Pitch Deck/ }).click();
  await page.getByTestId('mission-chat').waitFor();
  assert.match(await page.getByTestId('mission-chat').innerText(), /company/i);
  checks.push('Pitch Deck opens the engine chat in English');
  await page.getByRole('button', { name: '← Universes' }).click();
  await page.getByRole('button', { name: 'BUSINESS', exact: true }).click();
  await page.getByRole('button', { name: /Business Plan/ }).click();
  await page.waitForTimeout(400);
  assert.equal(await page.getByTestId('mission-chat').count(), 0);
  checks.push('Business Plan (no blueprint yet) keeps the existing chat');
  await context.close();

  assert.deepEqual(errors, []);
  assert.ok(engineCalls.includes('intake') && engineCalls.includes('compose'));
  const report = { status: 'passed', checks, errors, engineCalls: [...new Set(engineCalls)] };
  console.log(JSON.stringify(report, null, 2));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
} catch (error) {
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/failure.png` });
  await writeFile(`${output}/report.json`, JSON.stringify({ status: 'failed', error: String(error), checks, errors }, null, 2));
  console.error(error, { checks, errors });
  process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
