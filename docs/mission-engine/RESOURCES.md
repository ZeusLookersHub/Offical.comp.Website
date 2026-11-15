# الموارد اللي محتاجينها علشان المحرك يشتغل بكامل قوته

## ١. أمثلة بصرية لكل اختيار (٢٣ ملف)

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
