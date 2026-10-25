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
- Hero type 30–44 px desktop, 27–32 px mobile; workspace hero 24–30 px (23 px mobile). Section headings 17–21 px. Body/controls generally 13–16 px. Mobile editable inputs stay at 16 px. Card radius 10–16 px. Main controls at least 44 px. Subtle elevation, no scanlines, continuous ambient animations or busy prompt backgrounds.
- Focus uses gold with a visible offset; selected choices have borders and pressed state, not color alone. Decorative network SVG is hidden from accessibility APIs. Reduced motion disables transitions and spinner animation.

## Interaction presentation

Home starts with a centered idea composer before the optional reference panel. Four quiet guidance cards with small secondary-color icons prefill an editable idea; they do not select or override routing. Existing task detection and Question Engine adapter remain unchanged.

Workspace shows the existing project fields in a supporting plan. One task-specific question is shown at a time, before optional context and routing controls; user answers remain editable. Optional context/constraints/output and advanced planning are progressively disclosed. The existing task selector is an expandable correction control. Selection is explicit user choice; the UI does not label invented inference as confirmed.

References preserve included/excluded flags. Browser-read text is labelled as a text excerpt, images as preview-only, other files as not inspected. The upload status is separate from inclusion. Filename, preview and inclusion remain visible; file size/type and editable notes are inside a native Details & note disclosure. A file never becomes an instruction to follow.

Result puts Copy (gold), Edit, Improve (returns to existing review), and Download directly after the readable prompt. Project export/import and editing remain in a Project options disclosure; Built from is another disclosure. Clear local fallback is preserved. “Built from your brief” is a concise description of the structure, not hidden reasoning or a claim of proven effectiveness.

Handoff explains copy → use the same references in the chosen external tool → run there → return. It says prepared, not executed. ChatGPT/Claude/Gemini/Other are presentation-only handoff choices: the same prompt is copied, with no external request or tool-specific compilation. No invented integration, tool registry or automatic external execution is added.

Continuation accepts a pasted response and Fix/Improve/Continue/Explain intent, saves it as labelled untrusted context on the same existing project and returns to review before another generation request. Screenshots use the existing reference upload; vision is explicitly unavailable. This is a UI bridge over existing generation, not a new repair/Agent engine. The pasted text becomes persisted when the user chooses Review next step. It does not automatically run paid inference.

Archived project history is local only. Opening an archive preserves the active project and swaps it into history. Start Over, autosave, bilingual fields and canonical state adapters are preserved. There is no fabricated trending feed or cross-device library; those remain future product areas.

## Responsive and Arabic

Desktop: primary workspace plus 280 px plan/reference column. Below 1000 px the side column is 270 px; below 800 px the conversation comes first with supporting panels below. On mobile, project context is collapsed behind an accessible toggle; desktop context remains visible. Mobile guidance cards use two columns, optional fields become one column and controls wrap. Use safe-area spacing and logical inline properties. Root prevents decorative overflow.

Arabic is a true RTL layout with Almarai and increased hero line height. Directional navigation arrows mirror. BrandMark, photos, aspect ratio values and non-directional icons do not mirror. Brand text remains English. Inputs retain readable sizes on mobile.

## Refinement — 11 October 2026

The latest generated visual overview is an approximate design reference, not a screenshot of the application. Refine its direction toward premium + simple, without recreating the application. Keep gold for primary actions/selected states, a compact gold hero highlight and the existing identity. Remove the obsolete orange polygon atmosphere, reduce ambient alpha to .075/.08, reduce network alpha from .45 to .22 (.13 mobile), and reduce nodes from ten to six. Cards use solid charcoal surfaces and modest elevation; shortcut cards have no glow. Decorative network height is limited to the hero region, and opaque inputs/content surfaces keep text areas clean.

The refinement preserves the existing project, question, provider and cancellation contracts. The Prompt Library adds eight bilingual authored starting points, searchable categories, featured/recommended/local recent/editorial picks, customizable required inputs, and tool preparation. Selecting a template starts a validated canonical project and retains the previous project in the existing archive. No reference, generated result, popularity metric or user fact is fabricated.

## Actual browser verification

Local Chromium runs alongside the existing Vite server. Raw desktop (1440×900), mobile (390×844) and Arabic RTL screenshots verify the home, workspace, question, references, result, and library. Fonts and Tailwind now ship with the application, removing reliance on external CSS/font CDNs. The script waits for fonts, images and the application loader, rejects horizontal overflow, and records runtime errors.

The CI visual workflow is offline and intentionally verifies the labelled local generation fallback. It contains no provider secrets and performs no paid inference. Live verification is opt-in; proxy options are confined to the test harness, not application networking or authentication.

## Release gate

TypeScript, existing Core/Brain/Question Engine/Agent/Stage 05/UI tests, library regressions, Edge Function bundling and the production build are required. The new library regression is included in the existing validation workflow. Actual browser checks cover uploads and exclusion, generation/fallback, prompt editing/download, tool preparation, continuation, library customization, local recents, search empty state, persistence and archive restoration.

Do not infer merge readiness from visual acceptance or passing unit tests alone. The existing result-generation action calls the accepted transport directly; the bounded Agent and enhancement services are tested separately and are not currently invoked by that UI action. This integration gap must be resolved and reviewed before claiming the full master execution gate passes. Core, Brain, Question Engine, Agent, provider, Edge Function and anonymous authentication implementations have not been rewritten.

Public deployment is not authorized. Merging to main triggers the existing GitHub Pages deployment workflow, so the PR must remain unmerged.

## Lookers AI universe — 25 October 2026

The orbital master image is no longer used as a page layer: it is a full-page mockup with a baked header, navigation and English labels, which duplicated the real headers and blocked Arabic. It remains the visual reference.

- The cosmos is a real-time Three.js scene (`components/universe/`) fixed behind the whole Lookers AI page: procedural nebula and stars, five shader-rendered planets with luminous filament rings and moons, floating debris and framing rocks. Three.js loads on demand in its own chunk.
- Every word (headline, world names, subtitles, tasks) is DOM text positioned over its 3D body each frame, so Arabic RTL and English share the same quality. Positions use the CSS `translate` property so page-wide button press styles never move hit areas.
- Separate landscape (desktop) and portrait (mobile) compositions for the worlds and for the focused world. Task asteroids are irregular, cratered rocks; in Arabic the task order mirrors (01 on the right).
- Stage 1 → 2: the chosen world travels to the centre, the others drift out, the sky dims (the approved fade), and four asteroids launch from the world onto a dashed orbit. Escape or “All universes” returns. During the chat the cosmos stays as a calm backdrop with the chosen world resting at the edge.
- Reduced motion renders single frames on demand with no animation loop; no WebGL falls back to a static, fully usable layout.
