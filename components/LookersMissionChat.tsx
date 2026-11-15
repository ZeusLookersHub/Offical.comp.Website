import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ImagePlus, Send, Sparkles } from 'lucide-react';
import {
  answer, applyCandidates, buildBrief, confirmBrief, createSession, nextStep, skip, submitIntake, suggest,
  type Blueprint, type GateReport, type Lang, type Session, type SlotValueRaw,
} from '../core/mission-engine';
import { lookersEngine } from '../services/lookersAiEngineClient';
import './LookersAdaptiveChat.css';
import './LookersMissionChat.css';

type Line = { role: 'assistant' | 'user'; text: string };
type Result = { output: Record<string, unknown>; report: GateReport; attempts: number };
type Saved = { session: Session; thread: Line[]; result?: Result };
type Engine = typeof lookersEngine;

interface Props {
  blueprint: Blueprint;
  lang: Lang;
  onUniverses: () => void;
  /** Injected in tests; defaults to the live engine. */
  engine?: Engine;
}

const storeKey = (bp: Blueprint) => `lookers-engine:${bp.id}:v${bp.version}`;
const load = (bp: Blueprint, lang: Lang): Saved => {
  try {
    const raw = localStorage.getItem(storeKey(bp));
    if (raw) {
      const saved = JSON.parse(raw) as Saved;
      if (saved.session?.blueprintVersion === bp.version) return { ...saved, session: { ...saved.session, lang } };
    }
  } catch { /* storage may be unavailable */ }
  return { session: createSession(bp, lang), thread: [] };
};

/** Downscale to ≤1280px JPEG in the browser so uploads stay small. */
async function toJpeg(file: File): Promise<{ mimeType: string; data: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL('image/jpeg', 0.85);
  return { mimeType: 'image/jpeg', data: url.slice(url.indexOf(',') + 1) };
}

const valueText = (bp: Blueprint, slotId: string, value: SlotValueRaw, lang: Lang) => {
  const slot = bp.slots.find(s => s.id === slotId);
  const one = (v: string) => slot?.options?.find(o => o.value === v)?.label[lang] ?? v;
  return Array.isArray(value) ? value.map(one).join(lang === 'ar' ? '، ' : ', ') : one(value);
};

