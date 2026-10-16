import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const output = process.env.TRENDS_QA_OUTPUT || 'node_modules/.cache/trends-header-qa';
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5182, strictPort: true } });
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_BROWSER_EXECUTABLE || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const errors = [], checks = [];
let inferenceRequests = 0;
page.on('pageerror', error => errors.push(error.message));
await context.route('**/*.supabase.co/**', route => { inferenceRequests++; return route.abort(); });
const header = page.locator('.lai-trends-header');
const popover = header.locator('.lai-trends-popover');
const headline = name => header.getByRole('button', { name, exact: true });
const storage = () => page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => key.startsWith('lookers-ai-project-'))));
const coreMarkup = () => page.evaluate(() => ['.lookers-ai__hero', '.lai-workspace'].map(selector => document.querySelector(selector)?.outerHTML.replace(/ style=""/g, '')));
async function capture(name) {
  await page.evaluate(async () => { await document.fonts.ready; });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${name}`);
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: false });
}
try {
  await server.listen();
  await page.goto('http://127.0.0.1:5182/#/lookers-ai', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#root > .min-h-screen')).opacity) > .99);
  await page.locator('#lai-idea').fill('PRESERVED_DRAFT: A skincare launch with real packaging.');
  await page.evaluate(async () => { await document.fonts.ready; });
  const beforeStorage = await storage(), beforeMarkup = await coreMarkup();
  const heroPosition = await page.locator('.lookers-ai__hero').boundingBox();
  await headline('AI Image Trends').hover();
  await popover.waitFor({ state: 'visible' });
  assert.equal(await header.locator('.lai-trends-item').count(), 3);
  const itemTitles = ['Cinematic portrait', 'Miniature worlds', 'Product editorial'];
  for (const name of itemTitles) {
    await header.getByRole('button', { name, exact: true }).hover();
    await page.waitForFunction(title => document.querySelector('.lai-trends-preview h2')?.textContent === title, name);
    assert.ok(await header.getByRole('img', { name: 'Illustration: ' + name }).count());
  }
  assert.deepEqual(await page.locator('.lookers-ai__hero').boundingBox(), heroPosition, 'dropdown must overlay, not push the tool');
  const previewBounds = await header.locator('.lai-trends-preview').boundingBox();
  await page.mouse.move(2, 600);
  await page.waitForTimeout(100);
  assert.equal(await popover.isVisible(), true, 'short accidental exit must not close the menu');
  await page.mouse.move(previewBounds.x + previewBounds.width / 2, previewBounds.y + previewBounds.height / 2);
  await page.waitForTimeout(330);
  assert.equal(await popover.isVisible(), true, 're-entry cancels dismissal');
  await page.mouse.move(2, 600);
  await popover.waitFor({ state: 'hidden' });
  checks.push('Hover previews, short-exit tolerance, re-entry cancellation, bounded dismissal, no tool layout shift');

  const sections = ['AI Image Trends', 'AI Video Trends', 'Social Media Trends', 'Prompt Trends', 'Creative Experiments'];
  for (const name of sections) {
    await headline(name).hover();
    await page.waitForFunction(title => document.querySelector('.lai-trends-section-label')?.textContent === title, name);
  }
  await headline('Creative Experiments').click();
  await page.mouse.move(2, 600); await page.waitForTimeout(350);
  assert.equal(await popover.isVisible(), true, 'click keeps the panel open');
  await headline('Creative Experiments').click();
  assert.equal(await popover.isVisible(), false);
  await headline('AI Image Trends').click();
  await headline('Preview prompt').click();
  assert.equal(await header.locator('.lai-trends-prompt').isVisible(), true);
  const example = await header.locator('.lai-trends-prompt p').textContent();
  await headline('Copy example').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), example);
  await capture('01-desktop-en-image');
  await page.keyboard.press('Escape');
  assert.equal(await popover.isVisible(), false);
  assert.equal(await headline('AI Image Trends').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('ArrowDown');
  assert.equal(await header.locator('.lai-trends-item').first().evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('ArrowDown');
  assert.equal(await header.locator('.lai-trends-preview h2').textContent(), 'Miniature worlds');
  await page.keyboard.press('Escape');
  await headline('AI Video Trends').click();
  await page.mouse.click(2, 600);
  assert.equal(await popover.isVisible(), false);
  assert.deepEqual(await storage(), beforeStorage);
  assert.deepEqual(await coreMarkup(), beforeMarkup);
  checks.push('All five headlines, click toggle, prompt disclosure, keyboard arrows, Escape focus, outside click; draft and tool DOM unchanged');

  await headline('Prompt Library').click();
  await page.locator('.lai-library-card').first().waitFor();
  assert.equal(await page.getByRole('searchbox').count(), 1);
  assert.equal(await popover.isVisible(), false);
  await page.getByRole('button', { name: 'Back to my project', exact: true }).click();
  await headline('AI tools').click();
  await page.locator('.lai-tool-directory').waitFor();
  await page.getByRole('button', { name: 'Back to my project', exact: true }).click();
  assert.equal(await page.locator('#lai-idea').inputValue(), 'PRESERVED_DRAFT: A skincare launch with real packaging.');
  assert.deepEqual(await storage(), beforeStorage);
  checks.push('Existing Prompt Library and AI tools remain independent and preserve the active project');

  await headline('AR').click();
  assert.equal(await page.locator('.lookers-ai').getAttribute('dir'), 'rtl');
  const arabicSections = ['ترندات صور AI', 'ترندات فيديو AI', 'ترندات السوشيال ميديا', 'ترندات البرومبتات', 'تجارب إبداعية'];
  for (const name of arabicSections) assert.equal(await headline(name).count(), 1);
  await headline('ترندات صور AI').click();
  await header.getByRole('button', { name: 'تصوير منتجات إبداعي', exact: true }).click();
  await capture('02-desktop-ar-image');
  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await capture(`03-ar-width-${width}`);
  }
  await headline('إغلاق الترندات').click();
  await headline('مكتبة البرومبت').click();
  await page.locator('.lai-library-card').first().waitFor();
  await page.getByRole('button', { name: 'ارجع لمشروعي', exact: true }).click();
  assert.equal(await page.locator('#lai-idea').inputValue(), 'PRESERVED_DRAFT: A skincare launch with real packaging.');
  await headline('EN').click();
  await headline('Social Media Trends').click();
  await header.getByRole('button', { name: 'Educational carousel', exact: true }).click();
  await capture('04-mobile-en-social');
  checks.push('Arabic/English navigation, previews, library and close controls; RTL/LTR and 320–1440px layouts');

  await headline('Back to LookersHub website').click();
  await page.waitForFunction(() => location.hash === '#/');
  await page.locator('.lai-trends-header').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.lai-trends-header').count(), 0);
  assert.ok(await page.locator('#root > .min-h-screen > header').count());
  assert.deepEqual(await storage(), beforeStorage);
  assert.equal(inferenceRequests, 0);
  assert.deepEqual(errors, []);
  checks.push('Back returns to the original public header; no inference requests or runtime errors');
  await writeFile(`${output}/report.json`, JSON.stringify({ checks, errors, inferenceRequests }, null, 2));
  console.log(checks.map(value => `PASS: ${value}`).join('\n'));
} finally {
  await browser.close();
  await server.close();
}
