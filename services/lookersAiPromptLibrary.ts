import { createProjectDraft, type Lang, type ProjectDraft } from '../data/lookersAi';
import { aiTools } from '../data/aiTools';
import type { PromptTemplate } from '../data/promptLibrary';
import { projectFromDraft } from './lookersAiProjectState';
import { dataOnly, exact } from '../core/agent/validation';
import { validateProject } from '../core/projects/validation';

const bindings = new Set(['subject','usage','product','audience','outcome','decisions','dataSource','presentationType','slideCount','visualStyle','brandGuidelines','dataAvailability','speakerNotes','presentationFormat']);
const tasks = new Set(['image','campaign','dashboard','presentation','general']);
const tools = new Set([...aiTools.filter(t=>t.active).map(t=>t.name),'Other']);
const plain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const localized = (v: unknown) => plain(v) && ['en','ar'].every(k => typeof v[k] === 'string' && (v[k] as string).trim().length > 0 && (v[k] as string).length < 5000);
export function validPromptTemplate(raw: unknown): raw is PromptTemplate {
  if (!dataOnly(raw) || !plain(raw) || !exact(raw, ['id','title','description','category','taskType','useCase','tools','inputs','idea','objective','answerBindings','referenceHint','enhancements','featured','curated']) || !/^[a-z][a-z0-9-]{1,60}$/.test(String(raw.id)) || !tasks.has(String(raw.taskType)) || typeof raw.category !== 'string' || !raw.category.trim() ||
    !['title','description','useCase','idea','objective','referenceHint'].every(k=>localized(raw[k])) || !Array.isArray(raw.inputs) || raw.inputs.length < 1 || raw.inputs.length > 8 ||
    !Array.isArray(raw.tools) || !raw.tools.length || !raw.tools.every(t=>tools.has(t)) || !plain(raw.answerBindings) ||
    !Object.entries(raw.answerBindings).every(([k,v])=>bindings.has(k) && localized(v)) || !Array.isArray(raw.enhancements) || !raw.enhancements.every(localized) ||
    typeof raw.featured !== 'boolean' || typeof raw.curated !== 'boolean') return false;
  const ids = new Set<string>();
  for (const i of raw.inputs) {
    if (!plain(i) || !exact(i,['id','label','hint','required']) || ['constructor','prototype','__proto__'].includes(String(i.id)) || typeof i.id !== 'string' || !/^[a-z][a-zA-Z0-9]{0,40}$/.test(i.id) || ids.has(i.id) || !localized(i.label) || !localized(i.hint) || typeof i.required !== 'boolean') return false;
    ids.add(i.id);
  }
  const strings = [raw.idea,raw.objective,...Object.values(raw.answerBindings)];
  return strings.every(pair => Object.values(pair as Record<string,string>).every(s => [...s.matchAll(/\{\{([^}]+)\}\}/g)].every(m=>ids.has(m[1]))));
}
export async function loadPromptLibrary() {
  const catalog = await import('../data/promptLibrary');
  if (!catalog.promptTemplates.every(validPromptTemplate) || new Set(catalog.promptTemplates.map(t=>t.id)).size !== catalog.promptTemplates.length) throw new Error('invalid_catalog');
  return catalog;
}
export function initializeLibraryDraft(template: PromptTemplate, values: Record<string,string>, language: Lang, tool: string = ''): ProjectDraft {
  if (!validPromptTemplate(template) || !dataOnly(values) || !plain(values) || (tool !== '' && !template.tools.includes(tool)) ||
    Object.keys(values).some(k=>!template.inputs.some(i=>i.id===k)) || template.inputs.some(i=>i.required && !values[i.id]?.trim()) ||
    Object.values(values).some(v=>typeof v !== 'string' || v.length > 1500)) throw new Error('invalid_library_inputs');
  const render = (pair: Record<Lang,string>) => pair[language].replace(/\{\{([^}]+)\}\}/g, (_,id:string)=>values[id]?.trim() || '');
  const draft = createProjectDraft();
  draft.title = template.title[language]; draft.taskType = template.taskType; draft.step = 'files';
  draft.answers = { idea:render(template.idea), purpose:render(template.objective), tools:tool,
    context:template.enhancements.map(e=>e[language]).join('\n'),
    ...Object.fromEntries(Object.entries(template.answerBindings).map(([key,value])=>[key,render(value)])),
  };
  draft.activity.push({at:draft.updatedAt,action:`library_prompt_selected:${template.id}`});
  if (!validateProject(projectFromDraft(draft,'active',language)).valid) throw new Error('invalid_library_project');
  return draft;
}
export const RECENT_PROMPTS_KEY = 'lookers-ai-library-recent-v1';
export function readRecentPrompts(storage: Pick<Storage,'getItem'>, validIds: string[]) {
  try {
    const value:unknown=JSON.parse(storage.getItem(RECENT_PROMPTS_KEY) || '[]');
    return Array.isArray(value) ? [...new Set(value.filter((id):id is string=>typeof id==='string' && validIds.includes(id)))].slice(0,10) : [];
  } catch { return []; }
}
