/**
 * Where each AI tool lives, and whether we can hand it the prompt in the URL.
 *
 * mode 'query' → the tool accepts the prompt as a URL parameter, so the user lands
 *                with the prompt already in the box and only presses send.
 * mode 'copy'  → the tool has no documented parameter, so we copy the prompt to the
 *                clipboard first and then open the tool. One paste, then send.
 *
 * Web links are universal links, so on a phone they open the installed app when there
 * is one, and the browser otherwise. No custom schemes needed.
 */
export type LaunchMode = 'query' | 'copy';

export type ToolLaunch = {
  /** Where the button goes. */
  web: string;
  /** How the prompt gets there. */
  mode: LaunchMode;
  /** Query parameter carrying the prompt, when mode is 'query'. */
  param?: string;
  /** Longest encoded prompt we trust in the URL; above it we fall back to copy. */
  maxQuery?: number;
  /** Logo asset; the UI falls back to a letter badge when it is missing. */
  logo: string;
};

const logo = (id: string) => `/assets/lookers-ai/tools/${id}.svg`;

const entry = (id: string, web: string, mode: LaunchMode, param?: string, maxQuery = 1800): ToolLaunch =>
  ({ web, mode, ...(param ? { param } : {}), maxQuery, logo: logo(id) });

export const TOOL_LAUNCH: Record<string, ToolLaunch> = {
  // Chat AIs — prompt goes in the URL.
  chatgpt: entry('chatgpt', 'https://chatgpt.com/', 'query', 'q'),
  claude: entry('claude', 'https://claude.ai/new', 'query', 'q'),
  bolt: entry('bolt', 'https://bolt.new', 'query', 'prompt'),
  // Chat AIs and builders without a documented parameter.
  gemini: entry('gemini', 'https://gemini.google.com/app', 'copy'),
  copilot: entry('copilot', 'https://www.office.com/launch/powerpoint', 'copy'),
  v0: entry('v0', 'https://v0.app', 'copy'),
  lovable: entry('lovable', 'https://lovable.dev', 'copy'),
  framer: entry('framer', 'https://www.framer.com/projects/', 'copy'),
  // Decks and design.
  gamma: entry('gamma', 'https://gamma.app/create/generate', 'copy'),
  canva: entry('canva', 'https://www.canva.com/magic-design/', 'copy'),
  // Image tools.
  midjourney: entry('midjourney', 'https://www.midjourney.com/imagine', 'copy'),
  ideogram: entry('ideogram', 'https://ideogram.ai/', 'copy'),
  flux: entry('flux', 'https://playground.bfl.ai/', 'copy'),
  firefly: entry('firefly', 'https://firefly.adobe.com/', 'copy'),
  // Audio tools.
  elevenlabs: entry('elevenlabs', 'https://elevenlabs.io/app/speech-synthesis', 'copy'),
  suno: entry('suno', 'https://suno.com/create', 'copy'),
  // Video tools.
  runway: entry('runway', 'https://app.runwayml.com/', 'copy'),
  kling: entry('kling', 'https://app.klingai.com/', 'copy'),
  hailuo: entry('hailuo', 'https://hailuoai.video/', 'copy'),
  sora: entry('sora', 'https://sora.chatgpt.com/', 'copy'),
  veo: entry('veo', 'https://labs.google/fx/tools/flow', 'copy'),
};

export type LaunchPlan = { url: string; mode: LaunchMode; logo: string };

/**
 * Build the launch plan for a tool and a prompt.
 * Returns null for ids we have no destination for (such as 'universal'),
 * so the UI shows copy alone instead of a dead button.
 */
export function planLaunch(toolId: string, prompt: string): LaunchPlan | null {
  const target = TOOL_LAUNCH[toolId];
  if (!target) return null;
  const text = prompt.trim();
  if (target.mode === 'query' && target.param && text) {
    const encoded = encodeURIComponent(text);
    if (encoded.length <= (target.maxQuery ?? 1800)) {
      // Built by hand so spaces stay %20: a few tools read a '+' literally.
      const sep = target.web.includes('?') ? '&' : '?';
      return { url: `${target.web}${sep}${target.param}=${encoded}`, mode: 'query', logo: target.logo };
    }
  }
  // No parameter, or the prompt is too long to survive the URL: copy then open.
  return { url: target.web, mode: 'copy', logo: target.logo };
}

/** Tool ids that have a destination, in the order the blueprint lists them. */
export function launchableTools(ids: readonly string[]): string[] {
  return ids.filter(id => Boolean(TOOL_LAUNCH[id]));
}
