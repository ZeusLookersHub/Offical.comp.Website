import type { Copy, Lang } from './types.ts';

export const t = (copy: Copy, lang: Lang) => copy[lang] || copy.en;

/** Loose match form: lowercase, Arabic letter variants unified, diacritics/tatweel removed, spaces collapsed. */
export function normalize(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[“”«»"'`]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export const words = (input: string) => normalize(input).split(/[^\p{L}\p{N}:]+/u).filter(Boolean);

const AR_PREFIXES = ['وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك'];
/** Token equals the word, or the word with an attached Arabic prefix (لستوري، بالإنجليزي). */
const tokenMatches = (token: string, word: string) =>
  token === word || (/\p{Script=Arabic}/u.test(word) && AR_PREFIXES.some(p => token === p + word || (word.startsWith('ال') && token === p + word.slice(2))));

/** Whole-word (or whole-phrase) containment on normalized text, tolerant of Arabic prefixes. */
export function containsPhrase(text: string, phrase: string): boolean {
  const hay = words(text);
  const needle = words(phrase);
  if (!needle.length) return false;
  for (let i = 0; i + needle.length <= hay.length; i++) {
    if (tokenMatches(hay[i], needle[0]) && needle.slice(1).every((w, j) => hay[i + j + 1] === w)) return true;
  }
  return false;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/**
 * Finds spellings close to `target` that are not `target` itself
 * (e.g. "DAVIE DOVE" for "DAVIDOFF"). Compares 1–3 word windows.
 */
export function nearMisses(text: string, target: string): string[] {
  const key = target.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  if (key.length < 4) return [];
  // Exact occurrences are correct; only what remains can be a misspelling.
  const tokens = text.split(target).join(' \u0000 ').split(/[^\p{L}\p{N}\u0000]+/u).filter(Boolean);
  const limit = Math.max(1, Math.floor(key.length * 0.4));
  const found = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    for (let n = 1; n <= 3 && i + n <= tokens.length; n++) {
      if (tokens.slice(i, i + n).includes('\u0000')) break;
      const raw = tokens.slice(i, i + n).join(' ');
      const joined = raw.toLowerCase().replace(/\s/g, '');
      if (joined === key || joined[0] !== key[0]) continue;
      if (Math.abs(joined.length - key.length) > limit) continue;
      if (levenshtein(joined, key) <= limit) found.add(raw);
    }
  }
  // A window that merely contains the exact brand plus a neighbour is not a misspelling.
  return [...found].filter(candidate => !candidate.toLowerCase().replace(/\s/g, '').includes(key));
}

export const asText = (value: string | string[]) => Array.isArray(value) ? value.join(', ') : value;
