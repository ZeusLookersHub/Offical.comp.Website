import type { Copy, Slot } from '../types.ts';
import { c, facts } from '../modules.ts';
import { makeDeckMission } from './_deck.ts';

/** The subject every deck is built on. */
const topic = (label: Copy, question: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1200,
  label, question, why: c('Every slide builds on this.', 'كل شريحة هتتبني على ده.'), example, vocabulary: vocab,
});

/** Who is in the room — decides depth, tone and what counts as proof. */
const viewers = (options: { value: string; label: Copy; keywords?: string[] }[], def: string, defReason: Copy): Slot => ({
  id: 'audience', kind: 'single', layer: 'understanding', importance: 'important',
  label: c('Who will watch', 'مين هيتفرج'), question: c('Who is in the room?', 'مين اللي في القاعة؟'),
  why: c('The audience decides the depth and what counts as proof.', 'الجمهور بيحدد العمق، وإيه اللي يعتبر دليل.'),
  example: c('Our management team.', 'الإدارة بتاعتنا.'), options, defaults: [{ value: def, reason: defReason }],
});

/** The one decision or action the deck is asking for. */
const askSlot = (question: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'ask', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 400,
  label: c('What you want from them', 'عايز منهم إيه'), question,
  why: c('A deck without one ask does not land.', 'العرض من غير طلب واحد مش بيوصل.'), example, vocabulary: vocab,
});

const durationSlot = (): Slot => ({
  id: 'duration', kind: 'single', layer: 'delivery', importance: 'nice',
  label: c('How long you have', 'عندك أد إيه'), question: c('How long is the presentation?', 'العرض مدته أد إيه؟'),
  why: c('Time decides how many slides you can really use.', 'الوقت بيحدد كام شريحة تقدر تستخدم فعلاً.'),
  example: c('Fifteen minutes.', 'ربع ساعة.'),
  options: [
    { value: '5m', label: c('5 minutes', '٥ دقايق'), keywords: ['5 min', '٥ دقايق'] },
    { value: '15m', label: c('15 minutes', '١٥ دقيقة'), keywords: ['15 min', 'ربع ساعة'] },
    { value: '30m', label: c('30 minutes', 'نص ساعة'), keywords: ['30 min', 'نص ساعة'] },
    { value: '60m', label: c('An hour', 'ساعة'), keywords: ['hour', 'ساعة'] },
  ],
  defaults: [{ value: '15m', reason: c('Fifteen minutes is the most common slot.', 'ربع ساعة هي أشهر مدة.') }],
});

export const companyProfile = makeDeckMission({
  id: 'company-profile', title: c('Company profile', 'بروفايل الشركة'), topics: ['company-profile', 'presentation-outline'],
  intake: { question: c('Tell me about your company and who the profile is for.', 'احكيلي عن شركتك، والبروفايل لمين.'), why: c('One message is enough. Real numbers make it — we never invent them.', 'رسالة واحدة كفاية. الأرقام الحقيقية هي اللي بتعمله، وعمرنا ما هنألّفها.'),
    starters: [c('A company profile for new clients', 'بروفايل شركة للعملاء الجداد'), c('A profile for a government tender', 'بروفايل لمناقصة حكومية'), c('An introduction deck about our agency', 'عرض تعريفي عن الوكالة'), c('A profile for partners', 'بروفايل للشركاء')] },
  slots: [
    topic(c('Company and services', 'الشركة والخدمات'), c('What does your company do, for whom, and what do you want them to remember?', 'شركتك بتعمل إيه، ولمين، وعايزهم يفتكروا إيه؟'), c('A contracting company doing finishing work for offices since 2015.', 'شركة مقاولات بتعمل تشطيبات للمكاتب من ٢٠١٥.'), { en: ['services', 'since 2015', 'for companies', 'for government', 'in Egypt', 'in the Gulf', 'team of 20'], ar: ['خدمات', 'من ٢٠١٥', 'للشركات', 'للحكومة', 'في مصر', 'في الخليج', 'فريق ٢٠ فرد'] }),
    viewers([
      { value: 'clients', label: c('Potential clients', 'عملاء محتملين'), keywords: ['clients', 'customers', 'عملاء'] },
      { value: 'tender', label: c('Tender / procurement', 'مناقصة / مشتريات'), keywords: ['tender', 'procurement', 'مناقصة', 'مشتريات'] },
      { value: 'partners', label: c('Partners / suppliers', 'شركاء / موردين'), keywords: ['partner', 'supplier', 'شريك', 'مورد'] },
      { value: 'talent', label: c('People we want to hire', 'ناس عايزين نوظفهم'), keywords: ['hiring', 'talent', 'توظيف'] },
    ], 'clients', c('Most profiles are written to win work.', 'أغلب البروفايلات بتتكتب علشان تجيب شغل.')),
    facts('proof', c('Proof: clients, projects, numbers', 'الأدلة: عملاء ومشاريع وأرقام'), c('What real proof can you show? (clients, projects, years, team size, certificates)', 'إيه الأدلة الحقيقية عندك؟ (عملاء، مشاريع، سنين، حجم الفريق، شهادات)'), c('38 finished projects, 9 years, ISO 9001.', '٣٨ مشروع خلصوا، و٩ سنين، وISO 9001.')),
    askSlot(c('What should they do after seeing it?', 'عايزهم يعملوا إيه بعد ما يشوفوه؟'), c('Invite us to quote on their next project.', 'يدعونا نقدّم عرض سعر لمشروعهم الجاي.'), { en: ['request a quote', 'book a meeting', 'shortlist us', 'sign an agreement'], ar: ['يطلبوا عرض سعر', 'يحجزوا اجتماع', 'يحطونا في القائمة', 'يوقّعوا اتفاق'] }),
    durationSlot(),
  ],
  nameLabel: c('Company name', 'اسم الشركة'), nameQuestion: c('What is the company name, exactly as written?', 'اسم الشركة إيه؟ اكتبه بالحرف.'), nameWhat: 'the company name',
  avoidVocab: { en: ['empty claims', 'client logos we have no permission for', 'long paragraphs', 'stock photos', 'invented awards'], ar: ['كلام إنشائي', 'لوجوهات عملاء من غير إذن', 'فقرات طويلة', 'صور جاهزة', 'جوائز متألفة'] },
  slideCounts: ['8', '10', '12', '16'], slideCountDefault: '10', slideCountReason: c('Ten slides cover the company without losing the room.', 'عشر شرائح بتغطي الشركة من غير ما الناس تزهق.'),
  outputDescription: c('A layered prompt for a presentation AI, the slide outline, what data you still need, and a checklist.', 'برومبت متقسم لأداة العروض، وترتيب الشرائح، والمعلومات الناقصة، وقائمة فحص.'),
  role: 'Senior corporate communications consultant who writes company profiles that win work, and a prompt engineer for presentation AIs.',
  understanding: [
    'subject describes the company; proof is the only source of numbers, clients and credentials; audience decides what proof matters (a tender wants compliance and track record, a client wants outcomes).',
    'sections.goal states the company in two sentences, who the deck is for, and the one action wanted.',
  ],
  intelligence: [
    'Structure: who we are, what we do (services as outcomes, not tasks), why us (the differentiator, defended), proof (projects, clients, numbers), how we work (process in steps), the team, and the next step. Each slide makes one claim and backs it.',
    'sections.approach tells the AI to lead with what the client gets rather than the company history, and to replace adjectives with evidence.',
  ],
  examples: [{
    good: 'Slide: "Finishing handed over on time, 38 times." Bullets: 38 projects since 2015; average handover 4 days early [source: your project log]; ISO 9001. Visual: project photo grid.',
    bad: 'We are the best leading company in the Middle East with over 500 happy clients and many awards.',
    why: 'The bad one invents the client count and awards and proves nothing.',
  }],
});

