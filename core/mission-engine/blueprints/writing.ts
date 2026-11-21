import type { Blueprint, Copy, Slot } from '../types.ts';
import { c } from '../modules.ts';
import { makeTextMission, toneSlot } from './_text.ts';

/** Shared slots for a writing mission: the subject (critical), audience, tone, must-include points. */
function writingSlots(whatLabel: Copy, whatQ: Copy, whatEx: Copy, whatVocab: { en: string[]; ar: string[] }, extra: Slot[] = []): Slot[] {
  return [
    { id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1000, label: whatLabel, question: whatQ, why: c('This is what the writing is about.', 'ده اللي الكتابة هتدور حواليه.'), example: whatEx, vocabulary: whatVocab },
    { id: 'audience', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 300, label: c('Reader', 'القارئ'), question: c('Who is the reader?', 'مين القارئ؟'), why: c('Wording changes with who reads.', 'الصياغة بتتغير حسب مين بيقرا.'), example: c('Young professionals in Cairo.', 'شباب بيشتغلوا في القاهرة.'), vocabulary: { en: ['customers', 'followers', 'a manager', 'investors', 'new users', 'existing clients'], ar: ['عملاء', 'متابعين', 'مدير', 'مستثمرين', 'مستخدمين جدد', 'عملاء حاليين'] }, noneLabel: c('General reader', 'قارئ عام'), defaults: [{ value: 'none', reason: c('We write for a general reader of this kind.', 'هنكتب لقارئ عام من النوع ده.') }] },
    toneSlot(),
    { id: 'keyPoints', kind: 'longtext', layer: 'understanding', importance: 'nice', maxLength: 800, label: c('Must-include points', 'نقاط لازم تتذكر'), question: c('Any facts or points that must be included?', 'في حقائق أو نقاط لازم تتكتب؟'), why: c('We use your real facts and never invent any.', 'هنستخدم حقائقك الحقيقية وما بنألّفش.'), example: c('20% off this week; free delivery over 500.', 'خصم ٢٠٪ الأسبوع ده؛ توصيل مجاني فوق ٥٠٠.'), noneLabel: c('We keep it general', 'هنخليها عامة'), defaults: [{ value: 'none', reason: c('We keep claims general and leave [placeholders] for specifics.', 'هنخلي الكلام عام ونسيب [أماكن فاضية] للتفاصيل.') }] },
    ...extra,
  ];
}

const lengthSlot = (opts: { value: string; label: Copy }[], def: string, defReason: Copy): Slot => ({
  id: 'length', kind: 'single', layer: 'delivery', importance: 'nice', label: c('Length', 'الطول'), question: c('How long?', 'الطول قد إيه؟'), why: c('Length fits where it will be read.', 'الطول بيناسب المكان اللي هيتقرا فيه.'), example: c('Short.', 'قصير.'), options: opts, defaults: [{ value: def, reason: defReason }],
});

