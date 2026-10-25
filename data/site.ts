import type { Bilingual, ServiceId } from "./services";

export const contact = {
  whatsapp: "201118513761",
  phone: "+201118513761",
  email: "Info@lookershub.com",
};
export function whatsappUrl(message: string) {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
export const greeting: Bilingual = {
  en: "Hello LookersHub, I would like to discuss a project.",
  ar: "أهلاً LookersHub، حابب أتكلم معاكم بخصوص مشروع.",
};
export type ProductId = "pick" | "aero" | "kosmos" | "hera";
export type Product = {
  id: ProductId;
  title: string;
  subtitle: Bilingual;
  description: Bilingual;
  image: string;
  status: "development" | "available";
  concept?: boolean;
  service: ServiceId;
  details: Bilingual[];
};
export const products: Product[] = [
  {
    id: "pick",
    title: "Pick",
    subtitle: {
      en: "Better experiences. Better choices.",
      ar: "تجارب أوضح. اختيارات أفضل.",
    },
    description: {
      en: "An app for sharing problems and brand reviews, and discovering recommended places. In development.",
      ar: "تطبيق لمشاركة المشاكل وتقييم البراندات واكتشاف الأماكن الموصى بها. تحت الإنشاء.",
    },
    image: "/assets/portfolio/pick.gif",
    status: "development",
    service: "app",
    details: [
      {
        en: "Share experiences and problems with brands.",
        ar: "مشاركة التجارب والمشاكل مع البراندات.",
      },
      {
        en: "Explore brand ratings and reviews.",
        ar: "استكشاف تقييمات وآراء المستخدمين عن البراندات.",
      },
      { en: "Find recommended places.", ar: "اكتشاف الأماكن الموصى بها." },
    ],
  },
  {
    id: "aero",
    title: "Aero Runner",
    subtitle: {
      en: "Fly. Collect. Keep going.",
      ar: "طير. اجمع نقاط. كمّل التحدي.",
    },
    description: {
      en: "A mobile game where a bird collects points and flies past obstacles. In development.",
      ar: "لعبة موبايل تتحكم فيها بعصفور، تجمع النقاط وتتجاوز الحواجز. تحت الإنشاء.",
    },
    image: "/assets/portfolio/aero-concept.webp",
    status: "development",
    concept: true,
    service: "app",
    details: [
      { en: "A bird-led mobile adventure.", ar: "مغامرة موبايل بطلها عصفور." },
      {
        en: "Collect points along the flight path.",
        ar: "جمع النقاط أثناء الطيران.",
      },
      {
        en: "Navigate obstacles and keep moving.",
        ar: "تجاوز الحواجز والاستمرار في التحدي.",
      },
    ],
  },
  {
    id: "kosmos",
    title: "Kosmos",
    subtitle: {
      en: "A new perspective on work.",
      ar: "رؤية جديدة لإدارة العمل.",
    },
    description: {
      en: "A new approach to managing companies and projects. Currently in development.",
      ar: "فكر جديد في إدارة الشركات والمشروعات. نعمل على تطويره حاليًا.",
    },
    image: "/assets/portfolio/kosmos-concept.webp",
    status: "development",
    concept: true,
    service: "operations",
    details: [
      {
        en: "Designed around company and project management.",
        ar: "فكرة تتمحور حول إدارة الشركات والمشروعات.",
      },
      {
        en: "More details will be shared as development progresses.",
        ar: "هنشارك تفاصيل أكتر مع تقدم التطوير.",
      },
    ],
  },
  {
    id: "hera",
    title: "HERA SYSTEM ERP",
    subtitle: {
      en: "Your business, connected.",
      ar: "إدارة أعمالك في منظومة واحدة.",
    },
    description: {
      en: "An operational ERP system for business management. Explore the system and request a guided demo for your company.",
      ar: "نظام ERP يعمل حاليًا لإدارة الأعمال. تعرّف على النظام واطلب ديمو يناسب احتياجات شركتك.",
    },
    image: "/assets/portfolio/hera.png",
    status: "available",
    service: "operations",
    details: [
      { en: "Inventory and warehouses.", ar: "المخزون والمستودعات." },
      { en: "Sales and purchases.", ar: "المبيعات والمشتريات." },
      { en: "Customers and suppliers.", ar: "العملاء والموردون." },
      { en: "Accounting and reports.", ar: "الحسابات والتقارير." },
    ],
  },
];
export const marketingClients = [
  {
    id: "aldiyar",
    name: { en: "Aldiyar Travel", ar: "الديار ترافيل" },
    sector: { en: "Travel & tourism", ar: "السياحة والسفر" },
    work: { en: "Marketing services", ar: "خدمات التسويق" },
  },
  {
    id: "aldawlia",
    name: { en: "Al Dawlia Real Estate", ar: "الدولية للعقارات" },
    sector: { en: "Real estate", ar: "العقارات" },
    work: { en: "Marketing services", ar: "خدمات التسويق" },
  },
];
export const serviceWorkflow: Record<
  ServiceId,
  { steps: Bilingual[]; outputs: Bilingual[] }
> = {
  app: {
    steps: [
      { en: "Understand the idea and users", ar: "فهم الفكرة والمستخدمين" },
      {
        en: "Plan the experience and prototype",
        ar: "تخطيط التجربة والنموذج الأولي",
      },
      { en: "Build and test", ar: "التطوير والاختبار" },
      {
        en: "Prepare launch and next steps",
        ar: "تجهيز الإطلاق والخطوات التالية",
      },
    ],
    outputs: [
      {
        en: "Product scope and user journeys",
        ar: "نطاق المنتج ورحلات المستخدم",
      },
      {
        en: "Application or game implementation",
        ar: "تنفيذ التطبيق أو اللعبة",
      },
      { en: "Testing and launch preparation", ar: "الاختبار وتجهيز الإطلاق" },
    ],
  },
  strategy: {
    steps: [
      { en: "Understand the business", ar: "فهم النشاط" },
      {
        en: "Identify opportunities and priorities",
        ar: "تحديد الفرص والأولويات",
      },
      { en: "Define direction and scope", ar: "تحديد الاتجاه والنطاق" },
      { en: "Build the execution roadmap", ar: "إعداد خارطة التنفيذ" },
    ],
    outputs: [
      { en: "Clear objectives and priorities", ar: "أهداف وأولويات واضحة" },
      {
        en: "Product and experience direction",
        ar: "توجه المنتج وتجربة المستخدم",
      },
      { en: "An actionable roadmap", ar: "خارطة طريق قابلة للتنفيذ" },
    ],
  },
  operations: {
    steps: [
      { en: "Map the current workflow", ar: "فهم سير العمل الحالي" },
      { en: "Design the system", ar: "تصميم النظام" },
      { en: "Implement and connect", ar: "التنفيذ والربط" },
      { en: "Test with the team", ar: "الاختبار مع الفريق" },
    ],
    outputs: [
      {
        en: "Workflow and system requirements",
        ar: "متطلبات النظام وسير العمل",
      },
      {
        en: "Business systems and internal tools",
        ar: "أنظمة أعمال وأدوات داخلية",
      },
      { en: "Operational testing and handover", ar: "اختبار التشغيل والتسليم" },
    ],
  },
  marketing: {
    steps: [
      { en: "Understand the brand and audience", ar: "فهم البراند والجمهور" },
      { en: "Set the direction and plan", ar: "تحديد الاتجاه والخطة" },
      { en: "Create and execute", ar: "الإنتاج والتنفيذ" },
      { en: "Review and improve", ar: "المراجعة والتحسين" },
    ],
    outputs: [
      { en: "Brand and communication direction", ar: "توجه العلامة والتواصل" },
      { en: "Content and campaign plan", ar: "خطة المحتوى والحملات" },
      {
        en: "Creative assets and performance review",
        ar: "مواد إبداعية ومراجعة الأداء",
      },
    ],
  },
};
