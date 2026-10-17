import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const out=process.env.TRENDS_QA_OUTPUT||'node_modules/.cache/trends-header-qa';
await mkdir(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true}});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*.supabase.co/**',r=>r.abort());
try{
 await server.listen();await page.goto('http://127.0.0.1:5173/#/lookers-ai');await page.getByRole('button',{name:'EN',exact:true}).click();
 await page.locator('#lai-idea').fill('Preserve this user-owned brief');
 const state=await page.evaluate(()=>localStorage.getItem('lookers-ai-project-core-v1'));
 for(const name of ['AI Image Trends','AI Video Trends','Social Media Trends','Prompt Trends','Creative Experiments']){
  const trigger=page.getByRole('button',{name,exact:true}),popover=page.locator('.lai-trends-popover');
  await trigger.hover();assert.equal(await popover.isVisible(),false,'hover must not open');await trigger.click();await popover.waitFor();
  assert.equal(await page.locator('.lai-trends-item').count(),3);
  for(let i=0;i<3;i++){await page.locator('.lai-trends-item').nth(i).click();await page.getByRole('button',{name:'Preview prompt',exact:true}).click();assert.ok((await page.locator('.lai-trends-prompt p').textContent()).length>20);}
  await page.keyboard.press('Escape');assert.equal(await popover.isVisible(),false);
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('lookers-ai-project-core-v1')),state);
 checks.push('All five click-only dropdowns and fifteen examples preserve project state');
 const trigger=page.getByRole('button',{name:'AI Image Trends',exact:true});await trigger.focus();await page.keyboard.press('ArrowDown');await page.locator('.lai-trends-item').first().waitFor();assert.equal(await page.locator('.lai-trends-item').first().evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Escape');
 for(const lang of ['AR','EN']){await page.getByRole('button',{name:lang,exact:true}).click();for(const width of [1440,1024,768,660,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${lang} ${width}`);assert.equal(await page.locator('.site-ai-button').isVisible(),true);assert.equal(await page.locator('.site-nav a').count(),5);await page.screenshot({path:`${out}/${lang}-${width}.png`});}}
 await page.locator('.site-logo-link').click();await page.waitForURL('**/#/');await page.locator('.lai-trends-header').waitFor({state:'detached'});assert.equal(await page.locator('.site-header').count(),1);
 checks.push('Keyboard access, bilingual 320–1440 layouts, external mobile AI button and website navigation');assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
}finally{await browser.close();await server.close();}
