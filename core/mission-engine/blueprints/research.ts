import type { Copy, Slot } from '../types.ts';
import { c, facts } from '../modules.ts';
import { makeTextMission } from './_text.ts';

/** The question being researched — research without one question wanders. */
const question = (label: Copy, q: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1000,
  label, question: q, why: c('One clear question is what makes research usable.', 'سؤال واحد واضح هو اللي بيخلي البحث ينفع.'), example, vocabulary: vocab,
});

/** What the research is for — this is what decides the depth and the format. */
const decision = (example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'decision', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 400,
  label: c('The decision behind it', 'القرار اللي وراه'), question: c('What decision will you make with this?', 'هتاخد قرار إيه بناءً عليه؟'),
  why: c('Research that serves no decision is reading.', 'البحث اللي ملوش قرار بيبقى قراية.'), example, vocabulary: vocab,
});

const marketScope = (): Slot => ({
  id: 'scope', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 300,
  label: c('Where and when', 'فين وإمتى'), question: c('Which market or place, and how recent must it be?', 'أنهي سوق أو مكان، ولازم يكون حديث أد إيه؟'),
  why: c('A global figure is useless for a local decision.', 'رقم عالمي ما بيفيدش في قرار محلي.'),
  example: c('Egypt, the last two years.', 'مصر، آخر سنتين.'),
  vocabulary: { en: ['Egypt', 'Saudi Arabia', 'the Gulf', 'globally', 'last year', 'last two years', 'as recent as possible'], ar: ['مصر', 'السعودية', 'الخليج', 'عالمياً', 'السنة اللي فاتت', 'آخر سنتين', 'أحدث حاجة'] },
  noneLabel: c('Placeholder to fill', 'مكان فاضي تكمّله'),
  defaults: [{ value: 'none', reason: c('We leave [market and period] for you to fill, and the prompt asks for the most recent data.', 'هنسيب [السوق والفترة] تكمّلها، والبرومبت هيطلب أحدث داتا.') }],
});

const depthSlot = (): Slot => ({
  id: 'depth', kind: 'single', layer: 'delivery', importance: 'nice',
  label: c('How deep', 'عمق البحث'), question: c('How deep should it go?', 'يروح لعمق أد إيه؟'),
  why: c('Depth decides how long the answer is and how many sources it needs.', 'العمق بيحدد طول النتيجة وعدد المصادر.'),
  example: c('A quick answer.', 'إجابة سريعة.'),
  options: [
    { value: 'quick', label: c('Quick answer', 'إجابة سريعة'), keywords: ['quick', 'سريع', 'مختصر'] },
    { value: 'standard', label: c('Solid summary with sources', 'ملخص قوي بالمصادر'), keywords: ['summary', 'ملخص'] },
    { value: 'deep', label: c('Full report', 'تقرير كامل'), keywords: ['deep', 'report', 'تقرير', 'عميق'] },
  ],
  defaults: [{ value: 'standard', reason: c('A sourced summary is enough for most decisions.', 'الملخص بمصادره كفاية لأغلب القرارات.') }],
});

/** Every research mission shares these: sources named, nothing invented, gaps admitted. */
const sourceRules = [
  'sections.rules must require a source for every claim (publisher and date), must forbid inventing statistics, studies, quotes, prices or company figures, and must require the AI to say "not found" instead of filling a gap.',
  'The prompt must require the AI to separate what the sources say from its own reading of them, and to flag where sources disagree rather than averaging them.',
  'The prompt must require it to prefer primary sources (official statistics, company filings and reports, the company\'s own site) over blogs and aggregators, and to say when a figure is an estimate.',
];

const sourceDelivery = [
  'sections.output must require a sources list with publisher, title and date beside each finding, plus a short "what we could not find" section.',
  'The prompt must require dates on every figure, because a number without a date cannot be judged.',
];

