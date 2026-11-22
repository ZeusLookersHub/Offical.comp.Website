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
sourceText!==void 0&&!sourceText.includes(trimmed)?null:trimmed}function applyCandidates(session,blueprint,text,candidates){let values={...session.values},plain=normalize(text),bySlot=new Map;for(let c of candidates)bySlot.set(c.slot,[...bySlot.
get(c.slot)??[],c]);for(let[slotId,list]of bySlot){let slot=blueprint.slots.find(s=>s.id===slotId);if(!slot||values[slotId]?.source==="user")continue;let accepted=list.filter(c=>typeof c.
evidence=="string"&&c.evidence.trim().length>0&&plain.includes(normalize(c.evidence))).map(c=>({c,v:validValue2(slot,c.value,text)})).filter(x=>x.v!==null&&isFilled(x.v));new Set(accepted.
map(x=>JSON.stringify(x.v))).size===1&&(values[slotId]={value:accepted[0].v,source:"extracted",evidence:accepted[0].c.evidence.trim()})}return{...session,values}}var NONE="none";var LAYERS={understanding:{order:1,name:{en:"Understanding",ar:"الفهم"},scope:{en:"Goal, subject, audience, where it will be used, the facts and references available.",ar:"اله\
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
timonials, statistics or text."],intelligence:["Make the expert choices the user did not make, guided by the strategy below. Prefer concrete, sensory, specific wording over generic\
 adjectives."],control:["Verbatim values must be copied character for character, including letter case. Never translate, respell or shorten them.","Where a fact is missing, write a\
 clear placeholder in square brackets (e.g. [revenue]) instead of inventing it.","Execution metadata (target tool, aspect ratio, duration, model settings) goes in params/variants, \
never inside a scene description."],delivery:["Return one JSON object that matches the contract exactly. No markdown fences, no extra keys."]};function compileSystemPrompt(blueprint,session){
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
options?Array.isArray(v.value)?v.value.map(labelOf):labelOf(v.value):void 0,verbatim:slot.kind==="exact",assumed:v.source==="default"}}let system=compileSystemPrompt(blueprint,session);
return{blueprintId:blueprint.id,blueprintVersion:blueprint.version,language:session.lang,system,brief:{idea:session.idea??"",values},contract:blueprint.output.fields,tools:blueprint.
tools}}function repairInstruction(report2){let failed=report2.results.filter(r=>!r.ok);return failed.length?`Fix only these problems and return the full JSON again:
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
en"){if(!gate.when.every(c=>{let v=slotValue(c.slot),wanted=c.equals===void 0?[]:Array.isArray(c.equals)?c.equals:[c.equals];return Array.isArray(v)?v.some(x=>wanted.includes(x)):typeof v==
"string"&&wanted.includes(v)}))continue;let text=strings(out,[gate.field]).join(" ").toLowerCase(),hit=gate.anyOf.some(term=>text.includes(term.toLowerCase()));results.push({id:gate.
id,ok:hit,message,detail:hit?void 0:`missing any of: ${gate.anyOf.join(" / ")}`})}else if(gate.kind==="latin-ratio"){let text=strings(out,[gate.field]).join(" ");for(let id of gate.
exceptSlots){let v=slotValue(id);typeof v=="string"&&v!==NONE&&(text=text.split(v).join(" "))}let letters=[...text].filter(c=>/\p{L}/u.test(c)),latin=letters.filter(c=>/\p{Script=Latin}/u.
test(c)).length,ratio=letters.length?latin/letters.length:1;results.push({id:gate.id,ok:ratio>=gate.min,message,detail:ratio>=gate.min?void 0:`latin ratio ${ratio.toFixed(2)}`})}}return report(
results)}function numbersIn(text){let clean=text.replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/\d+\s*:\s*\d+/g," ").replace(/\[[^\]]*\]/g," "),out=[];for(let m of clean.
matchAll(/([$€£]\s?)?(\d[\d,]*(?:\.\d+)?)\s*(%|٪|[kKmMbB](?![a-zA-Z])|ألف|مليون|مليار)?/g)){let value=m[2].replace(/,/g,""),num=Number(value),unit=!!(m[1]||m[3]),year=!unit&&
/^(19|20)\d\d$/.test(value);out.push({raw:m[0].trim(),value,significant:!year&&(unit||num>=21)})}return out}function report(results){let passed=results.filter(r=>r.ok).length;return{
passed,total:results.length,ok:passed===results.length,results}}function slotCatalogue(bp){return bp.slots.map(s=>{let opts=s.options?` options=[${s.options.map(o=>`${o.value} (${o.label.en})`).join(", ")}]`:"",kind=s.kind==="exact"?"exact (cop\
y verbatim from the text, keep case)":s.kind;return`- ${s.id}: ${kind}; ${LAYERS[s.layer].name.en}; ${s.question.en}${opts}`}).join(`
`)}async function extract(model,bp,text,signal){let system=[`You extract facts for a "${bp.title.en}" brief from the user's message. Arabic or English.`,'Return JSON: {"candidates"\
:[{"slot":"<id>","value":"<value or option id or array of option ids>","evidence":"<exact words copied from the message>"}]}',"Only include a slot when the message clearly states i\
t. evidence must be a verbatim span of the message. Never guess, never infer brand names, never translate exact values.","Slots:",slotCatalogue(bp)].join(`
`),{json,modelId}=await model.complete({system,user:text,maxTokens:800,signal}),list=json?.candidates,served=modelId??model.id;return Array.isArray(list)?{candidates:list.filter(c=>!!c&&
typeof c=="object"&&typeof c.slot=="string"&&typeof c.evidence=="string"&&(typeof c.value=="string"||Array.isArray(c.value))).slice(0,20).filter(c=>applyCandidates({id:"x",blueprintId:bp.
id,blueprintVersion:bp.version,lang:"en",phase:"questions",values:{},asked:[],revision:0},bp,text,[c]).values[c.slot]),model:served}:{candidates:[],model:served}}async function ideas(model,bp,slotId,typed,context,lang,signal){
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
idea=="string"?s.idea.slice(0,4e3):"";return{bp,session:{id:String(s.id??"").slice(0,64),blueprintId:bp.id,blueprintVersion:bp.version,lang:s.lang,phase:"confirmed",idea,values,asked:[],
revision:Number(s.revision)||0}}}async function compose(model,bp,session,signal){let request=buildComposeRequest(bp,session),user=JSON.stringify({brief:request.brief,tools:request.
tools.map(t2=>t2.id)}),{json,modelId}=await model.complete({system:request.system,user,maxTokens:4e3,signal}),report2=runGates(bp,session,json),attempts=1,fix=repairInstruction(report2);
if(fix){let repaired=await model.complete({system:request.system,user:`${user}

Your previous answer:
${JSON.stringify(json).slice(0,12e3)}

${fix}`,maxTokens:4e3,signal});modelId=repaired.modelId??modelId;let second=runGates(bp,session,repaired.json);attempts=2,second.passed>=report2.passed&&(json=repaired.json,report2=
second)}return{output:json,report:report2,attempts,model:modelId??model.id}}var ModelError=class extends Error{constructor(code){super(code);this.code=code}};function createChatJsonModel(cfg){let transport=cfg.transport??fetch,timeoutMs=cfg.timeoutMs??4e4;
return{id:cfg.model,async complete({system,user,maxTokens,signal}){if(!cfg.key)throw new ModelError("model_unavailable");try{return await bounded(async abort=>{let res;try{res=await transport(
cfg.url,{method:"POST",redirect:"error",signal:abort,headers:{Authorization:"Bearer "+cfg.key,"Content-Type":"application/json"},body:JSON.stringify({model:cfg.model,stream:!1,temperature:.3,
max_tokens:maxTokens,response_format:{type:"json_object"},messages:[{role:"system",content:system},{role:"user",content:user}],...cfg.extraBody})})}catch{throw new ModelError("mode\
l_unavailable")}if(res.status===401||res.status===403)throw new ModelError("model_auth_failed");if(res.status===429||res.status===402)throw new ModelError("model_rate_limited");if(!res.
ok)throw new ModelError("model_unavailable");let raw=await res.text();if(raw.length>4e5||raw.includes(cfg.key))throw new ModelError("model_bad_output");try{let payload=JSON.parse(raw),
content=payload?.choices?.[0]?.message?.content;if(typeof content!="string")throw new Error;let json=JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g,"")),usage=payload.usage?
{inputTokens:payload.usage.prompt_tokens,outputTokens:payload.usage.completion_tokens}:void 0;return{json,usage}}catch{throw new ModelError("model_bad_output")}},timeoutMs,signal)}catch(error){
throw error instanceof ModelError?error:error instanceof BoundedError?new ModelError("model_timeout"):new ModelError("model_unavailable")}}}}function createGeminiJsonModel(cfg){let transport=cfg.
transport??fetch,model=cfg.model||"gemini-3.8-flash",timeoutMs=cfg.timeoutMs??4e4;return{id:model,async complete({system,user,maxTokens,signal}){if(!cfg.key)throw new ModelError("m\
odel_unavailable");try{return await bounded(async abort=>{let res;try{res=await transport(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:gene\
rateContent`,{method:"POST",redirect:"error",signal:abort,headers:{"x-goog-api-key":cfg.key,"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},
contents:[{role:"user",parts:[{text:user}]}],generationConfig:{responseMimeType:"application/json",temperature:.3,maxOutputTokens:maxTokens}})})}catch{throw new ModelError("model_u\
navailable")}if(res.status===401||res.status===403)throw new ModelError("model_auth_failed");if(res.status===429)throw new ModelError("model_rate_limited");if(!res.ok)throw new ModelError(
"model_unavailable");let raw=await res.text();if(raw.length>4e5||raw.includes(cfg.key))throw new ModelError("model_bad_output");try{let payload=JSON.parse(raw),text=payload?.candidates?.[0]?.
content?.parts?.map(p=>p.text??"").join("")??"";if(!text)throw new Error;let json=JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,"")),u=payload?.usageMetadata,usage=u?{inputTokens:u.
promptTokenCount,outputTokens:u.candidatesTokenCount}:void 0;return{json,usage}}catch{throw new ModelError("model_bad_output")}},timeoutMs,signal)}catch(error){throw error instanceof
ModelError?error:error instanceof BoundedError?new ModelError("model_timeout"):new ModelError("model_unavailable")}}}}var GEMINI_KEY_NAMES=["GEMINI_API_KEY","gemini_Free_API_Key","GEMINI_FREE_API_KEY"];function geminiKey(env2){for(let name of GEMINI_KEY_NAMES){let key=env2(name)?.trim();if(key)return{
key,name}}return{name:"none"}}var MIME=new Set(["image/jpeg","image/png","image/webp"]),validImage=v=>!!v&&typeof v=="object"&&MIME.has(v.mimeType)&&typeof v.data=="string"&&v.data.length>100&&v.data.length<4e6&&
/^[A-Za-z0-9+/=]+$/.test(v.data);function createGeminiVision(cfg){let transport=cfg.transport??fetch,model=cfg.model||"gemini-3.8-flash-lite";return{id:model,async describe({prompt,
image,signal}){try{return await bounded(async abort=>{let res;try{res=await transport(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generate\
Content`,{method:"POST",redirect:"error",signal:abort,headers:{"x-goog-api-key":cfg.key,"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt},
{inline_data:{mime_type:image.mimeType,data:image.data}}]}],generationConfig:{responseMimeType:"application/json",temperature:.2,maxOutputTokens:1500}})})}catch{throw new ModelError(
"model_unavailable")}if(res.status===401||res.status===403)throw new ModelError("model_auth_failed");if(res.status===429)throw new ModelError("model_rate_limited");if(!res.ok)throw new ModelError(
"model_unavailable");let raw=await res.text();if(raw.includes(cfg.key))throw new ModelError("model_bad_output");try{let text=JSON.parse(raw)?.candidates?.[0]?.content?.parts?.map(p=>p.
text??"").join("")??"";return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,""))}catch{throw new ModelError("model_bad_output")}},cfg.timeoutMs??4e4,signal)}catch(error){throw error instanceof
ModelError?error:new ModelError(error instanceof BoundedError?"model_timeout":"model_unavailable")}}}}function createDeepSeekVision(cfg){let transport=cfg.transport??fetch,model=cfg.
model||"deepseek-flash";return{id:model,async describe({prompt,image,signal}){try{return await bounded(async abort=>{let res;try{res=await transport("https://api.deepseek.com/chat/\
completions",{method:"POST",redirect:"error",signal:abort,headers:{Authorization:"Bearer "+cfg.key,"Content-Type":"application/json"},body:JSON.stringify({model,stream:!1,temperature:.2,
max_tokens:1500,response_format:{type:"json_object"},messages:[{role:"user",content:[{type:"text",text:prompt},{type:"image_url",image_url:{url:`data:${image.mimeType};base64,${image.
data}`}}]}]})})}catch{throw new ModelError("model_unavailable")}if(res.status===401||res.status===403)throw new ModelError("model_auth_failed");if(res.status===429||res.status===402)
throw new ModelError("model_rate_limited");if(!res.ok)throw new ModelError("model_unavailable");let raw=await res.text();if(raw.includes(cfg.key))throw new ModelError("model_bad_ou\
tput");try{let content=JSON.parse(raw)?.choices?.[0]?.message?.content;return JSON.parse(String(content).replace(/^```(?:json)?\s*|\s*```$/g,""))}catch{throw new ModelError("model_\
bad_output")}},cfg.timeoutMs??4e4,signal)}catch(error){throw error instanceof ModelError?error:new ModelError(error instanceof BoundedError?"model_timeout":"model_unavailable")}}}}
var visionFromEnv=(env2,transport)=>geminiKey(env2).key?createGeminiVision({key:geminiKey(env2).key,model:env2("GEMINI_VISION_MODEL"),transport}):env2("DEEPSEEK_API_KEY")?createDeepSeekVision(
{key:env2("DEEPSEEK_API_KEY"),model:env2("ENGINE_VISION_MODEL"),transport}):null;async function describeReference(vision2,bp,image,lang,signal){let slots=bp.slots.filter(s=>s.layer!==
"delivery"&&s.role!=="target-tool").map(s=>`- ${s.id}: ${s.kind==="exact"?"exact text visible in the image, copied character for character":s.kind}; ${s.question.en}${s.options?` o\
ptions=[${s.options.map(o=>o.value).join(", ")}]`:""}`).join(`
`),prompt=[`You look at a reference image for a "${bp.title.en}" brief.`,'Return JSON {"description": "...", "candidates":[{"slot":"<id>","value":"...","evidence":"<exact span copi\
ed from your description>"}]}.',`description: 2–4 factual sentences in ${lang==="ar"?"Egyptian Arabic, keeping any visible text in its original script":"English"}: what is shown,\
 shape, materials, colours, finish, setting, and any visible text quoted exactly.`,"Only fill a slot that the image clearly shows. Never guess brand names; only report text you can\
 read. Slots:",slots].join(`
`),out=await vision2.describe({prompt,image,signal}),description=typeof out?.description=="string"?out.description.slice(0,1500):"";if(!description)return{description:"",candidates:[],
model:vision2.id};let list=Array.isArray(out.candidates)?out.candidates:[],empty={id:"v",blueprintId:bp.id,blueprintVersion:bp.version,lang,phase:"questions",values:{},asked:[],revision:0},
candidates=list.filter(c=>c&&typeof c.slot=="string"&&typeof c.evidence=="string"&&(typeof c.value=="string"||Array.isArray(c.value))).slice(0,12).filter(c=>applyCandidates(empty,bp,
description,[c]).values[c.slot]);return{description,candidates,model:vision2.id}}var DEFAULT_ORIGINS=["https://lookershub.com","https://www.lookershub.com","http://localhost:3000","http://localhost:5173"],PREVIEW_ORIGIN=/^https:\/\/[a-z0-9-]+-zeuslookershubs-projects\.vercel\.app$/,
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
if(!(error instanceof ModelError)||!COVERABLE.has(error.code))throw error;let result=await backup.complete(input);return{...result,modelId:result.modelId??backup.id}}}}:primary}function parseRoute(raw){
let out={};for(let pair of(raw??"").split(",")){let[op,provider]=pair.split(":").map(s=>s.trim().toLowerCase());(op==="intake"||op==="ideas"||op==="compose")&&(provider==="gemini"||
provider==="deepseek")&&(out[op]=provider)}return out}function routeFromEnv(env2,transport){let gem=geminiKey(env2),deepseekKey=env2("DEEPSEEK_API_KEY"),gemini=gem.key?createGeminiJsonModel(
{key:gem.key,model:env2("GEMINI_MODEL")||env2("ENGINE_MODEL"),transport}):null,deepseek=deepseekKey?createChatJsonModel({url:"https://api.deepseek.com/chat/completions",key:deepseekKey,
model:env2("DEEPSEEK_MODEL")||env2("ENGINE_MODEL")||"deepseek-flash",extraBody:{thinking:{type:"disabled"}},transport}):null,pinned=env2("ENGINE_PROVIDER")?.trim().toLowerCase(),overrides=parseRoute(
env2("ENGINE_ROUTE")),plan={},pick=op=>{let want=pinned==="gemini"||pinned==="deepseek"?pinned:overrides[op]??DEFAULT_ROUTE[op],primary=want==="gemini"?gemini??deepseek:deepseek??gemini,
backup=want==="gemini"?deepseek:gemini;if(!primary)return plan[op]="none",null;let model=withBackup(primary,backup===primary?null:backup);return plan[op]=model.id,model},models={intake:pick(
"intake"),ideas:pick("ideas"),compose:pick("compose")};return{for:op=>models[op],plan,geminiKeyName:gem.name}}var usable=bp=>!!bp&&typeof bp=="object"&&typeof bp.id=="string"&&typeof bp.role=="string"&&!!bp.strategy&&Array.isArray(bp.gates);function privateBlueprints(supabaseUrl,serviceKey,transport=fetch,ttlMs=5*
6e4,now=()=>Date.now()){let cache=null,inflight=null,load=async()=>{if(!supabaseUrl||!serviceKey)throw new Error("blueprints_unconfigured");return await bounded(async signal=>{let res=await transport(
`${supabaseUrl}/rest/v1/lookers_engine_blueprints?id=eq.current&select=payload,count`,{headers:{apikey:serviceKey,Authorization:"Bearer "+serviceKey,Accept:"application/json"},signal,
redirect:"error"});if(!res.ok)throw new Error("blueprints_unavailable");let rows=await res.json(),row=Array.isArray(rows)?rows[0]:void 0;if(!row||!Array.isArray(row.payload)||row.payload.
length===0)throw new Error("blueprints_missing");if(!row.payload.every(usable))throw new Error("blueprints_malformed");let list=row.payload;return new Map(list.map(bp=>[bp.id,bp]))},
8e3)};return async id=>{if(cache&&now()-cache.at<ttlMs)return cache.byId.get(id);inflight||(inflight=load().then(byId=>(cache={at:now(),byId},byId)).finally(()=>{inflight=null}));try{
return(await inflight).get(id)}catch(error){if(cache)return cache.byId.get(id);throw error}}}var env=name=>Deno.env.get(name),blueprints=privateBlueprints(env("SUPABASE_URL")??"",env("SUPABASE_SERVICE_ROLE_KEY")??""),route=routeFromEnv(env),vision=visionFromEnv(env);console.
log("engine route",{...route.plan,describe:vision?.id??"none",geminiKeyName:route.geminiKeyName});Deno.serve(createEngineHandler({env,model:route,vision,blueprints}));
