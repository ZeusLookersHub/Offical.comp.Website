# Adaptive chat backend contract

No frontend components were changed. This phase exports headless functions from
`services/lookersAiChatWorkflow.ts`; Claude can wire them into the existing chat.

## Required interview

- `nextChatTurn(draft, lang)` returns one required question, or `status: 'ready'`
  with `promptReady: true`. Reliable explicit context and confirmed answer aliases
  skip matching questions. A sparse video takes the idea plus four follow-ups;
  a sufficiently explicit idea can be ready immediately.
- `submitChatAnswer(draft, lang, id, answer)` validates the active question and
  returns `{ok: true, draft, turn}` or a failure without changing the input.
  Persist only the returned draft. Text answers have a 4,000-character limit.
- Required image ratio/subject and objective questions respect the existing Agent
  requirements. A fixed question count never overrides missing necessary facts.

## Optional phase

- When the required turn is ready, generation is immediately available through
  the existing application generator. No refinement completion check is needed.
- `getChatRefinements(draft, lang)` returns
  `{phase, canGenerate, canSkip, questions}`. Before readiness it returns no
  optional questions and `canGenerate: false`. Afterwards both flags are true,
  even when unanswered optional questions remain.
- Offer these questions only if the user opts into refinements. The frontend may
  show any available refinement or dismiss individual questions locally.
- `submitChatRefinement(draft, lang, id, answer)` validates and saves an available
  refinement. Recompute `getChatRefinements` after each success: selecting
  `videoAudio: 'voiceover'` reveals optional `voiceoverScript`; silent/music audio
  does not. Required `turn` remains ready after every successful refinement.
- `skipChatRefinements(draft, lang)` returns the required turn without writing
  answers or mutating the draft. The frontend dismisses the optional panel and
  can generate immediately. Dismissal is UI state, not a fabricated user answer.

## Explain

- Required: `explainChatQuestion(draft, lang)`.
- Optional: `explainChatQuestion(draft, lang, refinementId)`.
- Returns contextual help or `null`. Both are read-only; never call submission
  from an Explain button. Arabic copy uses Egyptian colloquial speech and a
  relevant example; English copy uses English. No model calls or storage writes occur.

## Explicit context and generation

Extraction is deterministic and conservative: timings (including Arabic digits),
ratios, destinations, labelled facts (`audience:`, `goal:`, `scene:`, `output:`,
`tool:` and Arabic counterparts), and explicit prose markers such as `targeting`,
`in order to`, `output as PDF`, `using Canva`, `video of a perfume bottle`.
Vague content is left unanswered. Conflicting ratio/timing candidates are not
chosen automatically. Platform names never imply an aspect ratio or audience.
Existing confirmed values and selected task types win over extraction, including
canonical aliases. This is bounded rule-based extraction, not unrestricted NLU.

All collected answers, including optional answers and selected tools, remain in
`ProjectDraft.answers`. The shared answer-context serializer supplies them as
user data to `projectFromDraft()` and `compileLookersPrompt()`. Existing canonical
objective fields take precedence over workflow aliases. Tools and requested
output also reach the canonical schema. This is compatibility mapping, not a new
generator or provider route:

`ProjectDraft -> projectFromDraft() -> Agent.run() -> existing generator -> transport`

The Agent and enhancement gates still control provider access. Interview readiness
is not external-action authorization. DeepSeek configuration and transport are
unchanged. No live frontend integration or production deployment is claimed.
