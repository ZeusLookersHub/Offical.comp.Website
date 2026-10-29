# Expanded Phase 1 orbits and workflow review

Branch: `feature/lookers-ai-expanded-orbits`. Runtime integration first committed as `43d2311cf2fe7a0d6ffd4dbf8f2709e0a251ee0c`; subsequent changes correct the smallest viewport and update old browser-journey expectations.

- Eight visible missions per world, 40 entries total, representing 38 distinct registered topics. Two selectable orbit groups show four targets each; they do not render eight overlapping labels at once.
- Mission orbit rotates at a constant face-on scale, pauses for hover and keyboard focus, and respects reduced motion. The smallest viewport uses a smaller centre planet and measured safe margins.
- Each selection supplies an explicit topicId, task type and content type. Existing family questions are augmented by one task-specific field. Existing answer IDs, persistence, prompt compilation and Agent.run() remain authoritative.
- Help and input hints use the current question's explanation/example, rather than borrowing the first matching ID from another workflow family. Marketing `offer` is passed to the canonical business-facts field only when no canonical product answer exists.
- No main-header/Homepage edits, production deployment, merge to main, Phase 2 orchestration or provider configuration changes.

## Archify

Unzip `archify-review.zip`, then open `workflows.html` and `deepseek.html`. Both are standalone HTML generated with Archify 3.2, source revision `e3920894b0f30db7d5fc7d7d4ece57b304c17015` from `tt-a1i/archify`. Candidates, repository evidence, inventory and passing automated-check receipts are included. Diagrams pin their evidence to integration commit `43d2311...`; later viewport/test changes do not change those traced responsibilities.

`workflows.html` covers the interview lifecycle and all 14 family definitions, their registered topics, exposed missions and specialized questions. There are 138 registry topics; registration does not imply that each has its own bespoke interview. `deepseek.html` distinguishes the normal generation path from the optional, currently unwired reasoning adapter.

DeepSeek reformulates a compiled brief through a server-side provider adapter. The interview engine and its explanations are local code. The ordinary application generator creates Agent without a reasoner. Selecting an AI Agent or Automation mission prepares a prompt brief; it does not execute an external agent or workflow.

## Verification

233 automated unit/contract tests passed locally; TypeScript, Vite production build and AI-function bundling passed. `test:expanded` includes 46 tests: 40 bilingual mission routes, five inventories and one invalid-selection check. Every exposed route reaches the canonical Agent gate and the existing transport using a contract fixture; fixture output is not a live model response.

Browser evidence is recorded in the adjacent JSON reports and screenshots inside the archive. The expanded suite passed 55 checks across 320, 390, 768, 1440 and 1918-pixel viewports. The expanded-orbit test computes complete 360-degree geometry from actual application measurements; real frame movement, hover/focus pause, reduced motion and second-orbit routing are also exercised. Adaptive journeys cover generation fallback, optional answers, attachments and persistence. Existing feedback and WebGL lifecycle tests are retained.

Live DeepSeek generation remains unverified. The checked-in server origin allowlist includes lookershub.com and two localhost origins, but no Vercel preview hostname. The deployed function configuration has not been established by these tests. Browser QA deliberately blocks the provider and verifies the disclosed local fallback. Software WebGL is slow in the available headless environment; real hardware performance is still a launch check.
