import type { Blueprint, Copy, Slot } from '../types.ts';
import { c, facts } from '../modules.ts';
import { makeTextMission, toneSlot } from './_text.ts';

/** The business/offer the marketing work is for — critical in every marketing mission. */
const offer = (label: Copy, question: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'offer', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1200,
  label, question, why: c('Everything is built on what you sell and to whom.', 'كل حاجة هتتبني على إنت بتبيع إيه ولمين.'), example, vocabulary: vocab,
});

const audience = (example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'audience', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 400,
  label: c('Audience', 'الجمهور'), question: c('Who are you talking to?', 'بتكلّم مين؟'),
  why: c('The audience decides the message and the channel.', 'الجمهور بيحدد الرسالة والقناة.'), example, vocabulary: vocab,
});

const goal = (options: { value: string; label: Copy; keywords?: string[] }[], def: string, defReason: Copy): Slot => ({
  id: 'goal', kind: 'single', layer: 'understanding', importance: 'important',
  label: c('Goal', 'الهدف'), question: c('What is the goal?', 'الهدف إيه؟'),
  why: c('A plan without one goal spreads thin.', 'خطة من غير هدف واحد بتتشتت.'), example: c('More sales.', 'مبيعات أكتر.'),
  options, defaults: [{ value: def, reason: defReason }],
});

const channels = (): Slot => ({
  id: 'channels', kind: 'multi', layer: 'understanding', importance: 'important',
  label: c('Channels', 'القنوات'), question: c('Which channels do you use or want to use?', 'بتستخدم أنهي قنوات، أو عايز تستخدم إيه؟'),
  why: c('Each channel needs a different message.', 'كل قناة محتاجة رسالة مختلفة.'), example: c('Instagram and WhatsApp.', 'إنستجرام وواتساب.'),
  options: [
    { value: 'instagram', label: c('Instagram', 'إنستجرام'), keywords: ['instagram', 'انستجرام', 'انستا'] },
    { value: 'tiktok', label: c('TikTok', 'تيك توك'), keywords: ['tiktok', 'تيك توك'] },
    { value: 'facebook', label: c('Facebook', 'فيسبوك'), keywords: ['facebook', 'فيسبوك', 'فيس'] },
    { value: 'whatsapp', label: c('WhatsApp', 'واتساب'), keywords: ['whatsapp', 'واتساب', 'واتس'] },
    { value: 'google', label: c('Google search', 'بحث جوجل'), keywords: ['google', 'search', 'جوجل', 'بحث'] },
    { value: 'email', label: c('Email', 'إيميل'), keywords: ['email', 'newsletter', 'ايميل', 'نيوزليتر'] },
    { value: 'linkedin', label: c('LinkedIn', 'لينكد إن'), keywords: ['linkedin', 'لينكد ان'] },
    { value: 'youtube', label: c('YouTube', 'يوتيوب'), keywords: ['youtube', 'يوتيوب'] },
    { value: 'offline', label: c('Offline / word of mouth', 'أوفلاين / كلام الناس'), keywords: ['offline', 'word of mouth', 'اوفلاين', 'كلام الناس'] },
  ],
  defaults: [{ value: ['instagram', 'whatsapp'], reason: c('Instagram plus WhatsApp is the common base in the region.', 'إنستجرام مع واتساب هي القاعدة الشائعة في المنطقة.') }],
});

const budgetSlot = (): Slot => ({
  id: 'budget', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 200,
  label: c('Budget', 'الميزانية'), question: c('What is the monthly budget?', 'الميزانية الشهرية كام؟'),
  why: c('The budget decides what is realistic.', 'الميزانية بتحدد الواقعي إيه.'), example: c('15,000 EGP a month.', '١٥ ألف جنيه في الشهر.'),
  noneLabel: c('Placeholder to fill', 'مكان فاضي تكمّله'),
  defaults: [{ value: 'none', reason: c('We leave [budget] for you to fill, and size the plan around it.', 'هنسيب [الميزانية] تكمّلها، والخطة هتتظبط عليها.') }],
});

const horizon = (options: { value: string; label: Copy; keywords?: string[] }[], def: string): Slot => ({
  id: 'horizon', kind: 'single', layer: 'delivery', importance: 'nice',
  label: c('Time frame', 'المدة'), question: c('Over what period?', 'على مدى أد إيه؟'),
  why: c('The period decides how much detail each step gets.', 'المدة بتحدد تفاصيل كل خطوة.'), example: c('Three months.', 'تلات شهور.'),
  options, defaults: [{ value: def, reason: c('A short horizon keeps the plan actionable.', 'المدة القصيرة بتخلي الخطة قابلة للتنفيذ.') }],
});

const salesGoals = [
  { value: 'sales', label: c('More sales', 'مبيعات أكتر'), keywords: ['sales', 'revenue', 'مبيعات', 'إيرادات'] },
  { value: 'leads', label: c('More leads', 'عملاء محتملين'), keywords: ['leads', 'enquiries', 'عملاء محتملين', 'استفسارات'] },
  { value: 'awareness', label: c('Awareness', 'انتشار ووعي'), keywords: ['awareness', 'reach', 'وعي', 'انتشار'] },
  { value: 'retention', label: c('Keep existing customers', 'الحفاظ على العملاء'), keywords: ['retention', 'loyalty', 'ولاء', 'الحفاظ'] },
];

