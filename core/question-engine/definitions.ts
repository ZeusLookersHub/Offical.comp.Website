import type { ProjectEngineId } from '../projects/types';
import { isProjectEngineId } from '../projects/engines';
import type { Field, QuestionDefinition, QuestionSchema } from './types';

const question = (field: Field, en: string, ar: string, extra: Partial<QuestionDefinition> = {}): QuestionDefinition => ({
  id: field, field, label: { en, ar }, type: 'textarea', state: 'required', nature: 'factual',
  critical: true, inferable: false, userOverride: true, priority: 70, ...extra,
});
const optional = { state: 'optional', critical: false, priority: 20 } as const;
const technical = { nature: 'technical', critical: false, inferable: true, priority: 40 } as const;
const visual: QuestionDefinition[] = [
  question('details.subject', 'What subject or product should appear?', 'ما العنصر أو المنتج المطلوب ظهوره؟'),
  question('details.usage', 'Where will it be used?', 'أين ستُستخدم النتيجة؟', { ...optional, type: 'text' }),
  question('details.aspectRatio', 'Which aspect ratio should be used?', 'ما نسبة أبعاد الصورة؟', {
    ...technical, type: 'text', defaultRule: { when: [{ field: 'details.usage', equals: 'Instagram Story' }], value: '9:16' },
  }),
  question('details.style', 'What visual style do you prefer?', 'ما الأسلوب البصري الذي تفضله؟', {
    ...optional, nature: 'creative', inferable: true,
  }),
  question('details.includeText', 'Should exact text appear?', 'هل تريد إظهار نص حرفي؟', {
    ...optional, type: 'single', options: [
      { value: 'yes', label: { en: 'Yes', ar: 'نعم' } }, { value: 'no', label: { en: 'No', ar: 'لا' } },
    ],
  }),
  question('details.exactText', 'What is the exact approved text?', 'ما النص الحرفي المعتمد؟', {
    state: 'conditional', requiredWhen: [{ field: 'details.includeText', equals: 'yes' }],
  }),
];
/** Specialization is data, never extra fields on the universal Project model. */
const specialized: Partial<Record<ProjectEngineId, QuestionDefinition[]>> = {
  'visual.image': visual,
  'visual.video': [...visual, question('details.duration', 'How long should the video be?', 'ما مدة الفيديو المطلوبة؟', technical)],
  business: [question('details.businessFacts', 'Which verified business facts should be used?', 'ما معلومات النشاط المؤكدة التي يجب استخدامها؟')],
  cv: [question('details.targetRole', 'Which role are you targeting?', 'ما الوظيفة المستهدفة؟'),
    question('details.experience', 'What experience and credentials can you verify?', 'ما الخبرات والمؤهلات التي يمكنك تأكيدها؟')],
  powerpoint: [question('details.slideCount', 'How many slides would you prefer?', 'كم شريحة تفضل؟', { ...technical, ...optional })],
  excel: [question('details.dataSource', 'What actual data is available?', 'ما البيانات الفعلية المتاحة؟')],
  report: [question('details.dataSource', 'Which verified sources support the report?', 'ما المصادر المؤكدة التي يستند إليها التقرير؟')],
  proposal: [question('details.scope', 'What scope and terms are confirmed?', 'ما نطاق العمل والشروط المؤكدة؟')],
  'business-plan': [question('details.businessFacts', 'What business facts and financial inputs are confirmed?', 'ما معلومات النشاط والمدخلات المالية المؤكدة؟')],
  'project-product': [question('details.requirements', 'What requirements are confirmed?', 'ما المتطلبات المؤكدة؟')],
};
export function getQuestionSchema(engineId: ProjectEngineId): QuestionSchema {
  if (!isProjectEngineId(engineId)) throw new Error('unsupported_engine');
  return structuredClone({ engineId, definitions: [
    question('intent', 'What would you like to create?', 'ما الذي تريد إنشاءه؟', { priority: 100 }),
    question('objective', 'What should the result achieve?', 'ما الهدف من النتيجة؟', { priority: 90 }),
    question('audience', 'Who is the audience?', 'من الجمهور المستهدف؟', optional),
    question('context', 'What context should be considered?', 'ما السياق الذي يجب مراعاته؟', optional),
    ...(specialized[engineId] || []),
  ] });
}
