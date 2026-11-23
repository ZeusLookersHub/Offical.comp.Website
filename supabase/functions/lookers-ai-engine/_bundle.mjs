var BoundedError=class extends Error{constructor(code){super(code);this.code=code}};async function bounded(operation,timeoutMs,parent){let controller=new AbortController,timer,onAbort;
try{if(parent?.aborted)throw new BoundedError("aborted");return await Promise.race([Promise.resolve().then(()=>{if(controller.signal.aborted)throw new BoundedError("aborted");return operation(
controller.signal)}),new Promise((_,reject)=>{onAbort=()=>{controller.abort(),reject(new BoundedError("aborted"))},parent?.addEventListener("abort",onAbort,{once:!0}),timer=setTimeout(
()=>{controller.abort(),reject(new BoundedError("timeout"))},timeoutMs)})])}finally{clearTimeout(timer),parent?.removeEventListener("abort",onAbort),controller.abort()}}var PROJECT_ENGINES=[{id:"visual",kind:"group",label:{en:"Visual",ar:"مرئي"}},{id:"visual.image",parentId:"visual",kind:"engine",label:{en:"Image",ar:"صورة"}},{id:"visual.v\
ideo",parentId:"visual",kind:"engine",label:{en:"Video",ar:"فيديو"}},{id:"business",kind:"engine",label:{en:"Business",ar:"أعمال"}},{id:"cv",kind:"engine",label:{en:"CV",
ar:"سيرة ذاتية"}},{id:"powerpoint",kind:"engine",label:{en:"PowerPoint",ar:"PowerPoint"}},{id:"excel",kind:"engine",label:{en:"Excel",ar:"Excel"}},{id:"report",kind:"engin\
e",label:{en:"Report",ar:"تقرير"}},{id:"proposal",kind:"engine",label:{en:"Proposal",ar:"عرض مقترح"}},{id:"business-plan",kind:"engine",label:{en:"Business Plan",ar:"خ\
طة عمل"}},{id:"project-product",kind:"engine",label:{en:"Project / Product",ar:"مشروع / منتج"}},{id:"other",kind:"engine",label:{en:"Other",ar:"أخرى"}}],PROJECT_ENGINE_IDS=PROJECT_ENGINES.
filter(engine=>engine.kind==="engine").map(engine=>engine.id);var question=(field,en,ar,extra={})=>({id:field,field,label:{en,ar},type:"textarea",state:"required",nature:"factual",critical:!0,inferable:!1,userOverride:!0,priority:70,...extra}),
optional={state:"optional",critical:!1,priority:20},technical={nature:"technical",critical:!1,inferable:!0,priority:40},visual=[question("details.subject","What subject or product \
should appear?","ما العنصر أو المنتج المطلوب ظهوره؟"),question("details.usage","Where will it be used?","أين ستُستخدم النتيجة؟",{...optional,
type:"text"}),question("details.aspectRatio","Which aspect ratio should be used?","ما نسبة أبعاد الصورة؟",{...technical,type:"text",defaultRule:{when:[{field:"det\
ails.usage",equals:"Instagram Story"}],value:"9:16"}}),question("details.style","What visual style do you prefer?","ما الأسلوب البصري الذي تفضله؟",{...optional,
nature:"creative",inferable:!0}),question("details.includeText","Should exact text appear?","هل تريد إظهار نص حرفي؟",{...optional,type:"single",options:[{value:"y\
es",label:{en:"Yes",ar:"نعم"}},{value:"no",label:{en:"No",ar:"لا"}}]}),question("details.exactText","What is the exact approved text?","ما النص الحرفي المعتمد؟",
{state:"conditional",requiredWhen:[{field:"details.includeText",equals:"yes"}]})],specialized={"visual.image":visual,"visual.video":[...visual,question("details.duration","How long\
 should the video be?","ما مدة الفيديو المطلوبة؟",technical)],business:[question("details.businessFacts","Which verified business facts should be used?","ما مع\
لومات النشاط المؤكدة التي يجب استخدامها؟")],cv:[question("details.targetRole","Which role are you targeting?","ما الوظيفة المستهدفة؟"),
question("details.experience","What experience and credentials can you verify?","ما الخبرات والمؤهلات التي يمكنك تأكيدها؟")],powerpoint:[question(
"details.slideCount","How many slides would you prefer?","كم شريحة تفضل؟",{...technical,...optional})],excel:[question("details.dataSource","What actual data is availab\
le?","ما البيانات الفعلية المتاحة؟")],report:[question("details.dataSource","Which verified sources support the report?","ما المصادر المؤكدة التي يستند إلي\
ها التقرير؟")],proposal:[question("details.scope","What scope and terms are confirmed?","ما نطاق العمل والشروط المؤكدة؟")],"business-plan":[question(
"details.businessFacts","What business facts and financial inputs are confirmed?","ما معلومات النشاط والمدخلات المالية المؤكدة؟")],"project-p\
roduct":[question("details.requirements","What requirements are confirmed?","ما المتطلبات المؤكدة؟")]};var record=v=>v!==null&&typeof v=="object"&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));function dataOnly(value){let nodes=0,characters=0,seen=new Set;function walk(v,depth){if(++nodes>2e4||depth>32)return!1;if(typeof v=="string")return characters+=v.length,characters<=
2e6;if(v===null||typeof v=="boolean"||v===void 0)return!0;if(typeof v=="number")return Number.isFinite(v);if(!Array.isArray(v)&&!record(v)||seen.has(v))return!1;seen.add(v);let descriptors=Object.
getOwnPropertyDescriptors(v),valid=Object.getOwnPropertySymbols(v).length===0&&Object.entries(descriptors).every(([k,d])=>!["__proto__","constructor","prototype"].includes(k)&&"val\
ue"in d&&walk(d.value,depth+1));return seen.delete(v),valid}try{return walk(value,0)}catch{return!1}}var t=(copy,lang)=>copy[lang]||copy.en;function normalize(input){return input.normalize("NFKC").toLowerCase().replace(/[ً-ٰٟـ]/g,"").replace(/[إأآٱ]/g,"ا").replace(/ى/g,"\
ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[“”«»"'`]/g,'"').replace(/\s+/g," ").
trim()}function levenshtein(a,b){if(a===b)return 0;let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){let tmp=row[j];
row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1)),prev=tmp}}return row[b.length]}function nearMisses(text,target){let key=target.toLowerCase().replace(/[^\p{L}\p{N}]/gu,
"");if(key.length<4)return[];let tokens=text.split(target).join(" \0 ").split(/[^\p{L}\p{N}\u0000]+/u).filter(Boolean),limit=Math.max(1,Math.floor(key.length*.4)),found=new Set;for(let i=0;i<
tokens.length;i++)for(let n=1;n<=3&&i+n<=tokens.length&&!tokens.slice(i,i+n).includes("\0");n++){let raw=tokens.slice(i,i+n).join(" "),joined=raw.toLowerCase().replace(/\s/g,"");joined===
key||joined[0]!==key[0]||Math.abs(joined.length-key.length)>limit||levenshtein(joined,key)<=limit&&found.add(raw)}return[...found].filter(candidate=>!candidate.toLowerCase().replace(
/\s/g,"").includes(key))}var isFilled=v=>typeof v=="string"?v.trim().length>0:Array.isArray(v)?v.length>0:!1;function validValue2(slot,value,sourceText){if(slot.kind==="single")return typeof value=="string"&&
slot.options?.some(o=>o.value===value)?value:null;if(slot.kind==="multi"){if(!Array.isArray(value)||!value.length)return null;let unique=[...new Set(value)];return unique.every(v=>slot.
options?.some(o=>o.value===v))?unique:null}if(typeof value!="string")return null;let trimmed=value.trim();return!trimmed||trimmed.length>(slot.maxLength??2e3)||slot.kind==="exact"&&
sourceText!==void 0&&!sourceText.includes(trimmed)?null:trimmed}function applyCandidates(session,blueprint,text,candidates){let values={...session.values},plain=normalize(text),bySlot=new Map;for(let c2 of candidates)bySlot.set(c2.slot,[...bySlot.
get(c2.slot)??[],c2]);for(let[slotId,list]of bySlot){let slot=blueprint.slots.find(s=>s.id===slotId);if(!slot||values[slotId]?.source==="user")continue;let accepted=list.filter(c2=>typeof c2.
evidence=="string"&&c2.evidence.trim().length>0&&plain.includes(normalize(c2.evidence))).map(c2=>({c:c2,v:validValue2(slot,c2.value,text)})).filter(x=>x.v!==null&&isFilled(x.v));new Set(
accepted.map(x=>JSON.stringify(x.v))).size===1&&(values[slotId]={value:accepted[0].v,source:"extracted",evidence:accepted[0].c.evidence.trim()})}return{...session,values}}var NONE="none";var LAYERS={understanding:{order:1,name:{en:"Understanding",ar:"الفهم"},scope:{en:"Goal, subject, audience, where it will be used, the facts and references available.",ar:"اله\
دف، والموضوع، والجمهور، وهيتستخدم فين، والمعلومات والمراجع المتاحة."},delivers:{en:"A correct picture of what is wanted, \
built only from confirmed facts.",ar:"صورة صح للمطلوب، مبنية على معلومات مؤكدة بس."},heading:"1 · UNDERSTANDING — what you are given"},intelligence:{
order:2,name:{en:"Intelligence",ar:"التفكير"},scope:{en:"Approach and creative or strategic direction: style, structure, sequence, decision criteria.",ar:"طريقة الحل والاتجا\
ه الإبداعي أو الاستراتيجي: الستايل، والهيكل، والترتيب، ومعايير القرار."},delivers:{en:"The expert decisions the user wou\
ld otherwise have to make alone.",ar:"القرارات اللي كان المستخدم هيضطر ياخدها لوحده، بخبرة متخصص."},heading:"2 · INTELLIGENCE — ho\
w to decide"},control:{order:3,name:{en:"Control",ar:"التحكم"},scope:{en:"Hard limits: verbatim names and text, exclusions, things never to invent, scope boundaries.",ar:"الح\
دود الثابتة: الأسماء والكلام الحرفي، والممنوعات، واللي ممنوع نخترعه، وحدود النطاق."},delivers:{en:"Safety from\
 the classic AI mistakes: wrong names, made-up facts, unwanted elements.",ar:"حماية من أخطاء الـ AI المعروفة: أسماء غلط، ومعلومات متألفة، وعناصر مش مطلوبة."},
heading:"3 · CONTROL — hard limits"},delivery:{order:4,name:{en:"Delivery",ar:"التسليم"},scope:{en:"Output format, target tool, size/duration/length, language, and the ac\
ceptance checks.",ar:"شكل الناتج، والأداة المستهدفة، والمقاس أو المدة أو الطول، واللغة، وفحوصات القبول."},delivers:{
en:"A ready-to-paste result that fits the tool and passes the checks.",ar:"نتيجة جاهزة للنسخ، مناسبة للأداة، وعدّت الفحوصات."},heading:"4 \
· DELIVERY — what to return"}},LAYER_ORDER=["understanding","intelligence","control","delivery"],GLOBAL={understanding:['The brief arrives as JSON. "values" holds slot values; e\
ach has verbatim (copy exactly), assumed (an accepted default, not a user fact) and label (readable meaning).',"Use only the brief. Never invent names, prices, numbers, claims, tes\
timonials, statistics or text.",`A value the user gave (assumed = false) carries "asked": the question it answers. Read the answer in that context; it is the user's own decision an\
d outranks any default or house style.`,"brief.references, when present, describe photos the user uploaded: real facts about what exists (shapes, colours, materials, text on it). U\
se their concrete details and never contradict them."],intelligence:["Make the expert choices the user did not make, guided by the strategy below. Prefer concrete, sensory, specifi\
c wording over generic adjectives.","Every detail the user gave must visibly shape the result: turn it into specific decisions (what is seen, where, in which colour, material, ligh\
t, order or tone), never a passing mention or a vague echo of their words.","Expand each chosen option into 3–5 concrete craft decisions a specialist would write (for visuals: subj\
ect details, composition and framing, camera/lens, light, named colour palette, materials and textures, mood; for text: structure, sections, tone devices, examples, length).",'No f\
iller: words like "stunning", "high quality", "beautiful", "professional", "amazing", "8k" add nothing — replace each with the specific thing that makes it so.'],control:["Verbat\
im values must be copied character for character, including letter case. Never translate, respell or shorten them.","Where a fact is missing, write a clear placeholder in square br\
ackets (e.g. [revenue]) instead of inventing it.","Execution metadata (target tool, aspect ratio, duration, model settings) goes in params/variants, never inside a scene descriptio\
n."],delivery:["Return one JSON object that matches the contract exactly. No markdown fences, no extra keys.","If the contract has coverage: for every value with assumed = false th\
at is not verbatim, coverage[slotId] = a short phrase (3–12 words) copied character for character from prompt that carries that detail. Do not list assumed values."]};function compileSystemPrompt(blueprint,session){
let empty=session?blueprint.slots.filter(s=>session.values[s.id]?.value===NONE).map(s=>s.id):[],parts=[`ROLE: ${blueprint.role}`];for(let layer of LAYER_ORDER){let rules=[...GLOBAL[layer],
...blueprint.strategy[layer]];layer==="control"&&empty.length&&rules.push(`These were deliberately left empty, do not fill them: ${empty.join(", ")}.`),layer==="delivery"&&(rules.push(
"Contract fields: "+blueprint.output.fields.map(f=>`${f.path} (${f.type}${f.required?", required":""}${f.maxLength?`, ≤${f.maxLength} chars`:""}): ${f.description}`).join(" | ")),
rules.push("Tool notes: "+blueprint.tools.map(t2=>`${t2.id} = ${t2.notes}`).join(" | ")),rules.push("Before answering, verify: "+blueprint.gates.map(g=>g.message.en).join("; ")+".")),
parts.push(`
${LAYERS[layer].heading}
`+rules.map(r=>`- ${r}`).join(`
`))}for(let ex of blueprint.examples??[])parts.push(`
EXAMPLE
Good: ${ex.good}
Bad: ${ex.bad}
Why: ${ex.why}`);return parts.join(`
`)}function buildComposeRequest(blueprint,session){if(session.phase!=="confirmed")throw new Error("brief_not_confirmed");let values={};for(let[id,v]of Object.entries(session.values)){
if(v.value===NONE)continue;let slot=blueprint.slots.find(s=>s.id===id);if(!slot)continue;let labelOf=x=>slot.options?.find(o=>o.value===x)?.label.en??x;values[id]={value:v.value,label:slot.
options?Array.isArray(v.value)?v.value.map(labelOf):labelOf(v.value):void 0,asked:v.source==="default"?void 0:slot.question.en,verbatim:slot.kind==="exact",assumed:v.source==="defa\
ult"}}let system=compileSystemPrompt(blueprint,session);return{blueprintId:blueprint.id,blueprintVersion:blueprint.version,language:session.lang,system,brief:{idea:session.idea??"",
...session.references?.length?{references:session.references}:{},values},contract:blueprint.output.fields,tools:blueprint.tools}}function repairInstruction(report2){let failed=report2.
results.filter(r=>!r.ok);return failed.length?`Fix only these problems and return the full JSON again:
`+failed.map(r=>`- ${r.id}: ${r.detail??r.message}`).join(`
`):null}function readPath(output,path){let parts=path.split("."),current=[output];for(let part of parts)current=current.flatMap(node=>!node||typeof node!="object"?[]:part==="*"?Object.values(
node):part in node?[node[part]]:[]);return current}var strings=(output,paths)=>paths.flatMap(p=>readPath(output,p)).flatMap(v=>Array.isArray(v)?v:[v]).filter(v=>typeof v=="string");
function validateContract(blueprint,output){if(!output||typeof output!="object"||Array.isArray(output))return["output must be an object"];let errors=[],check=field=>{let found=readPath(
output,field.path);if(!found.length||found[0]===void 0||found[0]===null||found[0]===""){field.required&&errors.push(`${field.path} is required`);return}let value=found[0],ok=field.
type==="string"?typeof value=="string":field.type==="string[]"?Array.isArray(value)&&value.every(v=>typeof v=="string"):field.type==="record"?typeof value=="object"&&!Array.isArray(
value)&&Object.values(value).every(v=>typeof v=="string"):typeof value=="object"&&!Array.isArray(value);ok||errors.push(`${field.path} must be ${field.type}`),ok&&field.maxLength&&
typeof value=="string"&&value.length>field.maxLength&&errors.push(`${field.path} is too long`)};return blueprint.output.fields.forEach(check),errors}function runGates(blueprint,session,output){
let lang=session.lang,results=[],contractErrors=validateContract(blueprint,output);if(results.push({id:"contract",ok:!contractErrors.length,message:t({en:"Output has every required\
 part",ar:"الناتج فيه كل الأجزاء المطلوبة"},lang),detail:contractErrors.join("; ")||void 0}),contractErrors.length)return report(results);let out=output,slotValue=id=>session.
values[id]?.value;for(let gate of blueprint.gates){let message=t(gate.message,lang);if(gate.kind==="verbatim"){let value=slotValue(gate.slot);if(typeof value!="string"||!value||value===
NONE)continue;let texts=strings(out,gate.fields),missingIn=texts.filter(s=>!s.includes(value)).length,misses=gate.nearMiss?[...new Set(texts.flatMap(s=>nearMisses(s,value)))]:[];results.
push({id:gate.id,ok:texts.length>0&&missingIn===0&&misses.length===0,message,detail:[missingIn?`missing in ${missingIn} field(s)`:"",misses.length?`altered spelling: ${misses.join(
", ")}`:""].filter(Boolean).join("; ")||void 0})}else if(gate.kind==="equals-slot"){let value=slotValue(gate.slot);if(typeof value!="string"||value===NONE)continue;let found=readPath(
out,gate.field)[0];results.push({id:gate.id,ok:found===value,message,detail:found===value?void 0:`expected ${value}, got ${String(found)}`})}else if(gate.kind==="no-leak"){let extra=(gate.
slotTerms??[]).flatMap(id=>{let v=slotValue(id),slot=blueprint.slots.find(s=>s.id===id);return(typeof v=="string"&&v!==NONE?[v,...slot?.options?.filter(o=>o.value===v).map(o=>o.label.
en)??[]]:[]).filter(l=>l.length>2)}),terms=[...gate.terms,...extra],texts=strings(out,gate.fields),leaked=terms.filter(term=>texts.some(s=>s.toLowerCase().includes(term.toLowerCase())));
results.push({id:gate.id,ok:leaked.length===0,message,detail:leaked.length?`found: ${leaked.join(", ")}`:void 0})}else if(gate.kind==="no-invented-text"){if(!gate.whenEmpty.every(id=>{
let v=slotValue(id);return v===void 0||v===NONE||v===""}))continue;let prompt=strings(out,[gate.field]).join(" "),negative=strings(out,[gate.negativeField]).join(" ").toLowerCase(),
quoted=/["“«][^"”»]{2,}["”»]/.test(prompt),ok=!quoted&&/\b(text|letters|typography|words|watermark|logo)\b/.test(negative);results.push({id:gate.id,ok,message,detail:ok?void 0:
quoted?"prompt asks for quoted text":"negative prompt does not exclude text"})}else if(gate.kind==="no-invented-numbers"){let known=new Set,sources=[session.idea??"",...Object.values(
session.values).flatMap(v=>Array.isArray(v.value)?v.value:[v.value])];for(let src of sources)for(let n of numbersIn(src))known.add(n.value);let invented=strings(out,gate.fields).flatMap(
numbersIn).filter(n=>n.significant&&!known.has(n.value)).map(n=>n.raw);results.push({id:gate.id,ok:invented.length===0,message,detail:invented.length?`numbers not from the user: ${[
...new Set(invented)].join(", ")}`:void 0})}else if(gate.kind==="array-length"){let want=Number(slotValue(gate.slot));if(!Number.isFinite(want))continue;let found=readPath(out,gate.
field)[0],n=Array.isArray(found)?found.length:-1;results.push({id:gate.id,ok:n===want,message,detail:n===want?void 0:`expected ${want}, got ${n}`})}else if(gate.kind==="includes-wh\
en"){if(!gate.when.every(c2=>{let v=slotValue(c2.slot),wanted=c2.equals===void 0?[]:Array.isArray(c2.equals)?c2.equals:[c2.equals];return Array.isArray(v)?v.some(x=>wanted.includes(
x)):typeof v=="string"&&wanted.includes(v)}))continue;let text=strings(out,[gate.field]).join(" ").toLowerCase(),hit=gate.anyOf.some(term=>text.includes(term.toLowerCase()));results.
push({id:gate.id,ok:hit,message,detail:hit?void 0:`missing any of: ${gate.anyOf.join(" / ")}`})}else if(gate.kind==="filled-when"){if(!gate.whenAny.some(c2=>{let v=slotValue(c2.slot),
wanted=c2.equals===void 0?[]:Array.isArray(c2.equals)?c2.equals:[c2.equals];return Array.isArray(v)?v.some(x=>wanted.includes(x)):typeof v=="string"&&wanted.includes(v)}))continue;
let found=readPath(out,gate.field)[0],ok=Array.isArray(found)&&found.filter(x=>typeof x=="string"&&x.trim()).length>=2;results.push({id:gate.id,ok,message,detail:ok?void 0:`${gate.
field} must list the steps`})}else if(gate.kind==="coverage"){let given=gate.slots.filter(id=>{let v=session.values[id];return v&&v.source!=="default"&&v.value!==NONE&&(Array.isArray(
v.value)?v.value.length>0:v.value.trim().length>0)});if(!given.length)continue;let flat=x=>x.toLowerCase().replace(/\s+/g," ").trim(),text=flat(strings(out,[gate.field]).join(" ")),
map=readPath(out,gate.map)[0]??{},missing=given.filter(id=>{let phrase=typeof map[id]=="string"?flat(map[id]):"";return phrase.length<3||!text.includes(phrase)});results.push({id:gate.
id,ok:missing.length===0,message,detail:missing.length?`not realised in ${gate.field} (give each a phrase copied from it): ${missing.join(", ")}`:void 0})}else if(gate.kind==="lati\
n-ratio"){let text=strings(out,[gate.field]).join(" ");for(let id of gate.exceptSlots){let v=slotValue(id);typeof v=="string"&&v!==NONE&&(text=text.split(v).join(" "))}let letters=[
...text].filter(c2=>/\p{L}/u.test(c2)),latin=letters.filter(c2=>/\p{Script=Latin}/u.test(c2)).length,ratio=letters.length?latin/letters.length:1;results.push({id:gate.id,ok:ratio>=
gate.min,message,detail:ratio>=gate.min?void 0:`latin ratio ${ratio.toFixed(2)}`})}}return report(results)}function numbersIn(text){let clean=text.replace(/[٠-٩]/g,d=>String("٠١٢\
٣٤٥٦٧٨٩".indexOf(d))).replace(/\d+\s*:\s*\d+/g," ").replace(/\[[^\]]*\]/g," "),out=[];for(let m of clean.matchAll(/([$€£]\s?)?(\d[\d,]*(?:\.\d+)?)\s*(%|٪|[kKmMbB](?![a-zA-Z])|ألف|مليون|مليار)?/g)){
let value=m[2].replace(/,/g,""),num=Number(value),unit=!!(m[1]||m[3]),year=!unit&&/^(19|20)\d\d$/.test(value);out.push({raw:m[0].trim(),value,significant:!year&&(unit||num>=21)})}return out}
function report(results){let passed=results.filter(r=>r.ok).length;return{passed,total:results.length,ok:passed===results.length,results}}function slotCatalogue(bp){return bp.slots.map(s=>{let opts=s.options?` options=[${s.options.map(o=>`${o.value} (${o.label.en})`).join(", ")}]`:"",kind=s.kind==="exact"?"exact (cop\
y verbatim from the text, keep case)":s.kind;return`- ${s.id}: ${kind}; ${LAYERS[s.layer].name.en}; ${s.question.en}${opts}`}).join(`
`)}async function extract(model,bp,text,signal){let system=[`You extract facts for a "${bp.title.en}" brief from the user's message. Arabic or English.`,'Return JSON: {"candidates"\
:[{"slot":"<id>","value":"<value or option id or array of option ids>","evidence":"<exact words copied from the message>"}]}',"Only include a slot when the message clearly states i\
t. evidence must be a verbatim span of the message. Never guess, never infer brand names, never translate exact values.","Slots:",slotCatalogue(bp)].join(`
`),{json,modelId}=await model.complete({system,user:text,maxTokens:800,signal}),list=json?.candidates,served=modelId??model.id;return Array.isArray(list)?{candidates:list.filter(c2=>!!c2&&
typeof c2=="object"&&typeof c2.slot=="string"&&typeof c2.evidence=="string"&&(typeof c2.value=="string"||Array.isArray(c2.value))).slice(0,20).filter(c2=>applyCandidates({id:"x",blueprintId:bp.
id,blueprintVersion:bp.version,lang:"en",phase:"questions",values:{},asked:[],revision:0},bp,text,[c2]).values[c2.slot]),model:served}:{candidates:[],model:served}}async function ideas(model,bp,slotId,typed,context,lang,signal){
let slot=bp.slots.find(s=>s.id===slotId);if(!slot||slot.kind==="single"||slot.kind==="multi"||slot.kind==="exact")return[];let system=[`You suggest short continuations for a field \
in a "${bp.title.en}" brief. Field: ${slot.question.en}`,`Reply in ${lang==="ar"?"Egyptian Arabic":"English"}. Return JSON {"ideas":["…"]} with up to 6 ideas, each 1–5 words, speci\
fic to what the user already wrote, no brand names, no numbers, no repetition of their words.`].join(`
`),{json}=await model.complete({system,user:`Context: ${context.slice(0,600)}
Typed so far: ${typed.slice(0,400)}`,maxTokens:200,signal}),out=json?.ideas;return Array.isArray(out)?out.filter(x=>typeof x=="string"&&x.trim().length>0&&x.length<=60&&!/\d/.test(
x)).slice(0,6):[]}async function sanitizeSession(raw,lookup){if(!raw||typeof raw!="object")return{error:"invalid_session"};let s=raw,bp=typeof s.blueprintId=="string"?await lookup(
s.blueprintId):void 0;if(!bp)return{error:"unknown_blueprint"};if(s.blueprintVersion!==bp.version)return{error:"version_mismatch"};if(s.phase!=="confirmed")return{error:"not_confir\
med"};if(s.lang!=="ar"&&s.lang!=="en")return{error:"invalid_session"};if(!s.values||typeof s.values!="object")return{error:"invalid_session"};let values={};for(let slot of bp.slots){
let v=s.values[slot.id];if(!v)continue;let value=v.value===NONE?NONE:validValue2(slot,v.value);if(value===null)return{error:"invalid_session"};values[slot.id]={value,source:v.source===
"default"?"default":v.source==="extracted"?"extracted":"user"}}if(bp.slots.some(slot=>slot.importance==="critical"&&!values[slot.id]))return{error:"invalid_session"};let idea=typeof s.
idea=="string"?s.idea.slice(0,4e3):"",references=Array.isArray(s.references)?s.references.filter(r=>typeof r=="string"&&r.trim().length>0).slice(0,3).map(r=>r.slice(0,1500)):[];return{
bp,session:{id:String(s.id??"").slice(0,64),blueprintId:bp.id,blueprintVersion:bp.version,lang:s.lang,phase:"confirmed",idea,values,...references.length?{references}:{},asked:[],revision:Number(
s.revision)||0}}}async function compose(model,bp,session,signal){let request=buildComposeRequest(bp,session),user=JSON.stringify({brief:request.brief,tools:request.tools.map(t2=>t2.
id)}),{json,modelId}=await model.complete({system:request.system,user,maxTokens:4e3,signal}),report2=runGates(bp,session,json),attempts=1,fix=repairInstruction(report2);if(fix){let repaired=await model.
complete({system:request.system,user:`${user}

Your previous answer:
${JSON.stringify(json).slice(0,12e3)}

${fix}`,maxTokens:4e3,signal});modelId=repaired.modelId??modelId;let second=runGates(bp,session,repaired.json);attempts=2,second.passed>=report2.passed&&(json=repaired.json,report2=
second)}return{output:json,report:report2,attempts,model:modelId??model.id}}var ModelError=class extends Error{constructor(code){super(code);this.code=code}};async function explainFailure(provider,model,res,key){let body=(await res.text().catch(()=>"")).split(
key).join("[key]").slice(0,300);throw console.warn("model call failed",{provider,model,status:res.status,body}),res.status===401||res.status===403?new ModelError("model_auth_failed"):
res.status===429||res.status===402?new ModelError("model_rate_limited"):new ModelError("model_unavailable")}function createChatJsonModel(cfg){let transport=cfg.transport??fetch,timeoutMs=cfg.
timeoutMs??4e4;return{id:cfg.model,async complete({system,user,maxTokens,signal}){if(!cfg.key)throw new ModelError("model_unavailable");try{return await bounded(async abort=>{let res;
try{res=await transport(cfg.url,{method:"POST",redirect:"error",signal:abort,headers:{Authorization:"Bearer "+cfg.key,"Content-Type":"application/json"},body:JSON.stringify({model:cfg.
model,stream:!1,temperature:.3,max_tokens:maxTokens,response_format:{type:"json_object"},messages:[{role:"system",content:system},{role:"user",content:user}],...cfg.extraBody})})}catch{
throw new ModelError("model_unavailable")}res.ok||await explainFailure("chat",cfg.model,res,cfg.key);let raw=await res.text();if(raw.length>4e5||raw.includes(cfg.key))throw new ModelError(
"model_bad_output");try{let payload=JSON.parse(raw),content=payload?.choices?.[0]?.message?.content;if(typeof content!="string")throw new Error;let json=JSON.parse(content.replace(
/^```(?:json)?\s*|\s*```$/g,"")),usage=payload.usage?{inputTokens:payload.usage.prompt_tokens,outputTokens:payload.usage.completion_tokens}:void 0;return{json,usage}}catch{throw new ModelError(
"model_bad_output")}},timeoutMs,signal)}catch(error){throw error instanceof ModelError?error:error instanceof BoundedError?new ModelError("model_timeout"):new ModelError("model_una\
vailable")}}}}function createGeminiJsonModel(cfg){let transport=cfg.transport??fetch,model=cfg.model||"gemini-3.5-flash-lite",timeoutMs=cfg.timeoutMs??4e4;return{id:model,async complete({
system,user,maxTokens,signal}){if(!cfg.key)throw new ModelError("model_unavailable");try{return await bounded(async abort=>{let res;try{res=await transport(`https://generativelangu\
age.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:"POST",redirect:"error",signal:abort,headers:{"x-goog-api-key":cfg.key,"Content-Type":"applic\
ation/json"},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:"user",parts:[{text:user}]}],generationConfig:{responseMimeType:"application/json",temperature:.3,
maxOutputTokens:maxTokens}})})}catch{throw new ModelError("model_unavailable")}res.ok||await explainFailure("gemini",model,res,cfg.key);let raw=await res.text();if(raw.length>4e5||
raw.includes(cfg.key))throw new ModelError("model_bad_output");try{let payload=JSON.parse(raw),text=payload?.candidates?.[0]?.content?.parts?.map(p=>p.text??"").join("")??"";if(!text)
throw new Error;let json=JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,"")),u=payload?.usageMetadata,usage=u?{inputTokens:u.promptTokenCount,outputTokens:u.candidatesTokenCount}:
void 0;return{json,usage}}catch{throw new ModelError("model_bad_output")}},timeoutMs,signal)}catch(error){throw error instanceof ModelError?error:error instanceof BoundedError?new ModelError(
"model_timeout"):new ModelError("model_unavailable")}}}}var GEMINI_KEY_NAMES=["GEMINI_API_KEY","gemini_Free_API_Key","GEMINI_FREE_API_KEY"];function geminiKey(env2){for(let name of GEMINI_KEY_NAMES){let key=env2(name)?.trim();if(key)return{
key,name}}return{name:"none"}}var MIME=new Set(["image/jpeg","image/png","image/webp"]),validImage=v=>!!v&&typeof v=="object"&&MIME.has(v.mimeType)&&typeof v.data=="string"&&v.data.length>100&&v.data.length<4e6&&
/^[A-Za-z0-9+/=]+$/.test(v.data);async function explain(provider,model,res,key){let body=(await res.text().catch(()=>"")).split(key).join("[key]").slice(0,300);throw console.warn("\
vision call failed",{provider,model,status:res.status,body}),res.status===401||res.status===403?new ModelError("model_auth_failed"):res.status===429?new ModelError("model_rate_limi\
ted"):new ModelError("model_unavailable")}function createGeminiVision(cfg){let transport=cfg.transport??fetch,model=cfg.model||"gemini-3.5-flash-lite";return{id:model,async describe({
prompt,image,signal}){try{return await bounded(async abort=>{let res;try{res=await transport(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:g\
enerateContent`,{method:"POST",redirect:"error",signal:abort,headers:{"x-goog-api-key":cfg.key,"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[
{text:prompt},{inline_data:{mime_type:image.mimeType,data:image.data}}]}],generationConfig:{responseMimeType:"application/json",temperature:.2,maxOutputTokens:1500}})})}catch{throw new ModelError(
"model_unavailable")}res.ok||await explain("gemini",model,res,cfg.key);let raw=await res.text();if(raw.includes(cfg.key))throw new ModelError("model_bad_output");try{let text=JSON.
parse(raw)?.candidates?.[0]?.content?.parts?.map(p=>p.text??"").join("")??"";return{output:JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,"")),modelId:model}}catch{throw new ModelError(
"model_bad_output")}},cfg.timeoutMs??4e4,signal)}catch(error){throw error instanceof ModelError?error:new ModelError(error instanceof BoundedError?"model_timeout":"model_unavailabl\
e")}}}}function createDeepSeekVision(cfg){let transport=cfg.transport??fetch,model=cfg.model||"deepseek-flash";return{id:model,async describe({prompt,image,signal}){try{return await bounded(
async abort=>{let res;try{res=await transport("https://api.deepseek.com/chat/completions",{method:"POST",redirect:"error",signal:abort,headers:{Authorization:"Bearer "+cfg.key,"Con\
tent-Type":"application/json"},body:JSON.stringify({model,stream:!1,temperature:.2,max_tokens:1500,response_format:{type:"json_object"},messages:[{role:"user",content:[{type:"text",
text:prompt},{type:"image_url",image_url:{url:`data:${image.mimeType};base64,${image.data}`}}]}]})})}catch{throw new ModelError("model_unavailable")}if(res.status===402)throw new ModelError(
"model_rate_limited");res.ok||await explain("deepseek",model,res,cfg.key);let raw=await res.text();if(raw.includes(cfg.key))throw new ModelError("model_bad_output");try{let content=JSON.
parse(raw)?.choices?.[0]?.message?.content;return{output:JSON.parse(String(content).replace(/^```(?:json)?\s*|\s*```$/g,"")),modelId:model}}catch{throw new ModelError("model_bad_ou\
tput")}},cfg.timeoutMs??4e4,signal)}catch(error){throw error instanceof ModelError?error:new ModelError(error instanceof BoundedError?"model_timeout":"model_unavailable")}}}}function visionWithBackup(primary,backup){
return backup?{id:`${primary.id}→${backup.id}`,async describe(input){try{return await primary.describe(input)}catch(error){if(!(error instanceof ModelError)||error.code==="model_\
bad_output")throw error;return console.warn("vision failover",{from:primary.id,to:backup.id,code:error.code}),await backup.describe(input)}}}:primary}var visionFromEnv=(env2,transport)=>{
let gem=geminiKey(env2).key,ds=env2("DEEPSEEK_API_KEY"),deepseek=ds?createDeepSeekVision({key:ds,model:env2("ENGINE_VISION_MODEL"),transport}):null;return gem?visionWithBackup(createGeminiVision(
{key:gem,model:env2("GEMINI_VISION_MODEL"),transport}),deepseek):deepseek};async function describeReference(vision2,bp,image,lang,signal){let slots=bp.slots.filter(s=>s.layer!=="de\
livery"&&s.role!=="target-tool").map(s=>`- ${s.id}: ${s.kind==="exact"?"exact text visible in the image, copied character for character":s.kind}; ${s.question.en}${s.options?` opti\
ons=[${s.options.map(o=>o.value).join(", ")}]`:""}`).join(`
`),prompt=[`You look at a reference image for a "${bp.title.en}" brief.`,'Return JSON {"description": "...", "candidates":[{"slot":"<id>","value":"...","evidence":"<exact span copi\
ed from your description>"}]}.',`description: 2–4 factual sentences in ${lang==="ar"?"Egyptian Arabic, keeping any visible text in its original script":"English"}: what is shown,\
 shape, materials, colours, finish, setting, and any visible text quoted exactly.`,"Only fill a slot that the image clearly shows. Never guess brand names; only report text you can\
 read. Slots:",slots].join(`
`),answer=await vision2.describe({prompt,image,signal}),out=answer.output,description=typeof out?.description=="string"?out.description.slice(0,1500):"";if(!description)return{description:"",
candidates:[],model:answer.modelId};let list=Array.isArray(out.candidates)?out.candidates:[],empty={id:"v",blueprintId:bp.id,blueprintVersion:bp.version,lang,phase:"questions",values:{},
asked:[],revision:0},candidates=list.filter(c2=>c2&&typeof c2.slot=="string"&&typeof c2.evidence=="string"&&(typeof c2.value=="string"||Array.isArray(c2.value))).slice(0,12).filter(
c2=>applyCandidates(empty,bp,description,[c2]).values[c2.slot]);return{description,candidates,model:answer.modelId}}var DEFAULT_ORIGINS=["https://lookershub.com","https://www.lookershub.com","http://localhost:3000","http://localhost:5173"],PREVIEW_ORIGIN=/^https:\/\/[a-z0-9-]+-zeuslookershubs-projects\.vercel\.app$/,
ANY_VERCEL_PREVIEW=/^https:\/\/[a-z0-9-]+\.vercel\.app$/,MAX_BODY=6e4,RATE_LIMITS={compose:10,describe:10,intake:30,ideas:60},RATE_WINDOW_SECONDS=60,MAX_IMAGE_BODY=42e5,UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function withinRate(transport,url,serviceKey,owner,op){if(!serviceKey)return!0;try{return await bounded(async signal=>{let res=await transport(url+"/rest/v1/rpc/engine_rate_c\
heck",{method:"POST",signal,redirect:"error",headers:{apikey:serviceKey,Authorization:"Bearer "+serviceKey,"Content-Type":"application/json"},body:JSON.stringify({p_owner:owner,p_op:op,
p_limit:RATE_LIMITS[op]??30,p_window_seconds:RATE_WINDOW_SECONDS})});return res.ok?await res.json()!==!1:!0},3e3)}catch{return!0}}async function saveResult(transport,url,key,token,row){
try{return await bounded(async signal=>{let res=await transport(url+"/rest/v1/lookers_engine_results",{method:"POST",signal,redirect:"error",headers:{apikey:key,Authorization:"Bear\
er "+token,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(row)});if(!res.ok)return null;let rows=await res.json();return Array.isArray(rows)&&
rows[0]&&typeof rows[0].id=="string"?rows[0].id:null},4e3)}catch{return null}}function createEngineHandler(options){let transport=options.transport??fetch,blueprintById=options.blueprints,
route2=options.model&&"for"in options.model?options.model:null,modelFor=op=>route2?route2.for(op):options.model,allowed=new Set([...DEFAULT_ORIGINS,...(options.env("ENGINE_ALLOWED_\
ORIGINS")??"").split(",").map(s=>s.trim()).filter(Boolean)]),previewsOpen=options.env("ENGINE_ALLOW_VERCEL_PREVIEWS")==="1",isAllowed=origin=>allowed.has(origin)||PREVIEW_ORIGIN.test(
origin)||previewsOpen&&ANY_VERCEL_PREVIEW.test(origin),cors=origin=>({...origin&&isAllowed(origin)?{"Access-Control-Allow-Origin":origin}:{},"Access-Control-Allow-Headers":"authori\
zation, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS",Vary:"Origin"}),json=(body,status,origin)=>new Response(JSON.stringify(body),{status,headers:{
...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store"}});return async req=>{let origin=req.headers.get("Origin");if(origin&&!isAllowed(origin))return json({error:"\
origin_not_allowed"},403,null);if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});if(req.method!=="POST")return json({error:"method_not_allowed"},
405,origin);if(Number(req.headers.get("content-length")||0)>MAX_IMAGE_BODY)return json({error:"request_too_large"},413,origin);let token=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1],
url=options.env("SUPABASE_URL"),key=options.env("SUPABASE_ANON_KEY");if(!token)return json({error:"unauthorized"},401,origin);if(!url||!key)return json({error:"server_configuration\
_error"},503,origin);let owner="";try{await bounded(async signal=>{let auth=await transport(url+"/auth/v1/user",{headers:{apikey:key,Authorization:"Bearer "+token},signal,redirect:"\
error"});if(!auth.ok)throw new Error("unauthorized");let user=await auth.json();if(!record(user)||typeof user.id!="string"||user.is_anonymous!==!0)throw new Error("unauthorized");owner=
user.id},8e3,req.signal)}catch{return json({error:"identity_verification_failed"},401,origin)}let body;try{let raw=await req.text();if(raw.length>MAX_IMAGE_BODY)return json({error:"\
request_too_large"},413,origin);if(body=JSON.parse(raw),raw.length>MAX_BODY&&!(record(body)&&body.op==="describe"))return json({error:"request_too_large"},413,origin)}catch{return json(
{error:"invalid_json"},400,origin)}if(!dataOnly(body)||!record(body))return json({error:"invalid_request"},400,origin);let op=typeof body.op=="string"?body.op:"";if(!(op in RATE_LIMITS))
return json({error:"unknown_op"},400,origin);if(!await withinRate(transport,url,options.env("SUPABASE_SERVICE_ROLE_KEY"),owner,op))return new Response(JSON.stringify({error:"rate_l\
imited"}),{status:429,headers:{...cors(origin),"Content-Type":"application/json","Cache-Control":"no-store","Retry-After":String(RATE_WINDOW_SECONDS)}});try{if(body.op==="describe"){
if(!options.vision)return json({error:"vision_unavailable"},503,origin);let bp=typeof body.blueprintId=="string"?await blueprintById(body.blueprintId):void 0;return!bp||!validImage(
body.image)?json({error:"invalid_request"},400,origin):json(await describeReference(options.vision,bp,body.image,body.lang==="ar"?"ar":"en",req.signal),200,origin)}let model=modelFor(
body.op==="intake"?"intake":body.op==="ideas"?"ideas":"compose");if(!model)return json({error:"model_unavailable"},503,origin);if(body.op==="intake"){let bp=typeof body.blueprintId==
"string"?await blueprintById(body.blueprintId):void 0;return!bp||typeof body.text!="string"||body.text.trim().length<2||body.text.length>4e3?json({error:"invalid_request"},400,origin):
json(await extract(model,bp,body.text,req.signal),200,origin)}if(body.op==="ideas"){let bp=typeof body.blueprintId=="string"?await blueprintById(body.blueprintId):void 0;if(!bp||typeof body.
slot!="string"||typeof body.typed!="string"||body.typed.length>400)return json({error:"invalid_request"},400,origin);let lang=body.lang==="ar"?"ar":"en";return json({ideas:await ideas(
model,bp,body.slot,body.typed,typeof body.context=="string"?body.context:"",lang,req.signal)},200,origin)}if(body.op==="compose"){let clean=await sanitizeSession(body.session,blueprintById);
if("error"in clean)return json({error:clean.error},400,origin);let result=await compose(model,clean.bp,clean.session,req.signal),sessionId=typeof body.sessionId=="string"&&UUID.test(
body.sessionId)?body.sessionId:null,resultId=await saveResult(transport,url,key,token,{session_id:sessionId,blueprint_id:clean.bp.id,blueprint_version:clean.bp.version,output:result.
output,report:result.report,gates_passed:result.report.passed,gates_total:result.report.total,attempts:result.attempts,model:result.model});return json({...result,resultId},200,origin)}
return json({error:"unknown_op"},400,origin)}catch(error){let code=error instanceof ModelError?error.code:error instanceof Error&&error.message.startsWith("blueprints_")?"blueprint\
s_unavailable":"engine_failed";return json({error:code},code==="model_timeout"?504:code==="model_rate_limited"?429:code==="model_unavailable"||code==="model_auth_failed"||code==="b\
lueprints_unavailable"?503:502,origin)}}}var DEFAULT_ROUTE={compose:"deepseek",intake:"gemini",ideas:"gemini"},COVERABLE=new Set(["model_rate_limited","model_unavailable","model_timeout"]);function withBackup(primary,backup){
return backup?{id:`${primary.id}→${backup.id}`,async complete(input){try{let result=await primary.complete(input);return{...result,modelId:result.modelId??primary.id}}catch(error){
if(!(error instanceof ModelError)||!COVERABLE.has(error.code))throw error;console.warn("model failover",{from:primary.id,to:backup.id,code:error.code,detail:error.message.slice(0,200)});
let result=await backup.complete(input);return{...result,modelId:result.modelId??backup.id}}}}:primary}function parseRoute(raw){let out={};for(let pair of(raw??"").split(",")){let[
op,provider]=pair.split(":").map(s=>s.trim().toLowerCase());(op==="intake"||op==="ideas"||op==="compose")&&(provider==="gemini"||provider==="deepseek")&&(out[op]=provider)}return out}
function routeFromEnv(env2,transport){let gem=geminiKey(env2),deepseekKey=env2("DEEPSEEK_API_KEY"),gemini=gem.key?createGeminiJsonModel({key:gem.key,model:env2("GEMINI_MODEL")||env2(
"ENGINE_MODEL"),transport}):null,deepseek=deepseekKey?createChatJsonModel({url:"https://api.deepseek.com/chat/completions",key:deepseekKey,model:env2("DEEPSEEK_MODEL")||env2("ENGIN\
E_MODEL")||"deepseek-flash",extraBody:{thinking:{type:"disabled"}},transport}):null,pinned=env2("ENGINE_PROVIDER")?.trim().toLowerCase(),overrides=parseRoute(env2("ENGINE_ROUTE")),
plan={},pick=op=>{let want=pinned==="gemini"||pinned==="deepseek"?pinned:overrides[op]??DEFAULT_ROUTE[op],primary=want==="gemini"?gemini??deepseek:deepseek??gemini,backup=want==="g\
emini"?deepseek:gemini;if(!primary)return plan[op]="none",null;let model=withBackup(primary,backup===primary?null:backup);return plan[op]=model.id,model},models={intake:pick("intak\
e"),ideas:pick("ideas"),compose:pick("compose")};return{for:op=>models[op],plan,geminiKeyName:gem.name}}var c=(en,ar)=>({en,ar});var EXISTING=["existing","edit"],basis=fixed=>({id:"basis",kind:"single",layer:"understanding",importance:fixed?"nice":"important",label:c("Built on","مبني على"),question:c(
"Is this something new, or does it build on something you already have?","ده حاجة جديدة، ولا مربوط بحاجة عندك فعلاً؟"),why:c("If something alread\
y exists, the result has to match it — so I ask what stays and use your reference.","لو في حاجة موجودة، النتيجة لازم تمشي معاها، فهسألك إيه اللي يفضل وهستخدم المرجع بتاعك."),
example:c("It is for my existing brand — same colours and logo.","لبراندي الموجود، نفس الألوان واللوجو."),options:[{value:"new",label:c("Something\
 new · free direction","حاجة جديدة · اتجاه حر"),keywords:["from scratch","brand new","new idea","من الصفر","فكرة جديدة","حاجة جديدة"]},{value:"\
existing",label:c("Linked to something I have · brand, product, past design, a series","مربوط بحاجة عندي · براند، منتج، تصميم قديم، سلسلة"),
keywords:["my brand","our brand","brand identity","same style","same colors","same colours","series","matching","براندي","هويتي","الهوية بتاعتي","نفس الستايل",
"نفس الألوان","نفس الالوان","سلسلة","يمشي مع","زي اللي قبل"]},{value:"edit",label:c("Edit or redo something I already have","تعديل أو إعادة \
لحاجة عندي"),keywords:["edit","redo","remake","update my","change my","fix my","عدّل","عدل","تعديل","اعدل","أعدل","أغير","اغير","أظبط","اظب\
ط"]}],defaults:[fixed?{value:"edit",reason:c("You are editing a photo you have.","انت بتعدّل صورة عندك.")}:{value:"new",reason:c("Treated as a new piece with free\
 direction.","اعتبرناها حاجة جديدة باتجاه حر.")}]}),keep={id:"keep",kind:"longtext",layer:"control",importance:"important",maxLength:600,when:[{slot:"basi\
s",equals:EXISTING}],label:c("Must stay the same","لازم يفضل زي ما هو"),question:c("What must stay exactly as it is? (logo, colours, font, the character, the product \
look…)","إيه اللي لازم يفضل زي ما هو بالظبط؟ (اللوجو، الألوان، الخط، الشخصية، شكل المنتج…)"),why:c("AI tools re\
draw everything unless told what to keep. Each item becomes a hard rule.","أدوات الـ AI بتعيد رسم كل حاجة لو محدش قالها تحافظ على إيه. كل حاجة هتكتبها هتبقى قاعدة ثابتة."),
example:c("The gold logo, the dark green colour and the round bottle shape.","اللوجو الدهبي، واللون الأخضر الغامق، وشكل الزجاجة المدوّر."),
vocabulary:{en:["logo","brand colours","font","character","product shape","label","layout","face","packaging"],ar:["اللوجو","ألوان البراند","الخط","الشخصية",
"شكل المنتج","الليبل","التوزيع","الوش","العبوة"]}},change={id:"change",kind:"longtext",layer:"intelligence",importance:"important",maxLength:600,when:[
{slot:"basis",equals:"edit"}],label:c("What changes","التغيير المطلوب"),question:c("What exactly should change?","إيه بالظبط اللي يتغيّر؟"),why:c(
"Only this changes — everything else stays.","ده بس اللي هيتغيّر، والباقي يفضل زي ما هو."),example:c("Swap the background for a sunny beach and m\
ake the colours warmer.","غيّر الخلفية لشط مشمس وخلّي الألوان أدفى."),vocabulary:{en:["background","colours","lighting","text","season","add an el\
ement","remove an element","style"],ar:["الخلفية","الألوان","الإضاءة","الكلام","الموسم","إضافة عنصر","شيل عنصر","الستايل"]}},
referenceFor=(slot,fixed)=>({...slot,importance:fixed?"important":"nice",raise:fixed?void 0:{when:[{slot:"basis",equals:EXISTING}],importance:"important"},question:c("Do you have a\
 photo to upload? If it builds on something you have, upload that thing itself (logo, product, past design).","معاك صورة ترفعها؟ لو مربوط بحاجة عندك، ارفع الحاجة نفسها (اللوجو، الم\
نتج، التصميم القديم)."),why:c("With the real thing in front of it, the tool copies what exists instead of guessing. I read the photo and use what I see.","لما الأد\
اة تشوف الحاجة الحقيقية بتنقلها بدل ما تخمّن. وأنا هقرا الصورة وأستخدم اللي فيها في البرومبت."),example:c(
"One clear photo on a plain background beats several busy ones.","صورة واحدة واضحة على خلفية سادة أحسن من كذا صورة زحمة."),options:[{value:"\
yes",label:c("Yes — I will upload it now","أيوه، هرفعها دلوقتي"),keywords:["reference","my photo","عندي صورة","معايا صورة","مرجع"]},{value:"\
no",label:c("No, I will describe it in words","لأ، هوصفه بالكلام")}],defaults:fixed?[]:[{when:[{slot:"basis",equals:"new"}],value:"no",reason:c("New piece — describe\
d in words. Upload one any time with the photo button.","حاجة جديدة، هنوصفها بالكلام. وتقدر ترفع صورة في أي وقت من زرار الصورة.")}]}),
REF_NOTES={universal:"Reference: upload the image in the same message as the prompt and say how to use it (style only / keep this subject / edit this image).",midjourney:"Reference\
: style inspiration = drag the image into the prompt bar and choose Style Reference (--sref); the existing product/character/logo = Omni Reference (--oref) with --ow 100–400; edit \
= open the image in the Editor and repaint only the area to change.",chatgpt:'Reference: attach the image with the + button in the same message; start the prompt with "Using the at\
tached image as…"; for edits say "keep everything else exactly the same".',flux:"Reference: use Flux Kontext for anything built on an existing image — upload it and describe only\
 the change; plain Flux takes it as an image prompt for style.",firefly:"Reference: Style reference for look and colours, Composition reference for layout; edits go through Generat\
ive Fill on the uploaded image.",ideogram:"Reference: upload under Remix (keeps layout/subject, set image weight high to stay close) or as a Style reference.",gemini:'Reference: up\
load the image in the Gemini app with the prompt; for edits say "edit this image: change only …, keep everything else".',veo:"Reference: use Ingredients/Frames to video — upload \
the image as the first frame or as an ingredient so the subject stays identical.",sora:"Reference: upload the image to start the video from it (image-to-video); describe only motio\
n and camera.",kling:"Reference: Image to Video — upload the image as the start frame; Elements keeps a product/character consistent.",runway:"Reference: upload the image as the \
first frame (Gen-4 image to video) or as a References image to keep the subject identical.",hailuo:"Reference: Image to Video — upload the image as the first frame; describe only m\
otion."},withRefNotes=tools=>tools.map(t2=>({...t2,notes:REF_NOTES[t2.id]?`${t2.notes} ${REF_NOTES[t2.id]}`:t2.notes})),RULES={understanding:["basis says what this builds on: new =\
 free direction; existing = it must belong to something the user already has (their brand, product, a past design, a series); edit = a change to an image the user has.","brief.refe\
rences are what we read in the photos the user uploaded: treat them as ground truth for how the existing thing looks (shape, colours, materials, label, character) and reuse those c\
oncrete details."],intelligence:["basis = existing: create only what is new (the subject of this piece) inside the existing identity; reuse its colours, type, shapes and look descr\
ibed in keep and references instead of inventing a new style.",'basis = edit: write the prompt as an edit of the provided original: open with "Using the provided image as the base"\
, state change as the only change, then "keep everything else exactly the same".'],control:['Every item in keep is a hard rule: restate it explicitly in the prompt as something to \
preserve exactly (e.g. "keep the exact logo, colours and bottle shape from the reference").'],delivery:["referenceGuide: when reference = yes or basis is existing/edit, 3–5 short n\
umbered steps in the user language (Egyptian Arabic for ar): which image to upload and how clear it should be, where to attach it in the chosen tool (or the two main tools when uni\
versal) following the tool notes, which reference mode to pick (style inspiration for new, keep the subject for existing, edit for edit), and the opening line the prompt already us\
es for it. Otherwise return [].",'When reference = yes or basis is existing/edit, every variant opens with how to use the reference (e.g. "Using the attached image as the product r\
eference, …").']};function withBasis(bp){let ref=bp.slots.find(s=>s.id==="reference");if(!ref||bp.slots.some(s=>s.id==="basis"))return bp;let fixed=bp.id==="photo-retouch",slots=bp.
slots.filter(s=>s.id!=="reference"),first=slots.findIndex(s=>s.importance==="critical"),insertAt=first>=0?first+1:0,added=fixed?[basis("edit"),keep]:[basis(),keep,change];slots.splice(
insertAt,0,...added),slots.push(referenceFor(ref,fixed));let gates=[...bp.gates,{id:"reference-guide",kind:"filled-when",field:"referenceGuide",whenAny:[{slot:"reference",equals:"y\
es"},{slot:"basis",equals:EXISTING}],message:c("Steps to attach your reference in the tool","خطوات تحط المرجع في الأداة")}];return{...bp,version:bp.version+1,
questionBudget:bp.questionBudget+1,slots,output:{...bp.output,fields:[...bp.output.fields,{path:"referenceGuide",type:"string[]",required:!1,description:"How to attach the referenc\
e in the tool, user language; [] when none."}]},gates,tools:withRefNotes(bp.tools),strategy:{understanding:[...bp.strategy.understanding,...RULES.understanding],intelligence:[...bp.
strategy.intelligence,...RULES.intelligence],control:[...bp.strategy.control,...RULES.control],delivery:[...bp.strategy.delivery,...RULES.delivery]}}}function withCoverage(bp){if(!bp.
output.fields.find(f=>f.path==="prompt"&&f.type==="string")||bp.gates.some(g=>g.kind==="coverage"))return bp;let slots=bp.slots.filter(s=>s.kind!=="exact"&&!s.role&&s.layer!=="deli\
very"&&!["reference","basis","avoid","tool"].includes(s.id)).map(s=>s.id);return slots.length?{...bp,output:{...bp.output,fields:[...bp.output.fields,{path:"coverage",type:"record",
required:!1,description:"slot id → the exact phrase copied from prompt that realises what the user gave for it (only user-given slots)."}]},gates:[...bp.gates,{id:"coverage",kind:"\
coverage",slots,field:"prompt",map:"coverage",message:c("Every detail you gave is in the prompt","كل تفصيلة قلتها موجودة في البرومبت")}]}:bp}var usable=bp=>!!bp&&typeof bp=="object"&&typeof bp.id=="string"&&typeof bp.role=="string"&&!!bp.strategy&&Array.isArray(bp.gates);function privateBlueprints(supabaseUrl,serviceKey,transport=fetch,ttlMs=5*
6e4,now=()=>Date.now()){let cache=null,inflight=null,load=async()=>{if(!supabaseUrl||!serviceKey)throw new Error("blueprints_unconfigured");return await bounded(async signal=>{let res=await transport(
`${supabaseUrl}/rest/v1/lookers_engine_blueprints?id=eq.current&select=payload,count`,{headers:{apikey:serviceKey,Authorization:"Bearer "+serviceKey,Accept:"application/json"},signal,
redirect:"error"});if(!res.ok)throw new Error("blueprints_unavailable");let rows=await res.json(),row=Array.isArray(rows)?rows[0]:void 0;if(!row||!Array.isArray(row.payload)||row.payload.
length===0)throw new Error("blueprints_missing");if(!row.payload.every(usable))throw new Error("blueprints_malformed");let list=row.payload.map(withBasis).map(withCoverage);return new Map(
list.map(bp=>[bp.id,bp]))},8e3)};return async id=>{if(cache&&now()-cache.at<ttlMs)return cache.byId.get(id);inflight||(inflight=load().then(byId=>(cache={at:now(),byId},byId)).finally(
()=>{inflight=null}));try{return(await inflight).get(id)}catch(error){if(cache)return cache.byId.get(id);throw error}}}var env=name=>Deno.env.get(name),blueprints=privateBlueprints(env("SUPABASE_URL")??"",env("SUPABASE_SERVICE_ROLE_KEY")??""),route=routeFromEnv(env),vision=visionFromEnv(env);console.
log("engine route",{...route.plan,describe:vision?.id??"none",geminiKeyName:route.geminiKeyName});Deno.serve(createEngineHandler({env,model:route,vision,blueprints}));