export const salesDeck = makeDeckMission({
  id: 'sales-deck', title: c('Sales deck', 'عرض بيعي'), topics: ['sales-deck', 'marketing-deck'],
  intake: { question: c('Tell me what you are selling and who you are pitching to.', 'قولّي بتبيع إيه، وبتعرض على مين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A deck to sell our service to companies', 'عرض نبيع بيه خدمتنا للشركات'), c('A sales deck for a client meeting', 'عرض بيعي لاجتماع عميل'), c('A deck for a marketing proposal', 'عرض لمقترح تسويقي'), c('A deck to sell our software', 'عرض لبيع السوفت وير')] },
  slots: [
    topic(c('What you are selling', 'بتبيع إيه'), c('What are you selling, what problem does it solve, and how is it priced?', 'بتبيع إيه، وبيحل مشكلة إيه، والسعر بيمشي إزاي؟'), c('A monthly social media management retainer for restaurants.', 'إدارة سوشيال ميديا شهرية للمطاعم.'), { en: ['service', 'product', 'retainer', 'per project', 'subscription', 'solves', 'saves time', 'increases sales'], ar: ['خدمة', 'منتج', 'شهري', 'بالمشروع', 'اشتراك', 'بيحل', 'بيوفر وقت', 'بيزوّد المبيعات'] }),
    viewers([
      { value: 'owner', label: c('Business owner', 'صاحب العمل'), keywords: ['owner', 'founder', 'صاحب', 'مالك'] },
      { value: 'manager', label: c('Department manager', 'مدير إدارة'), keywords: ['manager', 'head', 'مدير'] },
      { value: 'procurement', label: c('Procurement / finance', 'المشتريات / المالية'), keywords: ['procurement', 'finance', 'مشتريات', 'مالية'] },
      { value: 'board', label: c('Board / executives', 'مجلس الإدارة'), keywords: ['board', 'executive', 'مجلس', 'تنفيذيين'] },
    ], 'owner', c('Owners decide fastest in small and mid-size businesses.', 'أصحاب العمل أسرع في القرار في المشاريع الصغيرة والمتوسطة.')),
    { id: 'painPoint', kind: 'longtext', layer: 'understanding', importance: 'important', maxLength: 600,
      label: c('Their problem', 'مشكلتهم'), question: c('What problem are they living with today?', 'بيعيشوا مع مشكلة إيه دلوقتي؟'),
      why: c('A sales deck that does not name their problem does not sell.', 'العرض اللي مش بيسمّي مشكلتهم مش بيبيع.'),
      example: c('Their pages are inactive and they lose orders to competitors.', 'صفحاتهم ميتة وبيخسروا أوردرات لمنافسين.'),
      vocabulary: { en: ['losing customers', 'wasting time', 'inconsistent quality', 'no visibility', 'high cost'], ar: ['بيخسروا عملاء', 'بيضيعوا وقت', 'جودة مش ثابتة', 'مش ظاهرين', 'تكلفة عالية'] } },
    facts('proof', c('Proof and results', 'الأدلة والنتائج'), c('What results or clients can you show?', 'إيه النتائج أو العملاء اللي تقدر تعرضهم؟'), c('Grew a restaurant from 40 to 300 orders a month.', 'رفعت مطعم من ٤٠ لـ٣٠٠ أوردر في الشهر.')),
    askSlot(c('What is the next step you want?', 'الخطوة اللي عايزها إيه؟'), c('Sign a three-month trial.', 'يوقّعوا تجربة تلات شهور.'), { en: ['sign the contract', 'start a trial', 'book a follow-up', 'approve the budget'], ar: ['يوقّعوا العقد', 'يبدأوا تجربة', 'يحجزوا اجتماع تاني', 'يعتمدوا الميزانية'] }),
    durationSlot(),
  ],
  nameLabel: c('Your company name', 'اسم شركتك'), nameWhat: 'the company name',
  avoidVocab: { en: ['invented results', 'competitor names', 'prices I have not given', 'long feature lists', 'pressure tactics'], ar: ['نتائج متألفة', 'أسماء منافسين', 'أسعار ما قلتهاش', 'قوايم مميزات طويلة', 'أساليب ضغط'] },
  slideCounts: ['8', '10', '12', '15'], slideCountDefault: '10', slideCountReason: c('Ten slides are enough to get to the ask.', 'عشر شرائح كفاية توصل للطلب.'),
  deckStyleDefault: 'bold-modern',
  outputDescription: c('A layered prompt for a presentation AI, the slide outline, what you still need, and a checklist.', 'برومبت متقسم لأداة العروض، وترتيب الشرائح، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior B2B sales consultant who closes deals with decks, and a prompt engineer for presentation AIs.',
  understanding: [
    'painPoint is the opening; subject is the answer to it; proof is the only evidence allowed; audience decides whether the deck leads with outcome, process or cost.',
    'sections.goal states who is in the room, their problem, and the decision we are asking for.',
  ],
  intelligence: [
    'Structure: their problem in their words, the cost of leaving it, what we do about it, how it works in 3 steps, proof, what it costs and what is included, why us, and the next step. Make the cost of inaction concrete before presenting the price.',
    'sections.approach tells the AI to spend the first third on the problem, to speak in their outcomes rather than our features, and to put one clear ask on the last slide.',
  ],
  controlExtra: ['Never invent prices, results, client names or competitor comparisons — use [placeholders].'],
  examples: [{
    good: 'Slide 1: "You are getting 40 orders a month on a page with 8,000 followers." Slide 2: what that gap costs per month [their average order value]. Slide 7: proof — 40 → 300 orders for a comparable restaurant.',
    bad: 'We are the number one agency, our clients grow 500% on average, and our competitors are much worse. Price: whatever you can afford.',
    why: 'The bad one invents an average, attacks competitors, and has no real ask or price structure.',
  }],
});

