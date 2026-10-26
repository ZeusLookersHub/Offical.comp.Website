import React, { useEffect, useRef, useState } from 'react';
import type { Lang, ProjectDraft } from '../data/lookersAi';
import { nextChatTurn, submitChatAnswer, getChatRefinements, submitChatRefinement,
  skipChatRefinements, explainChatQuestion, type ChatQuestion } from '../services/lookersAiChatWorkflow';
import { Paperclip, Send } from 'lucide-react';
import './LookersAdaptiveChat.css';

interface Props {
  draft: ProjectDraft; lang: Lang; busy: boolean; generating: boolean; notice: string; prompt: string;
  onCommit: (draft: ProjectDraft) => void; onGenerate: () => void; onAttach: () => void;
  onUniverses: () => void; onCopy: () => void; onDownload: () => void;
  onEditPrompt: (value: string) => void; onImprove: () => void;
}
type HistoryEntry = { question: ChatQuestion; answer: string | string[] };

/** Presentation and transient controls only. The existing backend owns interview progression. */
const LookersAdaptiveChat: React.FC<Props> = (props) => {
  const { draft, lang } = props;
  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;
  const turn = nextChatTurn(draft, lang);
  const refinements = getChatRefinements(draft, lang);
  const [refining, setRefining] = useState(false);
  const [refinementId, setRefinementId] = useState('');
  const [skipped, setSkipped] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const optional = refinements.questions.filter(q => !skipped.includes(q.id));
  const refinement = optional.find(q => q.id === refinementId) || optional[0];
  const question = turn.status === 'question' ? turn.question : refining ? refinement : undefined;
  const result = draft.step === 'result' && !!draft.generatedPrompt;
  const canGenerate = turn.status === 'ready' && !props.busy && !props.generating;
  const skipAll = () => {
    if (skipChatRefinements(draft, lang).status === 'ready') { setRefining(false); setRefinementId(''); }
  };
  const save = (answer: string | string[]) => {
    if (!question) return false;
    const response = turn.status === 'question'
      ? submitChatAnswer(draft, lang, question.id, answer)
      : submitChatRefinement(draft, lang, question.id, answer);
    if (!response.ok) return false;
    setHistory(items => [...items, { question, answer }]);
    props.onCommit(response.draft);
    setRefinementId('');
    return true;
  };
  // A new project owns a fresh transient interview; persisted answers stay in ProjectDraft.
  useEffect(() => { setHistory([]); setHistoryIndex(null); setRefining(false); setSkipped([]); }, [draft.id]);
  const historical = historyIndex === null ? undefined : history[historyIndex];
  const thread = useRef<HTMLDivElement>(null);
  useEffect(() => { if (thread.current) thread.current.scrollTop = thread.current.scrollHeight; }, [question?.id, history.length, result, historyIndex]);
  const transcript = <>
    {history.length === 0 && draft.answers.idea && <p className="lai-message lai-message--user">{String(draft.answers.idea)}</p>}
    {history.map((item, index) => <React.Fragment key={`${index}:${item.question.id}`}>
      <p className="lai-message lai-message--assistant">{item.question.message}</p>
      <p className="lai-message lai-message--user">{(Array.isArray(item.answer) ? item.answer : [item.answer]).map(value => item.question.control.type === 'single' || item.question.control.type === 'multi' ? item.question.control.options.find(option => option.value === value)?.label || value : value).join('، ')}</p>
    </React.Fragment>)}
  </>;
  const utilities = <>
    {props.notice && <p className="lai-adaptive-notice" role="status">{props.notice}</p>}
    {!!draft.attachments.length && <ul className="lai-adaptive-files" aria-label={t('Attached files', 'الملفات المرفقة')}>{draft.attachments.map(file => <li key={file.id}>{file.name} · {file.processing ? t('Preparing…', 'بنجهّزه…') : file.include ? t('Included', 'مرفق') : t('Needs attention', 'محتاج مراجعة')}</li>)}</ul>}
    <div className="lai-adaptive-nav">
      {history.length > 0 && <button type="button" onClick={() => setHistoryIndex(index => index === null ? history.length - 1 : Math.max(0, index - 1))}>{t('Previous answer', 'الإجابة السابقة')}</button>}
      {turn.status === 'ready' && !result && <>
        {refining && <button type="button" onClick={skipAll}>{t('Skip refinements', 'تخطّى التحسينات')}</button>}
        <button type="button" className="lai-chat__generate" disabled={!canGenerate} onClick={() => {setHistoryIndex(null);props.onGenerate();}}>{props.generating ? t('Generating…', 'بنجهّز البرومبت…') : t('Generate result', 'توليد النتيجة')}</button>
      </>}
    </div>
  </>;
  const optionalChoice = turn.status === 'ready' && question ? <div className="lai-adaptive-refinements">
    <label htmlFor="lai-refinement-choice">{t('Optional refinement', 'تفصيلة اختيارية')}</label>
    <select id="lai-refinement-choice" value={question.id} onChange={e => setRefinementId(e.target.value)}>{optional.map(q => <option key={q.id} value={q.id}>{q.message}</option>)}</select>
    <button type="button" onClick={() => {setSkipped(ids => [...ids, question.id]);setRefinementId('');}}>{t('Skip this refinement', 'تخطّى التفصيلة دي')}</button>
  </div> : null;

  return <section className="lai-chat lai-adaptive-chat" aria-label={t('Lookers AI chat', 'شات Lookers AI')} data-testid="adaptive-chat">
    <header className="lai-adaptive-topbar">
      <button type="button" onClick={props.onUniverses}>{t('← Universes', '→ المجالات')}</button>
      <span role="status">{result ? t('Your prompt is ready', 'البرومبت جاهز') : turn.status === 'ready' ? t('Ready to generate', 'جاهز للتوليد') : t(`${turn.remaining} essential questions left`, `باقي ${turn.remaining} أسئلة أساسية`)}</span>
    </header>
    {!historical && !result && question ? <ChatQuestionControl key={`${draft.id}:${question.id}`} question={question} lang={lang} disabled={props.busy || props.generating}
      explanation={() => explainChatQuestion(draft, lang, turn.status === 'ready' ? question.id : undefined)} onSubmit={save}
      threadRef={thread} before={<>{transcript}{optionalChoice}</>} footer={utilities} onAttach={props.onAttach} /> : <>
      <div className="lai-adaptive-body" ref={thread} data-testid="conversation-thread" role="log" aria-label={t('Conversation', 'المحادثة')}>
        {historical ? <article className="lai-adaptive-history" aria-label={t('Confirmed answer', 'إجابة محفوظة')}>
          <h2>{t('Previous confirmed answer', 'إجابتك المحفوظة')}</h2><p className="lai-message lai-message--assistant">{historical.question.message}</p>
          <p className="lai-message lai-message--user">{Array.isArray(historical.answer) ? historical.answer.join('، ') : historical.answer}</p>
          <button type="button" onClick={() => setHistoryIndex(null)}>{t('Return to current step', 'ارجع للخطوة الحالية')}</button>
        </article> : result ? <div className="lai-adaptive-result">
          <label htmlFor="lai-chat-result">{t('Your prompt', 'البرومبت بتاعك')}</label>
          <textarea id="lai-chat-result" className="lookers-ai__prompt-output" value={props.prompt} onChange={e => props.onEditPrompt(e.target.value)} />
          <div className="lai-chat__actions"><button type="button" onClick={props.onCopy}>{t('Copy', 'نسخ')}</button><button type="button" onClick={props.onDownload}>{t('Download', 'تنزيل')}</button><button type="button" onClick={() => {props.onImprove();setRefining(false);}}>{t('Return to conversation', 'ارجع للمحادثة')}</button><button type="button" onClick={() => {props.onImprove();setRefining(true);}}>{t('Improve', 'تحسين')}</button></div>
        </div> : <>{transcript}<div className="lai-message lai-message--assistant lai-adaptive-ready">
          <h2>{t('Ready when you are.', 'جاهزين لما تحب.')}</h2>
          <p>{t('Your essential answers are saved. Generate now, or add optional details.', 'إجاباتك الأساسية محفوظة. تقدر تولّد دلوقتي، أو تضيف تفاصيل اختيارية.')}</p>
          {refinements.questions.length > 0 && <button type="button" onClick={() => {setSkipped([]);setRefining(true);}}>{t('Add optional refinements', 'ضيف تفاصيل اختيارية')}</button>}
        </div></>}
      </div>
      <footer className="lai-adaptive-footer">{utilities}<button type="button" className="lai-attach" onClick={props.onAttach} disabled={props.busy || props.generating}>{t('Attach file', 'ضيف ملف')}</button></footer>
    </>}
  </section>;
}

