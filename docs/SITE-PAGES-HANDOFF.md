# LookersHub public site — 25 October 2026

Branch: `feature/lookers-site-pages-and-contact`. Based on `feature/lookers-ai-3d-universe` at bd5b80b. No changes to the Lookers AI page, workflow, motion kit or universe components.

## Content and architecture

- Public pages: Home, Services, Projects, project details, About, Contact, Start Your Project.
- Source of truth for verified products, clients and contact details: `data/site.ts`.
- Pick: complaints/problems, brand reviews and recommended places. In development. Original supplied GIF.
- Aero Runner: a bird mobile game collecting points and avoiding obstacles. In development. Concept artwork, explicitly labeled.
- Kosmos: company and project management concept. In development. Teaser artwork, explicitly labeled; no unconfirmed features asserted.
- HERA SYSTEM ERP: available per owner confirmation. Supplied logo. Dedicated internal detail view at `#/projects/hera`; demo CTA at `#/start-your-project?product=hera`.
- Marketing clients: Aldiyar Travel and Al Dawlia Real Estate. Text wordmarks only; services described as marketing with no invented metrics or testimonials.
- Each service has a process, deliverables, project inquiry link and relevant products. Marketing work tab contains actual clients instead of unrelated in-house products.
- `SiteUniverse` owns one decorative canvas for the public site. It stops when hidden, renders static frames for reduced motion, caps pixel density and frame rate, and cleans up listeners and frame requests. The Lookers AI route is excluded.

## Contact behavior

WhatsApp: +201118513761. Email: Info@lookershub.com.

The floating button, footer and Contact links open the correct WhatsApp conversation. Inquiry forms prepare an encoded message and open WhatsApp. Users review and send the message there. An explicit fallback link and email-client draft link appear after preparation. There is no API submission or inbox storage, and no claim that a request was received. Service and HERA query parameters preselect the request type. No personal data is stored in browser storage.

## Verification

- npm ci: passed.
- TypeScript check: passed, including the final form validation refinement.
- Production build: passed; existing large-chunk warning remains. Build output was kept outside tracked docs.
- Existing Lookers AI UI regression suite: 7/7 passed.
- Browser: desktop home, portfolio, HERA details in Arabic, demo CTA and prepared WhatsApp message, marketing clients tab, preselected marketing service request, real contact links.
- Responsive browser frames: 390px frame (384px content width with scrollbar) in English and Arabic; portfolio and HERA demo pages have no horizontal overflow. Reduced mobile top spacing after visual review.
- No test message was sent. WhatsApp draft preparation is verified; real delivery and installed-app behavior depend on the visitor's browser/device.

## Outstanding owner input

- HERA public website URL, for a verified external-site CTA. No guessed URL or embedded remote site.
- Official client logos and expanded project case studies can be added when supplied.
- Final Claude Design/Motion Kit handoff must be reviewed before integrating with this site's public background, to avoid two active background renderers.

## Generated asset provenance

Built-in image generation used for temporary project concept art; originals retained outside the repository, optimized WebP assets in `public/assets/portfolio/`.

Aero Runner prompt: Landscape 3:2 polished stylized 3D mobile-game concept artwork. An expressive small swift bird flying through obstacle arches, collecting glowing golden coins above floating rocky islands. Midnight blue, teal, warm gold and restrained violet. Cinematic flight path. No words, logos, UI or claim of actual gameplay footage.

Kosmos prompt: Landscape 3:2 premium conceptual 3D teaser. Translucent glass architectural blocks and orbit lines converge on a luminous central sphere, suggesting companies, teams and projects connected in one universe. Midnight navy, gold paths, cyan glass and restrained violet. No words, logos, interface screenshot or unconfirmed product features.
