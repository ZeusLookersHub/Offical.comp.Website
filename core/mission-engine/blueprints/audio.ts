import type { Blueprint, Copy, Gate, OutputContract, Slot, ToolTarget } from '../types.ts';
import { avoid, brandName, c, exactText, language, targetTool } from '../modules.ts';
import { makeTextMission, toneSlot } from './_text.ts';

const audioToolOptions = [
  { value: 'elevenlabs', label: c('ElevenLabs', 'ElevenLabs'), keywords: ['elevenlabs', 'eleven labs', 'إليفن'] },
  { value: 'suno', label: c('Suno', 'Suno'), keywords: ['suno', 'سونو'] },
  { value: 'chatgpt', label: c('ChatGPT', 'ChatGPT'), keywords: ['chatgpt', 'شات جي بي تي'] },
  { value: 'gemini', label: c('Gemini', 'Gemini'), keywords: ['gemini', 'جيميناي'] },
];

const audioTools = (): ToolTarget[] => [
  { id: 'universal', label: 'Universal', notes: 'Plain layered brief; works in any audio tool that takes a text prompt.' },
  { id: 'elevenlabs', label: 'ElevenLabs', notes: 'Put the script in the text box and the delivery notes in the voice settings; it reads punctuation, so write the pauses into the script.' },
  { id: 'suno', label: 'Suno', notes: 'Short style line plus the lyrics; keep the style under about 200 characters and name genre, mood, instruments and tempo.' },
  { id: 'chatgpt', label: 'ChatGPT', notes: 'Use it to finalise the script or lyrics first, then paste the result into the audio tool.' },
  { id: 'gemini', label: 'Gemini', notes: 'Use it to finalise the script or lyrics first, then paste the result into the audio tool.' },
];

function audioOutput(id: string, description: Copy, scriptDesc: string): OutputContract {
  return {
    id, description,
    fields: [
      { path: 'title', type: 'string', required: true, maxLength: 120, description: 'Short title in the user language.' },
      { path: 'sections', type: 'object', required: true, description: 'The four layers of the deliverable brief.' },
      { path: 'sections.goal', type: 'string', required: true, description: 'What the audio is for, who hears it, where (Understanding).' },
      { path: 'sections.approach', type: 'string', required: true, description: 'Voice or musical direction, structure, pacing (Intelligence).' },
      { path: 'sections.rules', type: 'string', required: true, description: 'Verbatim names, no invented claims, no copyrighted material, exclusions (Control).' },
      { path: 'sections.output', type: 'string', required: true, description: 'Length, format, settings, language and self-check (Delivery).' },
      { path: 'prompt', type: 'string', required: true, maxLength: 4000, description: 'The brief assembled with headings, ready to paste.' },
      { path: 'script', type: 'string[]', required: true, description: scriptDesc },
      { path: 'settings', type: 'record', required: true, description: 'Tool settings to use (voice, stability, style, tempo, length).' },
      { path: 'missingData', type: 'string[]', required: true, description: 'What the user still has to provide (may be empty).' },
      { path: 'variants', type: 'record', required: true, description: 'Tool id → ready prompt.' },
      { path: 'checklist', type: 'string[]', required: true, description: '4–6 checks for the result, user language.' },
      { path: 'summary', type: 'string', required: true, maxLength: 600, description: 'One or two sentences, user language.' },
    ],
  };
}

const audioGates = (): Gate[] => [
  { id: 'name-verbatim', kind: 'verbatim', slot: 'brandName', fields: ['prompt', 'script', 'variants.*'], nearMiss: true, message: c('Name kept exactly as written', 'الاسم مكتوب بالحرف') },
  { id: 'text-verbatim', kind: 'verbatim', slot: 'exactText', fields: ['prompt', 'script', 'variants.*'], nearMiss: true, message: c('Your words are said exactly as written', 'كلامك بيتقال بالحرف') },
  { id: 'no-invented-numbers', kind: 'no-invented-numbers', fields: ['prompt', 'script', 'variants.*'], message: c('No made-up prices or numbers', 'مفيش أسعار أو أرقام متألفة') },
];

