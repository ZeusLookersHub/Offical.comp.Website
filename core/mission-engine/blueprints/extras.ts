import type { Blueprint, Copy, OptionVisual, Slot } from '../types.ts';
import { avoid, brandName, c, exactText, facts, language, ratio, reference, targetTool } from '../modules.ts';
import { makeTextMission } from './_text.ts';
import { makeBuildMission } from './_build.ts';

/* ── motion graphics: animated logos, kinetic text, short explainer motion ───────── */

const clip = (value: string, en: string, ar: string, gen: string): OptionVisual => ({
  media: 'video', asset: `/assets/lookers-ai/examples/motion-graphics/${value}.mp4`, description: c(en, ar), generate: gen,
});

export const motionGraphics: Blueprint = {
  id: 'motion-graphics', version: 1,
  title: c('Motion design', 'موشن جرافيك'),
  topics: ['motion-graphics'],
  intake: {
    question: c('Tell me what should move, and where it will run.', 'قولّي إيه اللي هيتحرك، وهينزل فين.'),
    why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [
      c('An animated logo for the start of my videos', 'لوجو متحرك لبداية فيديوهاتي'),
      c('Kinetic text for an offer announcement', 'كلام متحرك لإعلان عرض'),
      c('A short animation explaining how we work', 'أنيميشن قصير يشرح إزاي بنشتغل'),
      c('Moving titles for my reels', 'عناوين متحركة لريلزي'),
    ],
  },
  questionBudget: 3,
  slots: [
    {
      id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 700,
      label: c('What moves', 'اللي هيتحرك'),
      question: c('What should move — a logo, text, icons, a scene?', 'إيه اللي هيتحرك: لوجو، كلام، أيقونات، مشهد؟'),
      why: c('Motion is built on one subject; more than one and nothing reads.', 'الحركة بتتبني على عنصر واحد، وأكتر من كده مفيش حاجة بتتقري.'),
      example: c('Our logo assembling from three shapes, then the tagline appearing.', 'اللوجو بيتجمّع من تلات أشكال، وبعدها الجملة بتظهر.'),
      vocabulary: {
        en: ['logo', 'text', 'icons', 'numbers', 'a product', 'assembling', 'appearing', 'typing out', 'sliding in'],
        ar: ['لوجو', 'كلام', 'أيقونات', 'أرقام', 'منتج', 'بيتجمّع', 'بيظهر', 'بيتكتب', 'بيدخل من الجنب'],
      },
    },
    brandName({ label: c('Brand name in the animation', 'اسم البراند في الأنيميشن'), question: c('Is a brand name on screen? Write it exactly.', 'في اسم براند على الشاشة؟ اكتبه بالحرف.') }),
    exactText({ label: c('Words on screen', 'الكلام على الشاشة'), question: c('What words appear, exactly as written?', 'إيه الكلام اللي هيظهر، بالحرف؟') }),
    {
      id: 'usage', kind: 'single', layer: 'understanding', importance: 'important',
      label: c('Where it will run', 'هينزل فين'),
      question: c('Where will it run?', 'هينزل فين؟'),
      why: c('This decides the frame, the length and how fast it can move.', 'ده بيحدد الكادر والمدة وسرعة الحركة.'),
      example: c('At the start of my reels.', 'في بداية الريلز.'),
      options: [
        { value: 'intro', label: c('Intro / outro of a video', 'بداية أو نهاية فيديو'), keywords: ['intro', 'outro', 'بداية', 'نهاية'] },
        { value: 'reel', label: c('Reel / TikTok / Story', 'ريل / تيك توك / ستوري'), keywords: ['reel', 'tiktok', 'story', 'ريل', 'ستوري'] },
        { value: 'ad', label: c('Paid ad', 'إعلان ممول'), keywords: ['ad', 'اعلان', 'ممول'] },
        { value: 'web', label: c('Website / screen loop', 'موقع أو شاشة متكررة'), keywords: ['website', 'loop', 'موقع', 'متكرر', 'شاشة'] },
      ],
      defaults: [{ value: 'reel', reason: c('Short vertical video is where most motion runs.', 'الفيديو القصير الطولي هو أكتر مكان للموشن.') }],
    },
    {
      id: 'style', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('Motion style', 'أسلوب الحركة'),
      question: c('How should it move?', 'يتحرك إزاي؟'),
      why: c('The style decides the easing, the timing and the whole feel.', 'الأسلوب بيحدد إيقاع الحركة والتوقيت والإحساس كله.'),
      example: c('Snappy and graphic.', 'سريع وجرافيكي.'),
      options: [
        { value: 'snappy-graphic', label: c('Snappy and graphic', 'سريع وجرافيكي'), keywords: ['snappy', 'graphic', 'fast', 'سريع', 'جرافيك'],
          visual: clip('snappy-graphic', 'Flat shapes snapping into place with sharp easing, one beat per element, bold colour blocks.', 'أشكال مسطّحة بتستقر بسرعة، وكل عنصر على ضربة، وبلوكات ألوان جريئة.', 'flat graphic motion: bold colour shapes snapping into position with sharp easing, one element per beat, logo assembling, 2 seconds') },
        { value: 'smooth-elegant', label: c('Smooth and elegant', 'ناعم وأنيق'), keywords: ['smooth', 'elegant', 'slow', 'ناعم', 'أنيق'],
          visual: clip('smooth-elegant', 'Slow fades and gentle scaling, long easing, lots of empty space, premium calm.', 'ظهور ناعم وتكبير بسيط، وحركة طويلة هادية، ومساحات فاضية، وإحساس راقي.', 'elegant motion: slow fade and gentle scale of a thin wordmark on off-white, long easing, generous empty space') },
        { value: 'kinetic-type', label: c('Kinetic text', 'كلام متحرك'), keywords: ['kinetic', 'text', 'typography', 'كلام', 'كتابة'],
          visual: clip('kinetic-type', 'Words arrive one at a time on the beat, scale and weight changing to stress the key word.', 'الكلمات بتجي واحدة واحدة على الإيقاع، والحجم والوزن بيتغيروا لتأكيد الكلمة المهمة.', 'kinetic typography: words arriving one per beat, scale and weight shifts emphasising the key word, high contrast') },
        { value: 'liquid', label: c('Liquid and organic', 'سائل وعضوي'), keywords: ['liquid', 'organic', 'morph', 'سائل', 'عضوي'],
          visual: clip('liquid', 'Shapes melting and morphing into each other, soft blobs, gradient colour.', 'أشكال بتسيح وتتحوّل لبعضها، كتل ناعمة، وتدرّج لوني.', 'liquid motion: soft blobs morphing into one another, gradient colour, organic easing, seamless loop') },
        { value: 'd3-depth', label: c('3D depth', 'عمق ثري دي'), keywords: ['3d', 'depth', 'ثري دي', 'عمق'],
          visual: clip('d3-depth', 'Elements rotating in depth with light and shadow, camera easing slightly.', 'عناصر بتلف في العمق بنور وضل، والكاميرا بتتحرك شوية.', '3D motion: a rounded logo mark rotating in depth with soft studio light and shadow, slight camera ease') },
      ],
      defaults: [{ value: 'snappy-graphic', reason: c('Snappy graphic motion reads fastest on a phone.', 'الحركة الجرافيكية السريعة بتتقري أسرع على الموبايل.') }],
    },
    {
      id: 'duration', kind: 'single', layer: 'delivery', importance: 'important',
      label: c('Length', 'المدة'),
      question: c('How long?', 'المدة أد إيه؟'),
      why: c('Motion lives or dies on timing, so the length is set before the first frame.', 'الموشن كله توقيت، فالمدة بتتحدد قبل أول كادر.'),
      example: c('Three seconds.', 'تلات ثواني.'),
      options: [
        { value: '2', label: c('2 seconds (logo sting)', 'ثانيتين (ستينج لوجو)'), keywords: ['2', 'ثانيتين', 'sting'] },
        { value: '3', label: c('3 seconds', 'تلات ثواني'), keywords: ['3', 'تلات'] },
        { value: '6', label: c('6 seconds', 'ست ثواني'), keywords: ['6', 'ست'] },
        { value: '15', label: c('15 seconds', '١٥ ثانية'), keywords: ['15', 'خمستاشر'] },
      ],
      patterns: [{ regex: '(?<![\\d])(2|3|6|15)\\s*(?:s|sec|seconds?|ث|ثانية|ثواني)', group: 1 }],
      defaults: [{ value: '3', reason: c('Three seconds is enough for a logo to assemble and settle.', 'تلات ثواني تكفي اللوجو يتجمّع ويستقر.') }],
    },
    ratio({ reel: '9:16', intro: '16:9', ad: '4:5', web: '16:9' }, ['9:16', '16:9', '4:5', '1:1']),
    reference(c('your logo or a motion reference', 'لوجوك أو مرجع حركة'), { label: c('Logo or reference', 'لوجو أو مرجع') }),
    {
      id: 'sound', kind: 'single', layer: 'delivery', importance: 'nice',
      label: c('Sound', 'الصوت'),
      question: c('With sound or silent?', 'بصوت ولا ساكت؟'),
      why: c('Most feeds play muted, so the motion must work without sound.', 'أغلب الفيد بيشتغل ساكت، فالحركة لازم تنفع من غير صوت.'),
      example: c('A short whoosh and a click.', 'صوت انسياب وكليك.'),
      options: [
        { value: 'sfx', label: c('Short sound effects', 'مؤثرات قصيرة'), keywords: ['sfx', 'whoosh', 'مؤثرات'] },
        { value: 'music', label: c('Music bed', 'موسيقى خلفية'), keywords: ['music', 'موسيقى'] },
        { value: 'silent', label: c('Silent', 'ساكت'), keywords: ['silent', 'ساكت', 'بدون صوت'] },
      ],
      defaults: [{ value: 'sfx', reason: c('Two small effects give motion weight without needing a track.', 'مؤثرين صغيرين بيدّوا الحركة ثقل من غير موسيقى.') }],
    },
    language(),
    avoid({
      en: ['other brands', 'stretching the logo', 'too many elements at once', 'text that moves too fast to read', 'flashing'],
      ar: ['براندات تانية', 'تمطيط اللوجو', 'عناصر كتير في نفس الوقت', 'كلام بيتحرك بسرعة مش بتتقري', 'فلاش مزعج'],
    }),
    targetTool([
      { value: 'veo', label: c('Google Veo', 'Google Veo'), keywords: ['veo', 'فيو'] },
      { value: 'sora', label: c('Sora', 'Sora'), keywords: ['sora', 'سورا'] },
      { value: 'runway', label: c('Runway', 'Runway'), keywords: ['runway', 'رن وي'] },
      { value: 'kling', label: c('Kling', 'Kling'), keywords: ['kling', 'كلينج'] },
    ]),
  ],
  output: {
    id: 'video-prompt-pack',
    description: c('A motion prompt, a beat-by-beat plan, sound direction, ready versions per tool, and a checklist.', 'برومبت موشن، وخطة بالتوقيت، وتوجيه للصوت، ونسخ جاهزة لكل أداة، وقائمة فحص.'),
    fields: [
      { path: 'title', type: 'string', required: true, maxLength: 120, description: 'Short title in the user language.' },
      { path: 'prompt', type: 'string', required: true, maxLength: 2500, description: 'Universal motion prompt in English: subject, how it moves, easing, light, mood, in time order.' },
      { path: 'shots', type: 'string[]', required: true, description: 'Beat list in English, each "0.0–0.6 s: …", covering exactly the chosen duration.' },
      { path: 'negative', type: 'string', required: true, maxLength: 600, description: 'What to avoid.' },
      { path: 'params', type: 'object', required: true, description: 'Execution settings.' },
      { path: 'params.aspectRatio', type: 'string', required: true, description: 'Exactly the ratio slot.' },
      { path: 'params.duration', type: 'string', required: true, description: 'Exactly the duration slot, seconds as a number string.' },
      { path: 'audio', type: 'object', required: true, description: 'Sound direction.' },
      { path: 'audio.mode', type: 'string', required: true, description: 'music | sfx | silent — exactly the sound slot.' },
      { path: 'textOverlay', type: 'object', required: true, description: 'On-screen text policy.' },
      { path: 'textOverlay.mode', type: 'string', required: true, description: 'none | in-video | add-later' },
      { path: 'variants', type: 'record', required: true, description: 'Tool id → ready prompt.' },
      { path: 'checklist', type: 'string[]', required: true, description: '4–6 checks, user language.' },
      { path: 'summary', type: 'string', required: true, maxLength: 600, description: 'One or two sentences, user language.' },
    ],
  },
  gates: [
    { id: 'brand-verbatim', kind: 'verbatim', slot: 'brandName', fields: ['prompt', 'variants.*'], nearMiss: true, message: c('Brand name kept exactly as written', 'اسم البراند مكتوب بالحرف') },
    { id: 'text-verbatim', kind: 'verbatim', slot: 'exactText', fields: ['textOverlay.text'], nearMiss: true, message: c('On-screen words kept exactly', 'الكلام اللي على الشاشة بالحرف') },
    { id: 'size', kind: 'equals-slot', slot: 'ratio', field: 'params.aspectRatio', message: c('Frame shape matches where it will run', 'شكل الكادر مناسب للمكان') },
    { id: 'length', kind: 'equals-slot', slot: 'duration', field: 'params.duration', message: c('Length is what you chose', 'المدة زي ما اخترت') },
    { id: 'sound-mode', kind: 'equals-slot', slot: 'sound', field: 'audio.mode', message: c('Sound is what you chose', 'الصوت زي ما اخترت') },
    { id: 'no-leak', kind: 'no-leak', fields: ['prompt'], terms: ['Lookers', 'aspect ratio', '--ar', 'Veo', 'Sora', 'Kling', 'Runway'], slotTerms: ['ratio'], message: c('No tool settings mixed into the scene', 'مفيش إعدادات أدوات داخلة في وصف المشهد') },
    { id: 'no-invented-text', kind: 'no-invented-text', whenEmpty: ['brandName', 'exactText'], field: 'prompt', negativeField: 'negative', message: c('No made-up words on screen', 'مفيش كلام متألّف على الشاشة') },
    { id: 'english-prompt', kind: 'latin-ratio', field: 'prompt', min: 0.9, exceptSlots: ['brandName', 'exactText'], message: c('Prompt written in English (video tools work best)', 'البرومبت بالإنجليزي (أدوات الفيديو بتفهمه أحسن)') },
  ],
  tools: [
    { id: 'universal', label: 'Universal', notes: 'Time-ordered prose: subject, motion, easing, light, mood. No tool syntax.' },
    { id: 'veo', label: 'Google Veo', notes: 'Cinematic prose; can generate audio — one sentence for the sound at the end.' },
    { id: 'sora', label: 'OpenAI Sora', notes: 'Describe beats in order with timing; keep motion physically plausible.' },
    { id: 'runway', label: 'Runway', notes: 'Image-first: upload the logo and describe only the motion and camera, not the look.' },
    { id: 'kling', label: 'Kling', notes: 'Clear subject + motion + camera; image-to-video from the logo file works best.' },
  ],
  role: 'Senior motion designer who animates brand assets, and a prompt engineer for AI video tools.',
  strategy: {
    understanding: [
      'subject is the one thing that moves; usage sets the frame and the pace; duration is the budget every beat has to fit inside.',
      'If reference = yes, every variant starts by saying the uploaded logo or reference is the source and must not be redrawn.',
    ],
    intelligence: [
      'Write the motion as beats with timing that add up to exactly the chosen duration: what enters, how it eases, what settles, where it rests. Name the easing (sharp, long, overshoot) rather than saying "smooth".',
      'The last half-second must rest on the final frame — a logo that never settles cannot be used as an intro. Keep one element moving at a time.',
    ],
    control: [
      'Never redraw, stretch, recolour or rotate a logo out of proportion. Never add words that are not in exactText.',
      'Never ask for strobing or flashing: it is unusable in ads and unsafe for some viewers.',
      'Execution settings (ratio, duration, tool names) go in params, never inside the motion description.',
    ],
    delivery: [
      'prompt is English, in time order, under 2500 characters. shots is the beat list covering the full duration.',
      'params.aspectRatio and params.duration copy the slots exactly; audio.mode copies the sound slot.',
      'textOverlay.mode is in-video only when exactText is given; otherwise none, and the negative must exclude invented text.',
      'The motion must read with the sound off, and the checklist must include that check.',
      'checklist and summary in the user language (Egyptian Arabic for ar).',
    ],
  },
  examples: [{
    good: '0.0–0.4 s: three charcoal shapes slide in from the left with sharp easing, one per beat. 0.4–0.9 s: they lock into the mark, slight overshoot. 0.9–1.6 s: the wordmark fades up beneath. 1.6–3.0 s: everything rests, a single light sweep crosses the mark. 9:16, 3 s, sfx: one short whoosh and a click.',
    bad: 'A cool 3-second animated logo with everything moving at once, flashing colours, the logo stretching to fill the frame, and the text "BEST QUALITY" spinning fast, 9:16 in Veo.',
    why: 'The bad one moves everything at once, flashes, distorts the logo, invents on-screen text, and leaks the size and tool into the scene.',
  }],
};

