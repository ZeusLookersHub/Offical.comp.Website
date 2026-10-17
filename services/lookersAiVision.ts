import type { Lang, ProjectDraft, TaskType } from '../data/lookersAi';
export interface VisionState { family: TaskType | ''; choices: Record<string,string>; generated: string }
export interface VisionOption { value:string; ar:string; en:string }
export interface VisionNode { id:string; ar:string; en:string; options:VisionOption[] }
const options = (items: string[][]): VisionOption[] => items.map(([value,ar,en]) => ({value,ar,en}));
export const visionFamilies = options([['image','صورة','Image'],['campaign','حملة','Campaign'],['presentation','عرض تقديمي','Presentation'],['dashboard','بيانات','Dashboard'],['general','أخرى','Other']]);
export function readVision(answers: ProjectDraft['answers']): VisionState {
  try {
    const family = String(answers._visionFamily || '');
    const raw = JSON.parse(String(answers._visionChoices || '{}'));
    return { family: visionFamilies.some(f => f.value === family) ? family as TaskType : '', choices: raw && typeof raw === 'object' && !Array.isArray(raw) ? Object.fromEntries(Object.entries(raw).filter((entry):entry is [string,string] => typeof entry[1] === 'string')) : {}, generated: String(answers._visionGenerated || '') };
  } catch { return {family:'',choices:{},generated:''}; }
}
export function visionNodes(state: VisionState): VisionNode[] {
  const v = state.choices;
  const nodes: VisionNode[] = [{id:'action',ar:'حابب تعمل إيه بالصورة؟',en:'What would you like to do?',options:options([['create','صورة جديدة','New image'],['rebuild','تطوير صورة موجودة','Improve an existing image'],['restyle','تغيير الستايل','Change the style'],['combine','دمج صور','Combine images'],['analyze','تحليل صورة','Analyze an image']])}];
  if (v.action === 'analyze') return nodes;
  nodes.push({id:'usage',ar:'الصورة هتستخدم في إيه؟',en:'What is the image for?',options:options([['product','تصوير منتج','Product photo'],['social','محتوى سوشيال','Social content'],['portrait','بورتريه','Portrait'],['poster','بوستر إعلاني','Advertising poster'],['brand','هوية بصرية','Brand identity'],['other','استخدام تاني','Another use']])},
    {id:'style',ar:'أنهي اتجاه أقرب لفكرتك؟',en:'Which visual direction fits?',options:options([['photo','واقعي / تصوير','Photorealistic'],['3d','ثلاثي الأبعاد','3D'],['illustration','رسم وتوضيح','Illustration'],['cinematic','سينمائي','Cinematic'],['minimal','بسيط','Minimal'],['surreal','سريالي','Surreal']])});
  if (v.style === '3d') nodes.push({id:'material',ar:'خامة الـ3D تبقى إزاي؟',en:'Which 3D material?',options:options([['matte','مطفي وناعم','Soft matte'],['glass','زجاجي وشفاف','Transparent glass'],['metal','معدني','Metal'],['clay','صلصال','Clay'],['plastic','بلاستيك لامع','Glossy plastic']])});
  if (['photo','3d','cinematic'].includes(v.style)) nodes.push({id:'lighting',ar:'الإضاءة والإحساس؟',en:'What lighting and mood?',options:options([['soft','ناعم وطبيعي','Soft natural'],['studio','إضاءة استوديو','Studio lighting'],['dramatic','درامي','Dramatic'],['neon','نيون','Neon'],['warm','دافئ','Warm'],['cool','بارد','Cool']])});
  if (v.usage === 'product' && v.style) nodes.push({id:'composition',ar:'تحب نعرض المنتج إزاي؟',en:'How should the product be presented?',options:options([['pedestal','على منصة بسيطة','On a simple pedestal'],['floating','معلّق في الهواء','Floating'],['hand','في إيد شخص','In a person’s hand'],['scene','داخل مشهد طبيعي','In a natural setting'],['closeup','لقطة مقرّبة','Close-up']])});
  nodes.push({id:'format',ar:'اختار المقاس المناسب',en:'Choose an aspect ratio',options:options([['1:1','مربع 1:1','Square 1:1'],['4:5','رأسي 4:5','Portrait 4:5'],['9:16','ستوري 9:16','Story 9:16'],['16:9','عرضي 16:9','Landscape 16:9'],['custom','مقاس تاني','Another size']])});
  return nodes;
}
export function visionText(state: VisionState, lang: Lang): string {
  const {family,choices:v} = state;
  if (!family) return '';
  if (family !== 'image') { const name = visionFamilies.find(f => f.value === family)?.[lang]; return lang === 'ar' ? `عايز أجهّز ${name}.` : `I want to prepare a ${name?.toLowerCase()}.`; }
  const ar = lang === 'ar';
  const actions: Record<string,string[]> = {create:['عايز أنشئ صورة جديدة','I want to create a new image'],rebuild:['عايز أطوّر صورة موجودة','I want to improve an existing image'],restyle:['عايز أغيّر ستايل صورة موجودة','I want to restyle an existing image'],combine:['عايز أدمج صور في تكوين واحد','I want to combine images'],analyze:['عايز أحلّل صورة مرجعية','I want to analyze an image']};
  const clauses = [v.action ? actions[v.action]?.[ar ? 0 : 1] || (ar ? 'عايز أجهّز صورة' : 'I want to prepare an image') : ar ? 'عايز أجهّز صورة' : 'I want to prepare an image'];
  for (const node of visionNodes(state).slice(1)) {
    const option = node.options.find(o => o.value === v[node.id]); if (!option) continue;
    const prefixes: Record<string,string[]> = {usage:['الاستخدام: ','for '],style:['بأسلوب ','in a '],material:['بخامة ','with a '],lighting:['وإضاءة ','with '],composition:['والمنتج ','product shown '],format:['وبمقاس ','aspect ratio ']};
    clauses.push(prefixes[node.id][ar ? 0 : 1] + option[lang]);
  }
  return clauses.join(ar ? '، ' : ', ') + '.';
}
/** Pure update: preserve user text, replace only the exact previous generated wording. */
export function applyVision(answers: ProjectDraft['answers'], state: VisionState, lang: Lang): ProjectDraft['answers'] {
  const next = visionText(state, lang), previous = state.generated, idea = String(answers.idea || '');
  let text: string;
  if (previous && idea.includes(previous)) text = idea.replace(previous, next);
  else if (!previous) text = [idea.trim(), next].filter(Boolean).join('\n\n');
  else { const separator = lang === 'ar' ? '، ' : ', '; const additions = next.split(separator).filter(part => !previous.includes(part.replace(/\.$/,''))); text = [idea, additions.join(separator)].filter(Boolean).join('\n'); }
  return {...answers,idea:text,_visionFamily:state.family,_visionChoices:JSON.stringify(state.choices),_visionGenerated:next};
}
