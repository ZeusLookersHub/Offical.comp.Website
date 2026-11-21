import type { Copy, Slot } from '../types.ts';
import { c, facts } from '../modules.ts';
import { makeTextMission, toneSlot } from './_text.ts';

/** The role being targeted — every career deliverable is written against one role. */
const targetRole = (question: Copy, example: Copy): Slot => ({
  id: 'role', kind: 'text', layer: 'understanding', importance: 'critical', maxLength: 300,
  label: c('The role', 'الوظيفة'), question,
  why: c('One role at a time. A CV for everything convinces nobody.', 'وظيفة واحدة في المرة. الـ CV اللي لكل حاجة ما بيقنعش حد.'),
  example,
  vocabulary: { en: ['marketing manager', 'accountant', 'graphic designer', 'sales rep', 'software engineer', 'remote', 'in Dubai'], ar: ['مدير تسويق', 'محاسب', 'مصمم جرافيك', 'مندوب بيع', 'مهندس برمجيات', 'عن بعد', 'في دبي'] },
});

const experienceSlot = (): Slot => facts('experience', c('Your experience', 'خبرتك'),
  c('What have you actually done? (jobs, years, tools, results with numbers)', 'عملت إيه فعلاً؟ (وظايف، سنين، أدوات، نتائج بأرقام)'),
  c('3 years at a marketing agency; ran ad budgets of 50K a month; raised one client from 40 to 300 orders.', '٣ سنين في وكالة تسويق؛ أدير ميزانيات إعلانات ٥٠ ألف في الشهر؛ رفعت عميل من ٤٠ لـ٣٠٠ أوردر.'));

const seniority = (): Slot => ({
  id: 'level', kind: 'single', layer: 'understanding', importance: 'important',
  label: c('Your level', 'مستواك'), question: c('What level are you applying at?', 'بتقدّم على أنهي مستوى؟'),
  why: c('Level decides what goes on top and what gets cut.', 'المستوى بيحدد إيه اللي يبقى فوق وإيه اللي يتشال.'),
  example: c('Two years of experience.', 'سنتين خبرة.'),
  options: [
    { value: 'student', label: c('Student / fresh graduate', 'طالب / حديث التخرج'), keywords: ['student', 'fresh', 'graduate', 'طالب', 'حديث التخرج'] },
    { value: 'junior', label: c('1–3 years', '١–٣ سنين'), keywords: ['junior', 'سنتين', 'تلات سنين'] },
    { value: 'mid', label: c('4–8 years', '٤–٨ سنين'), keywords: ['mid', 'senior', 'خمس سنين', 'خبرة'] },
    { value: 'lead', label: c('Manager / lead', 'مدير / قائد فريق'), keywords: ['manager', 'lead', 'head', 'مدير', 'قائد'] },
  ],
  defaults: [{ value: 'mid', reason: c('Mid-level structure works for most CVs.', 'هيكل المستوى المتوسط بيناسب أغلب الـ CVs.') }],
});

