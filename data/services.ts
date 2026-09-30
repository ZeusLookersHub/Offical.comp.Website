export type Bilingual = { en: string; ar: string };

export type PortfolioProject = {
  id: string;
  title: string;
  subtitle: Bilingual;
  description: Bilingual;
  image: string;
  tag: Bilingual;
};

export type ServiceId = 'app' | 'strategy' | 'operations' | 'marketing';
export type MarketingTabId = 'branding' | 'digital' | 'media' | 'work';

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'pick',
    title: 'Pick.',
    subtitle: { en: 'Operational Intelligence Platform', ar: 'منصة ذكاء العمليات' },
    description: {
      en: 'LookersHub’s product designed to bring digital observability and performance monitoring into one cohesive experience.',
      ar: 'منتج لوكرز هب المصمم لجمع المراقبة الرقمية وتتبع الأداء في تجربة واحدة متكاملة.'
    },
    image: '/images/service-strategy.png',
    tag: { en: 'Proprietary Product', ar: 'منتج خاص بلوكرز هب' }
  },
  {
    id: 'aero',
    title: 'Aero Runner',
    subtitle: { en: 'High-Speed Mobile Game', ar: 'لعبة موبايل عالية السرعة' },
    description: {
      en: 'An in-house mobile game demonstrating LookersHub’s work in real-time engine optimization and immersive user experience.',
      ar: 'لعبة موبايل طوّرها فريق لوكرز هب وتُظهر عملنا على تحسين المحركات وتجربة لعب غامرة.'
    },
    image: '/images/service-operations.png',
    tag: { en: 'In-House Studio', ar: 'من إنتاج استوديو لوكرز هب' }
  }
];

export const services = [
  {
    id: 'app' as const,
    title: { en: 'App & Game Development', ar: 'تطوير التطبيقات والألعاب' },
    description: {
      en: 'We design and develop mobile applications and games, from idea through launch.',
      ar: 'نصمم ونطوّر تطبيقات وألعاب الهاتف، من الفكرة وحتى الإطلاق.'
    },
    image: null,
    imageAlt: { en: 'Digital product development', ar: 'تطوير المنتجات الرقمية' },
    icon: 'app'
  },
  {
    id: 'strategy' as const,
    title: { en: 'Strategy & Planning', ar: 'الاستراتيجية والتخطيط' },
    description: {
      en: 'We help define product vision, technical direction, and a clear execution roadmap.',
      ar: 'نساعد على تحديد رؤية المنتج وتوجهه التقني وخارطة طريق واضحة للتنفيذ.'
    },
    image: '/images/service-strategy.png',
    imageAlt: { en: 'Strategy and planning', ar: 'الاستراتيجية والتخطيط' },
    icon: 'strategy'
  },
  {
    id: 'operations' as const,
    title: { en: 'Operations & Systems', ar: 'العمليات والأنظمة' },
    description: {
      en: 'We build scalable systems, internal tools, and workflows that support growth.',
      ar: 'نبني أنظمة قابلة للتوسع وأدوات داخلية وسير عمل يدعم النمو.'
    },
    image: '/images/service-operations.png',
    imageAlt: { en: 'Operations and systems', ar: 'العمليات والأنظمة' },
    icon: 'operations'
  },
  {
    id: 'marketing' as const,
    title: { en: 'Marketing & Growth', ar: 'التسويق والنمو' },
    description: {
      en: 'We shape brand and digital marketing work around clear strategy, thoughtful execution, and sustainable growth.',
      ar: 'نبني أعمال العلامة التجارية والتسويق الرقمي على استراتيجية واضحة وتنفيذ مدروس ونمو مستدام.'
    },
    image: '/images/service-marketing.png',
    imageAlt: { en: 'Marketing and growth', ar: 'التسويق والنمو' },
    icon: 'marketing'
  }
];

export const marketingTabs: { id: MarketingTabId; title: Bilingual; shortTitle: Bilingual }[] = [
  { id: 'branding', title: { en: 'Branding', ar: 'العلامة التجارية' }, shortTitle: { en: 'Branding', ar: 'الهوية' } },
  { id: 'digital', title: { en: 'Digital Marketing', ar: 'التسويق الرقمي' }, shortTitle: { en: 'Digital Marketing', ar: 'التسويق الرقمي' } },
  { id: 'media', title: { en: 'Media Buying', ar: 'إدارة الإعلانات' }, shortTitle: { en: 'Media Buying', ar: 'الإعلانات' } },
  { id: 'work', title: { en: 'Our Clients / Our Work', ar: 'أعمالنا ومشاريعنا' }, shortTitle: { en: 'Our Work', ar: 'أعمالنا' } }
];

