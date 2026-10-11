# Lookers AI tool directory

The task is primary. Library templates initialize the existing project workflow without requiring a tool. After the general prompt is ready, the user can choose a recommended destination, copy the prompt and open its official website. No integration, automatic submission or external execution is implied.

The directory covers all 16 task families. Presentation maps to the existing canonical `powerpoint` engine; provider credentials and transport remain unchanged. Recommendation scores combine task membership, intended output, modality, verified capabilities, explicit tool preferences and editorial featured/curated state. Equal scores preserve editorial order. Presentation intent has deliberate pitch, business, data and education priorities.

## Verification

Official product and capability sources checked on 2026-10-11. Descriptions summarize capabilities rather than copying vendor claims. Availability depends on each external product. Links are clean HTTPS official destinations and use `target="_blank" rel="noopener noreferrer"`.

| Tool | Official destination | Capability source |
| --- | --- | --- |
| Gamma | https://gamma.app | https://gamma.app/products/presentations |
| Canva | https://www.canva.com | https://www.canva.com/create/ai-presentations/ |
| Beautiful.ai | https://www.beautiful.ai | https://www.beautiful.ai/presentations |
| Microsoft PowerPoint / Copilot | https://www.microsoft.com/en-us/microsoft-365/powerpoint/ai-powerpoint-generator | https://support.microsoft.com/en-us/powerpoint/copilot/create-a-new-presentation-with-copilot-in-powerpoint |
| Google Slides / Gemini | https://workspace.google.com/products/slides/ | https://workspace.google.com/products/slides/ |
| Prezi | https://prezi.com | https://prezi.com/ai-presentation-maker/ |
| Pitch | https://pitch.com | https://pitch.com/product |
| ChatGPT | https://chatgpt.com | https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview |
| Claude | https://claude.ai | https://claude.com/product/overview |
| Gemini | https://gemini.google.com | https://gemini.google/overview/ |
| Midjourney | https://www.midjourney.com | https://docs.midjourney.com/hc/en-us/articles/33390732264589-Creating-on-Web |
| Runway | https://runway.com | https://runway.com/ |
| ElevenLabs | https://elevenlabs.io/text-to-speech | https://elevenlabs.io/text-to-speech |
| Suno | https://suno.com | https://help.suno.com/en/articles/2462273 |
| Perplexity | https://www.perplexity.ai | https://www.perplexity.ai/help-center/en/articles/10352903-what-is-pro-search |
| GitHub Copilot | https://github.com/features/copilot | https://github.com/features/copilot |
| Notion AI | https://www.notion.com/product/ai | https://www.notion.com/product/ai |

Additional presentation evidence:
- Data chart workflows: https://support.microsoft.com/en-us/powerpoint/training/use-charts-and-graphs-in-your-presentation and https://support.google.com/docs/answer/7009814
- Gamma content/file inputs: https://help.gamma.app/en/articles/11047840-how-can-i-import-slides-or-content-into-gamma
- Canva presentations and data: https://www.canva.com/create/ai-presentations/
- Beautiful.ai deck categories: https://www.beautiful.ai/presentations

## New in AI lifecycle

`addedAt` is the directory editorial addition date, not an unverified launch date. Cards and details only show NEW when active, curated, explicitly `newInAi=true`, and within the configured freshness window (30 days by default). Future and invalid dates are excluded. Age is evaluated against UTC addition dates; at exactly 30 days the badge expires. Expiry never removes or mutates the main catalog entry. For a deliberate editorial resurfacing, mark new and update the addition date. New listings sort by addition date descending.

Add a verified tool object in `data/aiTools.ts`, assign official URL, supported task mappings, capabilities/modality, editorial state and addition date. UI changes are unnecessary. Optional preparation metadata permits future specialized compilers; none are implemented in this release.

## Validation

`npm run test:tools` checks all families, contextual presentation orders, user preferences, modality/output matching, freshness boundaries, safe URLs, bilingual rendering and all 16 original templates through the existing Agent gate. `npm run test:tool-journeys` runs actual React browser flows including template creation, generation with a disclosed offline fallback, recommendations, tool details, exact clipboard handoff, persistence and Arabic mobile layout. Existing regressions and browser journeys remain required. Public deployment stays manual and is never dispatched by this change.

Additional verified capability evidence for Gemini file/data analysis: https://support.google.com/gemini/answer/14903178
