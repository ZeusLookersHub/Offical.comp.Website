import type { TaskType } from '../../data/lookersAi';
import { resolveTopic } from '../../services/lookersAiTopicRegistry';
// Recovered source content; identifiers remain compatible with the adaptive chat.
const recoveredWorlds = [
  {
    id: "design",
    num: "01",
    en: "Design",
    ar: "التصميم",
    subEn: "Visuals & Branding",
    subAr: "المرئيات والهوية",
    glow: "rgba(255,170,80,.8)",
    ring: 2.132,
    tasks: [
      [
        "Brand Identity",
        "الهوية البصرية",
        "Logo, colours and brand voice",
        "لوجو وألوان وصوت البراند",
      ],
      [
        "UI / UX",
        "تصميم الواجهات",
        "Screens and user journeys",
        "شاشات ورحلة المستخدم",
      ],
      [
        "Social Design",
        "تصميم السوشيال",
        "Posts, stories and covers",
        "بوستات وستوريز وأغلفة",
      ],
      [
        "Motion Design",
        "الموشن",
        "Animated logos and short videos",
        "لوجو متحرك وفيديوهات قصيرة",
      ],
    ],
  },
  {
    id: "business",
    num: "03",
    en: "Business",
    ar: "الأعمال",
    subEn: "Plans & Growth",
    subAr: "خطط ونمو",
    glow: "rgba(233,195,138,.6)",
    ring: 2.236,
    tasks: [
      [
        "Business Plan",
        "خطة عمل",
        "Model, costs and growth",
        "النموذج والتكاليف والنمو",
      ],
      [
        "Company Profile",
        "ملف شركة",
        "Who you are, page by page",
        "تعريف شركتك صفحة بصفحة",
      ],
      [
        "Pitch Deck",
        "عرض استثماري",
        "The story investors hear",
        "القصة اللي هيسمعها المستثمر",
      ],
      [
        "Strategy",
        "استراتيجية",
        "Goals, priorities and next moves",
        "أهداف وأولويات وخطوات جاية",
      ],
    ],
  },
  {
    id: "technology",
    num: "05",
    en: "Technology",
    ar: "التكنولوجيا",
    subEn: "Web, Apps & AI",
    subAr: "ويب وتطبيقات وذكاء اصطناعي",
    glow: "rgba(90,230,200,.7)",
    ring: 2.028,
    tasks: [
      [
        "Website",
        "موقع إلكتروني",
        "Pages, sections and copy",
        "صفحات وأقسام ونصوص",
      ],
      ["Mobile App", "تطبيق موبايل", "Features and screens", "مميزات وشاشات"],
      [
        "AI Agent",
        "وكيل ذكاء اصطناعي",
        "What it does and how it decides",
        "بيعمل إيه وبيقرر إزاي",
      ],
      [
        "Automation",
        "أتمتة",
        "Workflows that run themselves",
        "خطوات شغل بتمشي لوحدها",
      ],
    ],
  },
  {
    id: "presentations",
    num: "04",
    en: "Presentations",
    ar: "العروض التقديمية",
    subEn: "Ideas that Impact",
    subAr: "أفكار تترك أثر",
    glow: "rgba(185,140,255,.75)",
    ring: 2.392,
    tasks: [
      [
        "Pitch Deck",
        "عرض استثماري",
        "Slide by slide, ready to present",
        "شريحة بشريحة وجاهز للعرض",
      ],
      [
        "Business Review",
        "مراجعة أعمال",
        "Results, numbers and lessons",
        "نتايج وأرقام ودروس",
      ],
      [
        "Training Slides",
        "شرائح تدريبية",
        "Lessons your team can follow",
        "دروس يقدر فريقك يتابعها",
      ],
      [
        "Product Launch",
        "إطلاق منتج",
        "Announce it with impact",
        "أعلن عن منتجك بقوة",
      ],
    ],
  },
  {
    id: "marketing",
    num: "02",
    en: "Marketing",
    ar: "التسويق",
    subEn: "Ideas to Audiences",
    subAr: "من الفكرة للجمهور",
    glow: "rgba(90,170,255,.75)",
    ring: 1.82,
    tasks: [
      [
        "Campaign",
        "حملة إعلانية",
        "Ad idea, copy and channels",
        "فكرة الإعلان والنصوص والقنوات",
      ],
      [
        "Content Strategy",
        "استراتيجية المحتوى",
        "A month of planned content",
        "خطة محتوى لشهر كامل",
      ],
      [
        "Social Media",
        "السوشيال ميديا",
        "Captions, hooks and a posting plan",
        "كابشن وهوكس وجدول نشر",
      ],
      [
        "Market Research",
        "أبحاث السوق",
        "Audience, competitors and gaps",
        "الجمهور والمنافسين والفرص",
      ],
    ],
  },
];
export type World = (typeof worlds)[number];
export const asset = (name: string) =>
  new URL(
    `../../source-handoff/lookers-ai-wormhole/space/${name}`,
    import.meta.url,
  ).href;

