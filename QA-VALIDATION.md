# Lookers AI integration validation

Validated on 2026-10-11, resuming committed integration at
`e88b9aad1e20423ab2ab6eb010152b5a002e43c8`. Existing Prompt Library and
visual design were preserved. The earlier completed visual review was not redesigned.

## Confirmed failure and repair

The current head's five Stage validation workflows passed, but browser CI run
38168396676 failed waiting for a result. The canonical Agent correctly required
an image subject and aspect ratio; the wizard had no corresponding subject/ratio
controls and silently ignored the Agent's question. Added explicit bilingual
controls, forwarded these user answers through the existing session, and surfaced
the actual required question. Subject and dimensions are now included in the
compiled prompt. No subject is inferred from an unrelated answer.

Enhancement validation now runs on the same canonical snapshot and session before
the Agent. It remains advisory: defaults never replace user answers. Storage
failure now reports that the draft is only in memory, with export guidance.

## Verified production generation path

`LookersAIPage.createPrompt()` → `createApplicationGenerator()` →
`projectFromDraft()` → canonical Project + actual user-answer session →
`validateEnhancement()` → `Agent.run()` → complete decision →
existing `createDraftGenerator()` → existing anonymous Supabase transport →
existing `lookers-ai-generate` Edge Function → AI Layer → DeepSeek.

Incomplete, invalid or cancelled runs do not call the provider. The generation
contract remains `{prompt, language}` with the validated `{data, identity}`
response. The Agent is the existing deterministic bounded coordinator; no extra
paid reasoning request is introduced. Core, provider adapters, backend code and
authentication configuration were not changed in this repair.

## Automated and browser evidence

- Locked `npm ci`, TypeScript and all 136 tests pass: Core 7, Brain 13,
  Question Engine 29, Agent 35, Stage 05 35, UI 7, Library 6, Application 4.
- Edge Function bundling and production build pass.
- The previously failing browser regression passes: 13 actual desktop/mobile/
  Arabic viewports, with actual labelled local fallback and no paid inference.
- A separate real React browser journey passes 10 checkpoints in offline mode
  and again in live mode, without seeding project state or mocking AI success.
- Checks include empty input, all eight library entries, search, categories,
  curated picks, required customization, explicit tool selection, canonical
  missing-input recovery, reference upload and exclusion, unread PDF status,
  exact clipboard contents and Markdown download, editing, persistence, tool
  preparation, same-project continuation, Start Over, actual archive restoration,
  Improve, manual task override, Arabic mobile search and storage failure.
- Both browser runs report zero JavaScript runtime errors.

## Bounded live inference

Real browser origin: `http://localhost:5173` (already allowed by the backend).
Anonymous signup returned HTTP 200. Exactly two generation POSTs returned HTTP
200, with `deepseek` / `deepseek-flash` provenance and anonymous identity. No
retries or paid loops were performed.

| Call | Input tokens | Output tokens |
|---|---:|---:|
| Customized library project | 480 | 392 |
| Same-project continuation | 507 | 442 |
| Total | 987 | 834 |

The requests contain the approved included text, user subject and chosen 4:5
ratio, and exclude the sentinel text in the excluded reference. The missing-ratio
attempt makes zero provider calls. No credentials or identity tokens are stored
in this report.

## Release boundary and review

The final branch retains the original history. PR #1's earlier description was
stale about the Agent integration; the application integration is now tested
through both deterministic regression and actual browser inference.

The Pages workflow's `push: main` trigger was removed. Public deployment is a
separate manual workflow action and is not invoked. Generated `docs/` build
output is restored before commit; no generated site assets are committed by this
validation pass. CI retains offline inference and now includes application-gate
and real-user-journey regressions.

Final PR-head CI, unresolved review threads and mergeability must be checked
after committing these repairs; earlier-head success is not a final-head gate.
Merge is authorized only after all required checks pass. Stop after merge before
public deployment.

## Supported limits

The application creates editable prompts and prepares external tool handoff; it
does not execute another tool. Images are previews, PDF/Office contents are named
uninspected references, and excluded references do not reach generation. The
library's trending view is editorial curation, not a fabricated popularity feed.
Provider failure returns a labelled local draft; canonical missing inputs return
the actual question. Project storage is device-local, with visible failure and
export guidance when saving is unavailable.
