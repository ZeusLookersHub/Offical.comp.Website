import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Clipboard, X } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { trendSections, type TrendSectionId } from '../data/lookersAiTrends';
import './LookersAIHeader.css';

function TrendArtwork({ section, index, label }: { section: TrendSectionId; index: number; label: string }) {
  const gradient = `trend-art-${useId().replace(/:/g, '')}`;
  return <svg className="lai-trend-art" viewBox="0 0 480 240" role="img" aria-label={label}>
    <defs><linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1"><stop stopColor={index === 1 ? '#79cdd3' : '#b8a7e8'} /><stop offset="1" stopColor={index === 2 ? '#e6c15a' : '#34304e'} /></linearGradient></defs>
    <rect width="480" height="240" rx="14" fill="#090d14" />
    <ellipse cx="360" cy="50" rx="180" ry="120" fill="#b8a7e8" opacity=".07" />
    <ellipse cx="60" cy="220" rx="190" ry="115" fill="#79cdd3" opacity=".06" />
    {section === 'image' && (index === 0 ? <g transform="rotate(-5 240 120)">
      <rect x="150" y="28" width="180" height="187" rx="5" fill="#ddd7e9" /><rect x="158" y="36" width="164" height="154" fill={`url(#${gradient})`} />
      <ellipse cx="240" cy="165" rx="52" ry="48" fill="#292941" /><ellipse cx="240" cy="95" rx="28" ry="36" fill="#d6b38f" /><path d="M212 90q5-50 52-24l5 25q-30-13-57-1" fill="#252437" />
    </g> : index === 1 ? <g transform="translate(110 55)">
      <path d="M0 120l130-70 130 70-130 65z" fill="#79cdd3" opacity=".3" />
      {[0, 1, 2].map(n => <g key={n} transform={`translate(${n * 66 + 20} ${35 - n * 9})`}><path d="M0 32l36-19 32 19-35 18z" fill="#e6c15a" /><path d="M0 32v62l33 18V50z" fill="#b8a7e8" /><path d="M33 50l35-18v62l-35 18z" fill="#636784" /><rect x="10" y="57" width="10" height="20" rx="2" fill="#ddd6f1" /></g>)}
    </g> : <g transform="rotate(-7 240 120)"><ellipse cx="240" cy="205" rx="91" ry="13" fill="#79cdd3" opacity=".17" /><rect x="197" y="57" width="86" height="142" rx="18" fill={`url(#${gradient})`} /><rect x="213" y="30" width="54" height="35" rx="5" fill="#e6c15a" /><rect x="205" y="112" width="70" height="46" rx="3" fill="#e7e2f0" /><path d="M219 127h42m-36 12h30" stroke="#4b435f" strokeWidth="3" /></g>)}
    {section === 'video' && <g transform={`rotate(${index * 4 - 4} 240 120)`}><rect x="91" y="38" width="298" height="155" rx="9" fill="#222033" stroke="#b8a7e8" strokeOpacity=".4" /><rect x={110 + index * 28} y="55" width="100" height="120" rx="5" fill={`url(#${gradient})`} /><circle cx="250" cy="115" r="29" fill="#e6c15a" /><path d="M242 101l23 14-23 14z" fill="#211b0d" />{[0, 1, 2, 3, 4].map(n => <rect key={n} x={95 + n * 59} y="205" width="52" height="12" rx="3" fill={n % 2 ? '#79cdd3' : '#b8a7e8'} />)}</g>}
    {section === 'social' && <g transform={`rotate(${index * 3 - 3} 240 120)`}>{[0, 1, 2].map(n => <g key={n} transform={`translate(${82 + n * 109} ${50 + (n === index ? -10 : 8)})`}><rect width="98" height="145" rx="7" fill={['#79cdd3', '#e6c15a', '#b8a7e8'][n]} /><rect x="12" y="15" width="38" height="5" rx="2" fill="#17212b" opacity=".5" /><circle cx="49" cy="67" r={n === index ? 28 : 21} fill="#26313f" opacity=".8" /><path d="M12 112h74m-74 12h50" stroke="#26313f" strokeWidth="5" /></g>)}</g>}
    {section === 'prompt' && <g transform={`rotate(${index * 3 - 3} 240 120)`}><rect x="83" y="35" width="314" height="175" rx="10" fill="#151a21" stroke="#e6c15a" strokeOpacity=".4" /><circle cx="102" cy="52" r="3" fill="#e6c15a" /><circle cx="114" cy="52" r="3" fill="#79cdd3" /><path d="M133 85l-15 15 15 15m214-30 15 15-15 15" fill="none" stroke="#e6c15a" strokeWidth="4" />{[0, 1, 2, 3].map(n => <g key={n}><rect x="153" y={82 + n * 27} width={52 + index * 12} height="7" rx="3" fill={n % 2 ? '#79cdd3' : '#b8a7e8'} /><rect x={219 + index * 12} y={82 + n * 27} width={100 - n * 15} height="7" rx="3" fill="#788396" opacity=".5" /></g>)}</g>}
    {section === 'creative' && <g transform={`rotate(${index * 20} 240 120)`}><ellipse cx="240" cy="120" rx={68 + index * 10} ry={70 - index * 9} fill={`url(#${gradient})`} /><ellipse cx="240" cy="120" rx="127" ry="42" transform="rotate(-30 240 120)" fill="none" stroke="#e6c15a" strokeWidth="2" /><circle cx={345 - index * 25} cy={65 + index * 14} r="15" fill="#79cdd3" opacity=".8" /></g>}
  </svg>;
}


