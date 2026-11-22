import { bounded, BoundedError } from '../../core/agent/bounded.ts';
import { geminiKey } from './keys.ts';
import type { Blueprint, Candidate, Lang } from '../../core/mission-engine/types.ts';
import { applyCandidates } from '../../core/mission-engine/intake.ts';
import { ModelError } from './model.ts';

export type ImageInput = { mimeType: string; data: string };
export interface VisionModel { id: string; describe(input: { prompt: string; image: ImageInput; signal?: AbortSignal }): Promise<unknown> }

const MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const validImage = (v: unknown): v is ImageInput => !!v && typeof v === 'object'
  && MIME.has((v as ImageInput).mimeType) && typeof (v as ImageInput).data === 'string'
  && (v as ImageInput).data.length > 100 && (v as ImageInput).data.length < 4_000_000 && /^[A-Za-z0-9+/=]+$/.test((v as ImageInput).data);

/**
 * Why a vision call failed, said out loud. Mapping every non-ok response to one opaque code
 * meant a wrong model name, a disabled API and a quota wall all looked the same from outside,
 * so there was nothing to read and the cause had to be guessed at. The provider's own reason is
 * logged, truncated, with the key scrubbed in case it is ever echoed back.
 */
async function explain(provider: string, model: string, res: Response, key: string): Promise<never> {
  const body = (await res.text().catch(() => '')).split(key).join('[key]').slice(0, 300);
  console.warn('vision call failed', { provider, model, status: res.status, body });
  if (res.status === 401 || res.status === 403) throw new ModelError('model_auth_failed');
  if (res.status === 429) throw new ModelError('model_rate_limited');
  throw new ModelError('model_unavailable');
}

/** Gemini generateContent with inline image, JSON output. Key stays server-side. */
export function createGeminiVision(cfg: { key: string; model?: string; timeoutMs?: number; transport?: typeof fetch }): VisionModel {
  // Flash-Lite over Flash on purpose: on the free tier Flash is capped at a couple of dozen
  // requests a day while Flash-Lite gets hundreds, and reading a product photo does not need
  // the bigger model. The latest Flash-Lite that generateContent serves is 3.5 — there is no
  // 3.8 Flash-Lite outside the TTS variants, and asking for one returns a 404 that used to
  // surface as a bare 503. GEMINI_VISION_MODEL overrides it once there is a paid key.
  const transport = cfg.transport ?? fetch, model = cfg.model || 'gemini-3.5-flash-lite';
  return {
    id: model,
    async describe({ prompt, image, signal }) {
      try {
        return await bounded(async abort => {
          let res: Response;
          try {
            res = await transport(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
              method: 'POST', redirect: 'error', signal: abort,
              headers: { 'x-goog-api-key': cfg.key, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: image.mimeType, data: image.data } }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 1500 },
              }),
            });
          } catch { throw new ModelError('model_unavailable'); }
          if (!res.ok) await explain('gemini', model, res, cfg.key);
          const raw = await res.text();
          if (raw.includes(cfg.key)) throw new ModelError('model_bad_output');
          try {
            const text = JSON.parse(raw)?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
            return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ''));
          } catch { throw new ModelError('model_bad_output'); }
        }, cfg.timeoutMs ?? 40000, signal);
      } catch (error) {
        if (error instanceof ModelError) throw error;
        throw new ModelError(error instanceof BoundedError ? 'model_timeout' : 'model_unavailable');
      }
    },
  };
}