export const marketingStrategy = makeTextMission({
  id: 'marketing-strategy', title: c('Marketing strategy', 'استراتيجية تسويق'), topics: ['marketing-strategy'],
  intake: { question: c('Tell me what you sell, to whom, and what you want to achieve.', 'قولّي بتبيع إيه، ولمين، وعايز توصل لإيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A marketing strategy for my clothing store', 'استراتيجية تسويق لمتجر هدومي'), c('I want a plan to double my sales', 'عايز خطة أضاعف بيها مبيعاتي'), c('A strategy for a new gym in Cairo', 'استراتيجية لجيم جديد في القاهرة'), c('Marketing for my online course', 'تسويق للكورس الأونلاين بتاعي')] },
  slots: [
    offer(c('What you sell', 'بتبيع إيه'), c('What do you sell, and what makes you different?', 'بتبيع إيه، وإيه اللي يميّزك؟'), c('Handmade leather bags, sold online, made to order.', 'شنط جلد هاند ميد، بتتباع أونلاين، وبتتعمل بالطلب.'), { en: ['online store', 'physical shop', 'service', 'made to order', 'fast delivery', 'cheaper', 'higher quality'], ar: ['متجر أونلاين', 'محل', 'خدمة', 'بالطلب', 'توصيل سريع', 'أرخص', 'جودة أعلى'] }),
    audience(c('Women 25–40 in Cairo who buy online.', 'نساء ٢٥–٤٠ في القاهرة بيشتروا أونلاين.'), { en: ['women', 'men', 'age 25-40', 'in Cairo', 'in the Gulf', 'small business owners', 'parents'], ar: ['نساء', 'رجال', 'سن ٢٥–٤٠', 'في القاهرة', 'في الخليج', 'أصحاب مشاريع صغيرة', 'أهالي'] }),
    goal(salesGoals, 'sales', c('Sales is the goal most businesses mean.', 'المبيعات هي الهدف اللي أغلب الشركات بتقصده.')),
    channels(), budgetSlot(),
    facts('currentState', c('Where you are now', 'إنت فين دلوقتي'), c('What are you doing now, and what results are you getting?', 'بتعمل إيه دلوقتي، وبتجيب نتيجة إيه؟'), c('2,000 followers, 10 orders a month, no paid ads.', '٢٠٠٠ متابع، و١٠ أوردرات في الشهر، ومفيش إعلانات ممولة.')),
    horizon([{ value: '1m', label: c('One month', 'شهر') }, { value: '3m', label: c('Three months', 'تلات شهور') }, { value: '6m', label: c('Six months', 'ست شهور') }, { value: '12m', label: c('A year', 'سنة') }], '3m'),
  ],
  nameLabel: c('Business name', 'اسم المشروع'), nameWhat: 'the business name',
  avoidVocab: { en: ['vague buzzwords', 'channels I do not use', 'unrealistic budgets', 'invented statistics'], ar: ['كلام إنشائي', 'قنوات مش بستخدمها', 'ميزانيات غير واقعية', 'إحصائيات متألفة'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per section: section — what it covers.', outlineWhat: 'one line per section of the strategy',
  outputDescription: c('A layered prompt for a chat AI, the strategy sections, what data you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وأقسام الاستراتيجية، والمعلومات الناقصة، وقائمة فحص.'),
  role: 'Senior marketing strategist who has built plans for small and mid-size businesses in MENA, and a prompt engineer for chat AIs.',
  understanding: [
    'offer, audience and currentState are the base; goal is the single thing the plan optimises for; channels limit where the plan can play; budget decides the scale.',
    'sections.goal states the business, the audience, the one goal and the time frame in a few sentences.',
  ],
  intelligence: [
    'Cover: positioning and the one message, the audience in segments with what each one cares about, the channel plan (what to post or run on each chosen channel and why), the offer and funnel, a monthly action plan with owners, the budget split, and the 3–5 numbers to track.',
    'sections.approach tells the AI to pick one positioning and defend it, to concentrate budget on the fewest channels that can hit the goal, and to tie every tactic to the goal.',
  ],
  controlExtra: ['Never invent market sizes, benchmarks or competitor figures — use [placeholder + where to find it].'],
  examples: [{
    good: 'Positioning: the only made-to-order leather bag brand in Cairo with a 7-day turnaround. Channel plan: Instagram for discovery (3 posts + 2 reels weekly), WhatsApp for closing. Track: enquiries, close rate, cost per order.',
    bad: 'Use all social media platforms, go viral, the market is worth $4B and growing 300%, best strategy ever.',
    why: 'The bad one spreads over every channel, invents market numbers, and has no positioning or metrics.',
  }],
});

export const launchCampaign = makeTextMission({
  id: 'launch-campaign', title: c('Launch campaign', 'حملة إطلاق'), topics: ['launch-campaign', 'campaign-brief'],
  intake: { question: c('Tell me what you are launching and when.', 'قولّي بتطلق إيه، وإمتى.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A campaign for our new product', 'حملة للمنتج الجديد'), c('A launch campaign for my store opening', 'حملة لافتتاح المحل'), c('A Ramadan campaign', 'حملة رمضان'), c('A campaign for a new service', 'حملة لخدمة جديدة')] },
  slots: [
    offer(c('What you are launching', 'بتطلق إيه'), c('What are you launching, and why would anyone care?', 'بتطلق إيه، وليه حد يهتم؟'), c('A new winter collection of coats, launching next month.', 'كولكشن شتوي جديد من الجواكت، هينزل الشهر الجاي.'), { en: ['new product', 'new branch', 'new service', 'seasonal offer', 'rebrand'], ar: ['منتج جديد', 'فرع جديد', 'خدمة جديدة', 'عرض موسمي', 'هوية جديدة'] }),
    audience(c('Existing customers plus new buyers in Cairo.', 'عملاء حاليين زائد مشترين جداد في القاهرة.'), { en: ['existing customers', 'new audience', 'in Cairo', 'young', 'families'], ar: ['عملاء حاليين', 'جمهور جديد', 'في القاهرة', 'شباب', 'أسر'] }),
    goal([
      { value: 'launch-sales', label: c('Sales in the launch window', 'مبيعات في فترة الإطلاق'), keywords: ['sales', 'مبيعات'] },
      { value: 'signups', label: c('Sign-ups / waitlist', 'تسجيلات / قائمة انتظار'), keywords: ['signup', 'waitlist', 'تسجيل', 'انتظار'] },
      { value: 'buzz', label: c('Buzz and attention', 'ضجة وانتباه'), keywords: ['buzz', 'awareness', 'ضجة', 'انتشار'] },
      { value: 'footfall', label: c('Visits to the shop', 'زيارات للمحل'), keywords: ['footfall', 'visits', 'زيارات'] },
    ], 'launch-sales', c('Launches are usually judged on sales in the window.', 'الإطلاق غالباً بيتحكم عليه بمبيعات الفترة.')),
    channels(), budgetSlot(),
    { id: 'timing', kind: 'text', layer: 'delivery', importance: 'important', maxLength: 300,
      label: c('Launch date', 'تاريخ الإطلاق'), question: c('When is the launch, and how long is the campaign?', 'الإطلاق إمتى، والحملة مدتها أد إيه؟'),
      why: c('The date sets the teaser, launch and follow-up phases.', 'التاريخ بيحدد مراحل التشويق والإطلاق والمتابعة.'), example: c('Launch on 1 March, campaign for three weeks.', 'الإطلاق ١ مارس، والحملة تلات أسابيع.'),
      noneLabel: c('Placeholder to fill', 'مكان فاضي تكمّله'),
      defaults: [{ value: 'none', reason: c('We leave [launch date] and build a 3-week structure around it.', 'هنسيب [تاريخ الإطلاق] ونبني هيكل ٣ أسابيع حواليه.') }] },
  ],
  nameLabel: c('Brand / product name', 'اسم البراند أو المنتج'), nameWhat: 'the brand or product name',
  avoidVocab: { en: ['invented discounts', 'fake scarcity', 'channels I do not use', 'claims I cannot prove'], ar: ['خصومات متألفة', 'ندرة مزيّفة', 'قنوات مش بستخدمها', 'وعود مش أقدر أثبتها'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per campaign phase or deliverable.', outlineWhat: 'one line per phase of the campaign',
  outputDescription: c('A layered prompt for a chat AI, the campaign phases, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، ومراحل الحملة، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior campaign manager who has run product launches, and a prompt engineer for chat AIs.',
  understanding: ['offer is what launches; timing sets the phases; goal is what the launch window is judged on.', 'sections.goal states what launches, for whom, when, and the one result wanted.'],
  intelligence: [
    'Structure as phases: teaser (before), launch (day/week), sustain (after), with a concrete content and ads plan per phase per chosen channel, the hero message, the offer, and the measurement plan.',
    'sections.approach tells the AI to build anticipation before the date, concentrate spend on launch day, and prepare a follow-up for people who did not buy.',
  ],
  controlExtra: ['Never invent prices, discounts, dates or stock numbers — use [placeholders].'],
  examples: [{
    good: 'Teaser week: 3 behind-the-scenes reels, no price shown. Launch day: Instagram ad + WhatsApp broadcast to existing customers with the offer [offer details]. Sustain: 2 posts on real customer photos.',
    bad: 'Announce a huge 50% off limited to 24 hours only, use every platform, and say stock is almost gone.',
    why: 'The bad one invents the discount and fake scarcity, and spreads over channels with no phases.',
  }],
});

export const paidAds = makeTextMission({
  id: 'paid-ads', title: c('Paid ads plan', 'خطة إعلانات ممولة'), topics: ['paid-ads'],
  intake: { question: c('Tell me what you want to advertise and your budget.', 'قولّي عايز تعلن عن إيه، وميزانيتك.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Facebook ads for my store', 'إعلانات فيسبوك لمتجري'), c('A plan for Google ads', 'خطة إعلانات جوجل'), c('TikTok ads for a new product', 'إعلانات تيك توك لمنتج جديد'), c('My ads are expensive — I need a better plan', 'إعلاناتي غالية ومحتاج خطة أحسن')] },
  slots: [
    offer(c('What you are advertising', 'بتعلن عن إيه'), c('What are you advertising, and what should people do?', 'بتعلن عن إيه، وعايز الناس تعمل إيه؟'), c('A 3-month gym membership; we want them to book a free trial.', 'عضوية جيم ٣ شهور؛ عايزينهم يحجزوا تجربة مجانية.'), { en: ['product', 'service', 'free trial', 'book a call', 'buy now', 'visit the shop'], ar: ['منتج', 'خدمة', 'تجربة مجانية', 'حجز مكالمة', 'شراء', 'زيارة المحل'] }),
    audience(c('Men 20–35 living within 5 km of the gym.', 'رجال ٢٠–٣٥ ساكنين في نطاق ٥ كم من الجيم.'), { en: ['age range', 'city', 'within 5 km', 'interests', 'past customers', 'lookalike'], ar: ['فئة عمرية', 'مدينة', 'في نطاق ٥ كم', 'اهتمامات', 'عملاء سابقين', 'جمهور مشابه'] }),
    goal([
      { value: 'purchases', label: c('Purchases', 'شراء'), keywords: ['purchase', 'sales', 'شراء', 'مبيعات'] },
      { value: 'leads', label: c('Leads / messages', 'عملاء محتملين / رسائل'), keywords: ['leads', 'messages', 'عملاء', 'رسائل'] },
      { value: 'traffic', label: c('Website visits', 'زيارات الموقع'), keywords: ['traffic', 'visits', 'زيارات'] },
      { value: 'reach', label: c('Reach', 'انتشار'), keywords: ['reach', 'awareness', 'انتشار'] },
    ], 'leads', c('Most small businesses need messages and enquiries first.', 'أغلب المشاريع الصغيرة محتاجة رسائل واستفسارات الأول.')),
    { id: 'platforms', kind: 'multi', layer: 'understanding', importance: 'important',
      label: c('Ad platforms', 'منصات الإعلان'), question: c('Which platforms?', 'أنهي منصات؟'),
      why: c('Each platform needs a different setup.', 'كل منصة لها إعداد مختلف.'), example: c('Meta and Google.', 'ميتا وجوجل.'),
      options: [
        { value: 'meta', label: c('Meta (Facebook + Instagram)', 'ميتا (فيسبوك + إنستجرام)'), keywords: ['meta', 'facebook', 'instagram', 'ميتا', 'فيسبوك', 'انستجرام'] },
        { value: 'google', label: c('Google (search + YouTube)', 'جوجل (بحث + يوتيوب)'), keywords: ['google', 'youtube', 'جوجل', 'يوتيوب'] },
        { value: 'tiktok', label: c('TikTok', 'تيك توك'), keywords: ['tiktok', 'تيك توك'] },
        { value: 'snapchat', label: c('Snapchat', 'سناب شات'), keywords: ['snapchat', 'سناب'] },
        { value: 'linkedin', label: c('LinkedIn', 'لينكد إن'), keywords: ['linkedin', 'لينكد ان'] },
      ],
      defaults: [{ value: ['meta'], reason: c('Meta is the cheapest place to start for most local businesses.', 'ميتا أرخص بداية لأغلب المشاريع المحلية.') }] },
    budgetSlot(),
    facts('pastResults', c('Past ad results', 'نتائج إعلانات سابقة'), c('What did your previous ads cost and deliver?', 'إعلاناتك السابقة كلّفت كام وجابت إيه؟'), c('Spent 5,000 EGP, got 60 messages, 6 sales.', 'صرفت ٥٠٠٠ جنيه، جبت ٦٠ رسالة، و٦ مبيعات.')),
  ],
  nameLabel: c('Business name', 'اسم المشروع'), nameWhat: 'the business name',
  avoidVocab: { en: ['invented CPM or CPC figures', 'guaranteed results', 'platforms I do not use', 'audiences I cannot target'], ar: ['أرقام تكلفة متألفة', 'ضمان نتائج', 'منصات مش بستخدمها', 'جماهير مش أقدر أستهدفها'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per campaign or ad set in the plan.', outlineWhat: 'one line per campaign in the plan',
  outputDescription: c('A layered prompt for a chat AI, the campaign structure, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وهيكل الحملات، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior performance marketer who manages paid media budgets, and a prompt engineer for chat AIs.',
  understanding: ['offer and goal set the campaign objective; platforms and budget set the structure; pastResults are the only performance numbers allowed.', 'sections.goal states what is advertised, the action wanted, the audience and the budget.'],
  intelligence: [
    'Give: campaign structure per platform (objective, ad sets, audiences, placements), budget split with a testing reserve, 3 ad angles with hooks and primary text, the creative brief per angle, the landing destination, the tracking setup, and the rules for when to kill or scale an ad.',
    'sections.approach tells the AI to test few variables at a time, start broad before narrowing, and judge on cost per result rather than on clicks.',
  ],
  controlExtra: ['Never state expected CPC, CPM, ROAS or conversion rates as facts — frame them as [benchmark to verify in your account].'],
  examples: [{
    good: 'Meta, objective: messages. One ad set, broad 20–35 within 5 km, 60% of budget; 40% reserved for testing 3 hooks. Kill rule: pause an ad after 1,000 impressions with no message.',
    bad: 'Run Meta ads and expect a 4x ROAS with a 2% CTR and $0.10 CPC, target everyone interested in fitness worldwide.',
    why: 'The bad one invents performance figures and targets an unusable audience.',
  }],
});

export const contentCalendar = makeTextMission({
  id: 'content-calendar', title: c('Content calendar', 'تقويم محتوى'), topics: ['content-calendar'],
  intake: { question: c('Tell me about your page and what you want to post about.', 'قولّي عن صفحتك، وعايز تنشر عن إيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A monthly plan for my Instagram', 'خطة شهرية لإنستجرام'), c('Content ideas for my restaurant page', 'أفكار محتوى لصفحة المطعم'), c('A weekly posting plan', 'خطة نشر أسبوعية'), c('A Ramadan content calendar', 'تقويم محتوى رمضان')] },
  slots: [
    offer(c('Your business / page', 'مشروعك أو صفحتك'), c('What is the page about, and what do you sell?', 'الصفحة عن إيه، وبتبيع إيه؟'), c('A specialty coffee shop in Maadi; we sell coffee and beans.', 'كافيه قهوة مختصة في المعادي؛ بنبيع قهوة وحبوب.'), { en: ['restaurant', 'shop', 'clinic', 'personal brand', 'service', 'online store'], ar: ['مطعم', 'محل', 'عيادة', 'براند شخصي', 'خدمة', 'متجر أونلاين'] }),
    audience(c('People in Maadi who care about good coffee.', 'ناس في المعادي بتهتم بالقهوة الحلوة.'), { en: ['locals', 'young professionals', 'families', 'students', 'business owners'], ar: ['أهل المنطقة', 'شباب بيشتغلوا', 'أسر', 'طلبة', 'أصحاب مشاريع'] }),
    channels(),
    { id: 'cadence', kind: 'single', layer: 'delivery', importance: 'important',
      label: c('How often you post', 'كل أد إيه تنشر'), question: c('How many posts per week can you actually make?', 'تقدر تعمل كام بوست في الأسبوع فعلاً؟'),
      why: c('A plan you cannot keep up with is worthless.', 'خطة مش قادر تكمّلها مش بتفيد.'), example: c('Three a week.', 'تلاتة في الأسبوع.'),
      options: [
        { value: '2', label: c('2 a week', '٢ في الأسبوع'), keywords: ['twice', 'مرتين'] },
        { value: '3', label: c('3 a week', '٣ في الأسبوع'), keywords: ['three', 'تلاتة'] },
        { value: '5', label: c('5 a week', '٥ في الأسبوع'), keywords: ['five', 'خمسة'] },
        { value: 'daily', label: c('Daily', 'كل يوم'), keywords: ['daily', 'every day', 'كل يوم', 'يومي'] },
      ],
      defaults: [{ value: '3', reason: c('Three a week is the most sustainable rhythm for a small team.', 'تلاتة في الأسبوع أكتر إيقاع ممكن تكمّله بفريق صغير.') }] },
    toneSlot({ importance: 'nice' }),
    { id: 'period', kind: 'single', layer: 'delivery', importance: 'nice',
      label: c('Period', 'المدة'), question: c('How long should the calendar cover?', 'التقويم يغطي أد إيه؟'),
      why: c('A month is enough to see a pattern.', 'شهر كفاية تشوف النمط.'), example: c('One month.', 'شهر.'),
      options: [{ value: '1w', label: c('A week', 'أسبوع') }, { value: '2w', label: c('Two weeks', 'أسبوعين') }, { value: '1m', label: c('A month', 'شهر') }],
      defaults: [{ value: '1m', reason: c('A month gives a full, repeatable cycle.', 'الشهر بيدّي دورة كاملة تتكرر.') }] },
  ],
  nameLabel: c('Page / brand name', 'اسم الصفحة أو البراند'), nameWhat: 'the page or brand name',
  avoidVocab: { en: ['generic filler posts', 'reposted quotes', 'trends that do not fit us', 'invented offers'], ar: ['بوستات حشو', 'اقتباسات منقولة', 'ترندات مش بتناسبنا', 'عروض متألفة'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per post: day — format — hook.', outlineWhat: 'one line per planned post',
  outputDescription: c('A layered prompt for a chat AI, the post-by-post plan, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وخطة بوست بوست، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior social media manager, and a prompt engineer for chat AIs.',
  understanding: ['offer and audience set the themes; cadence and period set the number of posts; channels set the formats.', 'sections.goal states the page, the audience and how many posts over what period.'],
  intelligence: [
    'Define 4–5 recurring content pillars tied to the business, then fill the calendar from them. Each post gets: day, channel, format, hook line, what to show, and the call to action. Mix selling with value so it is not all promotion.',
    'sections.approach tells the AI to repeat formats that work rather than invent a new idea each day, and to batch posts that can be shot together.',
  ],
  deliveryExtra: ['planOutline must contain exactly one line per post for the whole period at the chosen cadence.'],
  examples: [{
    good: 'Pillars: brew tips, bean origins, people at the shop, offers. Mon — reel — "The one mistake that makes home coffee bitter". Shoot: hands grinding. CTA: save it.',
    bad: '30 days of motivational quotes and trending audio, post daily on every platform, 50% off every Friday.',
    why: 'The bad one is filler, unsustainable, and invents a recurring discount.',
  }],
});

export const socialMediaStrategy = makeTextMission({
  id: 'social-media-strategy', title: c('Social media strategy', 'استراتيجية سوشيال'), topics: ['social-media-strategy'],
  intake: { question: c('Tell me about your page now and where you want it to get.', 'قولّي صفحتك دلوقتي، وعايزها توصل لفين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('My page is not growing', 'صفحتي مش بتكبر'), c('A strategy to grow on Instagram', 'استراتيجية للنمو على إنستجرام'), c('Should I be on TikTok?', 'أكون على تيك توك؟'), c('A strategy to turn followers into customers', 'استراتيجية أحوّل المتابعين لعملاء')] },
  slots: [
    offer(c('Your business / page', 'مشروعك أو صفحتك'), c('What does the page sell or stand for?', 'الصفحة بتبيع إيه أو بتمثّل إيه؟'), c('A clinic for skin care; we want bookings.', 'عيادة جلدية؛ عايزين حجوزات.'), { en: ['shop', 'clinic', 'restaurant', 'personal brand', 'agency', 'online store'], ar: ['محل', 'عيادة', 'مطعم', 'براند شخصي', 'وكالة', 'متجر أونلاين'] }),
    audience(c('Women 25–45 in Jeddah.', 'نساء ٢٥–٤٥ في جدة.'), { en: ['women', 'men', 'age range', 'city', 'interests'], ar: ['نساء', 'رجال', 'فئة عمرية', 'مدينة', 'اهتمامات'] }),
    goal([
      { value: 'growth', label: c('Grow the audience', 'تكبير الجمهور'), keywords: ['growth', 'followers', 'نمو', 'متابعين'] },
      { value: 'engagement', label: c('More engagement', 'تفاعل أكتر'), keywords: ['engagement', 'comments', 'تفاعل'] },
      { value: 'sales', label: c('Turn followers into customers', 'تحويل المتابعين لعملاء'), keywords: ['sales', 'conversion', 'مبيعات', 'تحويل'] },
      { value: 'authority', label: c('Become the trusted name', 'تبقى الاسم الموثوق'), keywords: ['authority', 'trust', 'ثقة', 'مرجع'] },
    ], 'sales', c('Followers only matter if they buy.', 'المتابعين بيفرقوا لما يشتروا.')),
    channels(),
    facts('currentState', c('Where the page is now', 'الصفحة فين دلوقتي'), c('Followers, reach, and what performs best so far?', 'المتابعين، والوصول، وإيه أحسن حاجة شغالة؟'), c('4,000 followers, reels get 3x the reach of photos.', '٤٠٠٠ متابع، والريلز بتجيب ٣ أضعاف وصول الصور.')),
    toneSlot({ importance: 'nice' }),
  ],
  nameLabel: c('Page / brand name', 'اسم الصفحة أو البراند'), nameWhat: 'the page or brand name',
  avoidVocab: { en: ['buying followers', 'engagement pods', 'copying competitors', 'invented benchmarks'], ar: ['شراء متابعين', 'مجموعات تفاعل', 'تقليد المنافسين', 'مؤشرات متألفة'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per section of the strategy.', outlineWhat: 'one line per section of the strategy',
  outputDescription: c('A layered prompt for a chat AI, the strategy sections, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وأقسام الاستراتيجية، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior social media strategist, and a prompt engineer for chat AIs.',
  understanding: ['currentState is the only performance data allowed; goal decides what the strategy optimises for; channels limit the plan.', 'sections.goal states the page, the audience, the goal and where the page stands now.'],
  intelligence: [
    'Cover: the one positioning line for the page, content pillars, the format mix per channel with a reason, a posting rhythm the team can keep, how followers move to a purchase (profile, DMs, link), community rules for replies, and the 3–4 numbers to track monthly.',
    'sections.approach tells the AI to concentrate on the format that already works before adding new ones, and to design for saves and shares rather than likes.',
  ],
  controlExtra: ['Never state platform benchmarks or algorithm claims as facts — mark them as [to verify].'],
  examples: [{
    good: 'Positioning: the clinic that explains skin care in plain language. Double down on reels (already 3x reach). Funnel: reel → saved → profile link → WhatsApp booking. Track: saves, profile taps, bookings.',
    bad: 'Post 5 times a day on every platform, use 30 hashtags, the algorithm favours accounts that post daily, buy a few followers to look credible.',
    why: 'The bad one is unsustainable, states an algorithm claim as fact, and suggests buying followers.',
  }],
});

export const influencerBrief = makeTextMission({
  id: 'influencer-brief', title: c('Influencer brief', 'بريف مؤثرين'), topics: ['influencer-brief'],
  intake: { question: c('Tell me about the product and the kind of creator you want.', 'قولّي عن المنتج، ونوع المؤثر اللي عايزه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A brief for influencers to promote my product', 'بريف لمؤثرين يعلنوا عن منتجي'), c('A brief for a TikTok creator', 'بريف لصانع محتوى تيك توك'), c('A barter collaboration brief', 'بريف تعاون بالبارتر'), c('A brief for a restaurant visit', 'بريف لزيارة مطعم')] },
  slots: [
    offer(c('Product / service', 'المنتج أو الخدمة'), c('What should the creator talk about, and what is the one message?', 'المؤثر يتكلم عن إيه، والرسالة الواحدة إيه؟'), c('Our new protein bar; the message is "tastes like dessert".', 'بار البروتين الجديد؛ الرسالة إنه "طعمه زي الحلو".'), { en: ['product', 'service', 'app', 'restaurant visit', 'new launch', 'one message'], ar: ['منتج', 'خدمة', 'تطبيق', 'زيارة مطعم', 'إطلاق جديد', 'رسالة واحدة'] }),
    audience(c('Gym-goers 18–30 who follow fitness creators.', 'رواد جيم ١٨–٣٠ بيتابعوا صناع محتوى رياضة.'), { en: ['followers of fitness', 'beauty audience', 'parents', 'students', 'city'], ar: ['متابعي الرياضة', 'جمهور الجمال', 'أهالي', 'طلبة', 'مدينة'] }),
    { id: 'format', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Content format', 'شكل المحتوى'), question: c('What should the creator make?', 'المؤثر يعمل إيه؟'),
      why: c('The format decides the whole brief.', 'الشكل بيحدد البريف كله.'), example: c('A short reel.', 'ريل قصير.'),
      options: [
        { value: 'reel', label: c('Short video / reel', 'فيديو قصير / ريل'), keywords: ['reel', 'video', 'tiktok', 'ريل', 'فيديو'] },
        { value: 'story', label: c('Story series', 'سلسلة ستوري'), keywords: ['story', 'stories', 'ستوري'] },
        { value: 'post', label: c('Photo post', 'بوست صور'), keywords: ['post', 'photo', 'بوست', 'صورة'] },
        { value: 'review', label: c('Honest review', 'ريفيو صادق'), keywords: ['review', 'unboxing', 'ريفيو', 'تجربة'] },
        { value: 'visit', label: c('Place visit', 'زيارة للمكان'), keywords: ['visit', 'زيارة'] },
      ],
      defaults: [{ value: 'reel', reason: c('Short video reaches furthest and costs the creator least.', 'الفيديو القصير بيوصل أكتر وأقل مجهود على المؤثر.') }] },
    goal([
      { value: 'awareness', label: c('Reach new people', 'الوصول لناس جديدة'), keywords: ['awareness', 'reach', 'انتشار'] },
      { value: 'sales', label: c('Sales with a code', 'مبيعات بكود'), keywords: ['sales', 'code', 'promo', 'مبيعات', 'كود'] },
      { value: 'trust', label: c('Build trust', 'بناء ثقة'), keywords: ['trust', 'credibility', 'ثقة'] },
      { value: 'ugc', label: c('Content we can reuse', 'محتوى نعيد استخدامه'), keywords: ['ugc', 'content', 'محتوى'] },
    ], 'awareness', c('Most collaborations are bought for reach.', 'أغلب التعاونات بتتعمل للوصول.')),
    { id: 'deal', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 300,
      label: c('The deal', 'الاتفاق'), question: c('What are you offering the creator?', 'بتقدّم للمؤثر إيه؟'),
      why: c('The brief must state the deal clearly.', 'البريف لازم يوضّح الاتفاق.'), example: c('Barter: free products for one reel.', 'بارتر: منتجات مجاناً مقابل ريل واحد.'),
      noneLabel: c('Placeholder to fill', 'مكان فاضي تكمّله'),
      defaults: [{ value: 'none', reason: c('We leave [fee or barter] for you to fill.', 'هنسيب [المقابل] تكمّله انت.') }] },
    toneSlot({ importance: 'nice', label: c('Creator tone', 'نبرة المؤثر') }),
  ],
  nameLabel: c('Brand name', 'اسم البراند'), nameWhat: 'the brand name',
  avoidVocab: { en: ['scripted wording that sounds fake', 'claims we cannot prove', 'competitor mentions', 'hiding that it is an ad'], ar: ['كلام مكتوب بيبان مزيّف', 'وعود مش أقدر أثبتها', 'ذكر منافسين', 'إخفاء إنه إعلان'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per section of the brief.', outlineWhat: 'one line per section of the brief',
  outputDescription: c('A layered prompt for a chat AI, the brief sections, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وأقسام البريف، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior influencer marketing manager, and a prompt engineer for chat AIs.',
  understanding: ['offer carries the one message; format and goal set what the creator delivers; deal must appear in the brief.', 'sections.goal states the brand, the product, the one message and what the collaboration is for.'],
  intelligence: [
    'The brief covers: the one message, 3 talking points, what to show on screen, the hook in the first 3 seconds, the call to action, the deal and deliverables, deadlines, usage rights, the disclosure requirement, and a short do-not list.',
    'sections.approach tells the AI to leave the creator their own words and to give direction, not a script.',
  ],
  controlExtra: ['The brief must require clear ad disclosure. Never ask the creator to hide the partnership or state claims the brand has not provided.'],
  examples: [{
    good: 'One message: tastes like dessert. Show: the first bite, close up. Hook in 3s: "I stopped believing protein bars could taste good." Must disclose as a paid partnership. Deliverables: 1 reel + 3 stories, 5 days.',
    bad: 'Tell them to say it is the best protein bar in the world, clinically proven, and not mention it is sponsored so it feels authentic.',
    why: 'The bad one invents a claim and asks the creator to hide the ad.',
  }],
});

export const emailMarketing = makeTextMission({
  id: 'email-marketing', title: c('Email marketing', 'تسويق بالإيميل'), topics: ['email-marketing'],
  intake: { question: c('Tell me about your list and what you want to send.', 'قولّي عن قائمتك، وعايز تبعت إيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A welcome sequence for new subscribers', 'سلسلة ترحيب للمشتركين الجداد'), c('A newsletter plan', 'خطة نيوزليتر'), c('Emails to bring back old customers', 'إيميلات ترجّع عملاء قدام'), c('An email campaign for a sale', 'حملة إيميل لعرض')] },
  slots: [
    offer(c('What you sell', 'بتبيع إيه'), c('What do you sell, and why did people join your list?', 'بتبيع إيه، والناس اشتركت في القائمة ليه؟'), c('Online language courses; they joined for a free lesson.', 'كورسات لغة أونلاين؛ اشتركوا عشان درس مجاني.'), { en: ['online store', 'courses', 'service', 'subscription', 'free guide', 'discount on signup'], ar: ['متجر أونلاين', 'كورسات', 'خدمة', 'اشتراك', 'دليل مجاني', 'خصم على التسجيل'] }),
    { id: 'emailType', kind: 'single', layer: 'understanding', importance: 'important',
      label: c('Type of emails', 'نوع الإيميلات'), question: c('What kind of emails do you need?', 'محتاج أنهي نوع إيميلات؟'),
      why: c('Each type has a different structure.', 'كل نوع له هيكل مختلف.'), example: c('A welcome sequence.', 'سلسلة ترحيب.'),
      options: [
        { value: 'welcome', label: c('Welcome sequence', 'سلسلة ترحيب'), keywords: ['welcome', 'onboarding', 'ترحيب'] },
        { value: 'newsletter', label: c('Regular newsletter', 'نيوزليتر دوري'), keywords: ['newsletter', 'نيوزليتر', 'دوري'] },
        { value: 'promo', label: c('Promotion / sale', 'عرض أو خصم'), keywords: ['promo', 'sale', 'offer', 'عرض', 'خصم'] },
        { value: 'winback', label: c('Win back old customers', 'استرجاع عملاء'), keywords: ['winback', 'reactivation', 'استرجاع'] },
        { value: 'abandoned', label: c('Abandoned cart', 'سلة متروكة'), keywords: ['cart', 'abandoned', 'سلة', 'متروكة'] },
      ],
      defaults: [{ value: 'welcome', reason: c('The welcome sequence earns the most per email sent.', 'سلسلة الترحيب بتكسب أكتر من أي إيميل تاني.') }] },
    audience(c('People who downloaded the free lesson but did not buy.', 'ناس حمّلوا الدرس المجاني وملهمش شراء.'), { en: ['new subscribers', 'past buyers', 'inactive', 'free trial users'], ar: ['مشتركين جداد', 'عملاء سابقين', 'غير نشطين', 'مستخدمي التجربة'] }),
    { id: 'count', kind: 'single', layer: 'delivery', importance: 'nice',
      label: c('Number of emails', 'عدد الإيميلات'), question: c('How many emails?', 'كام إيميل؟'),
      why: c('A sequence needs a fixed length.', 'السلسلة محتاجة طول محدد.'), example: c('Four emails.', 'أربع إيميلات.'),
      options: [{ value: '1', label: c('1', '١') }, { value: '3', label: c('3', '٣') }, { value: '4', label: c('4', '٤') }, { value: '6', label: c('6', '٦') }],
      patterns: [{ regex: '(?<![\\d])(1|3|4|6)\\s*(?:emails?|ايميل|إيميل|إيميلات)', group: 1 }],
      defaults: [{ value: '4', reason: c('Four emails are enough to build trust and ask once.', 'أربع إيميلات كفاية تبني ثقة وتطلب مرة واحدة.') }] },
    toneSlot({ importance: 'nice' }),
  ],
  nameLabel: c('Brand name', 'اسم البراند'), nameWhat: 'the brand name',
  avoidVocab: { en: ['spam words', 'fake urgency', 'invented discounts', 'buying email lists', 'misleading subject lines'], ar: ['كلام سبام', 'استعجال مزيّف', 'خصومات متألفة', 'شراء قوائم إيميلات', 'عناوين مضللة'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per email: when it sends — subject — the one job it does.', outlineWhat: 'one line per email in the sequence',
  outputDescription: c('A layered prompt for a chat AI, the email-by-email plan, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وخطة إيميل إيميل، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior email marketer who writes sequences that get replies, and a prompt engineer for chat AIs.',
  understanding: ['emailType sets the structure; audience sets what they already know; count fixes the length.', 'sections.goal states the list, why they joined, and what each email should achieve.'],
  intelligence: [
    'Each email gets: send timing, 2 subject line options, a preview line, one job, the body structure, one call to action, and the plain-text feel of a real person writing. One ask per email.',
    'sections.approach tells the AI to lead with what the reader gets, keep paragraphs to two lines, and never stack several calls to action.',
  ],
  controlExtra: ['Never invent discounts, deadlines or results. Every email must mention that unsubscribing is available.'],
  deliveryExtra: ['planOutline must contain exactly one line per email, matching count.'],
  examples: [{
    good: 'Email 2 (day 3) — Subject: "The mistake most beginners make" / "Why your first month feels slow". Job: prove we can teach. One CTA: read the lesson. No offer yet.',
    bad: 'Send 6 emails a day with URGENT!!! 90% OFF ONLY TODAY and buy a list of 50,000 emails to send to.',
    why: 'The bad one invents the offer and urgency and suggests buying a list.',
  }],
});

export const seoPlan = makeTextMission({
  id: 'seo-plan', title: c('SEO plan', 'خطة SEO'), topics: ['seo-plan'],
  intake: { question: c('Tell me about your website and what you want to rank for.', 'قولّي عن موقعك، وعايز تظهر في إيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('An SEO plan for my store', 'خطة SEO لمتجري'), c('I want to appear on Google', 'عايز أظهر في جوجل'), c('Keyword ideas for my service', 'أفكار كلمات مفتاحية لخدمتي'), c('A local SEO plan for my clinic', 'خطة SEO محلية لعيادتي')] },
  slots: [
    offer(c('Site & what you sell', 'الموقع وبتبيع إيه'), c('What does the site offer, and where do your customers search from?', 'الموقع بيقدّم إيه، وعملاؤك بيدوروا من فين؟'), c('A dental clinic in Riyadh; patients search locally.', 'عيادة أسنان في الرياض؛ المرضى بيدوروا محلياً.'), { en: ['online store', 'service', 'local business', 'blog', 'in Riyadh', 'in Egypt', 'Arabic site', 'English site'], ar: ['متجر أونلاين', 'خدمة', 'نشاط محلي', 'مدونة', 'في الرياض', 'في مصر', 'موقع عربي', 'موقع إنجليزي'] }),
    audience(c('People searching for a dentist near them.', 'ناس بتدور على دكتور أسنان جنبهم.'), { en: ['local searchers', 'buyers', 'researchers', 'in Arabic', 'in English'], ar: ['بحث محلي', 'مشترين', 'بيدوروا معلومات', 'بالعربي', 'بالإنجليزي'] }),
    goal([
      { value: 'local', label: c('Appear in local search / maps', 'الظهور في البحث المحلي والخرايط'), keywords: ['local', 'maps', 'محلي', 'خرايط'] },
      { value: 'traffic', label: c('More organic traffic', 'زيارات أكتر من البحث'), keywords: ['traffic', 'organic', 'زيارات'] },
      { value: 'sales', label: c('Sales from search', 'مبيعات من البحث'), keywords: ['sales', 'conversion', 'مبيعات'] },
      { value: 'authority', label: c('Be the reference in the topic', 'تبقى المرجع في المجال'), keywords: ['authority', 'مرجع'] },
    ], 'local', c('Local search is the fastest win for most businesses.', 'البحث المحلي أسرع مكسب لأغلب الأنشطة.')),
    facts('currentState', c('Where the site stands', 'الموقع واقف فين'), c('What traffic or rankings do you have now?', 'عندك زيارات أو ترتيب إيه دلوقتي؟'), c('About 300 visits a month, no blog.', 'حوالي ٣٠٠ زيارة في الشهر، ومفيش مدونة.')),
    horizon([{ value: '3m', label: c('Three months', 'تلات شهور') }, { value: '6m', label: c('Six months', 'ست شهور') }, { value: '12m', label: c('A year', 'سنة') }], '3m'),
  ],
  nameLabel: c('Site / business name', 'اسم الموقع أو النشاط'), nameWhat: 'the site or business name',
  avoidVocab: { en: ['keyword stuffing', 'buying backlinks', 'invented search volumes', 'guaranteed ranking', 'duplicate content'], ar: ['حشو كلمات مفتاحية', 'شراء باك لينكس', 'أرقام بحث متألفة', 'ضمان ترتيب', 'محتوى مكرر'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per section or work stream of the plan.', outlineWhat: 'one line per part of the plan',
  outputDescription: c('A layered prompt for a chat AI, the plan sections, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وأقسام الخطة، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior SEO consultant, and a prompt engineer for chat AIs.',
  understanding: ['offer sets the topic and the market; goal decides whether the plan is local, content-led or commercial; currentState is the only data we have.', 'sections.goal states the site, the market, the goal and the time frame.'],
  intelligence: [
    'Cover: keyword themes grouped by intent (with the method to check volume, not invented numbers), the page each theme should live on, on-page fixes, technical basics (speed, mobile, indexing, structured data), local setup when relevant (business profile, reviews, location pages), a content plan, link building that is allowed, and what to measure monthly.',
    'sections.approach tells the AI to fix the money pages before writing new articles and to target intent rather than volume.',
  ],
  controlExtra: ['Never state search volumes, difficulty scores or rankings as facts — write [check in Search Console / keyword tool]. Never promise a position.'],
  examples: [{
    good: 'Month 1: complete the business profile, 8 real reviews, one page per service with the city in the title. Keyword themes: "dentist in [district]" (local intent) — [check volume in the tool].',
    bad: 'Target 200 keywords with 50,000 searches each, buy 100 backlinks, and we will be number one on Google in two weeks.',
    why: 'The bad one invents volumes, buys links, and promises a ranking.',
  }],
});

export const conversionFunnel = makeTextMission({
  id: 'conversion-funnel', title: c('Conversion funnel', 'مسار التحويل'), topics: ['conversion-funnel'],
  intake: { question: c('Tell me how a customer finds you today and where they drop off.', 'قولّي العميل بيوصلك إزاي دلوقتي، وبيقع فين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('People visit but do not buy', 'الناس بتزور وما بتشتريش'), c('A funnel for my online store', 'مسار تحويل لمتجري'), c('I get messages but few sales', 'بيجيلي رسائل ومبيعات قليلة'), c('A funnel from ads to purchase', 'مسار من الإعلان للشراء')] },
  slots: [
    offer(c('What you sell & the path now', 'بتبيع إيه والمسار الحالي'), c('What do you sell, and what steps does a customer go through today?', 'بتبيع إيه، والعميل بيمر بإيه دلوقتي؟'), c('Online store; ad → product page → cart → checkout.', 'متجر أونلاين؛ إعلان ← صفحة منتج ← سلة ← دفع.'), { en: ['ad', 'landing page', 'product page', 'cart', 'checkout', 'WhatsApp', 'phone call', 'shop visit'], ar: ['إعلان', 'صفحة هبوط', 'صفحة منتج', 'سلة', 'دفع', 'واتساب', 'مكالمة', 'زيارة المحل'] }),
    audience(c('People who clicked an Instagram ad.', 'ناس ضغطت على إعلان إنستجرام.'), { en: ['ad clickers', 'organic visitors', 'returning customers', 'referrals'], ar: ['جايين من إعلان', 'زيارات طبيعية', 'عملاء راجعين', 'ترشيحات'] }),
    goal([
      { value: 'purchase', label: c('Complete a purchase', 'إتمام الشراء'), keywords: ['purchase', 'checkout', 'شراء', 'دفع'] },
      { value: 'booking', label: c('Book an appointment', 'حجز موعد'), keywords: ['booking', 'appointment', 'حجز', 'موعد'] },
      { value: 'lead', label: c('Send an enquiry', 'إرسال استفسار'), keywords: ['lead', 'enquiry', 'استفسار'] },
      { value: 'signup', label: c('Sign up / subscribe', 'تسجيل أو اشتراك'), keywords: ['signup', 'subscribe', 'تسجيل', 'اشتراك'] },
    ], 'purchase', c('Purchase is the step most funnels are built for.', 'الشراء هو الخطوة اللي أغلب المسارات بتتبني عليها.')),
    facts('dropOff', c('Where people drop off', 'الناس بتقع فين'), c('At which step do you lose them, and what numbers do you have?', 'بتخسرهم في أنهي خطوة، وعندك أرقام إيه؟'), c('200 visits, 30 add to cart, 4 orders.', '٢٠٠ زيارة، ٣٠ إضافة للسلة، ٤ أوردرات.')),
    channels(),
  ],
  nameLabel: c('Business name', 'اسم المشروع'), nameWhat: 'the business name',
  avoidVocab: { en: ['dark patterns', 'fake countdown timers', 'hidden costs', 'invented conversion rates', 'forced account creation'], ar: ['أساليب خادعة', 'عدادات وقت مزيّفة', 'تكاليف مخفية', 'نسب تحويل متألفة', 'إجبار على إنشاء حساب'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per funnel step: step — the job — the fix.', outlineWhat: 'one line per step of the funnel',
  outputDescription: c('A layered prompt for a chat AI, the funnel step by step, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، والمسار خطوة خطوة، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior conversion rate optimisation specialist, and a prompt engineer for chat AIs.',
  understanding: ['offer describes the current path; dropOff is the only data; goal is the single conversion the funnel optimises for.', 'sections.goal states the current path, the goal action, and where people are lost.'],
  intelligence: [
    'Map the funnel step by step. For each step: the one job it does, the friction likely causing the drop, a specific fix, and how to measure it. Then rank the fixes by effort against expected impact and name the first three to do.',
    'sections.approach tells the AI to fix the step with the biggest drop first, to change one thing at a time so the effect is readable, and to prefer removing friction over adding persuasion.',
  ],
  controlExtra: ['Never state conversion benchmarks as facts — mark them [to verify in your own data]. Never recommend dark patterns, fake timers or hidden costs.'],
  examples: [{
    good: 'Step: cart → checkout, biggest drop (30 → 4). Likely friction: shipping cost shown only at the last step. Fix: show delivery cost on the product page. Measure: checkout starts per cart.',
    bad: 'Add a 10-minute countdown timer and "only 2 left" to every product, and require an account before checkout — this gets a 12% conversion rate.',
    why: 'The bad one uses fake scarcity, adds friction, and invents a conversion rate.',
  }],
});

export const marketingBlueprints = [
  marketingStrategy, launchCampaign, paidAds, contentCalendar,
  socialMediaStrategy, influencerBrief, emailMarketing, seoPlan, conversionFunnel,
];