export const cvResume = makeTextMission({
  id: 'cv-resume', title: c('CV', 'السيرة الذاتية'), topics: ['cv-resume', 'career-cv'],
  questionBudget: 3,
  intake: { question: c('Tell me the role you want and what you have done.', 'قولّي الوظيفة اللي عايزها، وإنت عملت إيه.'), why: c('I never invent experience. Anything you do not give becomes a placeholder.', 'عمري ما هألّف خبرة. أي حاجة ما تديهاش تبقى مكان فاضي.'),
    starters: [c('A CV for a marketing manager role', 'CV لوظيفة مدير تسويق'), c('My first CV — I just graduated', 'أول CV ليا، لسه متخرج'), c('A CV for a job abroad', 'CV لوظيفة في الخارج'), c('A CV for a career change', 'CV لتغيير مجال')] },
  slots: [
    targetRole(c('What role are you applying for? Paste the job title or the ad.', 'بتقدّم على إيه؟ الصق المسمى الوظيفي أو الإعلان.'), c('Marketing manager at an e-commerce company in Dubai.', 'مدير تسويق في شركة تجارة إلكترونية في دبي.')),
    experienceSlot(), seniority(),
    { id: 'education', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 400,
      label: c('Education & certificates', 'التعليم والشهادات'), question: c('What did you study, and what certificates do you have?', 'درست إيه، وعندك شهادات إيه؟'),
      why: c('Fresh graduates lead with education; experienced people put it at the end.', 'حديث التخرج بيبدأ بالتعليم، وصاحب الخبرة بيحطه في الآخر.'),
      example: c('Commerce, Cairo University, 2019; Google Ads certificate.', 'تجارة، جامعة القاهرة، ٢٠١٩؛ وشهادة Google Ads.'),
      noneLabel: c('Placeholder to fill', 'مكان فاضي تكمّله'),
      defaults: [{ value: 'none', reason: c('We leave [education] for you to fill.', 'هنسيب [التعليم] تكمّله انت.') }] },
    { id: 'cvFormat', kind: 'single', layer: 'delivery', importance: 'nice',
      label: c('Format', 'الشكل'), question: c('What format do you need?', 'محتاج أنهي شكل؟'),
      why: c('Company systems read a plain one-column CV best.', 'أنظمة الشركات بتقرا الـ CV البسيط بعمود واحد أفضل.'),
      example: c('One page, plain.', 'صفحة واحدة، بسيط.'),
      options: [
        { value: 'ats-1page', label: c('One page, system-friendly', 'صفحة واحدة، مناسب للأنظمة'), keywords: ['ats', 'one page', 'صفحة واحدة'] },
        { value: 'ats-2page', label: c('Two pages, system-friendly', 'صفحتين، مناسب للأنظمة'), keywords: ['two pages', 'صفحتين'] },
        { value: 'designed', label: c('Designed / creative', 'مصمم / كريتيف'), keywords: ['designed', 'creative', 'مصمم'] },
      ],
      defaults: [{ value: 'ats-1page', reason: c('A plain one-page CV passes company filters and still reads well.', 'الـ CV البسيط في صفحة بيعدّي فلاتر الشركات وبيتقري كمان.') }] },
  ],
  nameLabel: c('Your name', 'اسمك'), nameWhat: 'your name',
  avoidVocab: { en: ['invented experience', 'empty phrases like hard worker', 'photos and personal details', 'skill rating bars', 'references on the CV'], ar: ['خبرة متألفة', 'كلام فاضي زي مجتهد', 'صورة وبيانات شخصية', 'نسب مهارات', 'معرّفين على الـ CV'] },
  outlineKey: 'cvOutline', outlineDesc: 'One line per CV section, in order.', outlineWhat: 'one line per section of the CV',
  outputDescription: c('A layered prompt for a chat AI, the CV sections, what you still need to fill, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وأقسام الـ CV، واللي محتاج تكمّله، وقائمة فحص.'),
  role: 'Senior recruiter who screens CVs daily, and a prompt engineer for chat AIs.',
  understanding: [
    'role is the single target; experience is the only source of jobs, dates, tools and results; level decides the order of sections.',
    'sections.goal states the target role, the level, and that the CV must be built only from the experience given.',
  ],
  intelligence: [
    'Structure: a three-line summary aimed at the role, experience as achievements (what you did → how → the result with a number), skills grouped and matched to the role\'s wording, education, and extras only if they help the role.',
    'sections.approach tells the AI to mirror the words of the job ad where they honestly apply, to start every bullet with a verb, and to turn duties into results.',
  ],
  controlExtra: [
    'Never invent a job, a date, a company, a tool, a degree or a number. Anything missing becomes [placeholder] and is listed in missingData.',
    'Never add a photo, age, marital status, religion or national ID to a CV.',
  ],
  examples: [{
    good: 'Bullet: "Raised one client from 40 to 300 monthly orders in 6 months by shifting budget to WhatsApp closing." Summary aimed at: marketing manager, e-commerce.',
    bad: 'Hard-working marketing professional with 10+ years and a proven record of increasing sales by 400% across the Middle East. Expert in everything.',
    why: 'The bad one invents years and a result, and says nothing a recruiter can check.',
  }],
});

