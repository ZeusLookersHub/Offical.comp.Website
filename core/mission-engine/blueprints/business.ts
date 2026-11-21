import type { Blueprint } from '../types.ts';
import { avoid, brandName, c, facts, language, targetTool } from '../modules.ts';
import { makeTextMission, textControlRules, textDeliveryRules, textGates, textOutput, textToolOptions, textTools } from './_text.ts';

const company = (patch = {}): import('../types.ts').Slot => ({
  id: 'company', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1200,
  label: c('Business', 'النشاط'),
  question: c('What does the business do, for whom, and how does it make money?', 'النشاط بيعمل إيه، ولمين، وبيكسب فلوس إزاي؟'),
  why: c('Everything is built on this.', 'كل حاجة هتتبني على ده.'),
  example: c('An app that delivers home-cooked meals to office workers; 15% per order.', 'تطبيق بيوصّل أكل بيت للموظفين، وبناخد ١٥٪ من كل أوردر.'),
  vocabulary: { en: ['subscription', 'commission per order', 'marketplace', 'B2B', 'B2C', 'in Egypt', 'in the Gulf', 'online only'], ar: ['اشتراك شهري', 'عمولة على الأوردر', 'ماركت بليس', 'B2B', 'B2C', 'في مصر', 'في الخليج', 'أونلاين بس'] },
  ...patch,
});

/** Strategy — the flagship Business mission. */
export const growthStrategy: Blueprint = {
  id: 'growth-strategy',
  version: 1,
  title: c('Strategy', 'استراتيجية'),
  topics: ['growth-strategy'],
  intake: {
    question: c('Tell me about the business and the goal you want a strategy for.', 'احكيلي عن النشاط، والهدف اللي عايز استراتيجية علشانه.'),
    why: c('One message is enough. I will only ask about what is missing.', 'رسالة واحدة كفاية، وأنا هسألك بس على اللي ناقص.'),
    starters: [
      c('Double our clinic bookings in 6 months', 'نضاعف حجوزات العيادة في ٦ شهور'),
      c('Grow our online store from 100 to 1,000 orders a month', 'نكبّر المتجر من ١٠٠ لـ١٠٠٠ أوردر في الشهر'),
      c('A 90-day plan to launch in a new city', 'خطة ٩٠ يوم للتوسّع في مدينة جديدة'),
      c('Keep more subscribers from cancelling', 'نقلّل إلغاء الاشتراكات'),
    ],
  },
  questionBudget: 3,
  slots: [
    company(),
    {
      id: 'goal', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 300,
      label: c('Main goal', 'الهدف الأساسي'),
      question: c('What is the one main goal, and by when?', 'إيه الهدف الواحد الأساسي، وفي خلال قد إيه؟'),
      why: c('A single, timed goal keeps the strategy sharp.', 'هدف واحد بوقت محدد بيخلّي الاستراتيجية مركّزة.'),
      example: c('Double monthly revenue in 12 months.', 'نضاعف الإيراد الشهري في سنة.'),
      vocabulary: { en: ['double revenue', 'more customers', 'enter a new market', 'higher retention', 'cut cost', 'raise funding'], ar: ['نضاعف الإيراد', 'عملاء أكتر', 'سوق جديد', 'نقلّل الإلغاء', 'نقلّل التكلفة', 'نجمع تمويل'] },
    },
    {
      id: 'challenge', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 300,
      label: c('Biggest obstacle', 'أكبر عقبة'),
      question: c('What is standing in the way the most?', 'إيه أكتر حاجة واقفة في الطريق؟'),
      why: c('The strategy should attack the real bottleneck.', 'الاستراتيجية لازم تضرب العقبة الحقيقية.'),
      example: c('We get visitors but few of them buy.', 'بييجي زوار بس قليل اللي بيشتري.'),
      vocabulary: { en: ['low conversion', 'weak awareness', 'high churn', 'tough competition', 'thin margins', 'small team'], ar: ['تحويل ضعيف', 'وعي قليل', 'إلغاء عالي', 'منافسة قوية', 'هامش قليل', 'فريق صغير'] },
      noneLabel: c('We find it from the goal', 'هنحددها من الهدف'),
      defaults: [{ value: 'none', reason: c('We infer the likely bottleneck from the goal.', 'هنستنتج العقبة الأرجح من الهدف.') }],
    },
    {
      id: 'horizon', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Time horizon', 'المدى الزمني'),
      question: c('What horizon should the plan cover?', 'الخطة تغطي أي مدى؟'),
      why: c('The horizon decides how far to plan and how to phase it.', 'المدى بيحدد لحد فين نخطّط وإزاي نقسّمه مراحل.'),
      example: c('A 90-day plan.', 'خطة ٩٠ يوم.'),
      options: [
        { value: '30-day', label: c('30-day sprint', 'سبرينت ٣٠ يوم'), keywords: ['30 day', '30-day', 'month', 'شهر', '٣٠ يوم'] },
        { value: '90-day', label: c('90-day plan', 'خطة ٩٠ يوم'), keywords: ['90 day', '90-day', 'quarter', 'ربع سنة', '٩٠ يوم'] },
        { value: '1-year', label: c('1 year', 'سنة'), keywords: ['year', 'annual', 'سنة', 'سنوية'] },
        { value: '3-year', label: c('3 years', '٣ سنين'), keywords: ['3 years', 'long term', 'طويل المدى', '٣ سنين'] },
      ],
      defaults: [{ value: '90-day', reason: c('A 90-day plan is close enough to act on and far enough to matter.', 'خطة ٩٠ يوم قريبة كفاية إنك تتحرك بيها، وبعيدة كفاية إنها تفرق.') }],
    },
    {
      id: 'focus', kind: 'multi', layer: 'intelligence', importance: 'nice',
      label: c('Growth levers', 'محاور النمو'),
      question: c('Which levers should the strategy focus on?', 'الاستراتيجية تركّز على أنهي محاور؟'),
      why: c('Fewer, stronger levers beat trying everything.', 'محاور أقل وأقوى أحسن من إنك تجرّب كل حاجة.'),
      example: c('Getting new customers and keeping them.', 'جذب عملاء جدد والحفاظ عليهم.'),
      options: [
        { value: 'acquisition', label: c('Getting new customers', 'جذب عملاء جدد') },
        { value: 'retention', label: c('Keeping customers', 'الحفاظ على العملاء') },
        { value: 'pricing', label: c('Pricing & offers', 'التسعير والعروض') },
        { value: 'product', label: c('New product / feature', 'منتج / ميزة جديدة') },
        { value: 'partnerships', label: c('Partnerships', 'شراكات') },
        { value: 'content', label: c('Content & brand', 'المحتوى والبراند') },
        { value: 'paid-ads', label: c('Paid ads', 'إعلانات ممولة') },
        { value: 'ops', label: c('Operations & cost', 'التشغيل والتكلفة') },
      ],
      defaults: [{ value: ['acquisition', 'retention'], reason: c('Getting and keeping customers is the backbone of most growth.', 'جذب العملاء والحفاظ عليهم هما عمود أغلب النمو.') }],
    },
    brandName({ label: c('Business name', 'اسم النشاط') }),
    language(),
    avoid({ en: ['vague advice', 'buzzwords', 'tactics we cannot afford', 'copying a competitor blindly'], ar: ['نصايح عامة', 'كلام رنان', 'تكتيكات مش قادرين عليها', 'تقليد منافس أعمى'] }),
    targetTool(textToolOptions),
  ],
  output: textOutput('text-strategy',
    c('A layered prompt for a chat AI, a phased plan outline, what data you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وخطة مقسّمة مراحل، والمعلومات اللي لسه ناقصاك، وقائمة فحص.'),
    'planOutline', 'One line per phase: phase — the move and the metric it should change.'),
  gates: textGates('planOutline'),
  tools: textTools(),
  role: 'Senior growth strategist who has scaled startups and SMEs in MENA, and a prompt engineer for chat AIs.',
  strategy: {
    understanding: [
      'company, goal and challenge frame the strategy. The one goal in sections.goal is specific and timed; if the user gave no timeframe, use horizon.',
      'Name the single bottleneck the plan must break (from challenge, or inferred from the goal) — the plan attacks it first.',
    ],
    intelligence: [
      'Method: one measurable objective → 2–4 chosen levers (from focus) → phased priorities across the horizon → the metric each phase must move → the main risk and its early signal.',
      'sections.approach tells the AI to prefer a few high-leverage moves over a long list, to tie every move to a metric, and to sequence by impact and dependency.',
    ],
    control: textControlRules('the business name'),
    delivery: textDeliveryRules('planOutline', 'one line per phase: phase — the move and the metric it should change'),
  },
  examples: [{
    good: 'Objective: lift online orders from [current]/mo to [target]/mo in 90 days. Bottleneck: visitors don\'t convert. Phase 1 (wks 1–3): fix checkout + add reviews → conversion rate. Phase 2 (wks 4–8): retargeting + email flows → repeat rate. Risk: ad costs rise — watch CAC weekly.',
    bad: 'Grow fast by using social media, SEO, influencers, ads, email, partnerships, a new app, a loyalty program, and great content, and revenue will triple.',
    why: 'The bad one lists everything with no bottleneck, no sequence, no metrics, and invents a result.',
  }],
};

