# Lookers AI — Topic Taxonomy and Workflow Families (Research v1)

Status: architectural proposal / inventory, NOT yet connected to the chat runtime.
Scope: prompt-to-tool assistant; does not claim to generate assets inside Lookers AI.
Ownership: backend / content architecture. No frontend changes.

## Evidence and inventory

External evidence (checked October 2026):
- How People Use ChatGPT (OpenAI / NBER, 2025): practical guidance, information seeking and writing dominate observed consumer conversations. https://openai.com/index/how-people-are-using-chatgpt/
- Gallup (2026): writing/editing, research, general assistance prominent at work. https://www.gallup.com/workplace/712736/organizational-adoption-jumps-six-points.aspx
- OECD SMEs (2025): marketing/sales and IT are common business uses. https://www.oecd.org/en/publications/generative-ai-and-the-sme-workforce_2d08b99d-en/full-report/component-4.html
- Adobe Firefly capability map: image/video/audio generation and editing. https://helpx.adobe.com/firefly/web/get-started/access-the-app/firefly-workspace-overview.html
- Runway modes: text-to-video, image-to-video, video editing and workflows. https://help.runwayml.com/hc/en-us/articles/37425232841875-Getting-Started-with-Generative-Video
- GitHub Copilot: coding, issue planning, review and testing. https://docs.github.com/en/copilot/get-started/where-to-use-github-copilot

Actual repository inputs on feature/lookers-orbital-hero:
- components/OrbitalHero.tsx: 5 worlds, 20 entry missions.
- data/promptLibrary.ts: 10 categories, 8 base templates + 16 presentation templates.
- data/lookersAiTrends.ts: 5 editorial sections, 3 trend starters each.
- data/aiTools.ts: 16 tool families.
- data/lookersAi.ts: 5 legacy task types (image, campaign, dashboard, presentation, general).
- services/lookersAiVideoQuestions.ts: video-specific questions, currently separate from the legacy task-type enum.

IMPORTANT: categories are discovery/navigation; topics are user intents; workflow families are reusable interview schemas; adapters are target-tool output transformations. A topic can appear in several navigation categories but must have one canonical ID. These topic examples are proposed product coverage, not measured popularity ranks.

## Recommended workflow families (14)

| ID | Workflow family | Common interview spine | Conditional modules |
|---|---|---|---|
| F01 | Visual generation | subject; purpose; visual direction; format | exact text; identity; reference image; brand |
| F02 | Visual edit / transformation | source asset; change; preserve; target format | mask/region; reference style; removal; upscale |
| F03 | Video / motion | scene; goal; duration; aspect ratio | camera; storyboard; reference image/video; audio; transitions |
| F04 | Audio / speech / music | audio task; language/genre; duration; delivery | voice traits; script; pronunciation; rights; reference |
| F05 | Writing / communication | message purpose; audience; source facts; tone; format | channel; CTA; language; length; rewrite constraints |
| F06 | Marketing / campaign | offer; goal; audience; channels; deliverables | budget; calendar; funnel; measurement; compliance |
| F07 | Business planning / decision | situation; objective; market; decision/output | competitors; costs; assumptions; risks; scenarios |
| F08 | Research / comparison | research question; scope; evidence standard; output | recency; region; comparison criteria; citations |
| F09 | Data / analytics | question; data source; measures; output | cleaning; formulas; charts; refresh; dashboard |
| F10 | Presentation / structured document | subject; audience; decision; source content | slides; brand; speaking notes; file format |
| F11 | Software / website / agent | product/problem; users; platform; core features | stack; integration; data; security; acceptance tests |
| F12 | Automation / operations | trigger; inputs; steps; desired result | connected tools; permissions; exceptions; approvals |
| F13 | Learning / coaching / career | learning/job goal; current level; constraints; output | syllabus; assessment; CV; interview; role |
| F14 | Commerce / travel / customer service | customer intent; product/service; policies; channel | inventory; pricing; booking; itinerary; escalation |

These are 14 reusable families, NOT 14 rigid forms. Shared fields are composed with domain modules. One-question-at-a-time chat; no repeated questions for explicit known facts.

## Topic catalog by navigation section

