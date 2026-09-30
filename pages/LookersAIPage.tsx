import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2,
  ChevronRight, Clipboard, Download, FileJson2, FileText, ImagePlus, Lightbulb,
  LoaderCircle, MessageSquareText, Paperclip, RotateCcw, Sparkles, Target, Upload,
  X
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import BrandMark from '../components/BrandMark';
import {
  compileLookersPrompt, createProjectMemory, detectTaskType, emptyMemory,
  questions, taskTypes, type AttachmentMemory, type Lang, type LookersMemory,
  type ProjectMemory, type TaskType
} from '../data/lookersAi';
import './LookersAIPage.css';

const STORAGE_KEY = 'lookers-ai-memory-v1';
const stages = ['home', 'files', 'details', 'review', 'result'] as const;
type Stage = typeof stages[number];
type Tab = 'prompt' | 'summary';

const copy = (lang: Lang, en: string, ar: string) => lang === 'ar' ? ar : en;
const loadMemory = (): LookersMemory => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (value?.version === 1 && value.current?.id && Array.isArray(value.archived)) return value as LookersMemory;
  } catch { /* A damaged draft starts a clean project. */ }
  return emptyMemory();
};
const toDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
  reader.readAsDataURL(file);
});
const storeImageReference = async (file: File): Promise<string> => {
  try {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    return canvas.toDataURL('image/jpeg', 0.68);
  } catch {
    if (file.size <= 250_000) return toDataUrl(file);
    throw new Error('Image is too large to keep in browser memory.');
  }
};
const safeFileName = (value: string) => value.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'lookers-ai';
const prettySize = (size: number, lang: Lang) => size < 1024 * 1024
  ? `${Math.max(1, Math.round(size / 1024))} ${copy(lang, 'KB', 'ك.ب')}`
  : `${(size / (1024 * 1024)).toFixed(1)} ${copy(lang, 'MB', 'م.ب')}`;

