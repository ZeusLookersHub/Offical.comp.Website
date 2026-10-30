"""Build review candidates/HTML index from the proposed registry; no app runtime changes."""
from pathlib import Path
import argparse,json,html
parser=argparse.ArgumentParser();parser.add_argument('--out',required=True);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];out=root/args.out;out.mkdir(parents=True,exist_ok=True)
d=json.loads((root/'docs/workflow-architecture-v2/architecture.json').read_text());repos=json.loads((root/'docs/workflow-architecture-v2/repository-evidence.json').read_text())['repositories'];tasks={t['id']:t for t in d['topics']};jobs=[]
def add(kind,name,data):
 folder=out/name;folder.mkdir(exist_ok=True);target=folder/(name+'.html');data['meta']['output']=str(target.relative_to(root));data['meta'].update(locale='ar',quality_profile='showcase');candidate=folder/'candidate.json';candidate.write_text(json.dumps(data,ensure_ascii=False,indent=2));jobs.append({'type':kind,'name':name,'candidate':str(candidate.relative_to(root)),'output':str(target.relative_to(root))})
flow_name=lambda bid:'flow-'+bid+('-review' if bid=='commercial-writing' else '')
labels={'Creative':'إبداع ومحتوى','Growth':'تسويق وبيزنس وبحث','Systems':'داتا وأنظمة وتشغيل','People':'عروض وتعلم وخدمة'}
for group,title in labels.items():
 nodes=[{'id':'root','label':title,'sublabel':'تصنيف مقترح — افتح الفروع'}]
 for cat in d['categories']:
  if cat['domain']!=group:continue
  nodes.append({'id':'cat-'+cat['id'],'label':cat['label']['ar'],'parent':'root','collapsed':True})
  for branch in cat['branches']:
   node='branch-'+branch['id'];nodes.append({'id':node,'label':branch['label'],'parent':'cat-'+cat['id'],'collapsed':True})
   for topic in branch['topics']:nodes.append({'id':'topic-'+topic,'label':tasks[topic]['label']['ar'],'sublabel':topic,'parent':node})
 add('tree','taxonomy-'+group.lower(),{'schema_version':1,'diagram_type':'tree','meta':{'title':title+' — كاتيجيريز وفروع ومهام'},'layout':{'direction':'right','gapX':60,'gapY':24,'nodeW':160,'nodeMaxW':200},'nodes':nodes,'cards':[{'dot':'amber','title':'طريقة قراءة الخريطة','items':['ده تصنيف مقترح للمراجعة، مش واجهة أو تشغيل جديد اتوصل بالتطبيق.','خطوط الشجرة تعني انتماء: مجموعة ثم كاتيجيري ثم فرع ثم مهمة. افتح الكاتيجيري والفرع للوصول للمهمة.','كل مهمة لها ID واحد؛ الربط مع كاتيجيري تانية لا ينشئ نسخة مكررة.']}]})
