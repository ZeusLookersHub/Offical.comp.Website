// Recovered source content; identifiers remain compatible with the adaptive chat.
export const worlds = [
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
