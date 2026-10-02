export type Lang = 'en' | 'ar';
export type TaskType = 'image' | 'campaign' | 'dashboard' | 'general';
export type FieldKind = 'text' | 'textarea' | 'single' | 'multi';

export type Option = { en: string; ar: string; value: string };
export type Question = {
  id: string;
  label: { en: string; ar: string };
  kind: FieldKind;
  optional?: boolean;
  placeholder?: { en: string; ar: string };
  example?: { en: string; ar: string };
  options?: Option[];
};

export const taskTypes: { id: TaskType; title: { en: string; ar: string }; description: { en: string; ar: string } }[] = [
  { id: 'image', title: { en: 'Visual prompt', ar: 'Prompt بصري' }, description: { en: 'Plan a new image, transformation, or reference-led design.', ar: 'خطط لصورة جديدة أو تحويل بصري بالاعتماد على مراجع.' } },
  { id: 'campaign', title: { en: 'Campaign', ar: 'حملة إعلانية' }, description: { en: 'Organize the strategy and assets for a campaign.', ar: 'رتّب استراتيجية الحملة وموادها.' } },
  { id: 'dashboard', title: { en: 'Dashboard', ar: 'لوحة بيانات' }, description: { en: 'Define decisions, metrics, and data for a dashboard.', ar: 'حدّد القرارات والمؤشرات والبيانات للوحة.' } },
  { id: 'general', title: { en: 'General task', ar: 'مهمة عامة' }, description: { en: 'Turn a brief into a clear, usable prompt.', ar: 'حوّل موجزًا إلى Prompt واضح وقابل للاستخدام.' } }
];

