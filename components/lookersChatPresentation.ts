import { questionCopy } from "../data/lookersAiQuestionCopy";
import type { ChatQuestion } from "../services/lookersAiChatWorkflow";
import type { Lang } from "../data/lookersAi";

/** Display wording only; canonical option values and saved answers are unchanged. */
const imageActions: Record<
  string,
  { ar: string; en: string; detailAr: string; detailEn: string }
> = {
  create: {
    ar: "اعمل صورة جديدة من وصفي",
    en: "Create a new image",
    detailAr: "هنبدأ من الفكرة اللي كتبتها، ومش لازم يكون معاك صورة.",
    detailEn: "Start from your description; a reference image is optional.",
  },
  rebuild: {
    ar: "اعمل صورة شبه المرجع اللي معايا",
    en: "Rebuild a reference",
    detailAr:
      "استخدم الصورة كمرجع للشكل والتكوين، ووضّح إيه اللي عايزه يفضل زي ما هو.",
    detailEn:
      "Use the reference composition and specify what should stay the same.",
  },
  transform: {
    ar: "غيّر ستايل الصورة اللي معايا",
    en: "Transform the style",
    detailAr: "نفس الفكرة أو العنصر، بس بشكل مختلف؛ زي تحويل صورة حقيقية لرسم.",
    detailEn:
      "Keep the subject and change its look, for example from a photo to an illustration.",
  },
  remix: {
    ar: "اجمع أفكار من كذا صورة",
    en: "Combine references",
    detailAr: "زي منتج من صورة، وخلفية من صورة تانية، وألوان من صورة تالتة.",
    detailEn:
      "Combine a subject, background or palette from different references.",
  },
  analyze: {
    ar: "حلّل الصورة واشرحهالي بس",
    en: "Analyze a reference only",
    detailAr: "نفهم الإضاءة والألوان والتكوين؛ مش هنطلب صورة جديدة.",
    detailEn:
      "Explain the lighting, colors and composition without requesting a new image.",
  },
};
export function chatQuestionText(question: ChatQuestion, lang: Lang): string {
  if (lang !== "ar") return question.message;
  if (
    question.id === "format" &&
    question.control.type === "single" &&
    question.control.options.some((o) => aspectRatio(o.value))
  )
    return "تحب شكل الصورة أو الكادر يبقى إزاي؟";
  return questionCopy[question.id]?.[0] || question.message;
}
export function chatQuestionHint(question: ChatQuestion, lang: Lang): string {
  return lang === "ar" ? questionCopy[question.id]?.[1] || "" : "";
}
export function chatOption(
  questionId: string,
  value: string,
  label: string,
  lang: Lang,
) {
  const action = questionId === "action" ? imageActions[value] : undefined;
  return {
    label: action ? action[lang] : label,
    detail: action ? (lang === "ar" ? action.detailAr : action.detailEn) : "",
  };
}
export function aspectRatio(
  value: string,
): { width: number; height: number } | null {
  if (!/^[1-9]\d?:[1-9]\d?$/.test(value)) return null;
  const [width, height] = value.split(":").map(Number);
  return { width, height };
}

export function chatExample(question: ChatQuestion, lang: Lang): string {
  const sample =
    lang === "ar"
      ? questionCopy[question.id]?.[3] || question.example
      : question.example;
  return sample.replace(/^(?:مثال|Example):\s*/i, "");
}
export function chatPlaceholder(question: ChatQuestion, lang: Lang): string {
  if (lang === "ar" && questionCopy[question.id]?.[3])
    return "مثلًا: " + questionCopy[question.id][3];
  return question.control.type === "text" ||
    question.control.type === "textarea"
    ? question.control.placeholder
    : "";
}
