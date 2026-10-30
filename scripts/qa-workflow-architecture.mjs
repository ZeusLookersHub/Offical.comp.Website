import { chromium } from 'playwright';
import { readFile,writeFile } from 'node:fs/promises';import {existsSync}from'node:fs';import {pathToFileURL,fileURLToPath}from'node:url';import assert from'node:assert/strict';
const root=process.argv[2]; if(!root)throw Error('Pass the generated atlas directory');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const checks=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(root+'/index.html').href);
 assert.equal(await page.locator('#taxonomy > details').count(),13);checks.push('13 category groups');
 await page.locator('#taxonomy > details').first().locator('summary').first().click();assert.ok(await page.getByText('فكرة لوجو',{exact:false}).isVisible());checks.push('category expands into branches and readable topics');
 const links=await page.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));for(const href of links){if(href.startsWith('#')||/^https?:/.test(href))continue;assert.ok(existsSync(fileURLToPath(new URL(href,pathToFileURL(root+'/index.html')))),href);}checks.push('all local diagram links resolve');
 assert.equal(await page.locator('#flows .card').count(),16);assert.equal(await page.locator('#repos tr').count(),26);checks.push('16 workflow detail cards and 25 repository decisions');
 for(const width of [1440,768,390]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push('index fits '+width+'px');}
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:root+'/index-preview.png'});
 await page.goto(pathToFileURL(root+'/taxonomy-creative/taxonomy-creative.html').href);await page.waitForTimeout(400);const text=await page.locator('body').innerText();console.log('TREE_TEXT',text.slice(0,650));checks.push('native taxonomy opens');
 assert.deepEqual(errors,[]);await writeFile(root+'/index-qa.json',JSON.stringify({status:'passed',checks,errors},null,2));console.log(JSON.stringify({status:'passed',checks,errors},null,2));
}finally{await browser.close();}