const option = (value: string, en: string, ar: string): Option => ({ value, en, ar });
export const questions: Record<TaskType, Question[]> = {
  image: [
    { id: 'action', label: { en: 'What should happen to the image?', ar: 'ما المطلوب في الصورة؟' }, kind: 'single', example: { en: 'Choose “Create a new image” for a new visual.', ar: 'اختر «إنشاء صورة جديدة» إذا كنت تريد تصميمًا جديدًا.' }, options: [
      option('create', 'Create a new image', 'إنشاء صورة جديدة'),
      option('rebuild', 'Rebuild a reference', 'إعادة بناء صورة مرجعية'),
      option('transform', 'Transform the style', 'تحويل الأسلوب البصري'),
      option('remix', 'Combine references', 'دمج مراجع متعددة'),
      option('analyze', 'Analyze a reference only', 'تحليل الصورة فقط')
    ] },
    { id: 'style', label: { en: 'How should it look?', ar: 'كيف تريد شكلها؟' }, kind: 'textarea', example: { en: "Example: warm studio light, matte materials, and a calm premium mood.", ar: "مثال: إضاءة استوديو دافئة وخامات مطفأة وأجواء راقية هادئة." }, optional: true, placeholder: { en: 'Describe the visual style, materials, light, or mood.', ar: 'صف الأسلوب والخامات والإضاءة أو الإحساس العام.' } },
    { id: 'usage', label: { en: 'Where will you use it?', ar: 'أين ستُستخدم الصورة؟' }, kind: 'text', optional: true, placeholder: { en: 'For example: Instagram story, product page, poster.', ar: 'مثال: قصة إنستغرام، صفحة منتج، ملصق.' } },
    { id: 'preserve', label: { en: 'What must stay recognizable?', ar: 'ما الذي يجب الحفاظ عليه؟' }, kind: 'textarea', example: { en: "Example: keep the product shape, label, and brand colors unchanged.", ar: "مثال: حافظ على شكل المنتج وملصقه وألوان العلامة." }, optional: true, placeholder: { en: 'Subject, identity, layout, text, or key details.', ar: 'العنصر أو الهوية أو التكوين أو النص أو التفاصيل المهمة.' } },
    { id: 'avoid', label: { en: 'What should be avoided?', ar: 'ما الذي يجب تجنبه؟' }, kind: 'textarea', example: { en: "Example: avoid extra text, distorted packaging, and unrelated props.", ar: "مثال: تجنب النصوص الإضافية أو العبوة المشوهة أو العناصر غير المرتبطة." }, optional: true, placeholder: { en: 'Unwanted objects, colors, or exaggerations.', ar: 'عناصر أو ألوان أو مبالغات لا تريدها.' } },
    { id: 'imageText', label: { en: 'Exact text to show in the image', ar: 'النص الحرفي داخل الصورة' }, kind: 'text', example: { en: "Example: New season, same great taste.", ar: "مثال: مذاق رائع في كل موسم." }, optional: true }
  ],
  campaign: [
    { id: 'product', label: { en: 'What is the product or offer?', ar: 'ما المنتج أو العرض؟' }, kind: 'textarea', example: { en: 'Example: a 3-month family membership with a free first consultation.', ar: 'مثال: اشتراك عائلي لمدة ٣ أشهر مع استشارة أولى مجانية.' } },
    { id: 'campaignGoal', label: { en: 'What is the campaign goal?', ar: 'ما هدف الحملة؟' }, kind: 'single', example: { en: 'Choose one outcome, such as sales, leads, or awareness.', ar: 'اختر نتيجة واحدة مثل المبيعات أو العملاء المحتملين أو الوعي.' }, options: [
      option('sales', 'Sales', 'مبيعات'), option('leads', 'Leads', 'عملاء محتملون'),
      option('awareness', 'Brand awareness', 'الوعي بالعلامة'), option('traffic', 'Visits or installs', 'زيارات أو تحميلات')
    ] },
    { id: 'audience', label: { en: 'Who is the audience, and where?', ar: 'من الجمهور وفي أي سوق؟' }, kind: 'textarea', example: { en: 'Example: parents in Riyadh looking for weekend activities.', ar: 'مثال: عائلات في الرياض تبحث عن أنشطة نهاية الأسبوع.' } },
    { id: 'channels', label: { en: 'Which channels should be considered?', ar: 'ما القنوات التي تريد دراستها؟' }, kind: 'multi', optional: true, example: { en: "Example: Meta and Google; select the channels you want considered.", ar: "مثال: Meta وGoogle؛ اختر القنوات التي تريد دراستها." }, options: [
      option('meta', 'Meta', 'Meta'), option('google', 'Google', 'Google'), option('tiktok', 'TikTok', 'TikTok'),
      option('whatsapp', 'WhatsApp', 'WhatsApp'), option('email', 'Email', 'البريد الإلكتروني'), option('linkedin', 'LinkedIn', 'LinkedIn')
    ] },
    { id: 'budget', label: { en: 'Budget and campaign duration', ar: 'الميزانية ومدة الحملة' }, kind: 'text', example: { en: "Example: 20,000 SAR over six weeks, if known.", ar: "مثال: ٢٠٬٠٠٠ ريال لمدة ستة أسابيع، إذا كانت المعلومة متاحة." }, optional: true },
    { id: 'assets', label: { en: 'What assets are available?', ar: 'ما المواد المتاحة؟' }, kind: 'textarea', example: { en: "Example: product photos, logo files, and approved offer wording.", ar: "مثال: صور المنتج وملفات الشعار وصياغة العرض المعتمدة." }, optional: true },
    { id: 'publishing', label: { en: 'Who will publish the campaign?', ar: 'من سيتولى نشر الحملة؟' }, kind: 'single', example: { en: "Choose who will publish or approve the campaign.", ar: "حدد من سينشر الحملة أو يعتمدها." }, options: [
      option('owner', 'I will publish it', 'سأتولى النشر بنفسي'),
      option('assisted', 'Prepare it for my approval', 'جهّزها لاعتمادها قبل النشر')
    ] }
  ],
  dashboard: [
    { id: 'decisions', label: { en: 'Which decisions should this dashboard support?', ar: 'ما القرارات التي ستدعمها لوحة البيانات؟' }, kind: 'textarea', example: { en: 'Example: compare weekly sales by branch and spot declining categories.', ar: 'مثال: مقارنة المبيعات الأسبوعية بين الفروع واكتشاف الفئات المتراجعة.' } },
    { id: 'users', label: { en: 'Who will use it?', ar: 'من سيستخدمها؟' }, kind: 'text', example: { en: 'Example: the sales manager and branch leads.', ar: 'مثال: مدير المبيعات ومسؤولو الفروع.' } },
    { id: 'metrics', label: { en: 'Which metrics matter?', ar: 'ما المؤشرات المهمة؟' }, kind: 'textarea', example: { en: "Example: revenue, conversion rate, and average order value.", ar: "مثال: الإيرادات ومعدل التحويل ومتوسط قيمة الطلب." }, optional: true },
    { id: 'dataSource', label: { en: 'Where does the data come from?', ar: 'من أين تأتي البيانات؟' }, kind: 'textarea', example: { en: "Example: monthly CSV exports with date, branch, category, and sales columns.", ar: "مثال: ملفات CSV شهرية تتضمن التاريخ والفرع والفئة والمبيعات." }, placeholder: { en: 'Files, database, or available columns.', ar: 'ملفات أو قاعدة بيانات أو أعمدة متاحة.' } },
    { id: 'format', label: { en: 'Preferred delivery format', ar: 'صيغة التسليم المفضلة' }, kind: 'single', optional: true, example: { en: "Choose the format your team can use and maintain.", ar: "اختر الصيغة التي يستطيع فريقك استخدامها وصيانتها." }, options: [
      option('excel', 'Excel workbook', 'ملف Excel'), option('html', 'Interactive web page', 'صفحة ويب تفاعلية'),
      option('bi', 'Power BI / Looker / Sheets', 'Power BI / Looker / Sheets'), option('recommend', 'Recommend a format', 'اقترح صيغة مناسبة')
    ] }
  ],
  general: [
    { id: 'outcome', label: { en: 'What should the finished work achieve?', ar: 'ما النتيجة التي تريد الوصول إليها؟' }, kind: 'textarea', example: { en: 'Example: explain the offer clearly and encourage qualified enquiries.', ar: 'مثال: شرح العرض بوضوح وتشجيع الاستفسارات المناسبة.' } },
    { id: 'success', label: { en: 'How will you know it worked?', ar: 'كيف ستعرف أن النتيجة ناجحة؟' }, kind: 'textarea', example: { en: "Example: the target audience understands the offer and knows the next step.", ar: "مثال: يفهم الجمهور المستهدف العرض ويعرف الخطوة التالية." }, optional: true },
    { id: 'constraints', label: { en: 'Any constraints or things to avoid?', ar: 'هل توجد قيود أو أمور يجب تجنبها؟' }, kind: 'textarea', example: { en: "Example: keep within the supplied brand guide and do not invent client names.", ar: "مثال: التزم بدليل الهوية المرفق ولا تخترع أسماء عملاء." }, optional: true }
  ]
};