export const quarterlyReview = makeDeckMission({
  id: 'quarterly-review', title: c('Business review', 'مراجعة أداء'), topics: ['quarterly-review', 'business-review', 'executive-deck'],
  intake: { question: c('Tell me the period and the numbers you want to review.', 'قولّي الفترة، والأرقام اللي عايز تراجعها.'), why: c('I only use the numbers you give. Anything missing becomes a placeholder.', 'بستخدم الأرقام اللي بتديها بس، واللي ناقص يبقى مكان فاضي.'),
    starters: [c('A quarterly review for management', 'مراجعة ربع سنوية للإدارة'), c('A monthly performance deck', 'عرض أداء شهري'), c('A year-end review', 'مراجعة نهاية السنة'), c('A deck on our results for the board', 'عرض نتائجنا لمجلس الإدارة')] },
  slots: [
    topic(c('Period and scope', 'الفترة والنطاق'), c('What period are you reviewing, and which part of the business?', 'بتراجع أنهي فترة، وأنهي جزء من الشغل؟'), c('Q3 for the retail branch.', 'الربع الثالث لفرع الريتيل.'), { en: ['Q1', 'Q3', 'last month', 'full year', 'sales team', 'whole company', 'one branch'], ar: ['الربع الأول', 'الربع التالت', 'الشهر اللي فات', 'السنة كاملة', 'فريق البيع', 'الشركة كلها', 'فرع واحد'] }),
    viewers([
      { value: 'management', label: c('Management team', 'فريق الإدارة'), keywords: ['management', 'إدارة'] },
      { value: 'board', label: c('Board / investors', 'مجلس الإدارة / مستثمرين'), keywords: ['board', 'investors', 'مجلس', 'مستثمرين'] },
      { value: 'team', label: c('The whole team', 'الفريق كله'), keywords: ['team', 'staff', 'الفريق', 'الموظفين'] },
      { value: 'client', label: c('A client', 'عميل'), keywords: ['client', 'عميل'] },
    ], 'management', c('Most reviews are run for the management team.', 'أغلب المراجعات بتتعمل للإدارة.')),
    facts('results', c('The numbers', 'الأرقام'), c('What are the results for the period? (revenue, units, growth, costs, targets)', 'نتايج الفترة إيه؟ (إيرادات، وحدات، نمو، تكاليف، مستهدفات)'), c('Revenue 1.4M, target 1.6M, 220 orders, cost up 8%.', 'إيرادات ١.٤ مليون، المستهدف ١.٦، ٢٢٠ أوردر، والتكلفة زادت ٨٪.')),
    { id: 'storyline', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('The headline', 'الخلاصة'), question: c('What is the overall story of the period?', 'حكاية الفترة كلها إيه؟'),
      why: c('A review needs one honest verdict up front.', 'المراجعة محتاجة حكم واحد صريح في الأول.'),
      example: c('Below target but improving.', 'أقل من المستهدف بس بتتحسن.'),
      options: [
        { value: 'on-track', label: c('On track', 'ماشية على المستهدف'), keywords: ['on track', 'met target', 'على المستهدف'] },
        { value: 'ahead', label: c('Ahead of target', 'فوق المستهدف'), keywords: ['ahead', 'exceeded', 'فوق', 'تجاوزنا'] },
        { value: 'behind', label: c('Behind target', 'أقل من المستهدف'), keywords: ['behind', 'missed', 'أقل', 'تحت'] },
        { value: 'mixed', label: c('Mixed', 'متفاوتة'), keywords: ['mixed', 'متفاوت'] },
      ],
      defaults: [{ value: 'mixed', reason: c('Most periods are mixed; the deck should say so plainly.', 'أغلب الفترات متفاوتة، والعرض يقولها بصراحة.') }] },
    askSlot(c('What decision do you need from the room?', 'عايز قرار إيه من القاعة؟'), c('Approve extra budget for stock.', 'يعتمدوا ميزانية زيادة للمخزون.'), { en: ['approve a budget', 'agree on priorities', 'hire someone', 'change the target'], ar: ['يعتمدوا ميزانية', 'يتفقوا على أولويات', 'توظيف', 'تغيير المستهدف'] }),
    durationSlot(),
  ],
  nameLabel: c('Company / team name', 'اسم الشركة أو الفريق'), nameWhat: 'the company or team name',
  avoidVocab: { en: ['hiding bad numbers', 'blaming people by name', 'invented comparisons', 'charts without a source'], ar: ['إخفاء الأرقام السيئة', 'لوم أشخاص بالاسم', 'مقارنات متألفة', 'رسومات من غير مصدر'] },
  slideCounts: ['8', '10', '12', '15'], slideCountDefault: '10', slideCountReason: c('Ten slides keep a review focused on decisions.', 'عشر شرائح بتخلي المراجعة على القرارات.'),
  outputDescription: c('A layered prompt for a presentation AI, the slide outline, the data you still need, and a checklist.', 'برومبت متقسم لأداة العروض، وترتيب الشرائح، والداتا الناقصة، وقائمة فحص.'),
  role: 'Senior business analyst who runs management reviews, and a prompt engineer for presentation AIs.',
  understanding: [
    'results is the only source of numbers; storyline is the verdict the deck must open with; audience decides the depth (a board wants the headline and the ask, a team wants the detail).',
    'sections.goal states the period, the scope, the verdict and the decision needed.',
  ],
  intelligence: [
    'Structure: the verdict on slide one, results against target, what drove the gap (two or three causes with evidence), what we did about it, what we will do next with owners and dates, risks, and the decision asked for.',
    'sections.approach tells the AI to open with the honest verdict, to explain variance by cause rather than by excuse, and to end every section with a decision or an action.',
  ],
  controlExtra: ['Never soften or omit a number the user gave. Never invent comparisons to last year, to competitors or to the market.'],
  examples: [{
    good: 'Slide 1: "Revenue 1.4M against a 1.6M target — the gap is stock, not demand." Slide 3: 220 orders, 31 lost to out-of-stock [source: your order log]. Slide 8: decision — approve [amount] for stock.',
    bad: 'A great quarter overall! Revenue nearly doubled versus the market average and the team outperformed every competitor.',
    why: 'The bad one hides a missed target and invents market and competitor comparisons.',
  }],
});