interface Props { libraryOpen:boolean;onLibraryToggle:()=>void;toolsOpen:boolean;onToolsToggle:()=>void }
export default function LookersAIHeader({libraryOpen,onLibraryToggle,toolsOpen,onToolsToggle}:Props) {
  const {lang}=useLanguage(),ar=lang==='ar';
  const t=(en:string,arabic:string)=>ar?arabic:en;
  const root=useRef<HTMLElement>(null), triggers=useRef<(HTMLButtonElement|null)[]>([]), firstItem=useRef<HTMLButtonElement>(null),focusFirst=useRef(false);
  const [openId,setOpenId]=useState<TrendSectionId|null>(null),[itemIndex,setItemIndex]=useState(0),[showPrompt,setShowPrompt]=useState(false),[clipboardStatus,setClipboardStatus]=useState('');
  const panelId=useId(),activeSection=trendSections.find(s=>s.id===openId),activeItem=activeSection?.items[itemIndex];
  const close=()=>setOpenId(null);
  const open=(id:TrendSectionId)=>{setItemIndex(0);setShowPrompt(false);setClipboardStatus('');setOpenId(id);};
  useEffect(()=>{const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpenId(null);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
  useEffect(()=>{setOpenId(null);},[lang]);
  useEffect(()=>{if(openId&&focusFirst.current){focusFirst.current=false;firstItem.current?.focus();}},[openId]);
  const short:Record<TrendSectionId,string[]>={image:['Images','صور AI'],video:['Videos','فيديو AI'],social:['Social','سوشيال'],prompt:['Prompts','برومبت'],creative:['Explore','تجارب']};
  return <header ref={root} className="lai-trends-header" aria-label={t('Lookers AI navigation','تنقل Lookers AI')} onBlur={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget as Node))close();}} onKeyDown={event=>{if(event.key==='Escape'&&openId){event.preventDefault();const index=trendSections.findIndex(s=>s.id===openId);close();triggers.current[index]?.focus();}}}>
    <div className="lai-trends-topline" dir="ltr">
      <button type="button" className="lai-trends-library" aria-expanded={libraryOpen} onClick={()=>{close();onLibraryToggle();}}>{t('Prompt Library','مكتبة البرومبت')}</button>
      <nav className="lai-trends-nav" dir={ar?'rtl':'ltr'} aria-label={t('Creative trends','الترندات الإبداعية')}>
        {trendSections.map((section,index)=><button key={section.id} ref={el=>{triggers.current[index]=el;}} type="button" className="lai-trends-headline" aria-label={section.title[lang]} aria-expanded={openId===section.id} aria-controls={panelId} onClick={()=>openId===section.id?close():open(section.id)} onKeyDown={event=>{
          if(event.key==='ArrowDown'){event.preventDefault();if(openId===section.id)firstItem.current?.focus();else{focusFirst.current=true;open(section.id);}}
          if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const offset=(event.key==='ArrowRight'?1:-1)*(ar?-1:1);triggers.current[(index+offset+trendSections.length)%trendSections.length]?.focus();}
        }}>{short[section.id][ar?1:0]}<ChevronDown size={11} aria-hidden="true" /></button>)}
      </nav>
      <button type="button" className="lai-trends-tools" aria-expanded={toolsOpen} onClick={()=>{close();onToolsToggle();}}>{t('AI tools','أدوات AI')}</button>
    </div>
    <div id={panelId} className="lai-trends-popover" hidden={!activeSection}>
      {activeSection&&activeItem&&<div className="lai-trends-panel">
        <section className="lai-trends-items" dir={ar?'rtl':'ltr'} aria-label={activeSection.title[lang]}>
          <div className="lai-trends-section-label">{activeSection.title[lang]}</div>
          {activeSection.items.map((item,index)=><button key={item.id} ref={index===0?firstItem:undefined} type="button" className="lai-trends-item" aria-pressed={index===itemIndex} onClick={()=>{setItemIndex(index);setShowPrompt(false);setClipboardStatus('');}} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const items=(event.currentTarget.parentElement as HTMLElement | null)?.querySelectorAll<HTMLButtonElement>('.lai-trends-item');if(items)items[(index+(event.key==='ArrowDown'?1:items.length-1))%items.length].focus();}}}><span>{item.title[lang]}</span><ChevronRight size={14} aria-hidden="true" /></button>)}
        </section>
        <section className="lai-trends-preview" dir={ar?'rtl':'ltr'} aria-label={t('Selected idea preview','معاينة الفكرة')}>
          <button type="button" className="lai-trends-close" aria-label={t('Close trends','اقفل الترندات')} onClick={()=>{const index=trendSections.findIndex(s=>s.id===openId);close();triggers.current[index]?.focus();}}><X size={15}/></button>
          <TrendArtwork section={activeSection.id} index={itemIndex} label={activeItem.title[lang]}/>
          <div className="lai-trends-preview-copy" aria-live="polite"><h2>{activeItem.title[lang]}</h2><p>{activeItem.description[lang]}</p></div>
          <button type="button" className="lai-trends-preview-button" aria-expanded={showPrompt} aria-controls={`${panelId}-prompt`} onClick={()=>setShowPrompt(!showPrompt)}>{t('Preview prompt','شوف البرومبت')}<ChevronDown size={14}/></button>
          <div id={`${panelId}-prompt`} className="lai-trends-prompt" hidden={!showPrompt}><p>{activeItem.prompt[lang]}</p><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(activeItem.prompt[lang]);setClipboardStatus(t('Copied','اتنسخ'));}catch{setClipboardStatus(t('Select the text and copy it manually.','حدد النص وانسخه بإيدك.'));}}}><Clipboard size={14}/>{t('Copy example','انسخ المثال')}</button><span role="status">{clipboardStatus}</span></div>
        </section>
      </div>}
    </div>
  </header>;
}
