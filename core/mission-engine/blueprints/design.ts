import type { Blueprint, Copy, Slot } from '../types.ts';
import { c } from '../modules.ts';
import { makeImageMission, vis } from './_visual.ts';
import { makeTextMission } from './_text.ts';

const subject = (label: Copy, question: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 800,
  label, question, why: c('The design is built on this.', 'التصميم هيتبني على ده.'), example, vocabulary: vocab,
});

const usage = (options: { value: string; label: Copy; keywords?: string[] }[], def: string, defReason: Copy): Slot => ({
  id: 'usage', kind: 'single', layer: 'understanding', importance: 'important',
  label: c('Where it will be used', 'هتتستخدم فين'), question: c('Where will it be used?', 'هتستخدمها فين؟'),
  why: c('This decides the size and the layout.', 'ده بيحدد المقاس وتوزيع العناصر.'), example: c('An Instagram post.', 'بوست إنستجرام.'),
  options, defaults: [{ value: def, reason: defReason }],
});

export const socialPostDesign = makeImageMission({
  id: 'social-post-design', title: c('Social design', 'تصميم سوشيال'), topics: ['social-post-design'],
  intake: { question: c('Tell me about the post you want designed.', 'احكيلي عن البوست اللي عايز تصميمه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A post announcing 20% off', 'بوست يعلن خصم ٢٠٪'), c('A story for our new menu', 'ستوري للمنيو الجديد'), c('A quote post for my page', 'بوست اقتباس لصفحتي'), c('An event announcement post', 'بوست إعلان فعالية')] },
  slots: [
    subject(c('Post content', 'محتوى البوست'), c('What should the post show or say?', 'البوست يعرض أو يقول إيه؟'), c('A 20% discount on all winter jackets.', 'خصم ٢٠٪ على كل جواكت الشتا.'), { en: ['discount', 'new product', 'event', 'quote', 'tip', 'announcement'], ar: ['خصم', 'منتج جديد', 'فعالية', 'اقتباس', 'نصيحة', 'إعلان'] }),
    usage([
      { value: 'ig-post', label: c('Feed post', 'بوست فيد'), keywords: ['post', 'feed', 'بوست', 'فيد'] },
      { value: 'story', label: c('Story / Reels cover', 'ستوري / غلاف ريلز'), keywords: ['story', 'ستوري', 'ريلز'] },
      { value: 'cover', label: c('Page / channel cover', 'غلاف صفحة'), keywords: ['cover', 'banner', 'غلاف', 'بانر'] },
      { value: 'ad', label: c('Paid ad', 'إعلان ممول'), keywords: ['ad', 'اعلان', 'ممول'] },
    ], 'ig-post', c('Most social designs are feed posts.', 'أغلب تصاميم السوشيال بوستات فيد.')),
    {
      id: 'style', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Look', 'الشكل'), question: c('What look do you want?', 'عايز الشكل يبقى إزاي؟'),
      why: c('The look sets colours, type and layout.', 'الشكل بيحدد الألوان والخط والتوزيع.'), example: c('Bold and text-led.', 'جريء ومعتمد على الكلام.'),
      options: [
        { value: 'bold-type', label: c('Bold typography', 'خط كبير وجريء'), keywords: ['bold', 'typography', 'جريء', 'خط كبير'], visual: vis('social-post-design', 'bold-type', 'Huge headline fills the frame, flat strong colour, tiny supporting line.', 'عنوان ضخم بيملا الكادر، ولون قوي مسطّح، وسطر صغير تحته.', 'social media post design, huge bold headline filling the frame, flat orange background, minimal supporting text, graphic design') },
        { value: 'photo-led', label: c('Photo-led', 'معتمد على صورة'), keywords: ['photo', 'image', 'صورة'], visual: vis('social-post-design', 'photo-led', 'A strong photo fills the frame with a readable text band over it.', 'صورة قوية بتملا الكادر وعليها شريط كلام واضح.', 'social media post design, full-bleed product photo with a readable text band overlay, clean modern layout') },
        { value: 'minimal', label: c('Minimal', 'بسيط'), keywords: ['minimal', 'clean', 'بسيط', 'نضيف'], visual: vis('social-post-design', 'minimal', 'Lots of white space, one small element, calm and premium.', 'مساحة بيضا كتير، وعنصر صغير واحد، وإحساس هادي وراقي.', 'minimal social media post, generous white space, one small centered element, elegant thin typography') },
        { value: 'gradient', label: c('Modern gradient', 'تدرّج لوني عصري'), keywords: ['gradient', 'modern', 'تدرج', 'عصري'], visual: vis('social-post-design', 'gradient', 'Smooth colour gradient background with glassy shapes and clean type.', 'خلفية تدرّج لوني ناعم مع أشكال زجاجية وخط نضيف.', 'modern social media post with smooth purple blue gradient background, glassmorphism shapes, clean sans typography') },
        { value: 'collage', label: c('Collage / cut-out', 'كولاج / قصاصات'), keywords: ['collage', 'cutout', 'كولاج', 'قصاصات'], visual: vis('social-post-design', 'collage', 'Cut-out photos, tape and paper textures, playful arrangement.', 'صور مقصوصة وشرايط ورق وملامس ورقية بترتيب مرح.', 'collage style social media post, cut-out photos with torn paper edges, tape, playful layered arrangement') },
      ],
      defaults: [{ value: 'bold-type', reason: c('Bold type reads fastest in a busy feed.', 'الخط الجريء بيتقري أسرع وسط زحمة الفيد.') }],
    },
  ],
  brandLabel: c('Brand name on the design', 'اسم البراند على التصميم'), brandWhere: 'as the brand lockup in a corner',
  exactTextLabel: c('Words on the design', 'الكلام على التصميم'),
  avoidVocab: { en: ['other brands', 'stock-photo look', 'too much text', 'clashing colours'], ar: ['براندات تانية', 'شكل الصور الجاهزة', 'كلام كتير', 'ألوان متنافرة'] },
  ratioByUsage: { 'ig-post': '4:5', story: '9:16', cover: '16:9', ad: '4:5' }, ratioOptions: ['1:1', '4:5', '9:16', '16:9'],
  referenceWhat: c('a design or brand reference', 'تصميم أو مرجع للبراند'), referenceLabel: c('Design reference', 'مرجع تصميم'),
  outputDescription: c('A design prompt, what to avoid, ready versions per tool, the right size, and a checklist.', 'برومبت تصميم، والممنوعات، ونسخ جاهزة لكل أداة، والمقاس الصح، وقائمة فحص.'),
  role: 'Senior social media art director and prompt engineer for AI image tools.',
  understanding: [
    'subject is the message of the post; usage sets the frame and how much room text needs.',
    'If reference = yes, every variant starts with how to use the uploaded reference for layout and palette.',
  ],
  intelligence: [
    'Turn style into a concrete layout: background, focal element, type hierarchy, colour palette, spacing and where the eye lands first. Readable at thumbnail size.',
    'Leave deliberate clear space for the headline and the brand lockup; keep the composition to one focal point.',
  ],
  examples: [{
    good: 'Bold typographic social post: flat deep-orange background, huge condensed headline centred with generous margins, a small brand lockup bottom-left, clean grid, high contrast, readable at thumbnail size.',
    bad: 'A beautiful 4:5 Instagram post made in Midjourney with amazing text "50% OFF" and lots of elements everywhere.',
    why: 'The bad one leaks the size and tool into the scene, invents an offer, and has no focal point.',
  }],
});