export const marketResearch = makeTextMission({
  id: 'market-research', title: c('Market research', 'بحث سوق'), topics: ['market-research'],
  intake: { question: c('Tell me the market you want to understand and the decision behind it.', 'قولّي السوق اللي عايز تفهمه، والقرار اللي وراه.'), why: c('I build the prompt so the AI cites sources and admits what it could not find.', 'هبني البرومبت بشكل يخلي الـ AI يجيب مصادر ويقول إيه اللي ما لقاهوش.'),
    starters: [c('Is there demand for my product in Egypt?', 'في طلب على منتجي في مصر؟'), c('How big is this market?', 'السوق ده حجمه أد إيه؟'), c('Should I enter the Saudi market?', 'أدخل السوق السعودي؟'), c('What do customers pay for this now?', 'العملاء بيدفعوا كام في ده دلوقتي؟')] },
  slots: [
    question(c('The market question', 'سؤال السوق'), c('What exactly do you want to know about the market?', 'عايز تعرف إيه بالظبط عن السوق؟'), c('Is there enough demand for a meal-prep service for office workers in Cairo?', 'في طلب كفاية على خدمة تحضير وجبات لموظفين في القاهرة؟'), { en: ['is there demand', 'market size', 'who are the competitors', 'what do people pay', 'is it growing', 'what are the barriers'], ar: ['في طلب', 'حجم السوق', 'مين المنافسين', 'بيدفعوا كام', 'بيكبر', 'إيه العوائق'] }),
    decision(c('Whether to launch this year or not.', 'أطلق السنة دي ولا لأ.'), { en: ['whether to launch', 'how to price', 'which city first', 'how much to invest', 'whether to stop'], ar: ['أطلق ولا لأ', 'أسعّر إزاي', 'أنهي مدينة الأول', 'أستثمر كام', 'أوقف ولا لأ'] }),
    marketScope(),
    facts('known', c('What you already know', 'اللي عارفه بالفعل'), c('What do you already know or have tested?', 'عارف إيه بالفعل أو جربت إيه؟'), c('We tested with 20 customers; 14 reordered.', 'جربنا مع ٢٠ عميل، و١٤ أعادوا الطلب.')),
    depthSlot(),
  ],
  nameLabel: c('Your business name', 'اسم مشروعك'), nameWhat: 'the business name',
  avoidVocab: { en: ['invented market sizes', 'numbers with no date', 'blog statistics with no source', 'global figures for a local question', 'hype'], ar: ['أحجام سوق متألفة', 'أرقام من غير تاريخ', 'إحصائيات مدونات من غير مصدر', 'أرقام عالمية لسؤال محلي', 'تهويل'] },
  outlineKey: 'reportOutline', outlineDesc: 'One line per section of the research, in order.', outlineWhat: 'one line per section of the research',
  outputDescription: c('A research prompt with sourcing rules, the report sections, what is still unknown, and a checklist.', 'برومبت بحث بقواعد المصادر، وأقسام التقرير، واللي لسه مجهول، وقائمة فحص.'),
  role: 'Senior market researcher who works on real decisions, and a prompt engineer for research AIs.',
  understanding: [
    'subject is the one question; decision sets the depth and what matters; scope limits the market and the period; known is the only data the user already has.',
    'sections.goal states the question, the market, the period, and the decision it serves.',
  ],
  intelligence: [
    'Structure: the short answer first, demand evidence, market size with the method used to estimate it, who already serves this need, what customers pay today, the barriers to entry, and what the evidence does not cover. Where a market size has to be estimated, require the calculation shown step by step from named inputs.',
    'sections.approach tells the AI to answer the question in the first lines, to build any estimate bottom-up from countable inputs rather than citing a headline figure, and to state the confidence in each finding.',
  ],
  controlExtra: sourceRules,
  deliveryExtra: sourceDelivery,
  examples: [{
    good: 'Short answer first, then: estimated size built bottom-up ([office workers in Cairo] × [share who buy lunch out] × [average spend]) with each input sourced and dated, then the three existing players and their prices, then "what we could not find: actual repeat rates".',
    bad: 'The meal-prep market is worth $4.2B and growing 300% a year, so demand is huge and you should launch immediately.',
    why: 'The bad one invents a figure with no source, no date, no market scope, and no method.',
  }],
});

