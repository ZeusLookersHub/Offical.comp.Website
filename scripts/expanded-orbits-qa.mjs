import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.env.EXPANDED_QA_OUTPUT||'node_modules/.cache/expanded-orbits';await mkdir(output,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5288,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM_EXECUTABLE,args:['--no-sandbox']});
const checks=[],errors=[];let page;
const button=name=>page.getByRole('button',{name,exact:true});
const overlap=(a,b)=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
async function geometry(label){
 const g=await page.locator('.wormhole-missions').evaluate(n=>{const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {cards:[...n.querySelectorAll('.lh-planet--rock')].map(box),focus:box(n.querySelector('.focus .lh-globe')),stage:box(n.querySelector('.stage')),viewport:{width:innerWidth,height:innerHeight}}});
 assert.equal(g.cards.length,4);
 const {stage,focus}=g,cx=stage.x+stage.width/2,cy=stage.y+stage.height/2;
 // Recover the ellipse from opposite live targets, then test every degree of its cycle.
 const centers=g.cards.map(c=>({x:c.x+c.width/2-cx,y:c.y+c.height/2-cy}));
 const rx=Math.hypot(centers[0].x,centers[1].x),ry=Math.hypot(centers[0].y,centers[1].y);
 for(let degree=0;degree<360;degree++){
  const cards=g.cards.map((c,i)=>{const a=degree*Math.PI/180+i*Math.PI/2;return {...c,x:cx+Math.cos(a)*rx-c.width/2,y:cy+Math.sin(a)*ry-c.height/2}});
  for(let i=0;i<4;i++){
   const c=cards[i];assert.ok(c.x>=-1&&c.x+c.width<=g.viewport.width+1&&c.y>=stage.y-1&&c.y+c.height<=g.viewport.height+1,JSON.stringify({label,degree,clipped:c,g}));
   assert.ok(!overlap(c,focus),JSON.stringify({label,degree,planetOverlap:c,focus,g}));
   for(let j=i+1;j<4;j++)assert.ok(!overlap(c,cards[j]),JSON.stringify({label,degree,cardOverlap:[c,cards[j]],g}));
  }
 }
 checks.push(label+': full 360-degree geometry');
}
try{
 for(const [width,height,lang] of [[1918,872,'en'],[1440,1000,'en'],[768,1024,'en'],[390,900,'ar'],[320,844,'ar']]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});await context.route('**/*.supabase.co/**',r=>r.abort());page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5288/#/lookers-ai');await button('DESIGN').waitFor();await page.waitForTimeout(1100);if(lang==='ar')await button('عربي').click();
  for(const [en,ar] of [['DESIGN','التصميم'],['MARKETING','التسويق'],['BUSINESS','الأعمال'],['TECHNOLOGY','التكنولوجيا'],['PRESENTATIONS','العروض التقديمية']]){
   await button(lang==='ar'?ar:en).click();
   for(let ring=0;ring<2;ring++){
    await page.locator('.mission-rings button').nth(ring).click();await geometry(`${width}/${lang}/${en}/${ring+1}`);
   }
   if(en==='MARKETING')await page.screenshot({path:`${output}/${width}-${lang}-missions.png`});
   await page.locator('.wormhole-missions .back').click();
  }
  await context.close();
 }
 // Real frame movement, hover/focus pause, runtime reduced-motion change, and second-orbit routing.
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});await context.route('**/*.supabase.co/**',r=>r.abort());page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5288/#/lookers-ai');await button('DESIGN').waitFor();await page.waitForTimeout(1100);await button('DESIGN').focus();await page.keyboard.press('Enter');await page.mouse.move(0,0);await page.waitForTimeout(1100);
 const rock=page.locator('.wormhole-missions .lh-planet--rock').first(),position=()=>rock.getAttribute('style');let before=await position();await page.waitForTimeout(900);assert.notEqual(await position(),before);checks.push('mission orbit visibly moves');
 const target=await rock.boundingBox();await page.mouse.move(target.x+target.width/2,target.y+target.height/2);await page.waitForTimeout(100);before=await position();await page.waitForTimeout(250);assert.equal(await position(),before);checks.push('pointer hover pauses orbit');
 await page.mouse.move(0,0);await rock.focus();await page.waitForTimeout(100);before=await position();await page.waitForTimeout(250);assert.equal(await position(),before);checks.push('keyboard focus pauses orbit');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.mission-rings button').nth(1).click();before=await position();await page.waitForTimeout(250);assert.equal(await position(),before);checks.push('reduced motion is still');
 await button('Product Photo').click();const active=page.getByTestId('active-question');await active.waitFor();await active.locator('input[type=text]').fill('A custom product scene');await active.getByRole('button',{name:'Done · Send',exact:true}).click();assert.match(await active.innerText(),/appear|subject|product/i);checks.push('second orbit enters specialized image interview');
 await context.close();assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'passed',checks,errors},null,2));await writeFile(`${output}/report.json`,JSON.stringify({status:'passed',checks,errors},null,2));
}catch(error){if(page&&!page.isClosed())await page.screenshot({path:`${output}/failure.png`});await writeFile(`${output}/report.json`,JSON.stringify({status:'failed',error:String(error),checks,errors},null,2));throw error;}finally{await browser.close();await server.close();}
