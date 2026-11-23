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
    if (body.op === 'describe') {
      assert.equal(body.image.mimeType, 'image/jpeg', 'photo is converted to JPEG in the browser');
      const description = 'زجاجة برفان كحلي بغطا فضي، والليبل مكتوب عليه "DAVIDOFF".';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ description, candidates: [
        { slot: 'product', value: 'زجاجة برفان كحلي بغطا فضي', evidence: 'زجاجة برفان كحلي بغطا فضي' }, { slot: 'brandName', value: 'DAVIDOFF', evidence: 'DAVIDOFF' }] }) });
    }
    const reply = body.op === 'intake'
      ? { candidates: [{ slot: 'brandName', value: 'DAVIDOFF', evidence: 'DAVIDOFF' }, { slot: 'style', value: 'luxury-dark', evidence: 'فخمة' }] }
      : body.op === 'ideas' ? { ideas: ['زجاج مطفي', 'غطا معدن لامع'] }
      : body.op === 'turn' ? (/مش فاهم/.test(body.text)
          ? { intent: 'confused', reply: 'يعني الصورة دي هتتنشر فين؟ ستوري ولا بوست ولا إعلان ممول؟', chips: ['ستوري', 'بوست'] }
          : { intent: 'answer', value: body.text, others: [] })
      : body.op === 'options' ? { recommend: body.slot === 'usage' ? 'story' : undefined, why: body.slot === 'usage' ? 'لأنك قلت ستوري إنستجرام' : '', answers: [] }
      : body.op === 'deepen' ? { questions: [{ q: 'عايز الناس تحس بإيه أول ما تشوف الصورة؟', why: 'بيحدد الإضاءة والجو', chips: ['فخامة وغموض', 'دفا', 'انتعاش'] }] }
      : body.op === 'next' ? { done: ['الصورة الأساسية'], received: 'طلّع وصف للصورة بدل ما يولّدها.', issues: ['وصف بدل ما ينفّذ'], next: 'نسخة الستوري', finished: false,
          message: 'Approved: the DAVIDOFF bottle on wet black marble. Now generate the image itself, final quality — no description, no questions.', model: 'mock' }
      : composed;
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

    const ideasBefore = engineCalls.filter(c => c === 'ideas').length;
    await page.locator('.lmc-input').fill('زجاجة كحلي ل');
    await page.waitForTimeout(150);
    const chips = await page.locator('.lmc-chips button').allInnerTexts();
    assert.ok(chips.includes('لامع'), 'local suggestion follows the word being typed: ' + chips.join('|'));
    await page.waitForTimeout(900);
    // The mission's own vocabulary already covers this word, so no paid call is made for it.
    assert.equal(engineCalls.filter(c => c === 'ideas').length, ideasBefore, 'the model is not called while local suggestions are enough');
    checks.push(`${label}: local suggestions answer without calling the model`);

    // Now type something the vocabulary has nothing for: here the model is worth asking.
    await page.locator('.lmc-input').fill('زجاجة على رخامة جنبها أوراق شجر وضل ناعم جاي من الشباك');
    await page.waitForTimeout(1300);
    assert.ok(engineCalls.filter(c => c === 'ideas').length > ideasBefore, 'the model is asked once the vocabulary runs out');
    assert.ok((await page.locator('.lmc-chips button').allInnerTexts()).includes('زجاج مطفي'), 'AI ideas appear while typing');

    // Back to the short text the rest of the walkthrough builds on.
    await page.locator('.lmc-input').fill('زجاجة كحلي ل');
    await page.waitForTimeout(250);
    checks.push(`${label}: suggestions follow typing (local + AI ideas)`);
    await page.screenshot({ path: `${output}/${label}-2-question.png` });
    await page.getByRole('button', { name: 'لامع', exact: true }).click();
    await page.locator('.lmc-input').press('End');
    await page.locator('.lmc-input').type('بغطا فضي');
    await page.getByRole('button', { name: 'إرسال' }).click();

    // New or built on something existing: the answer decides whether a reference is needed.
    await page.getByTestId('question-content').and(page.locator('[data-slot=basis]')).waitFor();
    await page.locator('.lmc-option', { hasText: 'حاجة جديدة' }).click();
    await page.getByRole('button', { name: 'إرسال' }).click();
    checks.push(`${label}: asks whether it is new or built on something existing`);

    // "إعلان … لستوري" is ambiguous between ad and story, so the engine asks instead of guessing.
    await page.getByTestId('question-content').and(page.locator('[data-slot=usage]')).waitFor();
    // "Not clear?" is explained in simple words with quick answers, and the question stays open.
    await page.getByRole('button', { name: 'مش واضح؟' }).click();
    await page.getByText('يعني الصورة دي هتتنشر فين', { exact: false }).waitFor();
    assert.ok(await page.locator('[data-slot=usage]').count(), 'the same question stays open');
    checks.push(`${label}: "not clear" is explained and re-asked, not rejected`);
    await page.screenshot({ path: `${output}/${label}-2b-explained.png` });
    await page.locator('.lmc-option', { hasText: 'ستوري' }).click();
    await page.getByRole('button', { name: 'إرسال' }).click();
    checks.push(`${label}: ambiguous placement is asked, not guessed`);

    // Before the brief: a specialist's extra questions make the prompt stronger.
    await page.getByTestId('deepen-offer').waitFor();
    await page.getByRole('button', { name: /أيوه، ٣ أسئلة كمان/ }).click();
    await page.getByTestId('extra-question').waitFor();
    await page.screenshot({ path: `${output}/${label}-2c-extra.png` });
    await page.getByRole('button', { name: 'فخامة وغموض' }).click();
    checks.push(`${label}: extra "make it stronger" questions feed the brief`);
    const brief = page.getByTestId('brief');
    await brief.waitFor();
    const briefText = await brief.innerText();
    assert.match(briefText, /فخامة وغموض/, 'the extra answer is in the brief');
    assert.match(briefText, /9:16/);
    assert.match(briefText, /مفترض/, 'assumptions are marked as assumed');
    checks.push(`${label}: brief shows facts and visible assumptions with reasons`);
    await page.screenshot({ path: `${output}/${label}-3-brief.png`, fullPage: false });

    await brief.locator('li', { hasText: 'المقاس' }).click();
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

    // Follow-up: paste the tool reply → what is done, what went wrong, the next message to paste.
    await result.getByRole('button', { name: 'الزق رد الأداة' }).click();
    await result.locator('#lmc-ai-response').fill('Here is a description of the image you asked for. Ready for the next part?');
    await result.getByRole('button', { name: 'اقراه · هات الخطوة الجاية' }).click();
    await result.locator('.lmc-move').waitFor();
    const moveText = await result.innerText();
    assert.match(moveText, /الصورة الأساسية/);
    assert.match(moveText, /نسخة الستوري/);
    assert.match(moveText, /generate the image itself/);
    assert.ok(engineCalls.includes('next'));
    checks.push(`${label}: the tool reply is read back into done steps and the next message`);
    await page.screenshot({ path: `${output}/${label}-4-result.png` });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `no horizontal overflow (${overflow}px)`);
    await context.close();
  }

  // Photo first: the image is described and its facts fill the brief.
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await mockEngine(context);
    page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5290/#/lookers-ai');
    await page.getByRole('button', { name: 'DESIGN', exact: true }).waitFor();
    await page.waitForTimeout(900);
    await page.getByRole('button', { name: 'DESIGN', exact: true }).click();
    await page.locator('.mission-rings button').nth(1).click();
    await page.getByRole('button', { name: /Product Photo/ }).click();
    await page.getByTestId('mission-chat').waitFor();
    const dataUrl = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#1b2a4a'; x.fillRect(0, 0, 64, 64); return c.toDataURL('image/png'); });
    const png = Buffer.from(dataUrl.split(',')[1], 'base64');
    await page.getByTestId('photo-input').setInputFiles({ name: 'bottle.png', mimeType: 'image/png', buffer: png });
    await page.getByText('Here is what I see in your photo:', { exact: false }).waitFor();
    const q = page.getByTestId('question-content');
    await q.waitFor();
    assert.notEqual(await q.getAttribute('data-slot'), 'product', 'product came from the photo');
    assert.match(await page.getByTestId('mission-chat').innerText(), /DAVIDOFF/);
    checks.push('photo first: the photo is described and fills product and brand');
    await page.screenshot({ path: `${output}/photo-intake.png` });
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
  await page.getByRole('button', { name: 'DESIGN', exact: true }).click();
  // Later orbits hold the missions added after the first four; they must be reachable.
  await page.getByRole('button', { name: /^(Orbit|مدار) 3/ }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Logo Concept/ }).click();
  await page.getByTestId('mission-chat').waitFor();
  checks.push('a mission in a later orbit (Logo Concept) opens the engine chat');
  await context.close();

  assert.deepEqual(errors, []);
  assert.ok(engineCalls.includes('intake') && engineCalls.includes('compose') && engineCalls.includes('describe'));
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
