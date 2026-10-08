# Stage 04 — bounded Agent orchestration

## Scope and contracts

`Agent.run` consumes the existing canonical Project, an optional BrainDecision,
an optional Stage 03 QuestionSession/reference evidence, an optional cached
QuestionEngineResult, and explicit application tool operations. It returns an
AgentDecision, the unchanged Project snapshot, fresh question state, bounded tool
trace, normalized errors and fallback warnings. `complete` means ready or requested
operations completed, **not** that a prompt was generated or a later stage executed.

The Agent does not route engines, invent questions, generate facts, apply inferred
answers, modify canonical fields, or change reference inclusion. It reuses Core
validation/engine definitions and Stage 03 evaluation/definitions. A cached question
result must equal a fresh evaluation, so a forged `complete` cannot skip questions.
Brain ambiguity or disagreement with the chosen engine returns needs_confirmation;
the application owns explicit route changes. Missing Brain input is valid when the
canonical Project already selects an engine.

No UI changes are required. The Agent is independently usable through its exported
contract; the existing wizard remains on its accepted First Draft path. Future UI
wiring and AI Layer capabilities require separate controlled work.

## Execution and tools

Each run snapshots its input. Missing information or confirmation stops before tools.
Explicit application operations run first. An optional AgentReasoner may subsequently
choose permitted read tools or completion. Each tool call consumes one step. Default
limit: 6; hard maximum: 16. The final completion decision does not consume a tool step.
Reasoning calls are bounded by the same loop. Repeated identical calls (independent of
object-key order) stop with tool_loop; distinct calls stop at step_limit.

Every asynchronous call has a cancellation signal and one timeout (default 1000 ms,
maximum 10000 ms). There are no retries. Timers are cleared and late results ignored.
Timeouts cannot roll back effects in a non-cooperative custom port: ports must check
cancellation before committing. Trusted synchronous implementations must terminate;
this is orchestration, not a sandbox for arbitrary user-supplied code.

| Tool | Stage 04 behavior |
| --- | --- |
| get_project_schema | Validated canonical schema view with only included references; original Project is preserved |
| get_engine_definition | Current engine from Core's existing registry |
| get_question_definition | Existing Stage 03 definition by question ID |
| get_tool_profile | Explicit unavailable result; no Stage 06 profiles |
| get_reference | One existing included reference in this project; no extraction or network access |
| validate_prompt | Text shape/length check only; no quality or factual certification |
| save_project_state | Explicit application capability and persistence port required |
| get_owner_memory | Matching non-null owner grant required; still unavailable, no Memory system |

This registry contains Agent operations only. It is not the later product Tool Registry.
Tools reject extra input properties. Reads validate result equality against authoritative
Core/Project data; even a well-shaped fabricated result is rejected. Unknown tools,
invalid input/output, denied access, unavailable functionality, exceptions and timeout
produce structured failures and stop the run. Tool implementations receive isolated
data, and rejected outputs/raw exceptions are never exposed in the trace.

## Trust, persistence and reasoning

AgentAccess, tool implementations, repository/AI ports and ReferenceEvidence come
from the trusted application composition boundary, not model output or raw HTTP input.
The application must authorize the current user's project before constructing access.
An ID match alone is not user authentication. Owner memory remains unavailable even
when authorization succeeds. Stage 03's trusted evidence mapping rules still apply.

The reasoner receives only engine ID, locale, available read-tool descriptions,
remaining budget and tool outcome metadata. It receives no names, project contents,
attachments, prompts or tool output values. It cannot patch state, initiate saves,
read owner memory, or create new tools/questions. Response fields, confidence and
tool IDs are allowlisted; accepted responses are copied to prevent late mutation by
the port. Unavailable, timed-out or malformed reasoning returns deterministic readiness
with a warning, only after required information has already been satisfied.

`services/lookersAiAgentPersistence.ts` checkpoints an existing application-approved
Project through ProjectStateManager/ProjectRepository. It rejects altered snapshots,
foreign/current-project changes and stale content even when timestamps match. It
preserves wizard sessions and all other projects. It performs no direct storage access.
New user edits continue through the existing application save path first. This stage
does not add model-authored updates, session persistence or a new Project model.

Request/result validation rejects cyclic, excessively deep/large, accessor-bearing,
symbol-bearing and non-data structures. As with all in-process contracts, callers
must supply ordinary application/parsed data, not executable proxy objects.

## AI Layer and backend

No live inference, provider adapter, backend migration, auth UI or deployment change
is needed for this stage. The existing prompt-generation endpoint is not treated as
an Agent reasoning endpoint. Its real deployed source remains outside Git; this known
source-control gap is unchanged and requires a later controlled synchronization task.

## Test and critique gate

Run npm ci, npx tsc --noEmit, npm run test:core, npm run test:brain,
npm run test:questions, npm run test:agent, npm run build.

The handoff calls the Question Engine script `test:question-engine`, but the accepted
repository owns `test:questions`. The Stage 04 workflow uses that existing script;
only test:agent is added, without renaming scripts or changing dependencies/lockfile.
CI uses Ubuntu and Node 22. Local verification alone does not constitute acceptance.

Initial typechecking caught insufficient narrowing of unknown tool input. The first
complete gate passed 32 Agent tests. Adversarial critique then reproduced three issues:
excluded-reference disclosure through schema reads, accessor evaluation, and retained
mutable reasoner responses. The repaired boundaries have three additional regression
tests. Other adversarial coverage includes invalid cached question state, unauthorized
saves, stale snapshots, invented facts, malformed tool outputs, timeouts and loops.

Stage 05 and later stages are not implemented. PR #1 remains draft and unmerged.
