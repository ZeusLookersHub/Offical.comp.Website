import React, { useId, useRef, useState } from 'react';
import type { Lang, Question } from '../data/lookersAi';
import { questionCopy } from '../data/lookersAiQuestionCopy';

export function QuestionHelp({ id, label, lang, example }: { id:string;label:string;lang:Lang;example?:string }) {
  const uid = useId(), [open, setOpen] = useState(false);
  const copy = questionCopy[id];
  return <span className="lai-question-help"><button type="button" className="lai-help-button" aria-expanded={open} aria-controls={uid} aria-label={(lang === 'ar' ? 'اشرح السؤال: ' : 'Explain: ') + label} onClick={() => setOpen(!open)}>!</button>
    {open && <span id={uid} className="lai-help-copy" role="note">
      <span><b>{lang === 'ar' ? 'تكتب إيه؟ ' : 'What to write: '}</b>{lang === 'ar' ? copy?.[1] || `المقصود بـ «${label}»: اكتب التفاصيل الخاصة بالنقطة دي.` : `For “${label}”, describe this part of your project.`}</span>
      <span><b>{lang === 'ar' ? 'بنسأل ليه؟ ' : 'Why we ask: '}</b>{lang === 'ar' ? copy?.[2] || `عشان نحدد «${label}» من كلامك من غير تخمين.` : `This fixes the requirements for “${label}” without guessing.`}</span>
      {(example || copy?.[3]) && <span><b>{lang === 'ar' ? 'مثال: ' : 'Example: '}</b>{lang === 'ar' ? copy?.[3] || example : example || 'Use specific details from your project; no need to choose a suggested category.'}</span>}
    </span>}
  </span>;
}
const egyptianOptions: Record<string,string> = {'إنشاء صورة جديدة':'صورة جديدة من الصفر','إعادة بناء صورة مرجعية':'نفس صورة المرجع بتفاصيل أوضح','تحويل الأسلوب البصري':'غيّر ستايل الصورة','دمج مراجع متعددة':'ادمج كذا صورة مع بعض','تحليل الصورة فقط':'حلّل الصورة بس','قصة · 9:16':'ستوري · 9:16','عملاء محتملون':'ناس مهتمة تسأل عن المنتج','الوعي بالعلامة':'ناس أكتر تعرف البراند','البريد الإلكتروني':'إيميل','سأتولى النشر بنفسي':'أنا اللي هنشر بنفسي','جهّزها لاعتمادها قبل النشر':'جهّزها عشان أراجعها قبل النشر','اقترح صيغة مناسبة':'اقترح عليّا صيغة مناسبة','أضف ملاحظات':'ضيف ملاحظات للي هيقدّم'};
const LookersQuestionField: React.FC<{field:Question;lang:Lang;value:unknown;onChange:(id:string,value:string)=>void;onSuggestion?:(id:string,value:string,label:string)=>void}> = ({field,lang,value,onChange,onSuggestion}) => {
  const uid = useId(), input = useRef<HTMLTextAreaElement>(null), [suggestion, setSuggestion] = useState('');
  const label = lang === 'ar' ? questionCopy[field.id]?.[0] || field.label.ar : field.label.en;
  // Legacy option IDs remain readable; new answers always come from the user's writing.
  const text = Array.isArray(value) ? value.map(v => field.options?.find(o => o.value === v)?.[lang] || v).join(lang === 'ar' ? '، ' : ', ') : String(value ?? '');
  return <div className="lai-field lai-written-field" role="group" aria-labelledby={uid}>
    <div className="lai-field-heading"><label id={uid} htmlFor={`lai-${field.id}`}>{label}{field.optional && <small className="lai-optional">{lang === 'ar' ? 'اختياري' : 'Optional'}</small>}</label><QuestionHelp id={field.id} label={label} lang={lang} example={field.example?.[lang]} /></div>
    <textarea ref={input} id={`lai-${field.id}`} rows={3} required={!field.optional} value={text} placeholder={lang === 'ar' ? 'اكتب إجابتك بطريقتك…' : 'Write your answer in your own words…'} onChange={event => onChange(field.id,event.target.value)} />
    {Boolean(field.options?.length) && <div className="lai-question-suggestions"><small>{lang === 'ar' ? 'أفكار تساعدك — اختياري' : 'Optional ideas to help you write'}</small><div>{field.options!.map(option => <button type="button" key={option.value} className="lai-suggestion" onClick={() => {const label=lang === 'ar' ? egyptianOptions[option.ar] || option.ar : option.en;setSuggestion(label);if(onSuggestion) onSuggestion(field.id,option.value,label);else onChange(field.id,text.includes(label)?text:[text,label].filter(Boolean).join(lang === 'ar' ? '، ' : ', '));input.current?.focus();}}>{lang === 'ar' ? egyptianOptions[option.ar] || option.ar : option.en}</button>)}</div>{suggestion && <p role="status">{lang === 'ar' ? `ضفنا «${suggestion}» لإجابتك. تقدر تعدّلها أو تزود تفاصيلك.` : `Added “${suggestion}” to your answer. Edit it or add your details.`}</p>}</div>}
  </div>;
}

export default LookersQuestionField;
