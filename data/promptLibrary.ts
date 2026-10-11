import type { Lang, TaskType } from './lookersAi';
export type Localized = Record<Lang, string>;
export interface PromptInput { id: string; label: Localized; hint: Localized; required: boolean }
export interface PromptTemplate {
  id: string; title: Localized; description: Localized; category: string; taskType: TaskType;
  useCase: Localized; tools: string[]; inputs: PromptInput[]; idea: Localized; objective: Localized;
  answerBindings: Record<string, Localized>; referenceHint: Localized; enhancements: Localized[];
  featured: boolean; curated: boolean;
}
const l = (en: string, ar: string): Localized => ({en, ar});
const input = (id: string, en: string, ar: string, hintEn: string, hintAr: string): PromptInput => ({id,label:l(en,ar),hint:l(hintEn,hintAr),required:true});
export const promptCategories = [
  ['images','Images','صور'],['video','Video','فيديو'],['marketing','Marketing','تسويق'],['business','Business','أعمال'],['writing','Writing','كتابة'],['career','Career','مسار مهني'],['data','Data','بيانات'],['productivity','Productivity','إنتاجية'],['presentations','Presentations','عروض تقديمية'],['other','Other','أخرى'],
].map(([id,en,ar])=>({id,label:l(en,ar)}));
const existingPromptTemplates: PromptTemplate[] = [
  {id:'product-photo',title:l('Premium product photo','صورة منتج مميزة'),description:l('A clear studio-photo brief with faithful packaging.','وصف تصوير احترافي يحافظ على شكل المنتج.'),category:'images',taskType:'image',useCase:l('Prepare a product image for an Instagram feed.','جهّز صورة منتج لمنشور إنستجرام.'),tools:['ChatGPT','Gemini','Midjourney'],inputs:[input('product','Product and packaging','المنتج وعبوته','Describe the actual product, not invented claims.','صِف المنتج الفعلي بدون ادعاءات مختلقة.')],idea:l('Create a premium Instagram product photo of {{product}}.','صمّم صورة منتج مميزة لإنستجرام لـ{{product}}.'),objective:l('A polished portrait product image with faithful packaging.','صورة منتج رأسية احترافية مع الحفاظ على العبوة.'),answerBindings:{subject:l('{{product}}','{{product}}'),usage:l('Instagram feed','منشور إنستجرام')},referenceHint:l('Optional: attach the real product photo or brand guide.','اختياري: أرفق صورة المنتج الحقيقية أو دليل الهوية.'),enhancements:[l('Preserve packaging and labels; do not invent product claims.','حافظ على العبوة والنصوص؛ لا تخترع مزايا للمنتج.'),l('Confirm image dimensions and style before final use.','راجع الأبعاد والأسلوب قبل الاستخدام النهائي.')],featured:true,curated:true},
  {id:'campaign-brief',title:l('Launch campaign','حملة إطلاق'),description:l('Plan a campaign around a verified offer and audience.','خطّط لحملة حول عرض وجمهور محددين.'),category:'marketing',taskType:'campaign',useCase:l('Build an actionable campaign brief without publishing or spending.','جهّز خطة حملة دون نشر أو إنفاق.'),tools:['ChatGPT','Claude','Gemini'],inputs:[input('offer','Verified offer','العرض المؤكد','What are you actually offering?','ما العرض الفعلي؟'),input('audience','Audience','الجمهور','Who is the offer for?','لمن تقدم العرض؟')],idea:l('Plan a launch campaign for {{offer}} for {{audience}}.','خطّط لحملة إطلاق لـ{{offer}} تستهدف {{audience}}.'),objective:l('A clear launch plan with suggested messaging and measurement.','خطة إطلاق واضحة برسائل مقترحة وطرق قياس.'),answerBindings:{product:l('{{offer}}','{{offer}}'),audience:l('{{audience}}','{{audience}}')},referenceHint:l('Optional: brand guide, approved offer details and available assets.','اختياري: دليل الهوية وتفاصيل العرض المعتمدة والمواد المتاحة.'),enhancements:[l('Keep budget and performance claims unknown unless supplied.','لا تفترض ميزانية أو نتائج أداء غير مقدمة.')],featured:true,curated:true},
  {id:'business-plan',title:l('Business idea plan','خطة فكرة تجارية'),description:l('Turn your idea into a practical plan with explicit unknowns.','حوّل فكرتك لخطة عملية مع توضيح المعلومات الناقصة.'),category:'business',taskType:'general',useCase:l('Explore a new business before committing resources.','ادرس الفكرة قبل تخصيص الموارد.'),tools:['ChatGPT','Claude','Gemini'],inputs:[input('business','Business idea','الفكرة التجارية','Describe the service or product and its customer.','صِف المنتج أو الخدمة والعميل المستهدف.')],idea:l('Build a practical business plan for {{business}}.','ابنِ خطة عمل عملية لـ{{business}}.'),objective:l('An initial plan with next steps, risks and unanswered questions.','خطة مبدئية بالخطوات والمخاطر والأسئلة المفتوحة.'),answerBindings:{outcome:l('A plan with next steps, risks and unanswered questions.','خطة بالخطوات والمخاطر والأسئلة المفتوحة.')},referenceHint:l('Optional: attach verified costs or market research.','اختياري: أرفق تكاليف مؤكدة أو بحثًا للسوق.'),enhancements:[l('Separate facts, assumptions and items requiring verification.','ميّز الحقائق عن الافتراضات وما يحتاج للتحقق.')],featured:false,curated:true},
  {id:'career-cv',title:l('CV from real experience','سيرة ذاتية من خبراتك'),description:l('Organize verified experience for a specific role.','رتّب خبراتك المؤكدة لوظيفة محددة.'),category:'career',taskType:'general',useCase:l('Prepare a truthful, targeted CV draft.','جهّز مسودة سيرة ذاتية دقيقة ومناسبة للوظيفة.'),tools:['ChatGPT','Claude','Gemini'],inputs:[input('role','Target role','الوظيفة المطلوبة','Which role are you applying for?','ما الوظيفة التي تتقدم لها؟'),input('experience','Verified experience','الخبرات المؤكدة','Your actual work, education and skills.','خبراتك وتعليمك ومهاراتك الفعلية.')],idea:l('Write a CV for {{role}} using only this experience: {{experience}}','اكتب سيرة ذاتية لوظيفة {{role}} باستخدام هذه الخبرات فقط: {{experience}}'),objective:l('A truthful CV draft tailored to the target role.','مسودة سيرة ذاتية دقيقة ومناسبة للوظيفة المطلوبة.'),answerBindings:{outcome:l('A truthful CV for {{role}}.','سيرة ذاتية دقيقة لوظيفة {{role}}.')},referenceHint:l('Optional: existing CV and job description.','اختياري: السيرة الحالية ووصف الوظيفة.'),enhancements:[l('Do not invent employers, dates, degrees or achievements.','لا تخترع جهات عمل أو تواريخ أو شهادات أو إنجازات.')],featured:true,curated:false},
  {id:'data-dashboard',title:l('Sales dashboard brief','خطة لوحة مبيعات'),description:l('Define decisions and metrics from actual data.','حدّد القرارات والمؤشرات من بيانات فعلية.'),category:'data',taskType:'dashboard',useCase:l('Prepare a dashboard specification your team can implement.','جهّز مواصفات لوحة يستطيع فريقك تنفيذها.'),tools:['ChatGPT','Claude','Gemini'],inputs:[input('decisions','Decisions to support','القرارات المطلوبة','What should the dashboard help decide?','ما القرارات التي ستساعد فيها اللوحة؟'),input('source','Available data','البيانات المتاحة','Describe actual files and columns.','صِف الملفات والأعمدة الفعلية.')],idea:l('Build a sales dashboard to support {{decisions}}, using {{source}}.','ابنِ لوحة مبيعات لدعم {{decisions}} باستخدام {{source}}.'),objective:l('A dashboard brief with metric definitions and data checks.','وصف لوحة مع تعريف المؤشرات وفحص البيانات.'),answerBindings:{decisions:l('{{decisions}}','{{decisions}}'),dataSource:l('{{source}}','{{source}}')},referenceHint:l('Optional: attach an anonymized CSV sample.','اختياري: أرفق عينة CSV بدون بيانات شخصية.'),enhancements:[l('Define metric sources and formulas; never fabricate values.','حدّد مصادر المؤشرات ومعادلاتها؛ لا تخترع قيمًا.')],featured:false,curated:true},
  {id:'presentation-outline',title:l('Presentation outline','مخطط عرض تقديمي'),description:l('Explain a topic clearly to your chosen audience.','اشرح موضوعك بوضوح للجمهور المطلوب.'),category:'presentations',taskType:'presentation',useCase:l('Prepare an outline and speaker notes, not a claimed finished deck.','جهّز مخططًا وملاحظات للعرض دون ادعاء إنشاء ملف نهائي.'),tools:['ChatGPT','Claude','Gemini'],inputs:[input('topic','Topic','الموضوع','What should the presentation explain?','ماذا سيشرح العرض؟'),input('audience','Audience','الجمهور','Who will see it?','من سيشاهد العرض؟')],idea:l('Plan a presentation about {{topic}} for {{audience}}.','خطّط لعرض عن {{topic}} لجمهور {{audience}}.'),objective:l('A clear slide outline with speaker notes.','مخطط شرائح واضح مع ملاحظات للمتحدث.'),answerBindings:{presentationType:l('business','business'),audience:l('{{audience}}','{{audience}}'),outcome:l('A slide outline and speaker notes.','مخطط شرائح وملاحظات للمتحدث.')},referenceHint:l('Optional: approved research and brand assets.','اختياري: أبحاث معتمدة ومواد الهوية.'),enhancements:[l('Mark unsupported facts for verification.','وضّح الحقائق التي تحتاج إلى تحقق.')],featured:false,curated:false},
  {id:'support-reply',title:l('Thoughtful customer reply','رد واضح للعميل'),description:l('Respond with empathy and accurate next steps.','رد بتفهّم وخطوات تالية دقيقة.'),category:'writing',taskType:'general',useCase:l('Draft a reply for review, without sending it.','اكتب ردًا للمراجعة دون إرساله.'),tools:['ChatGPT','Claude','Gemini'],inputs:[input('message','Customer message','رسالة العميل','Paste the message and remove private details.','الصق الرسالة بعد حذف البيانات الخاصة.'),input('policy','Confirmed resolution or policy','الحل أو السياسة المؤكدة','What can you actually offer or promise?','ما الذي تستطيع تقديمه أو التعهد به فعليًا؟')],idea:l('Draft a reply to this message: {{message}}. Use only this confirmed policy: {{policy}}','اكتب ردًا على هذه الرسالة: {{message}}. استخدم هذه السياسة المؤكدة فقط: {{policy}}'),objective:l('A concise empathetic reply with accurate next steps.','رد مختصر بتفهّم وخطوات دقيقة.'),answerBindings:{outcome:l('A reply for review; do not send it.','رد للمراجعة؛ لا ترسله.')},referenceHint:l('Optional: approved service guidelines.','اختياري: إرشادات الخدمة المعتمدة.'),enhancements:[l('Do not promise refunds, dates or exceptions that are not confirmed.','لا تتعهد بمبالغ أو مواعيد أو استثناءات غير مؤكدة.')],featured:false,curated:false},
  {id:'video-storyboard',title:l('Short video storyboard','مخطط فيديو قصير'),description:l('Plan the shots and message before production.','رتّب المشاهد والرسالة قبل الإنتاج.'),category:'video',taskType:'general',useCase:l('Prepare a storyboard to use in an external video tool.','جهّز مخطط مشاهد للاستخدام في أداة فيديو خارجية.'),tools:['Runway','ChatGPT','Gemini'],inputs:[input('subject','Video subject and goal','موضوع الفيديو وهدفه','Describe what should be shown and why.','صِف ما تريد عرضه والهدف منه.')],idea:l('Plan a short video storyboard for {{subject}}.','خطّط لمشاهد فيديو قصير عن {{subject}}.'),objective:l('A shot-by-shot plan, not a claimed generated video.','خطة مشهد بمشهد دون ادعاء إنشاء فيديو.'),answerBindings:{outcome:l('A storyboard with shots, suggested duration and audio notes.','مخطط مشاهد مع مدة مقترحة وملاحظات للصوت.')},referenceHint:l('Optional: approved product images and script.','اختياري: صور المنتج والنص المعتمد.'),enhancements:[l('Treat timing as a suggestion unless you specify it.','اعتبر التوقيت اقتراحًا ما لم تحدده بنفسك.')],featured:false,curated:true},
];

