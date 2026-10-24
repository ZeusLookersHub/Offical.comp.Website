import React, { useState } from 'react';

// The source is the pixel-identical approved master, not a recreated CSS illustration.
// Keep this path stable when adding the approved PNG to public/assets.
const MASTER_IMAGE = '/assets/lookers-orbital-master.png';
import './OrbitalHero.css';

type World = { id:string; en:string; ar:string; subtitle:string; tasks:{en:string;ar:string}[] };
const worlds:World[] = [
{id:'design',en:'DESIGN',ar:'التصميم',subtitle:'VISUALS & BRANDING',tasks:[{en:'Brand Identity',ar:'الهوية البصرية'},{en:'UI / UX',ar:'تصميم الواجهات'},{en:'Social Design',ar:'تصميم السوشيال'},{en:'Motion Design',ar:'الموشن'}]},
{id:'marketing',en:'MARKETING',ar:'التسويق',subtitle:'IDEAS TO AUDIENCES',tasks:[{en:'Campaign',ar:'حملة إعلانية'},{en:'Content Strategy',ar:'استراتيجية المحتوى'},{en:'Social Media',ar:'السوشيال ميديا'},{en:'Market Research',ar:'أبحاث السوق'}]},
{id:'business',en:'BUSINESS',ar:'الأعمال',subtitle:'PLANS & GROWTH',tasks:[{en:'Business Plan',ar:'خطة عمل'},{en:'Company Profile',ar:'ملف شركة'},{en:'Pitch Deck',ar:'عرض استثماري'},{en:'Strategy',ar:'استراتيجية'}]},
{id:'presentations',en:'PRESENTATIONS',ar:'العروض التقديمية',subtitle:'IDEAS THAT IMPACT',tasks:[{en:'Pitch Deck',ar:'عرض استثماري'},{en:'Business Review',ar:'مراجعة أعمال'},{en:'Training Slides',ar:'شرائح تدريبية'},{en:'Product Launch',ar:'إطلاق منتج'}]},
{id:'technology',en:'TECHNOLOGY',ar:'التكنولوجيا',subtitle:'WEB, APPS & AI',tasks:[{en:'Website',ar:'موقع إلكتروني'},{en:'Mobile App',ar:'تطبيق موبايل'},{en:'AI Agent',ar:'وكيل ذكاء اصطناعي'},{en:'Automation',ar:'أتمتة'}]}
];
export default function OrbitalHero({lang,onSelect}:{lang:'ar'|'en';onSelect:(world:string,task:string)=>void}){
 const [active,setActive]=useState<World|null>(null);
 const [imageFailed,setImageFailed]=useState(false);
 return <section className="orbital-hero" aria-label={lang==='ar'?'اختار عالمك ومهمتك':'Choose your universe and mission'}>
  <div className="orbital-hero__heading"><span>LOOKERS AI</span><h2>{lang==='ar'?'فكرة واحدة. وكل خطوة تفتح اللي بعدها.':<>One idea. <em>Every step opens the next.</em></>}</h2><p>{lang==='ar'?'استكشف عالمك. وحوّل أفكارك لنتائج حقيقية.':'Explore your universe. Turn ideas into real results.'}</p></div>
  <div className={'orbital-hero__universe '+(active?'orbital-hero__universe--selected':'')}>
   <div className="orbital-hero__stars" aria-hidden="true"/>
   {active ? <div className="orbital-hero__missions">
    <button className="orbital-hero__back" type="button" onClick={()=>setActive(null)}>{lang==='ar'?'→ كل المجالات':'← All universes'}</button>
    <div className={'orbital-hero__planet orbital-hero__planet--'+active.id+' orbital-hero__planet--focus'} aria-hidden="true"><div className="orbital-hero__focus-texture"/><div className="orbital-hero__focus-aura"/></div>
    <h3>{lang==='ar'?active.ar:active.en}</h3>
    <p className="orbital-hero__mission-subtitle">{active.subtitle}</p><div className="orbital-hero__satellites">{active.tasks.map((task,i)=><button type="button" className="orbital-hero__satellite" key={task.en} onClick={()=>onSelect(active.en,task.en)} style={{animationDelay:`${i*90}ms`}}><span className="orbital-hero__moon" aria-hidden="true"><span className="orbital-hero__asteroid-surface"/><span className="orbital-hero__moon-number">{String(i+1).padStart(2,'0')}</span></span><strong>{lang==='ar'?task.ar:task.en}</strong></button>)}</div>
   </div> : <><img className="orbital-hero__master" src={MASTER_IMAGE} alt="" aria-hidden="true" draggable={false} onError={()=>setImageFailed(true)}/>{imageFailed && <div className="orbital-hero__missing" role="alert">Approved hero asset missing: {MASTER_IMAGE}. This preview cannot be approved until the original image is deployed.</div>}<div className="orbital-hero__glimmers" aria-hidden="true"><i/><i/><i/></div>{worlds.map((world,i)=><button type="button" className={'orbital-hero__planet orbital-hero__planet--'+world.id} key={world.id} onClick={()=>setActive(world)} aria-label={lang==='ar'?world.ar:world.en}>


   </button>)}</>}
  </div>
 </section>;
}