/** The mission engine chat: one idea → only the missing questions → a brief → a checked prompt. */
const LookersMissionChat: React.FC<Props> = ({ blueprint: bp, lang, onUniverses, engine = lookersEngine }) => {
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en);
  const initial = useMemo(() => load(bp, lang), [bp, lang]);
  const [session, setSession] = useState<Session>(initial.session);
  const [thread, setThread] = useState<Line[]>(initial.thread);
  const [result, setResult] = useState<Result | undefined>(initial.result);
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [busy, setBusy] = useState<'' | 'reading' | 'writing'>('');
  const [error, setError] = useState('');
  const [why, setWhy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [tool, setTool] = useState('universal');
  const [copied, setCopied] = useState('');
  const body = useRef<HTMLDivElement>(null);
  const step = nextStep(session, bp);
  const sessionId = useRef<string>(initial.session.id);

  useEffect(() => {
    try { localStorage.setItem(storeKey(bp), JSON.stringify({ session, thread, result })); } catch { /* ignore */ }
  }, [bp, session, thread, result]);
  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight, behavior: 'smooth' }); }, [thread.length, step.type, result, busy]);
  useEffect(() => { setPicked([]); setWhy(false); setTyped(''); setIdeas([]); }, [step.type === 'question' ? step.question.slot : step.type]);

  const activeSlot = editing ?? (step.type === 'question' ? step.question.slot : step.type === 'intake' ? 'intake' : null);
  const slotDef = activeSlot && activeSlot !== 'intake' ? bp.slots.find(s => s.id === activeSlot) : undefined;
  const freeText = activeSlot === 'intake' || (slotDef && (slotDef.kind === 'text' || slotDef.kind === 'longtext' || slotDef.kind === 'exact'));

  // Contextual ideas from the model, debounced, only for descriptive fields.
  useEffect(() => {
    if (!slotDef || (slotDef.kind !== 'text' && slotDef.kind !== 'longtext') || typed.trim().length < 3) { setIdeas([]); return; }
    let live = true;
    const timer = setTimeout(() => {
      engine.ideas(bp.id, slotDef.id, typed, session.idea ?? '', lang).then(list => { if (live) setIdeas(list); }).catch(() => {});
    }, 700);
    return () => { live = false; clearTimeout(timer); };
  }, [typed, slotDef?.id]);

  const chips = activeSlot && freeText && slotDef?.kind !== 'exact'
    ? [...new Set([...suggest(bp, activeSlot, typed, { lang }), ...ideas])].slice(0, 8) : [];
  const addChip = (chip: string) => {
    void engine.track('suggestion_used', bp.id, { sessionId: sessionId.current, slot: activeSlot ?? undefined });
    if (activeSlot === 'intake' && !typed.trim()) { setTyped(chip); return; }
    const base = typed.replace(/\S*$/, '').trimEnd();
    setTyped(`${base}${base ? (lang === 'ar' ? '، ' : ', ') : ''}${chip} `);
  };

  const say = (...lines: Line[]) => setThread(prev => [...prev, ...lines]);
  const fileInput = useRef<HTMLInputElement>(null);
  const canAttach = bp.slots.some(s => s.id === 'reference') && session.phase !== 'confirmed';

  const attach = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) { setError(t('Please choose a photo (JPG, PNG or WebP).', 'اختار صورة (JPG أو PNG أو WebP).')); return; }
    setBusy('reading'); setError('');
    say({ role: 'user', text: t(`Attached a photo: ${file.name}`, `أرفقت صورة: ${file.name}`) });
    try {
      const { description, candidates } = await engine.describe(bp.id, await toJpeg(file), lang);
      if (!description) throw new Error('empty');
      say({ role: 'assistant', text: t('Here is what I see in your photo:\n', 'شفت في الصورة:\n') + description });
      let next: Session;
      if (session.phase === 'intake') {
        const r = submitIntake(session, bp, description, candidates);
        if (!r.ok) throw new Error('intake');
        next = r.value;
      } else next = applyCandidates(session, bp, description, candidates);
      const withRef = answer(next, bp, 'reference', 'yes');
      setSession(withRef.ok ? withRef.value : next);
      void engine.track('intake', bp.id, { sessionId: sessionId.current, meta: { photo: true, extracted: candidates.length } });
    } catch {
      setError(t('I could not read the photo right now — describe it in words instead.', 'مقدرتش أقرا الصورة دلوقتي، اوصفها بالكلام وهكمل معاك.'));
    } finally { setBusy(''); if (fileInput.current) fileInput.current.value = ''; }
  };

  const sendIntake = async (text: string) => {
    setBusy('reading'); setError('');
    say({ role: 'user', text });
    const candidates = await engine.intake(bp.id, text).catch(() => []);
    const r = submitIntake(session, bp, text, candidates);
    setBusy('');
    if (!r.ok) { setError(t('Please describe it in a few words.', 'اكتبلي الفكرة في كلمتين.')); return; }
    const understood = Object.entries(r.value.values).filter(([, v]) => v.source === 'extracted')
      .map(([id, v]) => `• ${bp.slots.find(s => s.id === id)?.label[lang]}: ${valueText(bp, id, v.value, lang)}`);
    if (understood.length) say({ role: 'assistant', text: t('Got it:\n', 'تمام، فهمت:\n') + understood.join('\n') });
    setSession(r.value);
    void engine.track('intake', bp.id, { sessionId: sessionId.current, meta: { extracted: understood.length } });
  };

  const sendAnswer = (slotId: string, value: SlotValueRaw, shown: string) => {
    const wasEditing = editing;
    const r = answer(session, bp, slotId, value);
    if (!r.ok) { setError(t('That answer does not fit — try again.', 'الإجابة دي مش مناسبة، جرّب تاني.')); return; }
    setError(''); setEditing(null); setResult(undefined);
    if (!wasEditing) say({ role: 'assistant', text: bp.slots.find(s => s.id === slotId)!.question[lang] }, { role: 'user', text: shown });
    setSession(r.value);
    void engine.track(wasEditing ? 'brief_edited' : 'answered', bp.id, { sessionId: sessionId.current, slot: slotId });
  };

  const submit = () => {
    const text = typed.trim();
    if (activeSlot === 'intake') { if (text) void sendIntake(text); return; }
    if (!slotDef) return;
    if (slotDef.kind === 'single' && picked[0]) sendAnswer(slotDef.id, picked[0], valueText(bp, slotDef.id, picked[0], lang));
    else if (slotDef.kind === 'multi' && picked.length) sendAnswer(slotDef.id, picked, valueText(bp, slotDef.id, picked, lang));
    else if (text) sendAnswer(slotDef.id, text, text);
  };

  const doSkip = (slotId: string) => {
    const r = skip(session, bp, slotId);
    if (!r.ok) return;
    say({ role: 'assistant', text: bp.slots.find(s => s.id === slotId)!.question[lang] }, { role: 'user', text: t('Skip — pick the best for me', 'تخطّى · اختارلي الأنسب') });
    setSession(r.value);
    void engine.track('skipped', bp.id, { sessionId: sessionId.current, slot: slotId });
  };

  const compose = async () => {
    const confirmed = session.phase === 'confirmed' ? { ok: true as const, value: session } : confirmBrief(session, bp);
    if (!confirmed.ok) { setError(t('Something is still missing in the brief.', 'لسه في حاجة ناقصة في البريف.')); return; }
    setSession(confirmed.value); setBusy('writing'); setError('');
    void engine.track('brief_confirmed', bp.id, { sessionId: sessionId.current });
    try {
      const res = await engine.compose(confirmed.value);
      setResult({ output: res.output, report: res.report, attempts: res.attempts });
      const variants = (res.output.variants ?? {}) as Record<string, string>;
      const chosen = String(confirmed.value.values.tool?.value ?? 'universal');
      setTool(variants[chosen] ? chosen : Object.keys(variants)[0] ?? 'universal');
      void engine.track('composed', bp.id, { sessionId: sessionId.current, meta: { passed: res.report.passed, total: res.report.total, attempts: res.attempts } });
    } catch {
      setError(t('The writer is busy right now. Your brief is saved — try again.', 'الكاتب مشغول دلوقتي. البريف بتاعك محفوظ، جرّب تاني.'));
    } finally { setBusy(''); }
  };

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked */ }
    setCopied(key); setTimeout(() => setCopied(''), 1600);
    void engine.track('copied', bp.id, { sessionId: sessionId.current, meta: { part: key } });
  };

  const restart = () => {
    const fresh = createSession(bp, lang);
    sessionId.current = fresh.id;
    setSession(fresh); setThread([]); setResult(undefined); setEditing(null); setError('');
  };

  const brief = step.type === 'brief' || session.phase === 'confirmed' ? buildBrief(session, bp) : null;
  const question = editing ? null : step.type === 'question' ? step.question : null;
  const options = slotDef?.options?.map(o => ({ value: o.value, label: o.label[lang], description: o.visual?.description[lang], asset: o.visual?.asset, media: o.visual?.media }));
  const out = result?.output;
  const variants = (out?.variants ?? {}) as Record<string, string>;
  const shownPrompt = variants[tool] ?? String(out?.prompt ?? '');
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

  const optionGrid = options && (
    <div className="lmc-options" role={slotDef?.kind === 'multi' ? 'group' : 'radiogroup'} aria-label={slotDef?.label[lang]}>
      {options.map(o => {
        const on = picked.includes(o.value);
        return (
          <button type="button" key={o.value} className={`lmc-option${on ? ' is-selected' : ''}`} aria-pressed={on}
            onClick={() => setPicked(prev => slotDef?.kind === 'multi' ? (on ? prev.filter(v => v !== o.value) : [...prev, o.value]) : [o.value])}>
            {o.asset && o.media !== 'video' && <img src={o.asset} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />}
            {o.asset && o.media === 'video' && <video src={o.asset} muted loop autoPlay playsInline onError={e => { e.currentTarget.style.display = 'none'; }} />}
            <strong>{o.label}</strong>
            {o.description && <small>{o.description}</small>}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="lai-chat lai-adaptive-chat lmc" aria-label={bp.title[lang]} data-testid="mission-chat" data-phase={session.phase}>
      <div className="lai-adaptive-topbar">
        <span>{bp.title[lang]}</span>
        <span className="lmc-topbar-actions">
          {session.phase !== 'intake' && <button type="button" onClick={restart}>{t('Start over', 'ابدأ من الأول')}</button>}
          <button type="button" onClick={onUniverses}>{t('← Universes', '← العوالم')}</button>
        </span>
      </div>

      <div className="lai-adaptive-body" ref={body}>
        {thread.map((line, i) => <p key={i} className={`lai-message lai-message--${line.role}`}>{line.text}</p>)}

        {step.type === 'intake' && !busy && (
          <div className="lai-current-message">
            <div className="lai-message lai-message--assistant"><h2>{step.question}</h2><p className="lai-adaptive-example">{step.why}</p></div>
          </div>
        )}

        {question && !busy && (
          <div className="lai-current-message" data-testid="question-content" data-slot={question.slot}>
            <div className="lai-message lai-message--assistant">
              <h2>{question.message}</h2>
              <p className="lai-adaptive-example">{t('For example: ', 'مثال: ')}{question.example}</p>
            </div>
            <div className="lmc-row">
              <button type="button" className="lai-explain" aria-expanded={why} onClick={() => setWhy(v => !v)}>{t('Why this question?', 'ليه بنسأل؟')}</button>
              {question.canSkip && <button type="button" className="lai-explain" onClick={() => doSkip(question.slot)}>{question.skipLabel}</button>}
              <span className="lmc-progress">{t(`${step.type === 'question' ? step.progress.remaining : 0} left`, `فاضل ${step.type === 'question' ? step.progress.remaining : 0}`)}</span>
            </div>
            {why && <p className="lai-adaptive-help" role="note">{question.why}</p>}
            {optionGrid}
          </div>
        )}

        {busy && <p className="lai-message lai-message--assistant lmc-thinking" role="status">{busy === 'reading' ? t('Reading…', 'بقرا…') : t('Writing and checking your prompt…', 'بكتب البرومبت وبراجعه…')}</p>}

        {brief && !busy && !result && (
          <article className="lmc-brief" data-testid="brief">
            <header><Sparkles size={16} aria-hidden="true" /><h2>{t('Your brief', 'البريف بتاعك')}</h2></header>
            {brief.idea && <p className="lmc-idea">“{brief.idea}”</p>}
            {[[t('What you told me', 'اللي قلته'), brief.facts], [t('What I assumed — change anything', 'اللي افترضته · غيّر أي حاجة'), brief.assumptions], [t('Excluded', 'ممنوع'), brief.exclusions]].map(([title, items]) =>
              (items as typeof brief.facts).length ? (
                <section key={title as string}>
                  <h3>{title as string}</h3>
                  <ul>{(items as typeof brief.facts).map(item => (
                    <li key={item.slot} className={item.source === 'default' ? 'is-assumed' : ''}>
                      <span><b>{item.label}</b>{item.value}{item.reason && <small>{item.reason}</small>}</span>
                      <button type="button" onClick={() => { setEditing(item.slot); setPicked([]); setTyped(''); }}>{t('Change', 'غيّر')}</button>
                    </li>))}</ul>
                </section>) : null)}
            {editing && slotDef && (
              <div className="lmc-edit" data-slot={editing}>
                <p>{slotDef.question[lang]}</p>
                {optionGrid}
                <button type="button" className="lai-explain" onClick={() => setEditing(null)}>{t('Cancel', 'إلغاء')}</button>
              </div>
            )}
            {!editing && <button type="button" className="lai-chat__generate" disabled={!brief.ready} onClick={() => void compose()}>{t('Looks right — write my prompt', 'تمام كده · اكتب البرومبت')}</button>}
            <p className="lmc-note">{brief.output}</p>
          </article>
        )}

        {out && !busy && (
          <article className="lmc-result" data-testid="result">
            <header>
              <h2>{String(out.title ?? bp.title[lang])}</h2>
              <span className={`lmc-checks${result!.report.ok ? ' is-ok' : ''}`} title={result!.report.results.map(r => `${r.ok ? '✓' : '✗'} ${r.message}`).join('\n')}>
                {result!.report.ok ? <Check size={14} aria-hidden="true" /> : '!'} {t(`Passed ${result!.report.passed} of ${result!.report.total} checks`, `عدّى ${result!.report.passed} من ${result!.report.total} فحوصات`)}
              </span>
            </header>
            {out.summary ? <p className="lmc-summary">{String(out.summary)}</p> : null}
            <ul className="lmc-check-list">{result!.report.results.map(r => <li key={r.id} className={r.ok ? 'is-ok' : 'is-fail'}>{r.ok ? '✓' : '✗'} {r.message}</li>)}</ul>
            {Object.keys(variants).length > 1 && (
              <div className="lmc-tabs" role="tablist" aria-label={t('Tool', 'الأداة')}>
                {Object.keys(variants).map(id => <button type="button" role="tab" key={id} aria-selected={tool === id} onClick={() => setTool(id)}>{bp.slots.find(s => s.role === 'target-tool')?.options?.find(o => o.value === id)?.label[lang] ?? id}</button>)}
              </div>
            )}
            <div className="lmc-prompt" dir="ltr"><pre>{shownPrompt}</pre>
              <button type="button" className="lai-chat__generate" onClick={() => void copy(shownPrompt, 'prompt')}><Copy size={15} aria-hidden="true" /> {copied === 'prompt' ? t('Copied', 'اتنسخ') : t('Copy prompt', 'انسخ البرومبت')}</button>
            </div>
            {typeof out.negative === 'string' && <section><h3>{t('Avoid (negative prompt)', 'الممنوعات (Negative)')}</h3><div className="lmc-prompt lmc-prompt--small" dir="ltr"><pre>{out.negative}</pre><button type="button" className="lai-explain" onClick={() => void copy(String(out.negative), 'negative')}>{copied === 'negative' ? t('Copied', 'اتنسخ') : t('Copy', 'انسخ')}</button></div></section>}
            {out.params && typeof out.params === 'object' && <p className="lmc-params">{Object.entries(out.params as Record<string, unknown>).map(([k, v]) => `${k === 'aspectRatio' ? t('Size', 'المقاس') : k === 'duration' ? t('Length (s)', 'المدة (ثانية)') : k}: ${String(v)}`).join(' · ')}</p>}
            {list(out.shots).length > 0 && <section><h3>{t('Shot plan', 'خطة اللقطات')}</h3><ol dir="ltr">{list(out.shots).map((s, i) => <li key={i}>{s}</li>)}</ol></section>}
            {list(out.slideOutline).length > 0 && <section><h3>{t('Slide outline', 'ترتيب الشرائح')}</h3><ol>{list(out.slideOutline).map((s, i) => <li key={i}>{s}</li>)}</ol></section>}
            {list(out.pageOutline).length > 0 && <section><h3>{t('Page outline', 'أقسام الصفحة')}</h3><ol>{list(out.pageOutline).map((s, i) => <li key={i}>{s}</li>)}</ol></section>}
            {list(out.missingData).length > 0 && <section className="lmc-missing"><h3>{t('Fill these in before using it', 'كمّل دول قبل ما تستخدمه')}</h3><ul>{list(out.missingData).map((s, i) => <li key={i}>{s}</li>)}</ul></section>}
            {list(out.checklist).length > 0 && <section><h3>{t('Check the result', 'راجع النتيجة على')}</h3><ul>{list(out.checklist).map((s, i) => <li key={i}>{s}</li>)}</ul></section>}
            <div className="lmc-row">
              <button type="button" className="lai-explain" onClick={() => { setResult(undefined); setSession({ ...session, phase: 'brief' }); }}>{t('Edit the brief', 'عدّل البريف')}</button>
              <button type="button" className="lai-explain" onClick={restart}>{t('New request', 'طلب جديد')}</button>
            </div>
          </article>
        )}
      </div>

      {(step.type === 'intake' || question || editing) && !busy && (
        <footer className="lai-adaptive-footer">
          {error && <p className="lai-adaptive-notice" role="alert">{error}</p>}
          {chips.length > 0 && (
            <div className="lmc-chips" aria-label={t('Suggestions', 'اقتراحات')}>
              {chips.map(chip => <button type="button" key={chip} onClick={() => addChip(chip)}>{chip}</button>)}
            </div>
          )}
          <form className="lai-composer" onSubmit={e => { e.preventDefault(); submit(); }}>
            {canAttach && !editing && <>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden onChange={e => void attach(e.target.files?.[0])} data-testid="photo-input" />
              <button type="button" className="lai-attach" aria-label={t('Attach a product photo', 'ارفع صورة المنتج')} title={t('Attach a product photo', 'ارفع صورة المنتج')} onClick={() => fileInput.current?.click()}><ImagePlus size={19} /></button>
            </>}
            {freeText ? (
              <textarea className="lmc-input" rows={1} value={typed} maxLength={slotDef?.maxLength ?? 4000}
                placeholder={activeSlot === 'intake' ? t('I want…', 'أنا عايز…') : slotDef?.example[lang]}
                aria-label={activeSlot === 'intake' ? (step.type === 'intake' ? step.question : '') : slotDef?.question[lang]}
                onChange={e => setTyped(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} />
            ) : (
              <p className="lai-composer-hint">{picked.length ? valueText(bp, slotDef!.id, slotDef!.kind === 'multi' ? picked : picked[0], lang) : t('Choose an option above', 'اختار من فوق')}</p>
            )}
            <button type="submit" className="lai-send" aria-label={t('Send', 'إرسال')} disabled={freeText ? !typed.trim() : !picked.length}><span><Send size={20} /></span></button>
          </form>
        </footer>
      )}
      {(brief || out) && error && !busy && <p className="lai-adaptive-notice lmc-error" role="alert">{error} {session.phase === 'confirmed' && !out && <button type="button" className="lai-explain" onClick={() => void compose()}>{t('Try again', 'جرّب تاني')}</button>}</p>}
    </section>
  );
};

export default LookersMissionChat;
