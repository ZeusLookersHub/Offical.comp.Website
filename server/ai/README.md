# Stage 05: Enhancement, validation and the server AI boundary

The real `lookers-ai-generate` function was inspected in project
`cdmthlmnuqcmarboaxfb` before this change. Its deployed version 11 is archived
verbatim in `supabase/functions/lookers-ai-generate/deployed-v11/index.ts.txt`.
Original source-file SHA-256: `c281766687c6d16e8b759eae00469216ecc486e9592770908f3a4f57f5ac1b6c`.
Supabase's deployed bundle metadata (`ezbr_sha256`):
`cb9b81134f73657657f083f6a05f2e2591a182da0890a653ac2ff39e0a2a359a`.
The original AIRequest, AIResponse and AIProvider contracts are retained in
`types.ts`; OpenRouter was extracted from that actual source, not reconstructed.

## Boundaries

- `core/enhancement` offers advisory validation and existing Question Engine
  technical defaults. It never patches Project or QuestionSession, supplies
  missing factual information, or treats model text as verified facts.
- `AILayer` validates requests, normalized generation responses and reasoning
  decisions. The registry selects providers; Core does not select a model.
- `DeepSeekAdapter` owns the endpoint, model and credential. One bounded attempt
  uses JSON output; malformed, truncated, oversized or credential-echoing output
  is rejected. Redirects are prohibited. There are no DeepSeek retries.
- `LayerAgentReasoner` implements the existing AgentReasoner port. The Agent's
  original step limits, allowlist, input/output validation and deterministic
  fallback remain in effect. Reasoning sees only the existing minimal request,
  not canonical project facts or references. It cannot write state.
- `services/lookersAiAgentReasoner.ts` is a provider-neutral application bridge
  for an injected authenticated transport. It does not initialize auth or make
  direct provider calls. The existing First Draft UI is preserved; enabling an
  authenticated transport in a UI is a separate application wiring choice.

## Real HTTP contract and additive operation

Generation retains the existing authenticated request:

```json
{ "prompt": "User request", "language": "en" }
```

`language` is optional and defaults to English. Success remains
`{ data: AIResponse, identity: { userId, isAnonymous: true } }`.
The internal `{ input, locale }` contract is not the HTTP contract.

An additive, independently validated operation supports the existing reasoning
port:

```text
{ operation: "reason", reasoning: Omit<AgentReasoningRequest, "signal"> }
→ { data: { decision: AgentReasoningDecision }, identity: { userId, isAnonymous: true } }
```

Every request still requires a bearer JWT validated against Supabase Auth and
an anonymous identity. Keep `verify_jwt: true`. V1 has no sign-in UI. CORS retains
the deployed production and local origins. Payloads are capped at 20,000 bytes,
including streams without a Content-Length header.

Provider failures use stable `error` codes: `provider_auth_failed` (401 upstream),
`provider_insufficient_balance` (402), `provider_rate_limited` (429),
`provider_timeout`, `provider_network_failed`, `invalid_provider_response`,
`provider_unavailable` and `provider_aborted`. Raw provider responses, exception
messages and credentials are never returned. Upstream 401/402/429 use HTTP 502
with `providerStatus`; unavailable is 503, timeout is 504. These are provider
failures, not an invitation to log in or create an account.

## Configuration and deployment

Only Supabase server-side secrets configure inference:

- `DEEPSEEK_API_KEY`: provision through Supabase's secret manager; never put it
  in Git, Vite environment variables, browser code or localStorage.
- `AI_PROVIDER_ID=deepseek`: select the new adapter. The default is DeepSeek
  when this secret is absent; an existing explicit OpenRouter selection remains
  explicit until changed server-side.
- DeepSeek's model is `deepseek-flash`, isolated in its adapter. Existing
  `OPENROUTER_API_KEY`/`AI_MODEL_ID` retain legacy generation compatibility.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` remain Supabase's server runtime values.

Do not log or retrieve the key to verify configuration. Missing credentials
and insufficient balance are expected structured failures. This repository
does not certify that a credential is configured or funded.

Run `npm run build:ai-function` to bundle the tracked entrypoint and relative
dependencies into `node_modules/.cache/lookers-ai-function/index.ts`. This is
the deployment input for the existing function in `cdmthlmnuqcmarboaxfb`;
bundling resolves the existing extensionless Core imports for Deno without
rewriting accepted stages. Keep JWT verification enabled. There are no schema
migrations, additional projects or environment changes.

## Offline verification

`npm run test:stage05` exercises the adapter, AI Layer, HTTP boundary, neutral
reasoner integration, fallback and Enhancement validation using injected
transports. The Stage 05 workflow also runs locked installation, TypeScript,
Core/Brain/Question Engine/Agent regressions, function bundling and the website
build. No API key or live provider call is required in CI.

Optional manual smoke test: after server-side configuration, invoke the existing
function with an anonymous Supabase JWT and the generation HTTP body above.
This can incur provider usage and is intentionally not automated. At zero
balance, expect `provider_insufficient_balance` with `providerStatus: 402`;
do not retry repeatedly. No live inference was used to pass automated tests.

Official references: [DeepSeek completion API](https://api-docs.deepseek.com/api/create-chat-completion/),
[DeepSeek errors](https://api-docs.deepseek.com/quick_start/error_codes/).