Canonical topic ID => family ID. Cross-category duplicates point to the same ID.

### Design & Images
- product-photography => F01
- advertising-key-visual => F01
- social-post-design => F01
- poster-flyer-banner => F01
- logo-concept => F01
- brand-identity-direction => F01
- packaging-label-concept => F01
- illustration-art => F01
- portrait-character => F01
- environment-interior-concept => F01
- ui-visual-concept => F01
- mockup-scene => F01
- photo-retouch => F02
- background-remove-replace => F02
- image-upscale-restore => F02
- image-style-transfer => F02
- multi-reference-composite => F02
- object-add-remove => F02
- resize-reframe => F02
- brand-consistency-edit => F02

### Video & Motion
- text-to-video => F03
- image-to-video => F03
- product-commercial => F03
- social-reel-short => F03
- cinematic-shot => F03
- multi-scene-storyboard => F03
- explainer-video => F03
- educational-video => F03
- animated-logo => F03
- motion-graphics => F03
- video-editing-brief => F03
- clip-to-highlight => F03
- video-localization => F03
- avatar-presenter-video => F03
- video-transition => F03

### Audio & Voice
- voiceover-script-and-voice => F04
- text-to-speech => F04
- podcast-concept => F04
- podcast-editing => F04
- music-generation => F04
- sound-effect-generation => F04
- dubbing-localization => F04
- audio-cleanup => F04
- transcription-brief => F04

### Marketing & Growth
- marketing-strategy => F06
- launch-campaign => F06
- paid-ads-campaign => F06
- content-calendar => F06
- social-media-strategy => F06
- influencer-brief => F06
- email-marketing => F06
- seo-content-plan => F06
- brand-positioning => F07
- funnel-conversion-plan => F06
- marketing-creative-brief => F06
- campaign-report => F09
- audience-segmentation => F08
- competitor-marketing-research => F08

### Writing & Communication
- email-draft => F05
- professional-message => F05
- social-caption => F05
- ad-copy => F05
- blog-article => F05
- website-copy => F05
- product-description => F05
- translation-localization => F05
- rewrite-tone => F05
- proofreading => F05
- summarization => F05
- script-writing => F05
- creative-story => F05
- press-release => F05
- proposal-copy => F05

### Business & Strategy
- business-plan => F07
- feasibility-study => F07
- business-model => F07
- swot-analysis => F07
- go-to-market-plan => F07
- pricing-strategy => F07
- growth-strategy => F07
- operational-sop => F12
- financial-scenario-plan => F07
- competitor-analysis => F08
- market-opportunity-study => F08
- customer-persona-research => F08
- company-profile => F10
- business-proposal => F10
- executive-decision-memo => F07

### Presentations & Documents
- investor-pitch-deck => F10
- company-presentation => F10
- sales-deck => F10
- quarterly-business-review => F10
- marketing-plan-deck => F10
- strategy-deck => F10
- executive-deck => F10
- product-launch-deck => F10
- training-deck => F10
- workshop-deck => F10
- educational-deck => F10
- data-storytelling-deck => F10
- project-proposal-deck => F10
- hotel-travel-deck => F10
- tourism-package-deck => F10
- report-document => F10
- brochure-document => F10
- policy-manual => F10

### Technology & AI
- website-build => F11
- landing-page => F11
- web-app => F11
- mobile-app => F11
- ui-ux-specification => F11
- ai-chatbot => F11
- ai-agent => F11
- api-integration => F11
- database-design => F11
- software-debugging => F11
- code-refactoring => F11
- testing-qa => F11
- architecture-review => F11
- deployment-plan => F11
- workflow-automation => F12
- no-code-integration => F12
- spreadsheet-automation => F12

### Data, Research & Productivity
- spreadsheet-formula => F09
- data-cleaning => F09
- spreadsheet-analysis => F09
- dashboard-design => F09
- kpi-definition => F09
- sales-analysis => F09
- financial-reporting => F09
- survey-analysis => F09
- document-extraction => F09
- deep-research => F08
- source-comparison => F08
- fact-checking => F08
- product-comparison => F08
- literature-review => F08
- meeting-summary => F05
- task-prioritization => F12
- project-plan => F12

