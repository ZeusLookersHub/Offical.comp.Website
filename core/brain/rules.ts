import { PROJECT_ENGINE_IDS } from "../projects/engines";
import type { ProjectEngineId } from "../projects/types";
import { compileTerm, normalizeText } from "./normalize";

interface Rule<T extends string> { id: T; matchers: RegExp[] }
const rule = <T extends string>(id: T, terms: ReadonlyArray<string | RegExp>): Rule<T> => ({
  id, matchers: terms.map((term) => typeof term === "string" ? compileTerm(term) : term),
});

/** "resume" is also a common verb ("resume the project"); only the noun sense routes to the CV engine. */
const RESUME_NOUN = /(?:^| )resumes?(?= |$)(?! (?:the|this|that|it|work|working|again|from|where|our)(?: |$))/u;

/** Strong signals: a single engine can be selected without AI. */
const STRONG_RULES: ReadonlyArray<Rule<ProjectEngineId>> = [
  rule("visual.image", ["image", "picture", "photo", "photograph", "illustration", "artwork", "poster", "wallpaper", "thumbnail",
    "صورة", "صور", "رسمة", "لوحة", "بوستر", "فوتو"]),
  rule("visual.video", ["video", "clip", "animation", "animated", "reel", "footage", "trailer", "motion graphics",
    "فيديو", "فديو", "كليب", "انيميشن", "ريل", "تحريك"]),
  rule("cv", ["cv", "c v", RESUME_NOUN, "curriculum vitae", "سيرة ذاتية", "سي في"]),
  rule("powerpoint", ["powerpoint", "power point", "pptx", "ppt", "slides", "slide deck", "presentation", "pitch deck", "deck",
    "بوربوينت", "باوربوينت", "عرض تقديمي", "شرائح", "سلايدات", "برزنتيشن"]),
  rule("excel", ["excel", "spreadsheet", "xlsx", "workbook", "google sheets", "اكسل", "جدول بيانات", "جداول بيانات"]),
  rule("report", ["report", "تقرير", "تقارير"]),
  rule("proposal", ["proposal", "rfp", "عرض مقترح", "مقترح"]),
  rule("business-plan", ["business plan", "feasibility study", "خطة عمل", "خطة اعمال", "دراسة جدوى"]),
  rule("project-product", ["prd", "mvp", "product requirements", "product spec", "product roadmap", "app idea", "build an app",
    "create an app", "develop an app", "mobile app", "web app", "new product",
    "تطبيق جوال", "فكرة تطبيق", "منتج جديد", "متطلبات المنتج", "خريطة المنتج"]),
];

/** Weak signals: they only indicate a family of engines, so they produce ambiguity rather than a decision. */
const WEAK_RULES: ReadonlyArray<Rule<"visual" | "business">> = [
  rule("visual", ["visual", "visuals", "graphic", "graphics", "creative", "مرئي", "بصري", "جرافيك"]),
  rule("business", ["business", "company", "startup", "enterprise", "بيزنس", "شركة", "شركتي", "اعمال", "مشروع", "مشروعي", "تجاري"]),
];

export const VISUAL_CANDIDATES: readonly ProjectEngineId[] = ["visual.image", "visual.video"];
export const BUSINESS_CANDIDATES: readonly ProjectEngineId[] = ["business", "proposal", "business-plan", "project-product", "report"];

const ENGINE_ORDER = new Map<string, number>(PROJECT_ENGINE_IDS.map((id, index) => [id, index]));
export const sortEngines = (ids: Iterable<ProjectEngineId>): ProjectEngineId[] =>
  [...new Set(ids)].sort((a, b) => (ENGINE_ORDER.get(a) ?? 0) - (ENGINE_ORDER.get(b) ?? 0));

export interface TextRuleMatch {
  strong: Map<ProjectEngineId, number>;
  weak: Set<"visual" | "business">;
}

export const matchTextRules = (input: unknown): TextRuleMatch => {
  const text = normalizeText(input);
  const strong = new Map<ProjectEngineId, number>();
  const weak = new Set<"visual" | "business">();
  if (!text) return { strong, weak };
  for (const { id, matchers } of STRONG_RULES) {
    const hits = matchers.filter((matcher) => matcher.test(text)).length;
    if (hits > 0) strong.set(id, hits);
  }
  for (const { id, matchers } of WEAK_RULES) {
    if (matchers.some((matcher) => matcher.test(text))) weak.add(id);
  }
  return { strong, weak };
};

const OUTPUT_ALIASES = new Map<string, ProjectEngineId>([
  ...PROJECT_ENGINE_IDS.map((id): [string, ProjectEngineId] => [normalizeText(id), id]),
  ["image", "visual.image"], ["picture", "visual.image"], ["photo", "visual.image"], ["صورة", "visual.image"],
  ["video", "visual.video"], ["فيديو", "visual.video"],
  ["resume", "cv"], ["سيرة ذاتية", "cv"],
  ["power point", "powerpoint"], ["ppt", "powerpoint"], ["pptx", "powerpoint"], ["presentation", "powerpoint"], ["slides", "powerpoint"],
  ["spreadsheet", "excel"], ["xlsx", "excel"],
].map(([key, id]): [string, ProjectEngineId] => [normalizeText(key), id as ProjectEngineId]));

/** Maps an explicit output value to an engine, or null when it is not a recognized output. */
export const engineForOutput = (output: unknown): ProjectEngineId | null =>
  OUTPUT_ALIASES.get(normalizeText(output)) ?? null;

export const OUTPUT_LABEL: Partial<Record<ProjectEngineId, string>> = {
  "visual.image": "image", "visual.video": "video", cv: "cv", powerpoint: "powerpoint", excel: "excel",
  report: "report", proposal: "proposal", "business-plan": "business-plan", "project-product": "project-product",
};

export const intentFor = (engineId: ProjectEngineId | null, candidates: readonly ProjectEngineId[]): string => {
  const pool = engineId ? [engineId] : [...candidates];
  if (pool.length === 0) return "unknown";
  if (pool.every((id) => id.startsWith("visual."))) return "create_visual";
  if (pool.every((id) => id === "project-product")) return "plan_project_product";
  if (pool.every((id) => id === "other")) return "general";
  if (pool.every((id) => !id.startsWith("visual.") && id !== "other")) return "create_business_document";
  return "unknown";
};