/** DeepSeek chat completions with an image_url data URL (deepseek-flash accepts images since Sept 2026). */
export function createDeepSeekVision(cfg: { key: string; model?: string; timeoutMs?: number; transport?: typeof fetch }): VisionModel {
  const transport = cfg.transport ?? fetch, model = cfg.model || 'deepseek-flash';
  return {
    id: model,
    async describe({ prompt, image, signal }) {
      try {
        return await bounded(async abort => {
          let res: Response;
          try {
            res = await transport('https://api.deepseek.com/chat/completions', {
              method: 'POST', redirect: 'error', signal: abort,
              headers: { Authorization: 'Bearer ' + cfg.key, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model, stream: false, temperature: 0.2, max_tokens: 1500, response_format: { type: 'json_object' },
                messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${image.mimeType};base64,${image.data}` } }] }],
              }),
            });
          } catch { throw new ModelError('model_unavailable'); }
          if (res.status === 402) throw new ModelError('model_rate_limited');
          if (!res.ok) await explain('deepseek', model, res, cfg.key);
          const raw = await res.text();
          if (raw.includes(cfg.key)) throw new ModelError('model_bad_output');
          try {
            const content = JSON.parse(raw)?.choices?.[0]?.message?.content;
            return JSON.parse(String(content).replace(/^```(?:json)?\s*|\s*```$/g, ''));
          } catch { throw new ModelError('model_bad_output'); }
        }, cfg.timeoutMs ?? 40000, signal);
      } catch (error) {
        if (error instanceof ModelError) throw error;
        throw new ModelError(error instanceof BoundedError ? 'model_timeout' : 'model_unavailable');
      }
    },
  };
}

/**
 * Vision with somewhere to fall back to. Reading a reference image is one step of a brief, so a
 * quota wall or a bad model name should cost the user the image reading, not the whole request.
 * Same rule as the text router: the failover is logged, and the id says which pair is in play.
 */
export function visionWithBackup(primary: VisionModel, backup: VisionModel | null): VisionModel {
  if (!backup) return primary;
  return {
    id: `${primary.id}\u2192${backup.id}`,
    async describe(input) {
      try {
        return await primary.describe(input);
      } catch (error) {
        if (!(error instanceof ModelError) || error.code === 'model_bad_output') throw error;
        console.warn('vision failover', { from: primary.id, to: backup.id, code: error.code });
        return await backup.describe(input);
      }
    },
  };
}

/** Gemini when its key is set, with DeepSeek behind it; DeepSeek alone when it is not. */
export const visionFromEnv = (env: (name: string) => string | undefined, transport?: typeof fetch): VisionModel | null => {
  const gem = geminiKey(env).key, ds = env('DEEPSEEK_API_KEY');
  const deepseek = ds ? createDeepSeekVision({ key: ds, model: env('ENGINE_VISION_MODEL'), transport }) : null;
  if (!gem) return deepseek;
  return visionWithBackup(createGeminiVision({ key: gem, model: env('GEMINI_VISION_MODEL'), transport }), deepseek);
};

/**
 * "Explain this image": a factual description plus candidates whose evidence is a span of that
 * description. Values read from the image (e.g. label text) still go through the brief for the
 * user to confirm; exact values must appear verbatim in the description.
 */
export async function describeReference(vision: VisionModel, bp: Blueprint, image: ImageInput, lang: Lang, signal?: AbortSignal): Promise<{ description: string; candidates: Candidate[]; model: string }> {
  const slots = bp.slots.filter(s => s.layer !== 'delivery' && s.role !== 'target-tool').map(s =>
    `- ${s.id}: ${s.kind === 'exact' ? 'exact text visible in the image, copied character for character' : s.kind}; ${s.question.en}${s.options ? ` options=[${s.options.map(o => o.value).join(', ')}]` : ''}`).join('\n');
  const prompt = [
    `You look at a reference image for a "${bp.title.en}" brief.`,
    `Return JSON {"description": "...", "candidates":[{"slot":"<id>","value":"...","evidence":"<exact span copied from your description>"}]}.`,
    `description: 2–4 factual sentences in ${lang === 'ar' ? 'Egyptian Arabic, keeping any visible text in its original script' : 'English'}: what is shown, shape, materials, colours, finish, setting, and any visible text quoted exactly.`,
    'Only fill a slot that the image clearly shows. Never guess brand names; only report text you can read. Slots:', slots,
  ].join('\n');
  const out = await vision.describe({ prompt, image, signal }) as { description?: unknown; candidates?: unknown };
  const description = typeof out?.description === 'string' ? out.description.slice(0, 1500) : '';
  if (!description) return { description: '', candidates: [], model: vision.id };
  const list = Array.isArray(out.candidates) ? out.candidates as Candidate[] : [];
  const empty = { id: 'v', blueprintId: bp.id, blueprintVersion: bp.version, lang, phase: 'questions' as const, values: {}, asked: [], revision: 0 };
  const candidates = list.filter(c => c && typeof c.slot === 'string' && typeof c.evidence === 'string' && (typeof c.value === 'string' || Array.isArray(c.value)))
    .slice(0, 12).filter(c => applyCandidates(empty, bp, description, [c]).values[c.slot]);
  return { description, candidates, model: vision.id };
}
