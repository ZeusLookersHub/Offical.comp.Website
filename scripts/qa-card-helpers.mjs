import assert from 'node:assert/strict';
/** Navigate the real UI without injecting or editing stored project data. */
export async function walkToQuestion(page,id){
 for(let i=0;i<35;i++){
  if(await page.locator(`#lai-${id}`).count())return;
  const field=page.locator('.lai-question-card textarea');assert.equal(await field.count(),1,'One question per card');
  const current=await field.getAttribute('id');
  if(current==='lai-purpose')await page.getByRole('button',{name:/^(More details \(optional\)|تفاصيل أكتر \(اختياري\))$/}).click();
  else await page.getByRole('button',{name:/^(Next question|Next \/ skip|السؤال التالي|التالي \/ تخطّي)$/}).click();
 }
 throw new Error(`Could not reach question ${id}`);
}
export async function completeBrief(page,values={}){
 for(let i=0;i<35 && await page.locator('.lai-question-card').count();i++){
  const field=page.locator('.lai-question-card textarea');const id=(await field.getAttribute('id')).replace('lai-','');
  if(Object.hasOwn(values,id))await field.fill(values[id]);
  if(id==='purpose'){await page.getByRole('button',{name:/^(Review brief|راجع فكرتك)$/}).click();return;}
  if(await field.getAttribute('required')!==null)assert.ok((await field.inputValue()).trim(),`Missing explicit fixture answer: ${id}`);
  await page.getByRole('button',{name:/^(Next question|Next \/ skip|السؤال التالي|التالي \/ تخطّي)$/}).click();
 }
}
export async function closeHandoff(page){
 const toggle=page.getByRole('button',{name:/^(Use with your tool|استخدمه مع أداتك)$/});
 if(await toggle.getAttribute('aria-expanded')==='true')await page.locator('.lai-handoff-close').click();
}
export async function openContinuation(page){await closeHandoff(page);await page.locator('.lai-continuation summary').click();}