export const strategyDeck = makeDeckMission({
  id: 'strategy-deck', title: c('Strategy deck', 'عرض استراتيجية'), topics: ['strategy-deck'],
  intake: { question: c('Tell me the decision or direction you want to present.', 'قولّي القرار أو الاتجاه اللي عايز تعرضه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A deck to present our expansion plan', 'عرض لخطة التوسع'), c('A strategy deck for next year', 'عرض استراتيجية السنة الجاية'), c('A deck to propose a new direction', 'عرض لاقتراح اتجاه جديد'), c('A deck to get approval on a plan', 'عرض لاعتماد خطة')] },
  slots: [
    topic(c('The strategy', 'الاستراتيجية'), c('What are you proposing, and why now?', 'بتقترح إيه، وليه دلوقتي؟'), c('Open a second branch in Alexandria next year.', 'نفتح فرع تاني في إسكندرية السنة الجاية.'), { en: ['expand', 'new market', 'new product', 'cut costs', 'restructure', 'because', 'next year'], ar: ['توسع', 'سوق جديد', 'منتج جديد', 'تقليل تكاليف', 'إعادة هيكلة', 'لأن', 'السنة الجاية'] }),
    viewers([
      { value: 'board', label: c('Board / owners', 'مجلس الإدارة / الملاك'), keywords: ['board', 'owners', 'مجلس', 'ملاك'] },
      { value: 'management', label: c('Management team', 'فريق الإدارة'), keywords: ['management', 'إدارة'] },
      { value: 'investors', label: c('Investors', 'مستثمرين'), keywords: ['investors', 'مستثمرين'] },
      { value: 'team', label: c('The team who will deliver it', 'الفريق اللي هينفذها'), keywords: ['team', 'الفريق'] },
    ], 'management', c('Strategy decks are usually presented to management first.', 'عروض الاستراتيجية بتتعرض على الإدارة الأول.')),
    facts('evidence', c('Evidence you have', 'الأدلة اللي عندك'), c('What data supports this? (results, costs, capacity, customer demand)', 'إيه الداتا اللي بتدعم ده؟ (نتائج، تكاليف، قدرة، طلب العملاء)'), c('65% of online orders come from Alexandria; the branch costs 400K to open.', '٦٥٪ من الأوردرات الأونلاين من إسكندرية، وتكلفة الفرع ٤٠٠ ألف.')),
    askSlot(c('What decision do you need?', 'محتاج قرار إيه؟'), c('Approve the budget and the timeline.', 'يعتمدوا الميزانية والجدول الزمني.'), { en: ['approve the plan', 'approve a budget', 'agree the priorities', 'authorise hiring'], ar: ['يعتمدوا الخطة', 'يعتمدوا ميزانية', 'يتفقوا على الأولويات', 'يسمحوا بالتوظيف'] }),
    durationSlot(),
  ],
  nameLabel: c('Company name', 'اسم الشركة'), nameWhat: 'the company name',
  avoidVocab: { en: ['vague vision language', 'invented market data', 'hiding the risks', 'plans with no owner'], ar: ['كلام رؤية غامض', 'بيانات سوق متألفة', 'إخفاء المخاطر', 'خطط من غير مسؤول'] },
  slideCounts: ['8', '10', '12', '15'], slideCountDefault: '12', slideCountReason: c('Twelve slides fit a decision with its options and risks.', 'اتناشر شريحة بتكفي قرار ببدائله ومخاطره.'),
  outputDescription: c('A layered prompt for a presentation AI, the slide outline, what you still need, and a checklist.', 'برومبت متقسم لأداة العروض، وترتيب الشرائح، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior strategy consultant who presents to boards, and a prompt engineer for presentation AIs.',
  understanding: [
    'subject is the recommendation; evidence is the only data; audience decides how much detail the options get.',
    'sections.goal states the recommendation, why now, and the decision being asked for.',
  ],
  intelligence: [
    'Structure: the recommendation up front, the situation that makes it necessary, the options considered with why each was kept or dropped, the recommended option in detail (cost, timeline, owners), the numbers it turns on, the risks with mitigations, and the decision.',
    'sections.approach tells the AI to lead with the recommendation rather than build up to it, to show the discarded options honestly, and to state the assumptions the plan depends on.',
  ],
  controlExtra: ['Never invent market sizes, growth rates or competitor moves. Risks must be named, not softened.'],
  examples: [{
    good: 'Slide 1: "Open the Alexandria branch in Q2 — 65% of online orders already come from there." Slide 5: cost 400K, break-even at [monthly orders]. Slide 9: risk — rent commitment; mitigation — 1-year lease.',
    bad: 'Our vision is to be the market leader in a $5B growing market, so we should expand everywhere as fast as possible. No major risks.',
    why: 'The bad one invents a market size, gives no options or costs, and denies risk.',
  }],
});

