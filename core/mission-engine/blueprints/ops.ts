import type { Slot } from '../types.ts';
import { c, facts } from '../modules.ts';
import { makeTextMission, toneSlot } from './_text.ts';
import { pasteBlockGate } from './refine.ts';

/** The business the standing assistant or the sheet is built around. */
const business = (): Slot => ({
  id: 'business', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1200,
  label: c('Your business', 'بيزنسك'),
  question: c('What does your business do, who are your customers, and what makes you different?', 'بيزنسك بيعمل إيه، وعملاؤك مين، وإيه اللي يميّزك؟'),
  why: c('This is what the assistant will think with every time it answers.', 'ده اللي المساعد هيفكر بيه في كل مرة بيرد.'),
  example: c('A pharmacy that delivers in Nasr City; our customers care about speed and the right price.', 'صيدلية بتوصّل في مدينة نصر؛ عملاؤنا بيهمهم السرعة والسعر الصح.'),
  vocabulary: { en: ['shop', 'clinic', 'restaurant', 'online store', 'service', 'our customers are', 'we are faster', 'we are cheaper'], ar: ['محل', 'عيادة', 'مطعم', 'متجر أونلاين', 'خدمة', 'عملاؤنا', 'أسرع', 'أرخص'] },
});

export const aiOperator = makeTextMission({
  id: 'ai-operator', title: c('A standing AI assistant', 'مساعد AI دايم لبيزنسك'), topics: ['ai-operator', 'support-script'],
  questionBudget: 4,
  intake: { question: c('Tell me the job you want the AI to keep doing for your business, every day.', 'قولّي الشغلانة اللي عايز الـ AI يفضل يعملها لبيزنسك كل يوم.'), why: c('We build one standing instruction you install once. After that you only paste the new message and it answers in your business\'s voice.', 'بنبني تعليمات دايمة تحطها مرة واحدة. بعد كده بتلزق الرسالة الجديدة بس، وهو يرد بصوت بيزنسك.'),
    starters: [c('Reply to my customers all day', 'يرد على عملائي طول اليوم'), c('Write my daily posts', 'يكتب بوستاتي اليومية'), c('Follow up on orders and late payments', 'يتابع الأوردرات والمتأخرات'), c('Answer the same questions I answer every day', 'يجاوب الأسئلة اللي بجاوبها كل يوم')] },
  slots: [
    business(),
    { id: 'task', kind: 'single', layer: 'understanding', importance: 'critical',
      label: c('The repeating job', 'الشغلانة المتكررة'), question: c('What should it do every time?', 'يعمل إيه في كل مرة؟'),
      why: c('A standing assistant does one job well, not ten badly.', 'المساعد الدايم بيعمل شغلانة واحدة صح، مش عشرة وحشين.'),
      example: c('Reply to customer messages.', 'يرد على رسائل العملاء.'),
      options: [
        { value: 'replies', label: c('Reply to customers', 'الرد على العملاء'), keywords: ['replies', 'customer', 'support', 'ردود', 'عملاء', 'خدمة عملاء'] },
        { value: 'content', label: c('Write daily content', 'كتابة محتوى يومي'), keywords: ['content', 'posts', 'محتوى', 'بوستات'] },
        { value: 'followup', label: c('Follow up on orders and payments', 'متابعة الأوردرات والمدفوعات'), keywords: ['follow up', 'orders', 'payment', 'متابعة', 'أوردرات', 'تحصيل'] },
        { value: 'qualify', label: c('Qualify incoming leads', 'فرز العملاء المحتملين'), keywords: ['leads', 'qualify', 'عملاء محتملين', 'فرز'] },
        { value: 'descriptions', label: c('Write product descriptions', 'كتابة أوصاف المنتجات'), keywords: ['product description', 'وصف منتج'] },
        { value: 'summaries', label: c('Summarise and sort what comes in', 'تلخيص وترتيب الجايلك'), keywords: ['summary', 'sort', 'تلخيص', 'ترتيب'] },
      ],
      defaults: [{ value: 'replies', reason: c('Customer replies are the job that eats the most time every day.', 'الرد على العملاء هو اللي بياكل أكبر وقت كل يوم.') }] },
    facts('policies', c('Your rules and facts', 'قواعدك ومعلوماتك'),
      c('What must it always know? (prices, delivery times, working hours, what you never promise)', 'لازم يعرف إيه دايماً؟ (الأسعار، مدة التوصيل، ساعات العمل، وإيه اللي عمرك ما توعد بيه)'),
      c('Delivery in 2 hours inside Nasr City, 40 EGP; we never promise same-day for outside; open 9am–11pm.', 'التوصيل في ساعتين جوه مدينة نصر بـ٤٠ جنيه؛ وعمرنا ما نوعد بنفس اليوم بره؛ ومفتوحين ٩ ص – ١١ م.')),
    toneSlot({ label: c('Voice of the replies', 'صوت الردود'), why: c('The assistant must sound like your business, not like a robot.', 'المساعد لازم يبان صوت بيزنسك، مش روبوت.') }),
    { id: 'escalation', kind: 'text', layer: 'control', importance: 'important', maxLength: 400,
      label: c('When to call you', 'إمتى يرجّعلك'), question: c('When should it stop and hand the message to a human?', 'إمتى يوقف ويرجّع الرسالة لإنسان؟'),
      why: c('An assistant that never escalates will promise something you cannot deliver.', 'المساعد اللي ما بيرجّعش حاجة لحد هيوعد بحاجة مش هتقدر تنفذها.'),
      example: c('Any complaint, any discount request, or anything about a refund.', 'أي شكوى، أو طلب خصم، أو أي حاجة عن استرجاع فلوس.'),
      vocabulary: { en: ['complaints', 'refunds', 'discount requests', 'legal questions', 'anything unusual', 'angry customer'], ar: ['شكاوى', 'استرجاع', 'طلب خصم', 'أسئلة قانونية', 'أي حاجة غريبة', 'عميل غضبان'] },
      defaults: [{ value: 'none', reason: c('By default it escalates complaints, refunds, discounts and anything it is not sure about.', 'افتراضياً بيرجّع الشكاوى والاسترجاع والخصومات وأي حاجة مش متأكد منها.') }],
      noneLabel: c('Use the safe default', 'استخدم الافتراضي الآمن') },
    { id: 'channels', kind: 'multi', layer: 'delivery', importance: 'nice',
      label: c('Where it works', 'بيشتغل فين'), question: c('Where do these messages come from?', 'الرسائل دي جاية منين؟'),
      why: c('A WhatsApp reply and an email are not the same length.', 'الرد على واتساب والإيميل مش نفس الطول.'),
      example: c('WhatsApp and Instagram DMs.', 'واتساب ورسائل إنستجرام.'),
      options: [
        { value: 'whatsapp', label: c('WhatsApp', 'واتساب'), keywords: ['whatsapp', 'واتساب', 'واتس'] },
        { value: 'dm', label: c('Instagram / Facebook DMs', 'رسائل إنستجرام / فيسبوك'), keywords: ['dm', 'instagram', 'messenger', 'رسائل', 'انستجرام'] },
        { value: 'email', label: c('Email', 'إيميل'), keywords: ['email', 'ايميل'] },
        { value: 'phone', label: c('Phone script', 'سكريبت تليفون'), keywords: ['phone', 'call', 'تليفون', 'مكالمة'] },
      ],
      defaults: [{ value: ['whatsapp'], reason: c('WhatsApp is where most customers in the region write.', 'واتساب هو مكان أغلب العملاء في المنطقة.') }] },
  ],
  nameLabel: c('Business name', 'اسم البيزنس'), nameWhat: 'the business name',
  avoidVocab: { en: ['promising what we cannot deliver', 'inventing prices or dates', 'pretending to be a human', 'medical or legal advice', 'sharing customer data'], ar: ['وعود مش بنقدر ننفذها', 'تأليف أسعار أو مواعيد', 'يدّعي إنه إنسان', 'نصايح طبية أو قانونية', 'مشاركة بيانات العملاء'] },
  outlineKey: 'setupOutline', outlineDesc: 'One line per step to install and run it, in order.', outlineWhat: 'one line per setup step',
  outputDescription: c('A standing instruction you install once, where to put it in each tool, how to run it daily, and a checklist.', 'تعليمات دايمة تحطها مرة واحدة، ومكانها في كل أداة، وإزاي تشغّلها كل يوم، وقائمة فحص.'),
  role: 'Senior operations consultant who sets businesses up to run on AI, and a prompt engineer for chat AIs.',
  understanding: [
    'business is what the assistant reasons with every time; task is the one repeating job; policies are the only facts it may state; escalation is its stop line.',
    'sections.goal states the business in a few lines, the one job, and who the replies are going to.',
  ],
  intelligence: [
    'The prompt is a standing instruction, written to be installed once and used many times. It must contain, in this order: the role it plays, the business in a few lines, the facts and rules it may state, the voice, how to handle the three or four situations that come up most in this task, what to do when it does not know, the escalation rule, and the exact output format for every run.',
    'sections.approach tells the AI to answer from policies only, to ask one short question when something is missing rather than guess, and to keep the same structure every time so replies look consistent.',
  ],
  controlExtra: [
    'The standing instruction must forbid inventing prices, delivery times, stock, dates or policies, and must require handing over to a human on anything in escalation.',
    'It must forbid claiming to be a human, giving medical, legal or financial advice, and repeating one customer\'s details to another.',
  ],
  deliveryExtra: [
    'prompt must be written as the standing instruction itself, ready to paste as the custom instructions of a project, not as a one-off request.',
    'sections.output must say exactly where to install it in each tool: ChatGPT → a Project\'s instructions or Custom Instructions; Claude → Project instructions; Gemini → a Gem; and that it is installed once and then reused.',
    'prompt must end with a clearly marked paste block: a line of >>> then "PASTE THE NEW CUSTOMER MESSAGE / TODAY\'S INPUT BELOW" then a line of <<<, which is what the user pastes on every run.',
    'setupOutline is the install-and-run checklist in order: where to paste it, what to test first, what to paste on each run, and when to review it.',
  ],
  extraGates: [pasteBlockGate()],
  examples: [{
    good: 'Standing instruction: "You answer messages for [business] on WhatsApp. Facts you may state: delivery 2 hours inside Nasr City, 40 EGP; hours 9am–11pm. Never state a price or a time that is not here. If the customer asks for a discount, complains, or asks about a refund, reply that a colleague will follow up and stop. Always answer in two short lines plus one question." Then: >>> PASTE THE NEW CUSTOMER MESSAGE BELOW <<<',
    bad: 'You are a helpful customer service AI for a pharmacy. Be friendly and answer all questions about prices, delivery and medicines as best you can.',
    why: 'The bad one has no facts, no limits, no escalation, and invites it to guess prices and give medical advice.',
  }],
});