export type ProjectAttachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: 'image' | 'text' | 'file';
  include: boolean;
  note: string;
  text?: string;
  dataUrl?: string;
  processing?: boolean;
};

export type ProjectDraft = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  step: 'home' | 'files' | 'details' | 'review' | 'result';
  taskType: TaskType;
  answers: Record<string, string | string[]>;
  attachments: ProjectAttachment[];
  activity: { at: string; action: string }[];
  generatedPrompt?: string;
};

export type UserProjectState = {
  version: 1;
  current: ProjectDraft;
  archived: ProjectDraft[];
};

export const detectTaskType = (idea: string): TaskType => {
  if (/داشبورد|dashboard|لوحة بيانات|تقرير|تحليل بيانات/i.test(idea)) return 'dashboard';
  if (/حملة|campaign|تسويق مدفوع|إعلانات ممولة|ad campaign/i.test(idea)) return 'campaign';
  if (/صور|صورة|تصميم|إعلان بصري|إعلان|اعلان|بوستر|لوجو|image|poster|visual/i.test(idea)) return 'image';
  return 'general';
};

const readAnswer = (answers: ProjectDraft['answers'], key: string): string => {
  const value = answers[key];
  return Array.isArray(value) ? value.join(', ') : String(value || '');
};

export const compileLookersPrompt = (project: ProjectDraft, lang: Lang): string => {
  const ar = lang === 'ar';
  const a = project.answers;
  const idea = readAnswer(a, 'idea').trim();
  const purpose = readAnswer(a, 'purpose').trim();
  const context = readAnswer(a, 'context').trim();
  const constraints = readAnswer(a, 'constraints').trim();
  const attachments = project.attachments.filter((file) => file.include);
  const title = ar ? 'Prompt — Lookers AI' : 'Prompt — Lookers AI';
  const sections: string[] = [
    title,
    '',
    ar ? '## الدور' : '## Role',
    ar ? 'أنت شريك تفكير ومنفّذ دقيق. استخدم المواصفات التالية كمصدر الحقيقة.' : 'You are a thoughtful partner and precise executor. Treat the following specification as the source of truth.',
    ar ? '- لا تخترع حقائق أو نتائج أو أرقامًا غير موجودة.' : '- Do not invent facts, results, or figures.',
    ar ? '- لا تدّعِ تنفيذ إجراء خارجي إلا إذا نفّذته أداة فعلية.' : '- Do not claim an external action was completed unless a real tool completed it.',
    ar ? '- اسأل عن المعلومة الناقصة فقط إذا كانت ستغيّر القرار أو تمنع التنفيذ.' : '- Ask for missing information only when it changes a decision or blocks execution.',
    '',
    ar ? '## المهمة' : '## Task',
    (ar ? 'الفكرة: ' : 'Idea: ') + (idea || (ar ? 'غير محددة' : 'Not specified')),
    (ar ? 'النتيجة المطلوبة: ' : 'Desired outcome: ') + (purpose || (ar ? 'استخلصها من الفكرة مع توضيح الافتراضات' : 'Infer it from the idea and state any assumptions')),
    context ? (ar ? 'السياق: ' : 'Context: ') + context : '',
    '',
    ar ? '## المتطلبات والقيود' : '## Requirements and constraints',
    constraints || (ar ? 'لا توجد قيود إضافية محددة.' : 'No additional constraints specified.'),
    '',
    ar ? '## معايير النجاح والسياق التنفيذي' : '## Success criteria and execution context',
    (ar ? 'معايير النجاح: ' : 'Success criteria: ') + (readAnswer(a, 'successCriteria') || (ar ? 'حدّدها من الهدف ولا تخترع نتائج.' : 'Derive them from the goal; do not invent outcomes.')),
    (ar ? 'مكان التنفيذ: ' : 'Execution location: ') + (readAnswer(a, 'location') || (ar ? 'غير محدد' : 'Not specified')),
    (ar ? 'الأدوات المتاحة: ' : 'Available tools: ') + (readAnswer(a, 'tools') || (ar ? 'لا توجد أدوات محددة' : 'No tools specified')),
    (ar ? 'الصلاحيات والموافقات: ' : 'Permissions and approvals: ') + (readAnswer(a, 'permissions') || (ar ? 'لا تفترض صلاحية إجراء خارجي أو نشر أو دفع.' : 'Do not assume permission for external actions, publishing, or spending.')),
    (ar ? 'حجم العمل: ' : 'Expected size: ') + (readAnswer(a, 'size') || (ar ? 'قدّره من النطاق واذكر سبب الاختيار.' : 'Estimate from scope and state why.')),
    (ar ? 'توقف واطلب مدخلات عند: ' : 'Stop and ask for input when: ') + (readAnswer(a, 'stopConditions') || (ar ? 'قرار جوهري أو موافقة خارجية مطلوبة أو معلومة حاسمة ناقصة.' : 'A material decision, external approval, or critical missing information.'))
  ];

  const type = project.taskType;
  if (type === 'image') {
    const action = readAnswer(a, 'action');
    const actionNames: Record<string, { en: string; ar: string }> = {
      create: { en: 'Create from scratch', ar: 'إنشاء من الصفر' },
      rebuild: { en: 'Rebuild the reference', ar: 'إعادة بناء المرجع' },
      transform: { en: 'Transform the style', ar: 'تحويل الأسلوب' },
      remix: { en: 'Combine references', ar: 'دمج المراجع' },
      analyze: { en: 'Analyze only', ar: 'تحليل فقط' }
    };
    sections.push('', ar ? '## وحدة الصورة' : '## Image module',
      (ar ? 'الإجراء: ' : 'Action: ') + (actionNames[action]?.[lang] || (ar ? 'يُحدَّد حسب الهدف' : 'Choose based on the goal')),
      (ar ? 'الأسلوب: ' : 'Visual style: ') + (readAnswer(a, 'style') || (ar ? 'اقترح أسلوبًا مناسبًا واذكر سبب الاختيار' : 'Recommend a suitable style and explain the choice')),
      (ar ? 'الاستخدام: ' : 'Usage: ') + (readAnswer(a, 'usage') || (ar ? 'غير محدد' : 'Not specified')),
      (ar ? 'حافظ على: ' : 'Preserve: ') + (readAnswer(a, 'preserve') || (ar ? 'العناصر الجوهرية التي يحددها المرجع أو المستخدم' : 'Core elements identified by the reference or user')),
      (ar ? 'تجنب: ' : 'Avoid: ') + (readAnswer(a, 'avoid') || (ar ? 'العناصر غير المطلوبة والمعلومات المختلقة' : 'Unwanted elements and invented information')),
      (readAnswer(a, 'imageText') ? (ar ? 'النص الحرفي داخل الصورة: ' : 'Exact text in image: ') + readAnswer(a, 'imageText') : ''),
      ar ? 'سلّم Prompt بصريًا جاهزًا للاستخدام. لا تقل إن الصورة أُنشئت ما لم تستخدم أداة صور فعلية.' : 'Deliver a ready-to-use visual prompt. Do not say an image was generated unless an image tool was actually used.'
    );
  } else if (type === 'campaign') {
    sections.push('', ar ? '## وحدة الحملة' : '## Campaign module',
      (ar ? 'المنتج أو العرض: ' : 'Product or offer: ') + readAnswer(a, 'product'),
      (ar ? 'الهدف: ' : 'Goal: ') + readAnswer(a, 'campaignGoal'),
      (ar ? 'الجمهور والسوق: ' : 'Audience and market: ') + readAnswer(a, 'audience'),
      (ar ? 'القنوات: ' : 'Channels: ') + (readAnswer(a, 'channels') || (ar ? 'اقترحها مع تبرير' : 'Recommend them with rationale')),
      (ar ? 'الميزانية والمدة: ' : 'Budget and duration: ') + (readAnswer(a, 'budget') || (ar ? 'غير محدد؛ لا تفترض أرقامًا' : 'Not specified; do not assume figures')),
      (ar ? 'المواد المتاحة: ' : 'Available assets: ') + readAnswer(a, 'assets'),
      ar ? 'رتّب العمل إلى استراتيجية، جمهور، عرض، توجه إبداعي، كتابة، بنية الحملة، خطة الإطلاق، القياس والتحسين. لا تنشر ولا تصرف ميزانية.' : 'Organize the work into strategy, audience, offer, creative direction, copy, campaign structure, launch plan, measurement, and optimization. Do not publish or spend budget.'
    );
  } else if (type === 'dashboard') {
    sections.push('', ar ? '## وحدة لوحة البيانات' : '## Dashboard module',
      (ar ? 'القرارات: ' : 'Decisions: ') + readAnswer(a, 'decisions'),
      (ar ? 'المستخدمون: ' : 'Users: ') + readAnswer(a, 'users'),
      (ar ? 'المؤشرات: ' : 'Metrics: ') + (readAnswer(a, 'metrics') || (ar ? 'اقترحها وعرّفها' : 'Recommend and define them')),
      (ar ? 'مصدر البيانات: ' : 'Data source: ') + readAnswer(a, 'dataSource'),
      (ar ? 'صيغة التسليم: ' : 'Delivery format: ') + readAnswer(a, 'format'),
      ar ? 'عرّف كل مؤشر بمعادلته ومصدره وتواتر تحديثه. افحص البيانات الفعلية ولا تعرض أرقامًا غير موجودة فيها.' : 'Define each metric with its formula, source, and update frequency. Inspect actual data and never display figures absent from it.'
    );
  } else {
    sections.push('', ar ? '## وحدة المهمة العامة' : '## General task module',
      (ar ? 'معيار النجاح: ' : 'Success criteria: ') + (readAnswer(a, 'success') || (ar ? 'استنتج اقتراحات وصرّح بها كافتراضات' : 'Suggest criteria and state them as assumptions'))
    );
  }

  if (attachments.length) {
    sections.push('', ar ? '## المراجع المرفقة' : '## Attached references');
    attachments.forEach((file) => sections.push(
      '- ' + file.name + ' (' + file.kind + ', ' + Math.round(file.size / 1024) + ' KB)' +
      (file.note ? ' — ' + file.note : '') +
      (file.text ? '\n  ' + (ar ? 'مقتطف مقروء: ' : 'Readable excerpt: ') + file.text.slice(0, 1200) : '')
    ));
    sections.push(ar
      ? 'استخدم المواد المرفقة مرجعًا. لا تفترض محتواها إذا لم تتمكن من فحصها.'
      : 'Use the attached materials as references. Do not assume their contents if you cannot inspect them.');
  }

  sections.push('', ar ? '## التسليم' : '## Deliverable',
    readAnswer(a, 'deliverable') || (ar ? 'قدّم النتيجة المطلوبة، ثم اذكر ما تم وما يحتاج إلى مدخلات أو مراجعة.' : 'Deliver the requested result, then state what is complete and what still needs input or review.')
  );
  return sections.filter((line) => line !== undefined && line !== null).join('\n');
};

export const createProjectDraft = (): ProjectDraft => {
  const now = new Date().toISOString();
  return {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
    title: '',
    createdAt: now,
    updatedAt: now,
    step: 'home',
    taskType: 'general',
    answers: {},
    attachments: [],
    activity: [{ at: now, action: 'project_created' }]
  };
};

export const emptyProjectState = (): UserProjectState => ({ version: 1, current: createProjectDraft(), archived: [] });
