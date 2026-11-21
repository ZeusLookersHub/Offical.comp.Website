import type { Copy, Gate, Slot } from '../types.ts';
import { c } from '../modules.ts';
import { makeTextMission, toneSlot } from './_text.ts';

/**
 * Edit missions work on something the user already has.
 * The prompt never swallows the document: it ends with a paste block, so the
 * prompt stays short enough to travel in a link and the user pastes the file
 * into the tool. This gate makes sure that block is really there.
 */
export const pasteBlockGate = (): Gate => ({
  id: 'paste-block', kind: 'includes-when',
  when: [{ slot: 'language', equals: ['ar', 'en', 'both'] }],
  field: 'prompt', anyOf: ['>>>', 'paste', 'الصق'],
  message: c('Ends with a place to paste what you already have', 'بينتهي بمكان تلزق فيه اللي عندك'),
});

/** What the user already has, described — not pasted. */
const haveSlot = (label: Copy, question: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'current', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1200,
  label, question, why: c('I need to know what you have before I say what to change.', 'لازم أعرف عندك إيه قبل ما أقول يتغيّر إيه.'), example, vocabulary: vocab,
});

/** What is wrong with it — the actual brief for an edit. */
const problemSlot = (question: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'problem', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 800,
  label: c('What you want changed', 'عايز تغيّر إيه'), question,
  why: c('This is the whole job: change this, keep the rest.', 'دي المهمة كلها: غيّر ده، وسيب الباقي.'), example, vocabulary: vocab,
});

/** How far the AI may go — the difference between a polish and a rewrite. */
const depthSlot = (): Slot => ({
  id: 'depth', kind: 'single', layer: 'control', importance: 'important',
  label: c('How far to go', 'تغيّر لحد فين'), question: c('How much should it change?', 'يتغيّر أد إيه؟'),
  why: c('Most bad edits are rewrites nobody asked for.', 'أغلب التعديلات الوحشة بتبقى إعادة كتابة محدش طلبها.'),
  example: c('Light touch only.', 'لمسات خفيفة بس.'),
  options: [
    { value: 'proof', label: c('Fix mistakes only', 'تصحيح الأخطاء بس'), keywords: ['proofread', 'typos', 'تصحيح', 'أخطاء'] },
    { value: 'light', label: c('Light polish, keep my words', 'تلميع خفيف، وخلي كلامي'), keywords: ['light', 'polish', 'خفيف', 'تلميع'] },
    { value: 'restructure', label: c('Restructure, keep the content', 'إعادة ترتيب، والمحتوى زي ما هو'), keywords: ['restructure', 'reorder', 'ترتيب', 'هيكل'] },
    { value: 'rewrite', label: c('Rewrite properly', 'إعادة كتابة كاملة'), keywords: ['rewrite', 'إعادة كتابة'] },
  ],
  defaults: [{ value: 'light', reason: c('A light polish keeps your voice and still fixes the weak parts.', 'التلميع الخفيف بيحافظ على صوتك وبيظبط الحاجات الضعيفة.') }],
});

const changeLogRules = (what: string) => [
  `The prompt must require a short change log: what was changed in ${what} and why, line by line, after the revised version.`,
  'The prompt must require the AI to ask before filling any gap it cannot find in the pasted content, instead of inventing it.',
];

const pasteRules = (what: string) => [
  `prompt must end with a clearly marked paste block: a line of >>> then "${what}" then a line of <<<, so the user drops the original in and sends.`,
  'The prompt must tell the AI to work only on what is inside the paste block and to keep every fact in it unchanged.',
];

