# الموارد اللي محتاجينها علشان المحرك يشتغل بكامل قوته

## ١. أمثلة بصرية لكل اختيار (٥٦ ملف)

في مهمات الصور والفيديو والعروض والمواقع، كل اختيار من نوع "الشكل" أو "الإحساس" أو "حركة الكاميرا" بيظهر للمستخدم بحاجتين: **مثال بصري، وجملة شرح**.

الشرح موجود دلوقتي. الملفات نفسها لسه محتاجة تتعمل. ولحد ما تتعمل، الشات بيعرض الشرح بس.

**المواصفات:**
- **الصور والـ layouts:** `webp`، عرض ٦٤٠ بكسل، أقل من ٨٠ كيلوبايت.
- **الفيديو:** `mp4` (H.264)، من ٣ لـ٥ ثواني، صامت، بيتكرر، أقل من ٦٠٠ كيلوبايت، مقاس 9:16 أو 1:1.
- **مكانها:** `public/assets/lookers-ai/examples/...` بنفس المسارات اللي في الجدول.

**ملاحظات على التوليد:**
- البرومبتات في الجدول جاهزة، ونقدر نولّدها بأداة الصور والفيديو اللي بنستخدمها.
- ممنوع أي براند حقيقي، علشان كده الأمثلة من غير لوجوهات.
- البرومبتات اللي فيها كلمة "perfume" عادي تتولد على زجاجة من غير اسم.

> الجدول ده متولد من الكود (`listResources`). لو اختيار اتضاف أو اتغير، نعيد توليده.