/** The thing the audio is for — shared by every audio mission. */
const purpose = (label: Copy, question: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 900,
  label, question, why: c('The audio is built from this.', 'الصوت هيتبني من ده.'), example, vocabulary: vocab,
});

const placement = (options: { value: string; label: Copy; keywords?: string[] }[], def: string, defReason: Copy): Slot => ({
  id: 'placement', kind: 'single', layer: 'understanding', importance: 'important',
  label: c('Where it will be heard', 'هيتسمع فين'), question: c('Where will it be heard?', 'هيتسمع فين؟'),
  why: c('A phone speaker and headphones need different mixes and lengths.', 'سبيكر الموبايل والهيدفون محتاجين ميكس وطول مختلفين.'),
  example: c('In a reel on Instagram.', 'في ريل على إنستجرام.'), options, defaults: [{ value: def, reason: defReason }],
});

const lengthSlot = (values: { value: string; label: Copy }[], def: string, defReason: Copy): Slot => ({
  id: 'duration', kind: 'single', layer: 'delivery', importance: 'important',
  label: c('Length', 'المدة'), question: c('How long?', 'المدة أد إيه؟'),
  why: c('Length decides how many words fit.', 'المدة بتحدد كام كلمة تدخل.'),
  example: c('Thirty seconds.', 'تلاتين ثانية.'), options: values, defaults: [{ value: def, reason: defReason }],
});

function makeAudioMission(cfg: {
  id: string; title: Copy; topics: string[]; questionBudget?: number;
  intake: Blueprint['intake'];
  slots: Slot[];
  nameLabel: Copy; exactLabel: Copy; exactQuestion?: Copy;
  avoidVocab: { en: string[]; ar: string[] };
  scriptDesc: string; outputDescription: Copy; role: string;
  understanding: string[]; intelligence: string[]; controlExtra?: string[]; deliveryExtra?: string[];
  examples: { good: string; bad: string; why: string }[];
}): Blueprint {
  return {
    id: cfg.id, version: 1, title: cfg.title, topics: cfg.topics,
    intake: cfg.intake, questionBudget: cfg.questionBudget ?? 3,
    slots: [
      ...cfg.slots,
      brandName({ label: cfg.nameLabel }),
      exactText({ label: cfg.exactLabel, ...(cfg.exactQuestion ? { question: cfg.exactQuestion } : {}) }),
      language(), avoid(cfg.avoidVocab), targetTool(audioToolOptions),
    ],
    output: audioOutput(`audio-${cfg.id}`, cfg.outputDescription, cfg.scriptDesc),
    gates: audioGates(),
    tools: audioTools(),
    role: cfg.role,
    strategy: {
      understanding: cfg.understanding,
      intelligence: cfg.intelligence,
      control: [
        'sections.rules must say: say the brand name and exactText exactly as written; never invent prices, offers, claims or testimonials; use [placeholders] for anything missing; respect avoid.',
        'The brief must forbid imitating a real person\'s voice without permission, and must forbid using copyrighted music, lyrics or a recognisable melody.',
        ...(cfg.controlExtra ?? []),
      ],
      delivery: [
        'prompt = the four sections assembled under clear headings (Goal & context / Approach / Rules / Output) in the chosen language, ready to paste.',
        'settings must give concrete tool settings to start from, not vague advice.',
        'script carries the actual words or sections to produce, in order.',
        'variants: universal plus the chosen tool (all tools if universal), following each tool note.',
        'checklist and summary in the user language (Egyptian Arabic for ar).',
        ...(cfg.deliveryExtra ?? []),
      ],
    },
    examples: cfg.examples,
  };
}