export const planSheet = makeTextMission({
  id: 'plan-sheet', title: c('Plan & execution sheet', 'شيت خطة وتنفيذ'), topics: ['project-plan', 'spreadsheet-automation'],
  intake: { question: c('Tell me what you want to plan and run in a sheet.', 'قولّي عايز تخطط وتنفّذ إيه في شيت.'), why: c('I design the sheet: tabs, columns, formulas and how you keep it alive.', 'هصمّم الشيت: التابات والأعمدة والمعادلات وإزاي تحافظ عليه شغال.'),
    starters: [c('A sheet to run my project step by step', 'شيت أدير بيه مشروعي خطوة خطوة'), c('A plan sheet for opening a branch', 'شيت خطة لافتتاح فرع'), c('A tracker for my team\'s tasks', 'شيت متابعة لمهام فريقي'), c('A sheet to track my monthly targets', 'شيت أتابع بيه مستهدفاتي الشهرية')] },
  slots: [
    { id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1000,
      label: c('What you are planning', 'بتخطط لإيه'), question: c('What are you planning, and what does finished look like?', 'بتخطط لإيه، والخلاص شكله إيه؟'),
      why: c('The sheet is built backwards from what finished means.', 'الشيت بيتبني من الآخر: من معنى إنها خلصت.'),
      example: c('Opening a second branch; finished when the branch is open and selling.', 'افتتاح فرع تاني؛ خلصت لما الفرع يفتح ويبيع.'),
      vocabulary: { en: ['launch', 'open a branch', 'hire a team', 'run a campaign', 'build a product', 'finished when'], ar: ['إطلاق', 'افتتاح فرع', 'توظيف فريق', 'تشغيل حملة', 'بناء منتج', 'تخلص لما'] } },
    { id: 'tracking', kind: 'multi', layer: 'intelligence', importance: 'important',
      label: c('What you need to see', 'محتاج تشوف إيه'), question: c('What do you need the sheet to show you?', 'محتاج الشيت يوريك إيه؟'),
      why: c('Each thing you want to see is a column or a tab.', 'كل حاجة عايز تشوفها هي عمود أو تاب.'),
      example: c('Who is doing what, and what is late.', 'مين بيعمل إيه، وإيه اللي متأخر.'),
      options: [
        { value: 'owners', label: c('Who owns each step', 'مين مسؤول عن كل خطوة'), keywords: ['owner', 'responsible', 'مسؤول'] },
        { value: 'dates', label: c('Dates and what is late', 'التواريخ والمتأخر'), keywords: ['dates', 'deadline', 'late', 'تواريخ', 'متأخر'] },
        { value: 'status', label: c('Status of each step', 'حالة كل خطوة'), keywords: ['status', 'progress', 'حالة', 'تقدم'] },
        { value: 'cost', label: c('Cost against budget', 'التكلفة مقابل الميزانية'), keywords: ['cost', 'budget', 'تكلفة', 'ميزانية'] },
        { value: 'blockers', label: c('What is blocking what', 'إيه اللي واقف على إيه'), keywords: ['blocker', 'dependency', 'معطّل', 'اعتمادية'] },
        { value: 'results', label: c('Results against target', 'النتايج مقابل المستهدف'), keywords: ['results', 'target', 'kpi', 'نتايج', 'مستهدف'] },
      ],
      defaults: [{ value: ['owners', 'dates', 'status'], reason: c('Owner, date and status are the minimum that makes a plan sheet work.', 'المسؤول والتاريخ والحالة أقل حاجة تخلي شيت الخطة شغال.') }] },
    facts('known', c('What you already know', 'اللي عارفه بالفعل'), c('What dates, budget, people or steps do you already have?', 'عندك تواريخ أو ميزانية أو أفراد أو خطوات بالفعل؟'), c('Open in March; budget 400K; two people available.', 'الافتتاح مارس؛ ميزانية ٤٠٠ ألف؛ فردين متاحين.')),
  ],
  nameLabel: c('Project / business name', 'اسم المشروع أو البيزنس'), nameWhat: 'the project or business name',
  avoidVocab: { en: ['invented dates or budgets', 'steps with no owner', 'merged cells', 'one giant tab', 'colours instead of a status column'], ar: ['تواريخ أو ميزانيات متألفة', 'خطوات من غير مسؤول', 'دمج خلايا', 'تاب واحد ضخم', 'ألوان بدل عمود حالة'] },
  outlineKey: 'sheetOutline', outlineDesc: 'One line per tab: tab name — its columns — what it answers.', outlineWhat: 'one line per tab of the sheet',
  outputDescription: c('A prompt that builds the sheet, the tabs and columns, the formulas, and a checklist.', 'برومبت يبني الشيت، والتابات والأعمدة، والمعادلات، وقائمة فحص.'),
  role: 'Senior project manager who runs delivery from spreadsheets, and a prompt engineer for chat AIs.',
  understanding: [
    'subject sets the goal and the definition of done; tracking decides the columns and tabs; known is the only source of real dates, budgets and names.',
    'sections.goal states what is being planned, what finished means, and what the user must be able to see at a glance.',
  ],
  intelligence: [
    'Design the sheet properly: one row per step, one fact per column, a Steps tab (step, owner, start, due, status, depends on, notes), a Dashboard tab that reads from it with formulas, and a small Settings tab holding the dropdown lists. Give the actual formulas for what is late, percent complete and cost against budget, and the data-validation lists for status and owner.',
    'sections.approach tells the AI to break the plan into steps small enough to finish in a week, to attach an owner and a due date to each, and to mark dependencies so the order is visible.',
  ],
  controlExtra: ['Never invent dates, budgets, owners or step durations — use [placeholders] and list them in missingData. Never design around merged cells or colour-only status.'],
  deliveryExtra: [
    'sections.output must specify each tab, its exact column headers in order, the formulas as text, the dropdown lists, and the conditional formatting rules — enough to build the sheet without guessing.',
    'Formulas are written so they work in both Excel and Google Sheets, and any difference between the two is noted beside the formula.',
  ],
  examples: [{
    good: 'Steps tab columns: Step | Owner | Start | Due | Status | Depends on | Notes. Late flag: =IF(AND(D2<TODAY(),E2<>"Done"),"LATE",""). Status list on Settings!A2:A5. Dashboard: =COUNTIF(Steps!E:E,"Done")/COUNTA(Steps!A2:A).',
    bad: 'Make a nice project plan spreadsheet with colourful merged headers, a timeline, and realistic dates for a three-month launch.',
    why: 'The bad one invents dates, uses merged cells, and gives no columns or formulas to actually build.',
  }],
});

