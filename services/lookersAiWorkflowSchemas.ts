import type { Question } from '../data/lookersAi';
import { videoChatQuestions } from './lookersAiVideoQuestions';
import type { WorkflowFamily } from './lookersAiWorkflowFamilies';

/** Compact, reusable interview definitions. One question per turn. */
type Copy = { en: string; ar: string };
export type WorkflowStep = Question & { why: Copy; priority: number; when?: { field: string; equals: string } };
export type WorkflowSchema = { family: WorkflowFamily; steps: WorkflowStep[] };

const c = (en: string, ar: string): Copy => ({ en, ar });

// User-facing help is intentionally Egyptian colloquial, not formal Arabic.
// It explains WHAT we need, WHY it matters, and gives a concrete example.
export const egyptianHelp: Record<string, string> = {
  voiceoverScript: 'اكتب الكلام اللي تحب يتقال بالحرف، عشان الصوت يحافظ على الرسالة اللي تقصدها.',
  subject: 'بص، قولّي إيه الحاجة الأساسية اللي عايزها تبان في الصورة. مش محتاج توصف كل تفصيلة، بس خلّيني أعرف هنصوّر إيه.',
  sourceAsset: 'يعني الصورة الأصلية اللي هنشتغل عليها. لو عندك صورة ارفعها، ولو لسه مش جاهزة قولّي.',
  change: 'قولّي عايز نغيّر إيه بالظبط في الصورة: الخلفية، الألوان، عنصر معيّن، ولا حاجة تانية؟',
  preserve: 'في حاجات مينفعش تتغيّر؟ زي شكل الوش أو اللوجو أو كتابة على المنتج؟ قولّي عليها عشان نحافظ عليها.',
  videoSubject: 'تخيّل الفيديو قدامك: إيه اللي هيظهر، وإيه اللي هيحصل؟ احكي المشهد ببساطة كأنك بتوصفه لصاحبك.',
  audioType: 'عايز صوت من نوع إيه؟ حد بيتكلم، موسيقى، مؤثرات، ولا تسجيل محتاج يتنضّف؟',
  audioContent: 'قولّي المفروض نسمع إيه، ولو فيه كلام محدد اكتبه زي ما تحب يتقال.',
  message: 'قولّي الرسالة اللي في دماغك، حتى لو كلمتين. إحنا هنظبط صياغتها بعد كده.',
  tone: 'يعني تحب الكلام رسمي ولا خفيف؟ ودود ولا جاد؟ اختار الإحساس اللي يناسب اللي هيقرأ.',
  offer: 'بتسوّق لإيه؟ قولّي المنتج أو الخدمة، ولو فيه عرض أو ميزة مهمة اذكرها.',
  situation: 'احكيلي وضع الشغل دلوقتي: إيه اللي بيحصل، وإيه المشكلة أو الفرصة اللي قدامك؟',
  researchQuestion: 'إيه السؤال اللي نفسك تلاقي له إجابة؟ كل ما يكون محدد، البحث يطلع أنفع.',
  scope: 'عايز البحث عن أنهي بلد أو سوق؟ ومحتاج معلومات جديدة ولا فترة معينة؟',
  dataQuestion: 'معاك أرقام وعايز تعرف منها إيه؟ مثلًا مين بيبيع أكتر أو ليه المبيعات قلت.',
  dataSource: 'الأرقام جاية منين؟ إكسيل، شيت، أو قاعدة بيانات؟ لو عندك ملف ارفعه.',
  topic: 'العرض هيكون عن إيه؟ قولّي الموضوع الأساسي، ومش لازم ترتب الشرائح بنفسك.',
  decision: 'بعد ما الناس تشوف العرض، عايزها تفهم إيه أو تاخد قرار بإيه؟',
  product: 'عايز تعمل موقع أو تطبيق أو تصلّح حاجة موجودة؟ احكي الفكرة من غير مصطلحات برمجة.',
  users: 'مين الناس اللي هتستخدم الحاجة دي؟ عملاء، موظفين، مديرين، ولا أنت بس؟',
  features: 'إيه أهم شوية حاجات لازم النظام يعملها؟ قولّي الأساسيات الأول، والتفاصيل نرتبها بعدين.',
  trigger: 'إيه الحدث اللي أول ما يحصل، العملية تشتغل؟ زي وصول إيميل أو إضافة طلب جديد.',
  steps: 'بعد ما العملية تبدأ، عايز يحصل إيه بالترتيب؟ قولّي الخطوات حتى لو بشكل بسيط.',
  approval: 'في خطوة لازم نرجعلك قبل ما تحصل؟ زي إرسال رسالة أو دفع فلوس أو تعديل بيانات.',
  learningGoal: 'عايز توصل لإيه؟ تتعلم مهارة، تجهز لمقابلة، ولا تذاكر موضوع معيّن؟',
  level: 'قولّي مستواك دلوقتي بصراحة: لسه بتبدأ ولا عندك خبرة؟ عشان الشرح يبقى مناسب ليك.',
  request: 'العميل طالب إيه بالظبط؟ احكي الموقف كأنه حصل قدامك.',
  policy: 'في شروط أو قواعد لازم نمشي عليها؟ قولّي المؤكد بس، ومش هنفترض سياسة من عندنا.',
  channel: 'هتبعت الرد فين؟ واتساب، إيميل، شات، ولا حاجة تانية؟',
  goal: 'يعني إيه النتيجة اللي نفسك توصلها من الشغل ده؟ بيع، شرح، شكل حلو، ولا قرار واضح؟',
  audience: 'مين اللي هيشوف أو يستخدم النتيجة؟ عشان نختار الكلام والشكل اللي يناسبه.',
  source: 'عندك صور أو ملفات أو معلومات لازم نعتمد عليها؟ لو مفيش، عادي نكمل بالموجود.',
  output: 'تحب النتيجة تطلع في شكل إيه؟ برومبت لأداة معيّنة، خطة، نص، ولا حاجة تانية؟',
  format: 'المقاس ده يعني شكل النتيجة: مربع للبوست، طولي للستوري، أو عريض للشاشة. اختار اللي يناسب استخدامك.'
};

