import { aiTools, type AITool, type ToolTaskFamily, type ToolModality } from '../data/aiTools';
import type { ProjectDraft } from '../data/lookersAi';

export const toolDirectoryConfig = { freshnessDays: 30 };
export interface ToolContext {
  taskType: ToolTaskFamily; desiredOutput: string; modality: ToolModality;
  capabilities: string[]; preferredTools: string[];
  presentationIntent?: 'pitch' | 'business' | 'data' | 'education';
}
const answer = (draft: ProjectDraft, key: string) => {
  const value = draft.answers[key]; return Array.isArray(value) ? value.join(', ') : value || '';
};
const rules: [ToolTaskFamily, RegExp][] = [
  ['presentation', /presentation|pitch deck|slide deck|powerpoint|شرائح|عرض تقديمي|برزنتيشن|بريزنتيشن/i],
  ['video', /video|storyboard|reel|فيديو|مشاهد/i],
  ['audio', /audio|voiceover|narration|music|song|صوت|موسيقى|أغنية|اغنية|تعليق صوتي/i],
  ['career', /\bcv\b|resume|career|cover letter|سيرة ذاتية|وظيفة/i],
  ['coding', /code|coding|debug|programming|برمجة|كود/i],
  ['data', /dashboard|spreadsheet|data analysis|csv|داشبورد|بيانات|إكسل|اكسل/i],
  ['support', /customer (support|reply|service)|refund|complaint|خدمة العملاء|رد.*عميل|شكوى/i],
  ['ecommerce', /e-commerce|ecommerce|product listing|online store|متجر|تجارة إلكترونية|وصف منتج/i],
  ['travel', /travel|tourism|itinerary|hotel|operations|سفر|رحلة|سياحة|فندق|تشغيل/i],
  ['research', /research|sources|literature review|بحث|مصادر/i],
  ['education', /education|lesson|training|workshop|تعليم|درس|تدريب|ورشة/i],
  ['marketing', /marketing|campaign|تسويق|حملة/i],
  ['productivity', /productivity|meeting notes|task list|إنتاجية|مهام|محضر اجتماع/i],
  ['business', /business|strategy|proposal|company|بزنس|شركة|استراتيجية|خطة تجارية/i],
  ['images', /image|photo|poster|صورة|صور|بوستر/i],
];
const defaultModality: Record<ToolTaskFamily,ToolModality> = {
  images:'image',video:'video',presentation:'presentation',career:'text',marketing:'text',writing:'text',
  business:'text',data:'data',research:'text',coding:'code',productivity:'text',travel:'text',support:'text',
  audio:'audio',ecommerce:'text',education:'text',
};
const familyCapability: Record<ToolTaskFamily,string> = {
  images:'image-generation',video:'video-generation',presentation:'presentations',career:'writing',
  marketing:'writing',writing:'writing',business:'planning',data:'data-analysis',research:'research',
  coding:'coding',productivity:'planning',travel:'planning',support:'writing',audio:'text-to-speech',
  ecommerce:'writing',education:'learning',
};
export function deriveToolContext(draft: ProjectDraft): ToolContext {
  const desiredOutput = [answer(draft,'purpose'),answer(draft,'outcome'),answer(draft,'deliverable'),answer(draft,'presentationFormat')].join(' ');
  const text = [answer(draft,'idea'),desiredOutput].join(' ');
  const taskType: ToolTaskFamily = draft.taskType==='presentation' ? 'presentation' :
    draft.taskType==='image' ? 'images' : draft.taskType==='dashboard' ? 'data' :
    draft.taskType==='campaign' ? 'marketing' : rules.find(([,pattern])=>pattern.test(text))?.[0] || 'writing';
  const outputFamily = rules.slice(0,3).find(([,pattern])=>pattern.test(desiredOutput))?.[0];
  const modality = outputFamily ? defaultModality[outputFamily] : defaultModality[taskType];
  const preferredTools = answer(draft,'tools').split(/[,\n]/).map(t=>t.trim()).filter(Boolean);
  let presentationIntent: ToolContext['presentationIntent'];
  if(taskType==='presentation') {
    const type = answer(draft,'presentationType');
    const intentText = type || text;
    presentationIntent = /pitch|investor|استثمار|مستثمر/i.test(intentText) ? 'pitch' :
      /data|quarterly|بيانات|أرقام|ارقام|ربعي/i.test(intentText) ? 'data' :
      /education|training|workshop|تعليم|تدريب|ورشة/i.test(intentText) ? 'education' : 'business';
  }
  const capabilities = [familyCapability[taskType]];
  if(modality==='image') capabilities.push('image-generation');
  if(modality==='video') capabilities.push('video-generation');
  if(taskType==='audio' && /music|song|موسيقى|أغنية|اغنية/i.test(text)) capabilities.splice(0,1,'music-generation');
  if(presentationIntent) capabilities.push({pitch:'pitch-decks',business:'business-decks',data:'data-presentations',education:'educational-presentations'}[presentationIntent]);
  return {taskType,desiredOutput,modality,capabilities,preferredTools,...(presentationIntent?{presentationIntent}:{})};
}
/** An editorial task fit, never a popularity/usage score. Each dimension has a separate weight. */
export function rankTools(context: ToolContext, catalog: readonly AITool[] = aiTools) {
  const presentationOrder = {
    pitch:['gamma','canva','pitch','beautiful-ai'],
    business:['gamma','canva','powerpoint','beautiful-ai','pitch'],
    data:['canva','powerpoint','google-slides','gamma'],
    education:['canva','gamma','google-slides','powerpoint'],
  };
  const order = context.presentationIntent ? presentationOrder[context.presentationIntent] : [];
  return catalog.filter(t=>t.active && t.curated && t.supportedTaskTypes.includes(context.taskType))
    .map((tool,index)=>{
      const fit = order.indexOf(tool.id);
      const preferred = context.preferredTools.some(p=>p.toLocaleLowerCase()===tool.id.toLocaleLowerCase()||p.toLocaleLowerCase()===tool.name.toLocaleLowerCase());
      const outputFit = fit>=0 ? (order.length-fit)*20 : 0;
      return {tool,index,score:100 + outputFit + (tool.modality.includes(context.modality)?80:0) +
        context.capabilities.filter(c=>tool.capabilities.includes(c)).length*12 +
        (preferred?150:0) + (tool.featured?6:0) + (tool.curated?3:0)};
    }).sort((a,b)=>b.score-a.score||a.index-b.index).map(({tool})=>tool);
}
function additionTime(value: string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time = Date.parse(value+'T00:00:00.000Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0,10)===value ? time : NaN;
}
export function isNewInAI(tool: AITool, now = new Date(), freshnessDays = toolDirectoryConfig.freshnessDays) {
  const age = now.getTime()-additionTime(tool.addedAt);
  return tool.active && tool.curated && tool.newInAi && Number.isFinite(freshnessDays) && freshnessDays>0 &&
    Number.isFinite(age) && age>=0 && age<freshnessDays*86400000;
}
export function newInAITools(catalog: readonly AITool[] = aiTools, now = new Date(), freshnessDays = toolDirectoryConfig.freshnessDays) {
  return catalog.filter(t=>isNewInAI(t,now,freshnessDays)).sort((a,b)=>b.addedAt.localeCompare(a.addedAt));
}