/** Business Plan. */
export const businessPlan: Blueprint = {
  id: 'business-plan',
  version: 1,
  title: c('Business plan', 'خطة عمل'),
  topics: ['business-plan'],
  intake: {
    question: c('Tell me about the business you want a plan for.', 'احكيلي عن النشاط اللي عايز خطة عمل ليه.'),
    why: c('One message is enough. Real numbers make the plan — we never invent them.', 'رسالة واحدة كفاية. الأرقام الحقيقية هي اللي بتعمل الخطة، وإحنا عمرنا ما هنألّفها.'),
    starters: [
      c('A coffee shop in New Cairo', 'كافيه في التجمع'),
      c('A home-cleaning service app', 'تطبيق خدمة تنظيف منازل'),
      c('An online store for handmade bags', 'متجر أونلاين لشنط هاند ميد'),
      c('A SaaS tool for clinics', 'نظام SaaS للعيادات'),
    ],
  },
  questionBudget: 3,
  slots: [
    company(),
    {
      id: 'stage', kind: 'single', layer: 'understanding', importance: 'important',
      label: c('Stage', 'المرحلة'),
      question: c('Where is the business now?', 'النشاط في أنهي مرحلة دلوقتي؟'),
      why: c('A plan for an idea differs from one for a running business.', 'خطة فكرة غير خطة نشاط شغّال.'),
      example: c('Just an idea.', 'لسه فكرة.'),
      options: [
        { value: 'idea', label: c('Idea', 'فكرة'), keywords: ['idea', 'فكرة'] },
        { value: 'launching', label: c('Launching soon', 'قرب الإطلاق'), keywords: ['launching', 'soon', 'قرب', 'هطلق'] },
        { value: 'running', label: c('Already running', 'شغّال بالفعل'), keywords: ['running', 'operating', 'شغال', 'بالفعل'] },
        { value: 'expanding', label: c('Expanding', 'بيتوسّع'), keywords: ['expanding', 'scaling', 'بيتوسع', 'توسّع'] },
      ],
    },
    facts('numbers', c('Real numbers', 'أرقام حقيقية'),
      c('Any real numbers you have? (costs, prices, customers, revenue)', 'عندك أرقام حقيقية؟ (تكاليف، أسعار، عملاء، إيرادات)'),
      c('Rent 15,000/mo, 60 orders/week at 120 each.', 'إيجار ١٥٠٠٠ شهري، و٦٠ أوردر في الأسبوع بـ١٢٠ للواحد.'), 'nice'),
    {
      id: 'audience', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 300,
      label: c('Customers', 'العملاء'),
      question: c('Who are the customers?', 'مين العملاء؟'),
      why: c('The plan sizes the market and the marketing around them.', 'الخطة بتقدّر السوق والتسويق على أساسهم.'),
      example: c('Busy office workers in Cairo.', 'موظفين مشغولين في القاهرة.'),
      vocabulary: { en: ['young professionals', 'families', 'small businesses', 'students', 'tourists', 'in the Gulf'], ar: ['شباب بيشتغلوا', 'أسر', 'شركات صغيرة', 'طلبة', 'سياح', 'في الخليج'] },
      noneLabel: c('Placeholder to fill', 'مكان فاضي تكمّله'),
      defaults: [{ value: 'none', reason: c('We leave a [target customer] placeholder.', 'هنسيب مكان [العميل المستهدف] تكمّله.') }],
    },
    brandName({ label: c('Business name', 'اسم النشاط') }),
    language(),
    targetTool(textToolOptions),
  ],
  output: textOutput('text-business-plan',
    c('A layered prompt for a chat AI, the plan outline, what data you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وترتيب أقسام الخطة، والمعلومات اللي لسه ناقصاك، وقائمة فحص.'),
    'planOutline', 'One title per plan section, in order.'),
  gates: textGates('planOutline'),
  tools: textTools(),
  role: 'Senior business consultant who writes investor- and bank-ready plans for MENA SMEs, and a prompt engineer for chat AIs.',
  strategy: {
    understanding: [
      'company and stage frame the plan; numbers is the only source of figures. audience sizes the market section.',
      'sections.goal states what the business does, its stage, and who the plan is for (owner, bank, investor).',
    ],
    intelligence: [
      'Use a standard plan structure fit to stage: summary, problem & solution, product/service, market & customers, competition, marketing & sales, operations, team, financial plan, milestones, risks. Idea-stage leans on problem, market and model; running businesses on traction and financials.',
      'sections.approach tells the AI: one clear idea per section, realistic and specific, and tie claims to the provided numbers or mark them as assumptions.',
    ],
    control: textControlRules('the business name'),
    delivery: textDeliveryRules('planOutline', 'one title per plan section, in order'),
  },
  examples: [{
    good: 'Financial plan: use only these — rent 15,000 EGP/mo, 60 orders/wk at 120 EGP. For staff cost and CAC write [staff cost] and [CAC]. Break-even computed from the given numbers only.',
    bad: 'A profitable coffee shop making 500,000 EGP/month with 2000 daily customers and 80% margins.',
    why: 'The bad one invents revenue, customers and margins instead of using the real numbers and placeholders.',
  }],
};