for b in d['blueprints']:
 nodes=[]
 for node in b['nodes']:
  nid=node['id'];lane,col=('intake',0)if nid=='brief'else('intake',1)if nid=='context'else('work',int(nid[-1]))if nid.startswith('work-')else('work',4)if nid=='quality'else('work',5)if nid=='package'else('review',5)
  typ={'input':'frontend','reference':'database','transform':'backend','decision':'security','output':'frontend','revision':'frontend'}[node['role']]
  nodes.append({'id':nid,'lane':lane,'col':col,'type':typ,'label':node['label'],'sublabel':'قرار جودة'if nid=='quality'else'بريف / مش تنفيذ'if nid=='package'else''})
 if b['id'] in ['voice-production','commercial-writing','customer-response']:
  next(n for n in nodes if n['id']=='work-3')['width']=240
 edges=[]
 for edge in b['edges']:
  item={'from':edge['from'],'to':edge['to']}
  if edge.get('kind')=='return':item.update(role='return',label='تعديل'if edge['from']=='review'else'ناقص / تعارض')
  elif edge['condition']=='quality-passed':item['label']='اجتاز المراجعة'
  edges.append(item)
 add('workflow',flow_name(b['id']),{'schema_version':2,'diagram_type':'workflow','meta':{'title':b['label']+' — مسار مقترح'},'lanes':[{'id':'intake','label':'المطلوب والثوابت'},{'id':'work','label':'تخصص وتجهيز ومراجعة'},{'id':'review','label':'مراجعة المستخدم'}],'nodes':nodes,'edges':edges,'mainPath':[n['id']for n in b['nodes']],'cards':[
 {'dot':'cyan','title':'أسئلة المدخلات','items':b['nodes'][0]['questions']},
 {'dot':'violet','title':'الوحدات المشتركة','items':b['nodes'][1]['modules']},
 {'dot':'amber','title':'المخرج وحدود المرحلة','items':[b['output']['contract'],'كل النواتج هنا مواصفات وبرومبتات. مفيش تنفيذ أدوات أو إنتاج أصل بصري من مجرد السهم.','الأسهم الراجعة للتوضيح أو التعديل محدودة بثلاث مراجعات في التصميم؛ بعدها نعرض الناقص للمستخدم.']},
 {'dot':'rose','title':'بوابة الجودة','items':['المطلوب الأصلي محفوظ، ومفيش حقائق مخترعة.','الاسم والنص الحرفي من مدخل مؤكد؛ النص داخل الصورة اختياري.','المقاس واسم الأداة في إعدادات التنفيذ، مش علامة مائية أو عنوان.','أي ادعاء بجودة أصل مولد محتاج اختبار الأداة نفسها؛ فحص البرومبت لا يثبت دقة البكسلات.']}]})
# All eleven explicit relationships. These are reviewed context handoffs, never automatic execution.
position={'brand-system':('creative',0),'product-image':('creative',1),'video-story':('creative',2),'campaign-plan':('creative',3),'commercial-writing':('creative',4),'evidence-research':('strategy',0),'business-decision':('strategy',1),'data-insight':('strategy',2),'decision-deck':('strategy',3),'software-spec':('systems',0),'operations-spec':('systems',1),'customer-response':('systems',2),'learning-plan':('people',3),'career-evidence':('people',4)}
by={b['id']:b for b in d['blueprints']};nodes=[]
for bid,(lane,col)in position.items():
 item={'id':bid,'lane':lane,'col':col,'type':'frontend','label':by[bid]['label'],'sublabel':'بريف قابل للمراجعة'}
 if bid=='business-decision':item['yOffset']=-50
 if bid=='data-insight':item['yOffset']=50
 nodes.append(item)