export const trainingDeck = makeDeckMission({
  id: 'training-deck', title: c('Training deck', 'عرض تدريبي'), topics: ['training-deck', 'workshop-deck', 'education-deck', 'training-slides'],
  intake: { question: c('Tell me what you are teaching and who the learners are.', 'قولّي بتعلّم إيه، والمتدربين مين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A training deck for new employees', 'عرض تدريبي للموظفين الجداد'), c('A workshop on customer service', 'ورشة عن خدمة العملاء'), c('Slides to teach a software tool', 'شرائح لتعليم أداة'), c('A lesson for my students', 'درس لطلبتي')] },
  slots: [
    topic(c('Topic and what they should be able to do', 'الموضوع، وهيقدروا يعملوا إيه'), c('What are you teaching, and what should they be able to do by the end?', 'بتعلّم إيه، وفي الآخر يقدروا يعملوا إيه؟'), c('How to handle an angry customer; by the end they can de-escalate a call.', 'إزاي تتعامل مع عميل غضبان؛ في الآخر يقدر يهدّي مكالمة.'), { en: ['how to', 'process', 'tool', 'policy', 'by the end they can', 'hands-on'], ar: ['إزاي', 'إجراء', 'أداة', 'سياسة', 'في الآخر يقدروا', 'تطبيق عملي'] }),
    viewers([
      { value: 'new-hires', label: c('New employees', 'موظفين جداد'), keywords: ['new hires', 'onboarding', 'جداد'] },
      { value: 'experienced', label: c('Experienced staff', 'موظفين خبرة'), keywords: ['experienced', 'senior', 'خبرة'] },
      { value: 'students', label: c('Students', 'طلبة'), keywords: ['students', 'طلبة', 'طلاب'] },
      { value: 'customers', label: c('Customers / users', 'عملاء / مستخدمين'), keywords: ['customers', 'users', 'عملاء', 'مستخدمين'] },
    ], 'new-hires', c('Most training is written for people who are new to the topic.', 'أغلب التدريب بيتكتب لناس جديدة على الموضوع.')),
    { id: 'level', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Their level', 'مستواهم'), question: c('How much do they already know?', 'عارفين أد إيه بالفعل؟'),
      why: c('Level decides what to explain and what to skip.', 'المستوى بيحدد إيه اللي يتشرح وإيه اللي يتعدى.'),
      example: c('Complete beginners.', 'مبتدئين تماماً.'),
      options: [
        { value: 'beginner', label: c('Beginners', 'مبتدئين'), keywords: ['beginner', 'new', 'مبتدئ', 'جديد'] },
        { value: 'intermediate', label: c('Some experience', 'عندهم خبرة شوية'), keywords: ['intermediate', 'some', 'متوسط'] },
        { value: 'advanced', label: c('Advanced', 'متقدمين'), keywords: ['advanced', 'expert', 'متقدم', 'خبير'] },
      ],
      defaults: [{ value: 'beginner', reason: c('Writing for beginners still works for everyone else.', 'الكتابة للمبتدئين بتنفع مع الباقي كمان.') }] },
    { id: 'activities', kind: 'multi', layer: 'intelligence', importance: 'nice',
      label: c('Activities', 'الأنشطة'), question: c('What should they do, not just watch?', 'يعملوا إيه، مش بس يتفرجوا؟'),
      why: c('People learn by doing, so the deck should make room for it.', 'الناس بتتعلم بالتطبيق، فالعرض لازم يسيب مساحة له.'),
      example: c('Role play and a short quiz.', 'تمثيل أدوار وكويز قصير.'),
      options: [
        { value: 'roleplay', label: c('Role play', 'تمثيل أدوار'), keywords: ['role play', 'تمثيل'] },
        { value: 'exercise', label: c('Hands-on exercise', 'تمرين عملي'), keywords: ['exercise', 'practice', 'تمرين'] },
        { value: 'quiz', label: c('Quiz', 'كويز'), keywords: ['quiz', 'test', 'كويز', 'اختبار'] },
        { value: 'discussion', label: c('Group discussion', 'مناقشة جماعية'), keywords: ['discussion', 'مناقشة'] },
        { value: 'case', label: c('Real case', 'حالة حقيقية'), keywords: ['case', 'scenario', 'حالة', 'سيناريو'] },
      ],
      defaults: [{ value: ['exercise', 'quiz'], reason: c('An exercise plus a quick check is the minimum that makes training stick.', 'تمرين مع تحقق سريع هو أقل حاجة تثبّت التدريب.') }] },
    durationSlot(),
  ],
  nameLabel: c('Company / course name', 'اسم الشركة أو الكورس'), nameWhat: 'the company or course name',
  avoidVocab: { en: ['walls of text', 'theory with no example', 'jargon without explanation', 'invented statistics'], ar: ['شرائح مليانة كلام', 'نظري من غير مثال', 'مصطلحات من غير شرح', 'إحصائيات متألفة'] },
  slideCounts: ['10', '15', '20', '30'], slideCountDefault: '15', slideCountReason: c('Fifteen slides cover a topic with room for practice.', 'خمستاشر شريحة بتغطي الموضوع وتسيب وقت للتطبيق.'),
  deckStyleDefault: 'minimal',
  outputDescription: c('A layered prompt for a presentation AI, the slide outline, what you still need, and a checklist.', 'برومبت متقسم لأداة العروض، وترتيب الشرائح، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior instructional designer who builds corporate training, and a prompt engineer for presentation AIs.',
  understanding: [
    'subject must end in a capability, not a topic; level and audience decide the starting point; activities decide where practice slides go.',
    'sections.goal states what learners will be able to do by the end, who they are, and how long the session is.',
  ],
  intelligence: [
    'Structure: why this matters to them, what they will be able to do, the content in small steps (each step: explain, show a real example, let them try), the activities in place, common mistakes, a summary they can keep, and a check that the objective was met.',
    'sections.approach tells the AI to teach one idea per slide, to give a concrete example from the learners\' own work for every rule, and to add speaker notes with what to say and the timing.',
  ],
  deliveryExtra: ['Each slide needs a speaker note with the timing, so the session fits the duration.'],
  examples: [{
    good: 'Slide 6: "Step 2 — name the feeling before the fix." Example: "I can hear this has wasted your whole morning." Then: role play in pairs, 5 minutes. Note: 4 min talk, 5 min practice.',
    bad: 'Twenty slides of customer service theory with bullet lists, no examples, and a final slide saying "Any questions?".',
    why: 'The bad one is all theory with no practice, examples or timing.',
  }],
});

