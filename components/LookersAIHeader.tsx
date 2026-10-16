import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Clipboard, Sparkles, X } from 'lucide-react';
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

interface Props { libraryOpen: boolean; onLibraryToggle: () => void; children: React.ReactNode }

export default function LookersAIHeader({ libraryOpen, onLibraryToggle, children }: Props) {
  const { lang, setLang } = useLanguage();
  const ar = lang === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const root = useRef<HTMLElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const firstItem = useRef<HTMLButtonElement>(null);
  const timers = useRef<{ open?: ReturnType<typeof setTimeout>; close?: ReturnType<typeof setTimeout>; preview?: ReturnType<typeof setTimeout> }>({});
  const pinned = useRef(false);
  const focusFirst = useRef(false);
  const [openId, setOpenId] = useState<TrendSectionId | null>(null);
  const [itemIndex, setItemIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [clipboardStatus, setClipboardStatus] = useState<'copied' | 'error' | ''>('');
  const panelId = useId();
  const activeSection = trendSections.find(s => s.id === openId);
  const activeItem = activeSection?.items[itemIndex] ?? activeSection?.items[0];

  const clear = (key: 'open' | 'close' | 'preview') => clearTimeout(timers.current[key]);
  const close = () => { clear('open'); clear('close'); clear('preview'); pinned.current = false; setOpenId(null); };
  const open = (id: TrendSectionId) => {
    clear('open'); clear('close'); clear('preview');
    if (id !== openId) { setItemIndex(0); setShowPrompt(false); setClipboardStatus(''); }
    setOpenId(id);
  };
  const selectItem = (index: number) => { clear('preview'); setItemIndex(index); setShowPrompt(false); setClipboardStatus(''); };

  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(); };
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('pointerdown', outside); clear('open'); clear('close'); clear('preview'); };
  }, []);
  useEffect(() => { close(); }, [lang]);
  useEffect(() => { if (openId && focusFirst.current) { focusFirst.current = false; firstItem.current?.focus(); } }, [openId]);

  return <header ref={root} className="lai-trends-header" aria-label={t('Lookers AI navigation', 'تنقل Lookers AI')}
    onPointerEnter={() => clear('close')}
    onPointerLeave={() => { clear('open'); clear('preview'); if (!pinned.current && !root.current?.contains(document.activeElement)) timers.current.close = setTimeout(close, 280); }}
    onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) close(); }}
    onKeyDown={event => { if (event.key === 'Escape' && openId) { event.preventDefault(); const index = trendSections.findIndex(s => s.id === openId); close(); triggers.current[index]?.focus(); } }}>
    <div className="lai-trends-topline">
      <span className="lai-trends-ai" role="img" aria-label="AI"><Sparkles size={18} aria-hidden="true" /><span>AI</span></span>
      <nav className="lai-trends-nav" aria-label={t('Creative trends', 'الترندات الإبداعية')}>
        {trendSections.map((section, index) => <button key={section.id} type="button" ref={el => { triggers.current[index] = el; }}
          className="lai-trends-headline" aria-expanded={openId === section.id} aria-controls={panelId}
          onPointerEnter={event => { if (event.pointerType !== 'mouse') return; clear('close'); clear('open'); timers.current.open = setTimeout(() => open(section.id), 150); }}
          onPointerLeave={() => clear('open')}
          onClick={() => { if (openId === section.id && pinned.current) close(); else { open(section.id); pinned.current = true; } }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') { event.preventDefault(); if (openId === section.id) firstItem.current?.focus(); else { focusFirst.current = true; open(section.id); } }
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const offset = (event.key === 'ArrowRight' ? 1 : -1) * (ar ? -1 : 1); triggers.current[(index + offset + trendSections.length) % trendSections.length]?.focus(); }
          }}>{section.title[lang]}</button>)}
        <button type="button" className="lai-trends-headline lai-trends-library" aria-expanded={libraryOpen}
          onPointerEnter={() => { clear('open'); if (!pinned.current) close(); }}
          onClick={() => { close(); onLibraryToggle(); }}>{t('Prompt Library', 'مكتبة البرومبت')}</button>
      </nav>
    </div>
    <div className="lai-trends-utilities">
      <div className="lai-trends-existing-actions" onClick={close}>{children}</div>
      <div className="lai-trends-language" dir="ltr" role="group" aria-label={t('Language', 'اللغة')}>
        <button type="button" aria-pressed={ar} onClick={() => setLang('ar')}>AR</button><button type="button" aria-pressed={!ar} onClick={() => setLang('en')}>EN</button>
      </div>
    </div>
    <div id={panelId} className="lai-trends-popover" hidden={!activeSection}>
      {activeSection && activeItem && <div className="lai-trends-panel">
        <section className="lai-trends-items" dir={ar ? 'rtl' : 'ltr'} aria-label={activeSection.title[lang]}>
          <div className="lai-trends-section-label">{activeSection.title[lang]}</div>
          {activeSection.items.map((item, index) => <button key={item.id} ref={index === 0 ? firstItem : undefined} type="button" className="lai-trends-item" aria-pressed={index === itemIndex}
            onPointerEnter={event => { if (event.pointerType === 'mouse') { clear('preview'); timers.current.preview = setTimeout(() => selectItem(index), 90); } }}
            onPointerLeave={() => clear('preview')} onFocus={() => { clear('close'); selectItem(index); }} onClick={() => { selectItem(index); pinned.current = true; }}
            onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); const items = (event.currentTarget.parentElement as HTMLElement | null)?.querySelectorAll<HTMLButtonElement>('.lai-trends-item'); if (items) items[(index + (event.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); } }}>
            <span>{item.title[lang]}</span><ChevronRight size={15} aria-hidden="true" />
          </button>)}
          <small className="lai-trends-editorial">{t('Starting points. Each section’s library will grow here.', 'أفكار مبدئية. مكتبة كل قسم هتتضاف هنا تدريجيًا.')}</small>
        </section>
        <section className="lai-trends-preview" dir={ar ? 'rtl' : 'ltr'} aria-label={t('Selected idea preview', 'معاينة الفكرة المختارة')}>
          <button type="button" className="lai-trends-close" aria-label={t('Close trends', 'إغلاق الترندات')} onClick={() => { const index = trendSections.findIndex(s => s.id === openId); close(); triggers.current[index]?.focus(); }}><X size={17} /></button>
          <TrendArtwork section={activeSection.id} index={itemIndex} label={t('Illustration: ', 'رسم توضيحي: ') + activeItem.title[lang]} />
          <div className="lai-trends-preview-copy" aria-live="polite" aria-atomic="true"><h2>{activeItem.title[lang]}</h2><p>{activeItem.description[lang]}</p></div>
          <button type="button" className="lai-trends-preview-button" aria-expanded={showPrompt} aria-controls={`${panelId}-prompt`} onClick={() => { setShowPrompt(v => !v); setClipboardStatus(''); }}>{t('Preview prompt', 'معاينة البرومبت')}<ChevronDown size={15} aria-hidden="true" /></button>
          <div id={`${panelId}-prompt`} className="lai-trends-prompt" hidden={!showPrompt}>
            <p>{activeItem.prompt[lang]}</p><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(activeItem.prompt[lang]); setClipboardStatus('copied'); } catch { setClipboardStatus('error'); } }}>{clipboardStatus === 'copied' ? <Check size={15} /> : <Clipboard size={15} />}{t('Copy example', 'نسخ المثال')}</button>
            <span role="status">{clipboardStatus === 'copied' ? t('Copied', 'تم النسخ') : clipboardStatus === 'error' ? t('Could not copy. Select the text and copy it manually.', 'تعذر النسخ. حدّد النص وانسخه يدويًا.') : ''}</span>
          </div>
        </section>
      </div>}
    </div>
  </header>;
}
