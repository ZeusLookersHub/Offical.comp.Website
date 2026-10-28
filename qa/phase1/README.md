# Lookers AI — Phase 1 Wormhole integration

Integration branch: `feature/lookers-ai-phase1-wormhole-integration`.
Validated on 2026-10-28. No merge to main or production release.

## Baseline and conflicts

- Baseline: `8284feaaec5119b3cb7ce16b9dbba361f6fdf4b9`, the latest fetched
  `feature/lookers-orbital-hero` head. It includes the specified adaptive backend
  commit `bf8a73a77933f10fdca6c74d21e1396b2afce6dd` and subsequent chat UI fixes.
- Source: `5344faa9fa8af40be20d4188525a8e7e1982cf24`. The 36-file handoff package
  is retained unchanged. All 34 manifest entries verify. The source branch is
  based on older main and cannot safely serve as the backend baseline.
- All 10 remote branches were fetched. Open PR #3 targets main from `abdo`
  (`c763b7617db8b2abda1c07ab8dbf533e939c9b69`) and covers earlier navigation,
  studio and bilingual trends work; it is not the adaptive chat baseline.
- A non-working-tree `git merge-tree` check against Homepage branch head
  `48e3dea96033d69e73ad474eede5fdd3fe183a01` found actual content conflicts in
  `App.tsx`, `components/Header.tsx`, `pages/LookersAIPage.tsx`, and
  `pages/LookersAIPage.css`. These were reported before any resolution.
  That branch was **not merged**, and these cross-branch conflicts remain unresolved.
- Main website header, App, Homepage and all backend source files are unchanged
  relative to the selected baseline. This integration does not include the
  separate Homepage branch's newer marketing frames/site-page work.

## Implementation

`components/wormhole/` contains React/TypeScript scene and eye components,
separate source-identical shader strings, original world/task content, scoped
styles and a lifecycle-managed instance port of the recovered JavaScript Motion
Kit. Original texture and image assets are imported from the intact handoff.
The original orbital speed, flow, shader grading, hover/press behavior, planet
art, light spill and transition timing are retained. Viewport-aware mission
orbit limits reserve room for Arabic labels on shorter screens.

The existing headers continue to own their layout. Mission selection calls the
existing Phase 1 selection adapter; question progression, optional refinements,
real transport, prompt compilation, canonical `Agent.run()` path and storage
contracts remain unchanged. Previous Projects is accessible on the scene and
restores the selected saved result into chat. A legacy reduced-motion hover rule
was narrowed so it cannot erase orbit positioning.

Each scene owns its background, listeners, timers, orbit controllers and RAF.
Unmount cancels work and removes listeners; WebGL cleanup deletes its texture,
buffer, program and both shaders. The original SVG remains available during
loading, texture/shader failure, unavailable WebGL and context loss. Restoration
recreates resources. Reduced motion renders static frames and reacts to preference
changes. Cormorant Garamond is bundled locally under its OFL license.

No Phase 2 orchestration, new backend, fabricated AI output or screenshot-based
scene replacement was introduced.

## Verified results

| Check | Result |
| --- | --- |
| Existing regression suites | 182 passed, 0 failed |
| Handoff integrity and exact shader tests | 2 passed, 0 failed |
| TypeScript | Passed |
| Production Vite build | Passed; existing large parser chunk warnings |
| Existing AI function bundle | Passed |
| Adaptive browser suite | 10 journeys; no JavaScript runtime errors |
| Wormhole browser suite | 6 groups, 14 geometry checkpoints; no console errors |
| Layouts | 1440×900 desktop; 1024/768/390/320×844, Arabic and English |
| WebGL | Actual compiled shader, changing framebuffer, original texture, spill |
| Fallback | Actual unavailable WebGL and loss/restoration exercised |
| Cleanup | Deletion of texture/buffer/program/two shaders observed on chat entry |
| Reduced motion | No ongoing scene RAF requests; static WebGL and SVG tested |
| Persistence | Reload + Previous Projects restored the identical generated prompt |

Local browser: Chromium 134.0.6998.35, headless software WebGL. The repository's
Playwright 1.62.1 browser download (Chromium 151) returned invalid/truncated ZIPs
in this environment. An independently installed Playwright 1.51.1 supplied the
local Chromium executable through `QA_CHROMIUM_EXECUTABLE`; repository dependencies
were not downgraded. CI uses the repository's normal configured browser installer.

The automated adaptive suite deliberately simulates provider transport failure
and verifies the honest local fallback. Separately, `phase1-live-smoke.mjs` used
the integrated UI and the real, unmocked transport with a fictional perfume brief.
The anonymous Supabase `/auth/v1/signup` request failed with `net::ERR_EMPTY_RESPONSE`
before provider generation. The app correctly disclosed the local compiled
prompt. **Successful live provider inference is not claimed.**

Software WebGL performance sample: 60 frames, mean **293.8 ms/frame**, maximum
**700 ms**. This environment is slow and is not evidence of acceptable GPU-backed
desktop/mobile performance. No physical phone/tablet was available.

## Evidence and reproduction

- [Desktop scene](desktop-wormhole.png), [desktop conversation](desktop-chat.png)
- [Arabic mobile scene](mobile-wormhole-ar.png), [mobile missions](mobile-missions-ar.png)
- [Mobile SVG fallback](mobile-svg-fallback.png), [restored mobile result](mobile-result.png)
- [Unit suite counts](unit-tests.json), [scene checks](wormhole-browser.json),
  [adaptive chat checks](adaptive-chat-browser.json), [real transport attempt](live-generation.json)
- [Complete changed-file list](MODIFIED-FILES.md)

Run `npm ci`, `npx tsc --noEmit`, the `test:*` unit commands listed in package.json,
`npm run build:ai-function`, and `npm run build -- --outDir node_modules/.cache/phase1-build`.
Run `npm run test:adaptive-journeys` and `npm run test:wormhole-journeys` after
installing Chromium. `QA_CHROMIUM_EXECUTABLE` may select an available executable.
`node scripts/phase1-live-smoke.mjs` explicitly makes a real provider-transport
attempt and is intentionally not an automatic CI step.

## Remaining launch blockers

1. Successful unmocked anonymous authentication and provider generation must be
   verified in the intended deployment environment; this session could only
   verify the disclosed fallback.
2. Real GPU-backed desktop, tablet and phone performance must be checked. The
   software-rendered sample above is too slow to certify motion smoothness.
3. Homepage/AI branch consolidation still has the four recorded conflicts. It
   needs a separate reviewed integration if the newer Homepage is the launch target.
4. Exact-head CI and Vercel Preview outcomes are reported separately with the
   final commit SHA and URLs; no production promotion is authorized.