export const audienceResearch = makeTextMission({
  id: 'audience-research', title: c('Audience research', 'بحث جمهور'), topics: ['audience-research'],
  intake: { question: c('Tell me who you want to understand and what you want to learn about them.', 'قولّي عايز تفهم مين، وعايز تعرف عنهم إيه.'), why: c('I build the prompt so the AI cites sources and separates evidence from guesses.', 'هبني البرومبت بشكل يخلي الـ AI يجيب مصادر ويفصل الدليل عن التخمين.'),
    starters: [c('Who exactly is my customer?', 'مين عميلي بالظبط؟'), c('Why do people not buy from me?', 'ليه الناس ما بتشتريش مني؟'), c('What does my audience care about?', 'جمهوري بيهمه إيه؟'), c('Where does my audience spend time online?', 'جمهوري بيقعد فين أونلاين؟')] },
  slots: [
    question(c('Who and what you want to know', 'مين وعايز تعرف إيه'), c('Who is the audience, and what do you need to understand about them?', 'الجمهور مين، وعايز تفهم عنهم إيه؟'), c('Mothers of young children in Cairo — why they choose one nursery over another.', 'أمهات أطفال صغيرة في القاهرة — بيختاروا حضانة على التانية ليه.'), { en: ['who they are', 'what they care about', 'where they look', 'what stops them buying', 'what they pay', 'what words they use'], ar: ['هم مين', 'بيهمهم إيه', 'بيدوروا فين', 'إيه اللي بيمنعهم يشتروا', 'بيدفعوا كام', 'بيستخدموا أنهي كلام'] }),
    decision(c('What to put in our ads and on the site.', 'إيه اللي نحطه في الإعلانات والموقع.'), { en: ['what to say in ads', 'which channel', 'what to build next', 'how to price', 'who to target'], ar: ['نقول إيه في الإعلانات', 'أنهي قناة', 'نبني إيه بعد كده', 'نسعّر إزاي', 'نستهدف مين'] }),
    facts('known', c('What you see already', 'اللي شايفه بالفعل'), c('What do your own customers, messages or numbers already tell you?', 'عملاؤك ورسائلهم وأرقامك بيقولوا إيه بالفعل؟'), c('Most ask about safety first, then price; 60% come from Instagram.', 'أغلبهم بيسأل على الأمان الأول وبعدها السعر؛ و٦٠٪ جايين من إنستجرام.')),
    depthSlot(),
  ],
  nameLabel: c('Your business name', 'اسم مشروعك'), nameWhat: 'the business name',
  avoidVocab: { en: ['invented personas', 'stereotypes', 'survey numbers with no source', 'assuming they are like me', 'demographics with no behaviour'], ar: ['شخصيات متألفة', 'أحكام نمطية', 'أرقام استبيانات من غير مصدر', 'افتراض إنهم زيي', 'بيانات سكانية من غير سلوك'] },
  outlineKey: 'reportOutline', outlineDesc: 'One line per section of the research, in order.', outlineWhat: 'one line per section of the research',
  outputDescription: c('A research prompt with sourcing rules, the audience sections, the open questions, and a checklist.', 'برومبت بحث بقواعد المصادر، وأقسام الجمهور، والأسئلة المفتوحة، وقائمة فحص.'),
  role: 'Senior qualitative researcher who turns audience work into messaging, and a prompt engineer for research AIs.',
  understanding: [
    'subject is who and what; decision decides what to dig into; known is the user\'s own evidence and is treated as the strongest signal they have.',
    'sections.goal states the audience, what must be understood, and what it will be used for.',
  ],
  intelligence: [
    'Structure: segments that behave differently (not just age brackets), what each one is trying to achieve, what worries them before buying, the words they use themselves, where they look for an answer, what makes them choose one option over another, and the objections to answer directly.',
    'sections.approach tells the AI to separate what the sources and the user\'s own data show from what it is inferring, to quote the audience\'s own wording where sources allow, and to end with the five questions worth asking real customers.',
  ],
  controlExtra: [
    ...sourceRules,
    'Never build a persona from assumptions. Any segment that is not supported by a source or by the user\'s own data must be labelled as a hypothesis to test.',
    'Never characterise a group by stereotype — describe behaviour, not identity.',
  ],
  deliveryExtra: [...sourceDelivery, 'The prompt must end with five questions to ask real customers, so the gaps get closed with evidence rather than guesses.'],
  examples: [{
    good: 'Segment: first-time mothers choosing a nursery. Goal: a safe place close to work. Worry before buying: who is actually with the child. Their words: "do they send photos during the day?" [from your own messages]. Hypothesis to test: price matters less than distance.',
    bad: 'Your audience is women 25–40 who love shopping, are emotional buyers, and spend all day on social media.',
    why: 'The bad one is a stereotype with no evidence and nothing you could put in an ad.',
  }],
});