export default LookersAdaptiveChat;

export function ChatQuestionControl({ question, lang, disabled, explanation, onSubmit, before, footer, onAttach, threadRef }: {
  key?: string; question: ChatQuestion; lang: Lang; disabled: boolean; explanation: () => string | null;
  onSubmit: (answer: string | string[]) => boolean; before?: React.ReactNode; footer?: React.ReactNode;
  onAttach?: () => void; threadRef?: React.RefObject<HTMLDivElement>;
}) {
  const [value, setValue] = useState<string | string[]>('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState(false);
  const { control } = question;
  const choice = control.type === 'single' || control.type === 'multi';
  const filled = Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
  const helpId = `lai-chat-help-${question.id}`;
  return <form className="lai-adaptive-question" data-testid="active-question" data-question-id={question.id}
    onSubmit={event => {event.preventDefault(); if (!disabled && !onSubmit(value)) setError(true);}}>
    <div className="lai-adaptive-body" ref={threadRef} data-testid="conversation-thread" role="log" aria-label={lang === 'ar' ? 'المحادثة' : 'Conversation'}>
      {before}
      <div className="lai-current-message" data-testid="question-content">
        <div className="lai-message lai-message--assistant"><h2 id={`lai-chat-label-${question.id}`}>{question.message}</h2>
          {!choice && control.example && <p className="lai-adaptive-example">{lang === 'ar' ? 'مثال: ' : 'Example: '}{control.example}</p>}
        </div>
        {choice && <fieldset className="lai-adaptive-options" aria-labelledby={`lai-chat-label-${question.id}`} disabled={disabled}>
          {control.options.map(option => <label key={option.value} className={(Array.isArray(value) ? value.includes(option.value) : value === option.value) ? 'is-selected' : ''}>
            <input type={control.type === 'single' ? 'radio' : 'checkbox'} name={question.id} value={option.value}
              checked={Array.isArray(value) ? value.includes(option.value) : value === option.value}
              onChange={() => {setError(false);setValue(current => control.type === 'single' ? option.value : Array.isArray(current) && current.includes(option.value) ? current.filter(v => v !== option.value) : [...(Array.isArray(current) ? current : []), option.value]);}} />
            <span>{option.label}</span></label>)}
        </fieldset>}
        <button type="button" className="lai-explain" aria-expanded={helpOpen} aria-controls={helpId} onClick={() => setHelpOpen(open => !open)}>{question.helpLabel}</button>
        {helpOpen && <p id={helpId} className="lai-adaptive-help" role="note">{explanation()}</p>}
        {error && <p role="alert">{lang === 'ar' ? 'الإجابة مش صالحة. راجعها وجرب تاني.' : 'Please check your answer and try again.'}</p>}
      </div>
    </div>
    <footer className="lai-adaptive-footer">
      {footer}
      <div className="lai-composer">
        {onAttach && <button type="button" className="lai-attach" onClick={onAttach} disabled={disabled} aria-label={lang === 'ar' ? 'ضيف ملف' : 'Attach file'}><Paperclip size={20} aria-hidden="true"/></button>}
        {choice ? <p className="lai-composer-hint">{lang === 'ar' ? control.type === 'multi' ? 'اختار إجاباتك، وبعدين اضغط إرسال' : 'اختار إجابة، وبعدين اضغط إرسال' : control.type === 'multi' ? 'Select your choices, then send' : 'Select a choice, then send'}</p> : <input type="text" aria-labelledby={`lai-chat-label-${question.id}`} value={typeof value === 'string' ? value : ''} placeholder={control.placeholder} maxLength={4000} disabled={disabled} onChange={e => {setError(false);setValue(e.target.value);}} />}
        <button type="submit" className="lai-send" disabled={disabled || !filled} aria-label={question.submitLabel}><Send size={20} aria-hidden="true"/></button>
      </div>
      <p className="lai-composer-caption">{lang === 'ar' ? 'تقدر تولّد أول ما الأساسيات تكتمل ✦' : 'Generate as soon as the essentials are complete ✦'}</p>
    </footer>
  </form>;
}