### Career & Education
- cv-resume => F13
- cover-letter => F13
- interview-preparation => F13
- linkedin-profile => F13
- career-change-plan => F13
- job-search-plan => F13
- skill-learning-roadmap => F13
- lesson-plan => F13
- exam-preparation => F13
- tutor-explanation => F13
- quiz-assessment => F13
- training-curriculum => F13

### Commerce, Travel & Support
- ecommerce-listing => F05
- ecommerce-product-creative => F01
- ecommerce-launch => F06
- customer-support-reply => F14
- customer-service-script => F14
- faq-knowledge-base => F14
- support-escalation => F14
- sales-outreach => F05
- travel-itinerary => F14
- hotel-offer-brief => F14
- tourism-package-brief => F14
- booking-communication => F14
- service-operations-workflow => F12

## Shared context and chat rules

All families share:
- intent, desired result, audience/use, verified facts, deliverable, constraints, reference attachments, preferred tool, language, user-approved assumptions.
- facts have provenance: explicit-user, attached-source, verified-external, inferred-suggestion. Only explicit/verified facts may be asserted as facts.
- a choice question renders selectable cards/chips inside assistant message; selections are staged until Done/Send.
- text questions provide an example and an Explain button, never AI jargon.
- one active question at a time; skip answered facts; optional details are not blockers.
- ask no more than needed; aim for 3–5 substantive turns for common tasks, but allow more for complex or high-stakes requests.
- do not auto-select 9:16 just because TikTok was mentioned unless clearly offered as an editable suggestion.
- exact text, real product identity, source preservation, and permission to publish/spend are explicit gates.
- output format depends on intended destination tool, not on the navigation category.
- after completion, show editable summary, final prompt, tool recommendations and Rework.
- no external auto-send unless the target tool explicitly supports an authorized integration.

## Family selection logic

1. Read selected topic ID when provided; otherwise classify free-text intent.
2. Resolve topic to canonical family, independent of which UI category opened it.
3. Detect operation: create, edit, analyze, plan, compare, automate, troubleshoot.
4. Load shared context fields + family fields + conditional modules.
5. Extract only explicit facts from initial idea and references, with provenance.
6. Ask next highest-impact missing question; never ask known information again.
7. Compile family prompt, then target-tool adapter, then validate factual grounding.
8. Save prompt version; Rework changes only user-identified failing dimensions.

Example: Product commercial => F03 Video, with F01 product-identity reference module.
Example: Data-storytelling deck => F10 Presentation, with F09 data-evidence module.
Example: Landing page => F11 Software, with F06 marketing-copy module.
Example: Customer service WhatsApp reply => F14 Support, with F05 tone/channel module.

## Build order and acceptance criteria

P0: canonical topic registry and alias map; map every current hero mission, prompt template and tool family to topic/family; zero dead entries.
P1: schema-driven family interview; reusable controls; explicit fact extraction; provenance; help/examples; no redundant questions.
P2: domain modules and conditional fields; video, image, presentation, writing, marketing, coding, data first.
P3: prompt compiler per family; DeepSeek enhancement behind existing Agent.run() path; no invented facts.
P4: tool-specific adapters and capability checks (e.g. video duration/ratio supported by selected model).
P5: rework version history, structured feedback, regression tests.
P6: telemetry for completion, average turns, user confusion, rework rate and cost; privacy-safe aggregation.

Before claiming production readiness, run tests for each family and all mapped topics, including Arabic/English, prefilled values, invalid choices, missing references, unsupported tool settings, resume/edit and Rework.

## Critical technical debts discovered

- Legacy TaskType union has no video subtype; video currently uses contentType=video with taskType=general. Avoid relying on legacy general prompt generation for video.
- The video-specific prompt compiler is separate from the canonical Agent.run() generation path; integrate deliberately, do not bypass Agent.
- Current question flow skips optional questions entirely; optional creative preferences need an opt-in refinement stage.
- Presentation legacy questions do not require the actual topic/content; schema must add this.
- Duration controls are preset options; custom values and tool-specific duration validation need a flexible input path.
- Tool capabilities change; verification must be per model/tool, not a blanket assumption about an entire provider.
