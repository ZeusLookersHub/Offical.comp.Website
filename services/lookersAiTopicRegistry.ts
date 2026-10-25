import type { WorkflowFamily } from './lookersAiWorkflowFamilies';

const groups: Record<WorkflowFamily, string> = {
  'visual-create': 'product-photography social-post-design poster-design logo-concept brand-identity packaging-design illustration portrait-character ui-visual mockup-scene',
  'visual-edit': 'photo-retouch background-removal image-upscale style-transfer reference-composite object-removal resize-reframe',
  video: 'text-to-video image-to-video product-commercial social-reel cinematic-shot video-storyboard explainer-video motion-graphics video-editing video-localization avatar-video',
  audio: 'voiceover text-to-speech podcast music-generation sound-effects dubbing audio-cleanup transcription',
  writing: 'email-draft professional-message social-caption ad-copy blog-article website-copy product-description translation rewrite proofreading summarization script-writing press-release',
  marketing: 'marketing-strategy launch-campaign paid-ads content-calendar social-media-strategy influencer-brief email-marketing seo-plan conversion-funnel',
  business: 'business-plan feasibility-study business-model swot-analysis go-to-market pricing-strategy growth-strategy financial-plan brand-positioning',
  research: 'competitor-analysis market-research audience-research deep-research fact-checking product-comparison literature-review',
  data: 'spreadsheet-formula data-cleaning data-analysis dashboard-design kpi-definition sales-analysis financial-report survey-analysis',
  presentation: 'investor-pitch company-profile sales-deck quarterly-review marketing-deck strategy-deck executive-deck product-launch-deck training-deck workshop-deck education-deck data-storytelling project-proposal hotel-deck tourism-deck report-document',
  software: 'website landing-page web-app mobile-app ui-ux ai-chatbot ai-agent api-integration database-design debugging refactoring testing architecture-review deployment-plan',
  automation: 'operational-sop workflow-automation no-code-integration spreadsheet-automation project-plan task-prioritization',
  learning: 'cv-resume cover-letter interview-preparation linkedin-profile career-plan job-search skill-roadmap lesson-plan exam-preparation tutor quiz training-curriculum',
  service: 'customer-support support-script faq-knowledge-base escalation travel-itinerary hotel-offer tourism-package booking-communication'
};
export type TopicEntry = { id: string; family: WorkflowFamily };
export const topicRegistry: readonly TopicEntry[] = Object.entries(groups).flatMap(([family, ids]) =>
  ids.split(' ').map(id => ({ id, family: family as WorkflowFamily }))
);
const index = new Map(topicRegistry.map(entry => [entry.id, entry]));
export const topicAliases: Record<string,string> = {
  'brand-identity-direction':'brand-identity', 'ui-ux-specification':'ui-ux',
  'product-photo':'product-photography','campaign-brief':'launch-campaign',
  'career-cv':'cv-resume','data-dashboard':'dashboard-design',
  'presentation-outline':'company-profile','support-reply':'customer-support',
  'video-storyboard':'video-storyboard','pitch-deck':'investor-pitch',
  'business-review':'quarterly-review','training-slides':'training-deck',
  'product-launch':'product-launch-deck','automation':'workflow-automation'
};
export function resolveTopic(id: string): TopicEntry | undefined {
  return index.get(topicAliases[id] || id);
}
export function validateTopicRegistry(): string[] {
  const seen = new Set<string>(); const errors: string[] = [];
  for (const entry of topicRegistry) {
    if (seen.has(entry.id)) errors.push('duplicate:' + entry.id);
    seen.add(entry.id);
  }
  for (const [alias,target] of Object.entries(topicAliases)) {
    if (!seen.has(target)) errors.push('unresolved:' + alias);
  }
  return errors;
}
