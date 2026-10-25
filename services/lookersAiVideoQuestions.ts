import type { Question } from '../data/lookersAi';

const option = (value: string, en: string, ar: string) => ({ value, en, ar });

/** Video-specific questions rendered as in-chat controls, not a separate wizard. */
export const videoChatQuestions: Question[] = [
  { id: 'videoSubject', kind: 'textarea', label: { en: 'What should we see in the video?', ar: 'إيه اللي عايز يظهر في الفيديو؟' }, example: { en: 'A luxury perfume bottle on black marble, with drifting mist.', ar: 'زجاجة عطر فاخرة على رخام أسود وحواليها ضباب خفيف.' } },
  { id: 'videoGoal', kind: 'single', label: { en: 'What is the video for?', ar: 'إيه الهدف من الفيديو؟' }, options: [
    option('ad', 'Product advertisement', 'إعلان منتج'), option('social', 'Social media content', 'محتوى سوشيال ميديا'),
    option('story', 'Tell a story', 'حكاية أو مشهد'), option('explainer', 'Explain something', 'شرح فكرة')
  ] },
  { id: 'duration', kind: 'single', label: { en: 'How long should the video be?', ar: 'عايز الفيديو مدته قد إيه؟' }, options: [
    option('5 seconds', '5 seconds', '5 ثواني'), option('10 seconds', '10 seconds', '10 ثواني'),
    option('15 seconds', '15 seconds', '15 ثانية'), option('30 seconds', '30 seconds', '30 ثانية'),
    option('60 seconds', '60 seconds', '60 ثانية')
  ] },
  { id: 'format', kind: 'single', label: { en: 'Which video dimensions?', ar: 'اختار أبعاد الفيديو' }, options: [
    option('9:16', 'Vertical · 9:16', 'رأسي · 9:16'), option('16:9', 'Landscape · 16:9', 'أفقي · 16:9'),
    option('1:1', 'Square · 1:1', 'مربع · 1:1')
  ] },
  { id: 'videoStyle', kind: 'single', label: { en: 'What visual mood?', ar: 'تحب شكل الفيديو يكون عامل إزاي؟' }, optional: true, options: [
    option('cinematic', 'Cinematic', 'سينمائي'), option('realistic', 'Realistic', 'واقعي'),
    option('animated', 'Animated', 'أنيميشن'), option('minimal', 'Minimal', 'بسيط وهادي')
  ] },
  { id: 'videoAudio', kind: 'single', label: { en: 'What about sound?', ar: 'تحب الصوت يكون إزاي؟' }, optional: true, options: [
    option('music', 'Music', 'موسيقى'), option('voiceover', 'Voice-over', 'تعليق صوتي'),
    option('ambient', 'Ambient sounds', 'أصوات طبيعية'), option('silent', 'No sound', 'من غير صوت')
  ] }
];