export const dataOrganization = makeTextMission({
  id: 'data-organization', title: c('Organise my data', 'نظّم الداتا بتاعتي'), topics: ['data-cleaning', 'spreadsheet-formula'],
  intake: { question: c('Tell me what data you have and what you cannot answer from it today.', 'قولّي عندك داتا إيه، وإيه اللي مش عارف تجاوبه منها دلوقتي.'), why: c('I design the structure first, then the formulas. Messy data is a structure problem.', 'بصمّم الهيكل الأول، وبعدها المعادلات. الداتا المبعزقة مشكلة هيكل.'),
    starters: [c('My sheets are a mess', 'الشيتات بتاعتي مبعزقة'), c('I cannot tell which product sells best', 'مش عارف أنهي منتج بيبيع أكتر'), c('Clean up my customer list', 'نضّف قائمة عملائي'), c('How should I organise my orders data?', 'أنظّم داتا الأوردرات إزاي؟')] },
  slots: [
    { id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1000,
      label: c('The data you have', 'الداتا اللي عندك'), question: c('What data do you keep, where, and how is it written now?', 'بتحتفظ بداتا إيه، وفين، ومكتوبة إزاي دلوقتي؟'),
      why: c('The fix depends on how it is stored today.', 'الحل بيعتمد على شكلها الحالي.'),
      example: c('Orders in one sheet per month, customer names typed by hand, phone numbers mixed with notes.', 'الأوردرات شيت لكل شهر، وأسماء العملاء مكتوبة بالإيد، والتليفونات مخلوطة بملاحظات.'),
      vocabulary: { en: ['one sheet per month', 'typed by hand', 'duplicates', 'mixed columns', 'no dates', 'in WhatsApp', 'in a notebook'], ar: ['شيت لكل شهر', 'مكتوبة بالإيد', 'مكرر', 'أعمدة مخلوطة', 'مفيش تواريخ', 'على واتساب', 'في دفتر'] } },
    { id: 'questions', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 800,
      label: c('What you want to answer', 'عايز تجاوب إيه'), question: c('What questions should the data answer every month?', 'الداتا تجاوب أنهي أسئلة كل شهر؟'),
      why: c('Data is organised around the questions it must answer.', 'الداتا بتتنظّم حوالين الأسئلة اللي لازم تجاوبها.'),
      example: c('Which product sells most, which customer comes back, and what my best week was.', 'أنهي منتج بيبيع أكتر، ومين العميل اللي بيرجع، وأحسن أسبوع عندي.'),
      vocabulary: { en: ['best seller', 'repeat customers', 'revenue per month', 'profit per product', 'stock left', 'who owes me'], ar: ['أكتر مبيع', 'عملاء بيرجعوا', 'إيرادات الشهر', 'ربح كل منتج', 'المخزون المتبقي', 'مين عليه فلوس'] } },
    { id: 'scale', kind: 'single', layer: 'intelligence', importance: 'nice',
      label: c('How much data', 'حجم الداتا'), question: c('Roughly how many rows a month?', 'تقريباً كام سطر في الشهر؟'),
      why: c('Size decides whether a sheet is enough or you need a database.', 'الحجم بيحدد الشيت يكفي ولا محتاج داتابيز.'),
      example: c('A few hundred.', 'بضع مئات.'),
      options: [
        { value: 'small', label: c('Under 500 rows', 'أقل من ٥٠٠ سطر'), keywords: ['small', 'قليل'] },
        { value: 'medium', label: c('500–5,000 rows', '٥٠٠–٥٠٠٠ سطر'), keywords: ['medium', 'متوسط'] },
        { value: 'large', label: c('More than 5,000 rows', 'أكتر من ٥٠٠٠ سطر'), keywords: ['large', 'كبير', 'كتير'] },
      ],
      defaults: [{ value: 'medium', reason: c('A well-built sheet handles this comfortably.', 'الشيت المبني صح بيستحمل الحجم ده بمراحة.') }] },
  ],
  nameLabel: c('Business name', 'اسم البيزنس'), nameWhat: 'the business name',
  avoidVocab: { en: ['one sheet per month', 'merged cells', 'numbers stored as text', 'notes inside number columns', 'colours as data', 'deleting the raw data'], ar: ['شيت لكل شهر', 'دمج خلايا', 'أرقام متخزنة كنص', 'ملاحظات جوه أعمدة أرقام', 'الألوان كبيانات', 'حذف الداتا الأصلية'] },
  outlineKey: 'sheetOutline', outlineDesc: 'One line per table or tab: name — its columns — what it answers.', outlineWhat: 'one line per table in the new structure',
  outputDescription: c('A prompt that redesigns your data, the table structure, the cleaning steps, the formulas, and a checklist.', 'برومبت يعيد تصميم الداتا، وهيكل الجداول، وخطوات التنضيف، والمعادلات، وقائمة فحص.'),
  role: 'Senior data analyst who sets up reporting for small businesses, and a prompt engineer for chat AIs.',
  understanding: [
    'subject is how the data is stored today; questions are what the structure must answer; scale decides sheet versus database.',
    'sections.goal states the current mess, the questions to answer, and that the raw data must be kept.',
  ],
  intelligence: [
    'Design around one table per thing, with one row per event and one fact per column: a long Orders table (date, customer id, product id, quantity, unit price, channel, status) plus small Customers and Products tables, then a Report tab built with lookups and pivots. Never a tab per month — the date column does that job.',
    'Then give the cleaning steps in order: keep a copy of the raw data, split mixed columns, standardise dates and phone numbers to one format, trim spaces, unify spellings with a lookup list, mark duplicates by a real key, and add data validation so new rows stay clean.',
    'sections.approach tells the AI to answer each of the user\'s questions explicitly with the formula or pivot that produces it, and to say plainly when a question cannot be answered from the data they keep.',
  ],
  controlExtra: ['Never invent column names the user did not describe, and never propose deleting the original data — cleaning always works on a copy. Mark every assumption as [to confirm].'],
  deliveryExtra: [
    'sections.output must give each table with its exact column headers in order, the cleaning steps as a numbered list, and one formula or pivot per question the user asked.',
    'Formulas are written so they work in both Excel and Google Sheets, and any difference between the two is noted beside the formula.',
  ],
  examples: [{
    good: 'One Orders table, one row per order, Date as a real date, Customer ID instead of a typed name. Best seller: pivot Product ID by SUM(Quantity). Repeat customers: =COUNTIFS(Orders!B:B,[customer id])>1. Keep the raw sheets in a Raw tab untouched.',
    bad: 'Merge all your monthly sheets into one colourful sheet, colour the good customers green, and delete the old files to save space.',
    why: 'The bad one uses colour as data and deletes the only copy of the originals.',
  }],
});

export const opsBlueprints = [aiOperator, planSheet, dataOrganization];
