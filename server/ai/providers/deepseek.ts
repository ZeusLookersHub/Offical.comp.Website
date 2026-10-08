import { bounded, BoundedError } from '../../../core/agent/bounded.ts';
import type { AgentReasoningRequest } from '../../../core/agent/types.ts';
import type { AIRequest, AIResponse, AIReasoningProvider } from '../types.ts';
import { ProviderError, statusCode } from '../errors.ts';
import { validAIRequest, validOutput, reasoningBody, validReasoningDecision } from '../validation.ts';
import { record } from '../../../core/agent/validation.ts';

export class DeepSeekAdapter implements AIReasoningProvider {
  readonly id = 'deepseek';
  #key: string;
  #transport: typeof fetch;
  #timeout: number;
  readonly modelId = 'deepseek-flash';
  constructor(key: string | undefined, options: { transport?: typeof fetch; timeoutMs?: number } = {}) {
    if (typeof window !== 'undefined') throw new ProviderError('provider_unavailable');
    this.#key = key?.trim() || '';
    this.#transport = options.transport || fetch;
    this.#timeout = options.timeoutMs ?? 8000;
    if (!Number.isInteger(this.#timeout) || this.#timeout < 1 || this.#timeout > 45000) throw new ProviderError('invalid_ai_request');
  }
  async #json(system: string, input: string, signal?: AbortSignal): Promise<{ output: unknown; usage?: AIResponse['usage'] }> {
    if (!this.#key) throw new ProviderError('provider_unavailable');
    try {
      return await bounded(async abort => {
        let response: Response;
        try {
          response = await this.#transport('https://api.deepseek.com/chat/completions', {
            method: 'POST', redirect: 'error', headers: { Authorization: 'Bearer ' + this.#key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: this.modelId, stream: false, thinking: { type: 'disabled' }, temperature: .2,
              max_tokens: 4096, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: input }] }),
            signal: abort,
          });
        } catch { throw new ProviderError('provider_network_failed'); }
        if (!response.ok) throw new ProviderError(statusCode(response.status));
        // Bound both header wait and body consumption; never echo error bodies or credentials.
        const reader = response.body?.getReader();
        if (!reader) throw new ProviderError('invalid_provider_response');
        const cancel = () => { void reader.cancel().catch(() => undefined); };
        abort.addEventListener('abort', cancel, { once: true });
        let size = 0; const chunks: Uint8Array[] = [];
        try {
          while (true) {
            if (abort.aborted) throw new ProviderError('provider_aborted');
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > 150000) throw new ProviderError('invalid_provider_response');
            chunks.push(value);
          }
        } finally { abort.removeEventListener('abort', cancel); cancel(); }
        const bytes = new Uint8Array(size); let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
        let payload: unknown, output: unknown;
        try {
          const raw = new TextDecoder().decode(bytes);
          if (raw.includes(this.#key)) throw new Error();
          payload = JSON.parse(raw);
          if (!record(payload) || !Array.isArray(payload.choices) || payload.choices.length !== 1) throw new Error();
          const choice = payload.choices[0];
          if (!record(choice) || choice.finish_reason !== 'stop' || !record(choice.message) ||
            choice.message.role !== 'assistant' || typeof choice.message.content !== 'string' || choice.message.tool_calls || choice.message.refusal) throw new Error();
          output = JSON.parse(choice.message.content);
          if (JSON.stringify(output).includes(this.#key)) throw new Error();
        } catch { throw new ProviderError('invalid_provider_response'); }
        let usage: AIResponse['usage'];
        if (record(payload) && payload.usage !== undefined) {
          if (!record(payload.usage)) throw new ProviderError('invalid_provider_response');
          usage = {};
          for (const [raw, normalized] of [['prompt_tokens', 'inputTokens'], ['completion_tokens', 'outputTokens']] as const) {
            const n = payload.usage[raw];
            if (n !== undefined) {
              if (!Number.isSafeInteger(n) || (n as number) < 0) throw new ProviderError('invalid_provider_response');
              usage[normalized] = n as number;
            }
          }
        }
        return { output, usage };
      }, this.#timeout, signal);
    } catch (error) {
      if (error instanceof BoundedError) throw new ProviderError(error.code === 'timeout' ? 'provider_timeout' : 'provider_aborted');
      if (error instanceof ProviderError) throw error;
      throw new ProviderError('provider_network_failed');
    }
  }
  async generate(request: AIRequest): Promise<AIResponse> {
    if (!validAIRequest(request)) throw new ProviderError('invalid_ai_request');
    const result = await this.#json('Return JSON with exactly title, prompt, summary string fields. Preserve explicit user values; never invent names, prices, credentials, statistics or facts. Use ' + (request.locale === 'ar' ? 'Arabic.' : 'English.'), request.input);
    if (!validOutput(result.output)) throw new ProviderError('invalid_provider_response');
    return { id: crypto.randomUUID(), output: result.output, ...(result.usage ? { usage: result.usage } : {}),
      provenance: { providerId: this.id, modelId: this.modelId } };
  }
  async reason(request: AgentReasoningRequest): Promise<unknown> {
    const { signal, body } = reasoningBody(request);
    const result = await this.#json('Return JSON only: {"action":"complete","confidence":0.9} or {"action":"use_tool","toolId":"an offered tool ID","input":{},"confidence":0.9}. Select only offered read tools. Never fabricate facts, patch state or ask for secrets. Do not return provider metadata or extra fields.', JSON.stringify(body), signal);
    if (!validReasoningDecision(result.output, body)) throw new ProviderError('invalid_provider_response');
    return structuredClone(result.output);
  }
}