export const adCopy = makeTextMission({
  id: 'ad-copy', title: c('Ad copy', 'إعلان مكتوب'), topics: ['ad-copy'],
  intake: { question: c('Tell me what you are advertising and where it will run.', 'قولّي بتعلن عن إيه، وهينزل فين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A Facebook ad for my gym offer', 'إعلان فيسبوك لعرض الجيم بتاعي'), c('Google ad for my dental clinic', 'إعلان جوجل لعيادة الأسنان'), c('Instagram ad for a new product', 'إعلان إنستجرام لمنتج جديد'), c('A catchy ad for a discount', 'إعلان جذّاب لخصم')] },
  slots: writingSlots(c('What you advertise', 'بتعلن عن إيه'), c('What are you advertising, and what is the offer?', 'بتعلن عن إيه، والعرض إيه؟'), c('Teeth whitening, 20% off this month.', 'تبييض أسنان، خصم ٢٠٪ الشهر ده.'), { en: ['new product', 'discount', 'free trial', 'limited offer', 'service', 'event'], ar: ['منتج جديد', 'خصم', 'تجربة مجانية', 'عرض محدود', 'خدمة', 'فعالية'] }, [
    { id: 'platform', kind: 'single', layer: 'understanding', importance: 'important', label: c('Where it runs', 'هينزل فين'), question: c('Where will the ad run?', 'الإعلان هينزل فين؟'), why: c('Each platform has its own length and style.', 'كل منصة ليها طولها وأسلوبها.'), example: c('Facebook / Instagram.', 'فيسبوك / إنستجرام.'),
      options: [{ value: 'meta', label: c('Facebook / Instagram', 'فيسبوك / إنستجرام'), keywords: ['facebook', 'instagram', 'meta', 'فيسبوك', 'انستجرام'] }, { value: 'google', label: c('Google search', 'بحث جوجل'), keywords: ['google', 'search', 'جوجل', 'بحث'] }, { value: 'tiktok', label: c('TikTok', 'تيك توك'), keywords: ['tiktok', 'تيك توك'] }, { value: 'linkedin', label: c('LinkedIn', 'لينكدإن'), keywords: ['linkedin', 'لينكدإن'] }],
      defaults: [{ value: 'meta', reason: c('Most local ads run on Facebook and Instagram.', 'أغلب الإعلانات المحلية بتنزل فيسبوك وإنستجرام.') }] },
  ]),
  nameLabel: c('Brand name', 'اسم البراند'), nameWhat: 'the brand name',
  avoidVocab: { en: ['fake urgency', 'made-up claims', 'clickbait', 'banned words'], ar: ['إلحاح مزيّف', 'ادعاءات متألفة', 'كلام مضلل', 'كلمات ممنوعة'] },
  outlineKey: 'variantsOutline', outlineDesc: 'A few ad angles, each: hook — body — call to action.', outlineWhat: 'a few ad angles (hook, body, CTA)',
  outputDescription: c('A layered prompt for a chat AI, a few ad angles, what to fill, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وكذا زاوية للإعلان، واللي محتاج تكمّله، وقائمة فحص.'),
  role: 'Senior performance copywriter, and a prompt engineer for chat AIs.',
  understanding: ['subject and offer are the core; platform sets length and style; keyPoints are the only claims allowed.', 'sections.goal states the offer, the platform, and the action (click, message, buy).'],
  intelligence: ['Ask for 3 angles (benefit, problem-solution, social proof), each with a scroll-stopping hook, a short body, and one clear CTA, matched to the platform. Lead with the benefit, not the brand.', 'sections.approach tells the AI to write in the tone, keep it tight, and never invent offers, prices or claims beyond keyPoints.'],
  controlExtra: ['Any price, discount or guarantee must come from keyPoints; otherwise write a [placeholder].'],
  examples: [{ good: 'Angle 1 (benefit): Hook "A whiter smile in one visit." Body: [clinic] offers one-session whitening, 20% off this month. CTA: Book on WhatsApp.', bad: 'BEST whitening EVER!! 90% off!!! Guaranteed perfect teeth forever, limited to 3 spots!!!', why: 'The bad one invents the discount and guarantee and uses fake urgency and clickbait.' }],
});

export const emailDraft = makeTextMission({
  id: 'email-draft', title: c('Email', 'إيميل'), topics: ['email-draft'],
  intake: { question: c('Tell me who the email is to and what you want from it.', 'قولّي الإيميل لمين وعايز منه إيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Follow up with a client who went quiet', 'متابعة عميل بقى ساكت'), c('Pitch my service to a company', 'أعرض خدمتي على شركة'), c('Apologise for a delay', 'أعتذر عن تأخير'), c('Ask my manager for a raise', 'أطلب زيادة من مديري')] },
  slots: writingSlots(c('Purpose', 'الغرض'), c('What is the email about, and what outcome do you want?', 'الإيميل عن إيه، وعايز نتيجة إيه؟'), c('Follow up on a quote I sent last week and get a reply.', 'متابعة عرض سعر بعته الأسبوع اللي فات وأجيب رد.'), { en: ['follow-up', 'proposal', 'apology', 'request', 'introduction', 'thank you'], ar: ['متابعة', 'عرض', 'اعتذار', 'طلب', 'تعريف بنفسي', 'شكر'] }),
  nameLabel: c('Your name / company', 'اسمك / شركتك'), nameWhat: 'your name or company as given',
  avoidVocab: { en: ['too long', 'pushy tone', 'made-up details', 'empty flattery'], ar: ['طويل أوي', 'نبرة ملحّة', 'تفاصيل متألفة', 'مجاملة فاضية'] },
  outlineKey: 'emailOutline', outlineDesc: 'Lines in order: subject line, opener, body, the ask, sign-off.', outlineWhat: 'the email parts in order',
  outputDescription: c('A layered prompt for a chat AI, the email structure, what to fill, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وهيكل الإيميل، واللي محتاج تكمّله، وقائمة فحص.'),
  role: 'Senior business communication writer, and a prompt engineer for chat AIs.',
  understanding: ['subject is the purpose and desired outcome; audience is the recipient. Use only facts given.', 'sections.goal states who it is to, the purpose, and the one action you want back.'],
  intelligence: ['Structure: a specific subject line, a one-line opener that earns attention, a short body with the value, one clear ask, a polite sign-off. One ask, not three.', 'sections.approach tells the AI to keep it under ~150 words, match the tone, and never invent names, dates or details — use [placeholders].'],
  examples: [{ good: 'Subject: Quick follow-up on your [project] quote. Opener: references last week. Body: restate the value in one line. Ask: 15-min call this week? Sign-off.', bad: 'Dear Sir, I hope this email finds you well. We are the best company and you must reply today or lose this once-in-a-lifetime deal.', why: 'The bad one is generic, pushy, and invents urgency.' }],
});