export const cvImprove = makeTextMission({
  id: 'cv-improve', title: c('Improve my CV', 'ظبّط الـ CV بتاعي'), topics: ['cv-improve'],
  intake: { question: c('Tell me what CV you have and what you want fixed.', 'قولّي عندك CV إيه، وعايز تظبط فيه إيه.'), why: c('I work on your CV as it is — I never invent experience.', 'بشتغل على الـ CV بتاعك زي ما هو، وعمري ما هألّف خبرة.'),
    starters: [c('My CV gets no replies', 'الـ CV بتاعي ما بيجيش عليه رد'), c('Tailor my CV to this job ad', 'ظبّط الـ CV على إعلان الوظيفة ده'), c('My CV is 3 pages — shorten it', 'الـ CV ٣ صفحات، قصّره'), c('Fix the wording and the mistakes', 'ظبّط الصياغة والأخطاء')] },
  slots: [
    haveSlot(c('The CV you have', 'الـ CV اللي عندك'), c('What does your CV look like now? (how many pages, sections, how old)', 'الـ CV شكله إيه دلوقتي؟ (كام صفحة، أقسامه، آخر تحديث)'), c('Two pages, a long duties list per job, last updated two years ago.', 'صفحتين، وقايمة مهام طويلة لكل وظيفة، وآخر تحديث سنتين.'), { en: ['one page', 'two pages', 'duties list', 'no summary', 'outdated', 'in English', 'in Arabic'], ar: ['صفحة', 'صفحتين', 'قايمة مهام', 'مفيش ملخص', 'قديم', 'بالإنجليزي', 'بالعربي'] }),
    problemSlot(c('What should change, and what must stay?', 'إيه اللي يتغيّر، وإيه اللي يفضل؟'), c('Make it one page and aimed at a marketing manager role; keep all my job dates.', 'خليه صفحة واحدة وموجّه لوظيفة مدير تسويق؛ وخلي تواريخ وظايفي زي ما هي.'), { en: ['make it one page', 'aim it at this role', 'stronger wording', 'fix mistakes', 'keep my dates', 'keep the design'], ar: ['خليه صفحة', 'وجّهه للوظيفة دي', 'صياغة أقوى', 'ظبّط الأخطاء', 'خلي التواريخ', 'خلي التصميم'] }),
    { id: 'role', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 300,
      label: c('Target role', 'الوظيفة المستهدفة'), question: c('Which role should it be aimed at? Paste the ad if you have it.', 'يبقى موجّه لأنهي وظيفة؟ الصق الإعلان لو عندك.'),
      why: c('A CV aimed at one role beats a CV for everything.', 'الـ CV الموجّه لوظيفة واحدة أقوى من الـ CV اللي لكل حاجة.'),
      example: c('Marketing manager, e-commerce.', 'مدير تسويق، تجارة إلكترونية.'),
      noneLabel: c('Keep it general', 'خليه عام'),
      defaults: [{ value: 'none', reason: c('Without a target role we strengthen it generally and mark where to tailor.', 'من غير وظيفة مستهدفة هنقوّيه عموماً ونحدد أماكن التخصيص.') }] },
    depthSlot(),
  ],
  nameLabel: c('Your name', 'اسمك'), nameWhat: 'your name',
  avoidVocab: { en: ['invented experience', 'changing my dates or titles', 'empty phrases', 'skill rating bars', 'adding a photo'], ar: ['خبرة متألفة', 'تغيير تواريخي أو مسمياتي', 'كلام فاضي', 'نسب مهارات', 'إضافة صورة'] },
  outlineKey: 'editOutline', outlineDesc: 'One line per planned change: section — what changes — why.', outlineWhat: 'one line per planned change',
  outputDescription: c('A layered prompt that edits the CV you paste in, the planned changes, what you still need, and a checklist.', 'برومبت بيعدّل الـ CV اللي هتلزقه، والتعديلات المخططة، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior recruiter who rewrites CVs for a living, and a prompt engineer for chat AIs.',
  understanding: [
    'current is the CV as it stands; problem is the brief; role is what the CV gets aimed at; depth is the ceiling on how much may change.',
    'sections.goal states what the user has, what should change, and what must stay exactly as it is.',
  ],
  intelligence: [
    'The prompt must tell the AI to work section by section: keep every job, date and title as given, turn duties into results, cut anything that does not serve the target role, and mirror the ad\'s wording only where it is honestly true.',
    'sections.approach tells the AI to respect depth strictly — a light polish is not a rewrite — and to show what it cut as well as what it kept.',
  ],
  controlExtra: [
    'Never invent, upgrade or round a job title, a date, an employer, a degree or a number. Nothing enters the CV that is not in the pasted text or given by the user.',
    ...changeLogRules('the CV'),
  ],
  deliveryExtra: pasteRules('PASTE YOUR CV BELOW'),
  extraGates: [pasteBlockGate()],
  examples: [{
    good: 'Rules: keep every employer, title and date exactly as pasted. Depth: light polish only. Cut: the hobbies section and the duties that do not serve a marketing manager role. Then list what you changed and why.',
    bad: 'Rewrite this CV to look amazing, add relevant experience to fill the gaps, round the years up, and make it 10+ years of experience.',
    why: 'The bad one invents experience and changes dates — which is what gets a candidate caught in the interview.',
  }],
});

export const deckImprove = makeTextMission({
  id: 'deck-improve', title: c('Improve my presentation', 'ظبّط العرض بتاعي'), topics: ['deck-improve'],
  intake: { question: c('Tell me what deck you have and what is wrong with it.', 'قولّي عندك عرض إيه، وإيه اللي مضايقك فيه.'), why: c('I work on your deck as it is — your numbers stay your numbers.', 'بشتغل على عرضك زي ما هو، وأرقامك تفضل أرقامك.'),
    starters: [c('My deck is too long and too wordy', 'العرض بتاعي طويل ومليان كلام'), c('Make my deck ready for investors', 'خلي عرضي جاهز للمستثمرين'), c('The story does not flow', 'الحكاية مش ماشية'), c('Tighten my deck to 10 slides', 'قصّر العرض لعشر شرائح')] },
  slots: [
    haveSlot(c('The deck you have', 'العرض اللي عندك'), c('What is the deck about, how many slides, and what is on them?', 'العرض عن إيه، وكام شريحة، وعليها إيه؟'), c('A 22-slide company profile, mostly text, no numbers on the service slides.', 'بروفايل شركة ٢٢ شريحة، معظمه كلام، ومفيش أرقام على شرائح الخدمات.'), { en: ['pitch deck', 'company profile', 'sales deck', 'too many slides', 'too much text', 'no visuals', 'in Arabic'], ar: ['عرض استثماري', 'بروفايل شركة', 'عرض بيعي', 'شرائح كتير', 'كلام كتير', 'مفيش صور', 'بالعربي'] }),
    problemSlot(c('What should change, and what must stay?', 'إيه اللي يتغيّر، وإيه اللي يفضل؟'), c('Cut it to 12 slides and make the story flow; keep our numbers and the order of the service slides.', 'قصّره لـ١٢ شريحة وخلي الحكاية ماشية؛ وخلي أرقامنا وترتيب شرائح الخدمات.'), { en: ['fewer slides', 'less text', 'better story', 'stronger opening', 'keep our numbers', 'keep the design'], ar: ['شرائح أقل', 'كلام أقل', 'حكاية أحسن', 'بداية أقوى', 'خلي أرقامنا', 'خلي التصميم'] }),
    { id: 'audience', kind: 'single', layer: 'understanding', importance: 'important',
      label: c('Who will watch', 'مين هيتفرج'), question: c('Who is the deck for?', 'العرض لمين؟'),
      why: c('The audience decides what gets cut.', 'الجمهور بيحدد إيه اللي يتشال.'), example: c('Potential clients.', 'عملاء محتملين.'),
      options: [
        { value: 'clients', label: c('Clients', 'عملاء'), keywords: ['clients', 'عملاء'] },
        { value: 'investors', label: c('Investors', 'مستثمرين'), keywords: ['investors', 'vc', 'مستثمرين'] },
        { value: 'management', label: c('Management / board', 'إدارة / مجلس'), keywords: ['management', 'board', 'إدارة', 'مجلس'] },
        { value: 'team', label: c('The team', 'الفريق'), keywords: ['team', 'الفريق'] },
      ],
      defaults: [{ value: 'clients', reason: c('Most decks are shown to clients.', 'أغلب العروض بتتعرض على عملاء.') }] },
    depthSlot(),
  ],
  nameLabel: c('Company name', 'اسم الشركة'), nameWhat: 'the company name',
  avoidVocab: { en: ['invented numbers', 'changing our figures', 'removing required slides', 'stock photos', 'walls of text'], ar: ['أرقام متألفة', 'تغيير أرقامنا', 'شيل شرائح لازمة', 'صور جاهزة', 'شرائح مليانة كلام'] },
  outlineKey: 'editOutline', outlineDesc: 'One line per slide decision: keep, merge, cut or rewrite — and why.', outlineWhat: 'one line per slide decision',
  outputDescription: c('A layered prompt that edits the deck you paste in, the slide-by-slide decisions, what you still need, and a checklist.', 'برومبت بيعدّل العرض اللي هتلزقه، وقرار كل شريحة، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior presentation coach who tightens other people\'s decks, and a prompt engineer for chat AIs.',
  understanding: [
    'current is the deck as it stands; problem is the brief; audience decides what earns a slide; depth limits how far the edit may go.',
    'sections.goal states what the deck is, who it is for, what should change and what must stay.',
  ],
  intelligence: [
    'The prompt must make the AI decide per slide: keep, merge, cut or rewrite — with a reason — then rewrite the kept slides as one claim plus evidence plus a suggested visual, then state the new order.',
    'sections.approach tells the AI to fix the story order before the wording, to merge slides that make the same point, and to replace text blocks with a headline and three bullets.',
  ],
  controlExtra: [
    'Never change, add or round a number, a client name or a date from the pasted deck. Never delete a slide the user said to keep.',
    ...changeLogRules('the deck'),
  ],
  deliveryExtra: pasteRules('PASTE YOUR SLIDES BELOW (one slide per block)'),
  extraGates: [pasteBlockGate()],
  examples: [{
    good: 'Per slide: "Slides 7–9 make the same point → merge into one: \'Handover on time, 38 times\'." Keep every figure as pasted. New order listed at the end, 12 slides.',
    bad: 'Rewrite the whole deck, add impressive market statistics, and make the numbers rounder so they look better.',
    why: 'The bad one invents statistics and changes the company\'s own figures.',
  }],
});

export const rewriteText = makeTextMission({
  id: 'rewrite', title: c('Rewrite or proofread', 'إعادة صياغة أو تصحيح'), topics: ['rewrite', 'proofreading'],
  intake: { question: c('Tell me what you have written and what you want done to it.', 'قولّي كتبت إيه، وعايز تعمل فيه إيه.'), why: c('I keep your meaning and your facts. You paste the text into the tool.', 'بحافظ على معناك ومعلوماتك، وإنت بتلزق النص في الأداة.'),
    starters: [c('Fix the mistakes in my text', 'ظبّط الأخطاء في نصي'), c('Make this shorter and clearer', 'خليه أقصر وأوضح'), c('Make this more professional', 'خليه أكثر احترافية'), c('Rewrite this for social media', 'أعِد صياغته للسوشيال')] },
  slots: [
    haveSlot(c('What you have', 'اللي عندك'), c('What is the text, who is it for, and how long is it?', 'النص إيه، لمين، وطوله أد إيه؟'), c('A 400-word email to a client explaining a delay.', 'إيميل ٤٠٠ كلمة لعميل يشرح تأخير.'), { en: ['email', 'post', 'article', 'report', 'message', 'for a client', 'for my boss', '400 words'], ar: ['إيميل', 'بوست', 'مقال', 'تقرير', 'رسالة', 'لعميل', 'لمديري', '٤٠٠ كلمة'] }),
    problemSlot(c('What should change about it?', 'عايز تغيّر فيه إيه؟'), c('Shorter, warmer, and no excuses — but keep the dates I promised.', 'أقصر وأدفى ومن غير أعذار، وخلي التواريخ اللي وعدت بيها.'), { en: ['shorter', 'clearer', 'more formal', 'friendlier', 'fix grammar', 'keep the facts', 'keep my voice'], ar: ['أقصر', 'أوضح', 'أرسمي', 'أدفى', 'ظبّط القواعد', 'خلي المعلومات', 'خلي صوتي'] }),
    toneSlot({ importance: 'nice', label: c('Target tone', 'النبرة المطلوبة') }),
    depthSlot(),
  ],
  nameLabel: c('Name that must stay exact', 'اسم لازم يفضل بالحرف'), nameWhat: 'any name in the text',
  avoidVocab: { en: ['changing my facts', 'adding claims', 'AI-sounding phrases', 'making it longer', 'changing names or numbers'], ar: ['تغيير معلوماتي', 'إضافة وعود', 'جمل بتبان AI', 'تطويله', 'تغيير أسماء أو أرقام'] },
  outlineKey: 'editOutline', outlineDesc: 'One line per change: what changes — why.', outlineWhat: 'one line per change',
  outputDescription: c('A layered prompt that edits the text you paste in, the planned changes, and a checklist.', 'برومبت بيعدّل النص اللي هتلزقه، والتعديلات المخططة، وقائمة فحص.'),
  role: 'Senior editor who tightens other people\'s writing without erasing their voice, and a prompt engineer for chat AIs.',
  understanding: ['current describes the text and its reader; problem is the brief; depth is the ceiling; tone is the target.', 'sections.goal states what the text is, who reads it, and what should change.'],
  intelligence: [
    'The prompt must require two outputs: the revised text, then a short list of what changed and why. For proofreading depth, only errors are touched and the wording stays.',
    'sections.approach tells the AI to cut rather than add, to keep the writer\'s own phrasing where it already works, and to flag any sentence whose meaning it could not keep.',
  ],
  controlExtra: ['Never change a name, number, date, price or promise in the pasted text. Never add a claim the text does not make.'],
  deliveryExtra: pasteRules('PASTE YOUR TEXT BELOW'),
  extraGates: [pasteBlockGate()],
  examples: [{
    good: 'Depth: light polish. Keep every date and the client name exactly. Cut the three apology sentences to one. Then list each change in a line.',
    bad: 'Rewrite this email to be amazing, add that we will compensate them, and expand it with more detail about our process.',
    why: 'The bad one adds a promise the writer never made and makes a too-long email longer.',
  }],
});

export const refineBlueprints = [cvImprove, deckImprove, rewriteText];