const LookersAIPage: React.FC = () => {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [memory, setMemory] = useState<LookersMemory>(loadMemory);
  const memoryRef = useRef(memory);
  const [tab, setTab] = useState<Tab>('prompt');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const current = memory.current;
  const answers = current.answers;
  const stage = current.step;
  const prompt = useMemo(() => compileLookersPrompt(current, lang), [current, lang]);
  const imageCount = current.attachments.filter((file) => file.include && file.kind === 'image').length;
  const completeness = useMemo(() => {
    const questionsForTask = questions[current.taskType];
    const missing = questionsForTask.filter((question) => !question.optional && !String(answers[question.id] || '').trim());
    if (!String(answers.idea || '').trim()) missing.unshift({ id: 'idea', label: { en: 'Project idea', ar: 'فكرة المشروع' }, kind: 'textarea' as const });
    return { missing, percent: Math.round(((questionsForTask.length - missing.length + 1) / (questionsForTask.length + 1)) * 100) };
  }, [answers, current.taskType]);

  const commit = (next: LookersMemory) => {
    memoryRef.current = next;
    setMemory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
    }
  };
  const patchCurrent = (patch: Partial<ProjectMemory>, action?: string) => {
    const now = new Date().toISOString();
    const latest = memoryRef.current;
    const project = { ...latest.current, ...patch, updatedAt: now };
    if (action) project.activity = [...project.activity, { at: now, action }].slice(-250);
    commit({ ...latest, current: project });
  };
  const setStage = (next: Stage) => {
    patchCurrent({ step: next }, `opened_${next}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const setAnswer = (id: string, value: string | string[]) => {
    const nextAnswers = { ...answers, [id]: value };
    const title = id === 'idea' ? (String(value).trim().slice(0, 64) || '') : current.title;
    patchCurrent({ answers: nextAnswers, title });
  };
  const setTask = (taskType: TaskType) => {
    patchCurrent({ taskType }, `task_type_${taskType}`);
  };

  const addFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    setBusy(true);
    const additions: AttachmentMemory[] = files.map((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const image = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension);
      const textLike = ['txt', 'md', 'csv', 'tsv', 'json'].includes(extension) || file.type.startsWith('text/');
      return {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name: file.name, mime: file.type || extension || 'application/octet-stream', size: file.size,
        kind: image ? 'image' : textLike ? 'text' : 'file', include: true,
        note: copy(lang, 'Preparing file…', 'جارٍ تجهيز الملف…'), processing: true
      };
    });
    patchCurrent({ attachments: [...memoryRef.current.current.attachments, ...additions] }, 'attachments_added');
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const attachment = additions[index];
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const image = attachment.kind === 'image';
      const textLike = attachment.kind === 'text';
      let text: string | undefined;
      let dataUrl: string | undefined;
      let note = '';
      if (image) {
        try { dataUrl = await storeImageReference(file); }
        catch { note = copy(lang, 'Image reference saved by name; preview could not be kept in browser memory.', 'حُفظ اسم الصورة كمرجع، لكن تعذر حفظ معاينتها في ذاكرة المتصفح.'); }
      } else if (textLike) {
        try {
          const source = await file.text();
          if (['csv', 'tsv'].includes(extension)) {
            const lines = source.split(/\r?\n/).filter(Boolean);
            text = [copy(lang, 'Columns: ', 'الأعمدة: ') + (lines[0] || ''), copy(lang, 'Rows: ', 'الصفوف: ') + Math.max(0, lines.length - 1), ...lines.slice(1, 5)].join('\n').slice(0, 5000);
          } else text = source.slice(0, 5000);
          note = copy(lang, `${source.length} characters read`, `تمت قراءة ${source.length} حرفًا`);
        } catch { note = copy(lang, 'Could not read text content.', 'تعذرت قراءة محتوى النص.'); }
      } else {
        note = copy(lang, 'Saved as a file reference; its contents are not read in this browser.', 'حُفظ كمرجع للملف؛ لا يقرأ المتصفح محتواه تلقائيًا.');
      }
      const latestAttachments = memoryRef.current.current.attachments.map((item) => item.id === attachment.id
        ? { ...item, note, text, dataUrl, processing: false }
        : item);
      patchCurrent({ attachments: latestAttachments });
    }
    setBusy(false);
  };

  const toggleFile = (id: string) => patchCurrent({
    attachments: current.attachments.map((file) => file.id === id ? { ...file, include: !file.include } : file)
  }, 'attachment_selection_changed');
  const updateFileNote = (id: string, note: string) => patchCurrent({
    attachments: current.attachments.map((file) => file.id === id ? { ...file, note } : file)
  });
  const removeFile = (id: string) => patchCurrent({
    attachments: current.attachments.filter((file) => file.id !== id)
  }, 'attachment_removed');

  const exportJson = (name: string, value: unknown) => {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };
  const downloadPrompt = () => {
    const filename = safeFileName(current.title || 'LookersHub-Prompt');
    const blob = new Blob([prompt], { type: 'text/markdown;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${filename}.md`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };
  const importMemory = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as LookersMemory | { version: number; project?: ProjectMemory };
      const imported: LookersMemory = 'project' in parsed && parsed.project
        ? { version: 1, current: parsed.project, archived: memory.archived }
        : parsed as LookersMemory;
      if (imported?.version !== 1 || !imported.current?.id || !Array.isArray(imported.archived) || !imported.current.answers || !Array.isArray(imported.current.attachments)) throw new Error('Invalid memory file');
      commit(imported);
      setTab('prompt');

    } catch {
      window.alert(copy(lang, 'This memory file could not be opened.', 'تعذر فتح ملف الذاكرة هذا.'));
    }
    if (importRef.current) importRef.current.value = '';
  };
  const startOver = () => {
    if (!window.confirm(copy(lang, 'Start a new project? This project will be saved in your local memory archive.', 'هل تريد بدء مشروع جديد؟ سيُحفظ هذا المشروع في أرشيف الذاكرة المحلي.'))) return;
    const archived = String(answers.idea || '').trim() || current.attachments.length || current.activity.length > 1
      ? [{ ...current, title: current.title || copy(lang, 'Untitled project', 'مشروع بلا عنوان') }, ...memory.archived].slice(0, 50)
      : memory.archived;
    const next = createProjectMemory();
    commit({ version: 1, current: next, archived });
    setTab('prompt');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const field = document.querySelector<HTMLTextAreaElement>('.lookers-ai__prompt-output');
      field?.focus();
      field?.select();
      document.execCommand('copy');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };
  const stepIndex = stages.indexOf(stage);
  const stageTitles: Record<Stage, { en: string; ar: string }> = {
    home: { en: 'Brief', ar: 'الفكرة' },
    files: { en: 'References', ar: 'المراجع' },
    details: { en: 'Details', ar: 'التفاصيل' },
    review: { en: 'Review', ar: 'المراجعة' },
    result: { en: 'Prompt', ar: 'الـPrompt' }
  };
  const exampleIdeas = ar
    ? ['إعلان فاخر لفندق عائلي في دبي', 'حملة إعلانية لإطلاق تطبيق جديد', 'لوحة بيانات لمتابعة المبيعات', 'أريد تصميم صورة لمنتج جديد']
    : ['Create a premium family hotel ad in Dubai', 'Plan a launch campaign for a new app', 'Build a sales performance dashboard', 'Design a visual for a new product'];

  const openFilePicker = () => uploadRef.current?.click();
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    void addFiles(event.dataTransfer.files);
  };

  const renderField = (field: (typeof questions)[TaskType][number]) => {
    const value = answers[field.id];
    const placeholder = field.placeholder?.[lang] || '';
    return (
      <div className="lai-field" key={field.id}>
        <label htmlFor={`lai-${field.id}`}>{field.label[lang]}{field.optional && <span className="lai-optional">{copy(lang, 'Optional', 'اختياري')}</span>}</label>
        {field.example && <p className="lai-field-example">{field.example[lang]}</p>}
        {field.kind === 'single' && (
          <div className="lai-option-grid">
            {(field.options || []).map((option) => (
              <button key={option.value} type="button" className={`lai-option ${value === option.value ? 'is-selected' : ''}`}
                aria-pressed={value === option.value} onClick={() => setAnswer(field.id, option.value)}>
                {option[lang]}
              </button>
            ))}
          </div>
        )}
        {field.kind === 'multi' && (
          <div className="lai-option-grid lai-option-grid--multi">
            {(field.options || []).map((option) => {
              const selected = Array.isArray(value) && value.includes(option.value);
              return <button key={option.value} type="button" className={`lai-option ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected} onClick={() => setAnswer(field.id, selected ? (value as string[]).filter((item) => item !== option.value) : [...(Array.isArray(value) ? value : []), option.value])}>
                {selected && <Check size={14} />} {option[lang]}
              </button>;
            })}
          </div>
        )}
        {field.kind === 'text' && <input id={`lai-${field.id}`} type="text" value={typeof value === 'string' ? value : ''}
          placeholder={placeholder} onChange={(event) => setAnswer(field.id, event.target.value)} />}
        {field.kind === 'textarea' && <textarea id={`lai-${field.id}`} rows={3} value={typeof value === 'string' ? value : ''}
          placeholder={placeholder} onChange={(event) => setAnswer(field.id, event.target.value)} />}
      </div>
    );
  };

  return (
    <div className="lookers-ai" dir={ar ? 'rtl' : 'ltr'} lang={lang}>
      <div className="lookers-ai__wrap">
        <div className="lookers-ai__bar">
          <div className="lookers-ai__brand">
            <BrandMark />
            <span>LookersHub</span>
            <b>AI</b>
          </div>
          <span className="lai-autosave-status"><CheckCircle2 size={14} />{copy(lang, 'Saved on this device', 'محفوظ على هذا الجهاز')}</span>
        </div>

        <header className="lookers-ai__hero">
          <span className="lai-kicker"><Sparkles size={15} />{copy(lang, 'LOOKERS AI / PROMPT STUDIO', 'Lookers AI / استوديو الـPrompt')}</span>
          <h1>{copy(lang, 'From a simple idea to a ready', 'من فكرة بسيطة إلى')} <em>Prompt</em></h1>
          <p>{copy(lang, 'Shape your brief, keep the important context, and leave with a prompt ready to use.', 'رتّب فكرتك، واحفظ تفاصيلها المهمة، واخرج بـPrompt جاهز للاستخدام.')}</p>
        </header>

        <nav className="lai-steps" aria-label={copy(lang, 'Project steps', 'خطوات المشروع')}>
          {stages.map((item, index) => <div key={item} className={index === stepIndex ? 'is-active' : index < stepIndex ? 'is-done' : ''}>
            <span>{index < stepIndex ? <Check size={13} /> : index + 1}</span><small>{stageTitles[item][lang]}</small>
          </div>)}
        </nav>


        <section className="lai-attachments" aria-label={copy(lang, 'Project files', 'ملفات المشروع')}
          onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
          <div className="lai-attachments-heading">
            <div><b>{copy(lang, 'Project files & references', 'ملفات ومراجع المشروع')}</b>
              <small>{copy(lang, 'Add files once; they stay visible throughout every step.', 'أضف الملفات مرة واحدة لتبقى ظاهرة في جميع الخطوات.')}</small></div>
            <button type="button" className="lai-secondary-button" onClick={openFilePicker} disabled={busy}><Paperclip size={16} />{copy(lang, 'Add files', 'أضف ملفات')}</button>
          </div>
          <div className="lai-attachments-content">
            {current.attachments.length === 0
              ? <button type="button" className="lai-empty-upload" onClick={openFilePicker}>
                  <Upload size={20} /><span>{copy(lang, 'Choose files or drop them here', 'اختر ملفات أو اسحبها إلى هنا')}</span>
                  <small>{copy(lang, 'Images, text, CSV, and project references', 'صور ونصوص وCSV ومراجع المشروع')}</small>
                </button>
              : <div className="lai-file-list">{current.attachments.map((file) => <article className={`lai-file ${file.include ? '' : 'is-muted'}`} key={file.id}>
                  {file.dataUrl ? <img src={file.dataUrl} alt="" /> : <span className="lai-file-icon">{file.kind === 'text' ? <FileText size={18} /> : <Paperclip size={18} />}</span>}
                  <div className="lai-file-main"><b>{file.name}</b><small>{file.processing ? file.note : `${prettySize(file.size, lang)} · ${file.note || file.mime}`}</small>
                    {!file.processing && <input type="text" value={file.note} aria-label={copy(lang, 'Reference note', 'ملاحظة على المرجع')}
                      placeholder={copy(lang, 'Add a note about this file', 'أضف ملاحظة عن هذا الملف')}
                      onChange={(event) => updateFileNote(file.id, event.target.value)} />}
                  </div>
                  <span className={`lai-upload-state ${file.processing ? 'is-processing' : ''}`} aria-label={file.processing ? copy(lang, 'Processing', 'قيد التجهيز') : copy(lang, 'Uploaded', 'تم الرفع')}>
                    {file.processing ? <LoaderCircle className="lai-spinner" size={15} /> : <CheckCircle2 size={15} />}
                    {file.processing ? copy(lang, 'Preparing', 'جارٍ التجهيز') : copy(lang, 'Added', 'تمت الإضافة')}
                  </span>
                  <label className="lai-file-include"><input type="checkbox" checked={file.include} onChange={() => toggleFile(file.id)} />{copy(lang, 'Include', 'أرفق')}</label>
                  <button type="button" className="lai-icon-button is-danger" title={copy(lang, 'Remove file', 'حذف الملف')} aria-label={copy(lang, 'Remove file', 'حذف الملف')}
                    onClick={() => removeFile(file.id)}><X size={17} /></button>
                </article>)}</div>}
          </div>
        </section>
        <div className="lookers-ai__main">
          {stage === 'home' && (
            <section className="lai-card lai-brief-card">
              <div className="lai-card-heading">
                <div className="lai-heading-icon"><Lightbulb size={19} /></div>
                <div><h2>{copy(lang, 'What would you like to make?', 'إيه اللي حابب تنفّذه؟')}</h2>
                  <p>{copy(lang, 'Start with a sentence. Lookers AI will organize the brief with you.', 'ابدأ بجملة واحدة، وLookers AI هيرتّب معك تفاصيل الفكرة.')}</p></div>
              </div>
              <label className="lai-sr-only" htmlFor="lai-idea">{copy(lang, 'Project idea', 'فكرة المشروع')}</label>
              <textarea id="lai-idea" className="lai-idea-input" rows={4} value={String(answers.idea || '')}
                placeholder={copy(lang, 'Describe your idea, goal, or the thing you want to improve…', 'اكتب فكرتك أو هدفك أو الشيء الذي تريد تطويره…')}
                onChange={(event) => setAnswer('idea', event.target.value)} />
              <div className="lai-examples-label">{copy(lang, 'QUICK STARTS', 'أفكار سريعة')}</div>
              <div className="lai-examples">
                {exampleIdeas.map((example) => <button type="button" key={example} onClick={() => setAnswer('idea', example)}>{example}</button>)}
              </div>
              <div className="lai-brief-footer">
                <button type="button" className="lai-primary-button" disabled={!String(answers.idea || '').trim()}
                  onClick={() => { const inferred = detectTaskType(String(answers.idea || '')); patchCurrent({ taskType: inferred, step: 'files' }, 'brief_started'); }}>
                  {copy(lang, 'Start building', 'ابدأ التجهيز')}<ArrowUpRight size={17} />
                </button>
              </div>
            </section>
          )}

          {stage === 'files' && (
            <section className="lai-card">
              <div className="lai-card-heading">
                <div className="lai-heading-icon"><ImagePlus size={19} /></div>
                <div><h2>{copy(lang, 'Add useful references', 'أضف مراجع تساعد على فهم الفكرة')}</h2>
                  <p>{copy(lang, 'Images and readable text are saved in local memory. Other files are kept as named references.', 'تُحفظ الصور والنصوص المقروءة في الذاكرة المحلية. وتُحفظ بقية الملفات كمرجع بالاسم.')}</p></div>
              </div>
              <p className="lai-shared-files-note">{copy(lang, "Your references are available in the shared files panel above.", "مراجعك متاحة في لوحة الملفات الثابتة أعلى الخطوات.")}</p>
              <div className="lai-nav-buttons">
                <button type="button" className="lai-secondary-button" onClick={() => setStage('home')}><ArrowLeft size={16} />{copy(lang, 'Back', 'السابق')}</button>
                <button type="button" className="lai-primary-button" onClick={() => setStage('details')}>{copy(lang, 'Continue', 'تابع')}<ArrowRight size={16} /></button>
              </div>
            </section>
          )}

          {stage === 'details' && (
            <section className="lai-card">
              <div className="lai-card-heading">
                <div className="lai-heading-icon"><Target size={19} /></div>
                <div><h2>{copy(lang, 'A few details for a stronger result', 'تفاصيل بسيطة لنتيجة أدق')}</h2>
                  <p>{copy(lang, 'The task type is suggested from your idea. You can change it at any time.', 'اقترحنا نوع المهمة بناءً على فكرتك، ويمكنك تغييره في أي وقت.')}</p></div>
              </div>
              <div className="lai-task-grid">
                {taskTypes.map((task) => <button type="button" key={task.id} className={`lai-task-card ${current.taskType === task.id ? 'is-selected' : ''}`}
                  aria-pressed={current.taskType === task.id} onClick={() => setTask(task.id)}>
                  <span>{task.id === 'image' ? <ImagePlus size={20} /> : task.id === 'campaign' ? <Sparkles size={20} /> : task.id === 'dashboard' ? <BarChart3 size={20} /> : <MessageSquareText size={20} />}</span>
                  <b>{task.title[lang]}</b><small>{task.description[lang]}</small>
                </button>)}
              </div>
              <div className="lai-universal-fields">
                <div className="lai-field"><label htmlFor="lai-purpose">{copy(lang, 'Desired result', 'النتيجة التي تريدها')}</label>
                  <textarea id="lai-purpose" rows={3} value={String(answers.purpose || '')} onChange={(event) => setAnswer('purpose', event.target.value)}
                    placeholder={copy(lang, 'What should be different when this is done?', 'ما الذي تريد أن يتحقق بعد إنجاز المهمة؟')} /></div>
                <div className="lai-field"><label htmlFor="lai-context">{copy(lang, 'Helpful context', 'سياق يساعد على الفهم')}<span className="lai-optional">{copy(lang, 'Optional', 'اختياري')}</span></label>
                  <textarea id="lai-context" rows={3} value={String(answers.context || '')} onChange={(event) => setAnswer('context', event.target.value)}
                    placeholder={copy(lang, 'Background, audience, or relevant details.', 'خلفية أو جمهور أو تفاصيل ذات صلة.')} /></div>
                <div className="lai-field"><label htmlFor="lai-constraints">{copy(lang, 'Constraints or things to avoid', 'قيود أو أمور يجب تجنبها')}<span className="lai-optional">{copy(lang, 'Optional', 'اختياري')}</span></label>
                  <textarea id="lai-constraints" rows={3} value={String(answers.constraints || '')} onChange={(event) => setAnswer('constraints', event.target.value)}
                    placeholder={copy(lang, 'For example: do not invent client names or performance numbers.', 'مثال: لا تخترع أسماء عملاء أو أرقام أداء.')} /></div>
                <div className="lai-field"><label htmlFor="lai-deliverable">{copy(lang, 'What should the final answer include?', 'ماذا تريد أن يتضمن التسليم؟')}<span className="lai-optional">{copy(lang, 'Optional', 'اختياري')}</span></label>
                  <textarea id="lai-deliverable" rows={3} value={String(answers.deliverable || '')} onChange={(event) => setAnswer('deliverable', event.target.value)}
                    placeholder={copy(lang, 'Format, sections, or handoff details.', 'الصيغة أو الأقسام أو تفاصيل التسليم.')} /></div>
              </div>
              <details className="lai-advanced">
                <summary>{copy(lang, 'Advanced planning and handoff', 'تفاصيل التنفيذ والتسليم المتقدمة')}</summary>
                <div className="lai-advanced-grid">
                  <div className="lai-field"><label htmlFor="lai-success">{copy(lang, 'Success criteria', 'معايير النجاح')}<span className="lai-optional">{copy(lang, 'Optional', 'اختياري')}</span></label>
                    <textarea id="lai-success" rows={2} value={String(answers.successCriteria || '')} onChange={(event) => setAnswer('successCriteria', event.target.value)} /></div>
                  <div className="lai-field"><label htmlFor="lai-location">{copy(lang, 'Where should the work happen?', 'أين سيتم تنفيذ العمل؟')}<span className="lai-optional">{copy(lang, 'Optional', 'اختياري')}</span></label>
                    <input id="lai-location" value={String(answers.location || '')} onChange={(event) => setAnswer('location', event.target.value)} placeholder={copy(lang, 'For example: in this repo, browser, or a design tool.', 'مثال: داخل هذا الريبو أو المتصفح أو أداة تصميم.')} /></div>
                  <div className="lai-field"><label htmlFor="lai-tools">{copy(lang, 'Available tools', 'الأدوات المتاحة')}<span className="lai-optional">{copy(lang, 'Optional', 'اختياري')}</span></label>
                    <input id="lai-tools" value={String(answers.tools || '')} onChange={(event) => setAnswer('tools', event.target.value)} /></div>
                  <div className="lai-field"><label htmlFor="lai-permissions">{copy(lang, 'Permissions or approvals', 'الصلاحيات أو الموافقات')}<span className="lai-optional">{copy(lang, 'Optional', 'اختياري')}</span></label>
                    <input id="lai-permissions" value={String(answers.permissions || '')} onChange={(event) => setAnswer('permissions', event.target.value)} /></div>
                  <div className="lai-field"><label htmlFor="lai-size">{copy(lang, 'Expected project size', 'حجم المشروع المتوقع')}</label>
                    <select id="lai-size" value={String(answers.size || 'auto')} onChange={(event) => setAnswer('size', event.target.value)}>
                      <option value="auto">{copy(lang, 'Let Lookers AI decide', 'دع Lookers AI يحدده')}</option>
                      <option value="small">{copy(lang, 'Small', 'صغير')}</option>
                      <option value="medium">{copy(lang, 'Medium', 'متوسط')}</option>
                      <option value="large">{copy(lang, 'Large', 'كبير')}</option>
                    </select></div>
                  <div className="lai-field"><label htmlFor="lai-stop">{copy(lang, 'When should work stop for your input?', 'متى يجب التوقف لطلب رأيك؟')}<span className="lai-optional">{copy(lang, 'Optional', 'اختياري')}</span></label>
                    <textarea id="lai-stop" rows={2} value={String(answers.stopConditions || '')} onChange={(event) => setAnswer('stopConditions', event.target.value)} /></div>
                </div>
              </details>
              <div className="lai-task-questions">
                <h3>{copy(lang, 'Task-specific details', 'تفاصيل خاصة بنوع المهمة')}</h3>
                {questions[current.taskType].map(renderField)}
              </div>
              <div className="lai-nav-buttons">
                <button type="button" className="lai-secondary-button" onClick={() => setStage('files')}><ArrowLeft size={16} />{copy(lang, 'Back', 'السابق')}</button>
                <button type="button" className="lai-primary-button" onClick={() => setStage('review')}>{copy(lang, 'Review brief', 'راجع تفاصيلك')}<ArrowRight size={16} /></button>
              </div>
            </section>
          )}

          {stage === 'review' && (
            <section className="lai-card">
              <div className="lai-card-heading">
                <div className="lai-heading-icon"><CheckCircle2 size={19} /></div>
                <div><h2>{copy(lang, 'Review your project', 'راجع ملخص المشروع')}</h2>
                  <p>{copy(lang, 'You can go back and change anything before creating the prompt.', 'يمكنك الرجوع وتعديل أي شيء قبل إنشاء الـPrompt.')}</p></div>
              </div>
              <div className="lai-completeness">
                <div><span>{copy(lang, 'Brief completeness', 'اكتمال التفاصيل')}</span><b>{completeness.percent}%</b></div>
                <span className="lai-progress"><i style={{ width: `${completeness.percent}%` }} /></span>
              </div>
              {completeness.missing.length > 0 && <div className="lai-notice">
                <b>{copy(lang, 'A few details are still blank', 'ما زالت بعض التفاصيل غير مكتملة')}</b>
                <span>{completeness.missing.map((item) => item.label[lang]).join(ar ? '، ' : ', ')}</span>
                <small>{copy(lang, 'You can still continue; the prompt will clearly mark unknown information.', 'يمكنك المتابعة، وسيبقي الـPrompt المعلومات الناقصة واضحة دون اختراعها.')}</small>
              </div>}
              <div className="lai-review-list">
                <div><b>{copy(lang, 'Idea', 'الفكرة')}</b><span>{String(answers.idea || '') || copy(lang, 'Not specified', 'غير محددة')}</span><button onClick={() => setStage('home')}>{copy(lang, 'Edit', 'تعديل')}</button></div>
                <div><b>{copy(lang, 'Task type', 'نوع المهمة')}</b><span>{taskTypes.find((item) => item.id === current.taskType)?.title[lang]}</span><button onClick={() => setStage('details')}>{copy(lang, 'Edit', 'تعديل')}</button></div>
                <div><b>{copy(lang, 'References', 'المراجع')}</b><span>{current.attachments.filter((file) => file.include).length} {copy(lang, 'included', 'مرفق')}</span><button onClick={() => setStage('files')}>{copy(lang, 'Edit', 'تعديل')}</button></div>
                {[...questions[current.taskType]].map((field) => {
                  const value = answers[field.id];
                  const text = Array.isArray(value) ? value.map((item) => field.options?.find((option) => option.value === item)?.[lang] || item).join(ar ? '، ' : ', ') : String(value || '');
                  return text ? <div key={field.id}><b>{field.label[lang]}</b><span>{text}</span><button onClick={() => setStage('details')}>{copy(lang, 'Edit', 'تعديل')}</button></div> : null;
                })}
              </div>
              <div className="lai-nav-buttons">
                <button type="button" className="lai-secondary-button" onClick={() => setStage('details')}><ArrowLeft size={16} />{copy(lang, 'Back', 'السابق')}</button>
                <button type="button" className="lai-primary-button" onClick={() => { patchCurrent({ step: 'result', generatedPrompt: prompt }, 'prompt_generated'); setTab('prompt'); }}>
                  <Sparkles size={16} />{copy(lang, 'Create my prompt', 'أنشئ الـPrompt')}
                </button>
              </div>
            </section>
          )}

          {stage === 'result' && (
            <section className="lai-card lai-result-card">
              <div className="lai-result-heading">
                <div className="lai-result-mark"><Sparkles size={21} /></div>
                <div><h2>{copy(lang, 'Your prompt is ready', 'الـPrompt جاهز')}</h2>
                  <p>{copy(lang, 'It is saved with this project in your browser memory.', 'تم حفظه مع المشروع في ذاكرة المتصفح.')}</p></div>
              </div>
              <div className="lai-tabs" role="tablist" aria-label={copy(lang, 'Result views', 'طرق عرض النتيجة')}>
                {(['prompt', 'summary'] as Tab[]).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>
                  {item === 'prompt' ? 'Prompt' : copy(lang, 'Project summary', 'ملخص المشروع')}
                </button>)}
                {tab === 'prompt' && <button type="button" className="lai-copy-button" onClick={() => void copyPrompt()}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? copy(lang, 'Copied', 'تم النسخ') : copy(lang, 'Copy', 'انسخ')}</button>}
              </div>
              {tab === 'prompt' && <textarea className="lookers-ai__prompt-output" dir={ar ? 'rtl' : 'ltr'} readOnly value={prompt} />}
              {tab === 'summary' && <div className="lai-summary">
                <div><b>{copy(lang, 'Project idea', 'فكرة المشروع')}</b><p>{String(answers.idea || '') || copy(lang, 'Not specified', 'غير محددة')}</p></div>
                <div><b>{copy(lang, 'Task type', 'نوع المهمة')}</b><p>{taskTypes.find((item) => item.id === current.taskType)?.title[lang]}</p></div>
                <div><b>{copy(lang, 'Desired result', 'النتيجة المطلوبة')}</b><p>{String(answers.purpose || '') || copy(lang, 'Not specified', 'غير محددة')}</p></div>
                <div><b>{copy(lang, 'Project files', 'ملفات المشروع')}</b><p>{current.attachments.filter((file) => file.include).map((file) => file.name).join(ar ? '، ' : ', ') || copy(lang, 'No references attached', 'لا توجد مراجع مرفقة')}</p></div>
                <div><b>{copy(lang, 'Last saved', 'آخر حفظ')}</b><p>{new Date(current.updatedAt).toLocaleString(ar ? 'ar-EG' : 'en-US')}</p></div>
              </div>}
              <div className="lai-result-actions">
                <button type="button" className="lai-primary-button" onClick={downloadPrompt}><Download size={16} />{copy(lang, 'Download prompt', 'نزّل الـPrompt')}</button>
                <button type="button" className="lai-secondary-button" onClick={() => exportJson(`${safeFileName(current.title || 'LookersAI-project')}.json`, { version: 1, project: current })}>
                  <FileJson2 size={16} />{copy(lang, 'Export project', 'صدّر المشروع')}
                </button>
                <button type="button" className="lai-secondary-button" onClick={() => importRef.current?.click()}><Upload size={16} />{copy(lang, 'Import project', 'استورد مشروعًا')}</button>
                <button type="button" className="lai-secondary-button" onClick={() => setStage('review')}>{copy(lang, 'Edit project', 'عدّل المشروع')}</button>
              </div>
              <div className="lai-start-over">
                <div><h3>{copy(lang, 'Start over', 'ابدأ من جديد')}</h3><p>{copy(lang, 'Save this project to your local archive and begin a clean brief.', 'احفظ هذا المشروع في الأرشيف المحلي وابدأ فكرة جديدة.')}</p></div>
                <button type="button" className="lai-reset-button" onClick={startOver}><RotateCcw size={16} />{copy(lang, 'Start over', 'ابدأ من جديد')}</button>
              </div>
            </section>
          )}
        </div>

        <footer className="lookers-ai__footer"><span>{copy(lang, 'Your draft is saved privately on this device.', 'تُحفظ مسودتك بشكل خاص على هذا الجهاز.')}</span></footer>
      </div>
      <input ref={uploadRef} hidden type="file" multiple accept="image/*,.txt,.md,.csv,.tsv,.json,.pdf,.doc,.docx,.xls,.xlsx" onChange={(event) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ''; }} />
      <input ref={importRef} hidden type="file" accept=".json,application/json" onChange={(event) => void importMemory(event.target.files?.[0])} />
    </div>
  );
};

export default LookersAIPage;
