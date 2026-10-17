import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2,
  Clipboard, Download, FileJson2, FileText, ImagePlus, Lightbulb,
  Film, BriefcaseBusiness, WandSparkles, FileSpreadsheet, LoaderCircle, MessageSquareText, Paperclip, RotateCcw, Sparkles, Target, Upload,
  X, Presentation, FolderClock
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import LookersAIHeader from '../components/LookersAIHeader';
import LookersPromptLibrary from '../components/LookersPromptLibrary';
import LookersAIToolDirectory from '../components/LookersAIToolDirectory';
import { isLegacyDraft, lookersAiProjectState } from '../services/lookersAiProjectState';
import { planDraftQuestions } from '../services/lookersAiQuestions';
import { createApplicationGenerator } from '../services/lookersAiApplicationGeneration';
import { lookersAiTransport } from '../services/lookersAiTransport';
import {
  compileLookersPrompt, createProjectDraft, detectTaskType,
  questions, taskTypes, type ProjectAttachment, type Lang, type UserProjectState,
  type ProjectDraft, type TaskType
} from '../data/lookersAi';
import './LookersAIPage.css';
import ConstellationName from '../components/ConstellationName';
import LookersVisionChoices from '../components/LookersVisionChoices';
import LookersQuestionField, { QuestionHelp } from '../components/LookersQuestionField';
import { extractAttachment } from '../services/lookersAiAttachments';
import { questionCopy } from '../data/lookersAiQuestionCopy';

const stages = ['home', 'files', 'details', 'review', 'result'] as const;
type Stage = typeof stages[number];
type Tab = 'prompt' | 'summary';
const generateDraft = createApplicationGenerator(lookersAiTransport);

const copy = (lang: Lang, en: string, ar: string) => lang === 'ar' ? ar : en;
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
    throw new Error('Image is too large to store on this device.');
  }
};
const safeFileName = (value: string) => value.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'lookers-ai';
const prettySize = (size: number, lang: Lang) => size < 1024
  ? `${size} ${copy(lang, 'B', 'بايت')}`
  : size < 1024 * 1024
    ? `${Math.round(size / 1024)} ${copy(lang, 'KB', 'ك.ب')}`
    : `${(size / (1024 * 1024)).toFixed(1)} ${copy(lang, 'MB', 'م.ب')}`;

