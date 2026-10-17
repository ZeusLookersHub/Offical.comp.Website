import React, { useState } from 'react';
import { ArrowRight, ChartNoAxesCombined, ChevronsRight, Image, Megaphone, NotebookPen, Presentation } from 'lucide-react';
import type { Lang, ProjectDraft, TaskType } from '../data/lookersAi';
import { applyVision, readVision, visionFamilies, visionNodes } from '../services/lookersAiVision';
const familyIcons = [Image,Megaphone,Presentation,ChartNoAxesCombined,NotebookPen];
const LookersVisionChoices: React.FC<{answers:ProjectDraft['answers'];lang:Lang;onChange:(answers:ProjectDraft['answers'],task?:TaskType)=>void}> = ({answers,lang,onChange}) => {
  const [expanded, setExpanded] = useState('');
  const state = readVision(answers), nodes = visionNodes(state), node = nodes.find(n => !state.choices[n.id]);
  const update = (next: typeof state, task?: TaskType) => {onChange(applyVision(answers,next,lang),task);setExpanded('');};
  const reset = () => { const idea = state.generated && String(answers.idea || '').includes(state.generated) ? String(answers.idea).replace(state.generated,'').trim() : String(answers.idea || ''); onChange({...answers,idea,_visionFamily:'',_visionChoices:'{}',_visionGenerated:''});setExpanded(''); };
  return <section className="lai-vision-choices" aria-label={lang === 'ar' ? 'اختيارات تساعدك تكوّن رؤيتك' : 'Build your vision'}>
    {!state.family ? <div className="lai-vision-options">{visionFamilies.map((family,i) => {const Icon=familyIcons[i];return <button type="button" key={family.value} className="lai-suggestion" onClick={() => update({family:family.value as TaskType,choices:{},generated:''},family.value as TaskType)}><Icon size={14} aria-hidden="true" />{family[lang]}</button>;})}</div> : state.family === 'image' && node ? <>
      <div className="lai-vision-caption"><span>{node[lang]}</span><button type="button" onClick={() => {const previous=nodes.filter(n=>state.choices[n.id]).at(-1);if(!previous)return reset();const choices={...state.choices};delete choices[previous.id];update({...state,choices});}}><ArrowRight size={13} aria-hidden="true" />{lang === 'ar' ? 'رجوع' : 'Back'}</button></div>
      <div className="lai-vision-options" key={node.id}>{(expanded === node.id ? node.options : node.options.slice(0,3)).map(option => <button type="button" className="lai-suggestion" key={option.value} onClick={() => update({...state,choices:{...state.choices,[node.id]:option.value}})}>{option[lang]}</button>)}{node.options.length>3 && <button type="button" className="lai-vision-more" dir="ltr" aria-expanded={expanded===node.id} onClick={() => setExpanded(expanded===node.id?'':node.id)}>{expanded===node.id?'Less':'More'}<ChevronsRight size={14} aria-hidden="true" /></button>}</div>
    </> : <div className="lai-vision-caption"><span>{lang === 'ar' ? 'رؤيتك في البوكس. كمّلها بكلامك وابدأ.' : 'Your vision is in the box. Add your own details, then start.'}</span><button type="button" onClick={reset}>{lang === 'ar' ? 'عدّل الاختيارات' : 'Change choices'}</button></div>}
  </section>;
}

export default LookersVisionChoices;