/* ── data analysis ──────────────────────────────────────────────────────────────── */

const dataset = (): Slot => facts('dataset', c('The data you have', 'الداتا اللي عندك'),
  c('What data do you have? Paste the numbers or describe the columns.', 'عندك داتا إيه؟ الصق الأرقام أو قولّي الأعمدة.'),
  c('Monthly sales by product and branch for 2026, about 1,400 rows.', 'مبيعات شهرية بالمنتج والفرع لسنة ٢٠٢٦، حوالي ١٤٠٠ سطر.'));

export const dataAnalysis = makeTextMission({
  id: 'data-analysis', title: c('Analyse my data', 'تحليل الداتا'), topics: ['data-analysis', 'sales-analysis', 'survey-analysis', 'financial-report'],
  intake: { question: c('Tell me what data you have and the decision behind the question.', 'قولّي عندك داتا إيه، والقرار اللي وراه السؤال.'), why: c('I only work with the numbers you give, and I say plainly what they cannot answer.', 'بشتغل بالأرقام اللي بتديها بس، وبقول بصراحة إيه اللي ما تقدرش تجاوبه.'),
    starters: [c('Why did sales drop last month?', 'ليه المبيعات نزلت الشهر اللي فات؟'), c('Which product makes the most profit?', 'أنهي منتج بيكسب أكتر؟'), c('Analyse my survey results', 'حلّل نتايج الاستبيان'), c('What do my numbers say about next quarter?', 'أرقامي بتقول إيه عن الربع الجاي؟')] },
  slots: [
    { id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 900,
      label: c('The question', 'السؤال'), question: c('What exactly do you want the data to tell you?', 'عايز الداتا تقولك إيه بالظبط؟'),
      why: c('Analysis without one question turns into a pile of charts.', 'التحليل من غير سؤال واحد بيبقى كومة رسومات.'),
      example: c('Why sales dropped in October, and whether it is one branch or all of them.', 'ليه المبيعات نزلت في أكتوبر، وهل فرع واحد ولا كلهم.'),
      vocabulary: { en: ['why did it drop', 'which is best', 'is it growing', 'who buys most', 'what is the trend', 'is the difference real'], ar: ['ليه نزلت', 'أنهي أحسن', 'بتكبر', 'مين بيشتري أكتر', 'إيه الاتجاه', 'الفرق حقيقي'] } },
    dataset(),
    { id: 'decision', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 400,
      label: c('The decision behind it', 'القرار اللي وراه'), question: c('What will you do differently depending on the answer?', 'هتعمل إيه مختلف على حسب الإجابة؟'),
      why: c('The decision decides how deep to go and what to leave out.', 'القرار بيحدد العمق وإيه اللي يتسيب.'),
      example: c('Decide whether to change the October promotion.', 'أقرر أغيّر عرض أكتوبر ولا لأ.'),
      vocabulary: { en: ['change the offer', 'stop a product', 'move budget', 'set next quarter targets', 'hire'], ar: ['أغيّر العرض', 'أوقف منتج', 'أنقل ميزانية', 'أحدد مستهدفات', 'أوظف'] } },
    { id: 'depth', kind: 'single', layer: 'delivery', importance: 'nice',
      label: c('How deep', 'العمق'), question: c('How deep should it go?', 'يروح لعمق أد إيه؟'),
      why: c('Depth decides whether you get an answer or a report.', 'العمق بيحدد هتاخد إجابة ولا تقرير.'),
      example: c('A clear answer with the three numbers behind it.', 'إجابة واضحة بالتلات أرقام اللي وراها.'),
      options: [
        { value: 'answer', label: c('A clear answer', 'إجابة واضحة'), keywords: ['answer', 'quick', 'إجابة', 'سريع'] },
        { value: 'report', label: c('A full analysis', 'تحليل كامل'), keywords: ['report', 'full', 'تقرير', 'كامل'] },
        { value: 'dashboard', label: c('Numbers to track monthly', 'أرقام أتابعها كل شهر'), keywords: ['dashboard', 'track', 'متابعة', 'شهري'] },
      ],
      defaults: [{ value: 'answer', reason: c('An answer with its evidence is what a decision actually needs.', 'إجابة بأدلتها هي اللي القرار محتاجها فعلاً.') }] },
  ],
  nameLabel: c('Business / team name', 'اسم البيزنس أو الفريق'), nameWhat: 'the business or team name',
  avoidVocab: { en: ['invented numbers', 'correlation as cause', 'averages that hide the problem', 'cherry-picked periods', 'charts with no takeaway'], ar: ['أرقام متألفة', 'الارتباط كأنه سبب', 'متوسطات بتخفي المشكلة', 'فترات منتقاة', 'رسومات من غير خلاصة'] },
  outlineKey: 'reportOutline', outlineDesc: 'One line per step of the analysis, in order.', outlineWhat: 'one line per step of the analysis',
  outputDescription: c('A prompt that analyses your data properly, the steps, the numbers it still needs, and a checklist.', 'برومبت يحلّل داتاك صح، والخطوات، والأرقام اللي لسه محتاجها، وقائمة فحص.'),
  role: 'Senior data analyst who answers business questions from messy data, and a prompt engineer for chat AIs.',
  understanding: [
    'subject is the one question; dataset is the only source of numbers; decision sets the depth and what can be ignored.',
    'sections.goal states the question, the data available, and the decision it serves.',
  ],
  intelligence: [
    'Require the work in order: restate the question as something measurable, check the data first (missing values, duplicates, date ranges, outliers) and report what is wrong with it, then answer with the smallest set of numbers that settles it, then say what else changed at the same time, and only then interpret.',
    'sections.approach tells the AI to compare like with like (same period length, same definitions), to split any average that hides a split (by branch, product, segment), and to say plainly when the data cannot answer the question.',
  ],
  controlExtra: [
    'Never invent a number, a total or a trend, and never fill a gap in the data with an estimate presented as a fact — mark it [missing].',
    'Never present a correlation as a cause. Where two things moved together, say so and name what else could explain it.',
  ],
  deliveryExtra: ['sections.output must require: the answer in the first two lines, the numbers behind it with their source column, the data-quality notes, and what to check next.'],
  examples: [{
    good: 'Answer first: October fell 18% and all of it is one branch [source: sales by branch]. Data note: 40 rows have no branch, excluded and flagged. What else changed: that branch closed for 5 days. Not answerable from this data: whether the promotion helped.',
    bad: 'Sales dropped 18% because of the market slowdown and weak marketing, and next month will likely recover by 20% based on the trend.',
    why: 'The bad one invents a cause, invents a forecast, and never checks whether the drop is one branch or all of them.',
  }],
});

