import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

// Actual browser + actual React application. No paid calls or mocked AI success.
// CI deliberately exercises the existing, labelled local fallback.
const out = process.env.VISUAL_QA_OUTPUT || 'visual-qa-artifacts';
await mkdir(out, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: true } });
const proxyURL = process.env.VISUAL_QA_PROXY === '1' && process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : undefined;
const proxy = proxyURL ? {server:proxyURL.origin,bypass:'127.0.0.1,localhost',...(proxyURL.username ? {username:decodeURIComponent(proxyURL.username),password:decodeURIComponent(proxyURL.password)} : {})} : undefined;
const browser = await chromium.launch({ headless: true, proxy, executablePath: process.env.QA_BROWSER_EXECUTABLE || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const manifest = [];
const errors = [];
const requestFailures = [];
const live = process.env.VISUAL_QA_LIVE === '1';
const network = [];
let resultSource = 'local';
const context = await browser.newContext({ ignoreHTTPSErrors: Boolean(proxy), viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
if (!live) await context.route('**/*.supabase.co/**', route => route.abort('blockedbyclient'));
page.on('requestfailed', request => {if(request.url().includes('.supabase.co/')) requestFailures.push({endpoint:new URL(request.url()).pathname,error:request.failure()?.errorText});});
page.on('response', response => { if(response.url().includes('.supabase.co/')) network.push({ endpoint:new URL(response.url()).pathname, status:response.status() }); });
async function ready() {
  await page.waitForFunction(() => {
    const shell = document.querySelector('#root > .min-h-screen');
    const header = document.querySelector('#root > .min-h-screen > header');
    return shell && Number(getComputedStyle(shell).opacity) > .99 && (scrollY <= 50 || header?.className.includes('bg-navy/95') || Boolean(document.querySelector('.lai-trends-header')));
  }, undefined, { timeout: 30000 });
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); await Promise.all([...document.images].map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; }))); });
}
async function shot(name, state, focus) {
  if (focus) await page.locator(focus).first().evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 110));
  else await page.evaluate(() => window.scrollTo(0, 0));
  await ready();
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
  const metrics = await page.evaluate(() => ({ width:innerWidth, height:innerHeight, documentWidth:document.documentElement.scrollWidth, direction:document.querySelector('.lookers-ai').getAttribute('dir'), fontsReady:document.fonts.status, loadedFonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family), heroFont:getComputedStyle(document.querySelector('.lookers-ai__hero h1')).fontSize }));
  if (metrics.documentWidth > metrics.width) throw new Error(`Horizontal overflow in ${name}: ${metrics.documentWidth}/${metrics.width}`);
  manifest.push({ name, state, ...metrics, resultSource: state === 'Result' ? resultSource === 'ai' ? 'actual AI response' : 'actual application local fallback' : undefined });
}
try {
  await server.listen();
  await page.goto('http://localhost:5173/#/lookers-ai', { waitUntil: 'networkidle' });
  await page.getByRole('button', {name:'EN', exact:true}).click();
  await shot('01-desktop-home', 'Home');
  await page.locator('#lai-idea').fill('Create a premium product photo for Instagram');
  await page.getByRole('button', {name:'Start building', exact:true}).click();
  await page.locator('input[type=file][multiple]').setInputFiles([
    {name:'product-brief.txt',mimeType:'text/plain',buffer:Buffer.from('Premium skincare bottle. Preserve the real product label. Use a charcoal stone surface and soft studio lighting.')},
    {name:'old-lighting-notes.txt',mimeType:'text/plain',buffer:Buffer.from('Excluded reference: bright red background.')}
  ]);
  await page.locator('.lai-file').nth(1).getByRole('checkbox').uncheck();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.locator('#lai-purpose').fill('A premium portrait Instagram campaign image, with faithful packaging.');
  await shot('02-desktop-workspace','Workspace','.lai-card');
  await page.locator('#lai-subject').fill('A premium skincare bottle on charcoal stone');
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await page.getByRole('button',{name:'Portrait · 4:5',exact:true}).click();
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  const question = page.locator('.lai-task-questions');
  const option = question.locator('.lai-option').first();
  if (await option.count()) await option.click();
  else await question.locator('input,textarea').first().fill('A premium skincare bottle on charcoal stone');
  await shot('03-desktop-question','Question','.lai-task-questions');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await shot('04-desktop-references','References','.lai-card');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Review brief',exact:true}).click();
  await page.getByRole('button',{name:'Create my prompt',exact:true}).click();
  await page.getByRole('heading',{name:'Your prompt is ready',exact:true}).waitFor();
  resultSource = await page.getByText('AI was unavailable.',{exact:false}).count() ? 'local' : 'ai';
  if(!live && resultSource !== 'local') throw new Error('Offline run unexpectedly reported AI success');
  await shot('05-desktop-result','Result','.lai-result-card');
  await page.setViewportSize({width:390,height:844});
  await shot('08-mobile-result','Result','.lai-result-card');
  const promptBefore = await page.getByRole('textbox',{name:'Your prompt',exact:true}).inputValue();
  const downloadWait = page.waitForEvent('download');
  await page.getByRole('button',{name:'Download',exact:true}).click();
  const download = await downloadWait;
  if(!download.suggestedFilename().endsWith('.md')) throw new Error('Prompt download is not Markdown');
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByRole('textbox',{name:'Your prompt',exact:true}).fill(promptBefore+'\nUser-reviewed prompt wording.');
  await page.getByRole('button',{name:'Finish editing',exact:true}).click();
  await page.getByRole('button',{name:'Use with your tool',exact:true}).click();
  await page.getByRole('button',{name:'All AI tools',exact:true}).click();
  await page.locator('[data-tool-section="all"] [data-tool-id="claude"]').getByRole('button',{name:'Use with Claude',exact:true}).click();
  await page.getByText('Ready to copy into Claude.',{exact:false}).waitFor();
  await page.locator('#lai-external-reply').fill('QA example response: packaging is distorted. Keep the original label.');
  await page.getByRole('button',{name:'Fix',exact:true}).click();
  await page.getByRole('button',{name:'Review next step',exact:true}).click();
  const savedAfterContinuation = await page.evaluate(()=>JSON.parse(localStorage.getItem('lookers-ai-project-core-v1')));
  if(!JSON.stringify(savedAfterContinuation).includes('packaging is distorted')) throw new Error('Continuation context was lost');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await shot('07-mobile-question','Question','.lai-task-questions');
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await shot('06-mobile-home','Home');
  // Switch the actual mobile navigation language, not a fabricated state.
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'AR',exact:true}).click();
  await shot('09-arabic-desktop-home','Arabic Home');
  await page.getByRole('button',{name:'ابدأ التجهيز',exact:true}).click();
  await page.getByRole('button',{name:'تابع',exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  await shot('10-arabic-mobile-question','Arabic Question','.lai-task-questions');
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'EN',exact:true}).click();
  await page.getByRole('button',{name:'Prompt Library',exact:true}).click();
  await page.getByRole('heading',{name:'A starting point for your idea',exact:true}).waitFor();
  await page.locator('.lai-library-card').first().waitFor();
  await shot('11-desktop-library','Library','.lai-library');
  await page.getByRole('searchbox',{name:'Search prompts'}).fill('product photo');
  const libraryCard=page.locator('.lai-library-card').first();
  await libraryCard.getByRole('button',{name:'Customize & use',exact:true}).click();
  await page.getByRole('textbox',{name:'Product and packaging'}).fill('Verified amber skincare bottle with a cream label');
  await shot('12-desktop-library-detail','Library detail','.lai-library');
  await page.setViewportSize({width:390,height:844});
  await shot('13-mobile-library-detail','Library detail','.lai-library');
  await page.getByRole('button',{name:'Use prompt',exact:true}).click();
  await page.getByRole('heading',{name:'Add useful references',exact:true}).waitFor();
  if(await page.locator('#lai-purpose').count()) throw new Error('Library unexpectedly skipped reference setup');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Prompt Library',exact:true}).click();
  await page.getByRole('button',{name:'Recently used',exact:true}).click();
  await page.locator('.lai-library-card').filter({hasText:'Premium product photo'}).waitFor();
  await page.getByRole('searchbox',{name:'Search prompts'}).fill('zzzz no match');
  await page.getByText('No prompts match yet.',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await page.getByRole('button',{name:'Editorial picks',exact:true}).click();
  await page.getByText('Editorial picks, not popularity metrics.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Back to my project',exact:true}).click();
  await page.getByRole('heading',{name:'A few details for a stronger result',exact:true}).waitFor();
  await page.reload({waitUntil:'networkidle'});
  await ready();
  await page.getByRole('heading',{name:'A few details for a stronger result',exact:true}).waitFor();
  await page.locator('.lai-history > summary').click();
  await page.locator('.lai-history-grid button').first().click();
  const restored = await page.evaluate(()=>JSON.parse(localStorage.getItem('lookers-ai-project-core-v1')));
  if(!JSON.stringify(restored).includes('packaging is distorted') || !JSON.stringify(restored).includes('old-lighting-notes.txt')) throw new Error('Archived project restore lost context or references');
  await writeFile(`${out}/manifest.json`,JSON.stringify({screenshots:manifest, runtimeErrors:errors, providerCalls:network.filter(n=>n.endpoint.includes('/functions/')).length, network, requestFailures, live, resultSource, appOrigin:'http://localhost:5173',notes:'Screenshots are raw browser viewports. Result is generated by the application fallback, not invented.'},null,2));
  if (errors.length) throw new Error(`Browser runtime errors: ${errors.join('; ')}`);
  console.log(`Captured ${manifest.length} actual application viewports; live mode: ${live}; result: ${resultSource}.`);
} finally { await browser.close(); await server.close(); }