/** Feasibility study. */
export const feasibilityStudy: Blueprint = {
  id: 'feasibility-study',
  version: 1,
  title: c('Feasibility study', 'دراسة جدوى'),
  topics: ['feasibility-study'],
  intake: {
    question: c('Tell me about the project you want to test for feasibility.', 'احكيلي عن المشروع اللي عايز تدرس جدواه.'),
    why: c('One message is enough. Real costs and prices make the study; we never invent them.', 'رسالة واحدة كفاية. التكاليف والأسعار الحقيقية هي اللي بتعمل الدراسة، وإحنا ما بنألّفش.'),
    starters: [
      c('Opening a gym in Nasr City', 'فتح جيم في مدينة نصر'),
      c('A cloud kitchen for 3 brands', 'مطبخ سحابي لـ٣ براندات'),
      c('Importing and selling a product online', 'استيراد منتج وبيعه أونلاين'),
      c('A padel courts business', 'مشروع ملاعب بادل'),
    ],
  },
  questionBudget: 3,
  slots: [
    {
      id: 'idea', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1000,
      label: c('Project', 'المشروع'),
      question: c('What is the project, where, and how does it earn?', 'المشروع إيه، فين، وبيكسب إزاي؟'),
      why: c('The study is built entirely on this.', 'الدراسة كلها هتتبني على ده.'),
      example: c('A 200 m² gym in Nasr City, monthly memberships.', 'جيم ٢٠٠ متر في مدينة نصر، اشتراكات شهرية.'),
      vocabulary: { en: ['monthly subscription', 'per-session', 'retail', 'wholesale', 'delivery', 'rented space', 'in Cairo'], ar: ['اشتراك شهري', 'بالجلسة', 'تجزئة', 'جملة', 'توصيل', 'مكان إيجار', 'في القاهرة'] },
    },
    facts('costs', c('Known costs', 'التكاليف المعروفة'),
      c('Which real costs do you know? (rent, equipment, salaries, materials)', 'إيه التكاليف الحقيقية اللي تعرفها؟ (إيجار، معدات، رواتب، خامات)'),
      c('Rent 40,000/mo, equipment 300,000 once, 4 staff.', 'إيجار ٤٠٠٠٠ شهري، معدات ٣٠٠٠٠٠ مرة واحدة، ٤ موظفين.')),
    facts('revenue', c('Expected pricing', 'التسعير المتوقع'),
      c('What will you charge, and roughly how many customers?', 'هتاخد كام، وتقريباً كام عميل؟'),
      c('Membership 600/mo, aiming for 200 members.', 'الاشتراك ٦٠٠ شهري، ومستهدف ٢٠٠ عضو.'), 'nice'),
    brandName({ label: c('Project name', 'اسم المشروع') }),
    language(),
    targetTool(textToolOptions),
  ],
  output: textOutput('text-feasibility',
    c('A layered prompt for a chat AI, the study outline, what numbers you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وترتيب أقسام الدراسة، والأرقام اللي لسه ناقصاك، وقائمة فحص.'),
    'studyOutline', 'One title per study section, in order.'),
  gates: textGates('studyOutline'),
  tools: textTools(),
  role: 'Senior feasibility analyst for new ventures in MENA, and a prompt engineer for chat AIs.',
  strategy: {
    understanding: [
      'idea defines the venture; costs and revenue are the only figures allowed. Keep the location and model exactly as given.',
      'sections.goal states the project, where it is, and the decision the study informs (go / no-go).',
    ],
    intelligence: [
      'Structure: overview, market demand, operating model, startup costs, running costs, revenue model, break-even and simple cash view, risks, and a clear go/no-go recommendation framed on the numbers.',
      'sections.approach tells the AI to compute only from the provided numbers, show the break-even formula, and mark every missing figure as a [placeholder] assumption — never a guessed value.',
    ],
    control: textControlRules('the project name'),
    delivery: textDeliveryRules('studyOutline', 'one title per study section, in order'),
  },
  examples: [{
    good: 'Break-even = fixed costs ÷ (price − variable cost). Use rent 40,000/mo and membership 600. For variable cost per member write [variable cost]. State the member count needed to break even from these.',
    bad: 'This gym will make 500,000 EGP monthly profit with 1000 members in the first month — highly profitable.',
    why: 'The bad one invents members and profit instead of computing break-even from the real numbers with placeholders.',
  }],
};