const LookersAIPage: React.FC = () => {
  const { lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const ar = lang === 'ar';
  const [projectState, setProjectState] = useState<UserProjectState>(() => lookersAiProjectState.load(lang));
  const projectStateRef = useRef(projectState);
  const [tab, setTab] = useState<Tab>('prompt');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState('');
  const [saved, setSaved] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [externalReply, setExternalReply] = useState('');
  const [continuationMode, setContinuationMode] = useState('Improve');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [showProjectContext, setShowProjectContext] = useState(false);
  const [handoffTool, setHandoffTool] = useState('');
  const generationRef = useRef<AbortController | null>(null);
  const languageRef = useRef(lang); languageRef.current = lang;
  useEffect(() => () => { generationRef.current?.abort(); generationRef.current = null; }, []);
  const uploadRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const current = projectState.current;
  const answers = current.answers;
  const stage = current.step;
  const prompt = useMemo(() => current.generatedPrompt || compileLookersPrompt(current, lang), [current, lang]);
  const reviewRows = [
    { id: 'idea', label: copy(lang, 'Idea', 'الفكرة'), value: String(answers.idea || ''), step: 'home' as Stage },
    { id: 'task-type', label: copy(lang, 'Task type', 'نوع المهمة'), value: String(answers.taskDescription || taskTypes.find((item) => item.id === current.taskType)?.title[lang] || ''), step: 'details' as Stage },
    { id: 'references', label: copy(lang, 'References', 'المراجع'), value: current.attachments.length
      ? current.attachments.map((file) => `${file.name} · ${file.include ? copy(lang, 'Included', 'مرفق') : copy(lang, 'Excluded', 'مستبعد')} · ${prettySize(file.size, lang)}`).join(' / ')
      : copy(lang, 'No references attached', 'لسه مضفتش مراجع'), step: 'files' as Stage },
    { id: 'purpose', label: copy(lang, 'Desired result', 'الهدف اللي عايزه'), value: String(answers.purpose || ''), step: 'details' as Stage },
    { id: 'context', label: copy(lang, 'Helpful context', 'سياق يساعد على الفهم'), value: String(answers.context || ''), step: 'details' as Stage },
    { id: 'successCriteria', label: copy(lang, 'Success criteria', 'معايير النجاح'), value: String(answers.successCriteria || ''), step: 'details' as Stage },
    { id: 'location', label: copy(lang, 'Execution location', 'مكان التنفيذ'), value: String(answers.location || ''), step: 'details' as Stage },
    { id: 'tools', label: copy(lang, 'Available tools', 'الأدوات المتاحة'), value: String(answers.tools || ''), step: 'details' as Stage },
    { id: 'permissions', label: copy(lang, 'Permissions or approvals', 'الصلاحيات أو الموافقات'), value: String(answers.permissions || ''), step: 'details' as Stage },
    { id: 'size', label: copy(lang, 'Expected project size', 'حجم المشروع المتوقع'), value: String(answers.size || '') === 'auto' ? copy(lang, 'Let Lookers AI decide', 'دع Lookers AI يحدده') : String(answers.size || ''), step: 'details' as Stage },
    { id: 'constraints', label: copy(lang, 'Constraints', 'القيود'), value: String(answers.constraints || ''), step: 'details' as Stage },
    { id: 'stopConditions', label: copy(lang, 'Stop and ask when', 'التوقف وطلب المدخلات عند'), value: String(answers.stopConditions || ''), step: 'details' as Stage },
    { id: 'deliverable', label: copy(lang, 'Deliverable', 'عايز تستلم إيه'), value: String(answers.deliverable || ''), step: 'details' as Stage },
    ...questions[current.taskType].map((field) => {
      const value = answers[field.id];
      const formatted = Array.isArray(value)
        ? value.map((item) => field.options?.find((option) => option.value === item)?.[lang] || item).join(ar ? '، ' : ', ')
        : String(value || '');
      return { id: field.id, label: ar ? questionCopy[field.id]?.[0] || field.label.ar : field.label.en, value: formatted, step: 'details' as Stage };
    })
  ];

  const completeness = useMemo(() => planDraftQuestions(current, lang), [current, lang]);
  const taskQuestion = {id:'taskDescription',label:{en:'Describe the task in your own words',ar:'نوع المهمة — اوصفه بطريقتك'},kind:'textarea' as const,optional:true,options:taskTypes.map(task=>({value:task.id,en:task.title.en,ar:task.title.ar}))};
  const purposeQuestion = {id:'purpose',label:{en:'Desired result',ar:'عايز توصل لإيه؟'},kind:'textarea' as const};
  const extraQuestions = [['context','Helpful context'],['constraints','Constraints'],['deliverable','Deliverable'],['successCriteria','Success criteria'],['location','Execution location'],['tools','Available tools'],['permissions','Permissions or approvals'],['size','Expected size'],['stopConditions','Stop and ask when']].filter(([id])=>!completeness.fields.some(f=>f.id===id)).map(([id,en])=>({id,label:{en,ar:questionCopy[id]?.[0]||en},kind:'textarea' as const,optional:true}));
  const cardQuestions = [taskQuestion,...completeness.fields.filter(f=>!f.optional),purposeQuestion,...completeness.fields.filter(f=>f.optional),...extraQuestions];
  const activeQuestion = cardQuestions[Math.min(questionIndex,cardQuestions.length-1)];
  useEffect(() => { setQuestionIndex(0); }, [current.taskType]);
  useEffect(() => { setQuestionIndex(index => Math.min(index, Math.max(0, cardQuestions.length - 1))); }, [cardQuestions.length]);
  useEffect(() => { setExternalReply(''); setEditingPrompt(false); setShowHandoff(false); setHandoffTool(''); setShowProjectContext(false); setGenerationNotice(''); }, [current.id]);

  const commit = (next: UserProjectState) => {
    projectStateRef.current = next;
    setProjectState(next);
    setSaved(lookersAiProjectState.save(next, lang));
  };
  const useLibraryDraft = (draft: ProjectDraft) => {
    const latest = projectStateRef.current;
    const active = latest.current;
    const hasWork = Boolean(String(active.answers.idea || '').trim() || active.attachments.length || active.generatedPrompt || Object.keys(active.answers).length);
    commit({ version: 1, current: draft, archived: hasWork ? [active, ...latest.archived] : latest.archived });
    setShowLibrary(false); setQuestionIndex(0); setTab('prompt');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const patchCurrent = (patch: Partial<ProjectDraft>, action?: string) => {
    const now = new Date().toISOString();
    const latest = projectStateRef.current;
    const invalidatesResult = ['answers', 'taskType', 'attachments'].some(key => Object.hasOwn(patch, key));
    const project = { ...latest.current, ...(invalidatesResult ? { generatedPrompt: undefined } : {}), ...patch, updatedAt: now };
    if (action) project.activity = [...project.activity, { at: now, action }].slice(-250);
    commit({ ...latest, current: project });
  };
  const setStage = (next: Stage) => {
    if(next==='details')setQuestionIndex(0);
    patchCurrent({ step: next }, `opened_${next}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const setAnswer = (id: string, value: string | string[]) => {
    setGenerationNotice('');
    const nextAnswers = { ...answers, [id]: value };
    const title = id === 'idea' ? (String(value).trim().slice(0, 64) || '') : current.title;
    patchCurrent({ answers: nextAnswers, title });
  };
  const createPrompt = async () => {
    if (generationRef.current) return;
    const controller = new AbortController(); generationRef.current = controller; setGenerating(true); setGenerationNotice('');
    const snapshot = structuredClone(projectStateRef.current.current);
    try {
      const result = await generateDraft(snapshot, lang, controller.signal);
      // Navigation or edits while waiting must not overwrite a newer brief.
      if (controller.signal.aborted || languageRef.current !== lang || JSON.stringify(projectStateRef.current.current) !== JSON.stringify(snapshot)) return;
      if (result.agent.error || result.agent.decision.action !== 'complete' || result.enhancement.status !== 'ready') {
        const field = result.agent.questionState?.question?.field;
        const label = result.agent.questionState?.question?.label[lang];
        setGenerationNotice(label ? copy(lang, 'Please answer: ', 'يرجى الإجابة: ') + label : copy(lang, 'Please review your project details before generating.', 'راجع تفاصيل مشروعك قبل إنشاء البرومبت.'));
        setStage(field === 'intent' ? 'home' : 'details');
        const aliases: Record<string, string> = { 'details.aspectRatio': 'format', 'details.businessFacts': 'product', 'details.exactText': 'imageText' };
        const id = field && (aliases[field] || field.replace('details.', ''));
        const index = questions[snapshot.taskType].findIndex(question => question.id === id);
        if (index >= 0) setQuestionIndex(index);
        return;
      }
      patchCurrent({ step: 'result', generatedPrompt: result.prompt }, `prompt_generated_${result.source}`);
      setTab('prompt');
    } catch {
      if (!controller.signal.aborted && languageRef.current === lang && JSON.stringify(projectStateRef.current.current) === JSON.stringify(snapshot))
        setGenerationNotice(copy(lang, 'Please review your project details before generating.', 'راجع تفاصيل مشروعك قبل إنشاء البرومبت.'));
    }
    finally { if (generationRef.current === controller) { generationRef.current = null; setGenerating(false); } }
  };

  const addFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const uploadProjectId=projectStateRef.current.current.id;
    if (!files.length) return;
    setBusy(true);
    const additions: ProjectAttachment[] = files.map((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const image = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension);
      const textLike = ['txt', 'md', 'csv', 'tsv', 'json'].includes(extension) || file.type.startsWith('text/');
      return {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name: file.name, mime: file.type || extension || 'application/octet-stream', size: file.size,
        kind: image ? 'image' : textLike ? 'text' : 'file', include: true,
        note: copy(lang, 'Preparing file…', 'بنجهّز الملف…'), processing: true
      };
    });
    patchCurrent({ attachments: [...projectStateRef.current.current.attachments, ...additions] }, 'attachments_added');
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const attachment = additions[index];
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const image = attachment.kind === 'image';
      let text: string | undefined;
      let dataUrl: string | undefined;
      let note = '';
      if (image) {
        try { dataUrl = await storeImageReference(file); }
        catch { note = copy(lang, 'Image reference saved by name; a preview could not be stored on this device.', 'حُفظ اسم الصورة كمرجع، لكن تعذر حفظ معاينتها على هذا الجهاز.'); }
      } else {
        const extracted = await extractAttachment(file,lang);
        text=extracted.text; note=extracted.note;
      }
      if(projectStateRef.current.current.id!==uploadProjectId){setBusy(false);return;}
      const latestAttachments = projectStateRef.current.current.attachments.map((item) => item.id === attachment.id
        ? { ...item, note, text, dataUrl, processing: false,include:Boolean(text||dataUrl) && item.include }
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
  const importProject = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { version?: number; project?: ProjectDraft };
      const imported = parsed?.version === 1 ? parsed.project : undefined;
      if (!isLegacyDraft(imported) || projectStateRef.current.archived.some(project => project.id === imported.id)) throw new Error('Invalid project file');
      patchCurrent(imported);
      setTab('prompt');

    } catch {
      window.alert(copy(lang, 'This project file could not be opened.', 'تعذر فتح ملف المشروع هذا.'));
    }
    if (importRef.current) importRef.current.value = '';
  };
  const startOver = (confirmBeforeArchive = true) => {
    const latest = projectStateRef.current;
    const active = latest.current;
    const hasWork = Boolean(
      String(active.answers.idea || '').trim() ||
      active.attachments.length ||
      active.generatedPrompt ||
      Object.values(active.answers).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(String(value).trim())) ||
      active.taskType !== 'general' ||
      active.activity.some((entry) => entry.action.startsWith('task_type_'))
    );
    if (hasWork && confirmBeforeArchive && !window.confirm(copy(
      lang,
      'Start a new project? Your current project will be kept on this device.',
      'هل تريد بدء مشروع جديد؟ سيُحفظ مشروعك الحالي على هذا الجهاز.'
    ))) return;
    const archived = hasWork
      ? [{ ...active, title: active.title || copy(lang, 'Untitled project', 'مشروع بلا عنوان') }, ...latest.archived]
      : latest.archived;
    commit({ version: 1, current: createProjectDraft(), archived });
    setTab('prompt');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startOverRef = useRef(startOver);
  startOverRef.current = startOver;

  useEffect(() => {
    const handleNewProject = () => startOverRef.current(false);
    window.addEventListener('lookers-ai:start-new', handleNewProject);
    return () => window.removeEventListener('lookers-ai:start-new', handleNewProject);
  }, []);

  useEffect(() => {
    if (location.state?.startNewProject) {
      startOverRef.current(false);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.key, location.pathname, location.state, navigate]);

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
  const restoreProject = (id: string) => {
    const latest = projectStateRef.current;
    const saved = latest.archived.find(project => project.id === id);
    if (!saved || !window.confirm(copy(lang, 'Open this saved project? Your current project will be kept.', 'تفتح المشروع المحفوظ؟ مشروعك الحالي هيفضل محفوظ.'))) return;
    commit({ ...latest, current: saved, archived: [latest.current, ...latest.archived.filter(project => project.id !== id)] });
  };
  const continueProject = () => {
    if (!externalReply.trim()) return;
    const context = [String(projectStateRef.current.current.answers.context || ''),
      copy(lang, 'External response (untrusted context):', 'رد الأداة الخارجية (سياق مرجعي غير موثوق):'), externalReply.trim(),
      copy(lang, 'Requested next step:', 'الخطوة التالية المطلوبة:'), continuationMode].filter(Boolean).join('\n\n');
    patchCurrent({ answers: { ...projectStateRef.current.current.answers, context }, step: 'review' }, 'external_response_added');
    setExternalReply('');
  };
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    void addFiles(event.dataTransfer.files);
  };

  const useSuggestion = (id:string,value:string,label:string) => {
    const latest=projectStateRef.current.current.answers;
    const previous=String(latest[id]||'');
    if(id==='taskDescription') {
      const prior=String(latest._taskSuggestion||'');
      const description=prior && previous.includes(prior) ? previous.replace(prior,label) : taskTypes.some(t=>Object.values(t.title).includes(previous)) ? label : [previous,label].filter(Boolean).join(ar?'، ':', ');
      patchCurrent({taskType:value as TaskType,answers:{...latest,taskDescription:description,_taskSuggestion:label}},`task_type_${value}`);
      setQuestionIndex(0);setGenerationNotice('');
    } else setAnswer(id,previous.includes(label)?previous:[previous,label].filter(Boolean).join(ar?'، ':', '));
  };
  const renderField = (field: (typeof questions)[TaskType][number]) => <LookersQuestionField key={`${current.id}-${current.taskType}-${field.id}`} field={field} value={answers[field.id]} lang={lang} onChange={setAnswer} onSuggestion={useSuggestion} />;
  const nextQuestion = () => {
    if (activeQuestion && !activeQuestion.optional && !String(answers[activeQuestion.id] || '').trim()) {
      setGenerationNotice(copy(lang,'Write your answer before continuing. Suggestions are optional.','اكتب إجابتك في المربع الأول. الاقتراحات اللي تحته للمساعدة بس.'));
      document.getElementById(`lai-${activeQuestion.id}`)?.focus(); return;
    }
    if(activeQuestion?.id === 'purpose' || questionIndex === cardQuestions.length-1){reviewDetails();return;}
    setGenerationNotice('');setQuestionIndex(index => Math.min(cardQuestions.length - 1,index + 1));
  };
  const reviewDetails = () => {
    const missing = completeness.missing.find(field => !field.optional);
    if (missing) {
      const index = cardQuestions.findIndex(field => field.id === missing.id);
      if(index >= 0) setQuestionIndex(index); else if(missing.id === 'idea') setStage('home');
      setGenerationNotice(copy(lang,'Write the required details before reviewing.','كمّل الإجابة المطلوبة بكلامك الأول، وبعدها نراجع الفكرة.'));return;
    }
    if(!String(answers.purpose || '').trim()) {setGenerationNotice(copy(lang,'Describe your goal first.','قول لنا عايز توصل لإيه الأول.'));setQuestionIndex(cardQuestions.findIndex(field=>field.id==='purpose'));return;}
    setGenerationNotice('');setStage('review');
  };

  return (
    <div className="lookers-ai" data-stage={stage} dir={ar ? 'rtl' : 'ltr'} lang={lang}>
      <div className="lookers-ai__wrap">
        <LookersAIHeader libraryOpen={showLibrary} onLibraryToggle={() => {setShowTools(false);setShowLibrary(value => !value);}} toolsOpen={showTools} onToolsToggle={() => {setShowLibrary(false);setShowTools(value=>!value);}} />

        <div className="lai-atmosphere" aria-hidden="true"><svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice"><path d="M0 170L85 95L155 190L230 70L310 110M85 95L230 70M0 310L155 190L285 285M905 65L980 150L1090 90L1200 170M980 150L1040 270L1150 300L1200 170M905 65L1090 90M1040 270L1090 90" />{[[85,95],[230,70],[285,285],[980,150],[1090,90],[1150,300]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" />)}</svg></div>
        <header className="lookers-ai__hero">
          <ConstellationName />
          <h1>{copy(lang, 'One idea.', 'فكرة واحدة.')}<br /><em>{copy(lang, 'Every step opens the next.', 'وكل خطوة تفتح اللي بعدها.')}</em></h1>
          <p>{copy(lang, 'Write what you want. We’ll help you prepare the prompt.', 'قول لنا عايز تعمل إيه. هنساعدك تجهّز البرومبت.')}</p>
        </header>

        {showTools ? <section className="lai-card"><LookersAIToolDirectory lang={lang} draft={current} selectedTool={handoffTool} onUse={setHandoffTool} onCopy={()=>void copyPrompt()} onClose={()=>setShowTools(false)} /></section> : showLibrary ? <LookersPromptLibrary lang={lang} currentTask={current.taskType} onClose={() => setShowLibrary(false)} onUse={useLibraryDraft} /> : <>
        <nav className="lai-steps" aria-label={copy(lang, 'Project steps', 'خطوات المشروع')}>
          {stages.map((item, index) => <button type="button" key={item} onClick={() => setStage(item)} aria-current={item === stage ? "step" : undefined} className={index === stepIndex ? 'is-active' : index < stepIndex ? 'is-done' : ''}>
            <span>{index < stepIndex ? <Check size={13} /> : index + 1}</span><small>{stageTitles[item][lang]}</small>
          </button>)}
        </nav>


        <div className="lai-workspace">
        <div className="lookers-ai__main" key={`${current.id}-${stage}`}>
          {generationNotice && stage !== 'details' && <p className="lai-notice" role="alert">{generationNotice}</p>}
          {stage === 'home' && (
            <section className="lai-card lai-brief-card lai-flow-card">
              <div className="lai-card-heading">
                <div className="lai-heading-icon"><Lightbulb size={19} /></div>
                <div><h2>{copy(lang, 'What would you like to make?', 'إيه اللي حابب تعمله؟')}</h2>
                  <p>{copy(lang, 'Start with a sentence. Lookers AI will organize the brief with you.', 'ابدأ بجملة، أو استخدم الاختيارات اللي تحت عشان تكوّن رؤيتك.')}</p></div>
              </div>
              <div className="lai-card-scroll">
              <div className="lai-field-heading"><label htmlFor="lai-idea">{copy(lang,'Project idea','احكي فكرتك')}</label><QuestionHelp id="idea" label={copy(lang,'Project idea','احكي فكرتك')} lang={lang} /></div>
              <textarea id="lai-idea" className="lai-idea-input" rows={3} value={String(answers.idea || '')}
                placeholder={copy(lang, 'Describe your idea, goal, or the thing you want to improve…', 'اكتب فكرتك أو هدفك أو الشيء الذي تريد تطويره…')}
                onChange={(event) => setAnswer('idea', event.target.value)} />
              <LookersVisionChoices key={current.id} answers={answers} lang={lang} onChange={(next,task) => patchCurrent({answers:next,...(task ? {taskType:task} : {}),title:String(next.idea || '').trim().slice(0,64)},task ? `task_type_${task}` : 'vision_updated')} />
              <details className="lai-more-examples"><summary>{copy(lang, 'More examples', 'أمثلة إضافية')}</summary>
              <div className="lai-examples">
                {exampleIdeas.map((example) => <button type="button" key={example} onClick={() => setAnswer('idea', example)}>{example}</button>)}
              </div>
              </details>
              </div>
              <div className="lai-brief-footer">
                <button type="button" className="lai-primary-button" disabled={!String(answers.idea || '').trim()}
                  onClick={() => { const explicit = current.activity.some(entry => entry.action.startsWith('task_type_') || entry.action.startsWith('library_prompt_selected:')); const inferred = explicit ? current.taskType : detectTaskType(String(answers.idea || '')); patchCurrent({ taskType: inferred, step: 'files' }, 'brief_started'); }}>
                  {copy(lang, 'Start building', 'ابدأ التجهيز')}<ArrowUpRight size={17} />
                </button>
              </div>


            </section>
          )}

          {stage === 'files' && (
            <section className="lai-card lai-flow-card">
              <div className="lai-card-heading">
                <div className="lai-heading-icon"><ImagePlus size={19} /></div>
                <div><h2>{copy(lang, 'Add useful references', 'ضيف مراجع تساعدنا نفهم فكرتك')}</h2>
                  <p>{copy(lang, 'We read XLSX, DOCX, text PDF, CSV and text files, then include an excerpt in your prompt.', 'ارفع Excel أو Word أو PDF نصي. هنقرا المحتوى ونستخدم مقتطف منه في البرومبت.')}</p></div>
              </div>
                      <div className="lai-card-scroll"><section className="lai-attachments" aria-label={copy(lang, 'Project files', 'ملفات المشروع')}
          onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
          <div className="lai-attachments-heading">
            <div><b>{copy(lang, 'Project files & references', 'ملفات ومراجع المشروع')}</b>
              <small>{copy(lang, 'References stay with this project. Return to this step to edit them.', 'المراجع بتفضل مع فكرتك. ارجع للخطوة دي لو محتاج تعدّلها.')}</small></div>
            <button type="button" className="lai-secondary-button" onClick={openFilePicker} disabled={busy}><Paperclip size={16} />{copy(lang, 'Add files', 'ضيف ملفات')}</button>
          </div>
          <div className="lai-attachments-content">
            {current.attachments.length === 0
              ? <button type="button" className="lai-empty-upload" onClick={openFilePicker}>
                  <Upload size={20} /><span>{copy(lang, 'Choose files or drop them here', 'اختار ملفات أو اسحبها هنا')}</span>
                  <small>{copy(lang, 'Images, text, CSV, and project references', 'صور ونصوص ومستندات توضح فكرتك')}</small>
                </button>
              : <div className="lai-file-list">{current.attachments.map((file) => <article className={`lai-file ${file.include ? '' : 'is-muted'}`} key={file.id}>
                  {file.dataUrl ? <img src={file.dataUrl} alt="" /> : <span className="lai-file-icon">{file.kind === 'text' || /\.(pdf|docx?|rtf)$/i.test(file.name)
                    ? <FileText size={18} />
                    : /\.(xlsx?|ods|csv)$/i.test(file.name) ? <FileSpreadsheet size={18} /> : <Paperclip size={18} />}</span>}
                  <div className="lai-file-main"><b>{file.name}</b>{!file.processing && !file.text && !file.dataUrl && <p className="lai-file-error" role="alert">{file.note}<br/>{copy(lang,'Upload the file again after correcting it to read its content.','ارفع الملف تاني عشان نقرا محتواه؛ ولو فيه مشكلة في النسخة دي جرّب نسخة سليمة.')}</p>}{file.text && <details className="lai-extracted-preview"><summary>{copy(lang,'Review extracted content','راجع المحتوى المقروء')}</summary><pre>{file.text}</pre></details>}
                    <details className="lai-reference-details"><summary>{copy(lang, 'Details & note', 'تفاصيل وملاحظة')}</summary>
                      <small>{`${prettySize(file.size, lang)} · ${file.mime} · ${file.note}`}</small>
                      {!file.processing && <input type="text" value={file.note} aria-label={copy(lang, 'Reference note', 'ملاحظة على المرجع')}
                        placeholder={copy(lang, 'Add a note about this file', 'اكتب ملاحظة على الملف')}
                        onChange={(event) => updateFileNote(file.id, event.target.value)} />}
                    </details>
                  </div>
                  <span className={`lai-upload-state ${file.processing ? 'is-processing' : ''}`} aria-label={file.processing ? copy(lang, 'Processing', 'بنجهّزه') : copy(lang, 'Uploaded', 'جاهز')}>
                    {file.processing ? <LoaderCircle className="lai-spinner" size={15} /> : <CheckCircle2 size={15} />}
                    {file.processing ? copy(lang, 'Preparing', 'بنجهّزه') : file.text ? copy(lang, 'Content ready for prompt', 'محتوى جاهز للبرومبت') : file.dataUrl ? copy(lang, 'Image preview — add a description', 'معاينة صورة — ضيف وصفها') : copy(lang, 'Needs attention', 'محتاج مراجعة')}
                  </span>
                  <label className="lai-file-include"><input type="checkbox" checked={file.include} onChange={() => toggleFile(file.id)} />{file.include ? copy(lang, 'Included', 'مرفق') : copy(lang, 'Excluded', 'مستبعد')}</label>
                  <button type="button" className="lai-icon-button is-danger" title={copy(lang, 'Remove file', 'حذف الملف')} aria-label={copy(lang, 'Remove file', 'حذف الملف')}
                    onClick={() => removeFile(file.id)}><X size={17} /></button>
                </article>)}</div>}
          </div>
        </section>

              </div>
              <div className="lai-nav-buttons">
                <button type="button" className="lai-secondary-button" onClick={() => setStage('home')}><ArrowLeft size={16} />{copy(lang, 'Back', 'السابق')}</button>
                <button type="button" className="lai-primary-button" disabled={busy} onClick={() => setStage('details')}>{copy(lang, 'Continue', 'تابع')}<ArrowRight size={16} /></button>
              </div>
            </section>
          )}

          {stage === 'details' && (
            <section className="lai-card lai-question-card" key={`${current.taskType}-${activeQuestion.id}`}>
              <div className="lai-card-heading"><div className="lai-heading-icon"><Target size={19}/></div><div><h2>{copy(lang,'Build your brief, one answer at a time','نرتّب فكرتك، سؤال بسؤال')}</h2><p>{copy(lang,'Write freely or use an optional idea and edit it.','اكتب براحتك، أو اختار اقتراح وعدّل عليه.')}</p></div></div>
              <div className="lai-question-card-body" key={`${current.taskType}-${activeQuestion.id}`}>
                {generationNotice && <p className="lai-notice" role="alert">{generationNotice}</p>}
                <p className="lai-question-position">{copy(lang,'Question','سؤال')} {questionIndex+1} / {questionIndex<=cardQuestions.findIndex(q=>q.id==='purpose')?cardQuestions.findIndex(q=>q.id==='purpose')+1:cardQuestions.length} · {taskTypes.find(t=>t.id===current.taskType)?.title[lang]}</p>
                {renderField(activeQuestion)}
              </div>
              <div className="lai-nav-buttons lai-question-navigation">
                <button type="button" className="lai-secondary-button" onClick={()=>questionIndex===0?setStage('files'):setQuestionIndex(i=>i-1)}><ArrowLeft size={16}/>{copy(lang,'Previous question','السؤال السابق')}</button>
                {activeQuestion.id==='purpose' && <button type="button" className="lai-secondary-button" onClick={()=>setQuestionIndex(i=>i+1)}>{copy(lang,'More details (optional)','تفاصيل أكتر (اختياري)')}</button>}
                <button type="button" className="lai-primary-button" onClick={nextQuestion}>{activeQuestion.id==='purpose'||questionIndex===cardQuestions.length-1?copy(lang,'Review brief','راجع فكرتك'):activeQuestion.optional?copy(lang,'Next / skip','التالي / تخطّي'):copy(lang,'Next question','السؤال التالي')}<ArrowRight size={16}/></button>
              </div>
            </section>
          )}

          {stage === 'review' && (
            <section className="lai-card lai-flow-card">
              <div className="lai-card-heading">
                <div className="lai-heading-icon"><CheckCircle2 size={19} /></div>
                <div><h2>{copy(lang, 'Review your project', 'راجع ملخص المشروع')}</h2>
                  <p>{copy(lang, 'You can go back and change anything before creating the prompt.', 'تقدر ترجع وتعدّل أي حاجة قبل ما نجهّز البرومبت.')}</p></div>
              </div>
              <div className="lai-card-scroll"><div className="lai-completeness">
                <div><span>{copy(lang, 'Brief completeness', 'اكتمال التفاصيل')}</span><b>{completeness.percent}%</b></div>
                <span className="lai-progress"><i style={{ width: `${completeness.percent}%` }} /></span>
              </div>
              {completeness.missing.length > 0 && <div className="lai-notice">
                <b>{copy(lang, 'A few details are still blank', 'فيه تفاصيل لسه محتاجة تتكتب')}</b>
                <span>{completeness.missing.map((item) => item.label[lang]).join(ar ? '، ' : ', ')}</span>
                <small>{copy(lang, 'You can still continue; the prompt will clearly mark unknown information.', 'يمكنك المتابعة، وسيبقي الـPrompt المعلومات الناقصة واضحة دون اختراعها.')}</small>
              </div>}
              <div className="lai-review-list">
                {reviewRows.map((row) => <div key={row.id}>
                  <b>{row.label}</b><span>{row.value || copy(lang, 'Not specified', 'لسه مش محدد')}</span>
                  <button type="button" onClick={() => setStage(row.step)}>{copy(lang, 'Edit', 'تعديل')}</button>
                </div>)}
              </div>
              </div>
              <div className="lai-nav-buttons">
                <button type="button" className="lai-secondary-button" onClick={() => setStage('details')}><ArrowLeft size={16} />{copy(lang, 'Back', 'السابق')}</button>
                <button type="button" className="lai-primary-button" disabled={generating || busy} onClick={() => void createPrompt()}>
                  {generating ? <LoaderCircle size={16} /> : <Sparkles size={16} />}{generating ? copy(lang, 'Preparing your result…', 'جارٍ تجهيز النتيجة…') : copy(lang, 'Create my prompt', 'جهّز البرومبت')}
                </button>
              </div>
            </section>
          )}

          {stage === 'result' && (
            <section className="lai-result-card" aria-label={copy(lang,'Result workspace','مساحة النتيجة')}>
              <div className="lai-result-heading">
                <div className="lai-result-mark"><Sparkles size={21} /></div>
                <div><h2>{copy(lang, 'Your prompt is ready', 'البرومبت جاهز')}</h2>
                  <p>{copy(lang, 'Review the prompt, then copy it into your tool.', 'راجع البرومبت، وبعدها انسخه للأداة اللي هتستخدمها.')}</p></div>
              </div>
              {current.activity.findLast(entry => entry.action.startsWith('prompt_generated_'))?.action === 'prompt_generated_local' && <div className="lai-notice" role="status">
                {copy(lang, 'AI was unavailable. This is the local draft based on your supplied details.', 'تعذر اتصال الذكاء الاصطناعي. هذه مسودة محلية مبنية على التفاصيل التي أدخلتها.')}
              </div>}
              <div className="lai-result-editor"><div className="lai-tabs" role="tablist" aria-label={copy(lang, 'Result views', 'طرق عرض النتيجة')}>
                {(['prompt', 'summary'] as Tab[]).map((item) => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>
                  {item === 'prompt' ? 'Prompt' : copy(lang, 'Project summary', 'ملخص المشروع')}
                </button>)}
              </div>
              {tab === 'prompt' && <textarea className="lookers-ai__prompt-output" aria-label={copy(lang, 'Your prompt', 'البرومبت الخاص بك')} dir={ar ? 'rtl' : 'ltr'} readOnly={!editingPrompt} value={prompt} onChange={event => patchCurrent({ generatedPrompt: event.target.value }, 'prompt_edited')} />}
              <div className="lai-result-actions">
                {tab === 'prompt' && <button type="button" className="lai-copy-button lai-primary-button" onClick={() => void copyPrompt()}>{copied ? <Check size={15} /> : <Clipboard size={15} />}{copied ? copy(lang, 'Copied', 'تم النسخ') : copy(lang, 'Copy', 'انسخ')}</button>}
                <button type="button" className="lai-secondary-button" onClick={() => { setTab('prompt'); setEditingPrompt(value => !value); }}>{editingPrompt ? copy(lang, 'Finish editing', 'احفظ التعديل') : copy(lang, 'Edit', 'عدّل')}</button>
                <button type="button" className="lai-secondary-button" onClick={() => setStage('review')}>{copy(lang, 'Improve', 'حسّن')}</button>
                <button type="button" className="lai-secondary-button" onClick={downloadPrompt}><Download size={16} />{copy(lang, 'Download', 'نزّل')}</button>
              </div>
              {tab === 'summary' && <div className="lai-summary">
                <div><b>{copy(lang, 'Project idea', 'فكرة المشروع')}</b><p>{String(answers.idea || '') || copy(lang, 'Not specified', 'لسه مش محددة')}</p></div>
                <div><b>{copy(lang, 'Task type', 'نوع المهمة')}</b><p>{taskTypes.find((item) => item.id === current.taskType)?.title[lang]}</p></div>
                <div><b>{copy(lang, 'Desired result', 'الهدف اللي عايزه')}</b><p>{String(answers.purpose || '') || copy(lang, 'Not specified', 'لسه مش محددة')}</p></div>
                <div><b>{copy(lang, 'Project files', 'ملفات المشروع')}</b><p>{current.attachments.filter((file) => file.include).map((file) => file.name).join(ar ? '، ' : ', ') || copy(lang, 'No references attached', 'لسه مضفتش مراجع')}</p></div>
                <div><b>{copy(lang, 'Last saved', 'آخر حفظ')}</b><p>{new Date(current.updatedAt).toLocaleString(ar ? 'ar-EG' : 'en-US')}</p></div>
              </div>}
              </div><aside className="lai-result-sidebar"><details className="lai-result-context"><summary>{copy(lang, 'Built from your brief', 'مبني على تفاصيلك')}</summary>
                <p>{copy(lang, 'Your goal, choices and included references shape this prompt. Review unknown details before use.', 'هدفك واختياراتك ومراجعك المرفقة هي أساس البرومبت. راجع التفاصيل الناقصة قبل الاستخدام.')}</p>
              </details>
              <button type="button" className="lai-secondary-button lai-handoff-toggle" aria-expanded={showHandoff} onClick={() => setShowHandoff(value => !value)}><ArrowUpRight size={16} />{copy(lang, 'Use with your tool', 'استخدمه مع أداتك')}</button>
              <details className="lai-project-actions"><summary>{copy(lang, 'Project options', 'خيارات المشروع')}</summary><div className="lai-result-actions">
                <button type="button" className="lai-secondary-button" onClick={() => exportJson(`${safeFileName(current.title || 'LookersAI-project')}.json`, { version: 1, project: current })}><FileJson2 size={16} />{copy(lang, 'Export project', 'صدّر المشروع')}</button>
                <button type="button" className="lai-secondary-button" onClick={() => importRef.current?.click()}><Upload size={16} />{copy(lang, 'Import project', 'استورد مشروعًا')}</button>
                <button type="button" className="lai-secondary-button" onClick={() => setStage('review')}>{copy(lang, 'Edit project', 'عدّل المشروع')}</button>
              </div></details>
              {showHandoff && <section className="lai-handoff" aria-label={copy(lang, 'Tool handoff', 'استخدم البرومبت خارج المنصة')}>
                <button type="button" className="lai-secondary-button lai-handoff-close" aria-label={copy(lang,'Close tools','اقفل الأدوات')} onClick={()=>setShowHandoff(false)}><X size={16}/>{copy(lang,'Close','اقفل')}</button>
                <span className="lai-kicker">{copy(lang, 'PREPARED · NOT EXECUTED', 'جاهز للاستخدام · لم يُنفّذ')}</span>
                <LookersAIToolDirectory lang={lang} draft={current} selectedTool={handoffTool} onUse={setHandoffTool} onCopy={()=>void copyPrompt()} />
              </section>}
              <details className="lai-continuation"><summary>{copy(lang,'Continue this project','كمّل نفس المشروع')}</summary><section aria-label={copy(lang, 'Continue this project', 'كمّل نفس المشروع')}>
                <div className="lai-card-heading"><div className="lai-heading-icon"><WandSparkles size={22} /></div><div><h3>{copy(lang, 'Didn’t get what you expected?', 'النتيجة مش زي ما توقعت؟')}</h3><p>{copy(lang, 'Bring it back. Keep building from the same idea.', 'ارجع بالنتيجة وكمّل من نفس الفكرة.')}</p></div></div>
                <label className="lai-sr-only" htmlFor="lai-external-reply">{copy(lang, 'External response and what you want changed', 'رد الأداة والتعديل المطلوب')}</label>
                <textarea id="lai-external-reply" className="lai-idea-input" value={externalReply} onChange={event => setExternalReply(event.target.value)} placeholder={copy(lang, 'Paste the response and describe what you want changed…', 'الصق الرد واشرح إيه اللي محتاج يتغيّر…')} />
                <div className="lai-option-grid">{[['Fix', 'إصلاح'], ['Improve', 'تحسين'], ['Continue', 'متابعة'], ['Explain', 'شرح']].map(([en, arabic]) => <button key={en} type="button" className={`lai-option ${continuationMode === en ? 'is-selected' : ''}`} aria-pressed={continuationMode === en} onClick={() => setContinuationMode(en)}>{ar ? arabic : en}</button>)}</div>
                <p className="lai-field-example">{copy(lang, 'Screenshots can be attached as references. Describe the issue; image analysis is not available here.', 'تقدر تضيف لقطة شاشة كمرجع. اشرح المشكلة؛ تحليل الصور غير متاح هنا.')}</p>
                <div className="lai-nav-buttons"><button type="button" className="lai-secondary-button" onClick={openFilePicker}><Paperclip size={16} />{copy(lang, 'Add screenshot', 'أضف لقطة شاشة')}</button><button type="button" className="lai-primary-button" disabled={!externalReply.trim()} onClick={continueProject}>{copy(lang, 'Review next step', 'راجع الخطوة التالية')}</button></div>
              </section></details>
              <div className="lai-start-over">
                <div><h3>{copy(lang, 'Start over', 'ابدأ من جديد')}</h3><p>{copy(lang, 'Keep this project on this device, then begin a clean brief.', 'احتفظ بهذا المشروع على جهازك ثم ابدأ فكرة جديدة.')}</p></div>
                <button type="button" className="lai-reset-button" onClick={startOver}><RotateCcw size={16} />{copy(lang, 'Start over', 'ابدأ من جديد')}</button>
              </div>
            </aside>
            </section>
          )}
        </div>
        </div>

        </>}
        <footer className="lookers-ai__footer">
          <button type="button" className="lai-history-toggle" aria-expanded={showHistory} aria-controls="lai-project-history" onClick={() => setShowHistory(value => !value)}><FolderClock size={16} aria-hidden="true" />Previous Projects</button>
          {showHistory && <section id="lai-project-history" className="lai-card lai-history" aria-label="Previous Projects"><h2>Previous Projects</h2><div className="lai-history-grid">
            {[current, ...projectState.archived].filter(project => String(project.answers.idea || '').trim() || project.attachments.length || project.generatedPrompt).map(project => <button type="button" className="lai-secondary-button" key={project.id} data-project-id={project.id} onClick={() => {if(project.id !== current.id) restoreProject(project.id);setShowHistory(false);setShowTools(false);setShowLibrary(false);}}><span>{project.title || copy(lang,'Untitled project','مشروع من غير اسم')}</span><small>{new Date(project.updatedAt).toLocaleDateString(ar ? 'ar-EG' : 'en-US')} · {stageTitles[project.step][lang]}</small></button>)}
          </div>{!projectState.archived.length && !String(answers.idea || '').trim() && <p>{copy(lang,'Your projects will appear here when you start one.','أول ما تبدأ فكرة، مشروعك هيظهر هنا.')}</p>}<button type="button" className="lai-secondary-button" onClick={() => {startOver(false);setShowHistory(false);}}>{copy(lang,'New project','مشروع جديد')}</button></section>}
          {!saved && <p role="alert">{copy(lang,'Could not save. Export your project before leaving.','الحفظ متاحش دلوقتي. صدّر مشروعك قبل ما تقفل الصفحة.')}</p>}
        </footer>
      </div>
      <input ref={uploadRef} hidden type="file" multiple accept="image/*,.txt,.md,.csv,.tsv,.json,.pdf,.docx,.xlsx" onChange={(event) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ''; }} />
      <input ref={importRef} hidden type="file" accept=".json,application/json" onChange={(event) => void importProject(event.target.files?.[0])} />
    </div>
  );
};

export default LookersAIPage;