export const socialCaption = makeTextMission({
  id: 'social-caption', title: c('Social caption', 'كابشن سوشيال'), topics: ['social-caption'],
  intake: { question: c('Tell me what the post is about and the platform.', 'قولّي البوست عن إيه، وأنهي منصة.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Caption for a product photo', 'كابشن لصورة منتج'), c('Announce an offer on Instagram', 'أعلن عن عرض على إنستجرام'), c('A reel caption that hooks', 'كابشن ريلز بيجذب'), c('A LinkedIn post about a win', 'بوست لينكدإن عن إنجاز')] },
  slots: writingSlots(c('Post topic', 'موضوع البوست'), c('What is the post about?', 'البوست عن إيه؟'), c('Launching our new iced coffee for summer.', 'بنطلق القهوة المثلجة الجديدة للصيف.'), { en: ['product launch', 'offer', 'behind the scenes', 'tip', 'announcement', 'story'], ar: ['إطلاق منتج', 'عرض', 'كواليس', 'نصيحة', 'إعلان', 'قصة'] }, [
    { id: 'platform', kind: 'single', layer: 'understanding', importance: 'important', label: c('Platform', 'المنصة'), question: c('Which platform?', 'أنهي منصة؟'), why: c('Length, hashtags and style differ by platform.', 'الطول والهاشتاجات والأسلوب بيختلفوا حسب المنصة.'), example: c('Instagram.', 'إنستجرام.'),
      options: [{ value: 'instagram', label: c('Instagram', 'إنستجرام'), keywords: ['instagram', 'انستجرام', 'ريلز', 'reel'] }, { value: 'tiktok', label: c('TikTok', 'تيك توك'), keywords: ['tiktok', 'تيك توك'] }, { value: 'linkedin', label: c('LinkedIn', 'لينكدإن'), keywords: ['linkedin', 'لينكدإن'] }, { value: 'facebook', label: c('Facebook', 'فيسبوك'), keywords: ['facebook', 'فيسبوك'] }, { value: 'x', label: c('X (Twitter)', 'إكس (تويتر)'), keywords: ['twitter', 'x', 'تويتر'] }],
      defaults: [{ value: 'instagram', reason: c('Instagram is the most common for captions.', 'إنستجرام الأكتر شيوعاً للكابشن.') }] },
  ]),
  nameLabel: c('Brand / handle', 'البراند / الحساب'), nameWhat: 'the brand or handle',
  avoidVocab: { en: ['too many hashtags', 'engagement bait', 'made-up claims', 'irrelevant trends'], ar: ['هاشتاجات كتير', 'استجداء تفاعل', 'ادعاءات متألفة', 'ترندات مالهاش علاقة'] },
  outlineKey: 'captionOutline', outlineDesc: 'A hook line, 2–3 caption options, a CTA, and a short hashtag set.', outlineWhat: 'hook, caption options, CTA and hashtags',
  outputDescription: c('A layered prompt for a chat AI, caption options, what to fill, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، واختيارات للكابشن، واللي محتاج تكمّله، وقائمة فحص.'),
  role: 'Senior social media copywriter, and a prompt engineer for chat AIs.',
  understanding: ['subject and platform set the style; keyPoints are the only facts. Match the platform’s length and norms.', 'sections.goal states the topic, the platform, and the action (save, comment, visit, buy).'],
  intelligence: ['Give a strong first-line hook, 2–3 caption variations in the tone, one CTA, and 5–10 relevant hashtags (fewer on LinkedIn/X). First line must stop the scroll.', 'sections.approach tells the AI to lead with the hook, keep it native to the platform, and never invent offers or stats.'],
  examples: [{ good: 'Hook: "Summer just got colder ❄️". Option A/B/C in a playful tone. CTA: "Tap to try it". Hashtags: #icedcoffee #[city]coffee …', bad: 'Buy now!!! Follow + like + share + comment + tag 10 friends to win!!! #love #instagood #follow4follow', why: 'The bad one is engagement bait with irrelevant hashtags and no real hook.' }],
});