/** Competitor analysis. */
export const competitorAnalysis: Blueprint = {
  id: 'competitor-analysis',
  version: 1,
  title: c('Competitor analysis', 'تحليل منافسين'),
  topics: ['competitor-analysis'],
  intake: {
    question: c('Tell me about your business and who you compete with.', 'احكيلي عن نشاطك، وبتنافس مين.'),
    why: c('One message is enough. I will only ask about what is missing.', 'رسالة واحدة كفاية، وأنا هسألك بس على اللي ناقص.'),
    starters: [
      c('My coffee shop vs two nearby cafes', 'الكافيه بتاعي ضد كافيهين جنبي'),
      c('Our app vs the top 3 in the market', 'تطبيقنا ضد أكبر ٣ في السوق'),
      c('My online store vs bigger brands', 'متجري ضد براندات أكبر'),
      c('Where we stand against competitors', 'مكاننا وسط المنافسين'),
    ],
  },
  questionBudget: 3,
  slots: [
    {
      id: 'offer', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 800,
      label: c('Your offer', 'عرضك'),
      question: c('What do you offer, and to whom?', 'إنت بتقدّم إيه، ولمين؟'),
      why: c('We compare competitors against what you actually offer.', 'بنقارن المنافسين بالنسبة للي إنت بتقدّمه فعلاً.'),
      example: c('Specialty coffee and a quiet work space for students.', 'قهوة مختصة ومكان هادي للمذاكرة للطلبة.'),
      vocabulary: { en: ['premium', 'budget', 'fast delivery', 'better quality', 'local', 'for businesses'], ar: ['فاخر', 'اقتصادي', 'توصيل سريع', 'جودة أعلى', 'محلي', 'للشركات'] },
    },
    {
      id: 'competitors', kind: 'longtext', layer: 'understanding', importance: 'important', maxLength: 600,
      label: c('Competitors', 'المنافسين'),
      question: c('Who are the main competitors? Name them if you can.', 'مين أهم المنافسين؟ سمّيهم لو تقدر.'),
      why: c('Named competitors give a sharper, real comparison.', 'المنافسين بأسمائهم بيدّوا مقارنة أدق وحقيقية.'),
      example: c('Costa, and a local cafe called Beans.', 'كوستا، وكافيه محلي اسمه Beans.'),
      noneLabel: c('Placeholders to fill', 'أماكن فاضية تكمّلها'),
      defaults: [{ value: 'none', reason: c('We leave [competitor 1..3] for you to fill.', 'هنسيب [منافس ١..٣] تكمّلهم انت.') }],
    },
    {
      id: 'dimensions', kind: 'multi', layer: 'intelligence', importance: 'nice',
      label: c('Compare on', 'نقارن على'),
      question: c('Which dimensions matter most to compare on?', 'أنهي جوانب أهم نقارن عليها؟'),
      why: c('Comparing on a few decisive dimensions beats a long table.', 'المقارنة على جوانب قليلة حاسمة أحسن من جدول طويل.'),
      example: c('Price, quality and location.', 'السعر والجودة والمكان.'),
      options: [
        { value: 'price', label: c('Price', 'السعر') },
        { value: 'quality', label: c('Quality', 'الجودة') },
        { value: 'features', label: c('Features / menu', 'المميزات / المنيو') },
        { value: 'audience', label: c('Target audience', 'الجمهور') },
        { value: 'marketing', label: c('Marketing & brand', 'التسويق والبراند') },
        { value: 'location', label: c('Location / reach', 'المكان / الانتشار') },
        { value: 'service', label: c('Service & speed', 'الخدمة والسرعة') },
      ],
      defaults: [{ value: ['price', 'quality', 'audience'], reason: c('Price, quality and audience usually decide the market.', 'السعر والجودة والجمهور عادةً هما اللي بيحسموا السوق.') }],
    },
    brandName({ label: c('Your business name', 'اسم نشاطك') }),
    language(),
    targetTool(textToolOptions),
  ],
  output: textOutput('text-competitor',
    c('A layered prompt for a chat AI, a comparison outline, what to research, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وترتيب المقارنة، واللي محتاج تبحث عنه، وقائمة فحص.'),
    'comparisonOutline', 'One line per competitor or dimension, in order.'),
  gates: textGates('comparisonOutline'),
  tools: textTools(),
  role: 'Senior market analyst who benchmarks SMEs against their competitors, and a prompt engineer for chat AIs.',
  strategy: {
    understanding: [
      'offer is the baseline; competitors are compared against it on the chosen dimensions. Keep named competitors exactly as given.',
      'sections.goal states your offer, the competitors, and the decision the comparison informs (where to differentiate).',
    ],
    intelligence: [
      'Produce a comparison across the chosen dimensions, then your strengths, their strengths, gaps you can own, and 2–3 concrete moves to stand out.',
      'sections.approach tells the AI to be specific and fair, to mark any fact it is unsure of as [to verify], and never to invent competitor prices, ratings or numbers.',
    ],
    control: textControlRules('your business name and any named competitor'),
    delivery: textDeliveryRules('comparisonOutline', 'one line per competitor or dimension, in order'),
  },
  examples: [{
    good: 'Compare you vs "Costa" and "Beans" on price, quality, audience. For any price or rating you did not give, write [to verify]. End with 3 gaps you can own (e.g. quiet study space none of them offer).',
    bad: 'Costa charges 85 EGP, has 4.2 stars and 40% market share; you are cheaper and better in every way.',
    why: 'The bad one invents prices, ratings and market share, and is one-sided instead of fair.',
  }],
};


