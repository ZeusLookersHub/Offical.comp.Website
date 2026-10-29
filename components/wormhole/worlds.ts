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
export const worlds = recoveredWorlds.map(world => ({ ...world, tasks: [...world.tasks, ...additions[world.id]] }));

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
};
export function missionSelection(worldId: string, name: string) {
  if (!worlds.find(w => w.id === worldId)?.tasks.some(t => t[0] === name)) throw new Error('Unknown mission');
  const topicId = missionTopics[name], topic = resolveTopic(topicId);
  if (!topic) throw new Error('Unregistered mission');
  const taskType: TaskType = topic.family.startsWith('visual-') ? 'image' : topic.family === 'presentation' ? 'presentation' : topic.family === 'marketing' ? 'campaign' : 'general';
  return { taskType, answers: { topicId, contentType: topic.family === 'video' ? 'video' : '', taskDescription: name, _taskSuggestion: name } };
}