export const posterDesign = makeImageMission({
  id: 'poster-design', title: c('Poster', 'بوستر'), topics: ['poster-design'],
  intake: { question: c('Tell me what the poster is for.', 'قولّي البوستر لإيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A poster for a music event', 'بوستر لحفلة موسيقية'), c('A gym promo poster', 'بوستر عرض للجيم'), c('A poster for a workshop', 'بوستر لورشة'), c('A product promo poster to print', 'بوستر عرض منتج للطباعة')] },
  slots: [
    subject(c('Poster subject', 'موضوع البوستر'), c('What is the poster announcing or showing?', 'البوستر بيعلن عن إيه أو بيعرض إيه؟'), c('A jazz night at our cafe on Friday.', 'ليلة جاز في الكافيه يوم الجمعة.'), { en: ['event', 'offer', 'product', 'workshop', 'announcement', 'campaign'], ar: ['فعالية', 'عرض', 'منتج', 'ورشة', 'إعلان', 'حملة'] }),
    usage([
      { value: 'print', label: c('Print (A3 / A4)', 'طباعة (A3 / A4)'), keywords: ['print', 'a3', 'a4', 'طباعة'] },
      { value: 'social', label: c('Social post', 'بوست سوشيال'), keywords: ['social', 'instagram', 'سوشيال', 'انستجرام'] },
      { value: 'story', label: c('Story / vertical screen', 'ستوري / شاشة طولية'), keywords: ['story', 'ستوري'] },
      { value: 'billboard', label: c('Outdoor / billboard', 'لافتة خارجية'), keywords: ['billboard', 'outdoor', 'لافتة', 'بيلبورد'] },
    ], 'print', c('Posters are usually printed.', 'البوسترات غالباً بتتطبع.')),
    {
      id: 'style', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Style', 'الأسلوب'), question: c('What style fits?', 'أنهي أسلوب يناسب؟'),
      why: c('Style sets type, colour and imagery.', 'الأسلوب بيحدد الخط واللون والصور.'), example: c('Bold Swiss typography.', 'خط سويسري جريء.'),
      options: [
        { value: 'swiss', label: c('Bold Swiss type', 'سويسري جريء'), keywords: ['swiss', 'bold', 'typographic', 'سويسري', 'جريء'], visual: vis('poster-design', 'swiss', 'Strict grid, huge helvetica-like type, one accent colour, lots of air.', 'شبكة منضبطة، وخط ضخم، ولون مميز واحد، ومساحات واسعة.', 'swiss style poster, strict grid, huge bold helvetica typography, single red accent on off-white, generous whitespace') },
        { value: 'photo-hero', label: c('Photo hero', 'صورة رئيسية'), keywords: ['photo', 'image', 'صورة'], visual: vis('poster-design', 'photo-hero', 'One dramatic photo fills the poster with the title over it.', 'صورة واحدة قوية بتملا البوستر والعنوان فوقها.', 'poster with one dramatic full-bleed photograph, large title overlaid, cinematic colour grade') },
        { value: 'retro', label: c('Retro / vintage', 'ريترو'), keywords: ['retro', 'vintage', 'ريترو', 'قديم'], visual: vis('poster-design', 'retro', 'Warm muted palette, grain, vintage type and simple shapes.', 'ألوان دافية مطفية، وحبيبات، وخط قديم، وأشكال بسيطة.', 'retro vintage poster, warm muted palette, paper grain texture, 1970s typography, simple geometric shapes') },
        { value: 'gradient-modern', label: c('Modern gradient', 'تدرّج عصري'), keywords: ['gradient', 'modern', 'تدرج', 'عصري'], visual: vis('poster-design', 'gradient-modern', 'Vivid gradient, abstract shapes, clean modern type.', 'تدرّج لوني قوي، وأشكال مجردة، وخط عصري نضيف.', 'modern poster with vivid blue purple gradient, abstract fluid shapes, clean contemporary typography') },
        { value: 'illustrated', label: c('Illustrated', 'مرسوم'), keywords: ['illustration', 'drawn', 'رسم', 'مرسوم'], visual: vis('poster-design', 'illustrated', 'A hand-drawn or vector illustration carries the whole poster.', 'رسمة إيد أو فيكتور بتحمل البوستر كله.', 'illustrated poster, flat vector illustration as the hero, limited colour palette, playful composition') },
      ],
      defaults: [{ value: 'swiss', reason: c('Bold type reads from a distance, which is what posters need.', 'الخط الجريء بيتقري من بعيد، وده اللي البوستر محتاجه.') }],
    },
  ],
  brandLabel: c('Brand name on the poster', 'اسم البراند على البوستر'), brandWhere: 'as the brand lockup at the bottom',
  exactTextLabel: c('Poster text', 'كلام البوستر'),
  avoidVocab: { en: ['other brands', 'cluttered layout', 'unreadable type', 'low contrast'], ar: ['براندات تانية', 'زحمة عناصر', 'خط مش مقروء', 'تباين ضعيف'] },
  ratioByUsage: { print: '2:3', social: '4:5', story: '9:16', billboard: '16:9' }, ratioOptions: ['2:3', '4:5', '9:16', '16:9', '1:1'],
  referenceWhat: c('a poster you like', 'بوستر عاجبك'), referenceLabel: c('Poster reference', 'مرجع بوستر'),
  outputDescription: c('A poster prompt, what to avoid, ready versions per tool, the print size, and a checklist.', 'برومبت بوستر، والممنوعات، ونسخ جاهزة لكل أداة، ومقاس الطباعة، وقائمة فحص.'),
  role: 'Senior graphic designer specialising in posters, and a prompt engineer for AI image tools.',
  understanding: ['subject is what the poster announces; usage sets the size and the viewing distance.', 'If reference = yes, variants start with how to follow the uploaded reference for layout and palette.'],
  intelligence: [
    'Turn style into a concrete composition: hierarchy (title, subtitle, details), grid, palette, imagery and where the eye travels. A poster must read in 3 seconds from across a room.',
    'Reserve clear areas for the title, the details block and the brand lockup; one focal element only.',
  ],
  examples: [{
    good: 'Swiss-style event poster: off-white ground, strict grid, huge condensed title top-left, a single red accent bar, small details block bottom-right, generous margins, high contrast for print.',
    bad: 'An amazing A3 poster in Midjourney with the text "JAZZ NIGHT FRIDAY 9PM" and lots of instruments everywhere.',
    why: 'The bad one leaks the size and tool, invents the date and time, and has no hierarchy.',
  }],
});

