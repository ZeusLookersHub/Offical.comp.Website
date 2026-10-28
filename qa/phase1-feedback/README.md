# Phase 1 — corrections from the five user screenshots

Baseline: `a8a6a4e8c8c58b1e7c10add8f274e4fab8324be2`, on the existing
`feature/lookers-ai-phase1-wormhole-integration` branch. Main website header,
Homepage, handoff assets, WebGL shader and provider transport are unchanged.

## Changes

1. **Mission viewpoint and symmetry.** Layout used transformed screen dimensions
   during the 0.6-to-1 view transition, which could collapse the vertical radius.
   Local client dimensions now drive layout. Missions use a face-on, equal-scale,
   symmetric arrangement on the four diagonals around the planet, with stable
   positions for reading. Labels wrap; the redundant central world label is hidden
   because the world name is already in the heading. Asteroid tumble, the Wormhole
   shader, background motion, hover/press and warp transitions remain in place.
   This mission-view change is explicitly requested by the new user feedback and
   supersedes the previous report's claim that all mission orbital motion is retained.
2. **Continue after receiving an AI reply.** Improve opens a revision form with an
   optional pasted AI response and a required requested change/addition. The existing
   project answers and references remain intact. A pure adapter appends reference
   context and user instructions, validates the existing request budgets, and feeds
   the existing canonical generation path. No new agent or Phase 2 orchestration.
   The result remains directly editable; a new result opens at the start of the
   prompt, while Improve scrolls to the revision form. Two successive revisions and
   reload/Previous Projects restoration were tested.
3. **Aspect-ratio references.** Numeric image/video ratios have correctly proportioned
   shape previews, including square, portrait and landscape. Mobile scaling preserves
   the ratio. Dashboard/file-format choices do not receive a misleading shape.
4. **Egyptian wording.** The existing Egyptian question copy is used in chat. The five
   image actions have clear Egyptian names and visible explanations, while canonical
   stored values are unchanged. Examples and placeholders are conversational, without
   the duplicated “مثال: مثال:” prefix. Accessible radio names and descriptions remain
   separate. Confirmation text follows the current interface language.
5. **Explicit optional-answer completion.** Successful refinement submission returns
   to the ready state, shows a saved confirmation and the explicit generation action.
   The stale optional input closes. A submission guard prevents duplicate sends.
   Another optional detail remains available by explicit choice. Old generation notices
   are cleared when a new answer is saved.

## Verification

- **187 unit/regression tests passed**, no failures, across the existing 184 tests
  and three new tests for continuation, budget/immutability and presentation values.
- TypeScript, production Vite build and existing AI function bundle passed. Existing
  large document-parser chunk warnings remain.
- The existing adaptive suite passed **10 journeys**, updated for the requested
  explicit confirmation after each optional answer.
- The existing scene suite passed **6 groups**, including actual WebGL, SVG fallback,
  reduced motion, context loss/restoration and resource cleanup.
- The feedback suite passed **5 groups**: all five worlds in normal motion at the
  supplied **1918×872** size, no card/card or card/planet overlaps, symmetric placement,
  Arabic 1024/768/390/320px layouts, ratio previews and Egyptian action descriptions,
  single optional submission and explicit generation, two continuation cycles and
  persisted restoration. A final chat-only run verified the result/form scroll change
  and the mobile ratio orientation. No JavaScript runtime errors were recorded.
- Local browser: Chromium 134, software WebGL, selected through the optional
  `QA_CHROMIUM_EXECUTABLE` setting. CI uses the repository's configured Chromium.

These browser runs deliberately fail provider requests and assert the application's
explicit local-compiled fallback. Successful live AI inference is **not** claimed;
that upstream authentication/provider verification remains an existing launch blocker.
The canonical Agent path is retained. No production deployment or merge to main.
Hardware performance and the separate Homepage branch conflicts are outside this
feedback patch and remain as documented in the earlier Phase 1 report.

## Evidence

- [Desktop mission view](desktop-marketing.png), [mobile missions](mobile-missions.png)
- [Ratio shapes](ratio-previews-ar.png), [mobile ratios](mobile-ratio-previews.png)
- [Egyptian image actions](egyptian-image-choices.png), [mobile choices](mobile-egyptian-choices.png)
- [Saved and ready state](saved-ready-state.png), [restored revised result](mobile-continued-result.png)
- [Full feedback run](full-browser.json), [final chat run](final-chat-browser.json)
- [Adaptive regression](adaptive-regression.json), [scene regression](wormhole-regression.json)
- [Unit counts](unit-tests.json), [changed-file list](MODIFIED-FILES.md)

Run `npm run test:feedback` and `npm run test:feedback-journeys` for the new coverage.
The existing adaptive and scene suites remain available and run in CI. A focused
chat-only rerun can use `FEEDBACK_CHAT_ONLY=1`; the normal CI run always includes
all feedback checks. Exact final-head CI and Preview links are supplied in delivery.