const crit = (id: string, label: import('../types.ts').Copy, question: import('../types.ts').Copy, example: import('../types.ts').Copy, vocab: { en: string[]; ar: string[] }): import('../types.ts').Slot => ({
  id, kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1000,
  label, question, why: c('Everything is built on this.', 'كل حاجة هتتبني على ده.'), example, vocabulary: vocab,
});

export const pricingStrategy = makeTextMission({
  id: 'pricing-strategy', title: c('Pricing', 'تسعير'), topics: ['pricing-strategy'],
  intake: { question: c('Tell me what you sell and what it costs you.', 'قولّي بتبيع إيه، وبيكلّفك كام.'), why: c('Real costs make the pricing; we never invent them.', 'التكلفة الحقيقية هي اللي بتعمل التسعير، وما بنألّفش.'),
    starters: [c('Pricing for my coffee subscription', 'تسعير اشتراك القهوة بتاعي'), c('How to price my design service', 'أسعّر خدمة التصميم إزاي'), c('Tiers for my SaaS tool', 'باقات لنظام الـSaaS بتاعي'), c('Price a new product I import', 'سعر منتج جديد بستورده')] },
  slots: [
    crit('product', c('Product & cost', 'المنتج والتكلفة'), c('What do you sell, and what does one unit cost you?', 'بتبيع إيه، والوحدة بتكلّفك كام؟'), c('Handmade candles, 35 EGP cost each.', 'شمع هاند ميد، تكلفة الواحدة ٣٥ جنيه.'), { en: ['per unit cost', 'service by hour', 'subscription', 'includes delivery', 'imported'], ar: ['تكلفة الوحدة', 'خدمة بالساعة', 'اشتراك', 'شامل التوصيل', 'مستورد'] }),
    { id: 'model', kind: 'single', layer: 'intelligence', importance: 'important', label: c('Pricing model', 'نموذج التسعير'), question: c('Which pricing model fits?', 'أنهي نموذج تسعير يناسب؟'), why: c('The model shapes the whole price structure.', 'النموذج بيحدد شكل التسعير كله.'), example: c('Tiered packages.', 'باقات متدرجة.'),
      options: [{ value: 'one-time', label: c('One-time price', 'سعر لمرة') }, { value: 'subscription', label: c('Subscription', 'اشتراك') }, { value: 'tiered', label: c('Tiered packages', 'باقات متدرجة') }, { value: 'usage', label: c('Pay per use', 'دفع حسب الاستخدام') }, { value: 'value', label: c('Value / custom quote', 'حسب القيمة / عرض سعر') }],
      defaults: [{ value: 'tiered', reason: c('Tiers suit most products and lift average price.', 'الباقات بتناسب أغلب المنتجات وبترفع متوسط السعر.') }] },
    { id: 'market', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 300, label: c('Buyers & competitor prices', 'العملاء وأسعار المنافسين'), question: c('Who buys, and what do competitors charge?', 'مين بيشتري، والمنافسين بياخدوا كام؟'), why: c('Price sits between your cost and the market.', 'السعر بيقع بين تكلفتك والسوق.'), example: c('Students; competitors 60–90 EGP.', 'طلبة؛ المنافسين ٦٠–٩٠ جنيه.'), noneLabel: c('Placeholder to fill', 'مكان فاضي'), defaults: [{ value: 'none', reason: c('We leave [competitor price range] to fill.', 'هنسيب [نطاق أسعار المنافسين] تكمّله.') }] },
  ],
  nameLabel: c('Business name', 'اسم النشاط'), nameWhat: 'the business name',
  avoidVocab: { en: ['pricing below cost', 'too many tiers', 'hidden fees', 'guessed competitor prices'], ar: ['سعر تحت التكلفة', 'باقات كتير', 'رسوم مخفية', 'أسعار منافسين متخمّنة'] },
  outlineKey: 'priceOutline', outlineDesc: 'One line per price point or tier: name — price basis and what it includes.', outlineWhat: 'one line per price point or tier',
  outputDescription: c('A layered prompt for a chat AI, a price/tier outline, what to research, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وترتيب الأسعار/الباقات، واللي محتاج تبحث عنه، وقائمة فحص.'),
  role: 'Senior pricing strategist for SMEs, and a prompt engineer for chat AIs.',
  understanding: ['product gives the unit cost (the only cost figure allowed); model and market shape the structure. Keep costs exactly as given.', 'sections.goal states what is sold, the cost, and the decision (set or revise prices).'],
  intelligence: ['Build from cost-plus and value: a floor from cost, a ceiling from the market, then the chosen model’s structure (tiers/anchor/good-better-best). Explain the logic of each price.', 'sections.approach tells the AI to never price below cost, to anchor with a premium option, and to mark any unknown competitor price as [to verify].'],
  examples: [{ good: 'Floor = cost 35 EGP. Good/Better/Best at [x]/[y]/[z]; anchor Best high. For competitor range write [competitor price].', bad: 'Sell candles at 500 EGP, everyone will buy, 95% margin guaranteed.', why: 'The bad one ignores cost and market and invents margin and demand.' }],
});