/* ── workflow automation ────────────────────────────────────────────────────────── */

export const workflowAutomation = makeTextMission({
  id: 'workflow-automation', title: c('Automate a process', 'أتمتة إجراء'), topics: ['workflow-automation', 'no-code-integration', 'operational-sop', 'task-prioritization'],
  intake: { question: c('Tell me the repetitive job you want to stop doing by hand.', 'قولّي الشغلانة المتكررة اللي عايز تبطّل تعملها بإيدك.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Every order I re-type into a sheet', 'كل أوردر بكتبه تاني في شيت'), c('Automate sending invoices', 'أتمتة إرسال الفواتير'), c('Collect form replies in one place', 'أجمع ردود الفورم في مكان واحد'), c('Remind the team about deadlines', 'أفكّر الفريق بالمواعيد')] },
  slots: [
    { id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 900,
      label: c('The process now', 'الإجراء دلوقتي'), question: c('Walk me through what you do by hand, step by step.', 'قولّي بتعمل إيه بإيدك، خطوة خطوة.'),
      why: c('You cannot automate a process nobody has written down.', 'مش ممكن تأتمت إجراء محدش كتبه.'),
      example: c('A customer sends an order on WhatsApp, I copy it into a sheet, then message the warehouse.', 'العميل يبعت أوردر على واتساب، أنقله في شيت، وبعدين أكلم المخزن.'),
      vocabulary: { en: ['copy by hand', 'send a message', 'fill a sheet', 'make an invoice', 'check and approve', 'every day', 'for every order'], ar: ['أنقل بإيدي', 'أبعت رسالة', 'أملا شيت', 'أعمل فاتورة', 'أراجع وأعتمد', 'كل يوم', 'لكل أوردر'] } },
    { id: 'tools', kind: 'multi', layer: 'understanding', importance: 'important',
      label: c('What you already use', 'اللي بتستخدمه بالفعل'), question: c('Which apps are already in the process?', 'أنهي تطبيقات موجودة في الإجراء؟'),
      why: c('Automation connects what you have; it should not ask you to move house.', 'الأتمتة بتوصّل اللي عندك، مش بتطلب منك تغيّر كل حاجة.'),
      example: c('WhatsApp and Google Sheets.', 'واتساب وجوجل شيتس.'),
      options: [
        { value: 'sheets', label: c('Google Sheets / Excel', 'جوجل شيتس / إكسل'), keywords: ['sheets', 'excel', 'شيت', 'اكسل'] },
        { value: 'whatsapp', label: c('WhatsApp', 'واتساب'), keywords: ['whatsapp', 'واتساب'] },
        { value: 'email', label: c('Email', 'إيميل'), keywords: ['email', 'gmail', 'ايميل'] },
        { value: 'forms', label: c('Forms', 'فورم'), keywords: ['forms', 'form', 'فورم'] },
        { value: 'store', label: c('Online store', 'متجر أونلاين'), keywords: ['shopify', 'store', 'متجر'] },
        { value: 'crm', label: c('CRM / task tool', 'CRM أو أداة مهام'), keywords: ['crm', 'trello', 'notion', 'asana', 'مهام'] },
        { value: 'accounting', label: c('Accounting app', 'برنامج حسابات'), keywords: ['accounting', 'invoice', 'حسابات', 'فواتير'] },
      ],
      defaults: [{ value: ['sheets', 'whatsapp'], reason: c('A sheet plus WhatsApp is where most of this work already lives.', 'الشيت مع واتساب هما مكان أغلب الشغل ده بالفعل.') }] },
    { id: 'volume', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 200,
      label: c('How often', 'كل أد إيه'), question: c('How many times a day or week does this happen?', 'بيحصل كام مرة في اليوم أو الأسبوع؟'),
      why: c('Volume decides whether automation is worth building at all.', 'العدد بيحدد الأتمتة تستاهل تتبني من أصله ولا لأ.'),
      example: c('About 30 orders a day.', 'حوالي ٣٠ أوردر في اليوم.'),
      noneLabel: c('Placeholder to fill', 'مكان فاضي تكمّله'),
      defaults: [{ value: 'none', reason: c('We leave [how often] and the plan says when it stops being worth it.', 'هنسيب [عدد المرات]، والخطة هتقول إمتى ما بتستاهلش.') }] },
    { id: 'risk', kind: 'single', layer: 'control', importance: 'important',
      label: c('What must stay in your hands', 'إيه اللي يفضل في إيدك'), question: c('Which step must a human still approve?', 'أنهي خطوة لازم إنسان يعتمدها؟'),
      why: c('Automating an approval is how money goes out of the door by accident.', 'أتمتة الاعتماد هي اللي بتخلي الفلوس تطلع بالغلط.'),
      example: c('Anything that sends money or a price to a customer.', 'أي حاجة بتبعت فلوس أو سعر لعميل.'),
      options: [
        { value: 'money', label: c('Anything about money or prices', 'أي حاجة فيها فلوس أو أسعار'), keywords: ['money', 'price', 'فلوس', 'سعر'] },
        { value: 'customer-msg', label: c('Messages going to customers', 'الرسايل اللي بتروح للعملاء'), keywords: ['message', 'customer', 'رسالة', 'عميل'] },
        { value: 'delete', label: c('Deleting or changing records', 'حذف أو تغيير سجلات'), keywords: ['delete', 'change', 'حذف', 'تغيير'] },
        { value: 'none-needed', label: c('Nothing — it is all internal', 'مفيش، كله داخلي'), keywords: ['nothing', 'internal', 'مفيش', 'داخلي'] },
      ],
      defaults: [{ value: 'money', reason: c('Money and prices are the step worth keeping a human on.', 'الفلوس والأسعار هي الخطوة اللي تستاهل تفضل على إيد إنسان.') }] },
  ],
  nameLabel: c('Business name', 'اسم البيزنس'), nameWhat: 'the business name',
  avoidVocab: { en: ['replacing tools I already use', 'automating approvals', 'silent failures', 'no way to see what ran', 'complex setups I cannot maintain'], ar: ['استبدال أدوات بستخدمها', 'أتمتة الاعتمادات', 'أخطاء صامتة', 'مفيش طريقة أشوف اللي اتنفذ', 'إعدادات معقدة مش أقدر أصونها'] },
  outlineKey: 'planOutline', outlineDesc: 'One line per step of the automated flow: trigger → action → where it lands.', outlineWhat: 'one line per step of the flow',
  outputDescription: c('A prompt that designs the automation, the flow step by step, what you still need, and a checklist.', 'برومبت يصمّم الأتمتة، والمسار خطوة خطوة، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior operations engineer who automates small-business processes with no-code tools, and a prompt engineer for chat AIs.',
  understanding: [
    'subject is the manual process as it really runs; tools limits what may be connected; risk is the step that stays human.',
    'sections.goal states the process today, how often it runs, and what should be automatic by the end.',
  ],
  intelligence: [
    'Design the flow as trigger → steps → result, naming for each step the app, the exact data that moves, and what happens when it fails. Then say which steps to automate first (highest repetition, lowest risk) and which to leave manual on purpose.',
    'sections.approach tells the AI to connect the tools the user already has rather than propose new ones, to keep a log of every run so a silent failure is visible, and to make every step safe to run twice without doubling the result.',
  ],
  controlExtra: [
    'Never automate the step named in risk — it must stay a human approval with a clear notification.',
    'Never invent app features, pricing or API limits. Where a connection may not exist, say [verify this connector supports it].',
  ],
  deliveryExtra: ['sections.output must require: the flow as numbered steps with the app per step, the failure behaviour per step, what gets logged, and the manual fallback if the automation is down.'],
  examples: [{
    good: 'Trigger: a new WhatsApp order message. Step 1: add a row to the orders sheet (date, customer, items) — if the message cannot be parsed, flag it for review instead of guessing. Step 2: notify the warehouse channel. Human keeps: confirming the price back to the customer. Every run logged in a Runs tab.',
    bad: 'Move everything to a new CRM, auto-reply with prices, auto-send invoices, and auto-delete old orders monthly to keep it clean.',
    why: 'The bad one replaces working tools, automates prices and deletion, and loses records.',
  }],
});

