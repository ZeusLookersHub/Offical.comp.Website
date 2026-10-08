// Extracted from the actual deployed v11 source; existing behavior retained.
import type { AIProvider, AIRequest, AIResponse } from '../types.ts';
import { ProviderRequestError } from '../errors.ts';
export class OpenRouterAdapter implements AIProvider {
  readonly id = "openrouter";

  constructor(
    private readonly apiKey: string,
    private readonly modelId: string,
  ) {}

  async generate(request: AIRequest): Promise<AIResponse> {
    const language = request.locale === "ar" ? "Arabic" : "English";
    let response: Response;
    for (let attempt = 0; ; attempt += 1) {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + this.apiKey,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lookershub.com",
          "X-Title": "Lookers AI",
        },
        body: JSON.stringify({
          model: this.modelId,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "Return a JSON object with string fields title, prompt, summary. Write in " + language + ". Preserve user intent. Do not invent unspecified facts.",
            },
            { role: "user", content: request.input },
          ],
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (response.status !== 429 || attempt > 0) break;
      const retryAfter = Number(response.headers.get("retry-after"));
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(4000, Math.max(250, retryAfter * 1000))
        : 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (!response.ok) {
      throw new ProviderRequestError(response.status);
    }

    const payload = await response.json();
    const raw = payload?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("invalid_provider_response");

    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new Error("invalid_provider_response"); }
    if (!parsed || typeof parsed !== "object") throw new Error("invalid_provider_response");

    const output = parsed as Record<string, unknown>;
    if (
      typeof output.title !== "string" ||
      typeof output.prompt !== "string" ||
      typeof output.summary !== "string" ||
      output.title.length > 500 ||
      output.prompt.length > 20000 ||
      output.summary.length > 4000
    ) {
      throw new Error("invalid_provider_response");
    }

    const usage = payload?.usage;
    return {
      id: crypto.randomUUID(),
      output: { title: output.title, prompt: output.prompt, summary: output.summary },
      usage: {
        ...(Number.isInteger(usage?.prompt_tokens) ? { inputTokens: usage.prompt_tokens } : {}),
        ...(Number.isInteger(usage?.completion_tokens) ? { outputTokens: usage.completion_tokens } : {}),
      },
      provenance: { providerId: this.id, modelId: this.modelId },
    };
  }
}
