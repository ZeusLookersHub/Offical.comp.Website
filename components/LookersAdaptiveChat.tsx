import React, { useEffect, useState } from 'react';
import type { Lang, ProjectDraft } from '../data/lookersAi';
import { nextChatTurn, submitChatAnswer, getChatRefinements, submitChatRefinement,
  skipChatRefinements, explainChatQuestion, type ChatQuestion } from '../services/lookersAiChatWorkflow';
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

  return <section className="lai-chat lai-adaptive-chat" aria-label={t('Lookers AI chat', 'شات Lookers AI')} data-testid="adaptive-chat">
    <header><span>✦ LOOKERS AI</span><button type="button" onClick={props.onUniverses}>{t('← Universes', '→ المجالات')}</button></header>
    <div className="lai-adaptive-progress" role="status">
      {result ? t('Your prompt is ready', 'البرومبت جاهز') : turn.status === 'ready'
        ? t('Required answers complete · Ready to generate', 'الأساسيات اكتملت · جاهز للتوليد')
        : t(`${turn.answered} answered · ${turn.remaining} essential questions left`, `${turn.answered} إجابات محفوظة · باقي ${turn.remaining} أسئلة أساسية`)}
    </div>
    <div className="lai-adaptive-body">
      {historical ? <article className="lai-adaptive-history" aria-label={t('Confirmed answer', 'إجابة محفوظة')}>
        <h2>{t('Previous confirmed answer', 'إجابتك المحفوظة')}</h2>
        <p>{historical.question.message}</p><p className="lai-chat__user">{Array.isArray(historical.answer) ? historical.answer.join('، ') : historical.answer}</p>
        <button type="button" onClick={() => setHistoryIndex(null)}>{t('Return to current step', 'ارجع للخطوة الحالية')}</button>
      </article> : result ? <div className="lai-adaptive-result">
        <label htmlFor="lai-chat-result">{t('Your prompt', 'البرومبت بتاعك')}</label>
        <textarea id="lai-chat-result" className="lookers-ai__prompt-output" value={props.prompt} onChange={e => props.onEditPrompt(e.target.value)} />
        <div className="lai-chat__actions"><button type="button" onClick={props.onCopy}>{t('Copy', 'نسخ')}</button><button type="button" onClick={props.onDownload}>{t('Download', 'تنزيل')}</button><button type="button" onClick={() => { props.onImprove(); setRefining(true); }}>{t('Improve', 'تحسين')}</button></div>
      </div> : question ? <>
        {turn.status === 'ready' && <div className="lai-adaptive-refinements">
          <label htmlFor="lai-refinement-choice">{t('Optional refinement', 'تفصيلة اختيارية')}</label>
          <select id="lai-refinement-choice" value={question.id} onChange={e => setRefinementId(e.target.value)}>
            {optional.map(q => <option key={q.id} value={q.id}>{q.message}</option>)}
          </select>
        </div>}
        <ChatQuestionControl key={`${draft.id}:${question.id}`} question={question} lang={lang} disabled={props.busy || props.generating}
          explanation={() => explainChatQuestion(draft, lang, turn.status === 'ready' ? question.id : undefined)} onSubmit={save} />
        {turn.status === 'ready' && <button type="button" className="lai-chat__review" onClick={() => {setSkipped(ids => [...ids, question.id]); setRefinementId('');}}>{t('Skip this refinement', 'تخطّى التفصيلة دي')}</button>}
      </> : <div className="lai-adaptive-ready">
        <h2>{t('Ready when you are.', 'جاهزين لما تحب.')}</h2>
        <p>{t('Your essential answers are saved. Generate now, or add optional details.', 'إجاباتك الأساسية محفوظة. تقدر تولّد دلوقتي، أو تضيف تفاصيل اختيارية.')}</p>
        <p className="lai-adaptive-idea">{String(draft.answers.idea || '')}</p>
        {refinements.questions.length > 0 && <button type="button" onClick={() => {setSkipped([]);setRefining(true);}}>{t('Add optional refinements', 'ضيف تفاصيل اختيارية')}</button>}
      </div>}
      {props.notice && <p className="lai-adaptive-notice" role="status">{props.notice}</p>}
    </div>
    <footer className="lai-adaptive-footer">
      {!!draft.attachments.length && <ul className="lai-adaptive-files" aria-label={t('Attached files', 'الملفات المرفقة')}>{draft.attachments.map(file => <li key={file.id}>{file.name} · {file.processing ? t('Preparing…', 'بنجهّزه…') : file.include ? t('Included', 'مرفق') : t('Needs attention', 'محتاج مراجعة')}</li>)}</ul>}
      <div className="lai-adaptive-nav">
        <button type="button" onClick={props.onAttach} disabled={props.busy || props.generating}>{t('Attach file', 'ضيف ملف')}</button>
        {history.length > 0 && <button type="button" onClick={() => setHistoryIndex(index => index === null ? history.length - 1 : Math.max(0, index - 1))}>{t('Previous answer', 'الإجابة السابقة')}</button>}
        {turn.status === 'ready' && !result && <>
          {refining && <button type="button" onClick={skipAll}>{t('Skip refinements', 'تخطّى التحسينات')}</button>}
          <button type="button" className="lai-chat__generate" disabled={!canGenerate} onClick={() => {setHistoryIndex(null);props.onGenerate();}}>{props.generating ? t('Generating…', 'بنجهّز البرومبت…') : t('Generate result', 'توليد النتيجة')}</button>
        </>}
      </div>
    </footer>
  </section>;
}