/* ── API integration ────────────────────────────────────────────────────────────── */

export const apiIntegration = makeBuildMission({
  id: 'api-integration', title: c('Connect an API', 'ربط API'), topics: ['api-integration'],
  intake: { question: c('Tell me what you want to connect, and in which direction the data moves.', 'قولّي عايز تربط إيه، والداتا ماشية في أنهي اتجاه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Connect my store to a shipping company', 'أربط متجري بشركة شحن'), c('Send my form replies to my CRM', 'أبعت ردود الفورم للـ CRM'), c('Pull payments into my dashboard', 'أجيب المدفوعات في الداشبورد'), c('Connect WhatsApp to my system', 'أربط واتساب بالنظام بتاعي')] },
  slots: [
    { id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 900,
      label: c('What connects to what', 'بتربط إيه بإيه'), question: c('Which two systems, and what should move between them?', 'أنهي نظامين، وإيه اللي يتحرك بينهم؟'),
      why: c('An integration is defined by the data that crosses, not by the apps.', 'الربط بيتحدد بالداتا اللي بتعدي، مش بأسماء التطبيقات.'),
      example: c('My store sends each new order to the shipping company and gets back a tracking number.', 'متجري يبعت كل أوردر جديد لشركة الشحن ويرجّع رقم تتبع.'),
      vocabulary: { en: ['sends', 'receives', 'both ways', 'new orders', 'payments', 'customers', 'stock levels', 'tracking number'], ar: ['يبعت', 'يستلم', 'في الاتجاهين', 'أوردرات جديدة', 'مدفوعات', 'عملاء', 'المخزون', 'رقم تتبع'] } },
    { id: 'trigger', kind: 'single', layer: 'intelligence', importance: 'important',
      label: c('When it runs', 'بيشتغل إمتى'), question: c('When should the data move?', 'الداتا تتحرك إمتى؟'),
      why: c('This is the difference between a webhook and a scheduled job.', 'ده الفرق بين webhook وشغل بجدول.'),
      example: c('The moment an order is placed.', 'في نفس لحظة الأوردر.'),
      options: [
        { value: 'event', label: c('The moment it happens', 'في نفس اللحظة'), keywords: ['webhook', 'instant', 'لحظة', 'فوري'] },
        { value: 'schedule', label: c('On a schedule', 'بجدول'), keywords: ['schedule', 'cron', 'hourly', 'جدول', 'كل ساعة'] },
        { value: 'manual', label: c('When someone presses a button', 'لما حد يدوس زرار'), keywords: ['manual', 'button', 'زرار', 'يدوي'] },
      ],
      defaults: [{ value: 'event', reason: c('Reacting to the event keeps both sides in step.', 'الاستجابة للحظة بتخلي الطرفين متزامنين.') }] },
    facts('apiFacts', c('What you know about the API', 'اللي تعرفه عن الـ API'),
      c('What do you have? (docs link, endpoints, auth type, limits, a sample response)', 'عندك إيه؟ (لينك الدوكس، الـ endpoints، نوع الصلاحية، الحدود، نموذج رد)'),
      c('REST with a bearer token, 60 requests a minute, docs on their site.', 'REST بتوكن، ٦٠ طلب في الدقيقة، والدوكس على موقعهم.')),
    { id: 'volume', kind: 'text', layer: 'intelligence', importance: 'nice', maxLength: 200,
      label: c('How much traffic', 'حجم الحركة'), question: c('Roughly how many calls a day?', 'تقريباً كام طلب في اليوم؟'),
      why: c('Volume decides retries, batching and whether you will hit a limit.', 'الحجم بيحدد إعادة المحاولة والتجميع وهل هتوصل للحد.'),
      example: c('A few hundred.', 'بضع مئات.'),
      noneLabel: c('Placeholder to fill', 'مكان فاضي تكمّله'),
      defaults: [{ value: 'none', reason: c('We leave [calls per day] and the design handles limits anyway.', 'هنسيب [عدد الطلبات]، والتصميم هيتعامل مع الحدود برضو.') }] },
  ],
  nameLabel: c('System / business name', 'اسم النظام أو البيزنس'), nameWhat: 'the system or business name',
  avoidVocab: { en: ['invented endpoints', 'keys in the code', 'retrying a payment blindly', 'ignoring rate limits', 'no logging', 'trusting the other side\'s data'], ar: ['endpoints متألفة', 'مفاتيح في الكود', 'إعادة محاولة الدفع على عماها', 'تجاهل حدود الطلبات', 'مفيش تسجيل', 'الثقة في داتا الطرف التاني'] },
  outlineKey: 'specOutline', outlineDesc: 'One line per step: trigger, call, mapping, failure handling, logging.', outlineWhat: 'one line per step of the integration',
  outputDescription: c('A build prompt for the integration, the steps, what you still need, and a checklist.', 'برومبت بناء للربط، والخطوات، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior backend engineer who builds integrations that survive the other side being down, and a prompt engineer for chat AIs.',
  understanding: [
    'subject defines the data that crosses and the direction; apiFacts is the only source of endpoints, auth and limits; trigger sets the mechanism.',
    'sections.goal states the two systems, what moves, when, and what the other side gives back.',
  ],
  intelligence: [
    'Specify: the trigger, the exact field mapping both ways, the auth flow, how failures are handled (retry with backoff, dead-letter, alert), idempotency so the same event cannot be processed twice, rate-limit handling, and what gets logged for every call.',
    'sections.approach tells the AI to treat the other side as unreliable — timeouts, partial data, duplicate events, schema changes — and to validate every incoming field before using it.',
  ],
  controlExtra: [
    'Never invent an endpoint, a field name, an auth scheme or a rate limit. Anything not in apiFacts is written as [confirm in their docs].',
    'Never put a key, token or secret in the code: read them from environment variables, and never log them.',
    'Never retry a payment or an order-creating call without an idempotency key.',
  ],
  deliveryExtra: ['sections.output must require: the field mapping as a table, the error and retry policy per failure type, the idempotency strategy, what is logged, and how to test it without touching live data.'],
  examples: [{
    good: 'Trigger: order.created webhook, verified by signature. Map: order.id → reference, items[].sku → parcel.items[].code. Retry: 3 attempts with backoff on 5xx only; 4xx goes to review. Idempotency key = order.id, so a repeated webhook creates one shipment. Test against their sandbox [confirm sandbox URL in their docs].',
    bad: 'Call POST /api/v2/shipments with the token in the config file, retry every failure every second until it works, and trust whatever JSON they return.',
    why: 'The bad one invents the endpoint, hard-codes a token, retries payments blindly, and trusts unvalidated input.',
  }],
});