export const blogArticle = makeTextMission({
  id: 'blog-article', title: c('Blog article', 'مقال'), topics: ['blog-article'],
  intake: { question: c('Tell me the article topic and who it is for.', 'قولّي موضوع المقال، ولمين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A guide to buying your first espresso machine', 'دليل شراء أول ماكينة إسبريسو'), c('Why small businesses need a website', 'ليه البيزنس الصغير محتاج موقع'), c('Tips for studying effectively', 'نصايح للمذاكرة بفعالية'), c('An article for my clinic blog', 'مقال لمدونة العيادة')] },
  slots: writingSlots(c('Topic & angle', 'الموضوع والزاوية'), c('What is the article about, and what is the angle?', 'المقال عن إيه، والزاوية إيه؟'), c('How to choose a home espresso machine under 10,000 EGP.', 'إزاي تختار ماكينة إسبريسو منزلية تحت ١٠ آلاف جنيه.'), { en: ['how-to guide', 'listicle', 'opinion', 'comparison', 'beginner guide', 'case study'], ar: ['دليل عملي', 'قائمة', 'رأي', 'مقارنة', 'دليل مبتدئين', 'دراسة حالة'] }, [
    lengthSlot([{ value: 'short', label: c('Short (~500 words)', 'قصير (~٥٠٠ كلمة)') }, { value: 'medium', label: c('Medium (~1000)', 'متوسط (~١٠٠٠)') }, { value: 'long', label: c('Long (~1500+)', 'طويل (~١٥٠٠+)') }], 'medium', c('~1000 words reads well and ranks.', '~١٠٠٠ كلمة بتتقرا كويس وبتظهر في البحث.')),
  ]),
  nameLabel: c('Brand / author', 'البراند / الكاتب'), nameWhat: 'the brand or author if given',
  avoidVocab: { en: ['keyword stuffing', 'fluff', 'made-up facts', 'plagiarised structure'], ar: ['حشو كلمات مفتاحية', 'كلام فاضي', 'حقائق متألفة', 'هيكل منقول'] },
  outlineKey: 'articleOutline', outlineDesc: 'One line per section: H2 heading — what it covers.', outlineWhat: 'one line per article section (H2 + what it covers)',
  outputDescription: c('A layered prompt for a chat AI, the article outline, what to research, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وترتيب المقال، واللي محتاج تبحث عنه، وقائمة فحص.'),
  role: 'Senior content writer and SEO editor, and a prompt engineer for chat AIs.',
  understanding: ['subject is the topic and angle; audience sets the depth; keyPoints are the only facts to assert.', 'sections.goal states the topic, the reader, and the goal (inform, rank, convert).'],
  intelligence: ['Structure: a compelling title, intro with a hook and promise, 4–7 H2 sections each with a point and example, a short conclusion with a CTA. Use the topic as the natural keyword without stuffing.', 'sections.approach tells the AI to write for the reader first, cite only provided facts (mark others [to verify]), and keep paragraphs short.'],
  examples: [{ good: 'Title: "The honest guide to a home espresso machine under 10,000 EGP". H2s: what matters, 3 options to consider, common mistakes, how to decide. Mark any price as [to verify].', bad: 'Espresso machine espresso machine best espresso machine 2026 buy espresso machine cheap espresso machine near me.', why: 'The bad one is keyword stuffing with no structure or value.' }],
});