export const deepResearch = makeTextMission({
  id: 'deep-research', title: c('Deep research', 'بحث متعمق'), topics: ['deep-research', 'literature-review'],
  intake: { question: c('Tell me the question you want researched properly.', 'قولّي السؤال اللي عايز تبحثه بجدية.'), why: c('I build the prompt so the AI works in stages and cites everything.', 'هبني البرومبت بشكل يخلي الـ AI يشتغل على مراحل ويوثّق كل حاجة.'),
    starters: [c('Research this topic thoroughly for me', 'ابحث الموضوع ده بعمق'), c('What does the research say about this?', 'الدراسات بتقول إيه في ده؟'), c('Compare the approaches to this problem', 'قارن المناهج لحل المشكلة دي'), c('A literature review for my thesis', 'مراجعة أدبيات لرسالتي')] },
  slots: [
    question(c('The research question', 'سؤال البحث'), c('What is the question, and what would a good answer let you do?', 'السؤال إيه، والإجابة الحلوة هتخليك تعمل إيه؟'), c('What actually works to reduce staff turnover in retail?', 'إيه اللي بيقلل فعلاً دوران الموظفين في الريتيل؟'), { en: ['what works for', 'what causes', 'compare approaches', 'what is the evidence', 'is it true that', 'how do others do it'], ar: ['إيه اللي بينفع في', 'إيه السبب في', 'قارن المناهج', 'إيه الدليل', 'هل صحيح إن', 'الناس بتعملها إزاي'] }),
    decision(c('Choose which retention programme to run.', 'أختار أنهي برنامج للحفاظ على الموظفين.'), { en: ['choose an approach', 'write a report', 'convince my team', 'plan a project', 'understand the field'], ar: ['أختار منهج', 'أكتب تقرير', 'أقنع فريقي', 'أخطط لمشروع', 'أفهم المجال'] }),
    { id: 'sources', kind: 'multi', layer: 'control', importance: 'important',
      label: c('Sources to rely on', 'المصادر اللي نعتمد عليها'), question: c('What kind of sources should it rely on?', 'يعتمد على أنهي نوع مصادر؟'),
      why: c('Naming the sources is what separates research from browsing.', 'تحديد المصادر هو الفرق بين البحث والتفرج.'),
      example: c('Studies and official data.', 'دراسات وبيانات رسمية.'),
      options: [
        { value: 'academic', label: c('Studies and papers', 'دراسات وأوراق علمية'), keywords: ['studies', 'papers', 'academic', 'دراسات', 'بحوث'] },
        { value: 'official', label: c('Official and government data', 'بيانات رسمية وحكومية'), keywords: ['official', 'government', 'رسمي', 'حكومي'] },
        { value: 'industry', label: c('Industry and company reports', 'تقارير قطاع وشركات'), keywords: ['industry', 'reports', 'قطاع', 'تقارير'] },
        { value: 'news', label: c('Reputable news', 'أخبار موثوقة'), keywords: ['news', 'أخبار'] },
        { value: 'practitioners', label: c('Practitioners writing about their own work', 'ممارسين بيكتبوا عن شغلهم'), keywords: ['practitioners', 'case study', 'ممارسين', 'حالات'] },
      ],
      defaults: [{ value: ['academic', 'official'], reason: c('Studies and official data are the hardest to argue with.', 'الدراسات والبيانات الرسمية أصعب حاجة حد يجادل فيها.') }] },
    depthSlot(),
  ],
  nameLabel: c('Your name or organisation', 'اسمك أو جهتك'), nameWhat: 'the name given',
  avoidVocab: { en: ['invented citations', 'studies that do not exist', 'quoting an abstract as a finding', 'one study as proof', 'ignoring contrary evidence'], ar: ['مراجع متألفة', 'دراسات مش موجودة', 'اقتباس الملخص كنتيجة', 'دراسة واحدة كدليل', 'تجاهل الدليل المعاكس'] },
  outlineKey: 'reportOutline', outlineDesc: 'One line per stage or section of the research, in order.', outlineWhat: 'one line per stage of the research',
  outputDescription: c('A staged research prompt with sourcing rules, the report sections, the open questions, and a checklist.', 'برومبت بحث على مراحل بقواعد المصادر، وأقسام التقرير، والأسئلة المفتوحة، وقائمة فحص.'),
  role: 'Senior researcher who reviews evidence for a living, and a prompt engineer for research AIs.',
  understanding: [
    'subject is the question; decision sets what counts as a useful answer; sources constrains what may be cited.',
    'sections.goal states the question, the decision it serves, and the kinds of sources allowed.',
  ],
  intelligence: [
    'Make the AI work in stages and show each one: break the question into sub-questions, search per sub-question, record what each source says with its date and type, then synthesise — where the evidence agrees, where it conflicts, how strong it is, and what it does not cover.',
    'sections.approach tells the AI to weigh evidence by type and recency rather than by how often a claim is repeated, to present the strongest case against its own conclusion, and to never treat a single study as settled.',
  ],
  controlExtra: [
    ...sourceRules,
    'Never fabricate a citation, a title, an author, a journal or a date. If a source cannot be verified, it must be dropped and the gap noted.',
  ],
  deliveryExtra: [...sourceDelivery, 'sections.output must require a per-finding confidence (strong / mixed / weak) with the reason, and a final list of open questions.'],
  examples: [{
    good: 'Sub-question 2: does pay alone reduce turnover? Evidence: three studies [titles, years] say pay helps only below a threshold; one industry report disagrees [date]. Confidence: mixed — different sectors. Not covered: retail in this region.',
    bad: 'According to a 2023 Harvard study, raising pay by 10% cuts turnover by 47% — this is proven and settled.',
    why: 'The bad one leans on a single conveniently cited study, with no verifiable reference and a false claim of certainty.',
  }],
});