export const projectProposal = makeDeckMission({
  id: 'project-proposal', title: c('Project proposal', 'مقترح مشروع'), topics: ['project-proposal', 'report-document'],
  intake: { question: c('Tell me the project and who has to approve it.', 'قولّي المشروع، ومين اللي هيعتمده.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A proposal for a new project at work', 'مقترح لمشروع جديد في الشغل'), c('A proposal to a client', 'مقترح لعميل'), c('A proposal for funding', 'مقترح لتمويل'), c('A proposal to improve a process', 'مقترح لتحسين إجراء')] },
  slots: [
    topic(c('The project', 'المشروع'), c('What is the project, what problem does it solve, and what does done look like?', 'المشروع إيه، وبيحل مشكلة إيه، والنجاح شكله إيه؟'), c('Build an online booking system; done when patients can book without calling.', 'نبني نظام حجز أونلاين؛ النجاح إن المريض يحجز من غير مكالمة.'), { en: ['build', 'improve', 'replace', 'solves', 'done when', 'for our team', 'for the client'], ar: ['نبني', 'نحسّن', 'نستبدل', 'بيحل', 'النجاح لما', 'لفريقنا', 'للعميل'] }),
    viewers([
      { value: 'management', label: c('Our management', 'إدارتنا'), keywords: ['management', 'إدارة'] },
      { value: 'client', label: c('A client', 'عميل'), keywords: ['client', 'عميل'] },
      { value: 'funder', label: c('A funder / donor', 'جهة تمويل'), keywords: ['funder', 'donor', 'grant', 'تمويل', 'منحة'] },
      { value: 'team', label: c('The team', 'الفريق'), keywords: ['team', 'الفريق'] },
    ], 'management', c('Most proposals go to internal management first.', 'أغلب المقترحات بتروح للإدارة الأول.')),
    facts('constraints', c('Budget, time and resources', 'الميزانية والوقت والموارد'), c('What budget, deadline and people do you have or need?', 'عندك أو محتاج ميزانية ومدة وأفراد قد إيه؟'), c('Three months, two developers, 120K budget.', 'تلات شهور، ومبرمجين اتنين، وميزانية ١٢٠ ألف.')),
    askSlot(c('What approval do you need?', 'محتاج اعتماد إيه؟'), c('Approve the budget and assign the two developers.', 'يعتمدوا الميزانية ويخصصوا المبرمجين.'), { en: ['approve the budget', 'assign people', 'sign off the scope', 'agree the timeline'], ar: ['يعتمدوا الميزانية', 'يخصصوا أفراد', 'يعتمدوا النطاق', 'يتفقوا على المدة'] }),
    durationSlot(),
  ],
  nameLabel: c('Project / company name', 'اسم المشروع أو الشركة'), nameWhat: 'the project or company name',
  avoidVocab: { en: ['vague scope', 'invented costs', 'hiding dependencies', 'timelines with no milestones'], ar: ['نطاق غامض', 'تكاليف متألفة', 'إخفاء الاعتماديات', 'جدول من غير مراحل'] },
  slideCounts: ['8', '10', '12', '15'], slideCountDefault: '10', slideCountReason: c('Ten slides carry a proposal to a decision.', 'عشر شرائح بتوصل المقترح للقرار.'),
  outputDescription: c('A layered prompt for a presentation AI, the slide outline, what you still need, and a checklist.', 'برومبت متقسم لأداة العروض، وترتيب الشرائح، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior project manager who writes proposals that get approved, and a prompt engineer for presentation AIs.',
  understanding: [
    'subject must contain a definition of done; constraints are the only budget, time and resource numbers allowed; audience decides whether the deck leads with value or with cost.',
    'sections.goal states the problem, the proposed project, and the approval being asked for.',
  ],
  intelligence: [
    'Structure: the problem and what it costs today, the proposed solution, what is in scope and explicitly out of scope, the plan in phases with milestones and owners, budget and resources, risks and dependencies, how success will be measured, and the approval asked for.',
    'sections.approach tells the AI to make the out-of-scope list explicit, to attach an owner and a date to every phase, and to state the dependencies the project cannot start without.',
  ],
  controlExtra: ['Never invent costs, durations or headcount. Out of scope must be stated, not implied.'],
  examples: [{
    good: 'In scope: online booking for the two main clinics. Out of scope: payments, mobile app. Phase 1 (weeks 1–4): booking form — owner [name]. Dependency: access to the clinic calendar.',
    bad: 'We will build a full digital transformation platform in a few weeks for a reasonable budget, with no real risks.',
    why: 'The bad one has no scope boundary, no real timeline or budget, and denies risk.',
  }],
});