// Eight reachable missions per world. Each orbit shows four readable targets.
const additions: Record<string, string[][]> = {
  design: [
    ['Product Photo','تصوير منتج','Lighting, framing and materials','إضاءة وكادر وخامات'],
    ['Edit a Photo','تعديل صورة','Change only what you choose','عدّل اللي تحدده وحافظ على الباقي'],
    ['Packaging','تصميم عبوة','Packaging that fits your product','عبوة تناسب منتجك'],
    ['Illustration','رسم وتوضيح','Characters and illustrated scenes','شخصيات ومشاهد مرسومة'],
  ],
  marketing: [
    ['Ad Copy','نصوص إعلانات','Hooks, benefits and a clear action','هوك ومميزات وخطوة للعميل'],
    ['Email Campaign','حملة إيميلات','Messages and a sending plan','رسايل وخطة إرسال'],
    ['SEO Plan','خطة ظهور في البحث','Search intent, pages and keywords','نية البحث والصفحات والكلمات'],
    ['Product Video','فيديو منتج','A storyboard and generation prompt','مشاهد وبرومبت للفيديو'],
  ],
  business: [
    ['Feasibility','دراسة جدوى','Costs, assumptions and viability','تكاليف وافتراضات وفرص النجاح'],
    ['Pricing','تسعير','Costs, value and pricing options','تكلفة وقيمة واختيارات سعر'],
    ['Competitors','تحليل منافسين','Compare offers and positioning','قارن العروض ومكانك في السوق'],
    ['Data Analysis','تحليل بيانات','Questions, sources and findings','أسئلة ومصادر ونتايج'],
  ],
  technology: [
    ['Landing Page','صفحة هبوط','One offer and one clear action','عرض واحد وخطوة واضحة'],
    ['API Integration','ربط أنظمة','Inputs, outputs and failures','مدخلات ومخرجات وأخطاء'],
    ['Debugging','إصلاح مشكلة','Reproduce and isolate the fault','نكرر المشكلة ونعرف سببها'],
    ['Dashboard','داشبورد','Decisions, metrics and data','قرارات ومؤشرات وداتا'],
  ],
  presentations: [
    ['Sales Deck','عرض بيع','Benefits, proof and next steps','مميزات وأدلة وخطوة جاية'],
    ['Company Deck','عرض تعريفي','Your company, services and proof','شركتك وخدماتك وأدلة شغلك'],
    ['Project Proposal','عرض مشروع','Scope, schedule and cost','نطاق ومواعيد وتكلفة'],
    ['Data Story','عرض بيانات','Numbers that tell a clear story','أرقام بتحكي قصة واضحة'],
  ],
};