export const coverLetter = makeTextMission({
  id: 'cover-letter', title: c('Cover letter', 'خطاب تقديم'), topics: ['cover-letter'],
  intake: { question: c('Tell me the role and why you want it.', 'قولّي الوظيفة، وعايزها ليه.'), why: c('One message is enough. I never invent experience.', 'رسالة واحدة كفاية، وعمري ما هألّف خبرة.'),
    starters: [c('A cover letter for a job I found', 'خطاب تقديم لوظيفة لقيتها'), c('A letter for a career change', 'خطاب لتغيير مجال'), c('A short email to apply', 'إيميل قصير للتقديم'), c('A letter for an internship', 'خطاب لتدريب')] },
  slots: [
    targetRole(c('What role and company are you applying to? Paste the ad if you have it.', 'بتقدّم على أنهي وظيفة وشركة؟ الصق الإعلان لو عندك.'), c('Marketing manager at Noon.', 'مدير تسويق في نون.')),
    experienceSlot(),
    { id: 'motivation', kind: 'longtext', layer: 'understanding', importance: 'important', maxLength: 600,
      label: c('Why this company', 'ليه الشركة دي'), question: c('Why this company, and what can you do for them specifically?', 'ليه الشركة دي، وتقدر تعمل لهم إيه بالتحديد؟'),
      why: c('A letter that could be sent to anyone gets read by nobody.', 'الخطاب اللي ينفع لأي حد ما بيقراه حد.'),
      example: c('They are expanding into Egypt and I have run campaigns in this market for 3 years.', 'بيتوسعوا في مصر، وأنا شغال حملات في السوق ده ٣ سنين.'),
      vocabulary: { en: ['they are expanding', 'I use their product', 'I know this market', 'I solved the same problem'], ar: ['بيتوسعوا', 'بستخدم منتجهم', 'أعرف السوق ده', 'حليت نفس المشكلة'] } },
    toneSlot({ importance: 'nice', defaults: [{ value: 'professional', reason: c('A professional tone is the safe default for applications.', 'النبرة الرسمية هي الأأمن في التقديم.') }] }),
    { id: 'lengthPref', kind: 'single', layer: 'delivery', importance: 'nice',
      label: c('Length', 'الطول'), question: c('How long?', 'طوله أد إيه؟'),
      why: c('Short letters get read.', 'الخطابات القصيرة بتتقري.'), example: c('Short.', 'قصير.'),
      options: [
        { value: 'email', label: c('Short email (under 150 words)', 'إيميل قصير (أقل من ١٥٠ كلمة)'), keywords: ['email', 'short', 'ايميل', 'قصير'] },
        { value: 'standard', label: c('One page', 'صفحة واحدة'), keywords: ['one page', 'صفحة'] },
      ],
      defaults: [{ value: 'email', reason: c('Most applications now go by email and get skimmed.', 'أغلب التقديم بقى بالإيميل وبيتقري بسرعة.') }] },
  ],
  nameLabel: c('Your name', 'اسمك'), nameWhat: 'your name',
  avoidVocab: { en: ['repeating the CV', 'to whom it may concern', 'invented achievements', 'flattery', 'empty phrases'], ar: ['تكرار الـ CV', 'إلى من يهمه الأمر', 'إنجازات متألفة', 'مجاملات', 'كلام فاضي'] },
  outlineKey: 'letterOutline', outlineDesc: 'One line per paragraph: what it does.', outlineWhat: 'one line per paragraph',
  outputDescription: c('A layered prompt for a chat AI, the paragraph plan, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وخطة الفقرات، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior hiring manager who reads applications, and a prompt engineer for chat AIs.',
  understanding: ['role names the job and company; motivation is what makes the letter specific; experience is the only evidence.', 'sections.goal states the role, the company, and the one reason this person fits.'],
  intelligence: [
    'Four short paragraphs: the hook (why them, specifically), the proof (one achievement that matches their need), the fit (what you would do in the first months), and a simple close with availability.',
    'sections.approach tells the AI to open with the company rather than with "I am applying", to use one achievement instead of listing the CV, and to end with a concrete next step.',
  ],
  controlExtra: ['Never invent achievements, titles or dates. Address a real person if the user gave a name; otherwise use the team name, never "to whom it may concern".'],
  examples: [{
    good: 'Opening: "You are opening in Egypt this year — that is the market I have spent three years learning the hard way." Proof: 40 → 300 orders for one client.',
    bad: 'To whom it may concern, I am a hard-working professional applying for this position. I am a great fit and a fast learner with excellent communication skills.',
    why: 'The bad one is generic, says nothing about the company, and offers no evidence.',
  }],
});

export const linkedinProfile = makeTextMission({
  id: 'linkedin-profile', title: c('LinkedIn profile', 'بروفايل لينكد إن'), topics: ['linkedin-profile'],
  intake: { question: c('Tell me what you do and who you want to find you.', 'قولّي بتعمل إيه، وعايز مين يلاقيك.'), why: c('One message is enough. I never invent experience.', 'رسالة واحدة كفاية، وعمري ما هألّف خبرة.'),
    starters: [c('Rewrite my LinkedIn headline and about', 'أعِد كتابة الهيدلاين والـ about'), c('A profile that attracts recruiters', 'بروفايل يجذب الـ recruiters'), c('A profile for freelance clients', 'بروفايل لعملاء فري لانس'), c('My profile is empty — help me fill it', 'بروفايلي فاضي، ساعدني أكمّله')] },
  slots: [
    targetRole(c('What role or clients do you want to attract?', 'عايز تجذب أنهي وظيفة أو عملاء؟'), c('Recruiters hiring marketing managers in the Gulf.', 'recruiters بيوظفوا مديري تسويق في الخليج.')),
    experienceSlot(),
    { id: 'goal', kind: 'single', layer: 'understanding', importance: 'important',
      label: c('What you want from it', 'عايز منه إيه'), question: c('What is the profile for?', 'البروفايل لإيه؟'),
      why: c('A job hunt and a freelance pitch are written differently.', 'البحث عن وظيفة والعرض للفري لانس بيتكتبوا بشكل مختلف.'),
      example: c('To get recruiters to message me.', 'إن الـ recruiters تكلمني.'),
      options: [
        { value: 'jobs', label: c('Recruiters and jobs', 'وظايف وrecruiters'), keywords: ['jobs', 'recruiter', 'وظيفة', 'وظايف'] },
        { value: 'clients', label: c('Freelance clients', 'عملاء فري لانس'), keywords: ['clients', 'freelance', 'عملاء', 'فري لانس'] },
        { value: 'network', label: c('Build a network in my field', 'بناء شبكة في مجالي'), keywords: ['network', 'شبكة', 'تواصل'] },
        { value: 'authority', label: c('Be known for a topic', 'أبقى معروف في موضوع'), keywords: ['authority', 'content', 'معروف', 'محتوى'] },
      ],
      defaults: [{ value: 'jobs', reason: c('Most profiles are rewritten to attract recruiters.', 'أغلب البروفايلات بتتكتب تاني لجذب الـ recruiters.') }] },
    toneSlot({ importance: 'nice' }),
  ],
  nameLabel: c('Your name', 'اسمك'), nameWhat: 'your name',
  avoidVocab: { en: ['guru and ninja titles', 'invented experience', 'buzzword stacks', 'third person about me', 'emoji walls'], ar: ['ألقاب زي جورو', 'خبرة متألفة', 'رصّ مصطلحات', 'الكلام عن نفسي بالغايب', 'إيموجي كتير'] },
  outlineKey: 'profileOutline', outlineDesc: 'One line per profile section.', outlineWhat: 'one line per section of the profile',
  outputDescription: c('A layered prompt for a chat AI, the profile sections, what you still need, and a checklist.', 'برومبت متقسم لأداة ذكاء اصطناعي، وأقسام البروفايل، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior recruiter who sources candidates on LinkedIn, and a prompt engineer for chat AIs.',
  understanding: ['role is who should find the profile; goal decides the whole angle; experience is the only evidence.', 'sections.goal states who should find this profile and what they should do next.'],
  intelligence: [
    'Deliver: a headline built from the role plus the value plus the proof, an about section in first person that opens with a line about the reader, experience entries rewritten as results, a skills list matched to the searches recruiters run, and three content ideas to post.',
    'sections.approach tells the AI to write the headline for search as well as for a human, and to keep the about section to five short paragraphs.',
  ],
  controlExtra: ['Never invent titles, dates, employers or numbers. The about section stays in the first person.'],
  examples: [{
    good: 'Headline: "Marketing manager · e-commerce growth in Egypt and the Gulf · scaled one client 40 → 300 orders/month". About opens: "If you are hiring for growth in this market, here is what actually moves it."',
    bad: 'Marketing Ninja 🚀 | Growth Hacker | Visionary Leader | Expert in SEO, SEM, AI, Blockchain, and Everything Digital.',
    why: 'The bad one is a buzzword stack with no evidence and no searchable role.',
  }],
});

export const careerBlueprints = [cvResume, coverLetter, linkedinProfile];
