export const MAX_BRAIN_INPUT_LENGTH = 4000;

/**
 * Language-neutral input normalization used before any rule matching:
 * strips diacritics/tatweel, unifies Arabic letter variants, lowercases,
 * removes punctuation and collapses whitespace.
 */
export const normalizeText = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value
    .slice(0, MAX_BRAIN_INPUT_LENGTH)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/\u0640/g, "")
    .replace(/\u0671/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s+#]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasArabic = (value: string): boolean => /[\u0600-\u06FF]/.test(value);

/** Whole-word matcher for an already-defined term; tolerates Latin plurals and common Arabic prefixes. */
export const compileTerm = (term: string): RegExp => {
  const normalized = escapeRegExp(normalizeText(term));
  return hasArabic(normalized)
    ? new RegExp(`(?:^| )(?:[\u0648\u0641\u0628\u0643]?(?:\u0627\u0644|\u0644\u0644|\u0644)?)${normalized}(?= |$)`, "u")
    : new RegExp(`(?:^| )${normalized}(?:s|es)?(?= |$)`, "u");
};
