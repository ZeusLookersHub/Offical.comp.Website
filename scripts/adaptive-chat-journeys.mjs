import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.ADAPTIVE_QA_OUTPUT || 'node_modules/.cache/adaptive-chat-qa';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5283, strictPort: true } });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const checks = [], geometry = [], errors = [];
let page, context;
const button = name => page.getByRole('button', { name, exact: true });
const state = () => page.evaluate(() => {
  const workspace = JSON.parse(localStorage.getItem('lookers-ai-project-core-v1'));
  return workspace.sessions[workspace.currentProjectId].answers;
});
const active = () => page.getByTestId('active-question');
const send = () => active().getByRole('button', { name: 'Done · Send', exact: true }).click();
const text = async value => { await active().locator('textarea').fill(value); await send(); };
const measure = async label => {
  const box = await page.getByTestId('adaptive-chat').boundingBox();
  const viewport = page.viewportSize();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(width <= viewport.width, JSON.stringify({label,box,viewport,width}));
  assert.ok(box.y + box.height <= viewport.height + 1, JSON.stringify({label,box,viewport}));
  assert.ok(await active().count() <= 1);
  assert.equal(await page.locator('.lai-workspace').count(), 0, 'Legacy questionnaire must not render below chat');
  geometry.push({ label, ...box, viewport });
  return box;
};
async function enter(world = 'DESIGN', mission = 'Motion Design') {
  if (context) await context.close();
  context = await browser.newContext({ viewport: {width:1440,height:900}, reducedMotion: 'reduce' });
  await context.route('**/*.supabase.co/**', route => route.abort());
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5283/#/lookers-ai');
  await button(world).click(); await button(mission).click();
  await page.getByTestId('adaptive-chat').waitFor();
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#root > div.min-h-screen')).opacity) > .99);
}
const detailed = 'A video 15 seconds 9:16; scene: a verified amber perfume bottle; goal: introduce our fragrance; tool: Runway';
try {
  await server.listen();
  await enter();
  let requests = 0;
  page.on('request', request => {if (request.url().includes('.supabase.co/')) requests++;});
  await text(detailed);
  assert.equal(await active().count(), 0);
  assert.ok(await button('Generate result').isEnabled());
  assert.equal(requests, 0, 'No generation before an explicit user action');
  await measure('desktop-ready'); await page.screenshot({path:`${output}/desktop-ready.png`});
  await page.setViewportSize({width:390,height:844});
  await measure('mobile-ready'); await page.screenshot({path:`${output}/mobile-ready.png`});
  await button('Generate result').click();
  await page.getByLabel('Your prompt', {exact:true}).waitFor();
  assert.ok((await page.getByLabel('Your prompt', {exact:true}).inputValue()).includes('15 seconds'));
  assert.ok(requests > 0);
  await page.getByText('AI service unavailable.', {exact:false}).waitFor();
  checks.push('Detailed idea skips redundant questions; explicit Generate runs canonical path and displays honest offline fallback');

  await enter();
  const initial = await measure('desktop-idea');
  await text('video');
  assert.equal(await active().getAttribute('data-question-id'), 'videoSubject');
  const subjectBox = await measure('desktop-subject'); assert.ok(Math.abs(initial.height-subjectBox.height)<1);
  const beforeHelp = await state();
  await button('AR').click();
  await button('وضح لي السؤال').click();
  const help = await page.getByRole('note').innerText(); assert.match(help, /قولّي|تخيّل/); assert.match(help,/مثال/);
  assert.deepEqual(await state(), beforeHelp);
  assert.equal(await active().getAttribute('data-question-id'),'videoSubject');
  await page.setViewportSize({width:390,height:844});
  await measure('mobile-arabic-explain');
  const submitBox = await active().getByRole('button', {name:'تم · إرسال',exact:true}).boundingBox();
  const footerBox = await page.locator('.lai-adaptive-footer').boundingBox();
  assert.ok(submitBox.y + submitBox.height <= footerBox.y + 1, JSON.stringify({submitBox,footerBox}));
  const contentBox = await page.getByTestId('question-content').boundingBox();
  assert.ok(contentBox.y + contentBox.height <= submitBox.y, JSON.stringify({contentBox,submitBox}));
  await page.screenshot({path:`${output}/mobile-arabic-explain.png`});
  await button('EN').click(); await page.setViewportSize({width:1440,height:900});
  await text('An approved amber perfume bottle');
  const beforeBack = await state(); await button('Previous answer').click();
  await page.getByRole('heading',{name:'Previous confirmed answer'}).waitFor();
  assert.deepEqual(await state(), beforeBack); await button('Return to current step').click();
  await active().getByLabel('Product advertisement',{exact:true}).check();
  assert.equal((await state()).videoGoal,undefined,'Single choices must wait for Send'); await send();
  await active().getByLabel('15 seconds',{exact:true}).check(); await send();
  await active().getByLabel('Vertical · 9:16',{exact:true}).check(); await send();
  assert.equal(await active().count(),0);
  checks.push('Vague idea asks necessary questions; single selections wait for Send; Explain, language and backward navigation preserve confirmed answers');

  await button('Add optional refinements').click();
  await page.getByLabel('Optional refinement',{exact:true}).selectOption('videoAudio');
  await active().getByLabel('Voice-over',{exact:true}).check(); await send();
  await page.getByLabel('Optional refinement',{exact:true}).selectOption('voiceoverScript');
  await text('Meet your new fragrance');
  assert.equal((await state()).voiceoverScript,'Meet your new fragrance');
  await button('Skip refinements').click();
  assert.ok(await button('Generate result').isEnabled());
  // Actual existing upload capability: a synthetic, non-personal text fixture.
  await page.locator('input[type=file][multiple]').setInputFiles({name:'approved-brief.txt',mimeType:'text/plain',buffer:Buffer.from('APPROVED_UPLOAD_SENTINEL: preserve the amber label.')});
  await page.getByText('approved-brief.txt · Included',{exact:true}).waitFor();
  await button('Generate result').click(); await page.getByLabel('Your prompt',{exact:true}).waitFor();
  const prompt = await page.getByLabel('Your prompt',{exact:true}).inputValue();
  assert.ok(prompt.includes('Meet your new fragrance') && prompt.includes('APPROVED_UPLOAD_SENTINEL'));
  await measure('desktop-result'); await page.screenshot({path:`${output}/desktop-result.png`});
  for (const width of [1024,736,390,320]) {
    await page.setViewportSize({width,height:844}); await measure(`result-${width}`);
    if (width===390) await page.screenshot({path:`${output}/mobile-result.png`});
  }
  checks.push('Conditional optional voice-over saved; skipping refinements still allows generation; uploaded text and optional answers reach the rendered prompt');

  await enter('MARKETING','Campaign');
  await text('A launch campaign');
  await text('Verified offer: 10 percent off coffee');
  await active().getByLabel('Sales',{exact:true}).check(); await send();
  await text('Customers in Cairo');
  await active().getByLabel('I will publish it',{exact:true}).check(); await send();
  await button('Add optional refinements').click();
  await page.getByLabel('Optional refinement',{exact:true}).selectOption('channels');
  await active().getByLabel('Meta',{exact:true}).check();
  await active().getByLabel('Google',{exact:true}).check();
  assert.equal((await state()).channels,undefined);
  await measure('desktop-multi-choice'); await page.screenshot({path:`${output}/desktop-multi-choice.png`});
  await send(); assert.deepEqual((await state()).channels,['meta','google']);
  assert.ok(await button('Generate result').isEnabled());
  checks.push('Multiple choices stay staged until Done/Send; both saved choices are retained without blocking generation');
  assert.deepEqual(errors,[]);
  await writeFile(`${output}/report.json`,JSON.stringify({checks,geometry,errors,journeys:10,provider:'Supabase request failure deliberately simulated; real DeepSeek response is not claimed',browser:'Chromium',status:'success'},null,2));
  console.log(JSON.stringify({status:'success',journeys:10,checks,geometry,errors},null,2));
} catch (error) {
  if(page) {await page.screenshot({path:`${output}/failure.png`}); console.error(await page.locator('body').innerText());}
  await writeFile(`${output}/report.json`,JSON.stringify({status:'failure',checks,geometry,errors,error:String(error)},null,2));
  throw error;
} finally {await browser.close();await server.close();}