export const websiteCopy = makeTextMission({
  id: 'website-copy', title: c('Website copy', 'نصوص موقع'), topics: ['website-copy'],
  intake: { question: c('Tell me about the business and the page you need copy for.', 'احكيلي عن النشاط والصفحة اللي عايز نصوصها.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Homepage copy for my clinic', 'نصوص الصفحة الرئيسية للعيادة'), c('An About page that builds trust', 'صفحة About بتبني ثقة'), c('Services page copy', 'نصوص صفحة الخدمات'), c('Hero section for my app', 'قسم البداية لتطبيقي')] },
  slots: writingSlots(c('Business & page', 'النشاط والصفحة'), c('What is the business, and which page needs copy?', 'النشاط إيه، وأنهي صفحة عايزة نصوص؟'), c('A dental clinic; the homepage.', 'عيادة أسنان؛ الصفحة الرئيسية.'), { en: ['homepage', 'about', 'services', 'pricing', 'contact', 'hero section'], ar: ['الرئيسية', 'من نحن', 'الخدمات', 'الأسعار', 'تواصل', 'قسم البداية'] }),
  nameLabel: c('Brand name', 'اسم البراند'), nameWhat: 'the brand name',
  avoidVocab: { en: ['corporate jargon', 'we-we-we focus', 'made-up stats', 'walls of text'], ar: ['لغة شركات متحجّرة', 'التركيز على إحنا', 'إحصائيات متألفة', 'فقرات طويلة'] },
  outlineKey: 'copyOutline', outlineDesc: 'One line per page section: section — its headline idea and CTA.', outlineWhat: 'one line per page section',
  outputDescription: c('A layered prompt for a chat AI, a section-by-section copy outline, what to fill, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وترتيب نصوص الصفحة قسم بقسم، واللي محتاج تكمّله، وقائمة فحص.'),
  role: 'Senior website copywriter, and a prompt engineer for chat AIs.',
  understanding: ['subject is the business and page; audience is the visitor; keyPoints are the real proof. Keep the offer exactly as given.', 'sections.goal states the business, the page, and the one action the visitor should take.'],
  intelligence: ['Headline = the visitor’s outcome, not the company name. Each section answers one question on the way to the CTA: hero, value, how it works, proof, CTA. Benefit-led, concrete, short.', 'sections.approach tells the AI to write to the visitor ("you"), keep sentences short, and never invent reviews, numbers or awards.'],
  examples: [{ good: 'Hero: "A whiter smile in one visit." Sub: painless, same-day. Sections: services, why us (real proof), [reviews], book CTA. Mark missing proof as [placeholder].', bad: 'We are a leading, world-class, innovative, synergistic clinic trusted by millions since forever.', why: 'The bad one is jargon, self-focused, and invents trust claims.' }],
});