export const voiceover = makeAudioMission({
  id: 'voiceover', title: c('Voiceover', 'تعليق صوتي'), topics: ['voiceover', 'text-to-speech'],
  intake: { question: c('Tell me what the voiceover is for and what it should say.', 'قولّي التعليق الصوتي لإيه، وهيقول إيه.'), why: c('Your words are read exactly as you wrote them.', 'كلامك هيتقرا بالحرف زي ما كتبته.'),
    starters: [c('A voiceover for my product reel', 'تعليق صوتي لريل منتجي'), c('Narration for an explainer video', 'تعليق لفيديو شرح'), c('A voice for my phone system', 'صوت لنظام التليفون'), c('A voiceover for an ad', 'تعليق صوتي لإعلان')] },
  slots: [
    purpose(c('What it is for', 'هو لإيه'), c('What is the video or audio about, and what should the voice achieve?', 'الفيديو أو الصوت عن إيه، والصوت يوصل لإيه؟'), c('A reel showing our new sneaker; it should make people want to try it.', 'ريل بيعرض الكوتشي الجديد؛ يخلي الناس تحب تجربه.'), { en: ['product reel', 'explainer', 'ad', 'phone greeting', 'audiobook', 'tutorial'], ar: ['ريل منتج', 'فيديو شرح', 'إعلان', 'ترحيب تليفون', 'كتاب صوتي', 'شرح خطوات'] }),
    placement([
      { value: 'reel', label: c('Reel / short video', 'ريل / فيديو قصير'), keywords: ['reel', 'tiktok', 'ريل'] },
      { value: 'youtube', label: c('YouTube', 'يوتيوب'), keywords: ['youtube', 'يوتيوب'] },
      { value: 'ad', label: c('Paid ad', 'إعلان ممول'), keywords: ['ad', 'اعلان'] },
      { value: 'ivr', label: c('Phone system', 'نظام تليفون'), keywords: ['ivr', 'phone', 'تليفون'] },
    ], 'reel', c('Short video is where most voiceovers are used.', 'الفيديو القصير هو أكتر مكان بيستخدم تعليق صوتي.')),
    { id: 'voice', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('The voice', 'الصوت'), question: c('What kind of voice?', 'أنهي نوع صوت؟'),
      why: c('The voice is most of the feeling.', 'الصوت هو أغلب الإحساس.'), example: c('Young and energetic.', 'شبابي وحماسي.'),
      options: [
        { value: 'energetic', label: c('Young and energetic', 'شبابي وحماسي'), keywords: ['energetic', 'young', 'حماسي', 'شبابي'] },
        { value: 'calm', label: c('Calm and trustworthy', 'هادي وبيدّي ثقة'), keywords: ['calm', 'trust', 'هادي', 'ثقة'] },
        { value: 'warm', label: c('Warm and friendly', 'دافي وودود'), keywords: ['warm', 'friendly', 'دافي', 'ودود'] },
        { value: 'serious', label: c('Serious and formal', 'جدّي ورسمي'), keywords: ['serious', 'formal', 'جدي', 'رسمي'] },
        { value: 'deep', label: c('Deep cinematic', 'عميق سينمائي'), keywords: ['deep', 'cinematic', 'عميق', 'سينمائي'] },
      ],
      defaults: [{ value: 'warm', reason: c('A warm voice suits most brands and ages well.', 'الصوت الدافي بيناسب أغلب البراندات وما بيقدمش.') }] },
    { id: 'dialect', kind: 'single', layer: 'delivery', importance: 'important',
      label: c('Accent / dialect', 'اللهجة'), question: c('Which Arabic (or English) should it be in?', 'أنهي عربي (أو إنجليزي)؟'),
      why: c('A dialect that does not match the audience sounds imported.', 'اللهجة اللي مش بتناسب الجمهور بتبان مستوردة.'),
      example: c('Egyptian Arabic.', 'مصري.'),
      options: [
        { value: 'egyptian', label: c('Egyptian Arabic', 'مصري'), keywords: ['egyptian', 'مصري'] },
        { value: 'gulf', label: c('Gulf Arabic', 'خليجي'), keywords: ['gulf', 'saudi', 'خليجي', 'سعودي'] },
        { value: 'levantine', label: c('Levantine Arabic', 'شامي'), keywords: ['levantine', 'شامي'] },
        { value: 'msa', label: c('Modern Standard Arabic', 'فصحى'), keywords: ['standard', 'fusha', 'فصحى'] },
        { value: 'english', label: c('English', 'إنجليزي'), keywords: ['english', 'انجليزي'] },
      ],
      defaults: [{ value: 'egyptian', reason: c('Egyptian Arabic travels furthest in the region for ads.', 'المصري بيوصل لأكبر جمهور في المنطقة في الإعلانات.') }] },
    lengthSlot([
      { value: '15', label: c('15 seconds', '١٥ ثانية') }, { value: '30', label: c('30 seconds', '٣٠ ثانية') },
      { value: '60', label: c('60 seconds', 'دقيقة') }, { value: '120', label: c('Two minutes', 'دقيقتين') },
    ], '30', c('Thirty seconds is about 70–80 words — the common ad length.', 'تلاتين ثانية حوالي ٧٠–٨٠ كلمة، وهي طول الإعلان الشائع.')),
  ],
  nameLabel: c('Brand name as it is said', 'اسم البراند زي ما بيتقال'),
  exactLabel: c('Words that must be said exactly', 'كلام لازم يتقال بالحرف'),
  exactQuestion: c('Is there a sentence, offer or phone number that must be said exactly as written?', 'في جملة أو عرض أو رقم لازم يتقال بالحرف؟'),
  avoidVocab: { en: ['imitating a real person', 'invented offers', 'speaking too fast', 'robotic reading', 'background music that buries the voice'], ar: ['تقليد شخص حقيقي', 'عروض متألفة', 'سرعة زيادة', 'قراية آلية', 'موسيقى تغطي الصوت'] },
  scriptDesc: 'The lines to be read, in order, one line per sentence with its pause marked.',
  outputDescription: c('A voiceover brief, the script line by line, the voice settings, and a checklist.', 'بريف تعليق صوتي، والسكريبت سطر سطر، وإعدادات الصوت، وقائمة فحص.'),
  role: 'Senior voice director who writes and directs ad narration, and a prompt engineer for AI voice tools.',
  understanding: [
    'subject is the job of the voice; placement and duration cap the word count (roughly 2.5 words a second); dialect must match the audience.',
    'sections.goal states what the audio is for, who hears it, where, and in which dialect.',
  ],
  intelligence: [
    'Write the script to the word count, in short spoken sentences, with the hook in the first three seconds and one call to action at the end. Mark the pauses and the emphasis in the script itself, because voice tools read punctuation.',
    'sections.approach tells the AI to write for the ear rather than the page — short clauses, no nested sentences, numbers written the way they are spoken — and to give a pronunciation note for any brand name or foreign word.',
  ],
  controlExtra: ['Never imitate a named real person\'s voice. Never read out a price, offer or phone number that is not in exactText.'],
  deliveryExtra: ['settings must include the voice type, stability and style values to start from, the speaking rate, and a pronunciation note per tricky word.'],
  examples: [{
    good: 'Script (30s, ~75 words), Egyptian Arabic, warm: "First line as the hook… [pause] …" Pronunciation: say the brand as written, not translated. Settings: stability 0.45, style 0.3, rate normal.',
    bad: 'Record a 30-second ad in the voice of [a famous actor], mention our 50% discount, and speak quickly to fit 200 words in.',
    why: 'The bad one imitates a real person, invents a discount, and packs in far more words than 30 seconds holds.',
  }],
});