export const marketingDetails: Record<Exclude<MarketingTabId, 'work'>, {
  intro: Bilingual;
  heading: Bilingual;
  description: Bilingual;
  deliverables: Bilingual[];
  icon: string;
}> = {
  branding: {
    intro: { en: 'Branding', ar: 'العلامة التجارية' },
    heading: { en: 'Build a brand people recognize.', ar: 'نبني علامة يسهل تمييزها.' },
    description: {
      en: 'We shape a clear brand foundation and a consistent visual identity that reflects your business and speaks to the people you want to reach.',
      ar: 'نرسم أساسًا واضحًا للعلامة وهوية بصرية متسقة تعبّر عن نشاطك وتتحدث إلى الجمهور الذي تريد الوصول إليه.'
    },
    deliverables: [
      { en: 'Brand strategy and positioning', ar: 'استراتيجية العلامة وموقعها في السوق' },
      { en: 'Visual identity direction', ar: 'التوجه البصري للهوية' },
      { en: 'Logo design', ar: 'تصميم الشعار' },
      { en: 'Brand identity guide', ar: 'دليل الهوية البصرية' },
      { en: 'Brand collateral and applications', ar: 'المواد والتطبيقات التعريفية للعلامة' },
      { en: 'Brand storytelling and messaging', ar: 'قصة العلامة ورسائلها' }
    ],
    icon: 'branding'
  },
  digital: {
    intro: { en: 'Digital Marketing', ar: 'التسويق الرقمي' },
    heading: { en: 'Make every channel work together.', ar: 'نجعل قنواتك الرقمية تعمل بتناغم.' },
    description: {
      en: 'We plan and manage useful, consistent digital communication, from the content strategy to publishing and learning from monthly performance.',
      ar: 'نخطط وندير تواصلًا رقميًا متسقًا وهادفًا، من استراتيجية المحتوى إلى النشر ومراجعة الأداء شهريًا.'
    },
    deliverables: [
      { en: 'Content strategy', ar: 'استراتيجية المحتوى' },
      { en: 'Content creation', ar: 'إنشاء المحتوى' },
      { en: 'Social media management', ar: 'إدارة منصات التواصل الاجتماعي' },
      { en: 'Content calendar', ar: 'تقويم المحتوى' },
      { en: 'Copywriting', ar: 'كتابة النصوص' },
      { en: 'Publishing and posting', ar: 'جدولة المنشورات ونشرها' },
      { en: 'Community management', ar: 'إدارة المجتمع والتفاعل' },
      { en: 'Monthly reporting', ar: 'تقارير الأداء الشهرية' }
    ],
    icon: 'digital'
  },
  media: {
    intro: { en: 'Media Buying', ar: 'إدارة الإعلانات' },
    heading: { en: 'Turn media spend into informed decisions.', ar: 'حوّل الإنفاق الإعلاني إلى قرارات مدروسة.' },
    description: {
      en: 'We plan, launch, and manage paid campaigns with clear audiences, ongoing optimization, and reporting that helps teams understand performance.',
      ar: 'نخطط الحملات المدفوعة ونطلقها ونديرها باستهداف واضح وتحسين مستمر وتقارير تساعد فريقك على فهم الأداء.'
    },
    deliverables: [
      { en: 'Campaign strategy', ar: 'استراتيجية الحملات' },
      { en: 'Audience targeting', ar: 'تحديد الجمهور واستهدافه' },
      { en: 'Campaign setup', ar: 'إعداد الحملات' },
      { en: 'Ads management', ar: 'إدارة الإعلانات' },
      { en: 'Ongoing optimization', ar: 'التحسين المستمر' },
      { en: 'Retargeting', ar: 'إعادة استهداف الجمهور' },
      { en: 'Performance tracking', ar: 'متابعة الأداء' },
      { en: 'Campaign reporting', ar: 'تقارير الحملات' }
    ],
    icon: 'media'
  }
};

export const marketingServiceIntro: Bilingual = {
  en: 'We bring brand, content, and paid media together in a focused growth practice.',
  ar: 'نجمع بين العلامة التجارية والمحتوى والإعلانات ضمن منظومة تسويق تركز على النمو.'
};
