# بحث الريبوهات — Lookers AI workflow architecture v2

تاريخ التحقق: 2026-10-30. بحث موجه في 25 مستودعًا رسميًا عبر الرسم، التحقق، الحالات، التقييم، مراقبة الجودة، بناء التدفقات والربط. ده مش ادعاء بحصر كل GitHub. تمت قراءة metadata وREADME ومراجعة نصوص الرخص للحالات المختلطة؛ لم يتم تثبيت هذه المحركات في التطبيق أو قياس توافقها وأدائها فعليًا. الحالة والتراخيص لقطة بتاريخ البحث، ومحتوى README ليس إثباتًا للأداء.

## الترشيح التنفيذي

- **الآن:** Archify للمراجعة، تعريف JSON محايد للمسارات، ومعايير جودة وحالات اختبار حتمية.
- **للمحرر الداخلي عند توصيله:** React Flow للرسم + ELK للترتيب، أو Dagre لو التخطيط بسيط. المحرر مش هو واجهة الشات.
- **للتحقق:** Ajv مع JSON Schema كمرشح أول. Zod بديل لو اعتمدنا تعريف TypeScript كمصدر الحقيقة. لا ازدواج لنفس الدور.
- **للجودة:** Promptfoo مرشح المقارنة الأول. لا ادعاء بتحسين فعلي قبل baseline ونتائج تقييم.
- **مشروط:** XState لو حالات الرحلة تستدعيه، وواحد من JSON Forms/RJSF لتحرير الأسئلة داخليًا.
- **مرجع فقط حاليًا:** Langflow وDify وComfyUI. Flowise مستبعد كأساس جديد لأنه مؤرشف.
- **مرحلة لاحقة:** LangGraph وموصلات n8n/Activepieces والتشغيل الطويل. لا تغيير لمسار Agent.run() أو DeepSeek الحالي في هذا الفرع.

## سجل القرار