export const logoConcept = makeImageMission({
  id: 'logo-concept', title: c('Logo concept', 'فكرة لوجو'), topics: ['logo-concept'],
  intake: { question: c('Tell me the brand name and what it does.', 'قولّي اسم البراند، وبيعمل إيه.'), why: c('The name must be exact — AI tools often misspell it.', 'الاسم لازم يبقى بالحرف، لأن الأدوات بتغلط فيه كتير.'),
    starters: [c('A logo for my coffee brand "Beans"', 'لوجو لبراند قهوة اسمه Beans'), c('A minimal logo for a tech startup', 'لوجو بسيط لستارت أب تقني'), c('A logo mark for my clinic', 'علامة لوجو لعيادتي'), c('An app icon for my delivery app', 'أيقونة تطبيق للتوصيل')] },
  slots: [
    subject(c('Brand & what it does', 'البراند وبيعمل إيه'), c('What does the brand do, and what feeling should the logo give?', 'البراند بيعمل إيه، واللوجو يدّي إحساس إيه؟'), c('A specialty coffee roastery; warm and craft.', 'محمصة قهوة مختصة؛ إحساس دافي وحرفي.'), { en: ['coffee', 'clinic', 'tech', 'fashion', 'food', 'warm', 'modern', 'trustworthy'], ar: ['قهوة', 'عيادة', 'تقنية', 'أزياء', 'أكل', 'دافي', 'عصري', 'بيدّي ثقة'] }),
    usage([
      { value: 'app-icon', label: c('App icon', 'أيقونة تطبيق'), keywords: ['app icon', 'icon', 'أيقونة', 'تطبيق'] },
      { value: 'web-print', label: c('Website & print', 'موقع وطباعة'), keywords: ['website', 'print', 'موقع', 'طباعة'] },
      { value: 'signage', label: c('Signage', 'لافتة المحل'), keywords: ['signage', 'sign', 'لافتة', 'يفطة'] },
      { value: 'social', label: c('Social profile', 'بروفايل سوشيال'), keywords: ['profile', 'social', 'بروفايل'] },
    ], 'web-print', c('Most logos are made for web and print first.', 'أغلب اللوجوهات بتتعمل للويب والطباعة الأول.')),
    {
      id: 'style', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Logo type', 'نوع اللوجو'), question: c('Which kind of logo?', 'أنهي نوع لوجو؟'),
      why: c('The type decides what we actually draw.', 'النوع بيحدد إحنا بنرسم إيه بالظبط.'), example: c('A simple wordmark.', 'اسم مكتوب بخط مميز.'),
      options: [
        { value: 'wordmark', label: c('Wordmark (name only)', 'الاسم بخط مميز'), keywords: ['wordmark', 'text logo', 'الاسم', 'كتابي'], visual: vis('logo-concept', 'wordmark', 'The name itself, drawn in one distinctive typeface. No symbol.', 'الاسم نفسه بخط مميز، من غير رمز.', 'minimal wordmark logo design, single distinctive custom typeface, black on white, flat vector, no symbol') },
        { value: 'lettermark', label: c('Lettermark (initials)', 'الحروف الأولى'), keywords: ['lettermark', 'monogram', 'initials', 'حروف', 'مونوجرام'], visual: vis('logo-concept', 'lettermark', 'One or two initials built into a clean, balanced mark.', 'حرف أو حرفين متصممين في علامة متوازنة ونضيفة.', 'lettermark monogram logo, two initials forming a balanced geometric mark, flat vector, black on white') },
        { value: 'geometric', label: c('Geometric symbol', 'رمز هندسي'), keywords: ['geometric', 'abstract', 'symbol', 'هندسي', 'رمز'], visual: vis('logo-concept', 'geometric', 'An abstract geometric mark built from simple shapes.', 'علامة مجردة مبنية من أشكال هندسية بسيطة.', 'abstract geometric logo mark, simple circles and lines, balanced negative space, flat vector, black on white') },
        { value: 'emblem', label: c('Emblem / badge', 'شعار دائري'), keywords: ['emblem', 'badge', 'crest', 'شعار', 'بادج'], visual: vis('logo-concept', 'emblem', 'A badge: the name inside a circular or shield container.', 'بادج: الاسم جوه دايرة أو درع.', 'emblem badge logo, name inside a circular container with a small icon, craft style, flat vector, black on white') },
        { value: 'mascot', label: c('Friendly mascot', 'شخصية مرحة'), keywords: ['mascot', 'character', 'شخصية', 'ماسكوت'], visual: vis('logo-concept', 'mascot', 'A simple friendly character used as the brand mark.', 'شخصية بسيطة ودودة كعلامة للبراند.', 'simple friendly mascot logo, minimal rounded character, two flat colours, vector, white background') },
      ],
      defaults: [{ value: 'wordmark', reason: c('A clean wordmark is the safest, most flexible logo.', 'الاسم بخط مميز أأمن وأكتر لوجو مرن.') }],
    },
  ],
  brandLabel: c('Brand name (exact spelling)', 'اسم البراند (بالحرف)'),
  brandQuestion: c('What is the brand name, exactly as it should be written on the logo?', 'اسم البراند إيه، بالحرف زي ما هيتكتب على اللوجو؟'),
  brandWhere: 'as the logo text itself',
  exactTextLabel: c('Tagline under the name', 'جملة تحت الاسم'),
  avoidVocab: { en: ['gradients', 'tiny details', 'other brands', 'clip-art look', 'too many colours'], ar: ['تدرّجات', 'تفاصيل دقيقة', 'براندات تانية', 'شكل كليب آرت', 'ألوان كتير'] },
  ratioByUsage: { 'app-icon': '1:1', 'web-print': '1:1', signage: '16:9', social: '1:1' }, ratioOptions: ['1:1', '16:9', '4:5'],
  referenceWhat: c('a logo style you like', 'ستايل لوجو عاجبك'), referenceLabel: c('Logo reference', 'مرجع لوجو'),
  outputDescription: c('A logo prompt, what to avoid, ready versions per tool, and a checklist.', 'برومبت لوجو، والممنوعات، ونسخ جاهزة لكل أداة، وقائمة فحص.'),
  role: 'Senior brand identity designer, and a prompt engineer for AI image tools.',
  understanding: [
    'subject gives the sector and the feeling; the logo must suit it at a glance. usage sets where it must still be legible (an app icon must work tiny).',
    'If reference = yes, variants start with how to follow the uploaded reference for style, not to copy it.',
  ],
  intelligence: [
    'Ask for a flat vector mark on a plain white background: simple shapes, balanced negative space, legible at 32 px, works in one colour. State the construction (what the mark is made of) rather than vague adjectives.',
    'Image tools misspell text: if brandName is given, instruct that the name is rendered exactly, and recommend Ideogram for text-accurate output.',
  ],
  controlExtra: [
    'Never include a real company\'s logo or a trademarked symbol. The mark must be original.',
    'The negative must exclude gradients, drop shadows, photographic detail, mockups and extra text.',
  ],
  maxWords: 90,
  examples: [{
    good: 'Flat vector wordmark logo reading "Beans", warm craft feel, single custom rounded serif, balanced letter spacing, solid black on plain white, legible at small sizes, no symbol, no gradient.',
    bad: 'A logo for a coffee shop like Starbucks with a 3D shiny gradient mermaid and the name BEENS, 1:1 Midjourney.',
    why: 'The bad one copies a real brand, misspells the name, asks for gradients that do not scale, and leaks the size and tool.',
  }],
});

