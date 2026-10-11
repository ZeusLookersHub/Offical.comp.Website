import React, {useEffect,useRef,useState} from 'react';
import {Search, ArrowLeft, BookOpen, LoaderCircle} from 'lucide-react';
import type {Lang,ProjectDraft,TaskType} from '../data/lookersAi';
import type {PromptTemplate,Localized} from '../data/promptLibrary';
import {loadPromptLibrary,initializeLibraryDraft,readRecentPrompts,RECENT_PROMPTS_KEY} from '../services/lookersAiPromptLibrary';

const PromptCard: React.FC<{item:PromptTemplate;lang:Lang;onOpen:(item:PromptTemplate,focus?:boolean)=>void}> = ({item,lang,onOpen}) => {
  return <article className="lai-library-card">
    <BookOpen size={18} aria-hidden="true" /><h3>{item.title[lang]}</h3><p>{item.description[lang]}</p>
    <small>{item.tools.join(' · ')}</small><div className="lai-library-card-actions">
      <button type="button" className="lai-secondary-button" onClick={()=>onOpen(item)}>{lang==='ar'?'التفاصيل':'Details'}</button>
      <button type="button" className="lai-secondary-button" onClick={()=>onOpen(item,true)}>{lang==='ar'?'خصّص واستخدم':'Customize & use'}</button>
    </div>
  </article>;
}
export default function LookersPromptLibrary({lang,currentTask,onClose,onUse}:{lang:Lang;currentTask:TaskType;onClose:()=>void;onUse:(draft:ProjectDraft)=>void}) {
  const ar=lang==='ar'; const t=(en:string,arabic:string)=>ar?arabic:en;
  const [catalog,setCatalog]=useState<{promptTemplates:PromptTemplate[];promptCategories:{id:string;label:Localized}[]}|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState(false),[retry,setRetry]=useState(0);
  const [query,setQuery]=useState(''),[category,setCategory]=useState('all'),[view,setView]=useState('featured');
  const [recent,setRecent]=useState<string[]>([]),[recentUnavailable,setRecentUnavailable]=useState(false);
  const [selected,setSelected]=useState<PromptTemplate|null>(null),[values,setValues]=useState<Record<string,string>>({}),[inputError,setInputError]=useState('');
  const firstInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{let active=true;setLoading(true);setError(false);
    loadPromptLibrary().then(data=>{if(!active)return;setCatalog(data);try{setRecent(readRecentPrompts(window.localStorage,data.promptTemplates.map(p=>p.id)));}catch{setRecentUnavailable(true);}}).catch(()=>{if(active)setError(true);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[retry]);
  const open=(item:PromptTemplate,focus=false)=>{setSelected(item);setValues({});setInputError('');if(focus)window.setTimeout(()=>firstInput.current?.focus(),0);};
  const usePrompt=()=>{
    if(!selected)return;
    try{const draft=initializeLibraryDraft(selected,values,lang);onUse(draft);
      try{window.localStorage.setItem(RECENT_PROMPTS_KEY,JSON.stringify([selected.id,...recent.filter(id=>id!==selected.id)].slice(0,10)));}catch{/* Core workflow does not depend on recently used storage. */}
    }catch{setInputError(t('Please check the required inputs. Your current project has not changed.','راجع المدخلات المطلوبة. لم يتغير مشروعك الحالي.'));}
  };
  const list=catalog?.promptTemplates.filter(p=>{
    const search=`${p.title.en} ${p.title.ar} ${p.description.en} ${p.description.ar} ${p.useCase.en} ${p.useCase.ar}`.toLocaleLowerCase();
    return (category==='all'||p.category===category) && (!query.trim()||search.includes(query.trim().toLocaleLowerCase())) &&
      (view==='all'||view==='featured'&&p.featured||view==='recommended'&&p.taskType===currentTask||view==='recent'&&recent.includes(p.id)||view==='curated'&&p.curated);
  }).sort((a,b)=>view==='recent'?recent.indexOf(a.id)-recent.indexOf(b.id):0)||[];
  return <section className="lai-card lai-library" aria-label={t('Prompt Library','مكتبة البرومبت')}>
    <div className="lai-library-heading"><div><h2>{t('A starting point for your idea','نقطة بداية لفكرتك')}</h2><p>{t('Choose a guide, add your details, then continue in the same Lookers AI workflow.','اختر نموذجًا وأضف تفاصيلك، ثم أكمل نفس رحلة Lookers AI.')}</p></div>
      <button type="button" className="lai-secondary-button" onClick={onClose}>{t('Back to my project','ارجع لمشروعي')}</button></div>
    {loading&&<p role="status"><LoaderCircle size={18} className="lai-spinner" />{t('Loading prompts…','جارٍ تحميل النماذج…')}</p>}
    {!loading&&error&&<div role="alert"><p>{t('The library could not be loaded. Your project is safe.','تعذر تحميل المكتبة. مشروعك محفوظ.')}</p><button type="button" className="lai-primary-button" onClick={()=>setRetry(r=>r+1)}>{t('Retry','حاول مجددًا')}</button></div>}
    {!loading&&!error&&selected?<div className="lai-library-detail">
      <button type="button" className="lai-secondary-button" onClick={()=>setSelected(null)}><ArrowLeft size={16}/>{t('Back to library','ارجع للمكتبة')}</button>
      <h3>{selected.title[lang]}</h3><p>{selected.useCase[lang]}</p><p className="lai-field-example">{selected.referenceHint[lang]}</p>
      <details className="lai-advanced"><summary>{t('What this starting point adds','ما الذي يضيفه هذا النموذج')}</summary><ul>{selected.enhancements.map((e,i)=><li key={i}>{e[lang]}</li>)}</ul></details>
      <div className="lai-library-inputs">{selected.inputs.map((field,index)=><div className="lai-field" key={field.id}><label htmlFor={`library-${field.id}`}>{field.label[lang]}{field.required&&<span className="lai-optional">{t('Required','مطلوب')}</span>}</label>
        <input ref={index===0?firstInput:undefined} id={`library-${field.id}`} type="text" maxLength={1500} required={field.required} value={values[field.id]||''} onChange={e=>setValues(v=>({...v,[field.id]:e.target.value}))}/><p className="lai-field-example">{field.hint[lang]}</p></div>)}</div>
      <p className="lai-field-example">{t('Add your details first. Choose an external tool after your prompt is ready. Your current project will be kept.','أضف تفاصيلك الأول. اختار الأداة بعد ما البرومبت يجهز. مشروعك الحالي هيفضل محفوظ.')}</p>
      {inputError&&<p role="alert">{inputError}</p>}
      <button type="button" className="lai-primary-button" disabled={selected.inputs.some(i=>i.required&&!values[i.id]?.trim())} onClick={usePrompt}>{t('Use prompt','استخدم النموذج')}</button>
    </div>:!loading&&!error&&<>
      <div className="lai-library-filters"><div className="lai-field"><label htmlFor="library-search"><Search size={16}/>{t('Search prompts','ابحث في النماذج')}</label><input id="library-search" type="search" value={query} onChange={e=>{setQuery(e.target.value);setView('all');}} placeholder={t('What do you want to make?','ماذا تريد أن تنفّذ؟')}/></div>
        <div className="lai-field"><label htmlFor="library-category">{t('Category','الفئة')}</label><select id="library-category" value={category} onChange={e=>{setCategory(e.target.value);setView('all');}}><option value="all">{t('All categories','كل الفئات')}</option>{catalog?.promptCategories.map(c=><option value={c.id} key={c.id}>{c.label[lang]}</option>)}</select></div></div>
      <div className="lai-library-views" role="group" aria-label={t('Library sections','أقسام المكتبة')}>{[['all','All','الكل'],['featured','Featured','مختارة'],['recommended','Recommended','مناسبة لمهمتك'],['recent','Recently used','استخدمتها مؤخرًا'],['trending','Editorial picks','اختياراتنا']].map(([id,en,arabic])=><button type="button" className={`lai-option ${view===id?'is-selected':''}`} aria-pressed={view===id} key={id} onClick={()=>setView(id)}>{ar?arabic:en}</button>)}</div>
      <p className="lai-field-example">{view==='curated'?t('Editorial picks, not popularity metrics.','اختيارات تحريرية، وليست إحصائيات شعبية.'):view==='recommended'?t('Suggested from your current task type, not personal tracking.','اقتراحات حسب نوع مهمتك الحالي، دون تتبع شخصي.'):view==='recent'?t('Recently used on this device only.','استخدامك السابق على هذا الجهاز فقط.'):t('Every template is editable. Your choices remain authoritative.','كل نموذج قابل للتعديل، واختياراتك هي الأساس.')}</p>
      {recentUnavailable&&<p role="status">{t('Recently used is unavailable on this device.','سجل الاستخدام غير متاح على هذا الجهاز.')}</p>}
      <div className="lai-library-grid">{list.map(item=><PromptCard key={item.id} item={item} lang={lang} onOpen={open}/>)}</div>
      {!list.length&&<div className="lai-library-empty" role="status"><p>{t('No prompts match yet. Try another search or start with your own idea.','لا توجد نماذج مطابقة. جرّب بحثًا آخر أو ابدأ بفكرتك.')}</p><button type="button" className="lai-secondary-button" onClick={()=>{setQuery('');setCategory('all');setView('all');}}>{t('Clear filters','امسح الفلاتر')}</button></div>}
    </>}
  </section>;
}
