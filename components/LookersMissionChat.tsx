import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Copy, ExternalLink, ImagePlus, MessageSquarePlus, Send, Sparkles } from 'lucide-react';
import {
  answer, applyCandidates, buildBrief, confirmBrief, createSession, nextStep, normalize, planLaunch, skip, submitIntake, suggest,
  type Blueprint, type GateReport, type Lang, type Session, type SlotValueRaw,
} from '../core/mission-engine/client';
import { lookersEngine } from '../services/lookersAiEngineClient';
import './LookersAdaptiveChat.css';
import './LookersMissionChat.css';

type Line = { role: 'assistant' | 'user'; text: string };
type Move = { received: string; issues: string[]; next: string; message: string; finished: boolean };
/** The follow-up trail after the prompt went to the tool: what is finished and the last message we wrote. */
type Follow = { done: string[]; moves: Move[] };
type Result = { output: Record<string, unknown>; report: GateReport; attempts: number; follow?: Follow };
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
  const [continuing, setContinuing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [revisionRequest, setRevisionRequest] = useState('');
  const [continuationError, setContinuationError] = useState('');
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

  // Contextual ideas from the model, debounced, only for descriptive fields — and only once the
  // mission's own vocabulary has stopped being useful. The vocabulary always has something to
  // show, but when nothing continues the word being typed those chips are padding, and that is
  // the moment a model is worth paying for. This call fires more often than any other, so every
  // one it skips is quota and balance kept for the writing itself.
  useEffect(() => {
    if (!slotDef || (slotDef.kind !== 'text' && slotDef.kind !== 'longtext') || typed.trim().length < 3) { setIdeas([]); return; }
    const lastWord = normalize(typed.trim().split(/\s+/).pop() ?? '');
    const localFits = lastWord.length >= 1
      && suggest(bp, slotDef.id, typed, { lang }).some(chip => normalize(chip).startsWith(lastWord));
    if (localFits || typed.trim().length < 12) { setIdeas([]); return; }
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
      next = { ...next, references: [...(next.references ?? []), description.slice(0, 1500)].slice(-3) };
      const withRef = next.values.reference?.value === 'yes' ? { ok: false as const } : answer(next, bp, 'reference', 'yes');
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
    if (slotId === 'reference' && value === 'yes' && !session.references?.length) {
      const basis = r.value.values.basis?.value;
      say({ role: 'assistant', text: basis === 'edit'
        ? t('Upload the image you want changed, at the best quality you have. I will read it and build the edit on it.', 'ارفع الصورة اللي عايز تعدّلها نفسها، بأعلى جودة عندك. هقراها وأبني التعديل عليها.')
        : basis === 'existing'
          ? t('Upload the thing itself — your logo, the product, or a past design. One clear photo on a plain background is best. I will read it and keep what is in it.', 'ارفع الحاجة نفسها: اللوجو، أو المنتج، أو تصميم قديم. صورة واحدة واضحة على خلفية سادة أحسن حاجة. هقراها وأحافظ على اللي فيها.')
          : t('Upload a picture whose look you like — I will use it as style inspiration, not copy it.', 'ارفع صورة عاجبك شكلها، هستخدمها كإلهام للستايل مش هنسخها.') });
      fileInput.current?.click();
    }
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
    } catch (thrown) {
      const code = thrown instanceof Error ? thrown.message : '';
      setError(
        code === 'unknown_blueprint' || code === 'version_mismatch'
          ? t('This mission is not published on the server yet. Your brief is saved — try again once it is.',
              'المهمة دي لسه مش منشورة على السيرفر. البريف بتاعك محفوظ، جرّب تاني بعد نشرها.')
        : code === 'rate_limited'
          ? t('That is a lot of prompts in one minute. Wait a moment and try again.',
              'ده كتير في دقيقة واحدة. استنى شوية وجرّب تاني.')
        : t('The writer is busy right now. Your brief is saved — try again.',
            'الكاتب مشغول دلوقتي. البريف بتاعك محفوظ، جرّب تاني.'));
    } finally { setBusy(''); }
  };

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked */ }
    setCopied(key); setTimeout(() => setCopied(''), 1600);
    void engine.track('copied', bp.id, { sessionId: sessionId.current, meta: { part: key } });
  };

  /** The user brings back the tool's reply: we track what is done and write the next message to paste. */
  const followUp = async () => {
    if (!result || aiResponse.trim().length < 10 || busy) return;
    const follow = result.follow ?? { done: [], moves: [] };
    const last = follow.moves[follow.moves.length - 1];
    setContinuationError(''); setBusy('writing');
    try {
      const move = await engine.next(session, { sent: last?.message ?? shownPrompt, reply: aiResponse.trim().slice(0, 10000), note: revisionRequest.trim().slice(0, 1000) || undefined, done: follow.done });
      setResult({ ...result, follow: { done: move.done, moves: [...follow.moves, { received: move.received, issues: move.issues, next: move.next, message: move.message, finished: move.finished }].slice(-8) } });
      setAiResponse(''); setRevisionRequest(''); setContinuing(false);
      void engine.track('followed_up', bp.id, { sessionId: sessionId.current, meta: { step: follow.moves.length + 1, issues: move.issues.length, finished: move.finished } });
    } catch (thrown) {
      const code = thrown instanceof Error ? thrown.message : '';
      setContinuationError(code === 'rate_limited'
        ? t('That is a lot in one minute. Wait a moment and try again.', 'ده كتير في دقيقة واحدة. استنى شوية وجرّب تاني.')
        : t('I could not read it right now — your text is still here, try again.', 'مقدرتش أقراه دلوقتي. الكلام بتاعك لسه موجود، جرّب تاني.'));
    } finally { setBusy(''); }
  };

  /** Send the prompt to the tool itself: in the URL where the tool supports it, otherwise copy then open. */
  const openIn = async (toolId: string, prompt: string) => {
    const plan = planLaunch(toolId, prompt);
    if (!plan) return;
    if (plan.mode === 'copy') {
      try { await navigator.clipboard.writeText(prompt); } catch { /* clipboard blocked */ }
      setCopied('launch:' + toolId); setTimeout(() => setCopied(''), 2600);
    }
    void engine.track('tool_opened', bp.id, { sessionId: sessionId.current, meta: { tool: toolId, mode: plan.mode } });
    window.open(plan.url, '_blank', 'noopener,noreferrer');
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
  const toolLabels = bp.slots.find(sl => sl.role === 'target-tool')?.options ?? [];
  const launchTools = useMemo(() => {
    const ids = Object.keys(variants).length ? Object.keys(variants) : [tool];
    const seen = new Set<string>();
    return ids.flatMap(id => {
      if (seen.has(id)) return [];
      seen.add(id);
      const plan = planLaunch(id, variants[id] ?? shownPrompt);
      if (!plan) return [];
      const label = toolLabels.find(o => o.value === id)?.label[lang] ?? id;
      return [{ id, label, plan }];
    });
  }, [variants, shownPrompt, tool, lang, toolLabels]);
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const follow = result?.follow;
  const lastMove = follow?.moves[follow.moves.length - 1];

  const optionGrid = options && (
    <div className="lmc-options" role={slotDef?.kind === 'multi' ? 'group' : 'radiogroup'} aria-label={slotDef?.label[lang]}>
      {options.map(o => {
        const on = picked.includes(o.value);
        return (
          <button type="button" key={o.value} className={`lmc-option${on ? ' is-selected' : ''}`} aria-pressed={on}
            onClick={() => setPicked(prev => slotDef?.kind === 'multi' ? (on ? prev.filter(v => v !== o.value) : [...prev, o.value]) : [o.value])}>
            {o.asset && o.media !== 'video' && (
              <img src={o.asset} alt="" loading="lazy" onError={e => {
                // A real render takes precedence; the drawn preview stands in until one exists.
                const img = e.currentTarget;
                const preview = o.asset!.replace(/\.(webp|png|jpg|jpeg)$/i, '.svg');
                if (preview !== img.getAttribute('src')) { img.src = preview; return; }
                img.style.display = 'none';
              }} />
            )}
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
          <article className="lmc-brief lmc-brief--compact" data-testid="brief">
            <header><Sparkles size={16} aria-hidden="true" /><h2>{t('Your brief', 'البريف بتاعك')}</h2></header>
            {brief.idea && <p className="lmc-idea">{`"${brief.idea}"`}</p>}
            <ul className="lmc-bullets">
              {[...brief.facts, ...brief.assumptions].map(item => (
                <li key={item.slot} className={item.source === 'default' ? 'is-assumed' : ''}
                  role="button" tabIndex={0}
                  onClick={() => { setEditing(item.slot); setPicked([]); setTyped(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { setEditing(item.slot); setPicked([]); setTyped(''); } }}>
                  <b>{item.label}:</b> {item.value}
                  {item.source === 'default' && <small className="lmc-assumed-tag">{t('assumed', 'مفترض')}</small>}
                </li>
              ))}
              {brief.exclusions.length > 0 && brief.exclusions.map(item => (
                <li key={item.slot} className="is-excluded"
                  role="button" tabIndex={0}
                  onClick={() => { setEditing(item.slot); setPicked([]); setTyped(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { setEditing(item.slot); setPicked([]); setTyped(''); } }}>
                  <b>✗ {item.label}:</b> {item.value}
                </li>
              ))}
            </ul>
            <p className="lmc-bullets-hint">{t('Tap any point to change it', 'اضغط على أي نقطة عشان تغيّرها')}</p>
            {editing && slotDef && (
              <div className="lmc-edit" data-slot={editing}>
                <p>{slotDef.question[lang]}</p>
                {optionGrid}
                <button type="button" className="lai-explain" onClick={() => setEditing(null)}>{t('Cancel', 'إلغاء')}</button>
              </div>
            )}
            {!editing && <button type="button" className="lai-chat__generate" disabled={!brief.ready} onClick={() => void compose()}>{t('Looks right — write my prompt', 'تمام كده · اكتب البرومبت')}</button>}
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
            {list(out.referenceGuide).length > 0 && <section className="lmc-refguide"><h3><ImagePlus size={15} aria-hidden="true" /> {t('Attach your reference with the prompt', 'إزاي تحط المرجع مع البرومبت')}</h3><ol>{list(out.referenceGuide).map((s, i) => <li key={i}>{s}</li>)}</ol></section>}
            {launchTools.length > 0 && (
              <section className="lmc-launch">
                <h3>{t('Open it in the tool', 'افتحه في الأداة')}</h3>
                <p className="lmc-launch__hint">{t('The prompt travels with you. Where a tool cannot take it in the link, we copy it first — one paste, then send.', 'البرومبت بيمشي معاك. الأدوات اللي مش بتاخده في اللينك بننسخه لك الأول — لزقة واحدة وابعت.')}</p>
                <div className="lmc-launch__row">
                  {launchTools.map(({ id, label, plan }) => (
                    <button type="button" key={id} className="lmc-tool" onClick={() => void openIn(id, variants[id] ?? shownPrompt)}
                      aria-label={t(`Open ${label}`, `افتح ${label}`)}>
                      <span className="lmc-tool__mark" aria-hidden="true">
                        <span className="lmc-tool__letter">{label.trim().charAt(0).toUpperCase()}</span>
                        <img src={plan.logo} alt="" width={22} height={22} loading="lazy"
                          onError={e => { (e.currentTarget as HTMLImageElement).remove(); }} />
                      </span>
                      <span className="lmc-tool__name">{label}</span>
                      {copied === 'launch:' + id
                        ? <span className="lmc-tool__state">{t('Copied — paste it', 'اتنسخ — الزقه')}</span>
                        : <ExternalLink size={13} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </section>
            )}
            {typeof out.negative === 'string' && <section><h3>{t('Avoid (negative prompt)', 'الممنوعات (Negative)')}</h3><div className="lmc-prompt lmc-prompt--small" dir="ltr"><pre>{out.negative}</pre><button type="button" className="lai-explain" onClick={() => void copy(String(out.negative), 'negative')}>{copied === 'negative' ? t('Copied', 'اتنسخ') : t('Copy', 'انسخ')}</button></div></section>}
            {out.params && typeof out.params === 'object' && <p className="lmc-params">{Object.entries(out.params as Record<string, unknown>).map(([k, v]) => `${k === 'aspectRatio' ? t('Size', 'المقاس') : k === 'duration' ? t('Length (s)', 'المدة (ثانية)') : k}: ${String(v)}`).join(' · ')}</p>}
            {list(out.shots).length > 0 && <section><h3>{t('Shot plan', 'خطة اللقطات')}</h3><ol dir="ltr">{list(out.shots).map((s, i) => <li key={i}>{s}</li>)}</ol></section>}
            {list(out.slideOutline).length > 0 && <section><h3>{t('Slide outline', 'ترتيب الشرائح')}</h3><ol>{list(out.slideOutline).map((s, i) => <li key={i}>{s}</li>)}</ol></section>}
            {list(out.pageOutline).length > 0 && <section><h3>{t('Page outline', 'أقسام الصفحة')}</h3><ol>{list(out.pageOutline).map((s, i) => <li key={i}>{s}</li>)}</ol></section>}
            {list(out.missingData).length > 0 && <section className="lmc-missing"><h3>{t('Fill these in before using it', 'كمّل دول قبل ما تستخدمه')}</h3><ul>{list(out.missingData).map((s, i) => <li key={i}>{s}</li>)}</ul></section>}
            {list(out.checklist).length > 0 && <section><h3>{t('Check the result', 'راجع النتيجة على')}</h3><ul>{list(out.checklist).map((s, i) => <li key={i}>{s}</li>)}</ul></section>}
            {/* ── Follow-up: walk with the user through the tool until the result is done ── */}
            <section className="lmc-next">
              <h3><MessageSquarePlus size={15} aria-hidden="true" /> {t('Run it with me, step by step', 'نكمّل سوا خطوة بخطوة')}</h3>
              {!follow?.moves.length && <p className="lmc-next__hint">{t(
                'Send the prompt to the tool, then paste its reply here. I will tell you what is done, fix what went wrong, and give you the next message so the tool delivers instead of talking.',
                'ابعت البرومبت للأداة، وبعدين الزق ردها هنا. هقولك إيه اللي خلص، وأصلّح اللي غلط، وأديك الرسالة الجاية عشان الأداة تنفّذ بدل ما ترغي.'
              )}</p>}
              {follow && follow.done.length > 0 && (
                <ol className="lmc-steps" aria-label={t('Done so far', 'اللي خلص')}>
                  {follow.done.map((d, i) => <li key={i} className="is-done"><Check size={13} aria-hidden="true" /> {d}</li>)}
                  {lastMove && !lastMove.finished && <li className="is-next"><ArrowRight size={13} aria-hidden="true" /> {lastMove.next}</li>}
                </ol>
              )}
              {lastMove && (
                <div className="lmc-move">
                  {lastMove.received && <p className="lmc-move__got">{t('Got: ', 'وصلني: ')}{lastMove.received}</p>}
                  {lastMove.issues.length > 0 && <ul className="lmc-move__issues" aria-label={t('Fixed in the next message', 'هيتصلّح في الرسالة الجاية')}>{lastMove.issues.map((x, i) => <li key={i}>{x}</li>)}</ul>}
                  <h4>{lastMove.finished ? t('All parts are done — ask for the final version:', 'كل الأجزاء خلصت. اطلب النسخة النهائية:') : t('Paste this in the same chat:', 'الزق ده في نفس الشات:')}</h4>
                  <div className="lmc-prompt lmc-prompt--small"><pre>{lastMove.message}</pre>
                    <button type="button" className="lai-chat__generate" onClick={() => void copy(lastMove.message, 'move')}><Copy size={15} aria-hidden="true" /> {copied === 'move' ? t('Copied', 'اتنسخ') : t('Copy message', 'انسخ الرسالة')}</button>
                  </div>
                </div>
              )}
              {!continuing ? (
                <div className="lmc-next__actions">
                  <button type="button" className="lmc-next__primary" onClick={() => { setContinuing(true); setContinuationError(''); }}>
                    <ArrowRight size={16} aria-hidden="true" /> {lastMove ? t('Paste the next reply', 'الزق الرد الجديد') : t('Paste the tool reply', 'الزق رد الأداة')}
                  </button>
                  <button type="button" className="lai-explain" onClick={() => { setResult(undefined); setSession({ ...session, phase: 'brief' }); }}>{t('Edit the brief', 'عدّل البريف')}</button>
                  <button type="button" className="lai-explain" onClick={restart}>{t('Start over', 'ابدأ من الأول')}</button>
                </div>
              ) : (
                <form className="lmc-next__form" onSubmit={e => { e.preventDefault(); void followUp(); }}>
                  <label htmlFor="lmc-ai-response">{t('What the tool replied', 'رد الأداة')}</label>
                  <textarea id="lmc-ai-response" value={aiResponse} maxLength={10000} required disabled={!!busy}
                    onChange={e => setAiResponse(e.target.value)}
                    placeholder={t('Paste the whole reply…', 'انسخ الرد كله وحطّه هنا…')} />
                  <label htmlFor="lmc-revision-request">{t('Anything you want changed? (optional)', 'عايز تغيّر حاجة؟ (اختياري)')}</label>
                  <textarea id="lmc-revision-request" value={revisionRequest} maxLength={1000} disabled={!!busy}
                    onChange={e => setRevisionRequest(e.target.value)}
                    placeholder={t('e.g. the logo feels too plain, make it bolder', 'مثلاً: اللوجو حاسه عادي، خليه أجرأ')} />
                  {continuationError && <p className="lmc-next__error" role="alert">{continuationError}</p>}
                  <div className="lmc-next__actions">
                    <button type="submit" className="lmc-next__primary" disabled={aiResponse.trim().length < 10 || !!busy}>
                      {busy === 'writing' ? t('Reading…', 'بقرا الرد…') : t('Read it · give me the next step', 'اقراه · هات الخطوة الجاية')}
                    </button>
                    <button type="button" className="lai-explain" disabled={!!busy} onClick={() => setContinuing(false)}>{t('Cancel', 'إلغاء')}</button>
                  </div>
                </form>
              )}
            </section>
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
              <button type="button" className="lai-attach" aria-label={t('Attach a reference photo', 'ارفع صورة مرجع')} title={t('Attach a reference photo', 'ارفع صورة مرجع')} onClick={() => fileInput.current?.click()}><ImagePlus size={19} /></button>
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
