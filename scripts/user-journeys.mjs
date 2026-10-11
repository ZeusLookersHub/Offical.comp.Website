import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

// Actual React application. Live mode is opt-in and permits exactly two attempts,
// with no retries; CI uses the application's labelled offline fallback.
const live = process.env.JOURNEY_LIVE === '1';
const out = process.env.JOURNEY_OUTPUT || 'visual-qa-artifacts/journeys';
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: true } });
const proxyURL = process.env.JOURNEY_PROXY === '1' && process.env.HTTPS_PROXY ? new URL(process.env.HTTPS_PROXY) : undefined;
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_BROWSER_EXECUTABLE || undefined,
  proxy: proxyURL ? { server: proxyURL.origin, bypass: 'localhost,127.0.0.1' } : undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({ ignoreHTTPSErrors: Boolean(proxyURL), permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage(); page.setDefaultTimeout(30000);
const checks = [], errors = [], network = [], provenance = [];
let providerAttempts = 0;
page.on('pageerror', e => errors.push(e.message));
page.on('dialog', dialog => dialog.accept());
await context.route('**/*.supabase.co/**', async route => {
  const request = route.request();
  if (request.method() === 'POST' && request.url().includes('/functions/')) {
    providerAttempts++;
    if (!live || providerAttempts > 2) return route.abort('blockedbyclient');
    const body = request.postDataJSON();
    assert.deepEqual(Object.keys(body).sort(), ['language', 'prompt']);
    assert.ok(body.prompt.includes('Confirmed amber bottle'));
    assert.ok(body.prompt.includes('4:5'));
    assert.ok(body.prompt.includes('APPROVED_REFERENCE'));
    assert.ok(!body.prompt.includes('EXCLUDED_SENTINEL'));
  }
  if (!live) return route.abort('blockedbyclient');
  return route.continue();
});
page.on('response', async response => {
  if (!response.url().includes('.supabase.co/')) return;
  network.push({ endpoint: new URL(response.url()).pathname, status: response.status() });
  if (response.url().includes('/functions/') && response.status() === 200) {
    const result = await response.json();
    assert.equal(result.identity?.isAnonymous, true);
    provenance.push({ ...result.data.provenance, usage: result.data.usage });
  }
});
const button = name => page.getByRole('button', { name, exact: true });
const heading = name => page.getByRole('heading', { name, exact: true });
const workspace = () => page.evaluate(() => JSON.parse(localStorage.getItem('lookers-ai-project-core-v1')));
const active = async () => { const w = await workspace(); return { project: w.projects.find(p => p.id === w.currentProjectId), session: w.sessions[w.currentProjectId] }; };
const check = name => { checks.push(name); console.log(`PASS ${name}`); };
async function result() {
  await heading('Your prompt is ready').waitFor();
  const fallback = await page.getByText('AI was unavailable.', { exact: false }).count();
  assert.equal(Boolean(fallback), !live, live ? 'Live inference must not silently pass as local fallback' : 'Offline result must disclose fallback');
  const prompt = await page.getByRole('textbox', { name: 'Your prompt', exact: true }).inputValue();
  assert.ok(prompt.length > 80); return prompt;
}
try {
  await mkdir(out, { recursive: true }); await server.listen();
  await page.goto('http://localhost:5173/#/lookers-ai', { waitUntil: 'networkidle' });
  assert.equal(await button('Start building').isDisabled(), true); check('Empty idea blocks starting');
  await button('Prompt Library').click(); await page.locator('.lai-library-card').first().waitFor();
  await button('All').click(); assert.equal(await page.locator('.lai-library-card').count(), 24);
  await page.getByLabel('Category', { exact: true }).selectOption('productivity');
  await page.getByText('No prompts match yet.', { exact: false }).waitFor(); await button('Clear filters').click();
  await button('Editorial picks').click(); await page.getByText('Editorial picks, not popularity metrics.', { exact: true }).waitFor();
  await page.getByRole('searchbox', { name: 'Search prompts' }).fill('product photo');
  await page.locator('.lai-library-card').getByRole('button', { name: 'Details', exact: true }).click();
  assert.equal(await button('Use prompt').isDisabled(), true);
  await page.locator('#library-product').fill('Confirmed amber bottle with approved cream label');
  assert.equal(await page.locator('#library-tool').count(), 0); await button('Use prompt').click();
  await heading('Add useful references').waitFor();
  const initial = await active(); const projectId = initial.project.id;
  assert.deepEqual(initial.project.schema.targetTools, []); assert.equal(initial.session.generatedPrompt, undefined);
  check('Library search, categories, curated picks, validation and customized project creation');
  await page.locator('input[type=file][multiple]').setInputFiles([
    { name: 'approved.txt', mimeType: 'text/plain', buffer: Buffer.from('APPROVED_REFERENCE: preserve the real cream label') },
    { name: 'excluded.txt', mimeType: 'text/plain', buffer: Buffer.from('EXCLUDED_SENTINEL') },
    { name: 'unread.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF QA placeholder, not readable text') },
  ]);
  await page.locator('.lai-file').nth(1).getByRole('checkbox').uncheck();
  await page.locator('.lai-file').nth(2).getByText('Not inspected', { exact: true }).waitFor();
  await button('Continue').click(); await button('Review brief').click(); await button('Create my prompt').click();
  await page.getByRole('alert').filter({ hasText: 'Which aspect ratio' }).waitFor();
  assert.equal(providerAttempts, 0); assert.equal((await active()).session.step, 'details');
  check('Missing canonical input is shown to user and blocks provider');
  await button('Portrait · 4:5').click(); await button('Review brief').click(); await button('Create my prompt').click();
  const prompt = await result(); assert.equal((await active()).project.id, projectId);
  await button('Copy').click(); assert.equal(await page.evaluate(() => navigator.clipboard.readText()), prompt);
  const waitDownload = page.waitForEvent('download'); await button('Download').click(); const download = await waitDownload;
  assert.ok(download.suggestedFilename().endsWith('.md')); assert.equal(await readFile(await download.path(), 'utf8'), prompt);
  await button('Edit').click(); await page.getByRole('textbox', { name: 'Your prompt', exact: true }).fill(prompt + '\nUSER_REVIEWED');
  await button('Finish editing').click(); assert.ok((await active()).session.generatedPrompt.endsWith('USER_REVIEWED'));
  await page.reload({ waitUntil: 'networkidle' }); assert.equal((await active()).project.id, projectId);
  assert.ok((await active()).session.generatedPrompt.endsWith('USER_REVIEWED'));
  check('Actual result, clipboard, exact Markdown download, edits and persistence');
  await button('Use with your tool').click(); await button('All AI tools').click(); await page.locator('[data-tool-section="all"] [data-tool-id="claude"]').getByRole('button', {name:'Use with Claude',exact:true}).click(); await page.getByText('Ready to copy into Claude.', { exact: false }).waitFor();
  await page.locator('#lai-external-reply').fill('USER_FEEDBACK: Keep the cream label unchanged.'); await button('Fix').click(); await button('Review next step').click();
  const continued = await active(); assert.equal(continued.project.id, projectId); assert.ok(continued.project.schema.context.includes('USER_FEEDBACK'));
  assert.equal(continued.project.schema.references.find(r => r.name === 'excluded.txt').included, false);
  await button('Create my prompt').click(); await result(); assert.equal((await active()).project.id, projectId);
  if (live) { assert.equal(providerAttempts, 2); assert.equal(provenance.length, 2); assert.ok(provenance.every(p => p.providerId === 'deepseek')); }
  check('Tool preparation, same-project continuation and second bounded generation');
  await button('Start over').click(); await heading('What would you like to make?').waitFor();
  const empty = await active(); assert.notEqual(empty.project.id, projectId); assert.equal(empty.project.schema.intent, ''); assert.equal(empty.project.schema.references.length, 0);
  await page.locator('.lai-history > summary').click();
  await page.locator('.lai-history-grid button').first().click(); const restored = await active();
  assert.equal(restored.project.id, projectId); assert.ok(restored.project.schema.context.includes('USER_FEEDBACK'));
  assert.equal(restored.project.schema.references.find(r => r.name === 'excluded.txt').included, false);
  check('Start Over clears current draft and archive restore restores the actual active project');
  await page.locator('.lai-result-actions').getByRole('button', { name: 'Improve', exact: true }).click(); await heading('Review your project').waitFor(); assert.equal((await active()).project.id, projectId);
  await button('Back').click(); check('Improve retains the active project and opens review');
  await page.locator('.lai-task-selector > summary').click(); await page.locator('.lai-task-card').filter({ hasText: 'General task' }).click();
  await button('Back').click(); await button('Back').click(); await button('Start building').click();
  assert.equal((await active()).session.taskType, 'general'); check('Manual task type survives returning to start');
  await button('AR').click(); await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator('.lookers-ai').getAttribute('dir'), 'rtl'); await button('مكتبة البرومبت').click();
  await page.locator('.lai-library-card').first().waitFor(); await page.getByRole('searchbox').fill('صورة منتج');
  assert.ok(await page.locator('.lai-library-card').count()); check('Arabic mobile flow and bilingual library search');
  await page.setViewportSize({ width: 1440, height: 900 }); await button('EN').click();
  await context.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Storage unavailable', 'QuotaExceededError'); }; });
  await page.reload({ waitUntil: 'networkidle' }); await button('Continue').click(); await page.locator('#lai-purpose').fill('Unsaved user correction');
  await page.getByText('Could not save on this device.', { exact: false }).waitFor();
  assert.equal(await page.locator('#lai-purpose').inputValue(), 'Unsaved user correction'); check('Storage failure is disclosed and in-memory work remains usable');
  assert.deepEqual(errors, []);
  await writeFile(`${out}/report.json`, JSON.stringify({ live, checks, runtimeErrors: errors, providerAttempts, network, provenance, origin: 'http://localhost:5173' }, null, 2));
  console.log(`Completed ${checks.length} real-browser journey checks; live=${live}; provider attempts=${providerAttempts}.`);
} catch (error) {
  await writeFile(`${out}/failure.json`, JSON.stringify({ live, checks, runtimeErrors: errors, providerAttempts, network, error: error.message }, null, 2));
  throw error;
} finally { await browser.close(); await server.close(); }
