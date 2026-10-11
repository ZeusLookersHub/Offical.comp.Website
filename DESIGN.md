# Lookers AI — implemented visual direction

The user approved the visual direction on 11 October 2026 through the UI implementation brief and two supplied PromptForge reference images. This supersedes the earlier conservative composition study. It is a visual direction approval, not acceptance of a fully browser-verified implementation.

## Source and identity

Application source: ZeusLookersHub/Offical.comp.Website, existing branch `stage01-core-foundation`, Draft PR #1. Preserve Stage 01–05 architecture and authenticated anonymous generation. The existing AI transport remains connected; live DeepSeek HTTP 200 was verified in the preceding implementation session, not rerun for this visual change. No provider secrets or model configuration belong to UI.

References supplied: `WhatsApp Image 2026-10-08 at 12.42.59 AM.jpeg` and the `(1)` variant. They establish a centered hero, a large idea composer, charcoal surfaces, restrained luminous card borders, cyan/violet/magenta ambient accents and static constellation lines. The earlier UX board establishes hierarchy and continuity, not final visual treatment. No PromptForge name, logo, metrics, testimonials, generated sample outputs or exact layout are copied.

## Visual system

- Primary gold: `#E6C15A`; hover `#F1D77E`; gold button ink `#14110A`. Gold remains the action/selection color.
- Foundation `#05070A`; surfaces `#0E1115`, `#14181D`, translucent charcoal gradients.
- Text `#F5F6F7`; secondary text `#B0B7C2`; input boundary `#697786`.
- Secondary cyan `#79CDD3`, violet `#B8A7E8`, magenta `#C997D8`, teal `#80D4B4`. Restricted to guidance cards, minor emphasis and ambient decoration.
- Reuse the existing BrandMark; Outfit English and Almarai Arabic. No alternate branding.
- Hero type 38–72 px desktop, 34–46 px mobile. Body/controls generally 14–18 px. Card radius 14–22 px. Main controls at least 44 px. Subtle elevation, no scanlines, continuous ambient animations or busy prompt backgrounds.
- Focus uses gold with a visible offset; selected choices have borders and pressed state, not color alone. Decorative network SVG is hidden from accessibility APIs. Reduced motion disables transitions and spinner animation.

## Interaction presentation

Home starts with a centered idea composer before the optional reference panel. Four luminous guidance cards prefill an editable idea; they do not select or override routing. Existing task detection and Question Engine adapter remain unchanged.

Workspace shows the existing project fields in a supporting plan. One task-specific question is shown at a time; user answers remain editable. Optional context/constraints/output and advanced planning are progressively disclosed. The existing task selector is an expandable correction control. Selection is explicit user choice; the UI does not label invented inference as confirmed.

References preserve included/excluded flags. Browser-read text is labelled as a text excerpt, images as preview-only, other files as not inspected. The upload status is separate from inclusion. A file never becomes an instruction to follow.

Result supports copy, editable saved prompt, download, project export/import, brief review and clear local fallback. “Built from your brief” is a concise description of the structure, not hidden reasoning or a claim of proven effectiveness.

Handoff explains copy → use the same references in the chosen external tool → run there → return. It says prepared, not executed. No invented integration, tool registry or automatic external execution is added.

Continuation accepts a pasted response and Fix/Improve/Continue/Explain intent, saves it as labelled untrusted context on the same existing project and returns to review before another generation request. Screenshots use the existing reference upload; vision is explicitly unavailable. This is a UI bridge over existing generation, not a new repair/Agent engine. The pasted text becomes persisted when the user chooses Review next step. It does not automatically run paid inference.

Archived project history is local only. Opening an archive preserves the active project and swaps it into history. Start Over, autosave, bilingual fields and canonical state adapters are preserved. There is no fabricated trending feed or cross-device library; those remain future product areas.

## Responsive and Arabic

Desktop: primary workspace plus 310 px plan/reference column. Below 1000 px the side column is 270 px; below 800 px the conversation comes first with supporting panels below. Mobile guidance cards use two columns, optional fields become one column and controls wrap. Use safe-area spacing and logical inline properties. Root prevents decorative overflow.

Arabic is a true RTL layout with Almarai and increased hero line height. Directional navigation arrows mirror. BrandMark, photos, aspect ratio values and non-directional icons do not mirror. Brand text remains English. Inputs retain readable sizes on mobile.

## Validation and limits

Local validation passed: npm ci, TypeScript, Core/Brain/Question Engine/Agent/Stage 05 offline regressions, seven UI server-render regression tests and production build. The UI tests check rendered semantics and escaped content; they do not exercise browser events or certify visual layout. Existing Stage 05 workflow covers the same branch and preserves provider isolation.

Browser validation is currently blocked: the cloud browser cannot reach the workspace Vite server at 127.0.0.1:3000 (ERR_CONNECTION_REFUSED). Code-level responsive/accessibility critique and repairs were performed; screenshots, actual wrapping, keyboard paths and full end-to-end interactions require a reachable preview. Do not claim browser acceptance from typecheck/build alone.

No Stitch prototype was created. Stitch is not required to implement this approved direction directly in the existing React UI. No public deployment, PR merge or subsequent engine stage is part of this change.
