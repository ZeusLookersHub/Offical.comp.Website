# Stage 03 — Question Engine

This stage adds schema-driven questioning to the existing Core. It does not install
an inference adapter, change the backend, or implement later roadmap stages.

## Contracts

- `getQuestionSchema(engineId)` reuses the canonical engine registry. Universal
  bindings read existing Project fields; specialized values use `details.*` in a
  `QuestionSession`, scoped by project ID and engine ID. No universal schema migration.
- `evaluateQuestions(input)` is synchronous and deterministic. Definitions specify
  required/conditional/optional policy, factual/creative/technical nature,
  criticality, inference eligibility, dependencies, bilingual labels and priority.
- Resolved fields expose known, missing, inferable, critical, optional, answered,
  or needs_confirmation. Inactive conditional fields remain marked inactive.
- Required fields outrank optional enhancements, then criticality, quality priority,
  dependency unlock count and stable ID decide the next question. Unresolved
  prerequisites are asked first. Progress measures required information only.
- Result status is needs_question, needs_confirmation, complete, or invalid.
  Invalid schemas and impossible required dependencies never report completion.
- `answerQuestion` applies validated user answers immutably. Universal bindings update
  the Project; specialized answers stay in the returned session. Callers own time and
  persistence. Archived projects cannot be updated. New answers clear unconfirmed
  suggestions so they cannot silently survive a changed brief.

## Trust and inference

Explicit user answers (including clearing a saved UI answer) take precedence over
canonical data, reference evidence, defaults and unconfirmed suggestions. Existing
canonical fields are treated as supplied facts; callers must not write unconfirmed
model output directly into the canonical Project.

ReferenceEvidence is a **trusted caller boundary**, not a parser or authenticity
detector. The caller must inspect and approve the source-to-field mapping. The engine
also requires an included reference with readable text, an exact excerpt in that text,
and a value present in that excerpt. Filenames, URLs, binary attachments and excluded
files cannot supply facts. Conflicting evidence requires a user answer. No extraction,
cross-project search or Reference Intelligence is introduced in this stage.

`inferQuestion` accepts an optional provider-neutral port. It makes at most one bounded
attempt for the next safe nonfactual, noncritical question. It sends only resolved safe
creative/technical fields, never the Project, attachments or factual fields. Strict
field/value/confidence validation rejects malformed results; valid suggestions require
an explicit user answer. A caller-provided `confirmed` flag cannot confirm an inference.
Unavailable ports, errors and timeouts leave the deterministic question available.
There is no provider implementation or live inference in Stage 03.
An input changed during inference rejects the late response. Callers using immutable
state must also compare their current revision before applying a returned session.

Definitions are trusted application configuration, validated at runtime. Their nature
classification must be accurate: names, identities, prices, credentials, financial
values and other facts must be factual and never inferable. Safe explicit defaults
are conditional, e.g. Instagram Story => 9:16; generic Instagram usage does not imply
a ratio. User overrides always win.

## Integration scope

`questionsFromBrain` consumes resolved Brain routes through the existing apply helper.
Ambiguous routes stay unresolved; Brain hints are not imported as factual answers.
Engine changes invalidate session reuse. A caller-provided schema for the previous
engine is rejected rather than silently applied to the new engine.

The First Draft adapter converts existing `data/lookersAi.ts` questions into definitions
and supplies current saved answers. The page delegates completeness, missing-question
priority and field visibility to it. All editable controls, examples, saved answer IDs,
RTL, uploads, routes and Start Over behavior remain in place. Controls keep their
positions during typing. Full one-question-at-a-time UI, persisted inference sessions
and live Brain-driven task replacement are intentionally outside this minimal integration.

## Verification and critique

Run `npm ci`, `npx tsc --noEmit`, `npm run test:core`, `npm run test:brain`,
`npm run test:questions`, and `npm run build`. The Stage 03 workflow runs the same gate.
GitHub Actions must pass before Stage 03 is accepted.

The first test pass exposed null-schema fallback. Critique additionally identified
missing default conditions, false completion through inactive prerequisites, and stale
inference after edits. Repairs reject those schemas/dependencies and invalidate old
suggestions; focused regression tests cover each repair. The test runner executes its
bundled module directly, matching Stage 02, because explicit test discovery under
node_modules is excluded by the local Node runner.

No Supabase changes, secrets, provider/model changes, deployments, repository resets,
history rewrites, main-branch writes or PR merges are part of this stage.
Stage 04 is not started.