export const factChecking = makeTextMission({
  id: 'fact-checking', title: c('Fact-check', 'تحقق من معلومة'), topics: ['fact-checking'],
  questionBudget: 2,
  intake: { question: c('Tell me the claim you want checked, and where you saw it.', 'قولّي المعلومة اللي عايز تتأكد منها، وشوفتها فين.'), why: c('I build the prompt so the AI verifies against primary sources instead of agreeing with you.', 'هبني البرومبت بشكل يخلي الـ AI يتحقق من المصادر الأصلية بدل ما يوافقك.'),
    starters: [c('Is this news true?', 'الخبر ده صح؟'), c('Someone told me this — is it right?', 'حد قالي كده، صح؟'), c('Check this statistic for me', 'اتأكد من الإحصائية دي'), c('Is this quote real?', 'الاقتباس ده حقيقي؟')] },
  slots: [
    question(c('The claim', 'المعلومة'), c('What exactly is the claim? Write it as you heard it.', 'المعلومة إيه بالظبط؟ اكتبها زي ما سمعتها.'), c('"Exports from this sector grew 40% last year."', '"صادرات القطاع ده زادت ٤٠٪ السنة اللي فاتت."'), { en: ['a statistic', 'a news story', 'a quote', 'a health claim', 'a law or rule', 'something I was told'], ar: ['إحصائية', 'خبر', 'اقتباس', 'معلومة صحية', 'قانون أو قاعدة', 'حاجة حد قالها'] }),
    { id: 'origin', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 400,
      label: c('Where you saw it', 'شوفتها فين'), question: c('Where did you see or hear it, and when?', 'شوفتها أو سمعتها فين، وإمتى؟'),
      why: c('The origin is usually the fastest way to check it.', 'المصدر غالباً أسرع طريق للتحقق.'),
      example: c('A post on Facebook last week, no source given.', 'بوست على فيسبوك الأسبوع اللي فات، من غير مصدر.'),
      vocabulary: { en: ['social media post', 'a news site', 'a WhatsApp message', 'a colleague said it', 'an ad', 'I do not remember'], ar: ['بوست سوشيال', 'موقع أخبار', 'رسالة واتساب', 'زميل قالها', 'إعلان', 'مش فاكر'] },
      noneLabel: c('I do not remember', 'مش فاكر'),
      defaults: [{ value: 'none', reason: c('Then the prompt asks the AI to trace the claim back to its earliest source.', 'يبقى البرومبت هيخلي الـ AI يرجّع المعلومة لأقدم مصدر ليها.') }] },
  ],
  nameLabel: c('Name that must stay exact', 'اسم لازم يفضل بالحرف'), nameWhat: 'any name in the claim',
  avoidVocab: { en: ['agreeing with me', 'a verdict with no source', 'one source only', 'guessing when it cannot verify', 'confusing similar numbers'], ar: ['يوافقني', 'حكم من غير مصدر', 'مصدر واحد بس', 'تخمين لما ما يقدرش يتحقق', 'خلط أرقام متشابهة'] },
  outlineKey: 'reportOutline', outlineDesc: 'One line per check performed, in order.', outlineWhat: 'one line per check performed',
  outputDescription: c('A verification prompt, the checks to run, the verdict format, and a checklist.', 'برومبت تحقق، والفحوصات المطلوبة، وشكل الحكم، وقائمة فحص.'),
  role: 'Senior fact-checker, and a prompt engineer for research AIs.',
  understanding: [
    'subject is the claim exactly as heard; origin is the first thing to trace.',
    'sections.goal states the claim verbatim, where it came from, and that the task is to verify, not to agree.',
  ],
  intelligence: [
    'Require: restate the claim precisely and name what would make it true or false, trace it to its earliest source, check that source against at least two independent primary sources, check the exact wording and the numbers (what is being counted, over what period, in what units), then give a verdict with the reasoning.',
    'sections.approach tells the AI that a verdict must be one of true / mostly true / misleading / false / cannot be verified, each with the sources behind it, and that "cannot be verified" is a valid and often correct answer.',
  ],
  controlExtra: [
    ...sourceRules,
    'The prompt must forbid agreeing with the user as a default, and must require the AI to state plainly when the claim turns out to be true, false, or simply unverifiable.',
    'Numbers must be compared like for like — the prompt must require checking the unit, the period and the definition before calling a figure wrong.',
  ],
  deliveryExtra: [...sourceDelivery, 'sections.output must require the verdict, the reasoning in a few lines, the sources with dates, and what would change the verdict.'],
  examples: [{
    good: 'Claim restated. Earliest source: a post with no reference. Official export data [publisher, date] shows 12% for the same period; the 40% figure matches a different sub-category. Verdict: misleading — right direction, wrong number and wrong category.',
    bad: 'Yes, that sounds right — exports did grow a lot last year, around 40%, which is consistent with the general trend.',
    why: 'The bad one agrees with the user, cites nothing, and repeats the unverified number.',
  }],
});