export const packagingDesign = makeImageMission({
  id: 'packaging-design', title: c('Packaging', 'تغليف'), topics: ['packaging-design'],
  intake: { question: c('Tell me the product and the kind of packaging.', 'قولّي المنتج ونوع التغليف.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A coffee bag design', 'تصميم كيس قهوة'), c('A skincare box', 'علبة منتج عناية'), c('A label for a honey jar', 'ليبل لبرطمان عسل'), c('A pouch for snacks', 'باكت سناكس')] },
  slots: [
    subject(c('Product & package', 'المنتج والعبوة'), c('What is the product, and what package is it in?', 'المنتج إيه، وفي أنهي عبوة؟'), c('Single-origin coffee in a 250g stand-up bag.', 'قهوة سنجل أوريجن في كيس واقف ٢٥٠ جرام.'), { en: ['bag', 'box', 'jar label', 'pouch', 'bottle', 'tube', '250g', 'matte', 'glossy'], ar: ['كيس', 'علبة', 'ليبل برطمان', 'باكت', 'زجاجة', 'تيوب', '٢٥٠ جرام', 'مطفي', 'لامع'] }),
    usage([
      { value: 'shelf', label: c('Shop shelf', 'رف المحل'), keywords: ['shelf', 'shop', 'retail', 'رف', 'محل'] },
      { value: 'online', label: c('Online store photo', 'صورة متجر أونلاين'), keywords: ['online', 'store', 'أونلاين', 'متجر'] },
      { value: 'flat', label: c('Flat label artwork', 'ملف الليبل مسطّح'), keywords: ['flat', 'dieline', 'artwork', 'مسطح', 'ليبل'] },
    ], 'shelf', c('Packaging is judged on the shelf first.', 'التغليف بيتحكم عليه على الرف الأول.')),
    {
      id: 'style', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Style', 'الأسلوب'), question: c('What style should the packaging have?', 'التغليف يبقى بأنهي أسلوب؟'),
      why: c('Style sets colour, material and type.', 'الأسلوب بيحدد اللون والخامة والخط.'), example: c('Minimal premium.', 'بسيط وفخم.'),
      options: [
        { value: 'minimal-premium', label: c('Minimal premium', 'بسيط وفخم'), keywords: ['minimal', 'premium', 'بسيط', 'فخم'], visual: vis('packaging-design', 'minimal-premium', 'Off-white matte, small refined type, one accent, lots of empty space.', 'مطفي أوف وايت، وخط صغير راقي، ولمسة لون واحدة، ومساحات فاضية.', 'minimal premium packaging design, matte off-white bag, small refined serif type, single gold accent, generous empty space') },
        { value: 'bold-colour', label: c('Bold colour', 'ألوان جريئة'), keywords: ['bold', 'colourful', 'جريء', 'ملون'], visual: vis('packaging-design', 'bold-colour', 'Big colour blocks and large type that pop from the shelf.', 'بلوكات ألوان كبيرة وخط ضخم بيبان من على الرف.', 'bold colourful packaging, large colour blocks, oversized playful typography, high contrast, eye-catching on shelf') },
        { value: 'natural', label: c('Natural / eco', 'طبيعي / صديق للبيئة'), keywords: ['natural', 'eco', 'kraft', 'طبيعي', 'بيئي', 'كرافت'], visual: vis('packaging-design', 'natural', 'Kraft paper, earthy inks, botanical line art, honest and simple.', 'ورق كرافت، وألوان ترابية، ورسومات نباتية بسيطة.', 'eco natural packaging, kraft paper texture, earthy green ink, botanical line illustration, simple honest layout') },
        { value: 'luxury-dark', label: c('Dark luxury', 'غامق فخم'), keywords: ['luxury', 'dark', 'فخم', 'غامق'], visual: vis('packaging-design', 'luxury-dark', 'Deep matte black with gold foil details and thin elegant type.', 'إسود مطفي غامق مع تفاصيل دهبي وخط رفيع أنيق.', 'luxury dark packaging, deep matte black box with gold foil accents, thin elegant serif typography, premium feel') },
        { value: 'illustrated', label: c('Illustrated', 'مرسوم'), keywords: ['illustration', 'drawn', 'رسم', 'مرسوم'], visual: vis('packaging-design', 'illustrated', 'A custom illustration wraps the pack and tells its story.', 'رسمة خاصة بتلف العبوة وبتحكي قصتها.', 'illustrated packaging design, custom flat illustration wrapping the pack, limited warm palette, storybook feel') },
      ],
      defaults: [{ value: 'minimal-premium', reason: c('Minimal premium suits most products and photographs well.', 'البسيط الفخم بيناسب أغلب المنتجات وبيتصوّر حلو.') }],
    },
  ],
  brandLabel: c('Brand name on the pack', 'اسم البراند على العبوة'), brandWhere: 'as the brand name printed on the pack',
  exactTextLabel: c('Text on the pack', 'الكلام على العبوة'),
  avoidVocab: { en: ['other brands', 'fake certifications', 'unreadable small text', 'cluttered front'], ar: ['براندات تانية', 'شهادات متألفة', 'خط صغير مش مقروء', 'وش العبوة مزحوم'] },
  ratioByUsage: { shelf: '4:5', online: '1:1', flat: '1:1' }, ratioOptions: ['1:1', '4:5', '16:9'],
  referenceWhat: c('your product or a pack you like', 'منتجك أو عبوة عاجباك'), referenceLabel: c('Packaging reference', 'مرجع تغليف'),
  outputDescription: c('A packaging prompt, what to avoid, ready versions per tool, and a checklist.', 'برومبت تغليف، والممنوعات، ونسخ جاهزة لكل أداة، وقائمة فحص.'),
  role: 'Senior packaging designer, and a prompt engineer for AI image tools.',
  understanding: [
    'subject gives the product, the package format and size; keep the format exactly (a bag is not a box).',
    'usage decides whether to render the pack in a shelf/product shot or as flat label artwork.',
  ],
  intelligence: [
    'Turn style into material, finish, palette, type hierarchy and where the name, variant and weight sit on the front. Describe the pack as a physical object with its finish.',
    'Keep the front simple: brand, product, one differentiator. Legible from a metre away.',
  ],
  controlExtra: ['Never invent certifications, ingredients, weights or health claims — only what the user gave.'],
  examples: [{
    good: 'Matte off-white 250g stand-up coffee bag, small refined serif reading "Beans", one copper accent line, generous empty space, soft studio light, front-facing product shot.',
    bad: 'An organic certified premium coffee bag with 100% natural ISO badge and lots of awards, 1:1, Midjourney style.',
    why: 'The bad one invents certifications and awards and leaks the size and tool.',
  }],
});

