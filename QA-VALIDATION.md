# Lookers AI integration validation

## Studio redesign validation — 2026-10-17 (`abdo`)

Implemented against base `c9f4322cc6f4c1571246fd8b5668c8157b156d4d`.
The earlier integration report below is historical; its live inference evidence
is not a live inference test of this redesign.

- Restored shared website navigation; added the supplied architectural logo,
  pixel wordmark animation, star-point Lookers AI name and smaller click-only toolbar.
- Optional vision choices sit below the composer and write natural-language
  clauses into the brief without filling required questionnaire answers.
  The image branch has 38 alternatives across action, usage, style, material,
  lighting, composition and format. Other families currently add starter prose;
  their existing task questionnaires remain available.
- Questions use writable answers, optional suggestions below them and Egyptian
  Arabic explanations. User-described task text reaches both canonical context
  and the compiled prompt. References are inside the References step.
- Previous Projects restores actual stored drafts and results. Storage remains
  local to the browser; this change adds no cloud project synchronization.

### Completed checks

TypeScript, production Vite build and Edge Function bundle passed. Production
build verification uses `npm run build -- --outDir node_modules/.cache/studio-build`
to avoid committing generated `docs/` output. All 146 regression tests passed:
Core 7, Brain 13, Questions 29, Agent 35, Stage 05 35, Application 4, UI 7,
Library 6, Tools 7, Studio 3.

Actual Chromium browser checks passed:

| Script | Verified behavior |
| --- | --- |
| `scripts/visual-qa.mjs` | 13 actual bilingual desktop/mobile stage screenshots, labelled offline fallback |
| `scripts/user-journeys.mjs` | 10 checkpoints: library, required input, references/exclusion, copy/download, editing, persistence, continuation, archive restore, Arabic mobile and storage failure |
| `scripts/tool-directory-journeys.mjs` | 6 checkpoints: 16 task families, 17 tools, presentation routing, recommendations, exact clipboard handoff and mobile directory |
| `scripts/trends-header-qa.mjs` | Five click-only menus, 15 examples, keyboard access, unchanged draft and 12 bilingual layouts from 320–1440 px |
| `scripts/studio-journeys.mjs` | Dependent vision choices, manual text preservation, reload, required writing, free task description, reference inclusion in actual compiled result, archive restore, pixel animation and 8 bilingual result layouts |

Browser runs reported zero JavaScript runtime errors. No horizontal page overflow
was observed at the tested widths. Reduced-motion preference keeps the logo still;
normal motion was observed entering the mark and reassembling. These runs block
Supabase network calls and verify the disclosed local fallback. No new live
DeepSeek generation was performed for this redesign.

Validation and screenshot workflows now run on `abdo` pushes. This commit does
not modify the deployment workflow or promote a production release.

---

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