// Every built mission gets a door. The orbit shows four at a time, so a world can hold
// as many rings as it needs; the ring selector is generated from the count.
const moreMissions: Record<string, string[][]> = {
  design: [
    ['Poster','بوستر','Print and event posters','بوسترات طباعة وفعاليات'],
    ['Logo Concept','فكرة لوجو','A mark built to scale down','علامة مبنية تصغر وتفضل واضحة'],
    ['Product Video','فيديو منتج','A short clip with a shot plan','فيديو قصير بخطة لقطات'],
    ['Voiceover','تعليق صوتي','A script written to the second','سكريبت مكتوب على الثانية'],
    ['Music','موسيقى','A track brief, not a copy','بريف تراك أصلي مش تقليد'],
    ['Sound Effects','مؤثرات صوتية','Sounds that match the picture','أصوات مطابقة للصورة'],
    ['Podcast','بودكاست','Segments, timing and questions','مقاطع وتوقيت وأسئلة'],
  ],
  marketing: [
    ['Marketing Strategy','استراتيجية تسويق','One goal, the fewest channels','هدف واحد وأقل قنوات'],
    ['Paid Ads','إعلانات ممولة','Structure, angles and kill rules','هيكل وزوايا وقواعد إيقاف'],
    ['Influencer Brief','بريف مؤثرين','Direction, not a script','توجيه مش سكريبت'],
    ['Conversion Funnel','مسار التحويل','Fix the step that loses them','ظبّط الخطوة اللي بتخسرهم'],
    ['Social Caption','كابشن سوشيال','A hook that earns the first line','هوك يكسب أول سطر'],
    ['Blog Article','مقال','Structure, depth and sources','هيكل وعمق ومصادر'],
    ['Website Copy','نصوص موقع','Section by section','قسم ورا قسم'],
    ['Product Description','وصف منتج','Specs turned into reasons','مواصفات بتتحوّل لأسباب'],
    ['Video Script','سكريبت فيديو','Hook, beats and call to action','هوك ومقاطع ودعوة للتنفيذ'],
    ['Press Release','بيان صحفي','What an editor can run','اللي المحرر يقدر ينشره'],
    ['Email','إيميل','One ask, nothing else','طلب واحد وبس'],
    ['Rewrite','إعادة صياغة','Your meaning, tighter','معناك بس أنضف'],
  ],
  business: [
    ['Business Model','نموذج العمل','How the money actually works','الفلوس بتمشي إزاي فعلاً'],
    ['SWOT','تحليل SWOT','Honest, with evidence','صريح وبأدلة'],
    ['Go to Market','دخول السوق','First customers, first channel','أول عملاء وأول قناة'],
    ['Financial Plan','خطة مالية','Costs, runway and the break-even','تكاليف ومدة وتعادل'],
    ['Brand Positioning','تموضع البراند','One claim you can defend','جملة واحدة تقدر تدافع عنها'],
    ['Audience Research','بحث جمهور','Behaviour, not stereotypes','سلوك مش أحكام'],
    ['Deep Research','بحث متعمق','Sourced, staged, and honest about gaps','بمصادر ومراحل ويقول الناقص'],
    ['Fact Check','تحقق من معلومة','Traced to the first source','متبّع لأول مصدر'],
    ['Compare Options','مقارنة اختيارات','Your criteria, total cost','معاييرك والتكلفة الكاملة'],
    ['CV','السيرة الذاتية','Built only from your real experience','مبني على خبرتك الحقيقية بس'],
    ['Cover Letter','خطاب تقديم','About them, then your proof','عنهم الأول وبعدها دليلك'],
    ['LinkedIn Profile','بروفايل لينكد إن','Found in search, read by a human','يظهر في البحث ويتقري'],
    ['Improve My CV','ظبّط الـ CV','Your dates stay your dates','تواريخك تفضل زي ما هي'],
  ],
  presentations: [
    ['Strategy Deck','عرض استراتيجية','Recommendation first, then options','التوصية الأول وبعدها البدائل'],
    ['Improve My Deck','ظبّط العرض','Keep, merge, cut — with reasons','خلّي، دمج، شيل — بأسباب'],
  ],
  technology: [
    ['Web App','تطبيق ويب','The smallest version that works','أصغر نسخة شغالة'],
    ['Database Design','قاعدة بيانات','Designed from the questions it answers','مصممة من أسئلتها'],
    ['AI Assistant','مساعد AI دايم','Installed once, replies all day','يتحط مرة ويرد طول اليوم'],
    ['Plan Sheet','شيت خطة','Steps, owners, dates, formulas','خطوات ومسؤولين وتواريخ ومعادلات'],
    ['Organise My Data','نظّم الداتا','One table per thing, built to answer','جدول لكل حاجة ومبني يجاوب'],
    ['Dashboard','داشبورد','Answers at a glance, with comparisons','إجابات من نظرة ومعاها مقارنات'],
  ],
};

