import { bounded, BoundedError } from '../../core/agent/bounded.ts';
import type { Blueprint, Candidate, Lang } from '../../core/mission-engine/types.ts';
import { applyCandidates } from '../../core/mission-engine/intake.ts';
import { ModelError } from './model.ts';

export type ImageInput = { mimeType: string; data: string };
export interface VisionModel { id: string; describe(input: { prompt: string; image: ImageInput; signal?: AbortSignal }): Promise<unknown> }

const MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const validImage = (v: unknown): v is ImageInput => !!v && typeof v === 'object'
  && MIME.has((v as ImageInput).mimeType) && typeof (v as ImageInput).data === 'string'
  && (v as ImageInput).data.length > 100 && (v as ImageInput).data.length < 4_000_000 && /^[A-Za-z0-9+/=]+$/.test((v as ImageInput).data);

/** Gemini generateContent with inline image, JSON output. Key stays server-side. */
export function createGeminiVision(cfg: { key: string; model?: string; timeoutMs?: number; transport?: typeof fetch }): VisionModel {
  const transport = cfg.transport ?? fetch, model = cfg.model || 'gemini-3.8-flash';
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
          if (res.status === 401 || res.status === 403) throw new ModelError('model_auth_failed');
          if (res.status === 429) throw new ModelError('model_rate_limited');
          if (!res.ok) throw new ModelError('model_unavailable');
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
          if (res.status === 401 || res.status === 403) throw new ModelError('model_auth_failed');
          if (res.status === 429 || res.status === 402) throw new ModelError('model_rate_limited');
          if (!res.ok) throw new ModelError('model_unavailable');
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

/** Gemini if its key is set, otherwise DeepSeek (same key as the text engine). */
export const visionFromEnv = (env: (name: string) => string | undefined, transport?: typeof fetch): VisionModel | null =>
  env('GEMINI_API_KEY') ? createGeminiVision({ key: env('GEMINI_API_KEY')!, model: env('GEMINI_MODEL'), transport })
    : env('DEEPSEEK_API_KEY') ? createDeepSeekVision({ key: env('DEEPSEEK_API_KEY')!, model: env('ENGINE_VISION_MODEL'), transport })
    : null;

/**
 * "Explain this image": a factual description plus candidates whose evidence is a span of that
 * description. Values read from the image (e.g. label text) still go through the brief for the
 * user to confirm; exact values must appear verbatim in the description.
 */
export async function describeReference(vision: VisionModel, bp: Blueprint, image: ImageInput, lang: Lang, signal?: AbortSignal): Promise<{ description: string; candidates: Candidate[] }> {
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
  if (!description) return { description: '', candidates: [] };
  const list = Array.isArray(out.candidates) ? out.candidates as Candidate[] : [];
  const empty = { id: 'v', blueprintId: bp.id, blueprintVersion: bp.version, lang, phase: 'questions' as const, values: {}, asked: [], revision: 0 };
  const candidates = list.filter(c => c && typeof c.slot === 'string' && typeof c.evidence === 'string' && (typeof c.value === 'string' || Array.isArray(c.value)))
    .slice(0, 12).filter(c => applyCandidates(empty, bp, description, [c]).values[c.slot]);
  return { description, candidates };
}