export const illustrationMission = makeImageMission({
  id: 'illustration', title: c('Illustration', 'رسم توضيحي'), topics: ['illustration'],
  intake: { question: c('Tell me what you want illustrated and where it will be used.', 'قولّي عايز ترسم إيه، وهتستخدمه فين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('An illustration for my blog header', 'رسمة لهيدر المدونة'), c('A character for my app onboarding', 'شخصية لشاشات التعريف في تطبيقي'), c('An icon set for my website', 'مجموعة أيقونات لموقعي'), c('A scene for a children\'s story', 'مشهد لقصة أطفال')] },
  slots: [
    subject(c('What to illustrate', 'اللي هيترسم'), c('What should the illustration show?', 'الرسمة تعرض إيه؟'), c('A person working on a laptop in a cosy room.', 'شخص شغال على لابتوب في أوضة دافية.'), { en: ['a person', 'a scene', 'an object', 'a character', 'an icon set', 'abstract'], ar: ['شخص', 'مشهد', 'حاجة', 'شخصية', 'أيقونات', 'مجرد'] }),
    usage([
      { value: 'blog', label: c('Blog / article header', 'هيدر مقال'), keywords: ['blog', 'article', 'مقال', 'مدونة'] },
      { value: 'app', label: c('App / website graphic', 'جرافيك تطبيق أو موقع'), keywords: ['app', 'website', 'تطبيق', 'موقع'] },
      { value: 'social', label: c('Social post', 'بوست سوشيال'), keywords: ['social', 'post', 'سوشيال', 'بوست'] },
      { value: 'print', label: c('Print', 'طباعة'), keywords: ['print', 'طباعة'] },
    ], 'blog', c('Article headers are the most common use.', 'هيدر المقالات هو الاستخدام الأشهر.')),
    {
      id: 'style', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Illustration style', 'أسلوب الرسم'), question: c('Which illustration style?', 'أنهي أسلوب رسم؟'),
      why: c('Style is the whole character of the drawing.', 'الأسلوب هو شخصية الرسمة كلها.'), example: c('Flat vector.', 'فيكتور مسطّح.'),
      options: [
        { value: 'flat-vector', label: c('Flat vector', 'فيكتور مسطّح'), keywords: ['flat', 'vector', 'مسطح', 'فيكتور'], visual: vis('illustration', 'flat-vector', 'Clean flat shapes, limited palette, no shading — modern and tidy.', 'أشكال مسطّحة نضيفة، وألوان محدودة، من غير ظلال.', 'flat vector illustration, clean geometric shapes, limited 4 colour palette, no gradients, modern editorial style') },
        { value: 'line-art', label: c('Line art', 'خطوط'), keywords: ['line', 'outline', 'خطوط', 'لاين'], visual: vis('illustration', 'line-art', 'Single-weight outlines with one accent colour, airy and light.', 'خطوط بسمك واحد مع لون مميز واحد، خفيفة وواسعة.', 'line art illustration, single weight black outlines on white, one coral accent colour, airy minimal composition') },
        { value: '3d-render', label: c('3D render', 'ثري دي'), keywords: ['3d', 'render', 'ثري دي'], visual: vis('illustration', '3d-render', 'Soft rounded 3D objects with gentle light and pastel colours.', 'أشكال ثري دي ناعمة بإضاءة هادية وألوان باستيل.', 'soft 3D rendered illustration, rounded clay-like objects, pastel palette, gentle studio lighting, isometric view') },
        { value: 'watercolour', label: c('Watercolour', 'ألوان مائية'), keywords: ['watercolour', 'watercolor', 'painted', 'مائية', 'ألوان مائية'], visual: vis('illustration', 'watercolour', 'Soft painted washes with visible paper texture, warm and human.', 'ألوان مائية ناعمة وملمس ورق باين، دافية وإنسانية.', 'watercolour illustration, soft colour washes, visible paper texture, loose organic edges, warm palette') },
        { value: 'isometric', label: c('Isometric', 'أيزومتريك'), keywords: ['isometric', 'ايزومتريك'], visual: vis('illustration', 'isometric', 'A tidy 3/4 isometric scene, great for explaining systems.', 'مشهد أيزومتريك مرتب، ممتاز لشرح الأنظمة.', 'isometric illustration, 3/4 view miniature scene, flat colours with subtle shadows, technical and tidy') },
      ],
      defaults: [{ value: 'flat-vector', reason: c('Flat vector is the most versatile for web and articles.', 'الفيكتور المسطّح هو الأكتر مرونة للويب والمقالات.') }],
    },
  ],
  brandLabel: c('Brand name in the artwork', 'اسم البراند في الرسمة'), brandWhere: 'only if it belongs in the scene',
  exactTextLabel: c('Words in the artwork', 'كلام في الرسمة'),
  avoidVocab: { en: ['copyrighted characters', 'photorealism', 'extra limbs', 'cluttered background', 'text artefacts'], ar: ['شخصيات محمية', 'واقعية فوتوغرافية', 'أطراف زيادة', 'خلفية مزحومة', 'كتابة مشوّهة'] },
  ratioByUsage: { blog: '16:9', app: '1:1', social: '4:5', print: '2:3' }, ratioOptions: ['16:9', '1:1', '4:5', '2:3'],
  referenceWhat: c('an illustration style you like', 'أسلوب رسم عاجبك'), referenceLabel: c('Style reference', 'مرجع أسلوب'),
  outputDescription: c('An illustration prompt, what to avoid, ready versions per tool, and a checklist.', 'برومبت رسم، والممنوعات، ونسخ جاهزة لكل أداة، وقائمة فحص.'),
  role: 'Senior editorial illustrator and art director, and a prompt engineer for AI image tools.',
  understanding: ['subject is the scene or object; usage sets the shape and how much detail survives at that size.', 'If reference = yes, variants start with how to follow the uploaded style reference.'],
  intelligence: [
    'Turn style into line weight, shading, palette (name 3–4 colours), composition and background treatment. Say what fills the frame and what stays empty.',
    'Keep one clear subject; backgrounds support, never compete. For icon sets, specify a consistent grid and stroke.',
  ],
  controlExtra: ['Never depict a copyrighted or trademarked character, mascot or brand figure. The illustration must be original.'],
  examples: [{
    good: 'Flat vector illustration of a person working on a laptop in a cosy room, limited palette of warm sand, deep teal and off-white, no gradients, simple shapes, plenty of empty space around the figure.',
    bad: 'An illustration of Mickey Mouse style character working, photorealistic 3D, 16:9, Midjourney, with text "WORK HARD".',
    why: 'The bad one asks for a protected character, contradicts its own style, invents text, and leaks the size and tool.',
  }],
});