export const worlds = recoveredWorlds.map(world => ({
  ...world,
  tasks: [...world.tasks, ...additions[world.id], ...(moreMissions[world.id] ?? [])],
}));

const missionTopics: Record<string,string> = {
  'Brand Identity':'brand-identity', 'UI / UX':'ui-ux', 'Social Design':'social-post-design', 'Motion Design':'motion-graphics',
  'Business Plan':'business-plan', 'Company Profile':'company-profile', 'Pitch Deck':'investor-pitch', Strategy:'growth-strategy',
  Website:'website', 'Mobile App':'mobile-app', 'AI Agent':'ai-agent', Automation:'workflow-automation',
  'Business Review':'quarterly-review', 'Training Slides':'training-deck', 'Product Launch':'product-launch-deck',
  Campaign:'launch-campaign', 'Content Strategy':'content-calendar', 'Social Media':'social-media-strategy', 'Market Research':'market-research',
  'Product Photo':'product-photography', 'Edit a Photo':'photo-retouch', Packaging:'packaging-design', Illustration:'illustration',
  'Ad Copy':'ad-copy', 'Email Campaign':'email-marketing', 'SEO Plan':'seo-plan', 'Product Video':'product-commercial',
  Feasibility:'feasibility-study', Pricing:'pricing-strategy', Competitors:'competitor-analysis', 'Data Analysis':'data-analysis',
  'Landing Page':'landing-page', 'API Integration':'api-integration', Debugging:'debugging', Dashboard:'dashboard-design',
  'Sales Deck':'sales-deck', 'Company Deck':'company-profile', 'Project Proposal':'project-proposal', 'Data Story':'data-storytelling',
  'Poster':'poster-design', 'Logo Concept':'logo-concept', 'Voiceover':'voiceover', 'Music':'music-generation',
  'Sound Effects':'sound-effects', 'Podcast':'podcast',
  'Marketing Strategy':'marketing-strategy', 'Paid Ads':'paid-ads', 'Influencer Brief':'influencer-brief',
  'Conversion Funnel':'conversion-funnel', 'Social Caption':'social-caption', 'Blog Article':'blog-article',
  'Website Copy':'website-copy', 'Product Description':'product-description', 'Video Script':'script-writing',
  'Press Release':'press-release', 'Email':'email-draft', 'Rewrite':'rewrite',
  'Business Model':'business-model', 'SWOT':'swot-analysis', 'Go to Market':'go-to-market',
  'Financial Plan':'financial-plan', 'Brand Positioning':'brand-positioning', 'Audience Research':'audience-research',
  'Deep Research':'deep-research', 'Fact Check':'fact-checking', 'Compare Options':'product-comparison',
  'CV':'cv-resume', 'Cover Letter':'cover-letter', 'LinkedIn Profile':'linkedin-profile', 'Improve My CV':'cv-improve',
  'Strategy Deck':'strategy-deck', 'Improve My Deck':'deck-improve',
  'Web App':'web-app', 'Database Design':'database-design', 'AI Assistant':'ai-operator',
  'Plan Sheet':'project-plan', 'Organise My Data':'data-cleaning',
};
export function missionSelection(worldId: string, name: string) {
  if (!worlds.find(w => w.id === worldId)?.tasks.some(t => t[0] === name)) throw new Error('Unknown mission');
  const topicId = missionTopics[name], topic = resolveTopic(topicId);
  if (!topic) throw new Error('Unregistered mission');
  const taskType: TaskType = topic.family.startsWith('visual-') ? 'image' : topic.family === 'presentation' ? 'presentation' : topic.family === 'marketing' ? 'campaign' : 'general';
  return { taskType, answers: { topicId, contentType: topic.family === 'video' ? 'video' : '', taskDescription: name, _taskSuggestion: name } };
}
