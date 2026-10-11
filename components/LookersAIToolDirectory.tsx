import React, {useState} from 'react';
import {ArrowUpRight, AudioLines, BarChart3, BookOpen, BriefcaseBusiness, Code2, Film, ImagePlus, MessageSquareText, Presentation, Search, Sparkles} from 'lucide-react';
import {aiTools,toolCategories,type AITool} from '../data/aiTools';
import type {Lang,ProjectDraft} from '../data/lookersAi';
import {deriveToolContext,rankTools,newInAITools,isNewInAI} from '../services/lookersAiTools';

const icons = {images:ImagePlus,video:Film,presentation:Presentation,career:BriefcaseBusiness,
  marketing:Sparkles,writing:MessageSquareText,business:BriefcaseBusiness,data:BarChart3,research:Search,
  coding:Code2,productivity:BookOpen,travel:BriefcaseBusiness,support:MessageSquareText,audio:AudioLines,
  ecommerce:BriefcaseBusiness,education:BookOpen};
export default function LookersAIToolDirectory({lang,draft,selectedTool='',onUse,onCopy,onClose}:
  {lang:Lang;draft:ProjectDraft;selectedTool?:string;onUse:(name:string)=>void;onCopy:()=>void;onClose?:()=>void}) {
  const t=(en:string,ar:string)=>lang==='ar'?ar:en;
  const [query,setQuery]=useState(''),[category,setCategory]=useState('all'),[browse,setBrowse]=useState(false),[detail,setDetail]=useState<AITool|null>(null);
  const context=deriveToolContext(draft);
  const recommended=rankTools(context).slice(0,5);
  const fresh=newInAITools();
  const canUse=Boolean(draft.generatedPrompt);
  const list=aiTools.filter(tool=>tool.active &&
    (category==='all'||tool.supportedTaskTypes.includes(category as typeof context.taskType)) &&
    (!query.trim()||[tool.name,tool.description.en,tool.description.ar,...tool.capabilities].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));
  const openLink=(tool:AITool)=><a className="lai-secondary-button" href={tool.officialUrl} target="_blank" rel="noopener noreferrer">
    {t('Open official website','افتح الموقع الرسمي')} <ArrowUpRight size={14} aria-hidden="true"/></a>;
  const use=(tool:AITool)=>onUse(tool.name);
  const card=(tool:AITool)=>{
    const Icon=icons[tool.iconKey]||Sparkles;
    return <article key={tool.id} className={'lai-library-card lai-tool-card'+(selectedTool===tool.name?' is-selected':'')} data-tool-id={tool.id}>
      <div className="lai-tool-card-top"><Icon size={20} aria-hidden="true"/>{isNewInAI(tool)&&<span className="lai-new-badge">{tool.newLabel[lang]}</span>}</div>
      <h4>{tool.name}</h4><p>{tool.description[lang]}</p>
      <small>{toolCategories.find(c=>c.id===tool.category)?.label[lang]}</small>
      <div className="lai-library-card-actions">
        <button type="button" className="lai-secondary-button" aria-label={t('Use with '+tool.name,'استخدمه مع '+tool.name)} disabled={!canUse}
          aria-pressed={selectedTool===tool.name} onClick={()=>use(tool)}>{t('Use it','استخدمه')}</button>
        {openLink(tool)}
        <button type="button" className="lai-tool-detail-button" onClick={()=>setDetail(tool)}
          aria-label={t('About '+tool.name,'عن '+tool.name)}>{t('Why this tool?','ليه الأداة دي؟')}</button>
      </div>
    </article>;
  };
  return <section className="lai-tool-directory" aria-label={t('AI Tool Directory','دليل أدوات AI')}>
    <div className="lai-library-heading"><div><h3>{t('Where will you use the prompt?','هتستخدم الـPrompt فين؟')}</h3>
      <p>{t('Choose a tool for your goal. Copy the general prompt and add your references there.','اختار الأداة المناسبة لهدفك. انسخ البرومبت العام وأضف مراجعك هناك.')}</p></div>
      {onClose&&<button type="button" className="lai-secondary-button" onClick={onClose}>{t('Back to my project','ارجع لمشروعي')}</button>}</div>
    {!canUse&&<p className="lai-field-example">{t('Browse freely. Prepare your prompt in your project before using it with a tool.','تقدر تتصفح الأدوات. جهّز البرومبت في مشروعك الأول عشان تستخدمه.')}</p>}
    {canUse&&selectedTool&&<div className="lai-tool-selected" role="status"><p>{t('Ready to copy into','جاهز للنسخ إلى')} {selectedTool}. {t('Nothing is sent or executed here.','لا يتم الإرسال أو التنفيذ هنا.')}</p>
      <button type="button" className="lai-primary-button" onClick={onCopy}>{t('Copy prompt','انسخ الـPrompt')}</button></div>}
    {detail&&<section className="lai-tool-detail" aria-label={t('Tool details','تفاصيل الأداة')}>
      <button type="button" className="lai-tool-detail-button" onClick={()=>setDetail(null)}>{t('Close details','اقفل التفاصيل')}</button>
      {isNewInAI(detail)&&<span className="lai-new-badge">{detail.newLabel[lang]}</span>}
      <h3>{detail.name}</h3><h4>{t('Why might it matter to you?','ليه ممكن تهمك؟')}</h4><p>{detail.description[lang]}</p>
      <b>{t('Suitable for:','مناسبة لـ:')}</b><p>{detail.supportedTaskTypes.map(id=>toolCategories.find(c=>c.id===id)?.label[lang]).join(' · ')}</p>
      <div className="lai-library-card-actions"><button type="button" className="lai-primary-button" disabled={!canUse}
        onClick={()=>{use(detail);onCopy();}}>{t('Use the prompt','استخدم الـPrompt')}</button>{openLink(detail)}</div>
    </section>}
    <section aria-label={t('Recommended for your task','مناسبة لمهمتك')} data-tool-section="recommended">
      <h3>{context.taskType==='presentation'?t('Tools suited to your presentation','أدوات مناسبة للعرض'):t('Recommended for your task','مناسبة لمهمتك')}</h3>
      <p className="lai-field-example">{t('Selected for your task, output and preferences.','اختيارات حسب مهمتك والنتيجة المطلوبة وتفضيلاتك.')}</p>
      <div className="lai-tool-grid">{recommended.map(tool=>card(tool))}</div>
    </section>
    <section aria-label={t('New in AI','جديد في الـAI')} data-tool-section="new">
      <h3>{t('New in AI','جديد في الـAI')}</h3><p>{t('AI tools we recently selected and added to this directory.','أدوات AI جديدة اخترناها وحدّثناها مؤخرًا.')}</p>
      <p className="lai-field-example">{t('New to this directory; this is not a product launch or popularity ranking.','جديدة في دليلنا؛ ده مش ترتيب شعبية أو إعلان عن تاريخ إطلاقها.')}</p>
      <div className="lai-tool-grid">{fresh.map(tool=>card(tool))}</div>
      {!fresh.length&&<p>{t('No recent editorial additions. All verified tools remain in the catalog.','مفيش إضافات تحريرية حديثة حاليًا. الأدوات المؤكدة لسه موجودة في الدليل.')}</p>}
    </section>
    <section data-tool-section="categories"><h3>{t('Browse categories','تصفح الفئات')}</h3>
      <div className="lai-library-filters"><div className="lai-field"><label htmlFor="ai-tool-category">{t('Task family','نوع المهمة')}</label>
        <select id="ai-tool-category" value={category} onChange={e=>{setCategory(e.target.value);setBrowse(true);}}>
          <option value="all">{t('All categories','كل الفئات')}</option>{toolCategories.map(c=><option key={c.id} value={c.id}>{c.label[lang]}</option>)}</select></div>
        <div className="lai-field"><label htmlFor="ai-tool-search">{t('Search AI tools','ابحث عن أداة AI')}</label>
          <input id="ai-tool-search" type="search" value={query} onChange={e=>{setQuery(e.target.value);setBrowse(true);}}/></div></div>
    </section>
    <section data-tool-section="all"><button type="button" className="lai-secondary-button" aria-expanded={browse}
      onClick={()=>{setBrowse(true);setCategory('all');setQuery('');}}>{t('All AI tools','كل أدوات AI')}</button>
      {browse&&<><div className="lai-tool-grid">{list.map(tool=>card(tool))}</div>
        {!list.length&&<p role="status">{t('No matching tools. Try another search or category.','مفيش أدوات مطابقة. جرّب بحث أو فئة تانية.')}</p>}</>}
    </section>
  </section>;
}