export const musicGeneration = makeAudioMission({
  id: 'music-generation', title: c('Music', 'موسيقى'), topics: ['music-generation'],
  intake: { question: c('Tell me what the music is for and the feeling you want.', 'قولّي الموسيقى لإيه، والإحساس اللي عايزه.'), why: c('I write the style line and the structure. No copying existing songs.', 'هكتب سطر الستايل والهيكل. ومفيش تقليد لأغاني موجودة.'),
    starters: [c('Background music for my video', 'موسيقى خلفية لفيديو'), c('A jingle for my brand', 'جينجل للبراند'), c('Music for my podcast intro', 'موسيقى لمقدمة البودكاست'), c('A track for my shop', 'تراك للمحل')] },
  slots: [
    purpose(c('What it is for', 'هي لإيه'), c('What is it for, and what should the listener feel?', 'لإيه، والمستمع يحس بإيه؟'), c('Background for a sneaker reel; should feel fast and confident.', 'خلفية لريل كوتشي؛ تحس بسرعة وثقة.'), { en: ['video background', 'jingle', 'podcast intro', 'in-store', 'game', 'confident', 'calm', 'happy'], ar: ['خلفية فيديو', 'جينجل', 'مقدمة بودكاست', 'في المحل', 'لعبة', 'واثق', 'هادي', 'فرحان'] }),
    { id: 'genre', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Style', 'الستايل'), question: c('What musical style?', 'أنهي ستايل موسيقي؟'),
      why: c('The style is the first thing the tool needs.', 'الستايل أول حاجة الأداة محتاجاها.'), example: c('Modern electronic.', 'إلكتروني عصري.'),
      options: [
        { value: 'electronic', label: c('Modern electronic', 'إلكتروني عصري'), keywords: ['electronic', 'edm', 'الكتروني'] },
        { value: 'hiphop', label: c('Hip-hop / trap', 'هيب هوب / تراب'), keywords: ['hiphop', 'trap', 'هيب هوب', 'تراب'] },
        { value: 'cinematic', label: c('Cinematic orchestral', 'سينمائي أوركسترالي'), keywords: ['cinematic', 'orchestral', 'سينمائي'] },
        { value: 'acoustic', label: c('Acoustic and warm', 'أكوستيك ودافي'), keywords: ['acoustic', 'guitar', 'اكوستيك'] },
        { value: 'arabic-fusion', label: c('Arabic fusion', 'مزيج عربي'), keywords: ['arabic', 'oriental', 'عربي', 'شرقي'] },
        { value: 'lofi', label: c('Lo-fi and calm', 'لو فاي هادي'), keywords: ['lofi', 'chill', 'لو فاي', 'هادي'] },
      ],
      defaults: [{ value: 'electronic', reason: c('Modern electronic fits most short-video use.', 'الإلكتروني العصري بيناسب أغلب الفيديوهات القصيرة.') }] },
    { id: 'vocals', kind: 'single', layer: 'intelligence', importance: 'nice',
      label: c('Vocals', 'غنا'), question: c('With singing or instrumental only?', 'بغنا ولا موسيقى بس؟'),
      why: c('Vocals compete with a voiceover.', 'الغنا بيزاحم التعليق الصوتي.'), example: c('Instrumental only.', 'موسيقى بس.'),
      options: [
        { value: 'instrumental', label: c('Instrumental only', 'موسيقى بس'), keywords: ['instrumental', 'موسيقى بس'] },
        { value: 'hook', label: c('A short sung hook', 'هوك مغنّي قصير'), keywords: ['hook', 'jingle', 'هوك'] },
        { value: 'full', label: c('Full lyrics', 'كلمات كاملة'), keywords: ['lyrics', 'song', 'كلمات', 'أغنية'] },
      ],
      defaults: [{ value: 'instrumental', reason: c('Instrumental leaves room for your voiceover and never fights it.', 'الموسيقى بس بتسيب مساحة لتعليقك الصوتي.') }] },
    lengthSlot([
      { value: '15', label: c('15 seconds', '١٥ ثانية') }, { value: '30', label: c('30 seconds', '٣٠ ثانية') },
      { value: '60', label: c('A minute', 'دقيقة') }, { value: '120', label: c('Two minutes', 'دقيقتين') },
    ], '30', c('Thirty seconds covers a reel with room to loop.', 'تلاتين ثانية بتكفي ريل مع مساحة للتكرار.')),
  ],
  nameLabel: c('Brand name (if it is sung)', 'اسم البراند (لو هيتغنى)'),
  exactLabel: c('Words that must be sung exactly', 'كلام لازم يتغنى بالحرف'),
  avoidVocab: { en: ['copying an existing song', 'naming an artist to imitate', 'lyrics about anything I did not ask for', 'sudden volume jumps', 'vocals over my voiceover'], ar: ['تقليد أغنية موجودة', 'ذكر فنان للتقليد', 'كلمات عن حاجة ما طلبتهاش', 'قفزات صوت مفاجئة', 'غنا فوق تعليقي'] },
  scriptDesc: 'The structure in order: section — bars or seconds — what happens — (lyrics if any).',
  outputDescription: c('A music brief, the style line, the structure, the settings, and a checklist.', 'بريف موسيقى، وسطر الستايل، والهيكل، والإعدادات، وقائمة فحص.'),
  role: 'Senior music supervisor who briefs tracks for brands, and a prompt engineer for AI music tools.',
  understanding: [
    'subject is the feeling and the use; genre and vocals set the sound; duration sets the structure.',
    'sections.goal states what the music is for, the feeling, and whether a voiceover will sit on top of it.',
  ],
  intelligence: [
    'Give a short style line the tool can take directly (genre, mood, instruments, tempo in BPM, production feel) plus the structure second by second: intro, build, drop or chorus, outro, and where the energy peaks. If a voiceover sits on top, keep the middle sparse and say so.',
    'sections.approach tells the AI to describe the sound by instruments and tempo rather than by naming artists, and to make the first two seconds already recognisable because short video gets skipped fast.',
  ],
  controlExtra: ['Never name an artist, band or existing song to imitate, and never reproduce an existing melody or lyrics. The track must be original.'],
  deliveryExtra: ['settings must give the style line as one pasteable string under about 200 characters, the BPM, the key or mood, and whether to loop.'],
  examples: [{
    good: 'Style line: "modern electronic, confident, punchy drums, analog bass, bright synth stabs, 124 BPM, clean mix, space in the mids". Structure: 0–2s hook stab, 2–12s build, 12–22s drop, 22–30s outro. Mids kept sparse for the voiceover.',
    bad: 'Make a track exactly like [a famous song] by [a famous artist], same melody, with our brand name sung over it.',
    why: 'The bad one asks for a copy of a copyrighted song, which no tool should be asked to produce.',
  }],
});

