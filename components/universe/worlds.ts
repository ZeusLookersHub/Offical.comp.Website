export type Bilingual = { en: string; ar: string };
export type WorldId = 'design' | 'marketing' | 'business' | 'presentations' | 'technology';

export interface WorldDef {
  id: WorldId;
  number: string;
  name: Bilingual;
  subtitle: Bilingual;
  tasks: Bilingual[];
  look: {
    ocean: string; land: string; land2: string; emit: string; rim: string;
    ring: string; ring2: string; veins: number; landAmt: number; seed: number;
    ringInner: number; ringOuter: number; ringTilt: [number, number, number]; ringDensity: number;
    moons: number;
  };
}

// The value sent through onSelect stays the English label, exactly as before, so the
// existing task routing in LookersAIPage keeps working unchanged.
export const WORLDS: WorldDef[] = [
  { id: 'design', number: '01', name: { en: 'Design', ar: 'التصميم' }, subtitle: { en: 'Visuals & Branding', ar: 'المرئيات والهوية' },
    tasks: [{ en: 'Brand Identity', ar: 'الهوية البصرية' }, { en: 'UI / UX', ar: 'تصميم الواجهات' }, { en: 'Social Design', ar: 'تصميم السوشيال' }, { en: 'Motion Design', ar: 'الموشن' }],
    look: { ocean: '#120f0d', land: '#3a2c22', land2: '#8a6a45', emit: '#ffb547', rim: '#ffbf66', ring: '#ffc56e', ring2: '#fff0c8', veins: 1.0, landAmt: -0.12, seed: 3.1, ringInner: 1.28, ringOuter: 2.05, ringTilt: [1.3, 0.0, -0.34], ringDensity: 1.0, moons: 2 } },
  { id: 'marketing', number: '02', name: { en: 'Marketing', ar: 'التسويق' }, subtitle: { en: 'Ideas to Audiences', ar: 'من الفكرة للجمهور' },
    tasks: [{ en: 'Campaign', ar: 'حملة إعلانية' }, { en: 'Content Strategy', ar: 'استراتيجية المحتوى' }, { en: 'Social Media', ar: 'السوشيال ميديا' }, { en: 'Market Research', ar: 'أبحاث السوق' }],
    look: { ocean: '#0b2238', land: '#1b2a36', land2: '#6f8fa8', emit: '#8fd8ff', rim: '#7cc9ff', ring: '#e8c486', ring2: '#9fd6ff', veins: 0.55, landAmt: 0.02, seed: 8.4, ringInner: 1.35, ringOuter: 1.75, ringTilt: [1.36, 0.0, 0.3], ringDensity: 0.75, moons: 2 } },
  { id: 'business', number: '03', name: { en: 'Business', ar: 'الأعمال' }, subtitle: { en: 'Plans & Growth', ar: 'خطط ونمو' },
    tasks: [{ en: 'Business Plan', ar: 'خطة عمل' }, { en: 'Company Profile', ar: 'ملف شركة' }, { en: 'Pitch Deck', ar: 'عرض استثماري' }, { en: 'Strategy', ar: 'استراتيجية' }],
    look: { ocean: '#17181b', land: '#3b3833', land2: '#8b8174', emit: '#ffcf86', rim: '#e9c38a', ring: '#e7c58f', ring2: '#fff1d4', veins: 0.4, landAmt: -0.2, seed: 15.2, ringInner: 1.3, ringOuter: 2.15, ringTilt: [1.41, 0.0, 0.12], ringDensity: 0.9, moons: 1 } },
  { id: 'presentations', number: '04', name: { en: 'Presentations', ar: 'العروض التقديمية' }, subtitle: { en: 'Ideas that Impact', ar: 'أفكار تترك أثر' },
    tasks: [{ en: 'Pitch Deck', ar: 'عرض استثماري' }, { en: 'Business Review', ar: 'مراجعة أعمال' }, { en: 'Training Slides', ar: 'شرائح تدريبية' }, { en: 'Product Launch', ar: 'إطلاق منتج' }],
    look: { ocean: '#2a1746', land: '#3c2a5c', land2: '#a58bd6', emit: '#d6b4ff', rim: '#b99cff', ring: '#c7a7ff', ring2: '#ffd9a0', veins: 0.6, landAmt: -0.02, seed: 22.7, ringInner: 1.25, ringOuter: 2.3, ringTilt: [1.24, 0.0, 0.4], ringDensity: 1.05, moons: 2 } },
  { id: 'technology', number: '05', name: { en: 'Technology', ar: 'التكنولوجيا' }, subtitle: { en: 'Web, Apps & AI', ar: 'ويب وتطبيقات وذكاء اصطناعي' },
    tasks: [{ en: 'Website', ar: 'موقع إلكتروني' }, { en: 'Mobile App', ar: 'تطبيق موبايل' }, { en: 'AI Agent', ar: 'وكيل ذكاء اصطناعي' }, { en: 'Automation', ar: 'أتمتة' }],
    look: { ocean: '#08262a', land: '#1b3f33', land2: '#6fae8e', emit: '#7ff0d0', rim: '#69e0c8', ring: '#7fe3d2', ring2: '#d8fff4', veins: 0.6, landAmt: -0.04, seed: 31.9, ringInner: 1.3, ringOuter: 1.95, ringTilt: [1.34, 0.0, -0.22], ringDensity: 0.95, moons: 2 } },
];

/** Placement in stage fractions. r is a fraction of the layout unit (see scene). */
export type Slot = { x: number; y: number; r: number };

export const WORLD_LAYOUT: Record<'landscape' | 'portrait', Record<WorldId, Slot>> = {
  landscape: {
    design: { x: 0.5, y: 0.6, r: 0.205 },
    marketing: { x: 0.19, y: 0.43, r: 0.098 },
    business: { x: 0.81, y: 0.36, r: 0.09 },
    presentations: { x: 0.165, y: 0.8, r: 0.105 },
    technology: { x: 0.8, y: 0.79, r: 0.098 },
  },
  portrait: {
    design: { x: 0.5, y: 0.5, r: 0.235 },
    marketing: { x: 0.22, y: 0.24, r: 0.118 },
    business: { x: 0.79, y: 0.27, r: 0.11 },
    presentations: { x: 0.23, y: 0.78, r: 0.125 },
    technology: { x: 0.78, y: 0.8, r: 0.118 },
  },
};

export const FOCUS_LAYOUT: Record<'landscape' | 'portrait', { planet: Slot; tasks: Slot[] }> = {
  landscape: {
    planet: { x: 0.5, y: 0.34, r: 0.15 },
    tasks: [
      { x: 0.24, y: 0.62, r: 0.055 }, { x: 0.405, y: 0.75, r: 0.055 },
      { x: 0.595, y: 0.75, r: 0.055 }, { x: 0.76, y: 0.62, r: 0.055 },
    ],
  },
  portrait: {
    planet: { x: 0.5, y: 0.235, r: 0.2 },
    tasks: [
      { x: 0.28, y: 0.575, r: 0.1 }, { x: 0.72, y: 0.575, r: 0.1 },
      { x: 0.28, y: 0.785, r: 0.1 }, { x: 0.72, y: 0.785, r: 0.1 },
    ],
  },
};
