/**
 * Where the Gemini key is read from.
 *
 * Environment names are case-sensitive, so a key stored under a near-miss name is invisible
 * to the engine and everything quietly falls back to the other provider — which is exactly
 * what happened here, and it cost a round of wrong conclusions. The names actually in use are
 * listed, the canonical one first, and the resolver reports which one it found so the boot
 * line can say so out loud. The value itself is never logged or returned anywhere else.
 */
const GEMINI_KEY_NAMES = ['GEMINI_API_KEY', 'gemini_Free_API_Key', 'GEMINI_FREE_API_KEY'] as const;

export function geminiKey(env: (name: string) => string | undefined): { key?: string; name: string } {
  for (const name of GEMINI_KEY_NAMES) {
    const key = env(name)?.trim();
    if (key) return { key, name };
  }
  return { name: 'none' };
}