export const soundEffects = makeAudioMission({
  id: 'sound-effects', title: c('Sound effects', 'مؤثرات صوتية'), topics: ['sound-effects', 'audio-cleanup'],
  questionBudget: 2,
  intake: { question: c('Tell me the sound you need and where it sits in the video.', 'قولّي الصوت اللي محتاجه، ومكانه في الفيديو.'), why: c('I describe the sound precisely so the tool does not guess.', 'هوصف الصوت بدقة علشان الأداة ما تخمّنش.'),
    starters: [c('A whoosh for my transition', 'صوت انتقال'), c('Sounds for a product video', 'أصوات لفيديو منتج'), c('A notification sound for my app', 'صوت تنبيه لتطبيقي'), c('Ambience for a scene', 'جو صوتي لمشهد')] },
  slots: [
    purpose(c('The sound you need', 'الصوت اللي محتاجه'), c('What should it sound like, and what is happening on screen?', 'الصوت يبقى شكله إيه، وبيحصل إيه على الشاشة؟'), c('A soft whoosh as the shoe slides into frame, then a light click.', 'صوت انسياب ناعم وقت دخول الكوتشي، وبعده كليك خفيف.'), { en: ['whoosh', 'click', 'notification', 'footsteps', 'ambience', 'impact', 'pour', 'unboxing'], ar: ['انسياب', 'كليك', 'تنبيه', 'خطوات', 'جو صوتي', 'ارتطام', 'سكب', 'فتح علبة'] }),
    placement([
      { value: 'transition', label: c('A transition', 'انتقال'), keywords: ['transition', 'انتقال'] },
      { value: 'action', label: c('An action on screen', 'حركة على الشاشة'), keywords: ['action', 'حركة'] },
      { value: 'ui', label: c('An app or interface sound', 'صوت تطبيق أو واجهة'), keywords: ['ui', 'app', 'تطبيق', 'واجهة'] },
      { value: 'ambience', label: c('Background ambience', 'جو صوتي خلفي'), keywords: ['ambience', 'background', 'جو', 'خلفية'] },
    ], 'action', c('Most effects are tied to something happening on screen.', 'أغلب المؤثرات مرتبطة بحاجة بتحصل على الشاشة.')),
    lengthSlot([
      { value: '1', label: c('Under a second', 'أقل من ثانية') }, { value: '3', label: c('About 3 seconds', 'حوالي ٣ ثواني') },
      { value: '10', label: c('About 10 seconds', 'حوالي ١٠ ثواني') }, { value: '30', label: c('30 seconds (ambience)', '٣٠ ثانية (جو صوتي)') },
    ], '3', c('Three seconds covers most effects with room to trim.', 'تلات ثواني بتكفي أغلب المؤثرات ومساحة للقص.')),
  ],
  nameLabel: c('Brand name (if a sound logo)', 'اسم البراند (لو صوت هوية)'),
  exactLabel: c('Words in the sound, if any', 'كلام في الصوت لو فيه'),
  avoidVocab: { en: ['copying a known brand sound', 'music instead of an effect', 'harsh peaks', 'long tails that bleed into speech', 'sounds that do not match the picture'], ar: ['تقليد صوت براند معروف', 'موسيقى بدل مؤثر', 'قمم صوت حادة', 'ذيل طويل بيزاحم الكلام', 'أصوات مش مطابقة للصورة'] },
  scriptDesc: 'One line per sound needed: name — when it plays — how it should sound.',
  outputDescription: c('A sound brief, the list of sounds, the settings, and a checklist.', 'بريف أصوات، وقائمة الأصوات، والإعدادات، وقائمة فحص.'),
  role: 'Senior sound designer for short-form video, and a prompt engineer for AI audio tools.',
  understanding: ['subject is the sound and what is on screen; placement and duration decide the shape and the tail.', 'sections.goal states what is happening on screen and what the sound has to support.'],
  intelligence: [
    'Describe each sound by its physical source, its material, its attack and tail, and its frequency character (low thud, mid body, bright top), plus where it hits relative to the picture. Say what must stay quiet so a voiceover can sit on top.',
    'sections.approach tells the AI to describe sounds as physical events rather than adjectives, and to keep an effect short — an effect that outlasts the action draws attention to itself.',
  ],
  controlExtra: ['Never imitate a known brand\'s sound logo or a copyrighted jingle.'],
  deliveryExtra: ['settings must give the length, whether it loops, the loudness target relative to speech, and a fade note.'],
  examples: [{
    good: 'Sound 1 "slide-in": fabric-and-air whoosh, soft attack, 400ms tail, energy in the mids, no low rumble, hits 2 frames before the shoe is fully in frame, sits 8 dB under speech.',
    bad: 'Make the Netflix sound but different, loud and long, and put it under the whole video.',
    why: 'The bad one imitates a protected sound logo and buries the rest of the audio.',
  }],
});