| # | المهمة | الخانة · الاختيار | النوع | المسار | يوضّح إيه | برومبت التوليد |
|---|---|---|---|---|---|---|
| 1 | product-photo | style · luxury-dark | صورة | `/assets/lookers-ai/examples/product-photo/style-luxury-dark.webp` | Deep shadows, a single rim light tracing the product edges, glossy black or marble surface, rich reflections. | luxury perfume bottle on black marble, single rim light, deep shadows, glossy reflections, product photography |
| 2 | product-photo | style · clean-studio | صورة | `/assets/lookers-ai/examples/product-photo/style-clean-studio.webp` | Pure white or light grey background, soft even light, gentle shadow under the product, every detail sharp. | skincare bottle on seamless white background, soft even studio light, subtle contact shadow, e-commerce product photo |
| 3 | product-photo | style · lifestyle | صورة | `/assets/lookers-ai/examples/product-photo/style-lifestyle.webp` | The product in a real moment of use — a hand, a table, a morning scene — warm natural light, shallow depth of field. | coffee bag on a wooden breakfast table, morning window light, steam from a cup, lifestyle product photo, shallow depth of field |
| 4 | product-photo | style · natural | صورة | `/assets/lookers-ai/examples/product-photo/style-natural.webp` | Organic setting: leaves, stone, sand or water drops; soft daylight; earthy palette. | natural cosmetics jar on wet stone with green leaves and water droplets, soft daylight, earthy tones |
| 5 | product-photo | style · bold-color | صورة | `/assets/lookers-ai/examples/product-photo/style-bold-color.webp` | Saturated solid background in one or two strong colours, hard light, graphic shadows, high energy. | sneaker on a saturated orange background with a hard light and graphic blue shadow, bold commercial product photo |
| 6 | product-photo | style · minimal-pastel | صورة | `/assets/lookers-ai/examples/product-photo/style-minimal-pastel.webp` | Soft pastel backdrop, simple geometric props, airy diffused light, calm and clean. | minimal pastel product photo, lipstick on a pale pink cylinder podium, soft diffused light, airy and calm |
| 7 | product-video | style · cinematic-luxury | فيديو قصير | `/assets/lookers-ai/examples/product-video/cinematic-luxury.mp4` | Slow movement, dark set, light sweeping across the product, particles or mist, elegant pace. | slow cinematic dolly around a perfume bottle on black marble, light sweep across the glass, soft mist, elegant pace |
| 8 | product-video | style · clean-turntable | فيديو قصير | `/assets/lookers-ai/examples/product-video/clean-turntable.mp4` | The product rotates on a clean background so every side is visible; even studio light. | sneaker rotating 360 degrees on a seamless white turntable, even studio light, smooth loop |
| 9 | product-video | style · lifestyle | فيديو قصير | `/assets/lookers-ai/examples/product-video/lifestyle.mp4` | Someone uses the product in a real moment; natural light, handheld feel, warm tones. | hands pouring coffee from a bag into a cup at a sunlit kitchen table, natural handheld feel, warm tones |
| 10 | product-video | style · energetic | فيديو قصير | `/assets/lookers-ai/examples/product-video/energetic.mp4` | Quick cuts, bold colour backgrounds, punchy camera moves synced to a beat. | fast cuts of a sneaker against saturated orange and blue backgrounds, punchy whip pans, energetic product ad |
| 11 | product-video | style · natural | فيديو قصير | `/assets/lookers-ai/examples/product-video/natural.mp4` | Leaves moving, water drops, soft daylight; calm and fresh. | skincare jar among moving green leaves with water droplets falling, soft daylight, fresh and calm |
| 12 | product-video | camera · orbit | فيديو قصير | `/assets/lookers-ai/examples/product-video/camera-orbit.mp4` | The camera circles the product slowly while it stays still. | slow 180 degree camera orbit around a product on a pedestal |
| 13 | product-video | camera · push-in | فيديو قصير | `/assets/lookers-ai/examples/product-video/camera-push-in.mp4` | The camera glides closer until a detail fills the frame. | smooth push-in from wide to a macro detail of a product label |
| 14 | product-video | camera · reveal | فيديو قصير | `/assets/lookers-ai/examples/product-video/camera-reveal.mp4` | The product appears from shadow, smoke or behind an object. | product slowly revealed from darkness by a moving light, smoke clearing |
| 15 | product-video | camera · static | فيديو قصير | `/assets/lookers-ai/examples/product-video/camera-static.mp4` | The frame stays still; light, water or fabric moves around the product. | locked-off shot, silk fabric flowing around a still product, light moving |
| 16 | pitch-deck | deckStyle · bold-startup | شكل صفحة/شريحة | `/assets/lookers-ai/examples/pitch-deck/bold-startup.webp` | One big idea per slide, large numbers, strong accent colour, few words. | pitch deck slide, one huge metric in a bold accent colour, minimal words, modern startup style |
| 17 | pitch-deck | deckStyle · clean-corporate | شكل صفحة/شريحة | `/assets/lookers-ai/examples/pitch-deck/clean-corporate.webp` | White space, navy and grey, clear charts, structured grid. | clean corporate pitch deck slide, navy and grey, structured grid with a clear bar chart |
| 18 | pitch-deck | deckStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/pitch-deck/dark-premium.webp` | Dark background, gold or neon accents, product imagery, cinematic feel. | dark premium pitch deck slide, black background, gold accents, product screenshot, cinematic |
| 19 | pitch-deck | deckStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/pitch-deck/minimal.webp` | Mostly typography, one colour, lots of air. | minimal typographic pitch deck slide, single colour, generous whitespace |
| 20 | landing-page | pageStyle · clean-trust | شكل صفحة/شريحة | `/assets/lookers-ai/examples/landing-page/clean-trust.webp` | White and one calm colour, real photos, clear sections, reviews and badges near the button. | clean trustworthy landing page hero, white background, calm teal accent, real photo, clear call to action, trust badges |
| 21 | landing-page | pageStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/landing-page/dark-premium.webp` | Dark background, gold or soft glow accents, large type, cinematic imagery. | dark premium landing page hero, black background, gold accents, large serif headline, cinematic product image |
| 22 | landing-page | pageStyle · bold-colorful | شكل صفحة/شريحة | `/assets/lookers-ai/examples/landing-page/bold-colorful.webp` | Bright colour blocks, playful shapes, big buttons, energetic. | bold colourful landing page hero, bright colour blocks, playful shapes, big rounded button, energetic startup |
| 23 | landing-page | pageStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/landing-page/minimal.webp` | Mostly typography, generous white space, one accent colour. | minimal landing page hero, large typography, generous whitespace, single accent colour |
| 24 | social-post-design | style · bold-type | صورة | `/assets/lookers-ai/examples/social-post-design/bold-type.webp` | Huge headline fills the frame, flat strong colour, tiny supporting line. | social media post design, huge bold headline filling the frame, flat orange background, minimal supporting text, graphic design |
| 25 | social-post-design | style · photo-led | صورة | `/assets/lookers-ai/examples/social-post-design/photo-led.webp` | A strong photo fills the frame with a readable text band over it. | social media post design, full-bleed product photo with a readable text band overlay, clean modern layout |
| 26 | social-post-design | style · minimal | صورة | `/assets/lookers-ai/examples/social-post-design/minimal.webp` | Lots of white space, one small element, calm and premium. | minimal social media post, generous white space, one small centered element, elegant thin typography |
| 27 | social-post-design | style · gradient | صورة | `/assets/lookers-ai/examples/social-post-design/gradient.webp` | Smooth colour gradient background with glassy shapes and clean type. | modern social media post with smooth purple blue gradient background, glassmorphism shapes, clean sans typography |
| 28 | social-post-design | style · collage | صورة | `/assets/lookers-ai/examples/social-post-design/collage.webp` | Cut-out photos, tape and paper textures, playful arrangement. | collage style social media post, cut-out photos with torn paper edges, tape, playful layered arrangement |
| 29 | poster-design | style · swiss | صورة | `/assets/lookers-ai/examples/poster-design/swiss.webp` | Strict grid, huge helvetica-like type, one accent colour, lots of air. | swiss style poster, strict grid, huge bold helvetica typography, single red accent on off-white, generous whitespace |
| 30 | poster-design | style · photo-hero | صورة | `/assets/lookers-ai/examples/poster-design/photo-hero.webp` | One dramatic photo fills the poster with the title over it. | poster with one dramatic full-bleed photograph, large title overlaid, cinematic colour grade |
| 31 | poster-design | style · retro | صورة | `/assets/lookers-ai/examples/poster-design/retro.webp` | Warm muted palette, grain, vintage type and simple shapes. | retro vintage poster, warm muted palette, paper grain texture, 1970s typography, simple geometric shapes |
| 32 | poster-design | style · gradient-modern | صورة | `/assets/lookers-ai/examples/poster-design/gradient-modern.webp` | Vivid gradient, abstract shapes, clean modern type. | modern poster with vivid blue purple gradient, abstract fluid shapes, clean contemporary typography |
| 33 | poster-design | style · illustrated | صورة | `/assets/lookers-ai/examples/poster-design/illustrated.webp` | A hand-drawn or vector illustration carries the whole poster. | illustrated poster, flat vector illustration as the hero, limited colour palette, playful composition |
| 34 | logo-concept | style · wordmark | صورة | `/assets/lookers-ai/examples/logo-concept/wordmark.webp` | The name itself, drawn in one distinctive typeface. No symbol. | minimal wordmark logo design, single distinctive custom typeface, black on white, flat vector, no symbol |
| 35 | logo-concept | style · lettermark | صورة | `/assets/lookers-ai/examples/logo-concept/lettermark.webp` | One or two initials built into a clean, balanced mark. | lettermark monogram logo, two initials forming a balanced geometric mark, flat vector, black on white |
| 36 | logo-concept | style · geometric | صورة | `/assets/lookers-ai/examples/logo-concept/geometric.webp` | An abstract geometric mark built from simple shapes. | abstract geometric logo mark, simple circles and lines, balanced negative space, flat vector, black on white |
| 37 | logo-concept | style · emblem | صورة | `/assets/lookers-ai/examples/logo-concept/emblem.webp` | A badge: the name inside a circular or shield container. | emblem badge logo, name inside a circular container with a small icon, craft style, flat vector, black on white |
| 38 | logo-concept | style · mascot | صورة | `/assets/lookers-ai/examples/logo-concept/mascot.webp` | A simple friendly character used as the brand mark. | simple friendly mascot logo, minimal rounded character, two flat colours, vector, white background |
| 39 | packaging-design | style · minimal-premium | صورة | `/assets/lookers-ai/examples/packaging-design/minimal-premium.webp` | Off-white matte, small refined type, one accent, lots of empty space. | minimal premium packaging design, matte off-white bag, small refined serif type, single gold accent, generous empty space |
| 40 | packaging-design | style · bold-colour | صورة | `/assets/lookers-ai/examples/packaging-design/bold-colour.webp` | Big colour blocks and large type that pop from the shelf. | bold colourful packaging, large colour blocks, oversized playful typography, high contrast, eye-catching on shelf |
| 41 | packaging-design | style · natural | صورة | `/assets/lookers-ai/examples/packaging-design/natural.webp` | Kraft paper, earthy inks, botanical line art, honest and simple. | eco natural packaging, kraft paper texture, earthy green ink, botanical line illustration, simple honest layout |
| 42 | packaging-design | style · luxury-dark | صورة | `/assets/lookers-ai/examples/packaging-design/luxury-dark.webp` | Deep matte black with gold foil details and thin elegant type. | luxury dark packaging, deep matte black box with gold foil accents, thin elegant serif typography, premium feel |
| 43 | packaging-design | style · illustrated | صورة | `/assets/lookers-ai/examples/packaging-design/illustrated.webp` | A custom illustration wraps the pack and tells its story. | illustrated packaging design, custom flat illustration wrapping the pack, limited warm palette, storybook feel |
| 44 | illustration | style · flat-vector | صورة | `/assets/lookers-ai/examples/illustration/flat-vector.webp` | Clean flat shapes, limited palette, no shading — modern and tidy. | flat vector illustration, clean geometric shapes, limited 4 colour palette, no gradients, modern editorial style |
| 45 | illustration | style · line-art | صورة | `/assets/lookers-ai/examples/illustration/line-art.webp` | Single-weight outlines with one accent colour, airy and light. | line art illustration, single weight black outlines on white, one coral accent colour, airy minimal composition |
| 46 | illustration | style · 3d-render | صورة | `/assets/lookers-ai/examples/illustration/3d-render.webp` | Soft rounded 3D objects with gentle light and pastel colours. | soft 3D rendered illustration, rounded clay-like objects, pastel palette, gentle studio lighting, isometric view |
| 47 | illustration | style · watercolour | صورة | `/assets/lookers-ai/examples/illustration/watercolour.webp` | Soft painted washes with visible paper texture, warm and human. | watercolour illustration, soft colour washes, visible paper texture, loose organic edges, warm palette |
| 48 | illustration | style · isometric | صورة | `/assets/lookers-ai/examples/illustration/isometric.webp` | A tidy 3/4 isometric scene, great for explaining systems. | isometric illustration, 3/4 view miniature scene, flat colours with subtle shadows, technical and tidy |
| 49 | photo-retouch | style · white-studio | صورة | `/assets/lookers-ai/examples/photo-retouch/white-studio.webp` | Pure white background, soft even light, a gentle shadow under the subject. | product photo on pure white seamless background, soft even studio light, subtle contact shadow, e-commerce ready |
| 50 | photo-retouch | style · natural-clean | صورة | `/assets/lookers-ai/examples/photo-retouch/natural-clean.webp` | Keeps the original scene; only tidier, brighter and sharper. | lightly retouched photo, same natural scene, cleaned up and brightened, natural colours, no heavy editing |
| 51 | photo-retouch | style · colour-graded | صورة | `/assets/lookers-ai/examples/photo-retouch/colour-graded.webp` | A film-like colour grade with richer contrast and mood. | cinematic colour graded photo, teal and warm highlights, rich contrast, filmic mood, natural skin tones |
| 52 | photo-retouch | style · lifestyle-bg | صورة | `/assets/lookers-ai/examples/photo-retouch/lifestyle-bg.webp` | The subject is placed in a realistic new setting with matching light. | product composited into a realistic lifestyle setting, matching light direction and shadows, seamless and believable |
| 53 | company-profile | deckStyle · clean-corporate | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/clean-corporate.webp` | White space, navy and grey, clear charts, structured grid. | clean corporate presentation slide, navy and grey, structured grid with a clear bar chart, generous whitespace |
| 54 | company-profile | deckStyle · bold-modern | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/bold-modern.webp` | One big idea per slide, large numbers, strong accent colour, few words. | bold modern presentation slide, one huge metric in a strong accent colour, minimal words |
| 55 | company-profile | deckStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/dark-premium.webp` | Dark background, gold accents, imagery, cinematic feel. | dark premium presentation slide, black background, gold accents, large image, cinematic |
| 56 | company-profile | deckStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/minimal.webp` | Mostly typography, one colour, lots of air. | minimal typographic presentation slide, single colour, generous whitespace |
| 57 | sales-deck | deckStyle · clean-corporate | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/clean-corporate.webp` | White space, navy and grey, clear charts, structured grid. | clean corporate presentation slide, navy and grey, structured grid with a clear bar chart, generous whitespace |
| 58 | sales-deck | deckStyle · bold-modern | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/bold-modern.webp` | One big idea per slide, large numbers, strong accent colour, few words. | bold modern presentation slide, one huge metric in a strong accent colour, minimal words |
| 59 | sales-deck | deckStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/dark-premium.webp` | Dark background, gold accents, imagery, cinematic feel. | dark premium presentation slide, black background, gold accents, large image, cinematic |
| 60 | sales-deck | deckStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/minimal.webp` | Mostly typography, one colour, lots of air. | minimal typographic presentation slide, single colour, generous whitespace |
| 61 | quarterly-review | deckStyle · clean-corporate | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/clean-corporate.webp` | White space, navy and grey, clear charts, structured grid. | clean corporate presentation slide, navy and grey, structured grid with a clear bar chart, generous whitespace |
| 62 | quarterly-review | deckStyle · bold-modern | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/bold-modern.webp` | One big idea per slide, large numbers, strong accent colour, few words. | bold modern presentation slide, one huge metric in a strong accent colour, minimal words |
| 63 | quarterly-review | deckStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/dark-premium.webp` | Dark background, gold accents, imagery, cinematic feel. | dark premium presentation slide, black background, gold accents, large image, cinematic |
| 64 | quarterly-review | deckStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/minimal.webp` | Mostly typography, one colour, lots of air. | minimal typographic presentation slide, single colour, generous whitespace |
| 65 | strategy-deck | deckStyle · clean-corporate | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/clean-corporate.webp` | White space, navy and grey, clear charts, structured grid. | clean corporate presentation slide, navy and grey, structured grid with a clear bar chart, generous whitespace |
| 66 | strategy-deck | deckStyle · bold-modern | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/bold-modern.webp` | One big idea per slide, large numbers, strong accent colour, few words. | bold modern presentation slide, one huge metric in a strong accent colour, minimal words |
| 67 | strategy-deck | deckStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/dark-premium.webp` | Dark background, gold accents, imagery, cinematic feel. | dark premium presentation slide, black background, gold accents, large image, cinematic |
| 68 | strategy-deck | deckStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/minimal.webp` | Mostly typography, one colour, lots of air. | minimal typographic presentation slide, single colour, generous whitespace |
| 69 | training-deck | deckStyle · clean-corporate | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/clean-corporate.webp` | White space, navy and grey, clear charts, structured grid. | clean corporate presentation slide, navy and grey, structured grid with a clear bar chart, generous whitespace |
| 70 | training-deck | deckStyle · bold-modern | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/bold-modern.webp` | One big idea per slide, large numbers, strong accent colour, few words. | bold modern presentation slide, one huge metric in a strong accent colour, minimal words |
| 71 | training-deck | deckStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/dark-premium.webp` | Dark background, gold accents, imagery, cinematic feel. | dark premium presentation slide, black background, gold accents, large image, cinematic |
| 72 | training-deck | deckStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/minimal.webp` | Mostly typography, one colour, lots of air. | minimal typographic presentation slide, single colour, generous whitespace |
| 73 | project-proposal | deckStyle · clean-corporate | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/clean-corporate.webp` | White space, navy and grey, clear charts, structured grid. | clean corporate presentation slide, navy and grey, structured grid with a clear bar chart, generous whitespace |
| 74 | project-proposal | deckStyle · bold-modern | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/bold-modern.webp` | One big idea per slide, large numbers, strong accent colour, few words. | bold modern presentation slide, one huge metric in a strong accent colour, minimal words |
| 75 | project-proposal | deckStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/dark-premium.webp` | Dark background, gold accents, imagery, cinematic feel. | dark premium presentation slide, black background, gold accents, large image, cinematic |
| 76 | project-proposal | deckStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/minimal.webp` | Mostly typography, one colour, lots of air. | minimal typographic presentation slide, single colour, generous whitespace |
| 77 | data-storytelling | deckStyle · clean-corporate | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/clean-corporate.webp` | White space, navy and grey, clear charts, structured grid. | clean corporate presentation slide, navy and grey, structured grid with a clear bar chart, generous whitespace |
| 78 | data-storytelling | deckStyle · bold-modern | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/bold-modern.webp` | One big idea per slide, large numbers, strong accent colour, few words. | bold modern presentation slide, one huge metric in a strong accent colour, minimal words |
| 79 | data-storytelling | deckStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/dark-premium.webp` | Dark background, gold accents, imagery, cinematic feel. | dark premium presentation slide, black background, gold accents, large image, cinematic |
| 80 | data-storytelling | deckStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/minimal.webp` | Mostly typography, one colour, lots of air. | minimal typographic presentation slide, single colour, generous whitespace |
| 81 | product-launch-deck | deckStyle · clean-corporate | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/clean-corporate.webp` | White space, navy and grey, clear charts, structured grid. | clean corporate presentation slide, navy and grey, structured grid with a clear bar chart, generous whitespace |
| 82 | product-launch-deck | deckStyle · bold-modern | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/bold-modern.webp` | One big idea per slide, large numbers, strong accent colour, few words. | bold modern presentation slide, one huge metric in a strong accent colour, minimal words |
| 83 | product-launch-deck | deckStyle · dark-premium | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/dark-premium.webp` | Dark background, gold accents, imagery, cinematic feel. | dark premium presentation slide, black background, gold accents, large image, cinematic |
| 84 | product-launch-deck | deckStyle · minimal | شكل صفحة/شريحة | `/assets/lookers-ai/examples/deck-style/minimal.webp` | Mostly typography, one colour, lots of air. | minimal typographic presentation slide, single colour, generous whitespace |

## ٢. موديل بيشوف الصور (Vision)، علشان "اشرحلي الصورة دي"

لما المستخدم يرفع صورة منتجه أو صورة/فيديو مرجعي، محتاجين موديل يوصفها ويطلع منها المعلومات بدليل. يعني الشكل، والخامة، والألوان، والكلام المكتوب على الليبل بالحرف.

**DeepSeek** (الموديل اللي شغال دلوقتي) **ما بيشوفش صور**. المطلوب واحد من دول:
- مفتاح **OpenRouter**، ونختار عليه موديل vision.
- أو مفتاح **Google Gemini**.

## ٣. إعدادات السيرفر (Supabase secrets)

| الاسم | الحالة | الاستخدام |
|---|---|---|
| `DEEPSEEK_API_KEY` | موجود (بيستخدمه `lookers-ai-generate`) | الاستخراج والكتابة والإصلاح |
| `ENGINE_MODEL` | اختياري | لو عايزين موديل أقوى في الكتابة بس |
| `ENGINE_PROVIDER` / `OPENROUTER_API_KEY` | اختياري | مزوّد بديل أو موديل vision |
| `ENGINE_ALLOWED_ORIGINS` | اختياري | دومينات الـ preview (مثلاً Vercel) |

لازم كمان نتأكد إن **رصيد DeepSeek** كفاية.

## ٤. قاعدة البيانات (محتاجة موافقة قبل التنفيذ)

جداول للجلسات والبريفات والنتائج، وجدول أحداث من غير بيانات شخصية. الأحداث زي:
- سؤال اتخطى
- برومبت اتنسخ
- سبب التعديل

ومنها نطوّر الـ Blueprints بالأرقام. الجدول الحالي `lookers_ai_workspaces` فاضي ومش مستخدم.

## ٥. مجموعة اختبار ذهبية

من الفريق، محتاجين **١٠ طلبات حقيقية لكل مهمة**، بالعربي والإنجليزي، ومعاها النتيجة اللي نعتبرها ممتازة. دي اللي هنقيس عليها كل تعديل قبل ما ينزل.

## ٦. ملاحظات الأدوات

أدوات الصور والفيديو والعروض بتتحدث بسرعة. علشان كده ملاحظات كل أداة (`tools[].notes` في كل Blueprint) مكتوبة **من غير أرقام إصدارات**، ومحتاجة مراجعة كل شهر.
