import type { Lang } from './lookersAi';
export type ToolTaskFamily = 'images' | 'video' | 'presentation' | 'career' | 'marketing' | 'writing' | 'business' | 'data' | 'research' | 'coding' | 'productivity' | 'travel' | 'support' | 'audio' | 'ecommerce' | 'education';
export type ToolModality = 'text' | 'image' | 'video' | 'presentation' | 'data' | 'code' | 'audio';
export interface AITool {
  id: string; name: string; category: ToolTaskFamily; description: Record<Lang,string>;
  officialUrl: string; iconKey: ToolTaskFamily; supportedTaskTypes: ToolTaskFamily[];
  capabilities: string[]; modality: ToolModality[]; featured: boolean; curated: boolean; active: boolean;
  newInAi: boolean; addedAt: string; newLabel: Record<Lang,string>;
  lastVerifiedAt: string; verificationSource: string;
  // Optional preparation metadata for future compilers. This release uses the unchanged general prompt.
  preparation?: { preferredPromptFormat?: string; supportedInputs?: string[]; imageRequirements?: string[];
    presentationRequirements?: string[]; aspectRatios?: string[]; outputConstraints?: string[]; notes?: string[] };
}
export const toolCategories: {id:ToolTaskFamily;label:Record<Lang,string>}[] = [
  {
    "id": "images",
    "label": {
      "en": "Images",
      "ar": "صور"
    }
  },
  {
    "id": "video",
    "label": {
      "en": "Video",
      "ar": "فيديو"
    }
  },
  {
    "id": "presentation",
    "label": {
      "en": "Presentations",
      "ar": "عروض تقديمية"
    }
  },
  {
    "id": "career",
    "label": {
      "en": "CV / Career",
      "ar": "السيرة الذاتية والشغل"
    }
  },
  {
    "id": "marketing",
    "label": {
      "en": "Marketing",
      "ar": "تسويق"
    }
  },
  {
    "id": "writing",
    "label": {
      "en": "Writing",
      "ar": "كتابة"
    }
  },
  {
    "id": "business",
    "label": {
      "en": "Business",
      "ar": "أعمال"
    }
  },
  {
    "id": "data",
    "label": {
      "en": "Data",
      "ar": "بيانات"
    }
  },
  {
    "id": "research",
    "label": {
      "en": "Research",
      "ar": "بحث"
    }
  },
  {
    "id": "coding",
    "label": {
      "en": "Coding",
      "ar": "برمجة"
    }
  },
  {
    "id": "productivity",
    "label": {
      "en": "Productivity",
      "ar": "إنتاجية"
    }
  },
  {
    "id": "travel",
    "label": {
      "en": "Travel / Operations",
      "ar": "سفر وتشغيل"
    }
  },
  {
    "id": "support",
    "label": {
      "en": "Customer Support",
      "ar": "خدمة العملاء"
    }
  },
  {
    "id": "audio",
    "label": {
      "en": "Audio / Voice / Music",
      "ar": "صوت وموسيقى"
    }
  },
  {
    "id": "ecommerce",
    "label": {
      "en": "E-commerce",
      "ar": "تجارة إلكترونية"
    }
  },
  {
    "id": "education",
    "label": {
      "en": "Education",
      "ar": "تعليم"
    }
  }
];
/** Editorial additions to Lookers AI, not product launch dates or popularity claims. */
export const aiTools: AITool[] = [
  {
    "id": "gamma",
    "name": "Gamma",
    "category": "presentation",
    "officialUrl": "https://gamma.app",
    "description": {
      "en": "Turn ideas and content into a full presentation.",
      "ar": "مناسب لتحويل فكرتك ومحتواك لعرض تقديمي كامل."
    },
    "iconKey": "presentation",
    "supportedTaskTypes": [
      "presentation",
      "business",
      "marketing",
      "education"
    ],
    "capabilities": [
      "presentations",
      "pitch-decks",
      "business-decks",
      "educational-presentations",
      "visual-storytelling",
      "data-presentations"
    ],
    "modality": [
      "presentation"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": true,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://gamma.app/products/presentations"
  },
  {
    "id": "canva",
    "name": "Canva",
    "category": "presentation",
    "officialUrl": "https://www.canva.com",
    "description": {
      "en": "Create presentations and visual designs with your brand in mind.",
      "ar": "مناسب لو التصميم والهوية مهمين في العرض."
    },
    "iconKey": "presentation",
    "supportedTaskTypes": [
      "presentation",
      "images",
      "marketing",
      "career",
      "data",
      "ecommerce",
      "education"
    ],
    "capabilities": [
      "presentations",
      "pitch-decks",
      "business-decks",
      "educational-presentations",
      "data-presentations",
      "brand-design",
      "visual-design"
    ],
    "modality": [
      "presentation",
      "image"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": true,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://www.canva.com/create/ai-presentations/"
  },
  {
    "id": "beautiful-ai",
    "name": "Beautiful.ai",
    "category": "presentation",
    "officialUrl": "https://www.beautiful.ai",
    "description": {
      "en": "Build professional decks with structured slide layouts.",
      "ar": "مناسب للعروض المهنية المنظمة بتصميم شرائح واضح."
    },
    "iconKey": "presentation",
    "supportedTaskTypes": [
      "presentation",
      "business",
      "marketing",
      "education"
    ],
    "capabilities": [
      "presentations",
      "pitch-decks",
      "business-decks",
      "sales-decks",
      "educational-presentations",
      "data-presentations"
    ],
    "modality": [
      "presentation"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": true,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://www.beautiful.ai/presentations"
  },
  {
    "id": "powerpoint",
    "name": "Microsoft PowerPoint / Copilot",
    "category": "presentation",
    "officialUrl": "https://www.microsoft.com/en-us/microsoft-365/powerpoint/ai-powerpoint-generator",
    "description": {
      "en": "Draft and refine slides inside PowerPoint with Copilot.",
      "ar": "مناسب لو هتكمل الشغل داخل PowerPoint مع Copilot."
    },
    "iconKey": "presentation",
    "supportedTaskTypes": [
      "presentation",
      "business",
      "data",
      "education"
    ],
    "capabilities": [
      "presentations",
      "business-decks",
      "data-presentations",
      "educational-presentations",
      "powerpoint-workflow"
    ],
    "modality": [
      "presentation"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://support.microsoft.com/en-us/powerpoint/copilot/create-a-new-presentation-with-copilot-in-powerpoint"
  },
  {
    "id": "google-slides",
    "name": "Google Slides / Gemini",
    "category": "presentation",
    "officialUrl": "https://workspace.google.com/products/slides/",
    "description": {
      "en": "Generate slide content with Gemini and collaborate in Google Slides.",
      "ar": "مناسب لتجهيز الشرائح مع Gemini والتعاون داخل Google Slides."
    },
    "iconKey": "presentation",
    "supportedTaskTypes": [
      "presentation",
      "data",
      "education",
      "productivity"
    ],
    "capabilities": [
      "presentations",
      "educational-presentations",
      "data-presentations",
      "google-workflow",
      "collaboration"
    ],
    "modality": [
      "presentation"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://workspace.google.com/products/slides/"
  },
  {
    "id": "prezi",
    "name": "Prezi",
    "category": "presentation",
    "officialUrl": "https://prezi.com",
    "description": {
      "en": "Turn a topic or file into a dynamic visual presentation.",
      "ar": "مناسب لعرض الأفكار بشكل بصري متحرك ومترابط."
    },
    "iconKey": "presentation",
    "supportedTaskTypes": [
      "presentation",
      "education",
      "business"
    ],
    "capabilities": [
      "presentations",
      "visual-storytelling",
      "educational-presentations"
    ],
    "modality": [
      "presentation"
    ],
    "featured": false,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://prezi.com/ai-presentation-maker/"
  },
  {
    "id": "pitch",
    "name": "Pitch",
    "category": "presentation",
    "officialUrl": "https://pitch.com",
    "description": {
      "en": "Create and collaborate on business and pitch decks.",
      "ar": "مناسب لعروض البزنس وpitch decks وشغل الفريق."
    },
    "iconKey": "presentation",
    "supportedTaskTypes": [
      "presentation",
      "business",
      "marketing"
    ],
    "capabilities": [
      "presentations",
      "pitch-decks",
      "business-decks",
      "collaboration",
      "brand-design"
    ],
    "modality": [
      "presentation"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": true,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://pitch.com/product"
  },
  {
    "id": "chatgpt",
    "name": "ChatGPT",
    "category": "writing",
    "officialUrl": "https://chatgpt.com",
    "description": {
      "en": "Draft, learn, plan, code and explore supplied files and data.",
      "ar": "مناسب للكتابة والتعلّم والتخطيط والبرمجة وفهم ملفاتك وبياناتك."
    },
    "iconKey": "writing",
    "supportedTaskTypes": [
      "career",
      "marketing",
      "writing",
      "business",
      "data",
      "research",
      "coding",
      "productivity",
      "travel",
      "support",
      "ecommerce",
      "education",
      "images"
    ],
    "capabilities": [
      "writing",
      "planning",
      "coding",
      "data-analysis",
      "research",
      "learning",
      "image-generation"
    ],
    "modality": [
      "text",
      "code",
      "data",
      "image"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://help.openai.com/en/articles/9260256-chatgpt-capabilities-overview"
  },
  {
    "id": "claude",
    "name": "Claude",
    "category": "writing",
    "officialUrl": "https://claude.ai",
    "description": {
      "en": "Write and refine documents, analyze data and work through code.",
      "ar": "مناسب لكتابة المستندات وتحسينها وتحليل البيانات ومراجعة الكود."
    },
    "iconKey": "writing",
    "supportedTaskTypes": [
      "career",
      "marketing",
      "writing",
      "business",
      "data",
      "research",
      "coding",
      "productivity",
      "travel",
      "support",
      "ecommerce",
      "education"
    ],
    "capabilities": [
      "writing",
      "planning",
      "coding",
      "data-analysis",
      "research",
      "learning"
    ],
    "modality": [
      "text",
      "code",
      "data"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://claude.com/product/overview"
  },
  {
    "id": "gemini",
    "name": "Gemini",
    "category": "writing",
    "officialUrl": "https://gemini.google.com",
    "description": {
      "en": "Explore ideas, research, write and learn with Google’s assistant.",
      "ar": "مناسب للأفكار والبحث والكتابة والتعلّم مع مساعد Google."
    },
    "iconKey": "writing",
    "supportedTaskTypes": [
      "career",
      "marketing",
      "writing",
      "business",
      "data",
      "research",
      "coding",
      "productivity",
      "travel",
      "support",
      "ecommerce",
      "education"
    ],
    "capabilities": [
      "writing",
      "planning",
      "research",
      "learning",
      "coding",
      "data-analysis"
    ],
    "modality": [
      "text",
      "code",
      "data"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://gemini.google/overview/"
  },
  {
    "id": "midjourney",
    "name": "Midjourney",
    "category": "images",
    "officialUrl": "https://www.midjourney.com",
    "description": {
      "en": "Generate and refine images from your visual brief.",
      "ar": "مناسب لتوليد صور وتحسينها من وصفك البصري."
    },
    "iconKey": "images",
    "supportedTaskTypes": [
      "images",
      "marketing",
      "ecommerce"
    ],
    "capabilities": [
      "image-generation",
      "visual-design"
    ],
    "modality": [
      "image"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://docs.midjourney.com/hc/en-us/articles/33390732264589-Creating-on-Web"
  },
  {
    "id": "runway",
    "name": "Runway",
    "category": "video",
    "officialUrl": "https://runway.com",
    "description": {
      "en": "Generate and edit video and images in a creative workspace.",
      "ar": "مناسب لتوليد وتعديل الفيديو والصور في مساحة إبداعية."
    },
    "iconKey": "video",
    "supportedTaskTypes": [
      "video",
      "images",
      "marketing"
    ],
    "capabilities": [
      "video-generation",
      "image-generation",
      "video-editing"
    ],
    "modality": [
      "video",
      "image"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://runway.com/"
  },
  {
    "id": "elevenlabs",
    "name": "ElevenLabs",
    "category": "audio",
    "officialUrl": "https://elevenlabs.io/text-to-speech",
    "description": {
      "en": "Turn finished text into speech and voiceovers.",
      "ar": "مناسب لتحويل النص النهائي لصوت وتعليق صوتي."
    },
    "iconKey": "audio",
    "supportedTaskTypes": [
      "audio",
      "video",
      "marketing",
      "education"
    ],
    "capabilities": [
      "text-to-speech",
      "voiceover"
    ],
    "modality": [
      "audio"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": true,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://elevenlabs.io/text-to-speech"
  },
  {
    "id": "suno",
    "name": "Suno",
    "category": "audio",
    "officialUrl": "https://suno.com",
    "description": {
      "en": "Create songs and music from a description or lyrics.",
      "ar": "مناسب لعمل أغاني وموسيقى من وصف أو كلمات."
    },
    "iconKey": "audio",
    "supportedTaskTypes": [
      "audio"
    ],
    "capabilities": [
      "music-generation"
    ],
    "modality": [
      "audio"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://help.suno.com/en/articles/2462273"
  },
  {
    "id": "perplexity",
    "name": "Perplexity",
    "category": "research",
    "officialUrl": "https://www.perplexity.ai",
    "description": {
      "en": "Research questions with links to original sources.",
      "ar": "مناسب للبحث عن إجابات مع روابط المصادر الأصلية."
    },
    "iconKey": "research",
    "supportedTaskTypes": [
      "research",
      "business",
      "travel",
      "education"
    ],
    "capabilities": [
      "research",
      "source-search"
    ],
    "modality": [
      "text"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://www.perplexity.ai/help-center/en/articles/10352903-what-is-pro-search"
  },
  {
    "id": "github-copilot",
    "name": "GitHub Copilot",
    "category": "coding",
    "officialUrl": "https://github.com/features/copilot",
    "description": {
      "en": "Develop, explain and review code in your coding workflow.",
      "ar": "مناسب لتطوير وشرح ومراجعة الكود أثناء شغلك."
    },
    "iconKey": "coding",
    "supportedTaskTypes": [
      "coding"
    ],
    "capabilities": [
      "coding",
      "code-review"
    ],
    "modality": [
      "code"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": false,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://github.com/features/copilot"
  },
  {
    "id": "notion",
    "name": "Notion AI",
    "category": "productivity",
    "officialUrl": "https://www.notion.com/product/ai",
    "description": {
      "en": "Draft, summarize and organize work in Notion pages and tasks.",
      "ar": "مناسب للكتابة والتلخيص وتنظيم الشغل في صفحات ومهام Notion."
    },
    "iconKey": "productivity",
    "supportedTaskTypes": [
      "productivity",
      "writing",
      "business",
      "research",
      "support",
      "education"
    ],
    "capabilities": [
      "writing",
      "planning",
      "summarization",
      "research",
      "notion-workflow"
    ],
    "modality": [
      "text"
    ],
    "featured": true,
    "curated": true,
    "active": true,
    "newInAi": true,
    "addedAt": "2026-10-11",
    "newLabel": {
      "en": "New in AI",
      "ar": "جديد في الـAI"
    },
    "lastVerifiedAt": "2026-10-11",
    "verificationSource": "https://www.notion.com/product/ai"
  }
];