export const dataStorytelling = makeDeckMission({
  id: 'data-storytelling', title: c('Data story', 'حكاية من الداتا'), topics: ['data-storytelling'],
  intake: { question: c('Tell me the data you have and the point you want to make.', 'قولّي الداتا اللي عندك، والنقطة اللي عايز توصلها.'), why: c('I only use the numbers you give. Anything missing becomes a placeholder.', 'بستخدم الأرقام اللي بتديها بس، واللي ناقص يبقى مكان فاضي.'),
    starters: [c('Turn my sales numbers into a presentation', 'حوّل أرقام مبيعاتي لعرض'), c('A deck to explain our survey results', 'عرض يشرح نتايج الاستبيان'), c('Present our dashboard to management', 'أعرض الداشبورد على الإدارة'), c('Explain why the numbers dropped', 'أشرح ليه الأرقام نزلت')] },
  slots: [
    topic(c('The point you want to make', 'النقطة اللي عايز توصلها'), c('What should the room believe or do after seeing the data?', 'عايز القاعة تقتنع بإيه أو تعمل إيه بعد الداتا؟'), c('That our growth is coming from one city, so we should focus there.', 'إن النمو كله من مدينة واحدة، فنركّز فيها.'), { en: ['growth is coming from', 'costs rose because', 'customers prefer', 'we should focus on', 'the drop is caused by'], ar: ['النمو جاي من', 'التكاليف زادت بسبب', 'العملاء بيفضّلوا', 'نركّز على', 'النزول سببه'] }),
    facts('dataset', c('The numbers', 'الأرقام'), c('What are the actual numbers? Paste them as they are.', 'الأرقام الحقيقية إيه؟ الصقها زي ما هي.'), c('Cairo 62%, Alexandria 21%, rest 17%; total orders 1,430.', 'القاهرة ٦٢٪، إسكندرية ٢١٪، الباقي ١٧٪؛ إجمالي الأوردرات ١٤٣٠.')),
    viewers([
      { value: 'management', label: c('Management', 'الإدارة'), keywords: ['management', 'إدارة'] },
      { value: 'team', label: c('The team', 'الفريق'), keywords: ['team', 'الفريق'] },
      { value: 'client', label: c('A client', 'عميل'), keywords: ['client', 'عميل'] },
      { value: 'public', label: c('A general audience', 'جمهور عام'), keywords: ['public', 'general', 'جمهور'] },
    ], 'management', c('Data decks are usually built for decision-makers.', 'عروض الداتا بتتعمل لصنّاع القرار غالباً.')),
    askSlot(c('What should they decide or do?', 'يقرروا أو يعملوا إيه؟'), c('Move half the ad budget to Cairo.', 'ينقلوا نص ميزانية الإعلانات للقاهرة.'), { en: ['approve a change', 'shift budget', 'agree a priority', 'investigate further'], ar: ['يعتمدوا تغيير', 'ينقلوا ميزانية', 'يتفقوا على أولوية', 'يبحثوا أكتر'] }),
    durationSlot(),
  ],
  nameLabel: c('Company / team name', 'اسم الشركة أو الفريق'), nameWhat: 'the company or team name',
  avoidVocab: { en: ['3D charts', 'truncated axes', 'cherry-picked periods', 'invented numbers', 'correlation as cause'], ar: ['رسومات ثلاثية الأبعاد', 'محاور مقطوعة', 'فترات منتقاة', 'أرقام متألفة', 'الارتباط كأنه سبب'] },
  slideCounts: ['6', '8', '10', '12'], slideCountDefault: '8', slideCountReason: c('Eight slides keep a data story to one argument.', 'تمن شرائح بتخلي حكاية الداتا على حجة واحدة.'),
  deckStyleDefault: 'clean-corporate',
  outputDescription: c('A layered prompt for a presentation AI, the slide outline with the chart for each, the data you still need, and a checklist.', 'برومبت متقسم لأداة العروض، وترتيب الشرائح مع الرسم المناسب لكل واحدة، والداتا الناقصة، وقائمة فحص.'),
  role: 'Senior data storyteller who presents analysis to executives, and a prompt engineer for presentation AIs.',
  understanding: [
    'subject is the claim the data must support; dataset is the only source of numbers; audience decides how much method to show.',
    'sections.goal states the claim, the data behind it, and the decision asked for.',
  ],
  intelligence: [
    'Structure: the claim as the first headline, then one chart per slide where each chart proves one step of the argument, then what it means, then the decision. For every slide name the chart type and why it suits the comparison (trend over time → line; parts of a whole → bar, not pie; distribution → histogram).',
    'sections.approach tells the AI to write every slide headline as the finding rather than the chart name, to label the axes and the source, and to say plainly where the data cannot support a conclusion.',
  ],
  controlExtra: ['Never add, round or extrapolate numbers beyond dataset. Never present a correlation as a cause. Axes start at zero unless the user says otherwise.'],
  deliveryExtra: ['Each slideOutline line is the finding as a headline, with the chart type in brackets.'],
  examples: [{
    good: '"62% of orders come from Cairo" [horizontal bar, three regions, source: order log]. Next slide: what that means for the ad split. Last slide: decision — move [amount] of budget.',
    bad: 'A 3D pie chart of regions with the y-axis starting at 50%, showing that our marketing caused 300% growth.',
    why: 'The bad one distorts the chart, invents growth, and turns a correlation into a cause.',
  }],
});

