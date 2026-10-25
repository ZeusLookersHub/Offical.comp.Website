import type { Question } from '../data/lookersAi';
import type { WorkflowFamily } from './lookersAiWorkflowFamilies';

/** Compact, reusable interview definitions. One question per turn. */
type Copy = { en: string; ar: string };
export type WorkflowStep = Question & { why: Copy; priority: number; when?: { field: string; equals: string } };
export type WorkflowSchema = { family: WorkflowFamily; steps: WorkflowStep[] };

const c = (en: string, ar: string): Copy => ({ en, ar });
const step = (id: string, en: string, ar: string, exampleEn: string, exampleAr: string, priority: number, optional = false): WorkflowStep => ({
  id, kind: 'textarea', label: c(en, ar), example: c(exampleEn, exampleAr),
  why: c('This helps tailor the result. One short answer is enough.', 'ده بيساعدنا نطلع نتيجة مناسبة. إجابة قصيرة كفاية.'),
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
  ], why: c('Choose where the result will fit. You can change this later.', 'المقاس بيتحدد حسب مكان الاستخدام، وتقدر تغيره بعدين.'),
  example: c('Stories are often vertical; feeds can be square.', 'الستوري غالبًا رأسي، والبوست ممكن يكون مربع.'),
  priority: 3, optional: true
});
const familySteps: Record<WorkflowFamily, WorkflowStep[]> = {
  'visual-create': [step('subject','What should appear?','إيه اللي عايز يظهر؟','A perfume bottle on marble.','زجاجة عطر على رخام.',1),goal('What is this image for?','هتستخدم الصورة في إيه؟'),format(),source()],
  'visual-edit': [step('sourceAsset','Which image should we edit?','هنعدل أنهي صورة؟','I will attach the original photo.','هرفع الصورة الأصلية.',1),step('change','What should change?','إيه اللي محتاج يتغير؟','Remove the background.','شيل الخلفية.',2),step('preserve','What must stay unchanged?','إيه اللي لازم يفضل زي ما هو؟','Keep the face and clothing identical.','حافظ على الوش واللبس زي ما هم.',3),format()],
  video: [step('videoSubject','What should happen in the video?','إيه اللي يحصل في الفيديو؟','A product reveal with a slow camera move.','المنتج يظهر مع حركة كاميرا بطيئة.',1),goal('What is the video for?','الفيديو هدفه إيه؟'),format(),source()],
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
      ids.add(q.id);
    }
  }
  return errors;
}