export const productDescription = makeTextMission({
  id: 'product-description', title: c('Product description', 'وصف منتج'), topics: ['product-description'],
  intake: { question: c('Tell me about the product you want described.', 'احكيلي عن المنتج اللي عايز توصفه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A description for my Amazon product', 'وصف لمنتجي على أمازون'), c('Describe my handmade bag', 'أوصف الشنطة الهاند ميد بتاعتي'), c('A tasty description for a menu item', 'وصف شهي لصنف في المنيو'), c('Product copy for my store', 'وصف منتج لمتجري')] },
  slots: writingSlots(c('Product', 'المنتج'), c('What is the product, and what makes it good?', 'المنتج إيه، وإيه اللي بيميّزه؟'), c('A leather laptop bag, handmade, fits 15".', 'شنطة لابتوب جلد، هاند ميد، تاخد ١٥ بوصة.'), { en: ['materials', 'size', 'features', 'benefits', 'who it is for', 'what is included'], ar: ['الخامات', 'المقاس', 'المميزات', 'الفوايد', 'لمين', 'بيتضمن إيه'] }, [
    { id: 'channel', kind: 'single', layer: 'understanding', importance: 'nice', label: c('Where it sells', 'بيتباع فين'), question: c('Where will it be sold?', 'هيتباع فين؟'), why: c('Marketplaces want specs; brand stores want story.', 'المتاجر الكبيرة عايزة مواصفات، ومتجرك عايز حكاية.'), example: c('Amazon / Noon.', 'أمازون / نون.'),
      options: [{ value: 'marketplace', label: c('Amazon / Noon', 'أمازون / نون'), keywords: ['amazon', 'noon', 'امازون', 'نون'] }, { value: 'own-store', label: c('My own store', 'متجري الخاص'), keywords: ['my store', 'shopify', 'متجري'] }, { value: 'social', label: c('Social / WhatsApp', 'سوشيال / واتساب'), keywords: ['instagram', 'whatsapp', 'انستجرام', 'واتساب'] }],
      defaults: [{ value: 'own-store', reason: c('A story-led description fits most brand stores.', 'الوصف اللي بيحكي بيناسب أغلب المتاجر.') }] },
  ]),
  nameLabel: c('Brand name', 'اسم البراند'), nameWhat: 'the brand name',
  avoidVocab: { en: ['made-up specs', 'exaggeration', 'copying competitor text', 'vague adjectives'], ar: ['مواصفات متألفة', 'مبالغة', 'نسخ من منافس', 'صفات عامة'] },
  outlineKey: 'descOutline', outlineDesc: 'Lines: a hook line, 3–5 benefit bullets, a specs block, a short closing line.', outlineWhat: 'the description parts in order',
  outputDescription: c('A layered prompt for a chat AI, the description structure, what to fill, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وهيكل الوصف، واللي محتاج تكمّله، وقائمة فحص.'),
  role: 'Senior e-commerce copywriter, and a prompt engineer for chat AIs.',
  understanding: ['subject is the product and its real features; channel sets the format. Use only the specs given — never invent materials, sizes or numbers.', 'sections.goal states the product, where it sells, and the buyer it is for.'],
  intelligence: ['Turn features into benefits: a hook line, 3–5 benefit bullets, a clean specs block, a short closing nudge. Specifics sell; keep adjectives earned.', 'sections.approach tells the AI to map every feature to a benefit and mark any missing spec as [placeholder].'],
  examples: [{ good: 'Hook: "Carry your work in something that lasts." Bullets map leather, 15" fit, handmade → durability, protection, uniqueness. Specs: [dimensions], [weight].', bad: 'The best bag in the world, premium luxury amazing quality, fits all laptops, waterproof, lifetime warranty.', why: 'The bad one invents specs and a warranty and uses empty superlatives.' }],
});

export const scriptWriting = makeTextMission({
  id: 'script-writing', title: c('Video script', 'سكريبت فيديو'), topics: ['script-writing'],
  intake: { question: c('Tell me the video topic, length and platform.', 'قولّي موضوع الفيديو وطوله والمنصة.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A 30-second reel script for my product', 'سكريبت ريلز ٣٠ ثانية لمنتجي'), c('A YouTube intro script', 'سكريبت مقدمة يوتيوب'), c('An explainer for my app', 'فيديو شرح لتطبيقي'), c('A TikTok hook script', 'سكريبت هوك لتيك توك')] },
  slots: writingSlots(c('Video topic', 'موضوع الفيديو'), c('What is the video about, and what is the goal?', 'الفيديو عن إيه، والهدف إيه؟'), c('Show how our app saves time ordering lunch.', 'نوري إزاي التطبيق بيوفّر وقت في طلب الغدا.'), { en: ['product demo', 'explainer', 'story', 'tutorial', 'ad', 'testimonial'], ar: ['عرض منتج', 'شرح', 'قصة', 'تعليمي', 'إعلان', 'شهادة عميل'] }, [
    { id: 'duration', kind: 'single', layer: 'delivery', importance: 'important', label: c('Length', 'المدة'), question: c('How long is the video?', 'الفيديو مدته قد إيه؟'), why: c('Length sets the number of beats and words.', 'المدة بتحدد عدد المشاهد وعدد الكلمات.'), example: c('30 seconds.', '٣٠ ثانية.'),
      options: [{ value: '15s', label: c('15 s', '١٥ ثانية') }, { value: '30s', label: c('30 s', '٣٠ ثانية') }, { value: '60s', label: c('60 s', '٦٠ ثانية') }, { value: '2-3min', label: c('2–3 min', '٢–٣ دقايق') }],
      defaults: [{ value: '30s', reason: c('30 seconds is the sweet spot for social video.', '٣٠ ثانية هي المدة المثالية لفيديو السوشيال.') }] },
  ]),
  nameLabel: c('Brand name', 'اسم البراند'), nameWhat: 'the brand name',
  avoidVocab: { en: ['slow opening', 'too much text', 'made-up claims', 'reading like an essay'], ar: ['بداية بطيئة', 'كلام كتير', 'ادعاءات متألفة', 'يبقى شكله مقال'] },
  outlineKey: 'scriptOutline', outlineDesc: 'One line per beat: timecode — what is shown and said.', outlineWhat: 'one line per beat with timecode',
  outputDescription: c('A layered prompt for a chat AI, a beat-by-beat script outline, what to fill, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وسكريبت مشهد بمشهد بالتوقيت، واللي محتاج تكمّله، وقائمة فحص.'),
  role: 'Senior short-form video scriptwriter, and a prompt engineer for chat AIs.',
  understanding: ['subject is the topic and goal; duration sets the structure. Use only facts in keyPoints.', 'sections.goal states the topic, the length, the platform, and the action.'],
  intelligence: ['Hook in the first 2 seconds, one idea per beat, visuals noted beside the voiceover/on-screen text, a clear CTA at the end. Match beats to the duration.', 'sections.approach tells the AI to write spoken, punchy lines, show don’t tell, and never invent claims.'],
  examples: [{ good: '0–2s hook: "Lunch in 3 taps." 2–20s: show the 3 taps (VO + on-screen). 20–30s: offer + CTA "Download now". Mark any stat as [to verify].', bad: 'Our revolutionary award-winning app used by millions is the best in the world, scene 1: long intro explaining the company history.', why: 'The bad one opens slowly and invents awards and user numbers.' }],
});

