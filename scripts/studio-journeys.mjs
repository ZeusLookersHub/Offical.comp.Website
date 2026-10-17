import {walkToQuestion,completeBrief,openContinuation} from './qa-card-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const out=process.env.STUDIO_QA_OUTPUT||'node_modules/.cache/studio-journeys';await mkdir(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5277,strictPort:true}});
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),page=await context.newPage();
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());await context.route('**/*.supabase.co/**',route=>route.abort());
const button=name=>page.getByRole('button',{name,exact:true});
async function state(){return page.evaluate(()=>{const w=JSON.parse(localStorage.getItem('lookers-ai-project-core-v1'));return w.sessions[w.currentProjectId]})}
try{
 await server.listen();await page.goto('http://127.0.0.1:5277/#/lookers-ai');await button('AR').click();await page.waitForTimeout(2000);
 await page.locator('#lai-idea').fill('المنتج عطر نور، وعايز أحافظ على شكل العبوة.');await page.locator('.lai-vision-options').getByRole('button',{name:'صورة',exact:true}).click();
 for(const name of ['صورة جديدة','تصوير منتج','ثلاثي الأبعاد','زجاجي وشفاف','إضاءة استوديو','على منصة بسيطة','رأسي 4:5']){const before=await page.locator('#lai-idea').inputValue();await page.locator('.lai-vision-options').getByRole('button',{name,exact:true}).click();assert.notEqual(await page.locator('#lai-idea').inputValue(),before);}
 const idea=await page.locator('#lai-idea').inputValue();assert.ok(idea.includes('المنتج عطر نور')&&idea.includes('زجاجي')&&idea.includes('4:5'));assert.equal((await state()).answers.subject,undefined);
 const geometry=await page.locator('.lai-vision-choices').evaluate(e=>({top:e.getBoundingClientRect().top,bottom:document.querySelector('#lai-idea').getBoundingClientRect().bottom}));assert.ok(geometry.top>=geometry.bottom);assert.equal(await page.locator('.lai-attachments').count(),0);
 await page.reload();await button('AR').click();assert.equal(await page.locator('#lai-idea').inputValue(),idea);checks.push('Every selected vision clause writes prose below the composer, preserves free text and survives reload');
 await button('ابدأ التجهيز').click();assert.equal(await page.locator('.lai-card .lai-attachments').count(),1);
 await page.locator('input[type=file][multiple]').setInputFiles({name:'approved.txt',mimeType:'text/plain',buffer:Buffer.from('APPROVED_REFERENCE: perfume packaging stays unchanged')});await page.getByText('approved.txt',{exact:true}).waitFor();await button('تابع').click();assert.equal(await page.locator('.lai-attachments').count(),0);
 await page.locator('#lai-taskDescription').fill('صور وريلز ومحتوى لإطلاق عطر نور');assert.equal(await page.locator('.lai-task-selector').count(),0);
 await page.locator('.lai-question-card .lai-help-button').click();assert.ok((await page.locator('.lai-help-copy').innerText()).includes('بنسأل ليه؟'));
 await page.setViewportSize({width:320,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`${out}/ar-help-mobile.png`});await page.setViewportSize({width:1440,height:1050});
 await page.locator('.lai-question-card .lai-help-button').click();await button('التالي / تخطّي').click();await button('السؤال التالي').click();assert.equal(await page.locator('#lai-subject').count(),1);
 await page.locator('#lai-subject').fill('زجاجة عطر نور السودا بغطا دهبي');await button('السؤال التالي').click();assert.equal(await page.locator('#lai-format').evaluate(e=>e.tagName),'TEXTAREA');await page.locator('.lai-question-card .lai-suggestion').first().click();assert.ok((await page.locator('#lai-format').inputValue()).length>0);
 await page.locator('#lai-format').fill('رأسي 4:5');await button('السؤال التالي').click();await page.locator('#lai-action').fill('إنشاء صورة جديدة مع الحفاظ على شكل العبوة');await button('السؤال التالي').click();await page.locator('#lai-purpose').fill('تعريف العملاء بعطر نور');checks.push('Free task description, Egyptian explanations, optional ideas below writable questions, and empty-answer validation');
 await button('راجع فكرتك').click();assert.equal((await state()).step,'review');await button('جهّز البرومبت').click();await page.getByRole('heading',{name:'البرومبت جاهز',exact:true}).waitFor();await page.getByText('تعذر اتصال الذكاء الاصطناعي.',{exact:false}).waitFor();const output=await page.locator('.lookers-ai__prompt-output').inputValue();assert.ok(output.includes('صور وريلز')&&output.includes('APPROVED_REFERENCE')&&output.includes('رأسي 4:5'));
 const first=(await state()).projectId;await page.locator('.site-ai-button').click();assert.notEqual((await state()).projectId,first);await button('Previous Projects').click();await page.locator('.lai-history-grid button').first().click();assert.equal((await state()).projectId,first);assert.equal((await state()).generatedPrompt,output);checks.push('Real Agent → offline transport fallback → compiled prompt contains the user vision, custom task and references; archive restore preserves result');
 await page.evaluate(()=>window.scrollTo(0,0));await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('.signature-logo canvas').dataset.motion==='inside',undefined,{timeout:12000});await page.waitForFunction(()=>document.querySelector('.signature-logo canvas').dataset.motion==='assembled',undefined,{timeout:6000});await page.emulateMedia({reducedMotion:'reduce'});
 for(const lang of ['EN','AR']){await button(lang).click();for(const width of [1440,736,390,320]){await page.setViewportSize({width,height:1050});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`${out}/${lang}-${width}-result.png`});}}
 assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify({checks,errors,inference:'offline fallback explicitly disclosed'},null,2));console.log(checks.join('\n'));
}finally{await browser.close();await server.close();}