export const swotAnalysis = makeTextMission({
  id: 'swot-analysis', title: c('SWOT analysis', 'تحليل SWOT'), topics: ['swot-analysis'],
  intake: { question: c('Tell me about the business you want a SWOT for.', 'احكيلي عن النشاط اللي عايز تعمل له SWOT.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('SWOT for my restaurant', 'SWOT للمطعم بتاعي'), c('SWOT before launching an app', 'SWOT قبل إطلاق تطبيق'), c('Where my store is strong and weak', 'مكان قوة وضعف متجري'), c('SWOT vs a bigger competitor', 'SWOT في مواجهة منافس أكبر')] },
  slots: [
    company(),
    { id: 'context', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 300, label: c('Situation', 'الموقف'), question: c('Any decision or market context behind this?', 'في قرار أو سياق سوق ورا ده؟'), why: c('SWOT is sharper tied to a decision.', 'الـSWOT بيبقى أدق لما يكون مربوط بقرار.'), example: c('Deciding whether to open a second branch.', 'بنقرر نفتح فرع تاني ولا لأ.'), noneLabel: c('General SWOT', 'SWOT عام'), defaults: [{ value: 'none', reason: c('We do a general SWOT for the business.', 'هنعمل SWOT عام للنشاط.') }] },
  ],
  nameLabel: c('Business name', 'اسم النشاط'), nameWhat: 'the business name',
  avoidVocab: { en: ['vague points', 'repeating the same point', 'fake external threats'], ar: ['نقاط عامة', 'تكرار نفس النقطة', 'تهديدات متألفة'] },
  outlineKey: 'swotOutline', outlineDesc: 'Four blocks in order: Strengths, Weaknesses, Opportunities, Threats — each a short line.', outlineWhat: 'four blocks: strengths, weaknesses, opportunities, threats',
  outputDescription: c('A layered prompt for a chat AI, a SWOT outline, what to confirm, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وترتيب الـSWOT، واللي محتاج تتأكد منه، وقائمة فحص.'),
  role: 'Senior business analyst, and a prompt engineer for chat AIs.',
  understanding: ['company frames it; context ties it to a decision. Use only facts given; mark guesses as [to verify].', 'sections.goal states the business and the decision the SWOT informs.'],
  intelligence: ['Strengths/Weaknesses are internal, Opportunities/Threats external — keep them in the right box, specific and non-overlapping, and end with 2–3 moves the SWOT implies.', 'sections.approach tells the AI to make each point concrete and actionable, not generic.'],
  examples: [{ good: 'Strengths: loyal regulars, prime corner. Weaknesses: one small kitchen. Opportunities: office lunch demand nearby. Threats: new chain opening [to verify]. Moves: add lunch delivery.', bad: 'Strengths: good. Weaknesses: bad. Opportunities: grow. Threats: competition.', why: 'The bad one is vague and says nothing specific or actionable.' }],
});

export const goToMarket = makeTextMission({
  id: 'go-to-market', title: c('Go-to-market', 'خطة دخول السوق'), topics: ['go-to-market'],
  intake: { question: c('Tell me what you are launching and to whom.', 'قولّي بتطلق إيه، ولمين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Launch my app in Cairo', 'أطلق تطبيقي في القاهرة'), c('Enter the Gulf market', 'أدخل سوق الخليج'), c('First 100 customers for my service', 'أول ١٠٠ عميل لخدمتي'), c('Launch a new product line', 'أطلق خط منتجات جديد')] },
  slots: [
    crit('product', c('What you launch', 'اللي بتطلقه'), c('What are you launching, where, and to whom?', 'بتطلق إيه، فين، ولمين؟'), c('A food-delivery app in Cairo for office workers.', 'تطبيق توصيل أكل في القاهرة للموظفين.'), { en: ['new product', 'new market', 'new feature', 'in Egypt', 'in the Gulf', 'for businesses'], ar: ['منتج جديد', 'سوق جديد', 'ميزة جديدة', 'في مصر', 'في الخليج', 'للشركات'] }),
    { id: 'channels', kind: 'multi', layer: 'intelligence', importance: 'nice', label: c('Channels', 'القنوات'), question: c('Which channels can you reach customers through?', 'تقدر توصل للعملاء من أنهي قنوات؟'), why: c('Fewer, right channels beat being everywhere.', 'قنوات أقل وصح أحسن من إنك تبقى في كل مكان.'), example: c('Instagram and partnerships.', 'إنستجرام وشراكات.'),
      options: [{ value: 'social', label: c('Social media', 'سوشيال ميديا') }, { value: 'paid-ads', label: c('Paid ads', 'إعلانات ممولة') }, { value: 'partnerships', label: c('Partnerships', 'شراكات') }, { value: 'influencers', label: c('Influencers', 'مؤثرين') }, { value: 'referrals', label: c('Referrals', 'ترشيحات') }, { value: 'content', label: c('Content & SEO', 'محتوى وSEO') }, { value: 'offline', label: c('Offline / events', 'أرض الواقع / فعاليات') }],
      defaults: [{ value: ['social', 'partnerships'], reason: c('Social plus partnerships is the cheapest fast start for most.', 'السوشيال مع الشراكات أرخص بداية سريعة لأغلب الحالات.') }] },
  ],
  nameLabel: c('Name', 'الاسم'), nameWhat: 'the product or business name',
  avoidVocab: { en: ['every channel at once', 'vague milestones', 'copying a competitor', 'no success metric'], ar: ['كل القنوات مرة واحدة', 'أهداف غير واضحة', 'تقليد منافس', 'من غير مقياس نجاح'] },
  outlineKey: 'gtmOutline', outlineDesc: 'One line per phase: phase — the audience, the channel and the metric.', outlineWhat: 'one line per launch phase',
  outputDescription: c('A layered prompt for a chat AI, a phased launch outline, what to prepare, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وخطة إطلاق مقسّمة مراحل، واللي محتاج تجهّزه، وقائمة فحص.'),
  role: 'Senior go-to-market strategist, and a prompt engineer for chat AIs.',
  understanding: ['product defines what, where and for whom; channels are the reachable routes. Keep the market and audience exactly as given.', 'sections.goal states the launch and the first success metric (e.g. first 100 customers).'],
  intelligence: ['Phase it: pre-launch (positioning, waitlist), launch (the 1–2 strongest channels, the offer), post-launch (retention, referrals). Tie each phase to one metric.', 'sections.approach tells the AI to pick the 1–2 highest-leverage channels for this audience, not a long list.'],
  examples: [{ good: 'Phase 1 pre-launch: waitlist via Instagram → signups. Phase 2 launch: partner with 3 offices + launch offer → first [N] orders. Phase 3: referral reward → repeat rate.', bad: 'Use TikTok, Instagram, Google, billboards, radio, influencers, email and SEO on day one and go viral.', why: 'The bad one spreads across every channel with no phasing or metric and invents virality.' }],
});

export const financialPlan = makeTextMission({
  id: 'financial-plan', title: c('Financial plan', 'خطة مالية'), topics: ['financial-plan'],
  intake: { question: c('Tell me about the business and the numbers you have.', 'احكيلي عن النشاط والأرقام اللي عندك.'), why: c('Real numbers make the plan; we never invent them.', 'الأرقام الحقيقية هي اللي بتعمل الخطة، وما بنألّفش.'),
    starters: [c('A 12-month forecast for my shop', 'توقّع ١٢ شهر للمحل بتاعي'), c('Costs and break-even for a cafe', 'تكاليف ونقطة تعادل لكافيه'), c('Budget for my startup', 'ميزانية للستارت أب بتاعي'), c('Cash flow for a new project', 'تدفق نقدي لمشروع جديد')] },
  slots: [
    company(),
    facts('numbers', c('Real numbers', 'أرقام حقيقية'), c('Which real numbers do you have? (costs, prices, sales)', 'إيه الأرقام الحقيقية اللي عندك؟ (تكاليف، أسعار، مبيعات)'), c('Rent 20,000/mo, 500 sales/mo at 80 each.', 'إيجار ٢٠٠٠٠ شهري، و٥٠٠ بيعة شهري بـ٨٠ للواحدة.')),
  ],
  nameLabel: c('Business name', 'اسم النشاط'), nameWhat: 'the business name',
  avoidVocab: { en: ['invented revenue', 'optimistic guesses', 'round made-up numbers', 'hidden costs'], ar: ['إيرادات متألفة', 'تخمينات متفائلة', 'أرقام مدوّرة متألفة', 'تكاليف مخفية'] },
  outlineKey: 'financeOutline', outlineDesc: 'One title per section: revenue, costs, profit, break-even, cash flow, assumptions.', outlineWhat: 'one title per financial section',
  outputDescription: c('A layered prompt for a chat AI, the plan outline, the numbers you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وترتيب أقسام الخطة، والأرقام اللي لسه ناقصاك، وقائمة فحص.'),
  role: 'Senior financial analyst for SMEs, and a prompt engineer for chat AIs.',
  understanding: ['company and numbers are the basis; numbers is the only source of figures. Keep every figure exactly as given.', 'sections.goal states the business and the horizon (e.g. 12 months) and purpose (budget, forecast, break-even).'],
  intelligence: ['Build revenue, fixed/variable costs, profit, break-even and a simple monthly cash view — computed only from the given numbers, with formulas shown. Every missing input is a [placeholder] assumption.', 'sections.approach tells the AI to never invent revenue or growth and to list assumptions explicitly.'],
  examples: [{ good: 'Revenue = 500 × 80. Costs: rent 20,000 + [variable cost]. Break-even = fixed ÷ (price − variable). Show months to break even from these.', bad: 'Revenue grows 50% monthly to 2M by month 6 with 90% margins.', why: 'The bad one invents growth, revenue and margins instead of computing from real numbers.' }],
});

export const brandPositioning = makeTextMission({
  id: 'brand-positioning', title: c('Brand positioning', 'تموضع البراند'), topics: ['brand-positioning'],
  intake: { question: c('Tell me what you offer and who it is for.', 'قولّي بتقدّم إيه، ولمين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Position my coffee brand', 'أموضع براند القهوة بتاعي'), c('What makes my app different', 'إيه اللي بيميّز تطبيقي'), c('A clear positioning statement', 'جملة تموضع واضحة'), c('Stand out from bigger competitors', 'أتميّز عن منافسين أكبر')] },
  slots: [
    crit('offer', c('Your offer & audience', 'عرضك وجمهورك'), c('What do you offer, and who is it for?', 'بتقدّم إيه، ولمين؟'), c('Specialty coffee for students who study in cafes.', 'قهوة مختصة لطلبة بيذاكروا في الكافيهات.'), { en: ['premium', 'affordable', 'for students', 'for businesses', 'local', 'fast'], ar: ['فاخر', 'في المتناول', 'للطلبة', 'للشركات', 'محلي', 'سريع'] }),
    { id: 'differentiator', kind: 'text', layer: 'intelligence', importance: 'important', maxLength: 300, label: c('What makes you different', 'اللي بيميّزك'), question: c('What do you do better or differently?', 'بتعمل إيه أحسن أو مختلف؟'), why: c('Positioning lives on a real, ownable difference.', 'التموضع بيعيش على فرق حقيقي تقدر تمتلكه.'), example: c('The only quiet study-friendly cafe in the area.', 'الكافيه الهادي الوحيد المناسب للمذاكرة في المنطقة.'), noneLabel: c('We find it from your offer', 'هنحدده من عرضك'), defaults: [{ value: 'none', reason: c('We draw the difference from your offer and audience.', 'هنطلّع الفرق من عرضك وجمهورك.') }] },
  ],
  nameLabel: c('Brand name', 'اسم البراند'), nameWhat: 'the brand name',
  avoidVocab: { en: ['generic claims', 'best quality clichés', 'copying a competitor', 'being everything to everyone'], ar: ['ادعاءات عامة', 'كليشيه أفضل جودة', 'تقليد منافس', 'تكون كل حاجة للكل'] },
  outlineKey: 'positioningOutline', outlineDesc: 'Lines in order: target, category, key difference, reason to believe, positioning statement.', outlineWhat: 'the positioning building blocks in order',
  outputDescription: c('A layered prompt for a chat AI, the positioning building blocks, what to confirm, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، ومكوّنات التموضع، واللي محتاج تتأكد منه، وقائمة فحص.'),
  role: 'Senior brand strategist, and a prompt engineer for chat AIs.',
  understanding: ['offer and differentiator define it. Keep the audience and difference exactly as given; never invent claims.', 'sections.goal states the offer, the audience, and that we want a clear positioning.'],
  intelligence: ['Build: for [target] who [need], [brand] is the [category] that [key difference], because [reason to believe]. One sharp statement, not a list of adjectives.', 'sections.approach tells the AI to pick one ownable difference and make it concrete and believable.'],
  examples: [{ good: 'For students who study out of home, "Beans" is the neighbourhood cafe built for focus — quiet zones, power at every seat — because it was designed around studying, not just coffee.', bad: '"Beans" is the best, highest-quality, most affordable, most premium coffee for everyone.', why: 'The bad one is contradictory, generic, and targets everyone.' }],
});