add('workflow','connections-review',{'schema_version':2,'diagram_type':'workflow','meta':{'title':'المسارات المرتبطة — نقل سياق باختيار المستخدم'},'lanes':[{'id':'creative','label':'الهوية والمحتوى والحملة'},{'id':'strategy','label':'الأدلة والقرار والعرض'},{'id':'systems','label':'الأنظمة والإجراءات والرد'},{'id':'people','label':'التعلم والخبرة'}],'nodes':nodes,'edges':[{'from':l['from'],'to':l['to']}for l in d['links']],'cards':[{'dot':'amber','title':'معنى السهم','items':['السهم اقتراح لإعادة استخدام حقول محددة، بعد اختيار ومراجعة المستخدم. لا ينفذ أداة أو يبدأ مسارًا آخر.','ملف الصورة المولدة مختلف عن بريف الصورة؛ ما ننقلش بريف على إنه أصل بصري معتمد.']}] +[{'dot':'cyan','title':by[l['from']]['label']+' ← '+by[l['to']]['label'],'items':['العقد: '+l['contract'],'الحقول: '+'، '.join(l['fields']),'المصدر المقبول: معلومات أكدها المستخدم أو مصدر مذكور. لا تمرير لحقائق مولدة غير مراجعة.']}for l in d['links']]})
(out/'jobs.json').write_text(json.dumps(jobs,indent=2))
modules={m['id']:m for m in d['sharedModules']}
esc=lambda s:html.escape(str(s));chunks=[]
chunks.append('''<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lookers AI — خريطة بناء المسارات</title><style>*{box-sizing:border-box}body{margin:0;background:#080e18;color:#e9eef4;font:17px/1.9 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:40px 22px}h1,h2{color:#f2d093;line-height:1.4}a{color:#88d8e9;overflow-wrap:anywhere}section,.note{border:1px solid #2d3c4d;border-radius:16px;padding:24px;margin:20px 0;background:#101a29}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.card{padding:18px;border-radius:12px;background:#162438}.tag{font-size:13px;color:#f2d093}details{padding:12px 0;border-bottom:1px solid #2d3c4d}summary{cursor:pointer;font-weight:650}table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:12px;border-bottom:1px solid #2d3c4d;vertical-align:top;text-align:right}.table{overflow-x:auto}code{direction:ltr;unicode-bidi:embed;font-size:13px}.muted{color:#adbdce}li{margin:6px 0}</style><main><p class="tag">LOOKERS AI · WORKFLOW ARCHITECTURE V2 · 30 OCT 2026</p><h1>من كاتيجيريز لفروع، ومن الفروع لمسارات مترابطة</h1><p class="note"><strong>حزمة تصميم ومراجعة، لسه مش موصلة بالشات.</strong> التصنيف بيغطي المهام الموجودة؛ الـ16 مسار بداية تفصيل عميق، مش ادعاء إن الـ138 مهمة كلها اتبنت كمقابلات متخصصة. لا تشغيل أدوات خارجية أو Phase 2.</p><p>13 كاتيجيري · 45 فرع · 138 مهمة · 8 أنماط مشتركة · 16 مسار مفصل · 11 علاقة نقل سياق · 25 ريبو اتراجع مصدره.</p><nav><a href="#taxonomy">التصنيف</a> · <a href="#patterns">الأنماط</a> · <a href="#flows">المسارات</a> · <a href="#links">الربط</a> · <a href="#quality">الجودة</a> · <a href="#repos">الريبوهات</a></nav>''')
chunks.append('<section id="taxonomy"><h2>١. الكاتيجيريز والفروع</h2><div class="grid">')
for group,title in labels.items():chunks.append(f'<div class="card"><h3>{title}</h3><a href="taxonomy-{group.lower()}/taxonomy-{group.lower()}.html">افتح خريطة Archify</a></div>')
chunks.append('</div>')
for cat in d['categories']:
 chunks.append(f'<details><summary>{esc(cat["label"]["ar"])}</summary>')
 for br in cat['branches']:chunks.append('<h4>'+esc(br['label'])+'</h4><ul>'+''.join('<li>'+esc(tasks[t]['label']['ar'])+' <code>'+esc(t)+'</code></li>'for t in br['topics'])+'</ul>')
 chunks.append('</details>')
chunks.append('</section><section id="patterns"><h2>٢. تجميع العمليات المتشابهة</h2><p>الـpattern هو شكل العملية المشترك. الـmodules تضيف أسئلة وخطوات خاصة بالمجال؛ التشابه مايلغيش التخصص.</p><div class="grid">')
for p in d['patterns']:
 chunks.append('<div class="card"><h3>'+esc(p['label'])+'</h3><p>'+esc('، '.join(p['reusedBy']))+'</p><ul>'+''.join('<li><a href="'+flow_name(b['id'])+'/'+flow_name(b['id'])+'.html">'+esc(b['label'])+'</a></li>' for b in d['blueprints'] if b['patternId']==p['id'])+'</ul></div>')
chunks.append('</div></section><section id="flows"><h2>٣. المسارات المفصلة</h2><div class="grid">')
for b in d['blueprints']:
 chunks.append(f'<article class="card"><span class="tag">{esc(b["patternId"])}</span><h3>{esc(b["label"])}</h3><a href="flow-{b["id"]}/flow-{b["id"]}.html">افتح رسم المسار</a><details><summary>الأسئلة والخطوات والمخرج</summary><ul>')
 chunks.append(''.join('<li>'+esc(x)+'</li>'for x in b['nodes'][0]['questions']))
 chunks.append('</ul><h4>أسئلة الوحدات المشتركة وهنتاتها</h4>'+''.join('<details><summary>'+esc(modules[mid]['question']['ar'])+'</summary><p>'+esc(modules[mid]['why']['ar'])+'</p><p>مثال: '+esc(modules[mid]['example']['ar'])+'</p><p class="muted">'+esc(modules[mid]['question']['en'])+'</p></details>' for mid in b['nodes'][1]['modules']))
 chunks.append('<ol>'+''.join('<li>'+esc(x['label'])+'</li>'for x in b['nodes'][2:5])+'</ol><p>'+esc(b['output']['contract'])+'</p></details></article>')