const explanationReasons: Record<string, Copy> = {
  subject: c('Describe the main subject so the image focuses on the right thing.', 'عشان الصورة تركز على العنصر الصح.'),
  videoSubject: c('Describe what appears and happens so the scenes follow your idea.', 'عشان نبني المشاهد على فكرتك.'),
  audience: c('Tell us who will see it so the language and detail suit them.', 'عشان الكلام والتفاصيل يناسبوا الناس دي.'),
  goal: c('Name the desired result so the prompt has a clear purpose.', 'عشان البرومبت يركز على النتيجة اللي عايزها.'),
  message: c('Share the message so the draft preserves what you mean.', 'عشان نحافظ على المعنى اللي تقصده.'),
  tone: c('Describe the tone so the writing sounds right for your audience.', 'عشان الكلام يوصل بالإحساس اللي تقصده.'),
  source: c('Identify available material so the result is grounded in your facts.', 'عشان نعتمد على معلوماتك المؤكدة.'),
  output: c('Specify the deliverable and tool so the prompt fits your workflow.', 'عشان نجهز البرومبت بالشكل اللي أداتك محتاجاه.'),
};

const step = (id: string, en: string, ar: string, exampleEn: string, exampleAr: string, priority: number, optional = false): WorkflowStep => ({
  id, kind: 'textarea', label: c(en, ar), example: c(exampleEn, exampleAr),
  why: c(explanationReasons[id]?.en || `${en} Use confirmed details to define this requirement.`, egyptianHelp[id] || `المقصود بـ «${ar}»: وضّح النقطة دي من معلومات مشروعك.`),
  priority, optional
});
const goal = (en: string, ar: string): WorkflowStep => step('goal', en, ar, 'Make a clear, ready-to-use result.', 'عايز نتيجة واضحة وجاهزة للاستخدام.', 1);
const audience = (): WorkflowStep => step('audience', 'Who is this for?', 'ده معمول لمين؟', 'New customers in Egypt.', 'عملاء جدد في مصر.', 2);
const source = (): WorkflowStep => step('source', 'What facts or material should we use?', 'إيه المعلومات أو الملفات اللي هنعتمد عليها؟', 'I have product photos and an approved brief.', 'عندي صور المنتج والبريف المعتمد.', 3, true);
const output = (): WorkflowStep => step('output', 'What do you want to receive?', 'تحب تستلم النتيجة في شكل إيه؟', 'A short prompt ready for Canva.', 'برومبت قصير جاهز لـ Canva.', 4, true);
const format = (): WorkflowStep => ({
  id: 'format', kind: 'single', label: c('Choose a format', 'اختار المقاس'),
  options: [
    { value: '1:1', en: 'Square · 1:1', ar: 'مربع · 1:1' },
    { value: '9:16', en: 'Vertical · 9:16', ar: 'رأسي · 9:16' },
    { value: '16:9', en: 'Wide · 16:9', ar: 'أفقي · 16:9' },
    { value: '4:5', en: 'Portrait · 4:5', ar: 'طولي · 4:5' }
  ], why: c('Choose where the result will fit. You can change this later.', egyptianHelp.format),
  example: c('Stories are often vertical; feeds can be square.', 'الستوري غالبًا رأسي، والبوست ممكن يكون مربع.'),
  priority: 3, optional: true
});
const familySteps: Record<WorkflowFamily, WorkflowStep[]> = {
  'visual-create': [step('subject','What should appear?','إيه اللي عايز يظهر؟','A perfume bottle on marble.','زجاجة عطر على رخام.',1),goal('What is this image for?','هتستخدم الصورة في إيه؟'),format(),source()],
  'visual-edit': [step('sourceAsset','Which image should we edit?','هنعدل أنهي صورة؟','I will attach the original photo.','هرفع الصورة الأصلية.',1),step('change','What should change?','إيه اللي محتاج يتغير؟','Remove the background.','شيل الخلفية.',2),step('preserve','What must stay unchanged?','إيه اللي لازم يفضل زي ما هو؟','Keep the face and clothing identical.','حافظ على الوش واللبس زي ما هم.',3),format()],
  video: [step('videoSubject','What should happen in the video?','إيه اللي يحصل في الفيديو؟','A product reveal with a slow camera move.','المنتج يظهر مع حركة كاميرا بطيئة.',1),goal('What is the video for?','الفيديو هدفه إيه؟'),
    { ...videoChatQuestions.find(q => q.id === 'duration')!, why: c('Set the running time so the scene pacing fits.', 'قولّي الفيديو كام ثانية أو دقيقة، عشان نوزع المشاهد من غير زحمة.'), example: c('15 seconds.', '15 ثانية.'), priority: 2 },
    { ...format(), optional: false }, source(),
    ...videoChatQuestions.filter(q => q.optional).map(q => ({ ...q, why: c(q.id === 'videoAudio' ? 'Choose the sound so the prompt specifies the right audio.' : 'Choose the visual mood so the shots have a consistent look.', q.id === 'videoAudio' ? 'اختار الصوت اللي تحبه، عشان نحدد محتاجين موسيقى ولا كلام ولا هدوء.' : 'اختار إحساس الفيديو، عشان الإضاءة وحركة الكاميرا يمشوا معاه.'), example: c(q.id === 'videoAudio' ? 'Voice-over.' : 'Cinematic.', q.id === 'videoAudio' ? 'تعليق صوتي.' : 'سينمائي.'), priority: 4 })),
    { ...step('voiceoverScript','What exact words should the voice-over say?','التعليق الصوتي يقول إيه بالظبط؟','Discover our new fragrance.','اكتشف عطرنا الجديد.',5,true), when: { field: 'videoAudio', equals: 'voiceover' } }],
  audio: [step('audioType','What kind of audio?','عايز تعمل صوت من نوع إيه؟','Arabic voice-over for an ad.','تعليق صوتي عربي لإعلان.',1),step('audioContent','What should we hear?','عايز نسمع إيه؟','A friendly 20-second introduction.','مقدمة لطيفة مدتها 20 ثانية.',2),source(),output()],
  writing: [step('message','What do you want to say?','عايز تقول إيه؟','Apologize for a late delivery.','اعتذار عن تأخر التسليم.',1),audience(),step('tone','How should it sound?','تحب أسلوب الكلام يكون إزاي؟','Professional and warm.','احترافي وودود.',3,true),output()],
  marketing: [step('offer','What are you promoting?','إيه المنتج أو العرض؟','A new coffee shop opening.','افتتاح كافيه جديد.',1),goal('What result do you want?','عايز تحقق إيه؟'),audience(),source()],
  business: [step('situation','What is the business situation?','إيه وضع المشروع دلوقتي؟','An online store planning to expand.','متجر أونلاين عايز يتوسع.',1),goal('What decision do you need help with?','عايز تاخد قرار بخصوص إيه؟'),source(),output()],
  research: [step('researchQuestion','What do you want to find out?','عايز تعرف إيه بالضبط؟','Compare three hotel booking platforms.','مقارنة بين 3 منصات حجز فنادق.',1),step('scope','Which market or period matters?','أنهي سوق أو فترة مهمة؟','Egypt, this year.','مصر، السنة دي.',2),output()],
  data: [step('dataQuestion','What should the numbers tell you?','عايز تعرف إيه من الأرقام؟','Which products had the highest growth?','أنهي منتجات حققت أعلى نمو؟',1),step('dataSource','Where is the data?','الداتا موجودة فين؟','An Excel file I will upload.','ملف إكسيل هرفعه.',2),output()],
  presentation: [step('topic','What is the presentation about?','العرض عن إيه؟','Quarterly sales results.','نتائج المبيعات الربع سنوية.',1),audience(),step('decision','What should viewers understand or decide?','عايز اللي يشوفه يفهم أو يقرر إيه؟','Approve the next-quarter plan.','يوافق على خطة الربع الجاي.',3),source()],
  software: [step('product','What are you building or fixing?','عايز تبني أو تصلح إيه؟','A booking website.','موقع حجز.',1),step('users','Who will use it?','مين هيستخدمه؟','Customers and staff.','العملاء والموظفين.',2),step('features','What must it do?','إيه أهم حاجة لازم يعملها؟','Search, book and pay.','بحث وحجز ودفع.',3),source()],
  automation: [step('trigger','When should it start?','إمتى العملية تبدأ؟','When a new email arrives.','لما يوصل إيميل جديد.',1),step('steps','What should happen next?','إيه اللي يحصل بعدها؟','Extract the booking details into a sheet.','استخرج تفاصيل الحجز في شيت.',2),step('approval','What needs your approval?','إيه اللي محتاج موافقتك؟','Ask before sending a reply.','اسألني قبل إرسال الرد.',3)],
  learning: [step('learningGoal','What do you want to learn or achieve?','عايز تتعلم أو تحقق إيه؟','Prepare for a sales interview.','أستعد لمقابلة مبيعات.',1),step('level','What is your current level?','مستواك الحالي إيه؟','Beginner.','مبتدئ.',2),output()],
  service: [step('request','What does the customer need?','العميل محتاج إيه؟','Change a hotel booking.','يعدل حجز فندق.',1),step('policy','What rules or confirmed details apply?','إيه الشروط أو المعلومات المؤكدة؟','Changes depend on the hotel policy.','التعديل حسب سياسة الفندق.',2),step('channel','Where will you reply?','هترد عليه فين؟','WhatsApp.','واتساب.',3)]
};
export const workflowSchemas: Readonly<Record<WorkflowFamily, WorkflowSchema>> =
  Object.fromEntries(Object.entries(familySteps).map(([family, steps]) => [family, { family, steps }])) as Record<WorkflowFamily, WorkflowSchema>;

export function getWorkflowSteps(family: WorkflowFamily, answers: Record<string, unknown>): WorkflowStep[] {
  return workflowSchemas[family].steps
    .filter(q => !q.when || answers[q.when.field] === q.when.equals)
    .sort((a,b) => a.priority - b.priority);
}
export function validateWorkflowSchemas(): string[] {
  const errors: string[] = [];
  for (const [family, schema] of Object.entries(workflowSchemas)) {
    const ids = new Set<string>();
    for (const q of schema.steps) {
      if (ids.has(q.id)) errors.push(family + ':duplicate:' + q.id);
      if (!q.label.ar || !q.label.en || !q.why.ar || !q.why.en || !q.example?.ar || !q.example?.en) errors.push(family + ':missing-help:' + q.id);
      if (q.kind === 'single' && !q.options?.length) errors.push(family + ':missing-options:' + q.id);
      if (q.when && (!schema.steps.some(s => s.id === q.when!.field) || q.when.field === q.id)) errors.push(family + ':invalid-condition:' + q.id);
      ids.add(q.id);
    }
  }
  return errors;
}