| المستودع | الدور | القرار | الرخصة التي راجعناها | الفائدة المحددة | حدود الاستخدام |
|---|---|---|---|---|---|
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | محرر الرسم | اختيار للمحرر الداخلي | MIT | رسم Nodes وEdges وPorts داخل React. يبقى أداة تحرير داخلية، والشات الحالي يفضل بسيط. | مش محرك تنفيذ؛ إدارة المعنى والتحقق مسؤوليتنا. |
| [kieler/elkjs](https://github.com/kieler/elkjs) | ترتيب الخطوط | اختيار بعد اختبار تخطيط | EPL-2.0 OR GPL-3.0-or-later (package) | تخطيط اتجاهي مع ports؛ مناسب للفروع والمجموعات المتداخلة. | بيحسب المواضع ومش بيرسم. اختبار Web Worker وحجم الحزمة وإبقاء ملاحظات الرخصة. |
| [dagrejs/dagre](https://github.com/dagrejs/dagre) | ترتيب الخطوط | بديل أبسط لـELK | MIT | ترتيب DAG بسيط لو احتياجات الرسم محدودة. | استخدام @dagrejs/dagre المدعوم؛ مينفعش نفترض نفس قدرات ELK للمجموعات والـports. |
| [ajv-validator/ajv](https://github.com/ajv-validator/ajv) | عقود البيانات | مرشح التحقق الأساسي | MIT | تحقق JSON Schema قابل للتصدير من تعريفات الورك فلو. | نحدد draft واحد ونرفض خصائص مجهولة؛ مش بديل لفحص الترابط بين العقد. |
| [colinhacks/zod](https://github.com/colinhacks/zod) | عقود البيانات | بديل لو التعريف TypeScript أولًا | MIT | تعريفات Typed وتحويل JSON Schema. | نختار مصدر حقيقة واحد؛ ما نركبش Zod وAjv لنفس المسؤولية من غير سبب. |
| [eclipsesource/jsonforms](https://github.com/eclipsesource/jsonforms) | تحرير الأسئلة | اختياري للإدارة | MIT | تحرير حقول وأسئلة وقواعد عرض من Schema. | مش هنستبدل بيه تجربة سؤال واحد أو تصميم المنصة المعتمد. |
| [rjsf-team/react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) | تحرير الأسئلة | بديل لـJSON Forms | Apache-2.0 | نماذج إدارة مبنية على JSON Schema وقوالب عرض قابلة للتخصيص. | نختار واحد فقط؛ لازم اختبار RTL والمكونات المخصصة. |
| [statelyai/xstate](https://github.com/statelyai/xstate) | حالات الرحلة | مشروط بالحاجة | MIT | نمذجة حالات الانتظار والتعديل والتأكيد وإعادة المحاولة. | مش هيستبدل Agent.run ولا بيدي للموديل صلاحية تغيير الحالة. |
| [jwadhams/json-logic-js](https://github.com/jwadhams/json-logic-js) | الشروط | مرجع / مرشح بحذر | MIT | قواعد بسيطة قابلة للتخزين كـJSON بين الواجهة والسيرفر. | آخر push ظاهر 2024-07-09. نبدأ بمجموعة شروط صغيرة محدودة، ونراجع الاعتمادية قبل إضافة dependency. |
| [jsonata-js/jsonata](https://github.com/jsonata-js/jsonata) | تحويل البيانات | مؤجل | MIT | تحويل مخرجات مسار لشكل مدخلات مسار آخر. | التعبيرات تحتاج حدود وقت وحجم؛ الربط الأول هيكون بقوائم حقول صريحة. |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | تقييم الجودة | مرشح أول للتقييم | MIT | مقارنات Prompts وAssertions وCI؛ مناسب لحالات البراند وتسريب بيانات التنفيذ. | الاختبارات الحتمية مجانية محليًا؛ تقييمات الموديل واختبارات التوليد الحي لها تكلفة مزود. |
| [confident-ai/deepeval](https://github.com/confident-ai/deepeval) | تقييم الجودة | بديل بحثي | Apache-2.0 | مقاييس تقييم LLM متعددة ومناسبة لاختبارات Python. | هيضيف بيئة Python للتقييم لو اعتمدناه؛ مش لازم مع Promptfoo من البداية. |
| [langfuse/langfuse](https://github.com/langfuse/langfuse) | تتبع الجودة | لاحقًا بعد التوليد الحي | MIT core / commercial EE | تتبع طلبات الموديل، نسخ البرومبتات والتقييمات. | التشغيل الذاتي يحتاج خدمات؛ أقسام EE منفصلة، ومحتاجين سياسة للاحتفاظ بمحتوى المستخدم. |
| [Arize-ai/phoenix](https://github.com/Arize-ai/phoenix) | تتبع الجودة | بديل مشروط | Elastic License 2.0 | رصد وتجارب وتقييم LLM. | الرخصة تمنع تقديم نفس وظائفه الأساسية كخدمة مستضافة للغير؛ نراجع نمط الاستخدام. |
| [langflow-ai/langflow](https://github.com/langflow-ai/langflow) | أنماط بناء التدفقات | مرجع تصميم | MIT | ندرس تصميم Components، playground وتصدير JSON ونقاط الربط. | منصة Python كاملة؛ مش هنستبدل بيها الـbackend أو نشغلها ضمن Phase 1. |
| [langgenius/dify](https://github.com/langgenius/dify) | أنماط بناء التدفقات | مرجع تصميم بشروط | Dify modified Apache-2.0 | ندرس variable mapping والـworkflow UX والتصحيح التدريجي. | الرخصة فيها شروط multi-tenant والشعار؛ مش fork جاهز لبراند LookersHub. |
| [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise) | أنماط بناء التدفقات | مستبعد كأساس جديد | Apache-2.0 (README; mixed metadata) | مفيد لقراءة قرارات تصميم تاريخية فقط. | المستودع archived=true وإعلان EOL موجود. مفيش اعتماد جديد عليه. |
| [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | تدفقات إبداعية | مرجع لنمط الجراف | GPL-3.0 | ندرس subgraphs وtyped connections وتسلسل تحويل المراجع والنتايج. | مش مجرد حزمة React؛ تشغيل نماذج له متطلبات موارد ورخص مستقلة. لا دمج للكود في الواجهة حاليًا. |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | ربط أنظمة | Phase 2 / مرجع | Sustainable Use + enterprise | أمثلة تفرعات وموصلات وموافقات وفشل وإعادة محاولة. | الرخصة مش MIT؛ الاستخدام الداخلي مش نفس تضمين المنتج كخدمة لعملائنا. |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | ربط أنظمة | Phase 2 / مرشح موصلات | MIT core / commercial EE | Pieces مكتوبة TypeScript؛ مرجع لعقود actions/triggers. | ربط أدوات حقيقية مؤجل؛ ميزات enterprise منفصلة، وأي اعتماد يحتاج تدقيق dependencies. |
| [langchain-ai/langgraphjs](https://github.com/langchain-ai/langgraphjs) | تنسيق إيجنتات | Phase 2 فقط | MIT | JS/TS graph runtime بحالات محفوظة وتدخل بشري. | هيغير مسؤولية التنسيق؛ مش ضروري لزيادة جودة المقابلة الحالية. |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | تنسيق إيجنتات | مرجع Python / Phase 2 | MIT | ندرس checkpointing وinterrupts ومسارات الحالات الطويلة. | مش محتاجين محرك Python تاني جنب JS للمرحلة الحالية. |
| [temporalio/sdk-typescript](https://github.com/temporalio/sdk-typescript) | تنفيذ طويل | Phase 2 عند الحاجة | MIT (SDK) | SDK لتدفقات طويلة قابلة للاستئناف وإدارة الفشل. | يحتاج خدمة Temporal وعمال؛ مش إضافة مناسبة لطلب توليد برومبت واحد. |
| [inngest/inngest](https://github.com/inngest/inngest) | تنفيذ طويل | بديل مستقبلي مشروط | SSPL-1.0 + Apache future license (server) | تنفيذ durable functions وخطوات وحالات وانتظار. | دي رخصة السيرفر؛ لا نستنتج منها رخص SDK أو شروط الخدمة. مش هنشغّل سيرفره دلوقتي. |
| [tt-a1i/archify](https://github.com/tt-a1i/archify) | مراجعة الخريطة | مستخدم الآن | Apache-2.0 | خرائط HTML مستقلة وتحقق آلي للترابط والتخطيط. | وسيلة عرض ومراجعة؛ مش محرك الورك فلو داخل المنتج. |

## أدلة الترخيص والصيانة المهمة

- [Flowise README](https://github.com/FlowiseAI/Flowise/blob/main/README.md) و[إعلان الإيقاف](https://github.com/FlowiseAI/Flowise/discussions/6727): المستودع مؤرشف، وتوقف التطوير الرسمي. metadata الرسمية أعادت archived=true وقت البحث.
- [Dify LICENSE](https://github.com/langgenius/dify/blob/main/LICENSE): شروط إضافية لـmulti-tenant والشعار.
- [n8n LICENSE](https://github.com/n8n-io/n8n/blob/master/LICENSE.md): Sustainable Use وEnterprise؛ الاستفادة من التصميم مختلفة عن تضمين الكود كخدمة.
- [Activepieces LICENSE](https://github.com/activepieces/activepieces/blob/main/LICENSE): MIT خارج مسارات EE المحددة.
- [Langfuse LICENSE](https://github.com/langfuse/langfuse/blob/main/LICENSE): MIT خارج مسارات EE المحددة.
- [Phoenix LICENSE](https://github.com/Arize-ai/phoenix/blob/main/LICENSE): Elastic License 2.0.
- [ELK LICENSE](https://github.com/kieler/elkjs/blob/master/LICENSE.md): EPL-2.0؛ metadata GitHub وحدها لم تحدد SPDX.
- [Inngest server LICENSE](https://github.com/inngest/inngest/blob/main/LICENSE.md): SSPL مع ترخيص Apache مستقبلي؛ يلزم فحص نسخة وتاريخ وSDK منفصلين عند اختيار فعلي.

## ما لم نعمله

لم نفحص كامل كود كل مشروع، أو نعمل تدقيق أمني شامل، أو نقيس bundle size وRTL على حزمة مركبة. الترشيحات هي حكم هندسي على ملاءمة المصادر المقروءة؛ التبني النهائي يحتاج نسخة مثبتة وPoC محدودًا واختبارات وتحققًا من الرخص ذات الصلة. أي كلفة خدمة أو LLM غير مضمنة في وصف المشروع كـopen source.

## فحص توافق أولي للحزم المرشحة

تمت قراءة package.json من المصدر، وليس تثبيت النسخ: React Flow 12.12.0 يعلن React/ReactDOM >=17، وهو متسق مبدئيًا مع React 19 في التطبيق. ELK 0.13.0 يعلن ترخيصًا مزدوجًا EPL-2.0 OR GPL-3.0-or-later، بينما ملف LICENSE.md هو EPL-2.0. Ajv 8.20.0 معلن MIT. Promptfoo 0.125.1 يطلب Node >=22.22.0. بيئة تطوير JSON Forms تطلب Node ^24 وpnpm ^11. أرقام الريبو لا تثبت أنها أحدث نسخ npm المنشورة، والتوافق الفعلي محتاج PoC.