/** Original Lookers AI starting points. Tool choice happens after the prepared prompt. */
const presentationGuides = [
  [
    "pitch-deck",
    "Pitch deck",
    "عرض فكرة مشروع",
    "pitch",
    "Explain the customer problem, proposed solution, evidence, business model and next ask.",
    "اشرح مشكلة العميل والحل المقترح والدليل ونموذج العمل والطلب التالي."
  ],
  [
    "company-profile",
    "Company profile",
    "عرض تعريفي بالشركة",
    "business",
    "Introduce the company through verified services, strengths, delivery process and contact next steps.",
    "عرّف الشركة من خدماتها الفعلية ونقاط قوتها وطريقة التنفيذ والخطوة التالية للتواصل."
  ],
  [
    "sales-presentation",
    "Sales presentation",
    "عرض مبيعات",
    "sales",
    "Connect the customer need to the approved offer, demonstrate value and end with a clear next step.",
    "اربط احتياج العميل بالعرض المعتمد ووضّح القيمة واختم بخطوة تالية واضحة."
  ],
  [
    "marketing-plan-presentation",
    "Marketing plan presentation",
    "عرض خطة تسويق",
    "business",
    "Explain the audience, positioning, approved channels, proposed activities and measurement plan; separate forecasts from facts.",
    "وضّح الجمهور والتموضع والقنوات المعتمدة والأنشطة المقترحة وخطة القياس؛ افصل التوقعات عن الحقائق."
  ],
  [
    "strategy-presentation",
    "Strategy presentation",
    "عرض استراتيجية",
    "business",
    "Compare strategic options, explain tradeoffs and propose priorities, ownership and decision checkpoints.",
    "قارن الاختيارات الاستراتيجية ووضّح المفاضلات واقترح الأولويات والمسؤوليات ونقاط القرار."
  ],
  [
    "executive-presentation",
    "Executive presentation",
    "عرض للإدارة التنفيذية",
    "business",
    "Lead with the decision needed, summarize verified evidence, risks and resources, then make a concise recommendation.",
    "ابدأ بالقرار المطلوب ولخّص الأدلة المؤكدة والمخاطر والموارد ثم قدّم توصية مختصرة."
  ],
  [
    "investor-presentation",
    "Investor presentation",
    "عرض للمستثمرين",
    "pitch",
    "Explain the opportunity, verified traction, economics and funding use; mark unsupported figures for input.",
    "اشرح الفرصة والنتائج المؤكدة واقتصاديات المشروع واستخدام التمويل؛ علّم الأرقام الناقصة بدل اختراعها."
  ],
  [
    "product-launch-deck",
    "Product launch deck",
    "عرض إطلاق منتج",
    "business",
    "Show the verified product, intended customers, launch message, readiness, rollout milestones and success measures.",
    "اعرض المنتج الفعلي والعملاء المستهدفين ورسالة الإطلاق والجاهزية والمراحل ومقاييس النجاح."
  ],
  [
    "training-deck",
    "Training deck",
    "عرض تدريب",
    "training",
    "Set learning objectives, teach the steps with worked examples and end with practice and a knowledge check.",
    "حدّد أهداف التعلّم واشرح الخطوات بأمثلة محلولة واختم بتطبيق وأسئلة للفهم."
  ],
  [
    "workshop-deck",
    "Workshop deck",
    "عرض ورشة عمل",
    "training",
    "Structure a participatory session with an agenda, activity instructions, timings, reflection and actionable takeaways.",
    "رتّب جلسة تفاعلية بجدول وتعليمات للأنشطة وأوقات مقترحة ومراجعة ودروس قابلة للتطبيق."
  ],
  [
    "educational-presentation",
    "Educational presentation",
    "عرض تعليمي",
    "education",
    "Explain the topic at the audience’s level, connect concepts with examples and check understanding without invented sources.",
    "اشرح الموضوع بمستوى مناسب للجمهور واربط المفاهيم بأمثلة واختبر الفهم بدون مصادر مختلقة."
  ],
  [
    "data-storytelling-presentation",
    "Data storytelling presentation",
    "عرض قصة من البيانات",
    "data",
    "Build a narrative from supplied data: question, method, key finding, chart choice, limitations and decision.",
    "ابنِ قصة من البيانات المقدمة: السؤال والطريقة والنتيجة والرسم المناسب وحدود التحليل والقرار."
  ],
  [
    "project-proposal-deck",
    "Project proposal deck",
    "عرض مقترح مشروع",
    "business",
    "Define the problem, proposed scope, deliverables, dependencies, milestones and acceptance criteria; flag unknown costs.",
    "حدّد المشكلة والنطاق المقترح والتسليمات والاعتماديات والمراحل ومعايير القبول؛ وضّح التكاليف غير المعروفة."
  ],
  [
    "quarterly-business-review",
    "Quarterly business review",
    "مراجعة الأعمال الربع سنوية",
    "data",
    "Review actual quarter results against supplied targets, explain gaps and propose next-quarter actions with owners.",
    "راجع نتائج الربع الفعلية مقابل الأهداف المقدمة واشرح الفجوات واقترح إجراءات الربع التالي ومسؤولياتها."
  ],
  [
    "hotel-travel-presentation",
    "Hotel / travel presentation",
    "عرض فندق أو رحلة",
    "business",
    "Present verified accommodation and travel details, audience fit, amenities and booking conditions; request current availability.",
    "اعرض تفاصيل الإقامة والسفر المؤكدة وملاءمتها للجمهور والخدمات وشروط الحجز؛ اطلب التوافر الحالي."
  ],
  [
    "tourism-package-presentation",
    "Tourism package presentation",
    "عرض برنامج سياحي",
    "business",
    "Explain the itinerary, inclusions, exclusions, travel logistics and verified booking terms without invented prices.",
    "اشرح البرنامج والمشمول وغير المشمول وترتيبات السفر وشروط الحجز المؤكدة بدون أسعار مختلقة."
  ]
] as const;
export const presentationTemplates: PromptTemplate[] = presentationGuides.map(([id,en,ar,type,goalEn,goalAr])=>({
  id, title:l(en,ar), description:l(goalEn,goalAr), category:'presentations', taskType:'presentation',
  useCase:l('Prepare a '+en.toLowerCase()+' for your audience from verified information.','جهّز '+ar+' مناسب لجمهورك من المعلومات المؤكدة.'),
  tools:['Gamma','Canva','Microsoft PowerPoint / Copilot','Google Slides / Gemini','Beautiful.ai','Pitch','Prezi'],
  inputs:[
    input('topic','Topic and confirmed information','الموضوع والمعلومات المؤكدة','Share the real content; mark anything still unknown.','اكتب المحتوى الفعلي ووضّح المعلومات اللي لسه ناقصة.'),
    input('audience','Audience and decision','الجمهور والقرار المطلوب','Who will see it, and what should they understand or decide?','مين هيشوفه، ومحتاج يفهم أو يقرر إيه؟'),
    {...input('slides','Approximate slides or duration','عدد الشرائح أو المدة تقريبًا','Optional: an approximate number or presentation duration.','اختياري: عدد تقريبي أو مدة العرض.'),required:false},
  ],
  idea:l('Prepare a '+en.toLowerCase()+' about {{topic}} for {{audience}}.','جهّز '+ar+' عن {{topic}} لجمهور {{audience}}.'),
  objective:l(goalEn,goalAr),
  answerBindings:{presentationType:l(type,type),audience:l('{{audience}}','{{audience}}'),slideCount:l('{{slides}}','{{slides}}')},
  referenceHint:l('Optional: attach approved facts, data and brand guidance.','اختياري: أرفق المعلومات والبيانات المعتمدة ودليل الهوية.'),
  enhancements:[
    l(goalEn,goalAr),
    l('Give each slide one key message, concise content and a suitable visual direction.','خلي كل شريحة برسالة رئيسية واحدة ومحتوى مختصر وفكرة بصرية مناسبة.'),
    l('Use supplied facts only. Label assumptions and missing evidence; do not invent results or claim a finished file.','استخدم الحقائق المقدمة بس. وضّح الافتراضات والأدلة الناقصة؛ ما تخترعش نتائج أو تدّعي إنشاء ملف نهائي.'),
  ],
  featured:['pitch-deck','marketing-plan-presentation','educational-presentation'].includes(id),curated:true,
}));
export const promptTemplates: PromptTemplate[] = [...existingPromptTemplates,...presentationTemplates];