export const businessModel = makeTextMission({
  id: 'business-model', title: c('Business model', 'نموذج العمل'), topics: ['business-model'],
  intake: { question: c('Tell me about your business idea.', 'احكيلي عن فكرة نشاطك.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A model for my delivery app', 'نموذج لتطبيق التوصيل بتاعي'), c('How my marketplace makes money', 'الماركت بليس بتاعي بيكسب إزاي'), c('A business model canvas for my idea', 'بيزنس موديل كانفاس لفكرتي'), c('Turn my idea into a model', 'أحوّل فكرتي لنموذج')] },
  slots: [
    crit('idea', c('Your idea', 'فكرتك'), c('What is the idea, and who is it for?', 'الفكرة إيه، ولمين؟'), c('An app connecting home cooks with office workers.', 'تطبيق بيوصّل طبّاخين البيت بالموظفين.'), { en: ['marketplace', 'subscription', 'commission', 'B2B', 'B2C', 'two-sided'], ar: ['ماركت بليس', 'اشتراك', 'عمولة', 'B2B', 'B2C', 'طرفين'] }),
  ],
  nameLabel: c('Name', 'الاسم'), nameWhat: 'the business name',
  avoidVocab: { en: ['vague revenue', 'too many revenue streams', 'copying a known app blindly'], ar: ['إيراد غامض', 'مصادر دخل كتير', 'تقليد تطبيق معروف أعمى'] },
  outlineKey: 'modelOutline', outlineDesc: 'The business model canvas blocks in order, each a short line.', outlineWhat: 'the business model canvas blocks in order',
  outputDescription: c('A layered prompt for a chat AI, a business-model canvas outline, open questions, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وترتيب كانفاس نموذج العمل، وأسئلة مفتوحة، وقائمة فحص.'),
  role: 'Senior startup advisor who maps business models, and a prompt engineer for chat AIs.',
  understanding: ['idea defines the venture. Keep who it is for and how it earns exactly as given; mark unknowns as [to decide].', 'sections.goal states the idea and that we want a clear model (how it creates and captures value).'],
  intelligence: ['Use the business model canvas: value proposition, customer segments, channels, relationships, revenue streams, key resources, activities, partners, cost structure. Keep revenue to 1–2 clear streams.', 'sections.approach tells the AI to make each block specific to this idea, not generic canvas filler.'],
  examples: [{ good: 'Value: home-cooked lunch at the office. Segments: office workers; home cooks. Revenue: 15% commission per order (+ [delivery fee?]). Key partners: building managers.', bad: 'Revenue from ads, subscriptions, commissions, data, premium, partnerships, and a marketplace — everything.', why: 'The bad one piles on revenue streams with no focus and generic blocks.' }],
});

export const businessBlueprints = [growthStrategy, businessPlan, feasibilityStudy, competitorAnalysis, pricingStrategy, swotAnalysis, goToMarket, financialPlan, brandPositioning, businessModel];
