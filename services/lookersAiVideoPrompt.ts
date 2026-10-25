import type { Lang, ProjectDraft } from '../data/lookersAi';

const read = (draft: ProjectDraft, key: string) => {
  const value = draft.answers[key];
  return typeof value === 'string' ? value.trim() : Array.isArray(value) ? value.join(', ') : '';
};

/** Video prompt compiler uses only user-supplied or explicitly extracted project facts. */
export function compileVideoChatPrompt(draft: ProjectDraft, language: Lang): string {
  if (draft.answers.contentType !== 'video') throw new Error('Not a video project');
  const ar = language === 'ar';
  const lines = [
    ar ? 'مهمة: إنشاء فيديو وفقًا للمواصفات التالية.' : 'Task: Create a video using these requirements.',
    (ar ? 'فكرة المستخدم: ' : 'User idea: ') + read(draft, 'idea'),
    (ar ? 'المشهد: ' : 'Scene: ') + (read(draft, 'videoSubject') || (ar ? 'غير محدد' : 'Not specified')),
    (ar ? 'الهدف: ' : 'Goal: ') + (read(draft, 'videoGoal') || (ar ? 'غير محدد' : 'Not specified')),
    (ar ? 'المدة: ' : 'Duration: ') + (read(draft, 'duration') || (ar ? 'غير محددة' : 'Not specified')),
    (ar ? 'الأبعاد: ' : 'Aspect ratio: ') + (read(draft, 'format') || (ar ? 'غير محددة' : 'Not specified')),
    (ar ? 'المنصة: ' : 'Platform: ') + (read(draft, 'platform') || (ar ? 'غير محددة' : 'Not specified')),
    (ar ? 'الأسلوب: ' : 'Visual style: ') + (read(draft, 'videoStyle') || (ar ? 'غير محدد' : 'Not specified')),
    (ar ? 'الصوت: ' : 'Audio: ') + (read(draft, 'videoAudio') || (ar ? 'غير محدد' : 'Not specified')),
    ar
      ? 'قدّم وصفًا واضحًا للمشاهد وحركة الكاميرا والإضاءة والتوقيت. لا تخترع حقائق عن المنتج أو تفاصيل غير مذكورة؛ وضّح أي افتراض إبداعي.'
      : 'Provide a clear scene, camera, lighting, and timing direction. Never invent product facts or missing requirements; label creative assumptions.',
  ];
  return lines.join('\n');
}