export const productComparison = makeTextMission({
  id: 'product-comparison', title: c('Compare options', 'مقارنة اختيارات'), topics: ['product-comparison'],
  intake: { question: c('Tell me what you are choosing between and what matters to you.', 'قولّي بتختار بين إيه وإيه، وإيه اللي يهمك.'), why: c('I build the prompt so the AI compares on your criteria, with sources and prices dated.', 'هبني البرومبت بشكل يخلي المقارنة على معاييرك، بمصادر وأسعار بتواريخها.'),
    starters: [c('Which tool should I use?', 'أستخدم أنهي أداة؟'), c('Compare these three suppliers', 'قارن التلات موردين دول'), c('Which plan is better for me?', 'أنهي باقة أحسن لي؟'), c('Buy or subscribe?', 'أشتري ولا أشترك؟')] },
  slots: [
    question(c('The options', 'الاختيارات'), c('What are you choosing between? Name them.', 'بتختار بين إيه وإيه؟ سمّيهم.'), c('Between Shopify, WooCommerce and a custom store.', 'بين Shopify وWooCommerce ومتجر مخصص.'), { en: ['between A and B', 'three suppliers', 'two plans', 'buy or rent', 'build or buy'], ar: ['بين A و B', 'تلات موردين', 'باقتين', 'شراء ولا إيجار', 'نبني ولا نشتري'] }),
    { id: 'criteria', kind: 'longtext', layer: 'intelligence', importance: 'critical', maxLength: 700,
      label: c('What matters to you', 'اللي يهمك'), question: c('What matters most, in order?', 'إيه الأهم، بالترتيب؟'),
      why: c('A comparison without your criteria is just a feature table.', 'المقارنة من غير معاييرك تبقى جدول مميزات.'),
      example: c('Total cost over two years first, then Arabic support, then how easy my team can use it.', 'التكلفة الكاملة على سنتين الأول، وبعدها دعم العربي، وبعدها سهولة الاستخدام لفريقي.'),
      vocabulary: { en: ['total cost', 'ease of use', 'Arabic support', 'local payment', 'support quality', 'speed', 'can I leave later'], ar: ['التكلفة الكاملة', 'سهولة الاستخدام', 'دعم العربي', 'دفع محلي', 'جودة الدعم', 'السرعة', 'أقدر أسيبه بعدين'] } },
    decision(c('Pick one and sign up this month.', 'أختار واحد وأشترك الشهر ده.'), { en: ['pick one now', 'plan a migration', 'negotiate', 'budget for it'], ar: ['أختار دلوقتي', 'أخطط للنقل', 'أتفاوض', 'أحسب ميزانيتها'] }),
    depthSlot(),
  ],
  nameLabel: c('Your business name', 'اسم مشروعك'), nameWhat: 'the business name',
  avoidVocab: { en: ['invented prices', 'affiliate-style recommendations', 'feature lists with no weighting', 'ignoring the cost of leaving', 'a tie as the answer'], ar: ['أسعار متألفة', 'ترشيحات دعائية', 'قوايم مميزات من غير ترجيح', 'تجاهل تكلفة الخروج', 'إجابة تعادل'] },
  outlineKey: 'reportOutline', outlineDesc: 'One line per section of the comparison, in order.', outlineWhat: 'one line per section of the comparison',
  outputDescription: c('A comparison prompt built on your criteria, the sections, what is still unknown, and a checklist.', 'برومبت مقارنة مبني على معاييرك، والأقسام، واللي لسه مجهول، وقائمة فحص.'),
  role: 'Senior consultant who makes buying decisions with clients, and a prompt engineer for research AIs.',
  understanding: [
    'subject names the options; criteria is the ranked basis for the comparison and nothing else may outrank it; decision sets the timeframe.',
    'sections.goal states the options, the ranked criteria, and the decision to be made.',
  ],
  intelligence: [
    'Require: a table of the options against the user\'s criteria in their order, the total cost over the relevant period (not the monthly headline), what each option is genuinely best at, the hidden costs and the cost of leaving later, then one recommendation with the condition that would change it.',
    'sections.approach tells the AI to weigh by the user\'s own order, to price the whole period including setup, migration and exit, and to end with a single recommendation rather than a balanced shrug.',
  ],
  controlExtra: [
    ...sourceRules,
    'Prices and plan limits must carry the date they were checked, because they change. Never recommend based on popularity alone.',
  ],
  deliveryExtra: [...sourceDelivery, 'sections.output must require one clear recommendation plus "what would change this answer".'],
  examples: [{
    good: 'Criteria in your order: 2-year total cost, Arabic support, team ease. Two-year totals computed with setup and migration [prices checked on date]. Recommendation: option B, unless you need [condition] — then A.',
    bad: 'All three are great options with their own pros and cons, and the most popular one is usually the safest choice. Pricing starts from around $29.',
    why: 'The bad one refuses to decide, ignores the user\'s criteria, and gives an undated, invented price.',
  }],
});

export const researchBlueprints = [marketResearch, audienceResearch, deepResearch, factChecking, productComparison];