chunks.append('<p class="note">التغطية التفصيلية المقترحة: '+str(d['coverage']['topicsWithDetailedExamples'])+' موضوعًا لهم أمثلة مفصلة، و'+str(d['coverage']['topicsNeedingSpecialization'])+' موضوعًا لسه محتاجين تخصيص. كل الـ138 موضوع متصنفين ومربوطين بنمط مشترك؛ ده مش معناه اكتمال المقابلات المتخصصة لكل موضوع.</p>')
chunks.append('</div></section><section id="links"><h2>٤. المسارات المرتبطة</h2><a href="connections-review/connections-review.html">افتح شبكة الروابط الـ11</a><p>هوية → صورة منتج → فيديو → حملة → نصوص. وبحث → قرار بيزنس → عرض. كل سهم له حقول مسموحة ومصدر ونسخة عقد.</p><p>الربط يدوي ومراجع، مش تنفيذ تلقائي ولا نسخ للمحادثة كلها. الورك فلو الخاص بتحرير مرجع والتعليق الصوتي مستقلان حتى يحدد المستخدم مدخلاتهما؛ لم نضف روابط شكلية لملء الرسم.</p></section>')
chunks.append('''<section id="quality"><h2>٥. اختبار العطر كقاعدة للجودة</h2><p>الصورة تفضل عن المنتج. لو الاسم المطلوب <code>DAVIDOFF</code>، مايتحولش لـ<code>DAVIE DOVE</code>، وما نضيفش ترجمة أو tagline من عندنا.</p><ul><li>الكلام داخل الصورة: مفيش افتراضيًا، أو قائمة نصوص مؤكدة بالحرف.</li><li>المقاس واسم الأداة: إعدادات تنفيذ، مش كتابة أو توقيع في المشهد.</li><li>المرجع والثوابت: يتحقق وجودهم قبل طلب مطابقة الهوية.</li><li>لو الأداة مش مضمونة في كتابة الاسم: نحافظ على مرجع معتمد أو نضيفه في خطوة تحرير، من غير اختراع حروف.</li><li>التحقق الحالي حتمي لمواصفة البرومبت؛ مش فحص OCR للصورة ولا نتيجة تقييم حي لموديل.</li></ul><p>مافيش ادعاء «أقوى من الجميع» من غير baseline ومقارنة ونتائج فعلية. التحسين لازم يظهر في الاحتفاظ بالمطلوب، دقة الحقائق، وقابلية استخدام الناتج.</p></section>''')
chunks.append('<section id="repos"><h2>٦. بحث الريبوهات وقرار الاستخدام</h2><p>المقترح للمحرر الداخلي: React Flow + ELK. للعقود: Ajv أو Zod باختيار مصدر واحد. للجودة: Promptfoo. Archify مستخدم للمراجعة حاليًا. باقي المحركات اختيارات مشروطة أو مراجع؛ ما اتثبتتش داخل التطبيق.</p><div class="table"><table><tr><th>الريبو</th><th>الدور والقرار</th><th>الفائدة</th><th>الرخصة والحدود</th></tr>')
for r in repos:chunks.append(f'<tr><td><a href="{esc(r["url"])}">{esc(r["repo"])}</a></td><td>{esc(r["area"])}<br>{esc(r["decision"])}</td><td>{esc(r["proposedUse"])}</td><td>{esc(r["verifiedLicenseSummary"])}<br>{esc(r["limits"])}</td></tr>')
chunks.append('</table></div></section><p class="muted">المصدر: معاينة الكود عند 3219493 وmetadata/README رسمية بتاريخ 30 أكتوبر 2026. لا تغييرات في UI أو backend أو إنتاج. الرسم نفسه مقترح، وليس وصفًا لقدرات تنفيذ جديدة تعمل بالفعل.</p></main></html>')
(out/'index.html').write_text(''.join(chunks))
print(json.dumps({'candidates':len(jobs),'output':str(out)},ensure_ascii=False))