export const pressRelease = makeTextMission({
  id: 'press-release', title: c('Press release', 'بيان صحفي'), topics: ['press-release'],
  intake: { question: c('Tell me the news you want to announce.', 'قولّي الخبر اللي عايز تعلنه.'), why: c('Real facts make a press release; we never invent them.', 'الحقائق الحقيقية هي اللي بتعمل البيان، وما بنألّفش.'),
    starters: [c('Announce our new product launch', 'نعلن عن إطلاق منتجنا الجديد'), c('A funding round announcement', 'إعلان عن جولة تمويل'), c('A partnership announcement', 'إعلان شراكة'), c('Opening a new branch', 'افتتاح فرع جديد')] },
  slots: writingSlots(c('The news', 'الخبر'), c('What are you announcing, and when?', 'بتعلن عن إيه، وإمتى؟'), c('We opened a second branch in Alexandria this month.', 'افتتحنا فرع تاني في إسكندرية الشهر ده.'), { en: ['product launch', 'funding', 'partnership', 'new branch', 'award', 'milestone'], ar: ['إطلاق منتج', 'تمويل', 'شراكة', 'فرع جديد', 'جائزة', 'إنجاز'] }),
  nameLabel: c('Company name', 'اسم الشركة'), nameWhat: 'the company name',
  avoidVocab: { en: ['hype adjectives', 'made-up quotes', 'invented numbers', 'marketing fluff'], ar: ['صفات مبالغ فيها', 'اقتباسات متألفة', 'أرقام متألفة', 'كلام تسويقي فاضي'] },
  outlineKey: 'releaseOutline', outlineDesc: 'Lines in order: headline, dateline, lead paragraph, body, quote, boilerplate, contact.', outlineWhat: 'the press-release parts in order',
  outputDescription: c('A layered prompt for a chat AI, the press-release structure, what to confirm, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وهيكل البيان الصحفي، واللي محتاج تتأكد منه، وقائمة فحص.'),
  role: 'Senior PR writer, and a prompt engineer for chat AIs.',
  understanding: ['subject is the news; keyPoints are the only facts and figures. Keep names, dates and numbers exactly as given.', 'sections.goal states the news, the company, and the audience (press, customers).'],
  intelligence: ['Standard structure: a factual headline, dateline, a lead answering who/what/when/where/why, a body with detail, one quote from a named person, a boilerplate, and contact info. Neutral, factual tone — not an ad.', 'sections.approach tells the AI to attribute any quote to a [named person] the user provides, never to invent quotes or numbers, and to mark unknowns as [placeholder].'],
  examples: [{ good: 'Headline: "[Company] opens second branch in Alexandria." Lead: who/what/when/where/why from the facts. Quote: "[Founder name], [title]: …". Numbers only from keyPoints.', bad: 'The world’s fastest-growing company, loved by everyone, announces the most revolutionary branch ever, says our amazing CEO.', why: 'The bad one is hype, invents a quote, and uses no real facts.' }],
});

export const writingBlueprints = [adCopy, emailDraft, socialCaption, blogArticle, websiteCopy, productDescription, scriptWriting, pressRelease];