export default LookersAdaptiveChat;

export function ChatQuestionControl({ question, lang, disabled, explanation, onSubmit }: {
  key?: string; question: ChatQuestion; lang: Lang; disabled: boolean; explanation: () => string | null;
  onSubmit: (answer: string | string[]) => boolean;
}) {
  const [value, setValue] = useState<string | string[]>('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState(false);
  const { control } = question;
  const filled = Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
  const helpId = `lai-chat-help-${question.id}`;
  return <form className="lai-adaptive-question" data-testid="active-question" data-question-id={question.id}
    onSubmit={event => {event.preventDefault(); if (!onSubmit(value)) setError(true);}}>
    <div className="lai-adaptive-question-heading"><h2 id={`lai-chat-label-${question.id}`}>{question.message}</h2>
      <button type="button" aria-expanded={helpOpen} aria-controls={helpId} onClick={() => setHelpOpen(open => !open)}>{question.helpLabel}</button></div>
    {helpOpen && <p id={helpId} className="lai-adaptive-help" role="note">{explanation()}</p>}
    {control.type === 'single' || control.type === 'multi' ? <fieldset className="lai-adaptive-options" aria-labelledby={`lai-chat-label-${question.id}`} disabled={disabled}>
      {control.options.map(option => <label key={option.value} className={(Array.isArray(value) ? value.includes(option.value) : value === option.value) ? 'is-selected' : ''}>
        <input type={control.type === 'single' ? 'radio' : 'checkbox'} name={question.id} value={option.value}
          checked={Array.isArray(value) ? value.includes(option.value) : value === option.value}
          onChange={() => {setError(false);setValue(current => control.type === 'single' ? option.value : Array.isArray(current) && current.includes(option.value) ? current.filter(v => v !== option.value) : [...(Array.isArray(current) ? current : []), option.value]);}} />
        <span>{option.label}</span></label>)}
    </fieldset> : <>
      <textarea aria-labelledby={`lai-chat-label-${question.id}`} value={typeof value === 'string' ? value : ''} placeholder={control.placeholder}
        maxLength={4000} rows={3} disabled={disabled} onChange={e => {setError(false);setValue(e.target.value);}} />
      {control.example && <p className="lai-adaptive-example">{lang === 'ar' ? 'مثال: ' : 'Example: '}{control.example}</p>}
    </>}
    {error && <p role="alert">{lang === 'ar' ? 'الإجابة مش صالحة. راجعها وجرب تاني.' : 'Please check your answer and try again.'}</p>}
    <button type="submit" className="lai-chat__generate" disabled={disabled || !filled}>{question.submitLabel}</button>
  </form>;
}