/* ── dashboard design ───────────────────────────────────────────────────────────── */

export const dashboardDesign = makeBuildMission({
  id: 'dashboard-design', title: c('Dashboard', 'داشبورد'), topics: ['dashboard-design', 'kpi-definition'],
  intake: { question: c('Tell me who will look at it and what decision it supports.', 'قولّي مين هيبصّ عليها، وبتخدم قرار إيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A dashboard for my sales', 'داشبورد لمبيعاتي'), c('Define the KPIs for my team', 'أحدد مؤشرات فريقي'), c('One screen that shows how we are doing', 'شاشة واحدة توريني إحنا عاملين إيه'), c('A dashboard for my store orders', 'داشبورد لأوردرات المتجر')] },
  slots: [
    { id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 900,
      label: c('What it must answer', 'لازم تجاوب إيه'), question: c('What questions should it answer at a glance?', 'تجاوب أنهي أسئلة من نظرة؟'),
      why: c('A dashboard is a set of answers, not a set of charts.', 'الداشبورد مجموعة إجابات، مش مجموعة رسومات.'),
      example: c('Are we on target this month, which product is slipping, and what is late.', 'إحنا على المستهدف الشهر ده، وأنهي منتج بينزل، وإيه المتأخر.'),
      vocabulary: { en: ['are we on target', 'what changed', 'what is late', 'who is best', 'where is the money', 'what needs attention'], ar: ['إحنا على المستهدف', 'إيه اللي اتغيّر', 'إيه المتأخر', 'مين الأحسن', 'الفلوس فين', 'إيه المحتاج انتباه'] } },
    { id: 'users', kind: 'single', layer: 'understanding', importance: 'important',
      label: c('Who looks at it', 'مين بيبصّ عليها'), question: c('Who opens it, and how often?', 'مين بيفتحها، وكل أد إيه؟'),
      why: c('An owner glancing daily and an analyst digging weekly need different screens.', 'صاحب العمل اللي بيبص كل يوم والمحلل اللي بينقّب كل أسبوع محتاجين شاشتين مختلفتين.'),
      example: c('Me, every morning on my phone.', 'أنا، كل صباح على الموبايل.'),
      options: [
        { value: 'owner', label: c('Owner / manager, a quick glance', 'صاحب العمل، نظرة سريعة'), keywords: ['owner', 'manager', 'صاحب', 'مدير'] },
        { value: 'team', label: c('The team, daily work', 'الفريق، شغل يومي'), keywords: ['team', 'daily', 'الفريق', 'يومي'] },
        { value: 'analyst', label: c('Someone who digs into it', 'حد بينقّب فيها'), keywords: ['analyst', 'deep', 'محلل', 'تفاصيل'] },
        { value: 'client', label: c('A client / external', 'عميل أو جهة خارجية'), keywords: ['client', 'external', 'عميل', 'خارجي'] },
      ],
      defaults: [{ value: 'owner', reason: c('Most dashboards are built for a quick daily glance.', 'أغلب الداشبوردات بتتبني لنظرة سريعة كل يوم.') }] },
    facts('sources', c('Where the numbers come from', 'الأرقام جاية منين'),
      c('Where does the data live, and which fields does it have?', 'الداتا موجودة فين، وفيها أنهي حقول؟'),
      c('A Google Sheet of orders: date, branch, product, quantity, price, status.', 'شيت أوردرات: التاريخ، الفرع، المنتج، الكمية، السعر، الحالة.')),
    { id: 'cadence', kind: 'single', layer: 'delivery', importance: 'nice',
      label: c('Time window', 'النطاق الزمني'), question: c('What period should it show by default?', 'تعرض أنهي فترة افتراضياً؟'),
      why: c('The default window is what people actually read.', 'الفترة الافتراضية هي اللي الناس بتقراها فعلاً.'),
      example: c('This month against last month.', 'الشهر ده مقابل اللي فات.'),
      options: [
        { value: 'today', label: c('Today', 'اليوم'), keywords: ['today', 'اليوم'] },
        { value: 'week', label: c('This week', 'الأسبوع ده'), keywords: ['week', 'أسبوع'] },
        { value: 'month', label: c('This month vs last', 'الشهر ده مقابل اللي فات'), keywords: ['month', 'شهر'] },
        { value: 'quarter', label: c('This quarter', 'الربع ده'), keywords: ['quarter', 'ربع'] },
      ],
      defaults: [{ value: 'month', reason: c('Month against last month is the comparison most decisions use.', 'الشهر مقابل اللي فات هي المقارنة اللي أغلب القرارات بتستخدمها.') }] },
  ],
  nameLabel: c('Business / team name', 'اسم البيزنس أو الفريق'), nameWhat: 'the business or team name',
  avoidVocab: { en: ['vanity metrics', 'pie charts with many slices', 'a number with no comparison', 'twenty charts on one screen', 'metrics nobody can act on'], ar: ['مؤشرات للزينة', 'رسم دائري بشرايح كتير', 'رقم من غير مقارنة', 'عشرين رسمة في شاشة', 'مؤشرات محدش يقدر يتحرك بيها'] },
  outlineKey: 'specOutline', outlineDesc: 'One line per tile: the question it answers — the metric — the chart.', outlineWhat: 'one line per tile of the dashboard',
  outputDescription: c('A build prompt for the dashboard, the tiles in order, the data you still need, and a checklist.', 'برومبت بناء للداشبورد، والبلوكات بالترتيب، والداتا الناقصة، وقائمة فحص.'),
  role: 'Senior analytics engineer who builds dashboards people actually use, and a prompt engineer for AI builders.',
  understanding: [
    'subject is the list of questions the screen must answer; sources is the only data available and limits which metrics are even possible; users decides density and device.',
    'sections.goal states who opens it, what they must see in five seconds, and the decision it supports.',
  ],
  intelligence: [
    'Turn each question into one tile: the metric with its exact definition (numerator, denominator, period), the comparison that gives it meaning (vs target, vs last period), the chart type that suits it, and the action to take when it goes the wrong way. Put the three tiles that drive decisions at the top; everything else goes below or on a second tab.',
    'sections.approach tells the AI to define every metric precisely enough that two people compute the same number, to show a comparison beside every figure, and to drop any metric nobody would act on.',
  ],
  controlExtra: [
    'Never invent a metric the sources cannot produce — say [needs a new field: …] instead.',
    'Never use a number without a comparison or a period. Never use a pie chart for more than three slices, and axes start at zero.',
  ],
  deliveryExtra: ['sections.output must require: each tile with its metric definition and formula, the chart type, the layout order, the refresh rate, and the empty state when there is no data yet.'],
  examples: [{
    good: 'Tile 1 — "Are we on target?": revenue this month vs target, big number plus a thin progress bar, formula SUM(price×quantity) where status=done and date in this month [source: orders sheet]. Action when below: check tile 3. Refresh: hourly.',
    bad: 'A beautiful dashboard with 20 charts, a 3D pie of all products, total followers, total page views, and a revenue number with no target or period.',
    why: 'The bad one is unreadable, uses vanity metrics, and shows a figure nobody can judge without a comparison.',
  }],
});

export const extraBlueprints = [motionGraphics, dataAnalysis, workflowAutomation, apiIntegration, dashboardDesign];