export const photoRetouch = makeImageMission({
  id: 'photo-retouch', title: c('Edit a photo', 'تعديل صورة'), topics: ['photo-retouch'],
  intake: { question: c('Tell me what you want changed in the photo.', 'قولّي عايز تغيّر إيه في الصورة.'), why: c('Upload the photo and I will build the edit instruction from it.', 'ارفع الصورة وأنا هبني تعليمات التعديل منها.'),
    starters: [c('Remove the background', 'شيل الخلفية'), c('Make the lighting look professional', 'خلي الإضاءة احترافية'), c('Remove an object from the photo', 'شيل حاجة من الصورة'), c('Change the background to a studio', 'غيّر الخلفية لستوديو')] },
  slots: [
    subject(c('What to change', 'اللي هيتغيّر'), c('What should change, and what must stay exactly the same?', 'إيه اللي يتغيّر، وإيه اللي لازم يفضل زي ما هو بالظبط؟'), c('Remove the cluttered background; keep the product exactly as is.', 'شيل الخلفية المزحومة؛ وخلي المنتج زي ما هو بالظبط.'), { en: ['remove background', 'remove an object', 'brighten', 'fix colours', 'sharpen', 'change background', 'keep the product unchanged'], ar: ['شيل الخلفية', 'شيل حاجة', 'نوّر الصورة', 'ظبط الألوان', 'زوّد الوضوح', 'غيّر الخلفية', 'خلي المنتج زي ما هو'] }),
    usage([
      { value: 'listing', label: c('Store listing', 'صفحة منتج في متجر'), keywords: ['amazon', 'store', 'listing', 'متجر', 'أمازون'] },
      { value: 'social', label: c('Social post', 'بوست سوشيال'), keywords: ['social', 'post', 'سوشيال'] },
      { value: 'print', label: c('Print', 'طباعة'), keywords: ['print', 'طباعة'] },
      { value: 'web', label: c('Website', 'موقع'), keywords: ['website', 'web', 'موقع'] },
    ], 'listing', c('Most edits are for store listings.', 'أغلب التعديلات بتبقى لصفحات المنتجات.')),
    {
      id: 'style', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Result look', 'شكل النتيجة'), question: c('How should the edited photo look?', 'الصورة بعد التعديل تبقى شكلها إيه؟'),
      why: c('This sets the lighting and background of the result.', 'ده بيحدد إضاءة وخلفية النتيجة.'), example: c('Clean white studio.', 'ستوديو أبيض نضيف.'),
      options: [
        { value: 'white-studio', label: c('Clean white studio', 'ستوديو أبيض نضيف'), keywords: ['white', 'studio', 'أبيض', 'ستوديو'], visual: vis('photo-retouch', 'white-studio', 'Pure white background, soft even light, a gentle shadow under the subject.', 'خلفية بيضا، ونور ناعم متساوي، وضل خفيف تحت المنتج.', 'product photo on pure white seamless background, soft even studio light, subtle contact shadow, e-commerce ready') },
        { value: 'natural-clean', label: c('Natural, just cleaner', 'طبيعي بس أنضف'), keywords: ['natural', 'clean', 'طبيعي', 'أنضف'], visual: vis('photo-retouch', 'natural-clean', 'Keeps the original scene; only tidier, brighter and sharper.', 'بيحافظ على المشهد الأصلي، بس أنضف وأنور وأوضح.', 'lightly retouched photo, same natural scene, cleaned up and brightened, natural colours, no heavy editing') },
        { value: 'colour-graded', label: c('Cinematic colour', 'ألوان سينمائية'), keywords: ['cinematic', 'grade', 'سينمائي', 'ألوان'], visual: vis('photo-retouch', 'colour-graded', 'A film-like colour grade with richer contrast and mood.', 'تدرّج ألوان سينمائي بتباين وإحساس أغنى.', 'cinematic colour graded photo, teal and warm highlights, rich contrast, filmic mood, natural skin tones') },
        { value: 'lifestyle-bg', label: c('New lifestyle background', 'خلفية جديدة واقعية'), keywords: ['background', 'lifestyle', 'خلفية', 'لايف ستايل'], visual: vis('photo-retouch', 'lifestyle-bg', 'The subject is placed in a realistic new setting with matching light.', 'المنتج بيتحط في مكان جديد واقعي بنور متطابق.', 'product composited into a realistic lifestyle setting, matching light direction and shadows, seamless and believable') },
      ],
      defaults: [{ value: 'white-studio', reason: c('A clean white result works almost everywhere.', 'النتيجة البيضا النضيفة بتنفع في كل مكان تقريباً.') }],
    },
  ],
  brandLabel: c('Brand name in the photo', 'اسم البراند في الصورة'), brandWhere: 'only as the label already on the product',
  exactTextLabel: c('Words to add', 'كلام يتضاف'),
  avoidVocab: { en: ['changing the product shape', 'plastic skin', 'fake reflections', 'warped logo', 'over-sharpening'], ar: ['تغيير شكل المنتج', 'بشرة بلاستيك', 'انعكاسات مزيّفة', 'لوجو متشوّه', 'وضوح مبالغ'] },
  ratioByUsage: { listing: '1:1', social: '4:5', print: '2:3', web: '16:9' }, ratioOptions: ['1:1', '4:5', '16:9', '2:3', '9:16'],
  referenceWhat: c('the photo you want edited', 'الصورة اللي عايز تعدّلها'), referenceLabel: c('Your photo', 'صورتك'), referenceRequired: true,
  outputDescription: c('An edit instruction, what to preserve, ready versions per tool, and a checklist.', 'تعليمات تعديل، واللي لازم يتحافظ عليه، ونسخ جاهزة لكل أداة، وقائمة فحص.'),
  role: 'Senior retoucher, and a prompt engineer for AI image editing tools.',
  understanding: [
    'This is an edit of the user\'s uploaded photo, not a new image. subject says what changes and what must be preserved exactly.',
    'Every variant must begin by referring to the uploaded photo as the source and must list what to keep unchanged (product shape, label, colours, proportions).',
  ],
  intelligence: [
    'Turn style into the target lighting, background and colour of the result, while preserving the subject. Describe the edit as an instruction ("remove…", "replace the background with…", "match the light direction"), not as a new scene.',
    'Keep shadows and reflections physically consistent with the new background.',
  ],
  controlExtra: ['Never alter the product\'s shape, label text or colours. Never add text that is not in exactText.'],
  deliveryExtra: ['Each variant is written for image-to-image editing: reference the uploaded photo first, then the change, then what to preserve.'],
  examples: [{
    good: 'Using the uploaded photo: remove the background and place the product on a pure white seamless backdrop with soft even light and a subtle contact shadow. Keep the bottle shape, label text and colours exactly unchanged.',
    bad: 'Create a beautiful new perfume bottle on white, 1:1, Midjourney, make the label nicer and the shape more elegant.',
    why: 'The bad one generates a new product instead of editing, changes the label and shape, and leaks the size and tool.',
  }],
});