export const productLaunchDeck = makeDeckMission({
  id: 'product-launch-deck', title: c('Product launch deck', 'عرض إطلاق منتج'), topics: ['product-launch-deck', 'product-launch'],
  intake: { question: c('Tell me about the product you are launching and who you are presenting to.', 'قولّي عن المنتج اللي بتطلقه، وبتعرض على مين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A deck to launch our new product internally', 'عرض لإطلاق منتجنا الجديد داخلياً'), c('A launch deck for retailers', 'عرض إطلاق لتجار التجزئة'), c('A deck to present a new feature', 'عرض لميزة جديدة'), c('A launch deck for the press', 'عرض إطلاق للصحافة')] },
  slots: [
    topic(c('The product', 'المنتج'), c('What is the product, who is it for, and what does it do better?', 'المنتج إيه، لمين، وبيعمل إيه أحسن؟'), c('A refillable cleaning spray; same clean, 80% less plastic.', 'سبراي تنظيف بإعادة تعبئة؛ نفس النضافة بـ٨٠٪ بلاستيك أقل.'), { en: ['new product', 'new feature', 'for families', 'for businesses', 'cheaper', 'faster', 'first in the market'], ar: ['منتج جديد', 'ميزة جديدة', 'للأسر', 'للشركات', 'أرخص', 'أسرع', 'الأول في السوق'] }),
    viewers([
      { value: 'internal', label: c('Our own team', 'فريقنا'), keywords: ['internal', 'team', 'داخلي', 'الفريق'] },
      { value: 'retail', label: c('Retailers / distributors', 'تجار / موزعين'), keywords: ['retail', 'distributor', 'تجار', 'موزعين'] },
      { value: 'customers', label: c('Customers', 'عملاء'), keywords: ['customers', 'عملاء'] },
      { value: 'press', label: c('Press / media', 'صحافة / إعلام'), keywords: ['press', 'media', 'صحافة', 'إعلام'] },
    ], 'internal', c('Launches are usually aligned internally first.', 'الإطلاق بيتظبط داخلياً الأول غالباً.')),
    facts('productFacts', c('Specs, price and dates', 'المواصفات والسعر والتواريخ'), c('What are the confirmed specs, price, availability and dates?', 'المواصفات والسعر والتوافر والتواريخ المؤكدة إيه؟'), c('Launches 1 March, 89 EGP, 500ml, available in 30 branches.', 'بينزل ١ مارس، ٨٩ جنيه، ٥٠٠ مل، في ٣٠ فرع.')),
    askSlot(c('What should the room do after it?', 'القاعة تعمل إيه بعده؟'), c('Stock it and run the launch display.', 'يوفّروه ويعملوا عرض الإطلاق.'), { en: ['stock the product', 'run the campaign', 'start selling', 'cover the story', 'align on the plan'], ar: ['يوفّروا المنتج', 'يشغّلوا الحملة', 'يبدأوا البيع', 'يغطّوا الخبر', 'يتفقوا على الخطة'] }),
    durationSlot(),
  ],
  nameLabel: c('Product name', 'اسم المنتج'), nameQuestion: c('What is the product name, exactly as written?', 'اسم المنتج إيه؟ اكتبه بالحرف.'), nameWhat: 'the product name',
  avoidVocab: { en: ['unconfirmed specs', 'invented prices or dates', 'claims we cannot prove', 'competitor names'], ar: ['مواصفات غير مؤكدة', 'أسعار أو تواريخ متألفة', 'وعود مش أقدر أثبتها', 'أسماء منافسين'] },
  slideCounts: ['8', '10', '12', '15'], slideCountDefault: '10', slideCountReason: c('Ten slides cover the product and the plan.', 'عشر شرائح بتغطي المنتج والخطة.'),
  deckStyleDefault: 'bold-modern',
  outputDescription: c('A layered prompt for a presentation AI, the slide outline, what you still need, and a checklist.', 'برومبت متقسم لأداة العروض، وترتيب الشرائح، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior product marketing manager who runs launches, and a prompt engineer for presentation AIs.',
  understanding: [
    'subject is the product and its one advantage; productFacts is the only source of specs, prices and dates; audience decides whether the deck is about the plan, the margin or the story.',
    'sections.goal states the product, the audience, the launch date and what the room should do.',
  ],
  intelligence: [
    'Structure: the one-line positioning, who it is for and the need it meets, what it is (specs that matter to this audience), the proof or demo, the price and availability, the launch plan with dates and owners, what each person in the room has to do, and the ask.',
    'sections.approach tells the AI to translate specs into what they mean for the buyer, and to give retailers margin and display detail while giving an internal team owners and dates.',
  ],
  controlExtra: ['Never invent specs, prices, launch dates, stock numbers or margins — use [placeholders].'],
  examples: [{
    good: 'Positioning: "Same clean, 80% less plastic." Specs that matter to retail: 500ml, 89 EGP, shelf-ready case of 12 [confirm case size]. Launch: 1 March, 30 branches. Ask: confirm stock order by [date].',
    bad: 'The best cleaning spray in the world, eco-certified, launching soon at a great price, better than every competitor.',
    why: 'The bad one invents a certification, gives no date or price, and attacks competitors.',
  }],
});

export const deckBlueprints = [
  companyProfile, salesDeck, quarterlyReview, strategyDeck,
  trainingDeck, projectProposal, dataStorytelling, productLaunchDeck,
];
