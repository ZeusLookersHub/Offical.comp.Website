import type { WorkflowStep } from './lookersAiWorkflowSchemas';

// Topic-specific details augment the family interview; these are prompt briefs, not execution.
const details: Record<string, readonly string[]> = {
  "brand-identity": [
    "What makes the brand different?",
    "إيه اللي بيميز البراند عن غيره؟",
    "A local perfume brand using refillable bottles.",
    "براند عطور مصري بعبوات بتتملي تاني."
  ],
  "ui-ux": [
    "Which user journey should we design first?",
    "أنهي رحلة للمستخدم نبدأ نصممها؟",
    "Find a hotel, compare rooms, then book.",
    "يدور على فندق ويقارن الأوض ويرجع يحجز."
  ],
  "social-post-design": [
    "What must the post say or promote?",
    "البوست يقول إيه أو يروّج لإيه؟",
    "A weekend offer, with the exact approved price.",
    "عرض الويك إند بالسعر المعتمد المكتوب زي ما هو."
  ],
  "motion-graphics": [
    "Which elements move, and how?",
    "إيه العناصر اللي تتحرك وتتحرك إزاي؟",
    "The logo appears, then the headline slides in.",
    "اللوجو يظهر وبعده العنوان يدخل بهدوء."
  ],
  "product-photography": [
    "Which product details must be visible?",
    "أنهي تفاصيل في المنتج لازم تبان؟",
    "The label, gold cap and glass texture.",
    "الملصق والغطا الدهبي وخامة الإزاز."
  ],
  "photo-retouch": [
    "Which imperfections should we fix?",
    "إيه العيوب اللي نصلحها من غير ما نغير الملامح؟",
    "Remove temporary blemishes; keep facial features.",
    "شيل الحبوب المؤقتة وحافظ على ملامح الوش."
  ],
  "packaging-design": [
    "Which packaging shape and print limits apply?",
    "شكل العبوة وحدود الطباعة إيه؟",
    "A 100 ml box with two print colors.",
    "علبة 100 مل والطباعة بلونين بس."
  ],
  "illustration": [
    "Who or what is in the drawing?",
    "مين أو إيه في الرسمة ووضعه عامل إزاي؟",
    "An original character holding a lantern.",
    "شخصية أصلية ماسكة فانوس."
  ],
  "business-plan": [
    "How will the business earn money?",
    "المشروع هيكسب فلوس من إيه؟",
    "Monthly subscriptions for small hotels.",
    "اشتراك شهري للفنادق الصغيرة."
  ],
  "company-profile": [
    "Which company facts can we safely include?",
    "إيه معلومات الشركة المؤكدة اللي نكتبها؟",
    "Founded in 2022; three approved service lines.",
    "اتأسست في 2022 وعندها 3 خدمات معتمدة."
  ],
  "investor-pitch": [
    "What are you asking investors for?",
    "محتاج إيه من المستثمرين؟",
    "Funding to launch two branches; amount undecided.",
    "تمويل لفتح فرعين والمبلغ لسه متحددش."
  ],
  "growth-strategy": [
    "Which growth bottleneck should we address?",
    "إيه اللي معطّل نمو الشغل دلوقتي؟",
    "Many visits but few completed bookings.",
    "زيارات كتير بس الحجوزات المكتملة قليلة."
  ],
  "feasibility-study": [
    "Which costs and demand figures are confirmed?",
    "أنهي تكاليف وأرقام طلب مؤكدة عندك؟",
    "Rent is 20,000 EGP; demand still needs research.",
    "الإيجار 20 ألف جنيه والطلب لسه محتاج بحث."
  ],
  "pricing-strategy": [
    "What are your costs and pricing limits?",
    "التكلفة وحدود السعر عندك إيه؟",
    "Unit cost is 150 EGP; no confirmed selling price.",
    "تكلفة الوحدة 150 جنيه وسعر البيع لسه متحددش."
  ],
  "competitor-analysis": [
    "Which competitors and comparison criteria matter?",
    "هنقارن أنهي منافسين وعلى أساس إيه؟",
    "Three named hotels: price, location and facilities.",
    "3 فنادق محددين: السعر والمكان والخدمات."
  ],
  "data-analysis": [
    "Which columns and time period are available?",
    "الداتا فيها أنهي أعمدة وعن فترة قد إيه؟",
    "Daily sales by branch for the last quarter.",
    "مبيعات يومية لكل فرع عن آخر 3 شهور."
  ],
  "website": [
    "Which pages and main visitor action are needed?",
    "محتاج أنهي صفحات والزائر يعمل إيه في الآخر؟",
    "Home, services and a request-a-quote form.",
    "رئيسية وخدمات وفورم لطلب عرض سعر."
  ],
  "mobile-app": [
    "Which devices and first-release features matter?",
    "التطبيق لأنهي أجهزة وإيه أساسيات أول نسخة؟",
    "Android first: browse products and save favorites.",
    "أندرويد الأول: تصفح المنتجات وحفظ المفضلة."
  ],
  "ai-agent": [
    "What may the agent do, and what needs approval?",
    "الإيجنت مسموح له يعمل إيه وإمتى يرجعلك؟",
    "Draft replies; ask me before sending anything.",
    "يجهز ردود ويرجعلي قبل ما يبعت أي حاجة."
  ],
  "workflow-automation": [
    "Which systems and failure recovery are needed?",
    "هنربط أنهي أنظمة ولو خطوة فشلت يحصل إيه؟",
    "Email to Sheets; keep failed items for review.",
    "من الإيميل لشيت والحاجات اللي تفشل تتراجع."
  ],
  "landing-page": [
    "What single action should visitors take?",
    "إيه الخطوة الواحدة اللي عايز الزائر يعملها؟",
    "Request a demo through the contact form.",
    "يطلب ديمو من فورم التواصل."
  ],
  "api-integration": [
    "What data crosses between the systems?",
    "إيه الداتا اللي هتتنقل بين النظامين؟",
    "Booking ID and dates; no payment credentials.",
    "رقم الحجز والمواعيد من غير بيانات دفع."
  ],
  "debugging": [
    "How can we reproduce the error?",
    "نكرر المشكلة إزاي وإيه المفروض يحصل؟",
    "Save a form: it reloads without storing changes.",
    "أحفظ الفورم فيعمل ريلود من غير ما يحفظ التعديل."
  ],
  "dashboard-design": [
    "Which decisions and measures should the dashboard show?",
    "الداشبورد تساعدك تاخد أنهي قرار وبأنهي مؤشرات؟",
    "Compare daily sales and target attainment by branch.",
    "أقارن مبيعات اليوم ونسبة تحقيق التارجت لكل فرع."
  ],
  "quarterly-review": [
    "Which results and comparison period should we review?",
    "هنراجع نتايج إيه ونقارنها بأنهي فترة؟",
    "This quarter against last quarter and the target.",
    "الربع ده مقارنة بالربع اللي فات والتارجت."
  ],
  "training-deck": [
    "What should learners be able to do afterwards?",
    "الناس تقدر تعمل إيه بعد التدريب؟",
    "Handle a refund request using the approved policy.",
    "يتعاملوا مع طلب استرجاع حسب السياسة المعتمدة."
  ],
  "product-launch-deck": [
    "Which launch facts and timing are confirmed?",
    "إيه تفاصيل وميعاد الإطلاق المؤكدين؟",
    "An app launch next month; price not announced yet.",
    "إطلاق تطبيق الشهر الجاي والسعر لسه متعلنش."
  ],
  "sales-deck": [
    "Which customer objection should the deck answer?",
    "إيه اعتراض العميل اللي العرض لازم يجاوب عليه؟",
    "They worry that setup will take too long.",
    "قلقان إن تشغيل الخدمة ياخد وقت طويل."
  ],
  "project-proposal": [
    "What is included, excluded and due when?",
    "إيه داخل المشروع وإيه برّه والتسليم إمتى؟",
    "A five-page website in four weeks, excluding hosting.",
    "موقع 5 صفحات في 4 أسابيع والاستضافة برّه العرض."
  ],
  "data-storytelling": [
    "What finding should the audience remember?",
    "أنهي نتيجة من الأرقام عايز الناس تفتكرها؟",
    "Repeat customers drove most of the growth.",
    "العملاء اللي رجعوا تاني سبب أغلب النمو."
  ],
  "launch-campaign": [
    "What is launching, when and with which offer?",
    "هنطلق إيه وإمتى والعرض المؤكد إيه؟",
    "A new service next month; no discounts approved.",
    "خدمة جديدة الشهر الجاي ومفيش خصومات معتمدة."
  ],
  "content-calendar": [
    "Which platforms, cadence and period should we plan?",
    "هنخطط لأنهي منصات وكام بوست ولمدة قد إيه؟",
    "Three Instagram posts weekly for one month.",
    "3 بوستات إنستجرام في الأسبوع لمدة شهر."
  ],
  "social-media-strategy": [
    "What is the current account situation?",
    "حساباتك وضعها إيه وعايز تغير فيها إيه؟",
    "Regular posting, but few inquiries about bookings.",
    "بننشر بانتظام بس الاستفسارات عن الحجز قليلة."
  ],
  "market-research": [
    "Which market decision should the research support?",
    "البحث يساعدك تاخد أنهي قرار في السوق؟",
    "Whether to open a boutique hotel in Luxor.",
    "هل نفتح فندق صغير مميز في الأقصر."
  ],
  "ad-copy": [
    "What offer and action should the ad communicate?",
    "الإعلان يوضح أنهي عرض والعميل يعمل إيه؟",
    "A free consultation; ask the reader to book a slot.",
    "استشارة مجانية والعميل يحجز معاد."
  ],
  "email-marketing": [
    "Who receives these emails and what may be sent?",
    "الإيميلات لمين وإيه المسموح نبعتلهم؟",
    "Opted-in customers receive a renewal reminder.",
    "عملاء موافقين على التواصل يوصلهم تذكير بالتجديد."
  ],
  "seo-plan": [
    "Which searches and pages are you targeting?",
    "عايز تظهر في أنهي عمليات بحث وبأنهي صفحات؟",
    "Arabic searches for family hotel offers in Hurghada.",
    "بحث عربي عن عروض فنادق عائلية في الغردقة."
  ],
  "product-commercial": [
    "What product benefit should the video demonstrate?",
    "الفيديو يورّي أنهي ميزة مؤكدة في المنتج؟",
    "Show how the refillable bottle opens and closes.",
    "نوري العبوة بتتفتح وتتقفل عشان تتملي تاني."
  ]
};

export function topicQuestions(topicId: string): WorkflowStep[] {
  const detail = details[topicId];
  if (!detail) return [];
  const [en, ar, exampleEn, exampleAr] = detail;
  return [{ id: `topic_${topicId}_detail`, kind: 'textarea', label: { en, ar },
    placeholder: { en: exampleEn, ar: exampleAr }, example: { en: exampleEn, ar: exampleAr },
    why: { en: `${en} This detail defines the scope of this particular task.`, ar: `${ar} التفصيلة دي بتحدد المطلوب في المهمة دي بالذات.` }, priority: 3 }];
}