export const podcastEpisode = makeTextMission({
  id: 'podcast', title: c('Podcast episode', 'حلقة بودكاست'), topics: ['podcast'],
  intake: { question: c('Tell me the episode topic and who listens.', 'قولّي موضوع الحلقة، ومين بيسمع.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Plan an episode on this topic', 'خطط حلقة عن الموضوع ده'), c('Questions for a guest interview', 'أسئلة لحلقة مع ضيف'), c('A solo episode outline', 'هيكل حلقة فردية'), c('An episode about my own experience', 'حلقة عن تجربتي')] },
  slots: [
    { id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1000,
      label: c('Episode topic', 'موضوع الحلقة'), question: c('What is the episode about, and what should a listener walk away with?', 'الحلقة عن إيه، والمستمع يخرج بإيه؟'),
      why: c('An episode with no takeaway is a conversation.', 'الحلقة من غير فايدة واضحة تبقى دردشة.'),
      example: c('How small shops price their products; listeners should leave able to set a price.', 'إزاي المحلات الصغيرة بتسعّر؛ المستمع يخرج قادر يحدد سعر.'),
      vocabulary: { en: ['how to', 'my experience', 'a guest\'s story', 'a common mistake', 'a debate', 'news in our field'], ar: ['إزاي', 'تجربتي', 'حكاية ضيف', 'غلطة شائعة', 'نقاش', 'أخبار المجال'] } },
    { id: 'format', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Format', 'شكل الحلقة'), question: c('Solo, guest, or a conversation?', 'لوحدك، ولا ضيف، ولا نقاش؟'),
      why: c('A solo episode and an interview are structured differently.', 'الحلقة الفردية والمقابلة هيكلهم مختلف.'), example: c('With a guest.', 'مع ضيف.'),
      options: [
        { value: 'solo', label: c('Solo', 'لوحدي'), keywords: ['solo', 'لوحدي'] },
        { value: 'guest', label: c('Guest interview', 'مقابلة ضيف'), keywords: ['guest', 'interview', 'ضيف', 'مقابلة'] },
        { value: 'cohost', label: c('With a co-host', 'مع شريك'), keywords: ['cohost', 'شريك'] },
        { value: 'qa', label: c('Listener questions', 'أسئلة المستمعين'), keywords: ['questions', 'qa', 'أسئلة'] },
      ],
      defaults: [{ value: 'solo', reason: c('Solo is the easiest to record consistently.', 'الفردية أسهل حاجة تلتزم بيها.') }] },
    { id: 'audience', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 300,
      label: c('Listeners', 'المستمعين'), question: c('Who listens, and what do they already know?', 'مين بيسمع، وعارفين إيه بالفعل؟'),
      why: c('Their level decides what to explain.', 'مستواهم بيحدد إيه اللي يتشرح.'), example: c('Shop owners starting out.', 'أصحاب محلات في البداية.'),
      vocabulary: { en: ['beginners', 'experienced', 'shop owners', 'students', 'in my field', 'general audience'], ar: ['مبتدئين', 'خبرة', 'أصحاب محلات', 'طلبة', 'في مجالي', 'جمهور عام'] } },
    { id: 'episodeLength', kind: 'single', layer: 'delivery', importance: 'nice',
      label: c('Length', 'المدة'), question: c('How long is the episode?', 'الحلقة مدتها أد إيه؟'),
      why: c('Length decides how many segments fit.', 'المدة بتحدد كام مقطع يدخل.'), example: c('Half an hour.', 'نص ساعة.'),
      options: [
        { value: '10', label: c('10 minutes', '١٠ دقايق') }, { value: '20', label: c('20 minutes', '٢٠ دقيقة') },
        { value: '30', label: c('30 minutes', 'نص ساعة') }, { value: '60', label: c('An hour', 'ساعة') },
      ],
      defaults: [{ value: '30', reason: c('Half an hour fits a commute and holds attention.', 'نص ساعة بتناسب وقت الطريق وبتمسك الانتباه.') }] },
    toneSlot({ importance: 'nice' }),
  ],
  nameLabel: c('Podcast name', 'اسم البودكاست'), nameWhat: 'the podcast name',
  avoidVocab: { en: ['invented statistics', 'quoting a guest who did not say it', 'long intros', 'reading a script word for word', 'promising what the episode does not deliver'], ar: ['إحصائيات متألفة', 'اقتباس ضيف ما قالهوش', 'مقدمات طويلة', 'قراية سكريبت حرفي', 'وعود الحلقة ما بتحققهاش'] },
  outlineKey: 'episodeOutline', outlineDesc: 'One line per segment: minutes — what happens — the point it makes.', outlineWhat: 'one line per segment with its minutes',
  outputDescription: c('A prompt for a chat AI, the segment plan, the questions or talking points, and a checklist.', 'برومبت لأداة ذكاء اصطناعي، وخطة المقاطع، والأسئلة أو النقاط، وقائمة فحص.'),
  role: 'Senior podcast producer, and a prompt engineer for chat AIs.',
  understanding: ['subject carries the takeaway; format decides the structure; audience sets the level; episodeLength caps the segments.', 'sections.goal states the topic, the listener, and what they walk away able to do.'],
  intelligence: [
    'Plan segments with minute ranges: a 30-second hook that states the takeaway, the context, the main body in two or three moves, a concrete story or example per move, the practical summary, and the close with one call to action. For a guest format, give 8–12 questions ordered from easy to real, each with a follow-up, and mark the two you must not skip.',
    'sections.approach tells the AI to open with the takeaway rather than a greeting, to write talking points rather than a word-for-word script so it sounds spoken, and to put the strongest story in the first third.',
  ],
  controlExtra: ['Never invent statistics, studies or quotes, and never put words in a guest\'s mouth. Anything unverified is marked [check before recording].'],
  examples: [{
    good: '0:00–0:30 hook: "By the end you will know how to set a price without guessing." 3:00–12:00 move 1: cost-plus and why it fails — story of the shop that priced at cost +10% and lost money on delivery. Guest questions marked: two must-asks.',
    bad: 'Welcome everyone to another amazing episode! Studies show 87% of businesses fail at pricing. Today we talk about everything about pricing, marketing, hiring and motivation.',
    why: 'The bad one invents a statistic, buries the takeaway, and covers four topics in one episode.',
  }],
});

export const audioBlueprints = [voiceover, musicGeneration, soundEffects, podcastEpisode];