/** Brand identity is a direction brief, not a single image, so it is a text deliverable. */
export const brandIdentity = makeTextMission({
  id: 'brand-identity', title: c('Brand identity', 'الهوية البصرية'), topics: ['brand-identity'],
  intake: { question: c('Tell me about the brand and the feeling you want it to give.', 'احكيلي عن البراند، والإحساس اللي عايزه يدّيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Identity for a new coffee brand', 'هوية لبراند قهوة جديد'), c('Rebrand my clinic to feel modern', 'أجدّد هوية عيادتي تبقى عصرية'), c('Identity for a kids app', 'هوية لتطبيق أطفال'), c('A premium identity for my fashion label', 'هوية فخمة لبراند الأزياء بتاعي')] },
  slots: [
    { id: 'brandWhat', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1000,
      label: c('Brand & audience', 'البراند والجمهور'), question: c('What does the brand do, and who is it for?', 'البراند بيعمل إيه، ولمين؟'),
      why: c('The identity is built on this.', 'الهوية هتتبني على ده.'), example: c('A specialty coffee roastery for young professionals.', 'محمصة قهوة مختصة لشباب بيشتغلوا.'),
      vocabulary: { en: ['coffee', 'clinic', 'tech', 'fashion', 'kids', 'for young professionals', 'premium', 'affordable'], ar: ['قهوة', 'عيادة', 'تقنية', 'أزياء', 'أطفال', 'لشباب بيشتغلوا', 'فاخر', 'في المتناول'] } },
    { id: 'personality', kind: 'multi', layer: 'intelligence', importance: 'important',
      label: c('Brand personality', 'شخصية البراند'), question: c('How should the brand feel?', 'البراند يدّي إحساس إيه؟'),
      why: c('Personality drives colour, type and voice together.', 'الشخصية بتحدد اللون والخط والصوت مع بعض.'), example: c('Warm and crafted.', 'دافي وحرفي.'),
      options: [
        { value: 'warm', label: c('Warm & human', 'دافي وإنساني') }, { value: 'premium', label: c('Premium & elegant', 'فخم وأنيق') },
        { value: 'bold', label: c('Bold & energetic', 'جريء وحماسي') }, { value: 'calm', label: c('Calm & trustworthy', 'هادي وبيدّي ثقة') },
        { value: 'playful', label: c('Playful & fun', 'مرح وخفيف') }, { value: 'technical', label: c('Precise & technical', 'دقيق وتقني') },
      ],
      defaults: [{ value: ['warm', 'premium'], reason: c('Warm plus premium suits most consumer brands.', 'الدافي مع الفخم بيناسب أغلب البراندات الاستهلاكية.') }] },
  ],
  nameLabel: c('Brand name', 'اسم البراند'), nameWhat: 'the brand name',
  avoidVocab: { en: ['copying a known brand', 'too many colours', 'trendy fonts that date fast', 'vague mood words'], ar: ['تقليد براند معروف', 'ألوان كتير', 'خطوط موضة بتقدم بسرعة', 'كلام مزاجي غامض'] },
  outlineKey: 'identityOutline', outlineDesc: 'One line per identity element: element — the direction for it.', outlineWhat: 'one line per identity element',
  outputDescription: c('A layered prompt for a chat AI, the identity elements, what to decide, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وعناصر الهوية، واللي محتاج تقرره، وقائمة فحص.'),
  role: 'Senior brand identity director, and a prompt engineer for chat AIs.',
  understanding: ['brandWhat gives the sector and audience; personality is the feeling the identity must carry. Keep the name exactly as given.', 'sections.goal states the brand, the audience, and that we want a usable identity direction.'],
  intelligence: [
    'Cover: logo direction, colour palette (named roles: primary, accent, neutrals, with hex), typography (heading and body with real, available typefaces), imagery style, graphic elements, and brand voice with 2–3 example lines.',
    'sections.approach tells the AI to tie every choice to the personality and to keep the palette to 4–5 colours and 2 typefaces.',
  ],
  controlExtra: ['Never imitate a known brand\'s identity or suggest a trademarked logo. Typeface suggestions must be real and licensable (say if a free alternative exists).'],
  examples: [{
    good: 'Primary: deep espresso #2B1B14. Accent: copper #B5713F. Headings: a warm humanist serif; body: a clean grotesque. Voice: plain, warm, never salesy — e.g. "Roasted this week, not last month."',
    bad: 'Make it look like Starbucks but different, use all the trending colours and the font from Nike, very premium luxury modern.',
    why: 'The bad one imitates known brands, names a trademarked font, and gives no concrete palette or voice.',
  }],
});

export const designBlueprints = [socialPostDesign, posterDesign, logoConcept, packagingDesign, illustrationMission, photoRetouch, brandIdentity];
