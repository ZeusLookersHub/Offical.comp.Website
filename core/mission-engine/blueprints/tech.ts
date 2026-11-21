import type { Copy, Slot } from '../types.ts';
import { c, facts } from '../modules.ts';
import { makeBuildMission } from './_build.ts';

/** What is being built and the one job it must do. */
const product = (label: Copy, question: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'subject', kind: 'longtext', layer: 'understanding', importance: 'critical', maxLength: 1200,
  label, question, why: c('Everything is built from this.', 'كل حاجة هتتبني من ده.'), example, vocabulary: vocab,
});

const users = (example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'users', kind: 'text', layer: 'understanding', importance: 'important', maxLength: 400,
  label: c('Who uses it', 'مين بيستخدمها'), question: c('Who uses it, and on what?', 'مين بيستخدمها، وعلى إيه؟'),
  why: c('Users decide the screens and the device it is built for first.', 'المستخدمين بيحددوا الشاشات والجهاز اللي تتبني له الأول.'), example, vocabulary: vocab,
});

/** Core features — kept short on purpose, because a long list builds nothing. */
const features = (question: Copy, example: Copy, vocab: { en: string[]; ar: string[] }): Slot => ({
  id: 'features', kind: 'longtext', layer: 'intelligence', importance: 'important', maxLength: 900,
  label: c('What it must do', 'لازم تعمل إيه'), question,
  why: c('Three features that work beat ten that half-work.', 'تلات حاجات شغالة أحسن من عشرة نصّهم شغال.'), example, vocabulary: vocab,
});

const dataSlot = (): Slot => ({
  id: 'data', kind: 'longtext', layer: 'intelligence', importance: 'nice', maxLength: 700,
  label: c('The data it keeps', 'الداتا اللي بتتخزن'),
  question: c('What does it need to store or remember?', 'محتاجة تخزّن أو تفتكر إيه؟'),
  why: c('The data model decides most of the build.', 'شكل الداتا بيحدد أغلب البناء.'),
  example: c('Customers, orders, and each order\'s items.', 'عملاء، وأوردرات، وأصناف كل أوردر.'),
  vocabulary: { en: ['users', 'orders', 'products', 'bookings', 'messages', 'files', 'nothing — it is read only'], ar: ['مستخدمين', 'أوردرات', 'منتجات', 'حجوزات', 'رسائل', 'ملفات', 'مفيش — للعرض بس'] },
  noneLabel: c('No stored data', 'مفيش داتا متخزنة'),
  defaults: [{ value: 'none', reason: c('We start without storage and add it when a feature needs it.', 'هنبدأ من غير تخزين، ونضيفه لما ميزة تحتاجه.') }],
});

const platform = (options: { value: string; label: Copy; keywords?: string[] }[], def: string, defReason: Copy): Slot => ({
  id: 'platform', kind: 'single', layer: 'delivery', importance: 'important',
  label: c('Where it runs', 'بتشتغل فين'), question: c('Where should it run?', 'تشتغل فين؟'),
  why: c('This decides the stack and the layout rules.', 'ده بيحدد التقنية وقواعد التصميم.'), example: c('On the web, mobile first.', 'على الويب، الموبايل الأول.'),
  options, defaults: [{ value: def, reason: defReason }],
});

export const websiteBuild = makeBuildMission({
  id: 'website', title: c('Website', 'موقع'), topics: ['website'],
  intake: { question: c('Tell me what the website is for and what visitors should do.', 'قولّي الموقع لإيه، والزائر يعمل إيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A website for my company', 'موقع لشركتي'), c('A site to show my work', 'موقع أعرض فيه شغلي'), c('A site for my restaurant with the menu', 'موقع لمطعمي بالمنيو'), c('A small online store', 'متجر أونلاين صغير')] },
  slots: [
    product(c('What the site is for', 'الموقع لإيه'), c('What does the site do, and what should a visitor do on it?', 'الموقع بيعمل إيه، والزائر يعمل إيه فيه؟'), c('Show our services and let people request a quote.', 'يعرض خدماتنا ويخلي الناس تطلب عرض سعر.'), { en: ['company site', 'portfolio', 'store', 'menu', 'request a quote', 'book', 'buy', 'contact us'], ar: ['موقع شركة', 'بورتفوليو', 'متجر', 'منيو', 'طلب عرض سعر', 'حجز', 'شراء', 'اتصل بنا'] }),
    users(c('Clients on their phones.', 'عملاء على موبايلاتهم.'), { en: ['clients', 'on mobile', 'on desktop', 'in Egypt', 'in the Gulf', 'older users'], ar: ['عملاء', 'على الموبايل', 'على الكمبيوتر', 'في مصر', 'في الخليج', 'ناس كبيرة'] }),
    { id: 'pages', kind: 'multi', layer: 'intelligence', importance: 'important',
      label: c('Pages', 'الصفحات'), question: c('Which pages do you need?', 'محتاج أنهي صفحات؟'),
      why: c('Each page is a build step.', 'كل صفحة خطوة في البناء.'), example: c('Home, services, contact.', 'الرئيسية، الخدمات، اتصل بنا.'),
      options: [
        { value: 'home', label: c('Home', 'الرئيسية'), keywords: ['home', 'الرئيسية'] },
        { value: 'about', label: c('About', 'من إحنا'), keywords: ['about', 'من احنا'] },
        { value: 'services', label: c('Services / products', 'الخدمات / المنتجات'), keywords: ['services', 'products', 'خدمات', 'منتجات'] },
        { value: 'work', label: c('Our work / gallery', 'أعمالنا / معرض'), keywords: ['portfolio', 'gallery', 'أعمالنا', 'معرض'] },
        { value: 'contact', label: c('Contact', 'اتصل بنا'), keywords: ['contact', 'اتصل'] },
        { value: 'blog', label: c('Blog', 'مدونة'), keywords: ['blog', 'مدونة'] },
      ],
      defaults: [{ value: ['home', 'services', 'contact'], reason: c('Three pages are enough to launch; the rest can come later.', 'تلات صفحات كفاية تنزل بيهم، والباقي بعدين.') }] },
    facts('content', c('Content you already have', 'المحتوى اللي عندك'), c('What real content do you have? (services, prices, photos, address, phone)', 'عندك محتوى حقيقي إيه؟ (خدمات، أسعار، صور، عنوان، تليفون)'), c('Six services, 12 project photos, address in Maadi.', 'ست خدمات، و١٢ صورة مشاريع، وعنوان في المعادي.')),
    platform([
      { value: 'mobile-first', label: c('Web, mobile first', 'ويب، الموبايل الأول'), keywords: ['mobile', 'موبايل'] },
      { value: 'desktop-first', label: c('Web, desktop first', 'ويب، الكمبيوتر الأول'), keywords: ['desktop', 'كمبيوتر'] },
    ], 'mobile-first', c('Most visitors in the region arrive on a phone.', 'أغلب الزوار في المنطقة بيجوا من الموبايل.')),
  ],
  nameLabel: c('Brand name', 'اسم البراند'), nameWhat: 'the brand name',
  avoidVocab: { en: ['invented reviews', 'invented prices', 'stock photos of fake teams', 'autoplay video', 'popups on arrival'], ar: ['تقييمات متألفة', 'أسعار متألفة', 'صور فرق وهمية', 'فيديو بيشتغل لوحده', 'نوافذ منبثقة على الدخول'] },
  outlineKey: 'pageOutline', outlineDesc: 'One line per page and its sections, in order.', outlineWhat: 'one line per page with its sections',
  outputDescription: c('A build prompt for an AI builder, the page plan, the content you still need, and a checklist.', 'برومبت بناء لأداة بناء المواقع، وخطة الصفحات، والمحتوى اللي لسه ناقصك، وقائمة فحص.'),
  role: 'Senior web developer who ships small business sites, and a prompt engineer for AI builders.',
  understanding: [
    'subject is the site\'s one job; users decide mobile or desktop first; content is the only real copy, prices and photos available.',
    'sections.goal states what the site is for, who visits, and the one action to optimise for.',
  ],
  intelligence: [
    'Specify per page: the sections in order, the one headline idea, the components, and where the call to action sits. Keep navigation to the chosen pages only, and make every page reachable in one tap from the header.',
    'sections.approach tells the AI to build a single responsive layout rather than a separate mobile design, to use real content where given and a clearly marked placeholder where not, and to keep the page fast (no heavy sliders or autoplay).',
  ],
  controlExtra: ['Never invent reviews, client logos, prices, addresses or phone numbers. A contact form must state where its submissions go, and may not be wired to an invented service.'],
  deliveryExtra: ['sections.output must require semantic HTML, real alt text, keyboard-reachable links and buttons, visible focus, and a contrast check.'],
  examples: [{
    good: 'Home: hero (headline: "Office finishing handed over on time"), three services from the list, project gallery (12 photos), contact strip with the real phone. One responsive layout, Arabic right-to-left, WhatsApp button wired to wa.me/[number].',
    bad: 'A beautiful modern site with testimonials from happy clients, a 5-star rating, an animated hero video, and prices starting from 999.',
    why: 'The bad one invents testimonials, a rating and prices, and the autoplay video makes it slow on a phone.',
  }],
});

export const webApp = makeBuildMission({
  id: 'web-app', title: c('Web app', 'تطبيق ويب'), topics: ['web-app'],
  intake: { question: c('Tell me the problem the app solves and who uses it.', 'قولّي التطبيق بيحل مشكلة إيه، ومين بيستخدمه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('An app to manage my orders', 'تطبيق أدير بيه أوردراتي'), c('A booking system for my clinic', 'نظام حجز لعيادتي'), c('A dashboard for my team', 'داشبورد لفريقي'), c('A tool to replace my spreadsheets', 'أداة تستبدل الشيتات بتاعتي')] },
  slots: [
    product(c('What the app does', 'التطبيق بيعمل إيه'), c('What problem does it solve, and what does a user do in it?', 'بيحل مشكلة إيه، والمستخدم بيعمل إيه فيه؟'), c('Staff log orders and see which are late; replaces our WhatsApp notes.', 'الموظفين بيسجلوا الأوردرات ويشوفوا المتأخر؛ بدل ملاحظات الواتساب.'), { en: ['manage', 'track', 'book', 'approve', 'replaces spreadsheets', 'internal tool', 'for customers'], ar: ['إدارة', 'متابعة', 'حجز', 'اعتماد', 'بدل الشيتات', 'أداة داخلية', 'للعملاء'] }),
    users(c('Five staff on desktop, the manager on mobile.', 'خمس موظفين على الكمبيوتر، والمدير على الموبايل.'), { en: ['my team', 'customers', 'admin only', 'on desktop', 'on mobile', 'different roles'], ar: ['فريقي', 'عملاء', 'الأدمن بس', 'على الكمبيوتر', 'على الموبايل', 'صلاحيات مختلفة'] }),
    features(c('What must it do? Three or four things, most important first.', 'لازم تعمل إيه؟ تلاتة أو أربعة، الأهم الأول.'), c('Add an order, mark it done, see what is late, export the month.', 'إضافة أوردر، وتعليمه كمنتهي، ومتابعة المتأخر، وتصدير الشهر.'), { en: ['add', 'edit', 'search', 'filter', 'export', 'notifications', 'roles and permissions', 'login'], ar: ['إضافة', 'تعديل', 'بحث', 'فلترة', 'تصدير', 'تنبيهات', 'صلاحيات', 'تسجيل دخول'] }),
    dataSlot(),
    platform([
      { value: 'desktop-first', label: c('Desktop first', 'الكمبيوتر الأول'), keywords: ['desktop', 'كمبيوتر'] },
      { value: 'mobile-first', label: c('Mobile first', 'الموبايل الأول'), keywords: ['mobile', 'موبايل'] },
      { value: 'both', label: c('Both equally', 'الاتنين'), keywords: ['both', 'الاتنين'] },
    ], 'desktop-first', c('Work tools are mostly used on a computer.', 'أدوات الشغل بتتستخدم على الكمبيوتر غالباً.')),
  ],
  nameLabel: c('App name', 'اسم التطبيق'), nameWhat: 'the app name',
  avoidVocab: { en: ['features I did not ask for', 'fake sample data left in', 'hard-coded keys', 'login without roles', 'deleting records permanently'], ar: ['ميزات ما طلبتهاش', 'بيانات تجريبية متسيبة', 'مفاتيح مكتوبة في الكود', 'دخول من غير صلاحيات', 'حذف نهائي للسجلات'] },
  outlineKey: 'specOutline', outlineDesc: 'One line per screen or feature, in build order.', outlineWhat: 'one line per screen in build order',
  outputDescription: c('A build prompt for an AI builder, the screens in build order, what you still need, and a checklist.', 'برومبت بناء لأداة بناء، والشاشات بترتيب البناء، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior full-stack engineer who ships internal tools, and a prompt engineer for AI builders.',
  understanding: [
    'subject is the problem; features is the scope and nothing outside it gets built; data is the model; users decides roles and the first device.',
    'sections.goal states the problem, who uses it, and the smallest version that is already useful.',
  ],
  intelligence: [
    'Define the data model first (tables, fields, types, relations), then the screens that cover the features, then the states: loading, empty, error, no permission. Build order starts with the screen that delivers the main feature end to end.',
    'sections.approach tells the AI to ship the smallest working version first, to keep every list searchable and filterable, to soft-delete rather than destroy records, and to validate input at the point of entry.',
  ],
  controlExtra: ['Never add features beyond the list. Never leave sample data in the build. Never hard-code keys, passwords or connection strings.'],
  deliveryExtra: ['sections.output must name the stack, the files with paths, the data model, the auth and role rules, and the migration or setup steps to run it.'],
  examples: [{
    good: 'Data: orders(id, customer, items, due_date, status, created_at). Screen 1: orders list with search, filter by status, and a LATE badge when due_date < today and status != done. Empty state: "No orders yet — add the first one."',
    bad: 'Build a complete ERP with AI insights, chat, invoicing and a mobile app, with demo data so it looks full, and put the database password in the config file.',
    why: 'The bad one builds far beyond the scope, ships fake data, and hard-codes a password.',
  }],
});

export const mobileApp = makeBuildMission({
  id: 'mobile-app', title: c('Mobile app', 'تطبيق موبايل'), topics: ['mobile-app'],
  intake: { question: c('Tell me what the app does and who it is for.', 'قولّي التطبيق بيعمل إيه، ولمين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('An app for my delivery service', 'تطبيق لخدمة التوصيل بتاعتي'), c('A loyalty app for my shop', 'تطبيق ولاء لمحلي'), c('A simple habit tracker', 'تطبيق بسيط لمتابعة العادات'), c('An app for my customers to book', 'تطبيق عملائي يحجزوا منه')] },
  slots: [
    product(c('What the app does', 'التطبيق بيعمل إيه'), c('What does the app do, and what is the one thing a user opens it for?', 'بيعمل إيه، والمستخدم بيفتحه عشان إيه بالتحديد؟'), c('Customers order from our shop and track the delivery.', 'العملاء يطلبوا من محلنا ويتابعوا التوصيل.'), { en: ['order', 'book', 'track', 'loyalty points', 'browse', 'chat with us', 'for customers', 'for drivers'], ar: ['طلب', 'حجز', 'متابعة', 'نقاط ولاء', 'تصفح', 'محادثة', 'للعملاء', 'للمندوبين'] }),
    users(c('Our customers, mostly on Android.', 'عملاؤنا، معظمهم أندرويد.'), { en: ['customers', 'staff', 'drivers', 'Android', 'iPhone', 'both'], ar: ['عملاء', 'موظفين', 'مندوبين', 'أندرويد', 'آيفون', 'الاتنين'] }),
    features(c('What must it do? Three or four things, most important first.', 'لازم يعمل إيه؟ تلاتة أو أربعة، الأهم الأول.'), c('Browse products, place an order, track it, see past orders.', 'تصفح المنتجات، وعمل أوردر، ومتابعته، والأوردرات السابقة.'), { en: ['browse', 'order', 'pay', 'track', 'notifications', 'login with phone', 'offline'], ar: ['تصفح', 'طلب', 'دفع', 'متابعة', 'تنبيهات', 'دخول بالموبايل', 'بدون إنترنت'] }),
    dataSlot(),
    platform([
      { value: 'android', label: c('Android first', 'أندرويد الأول'), keywords: ['android', 'أندرويد'] },
      { value: 'ios', label: c('iPhone first', 'آيفون الأول'), keywords: ['ios', 'iphone', 'آيفون'] },
      { value: 'cross', label: c('Both from one codebase', 'الاتنين من كود واحد'), keywords: ['both', 'cross platform', 'الاتنين'] },
    ], 'cross', c('One codebase for both is cheaper to build and keep.', 'كود واحد للاتنين أرخص في البناء والصيانة.')),
  ],
  nameLabel: c('App name', 'اسم التطبيق'), nameWhat: 'the app name',
  avoidVocab: { en: ['features I did not ask for', 'asking for permissions it does not need', 'fake data', 'hard-coded keys', 'blocking the app behind signup'], ar: ['ميزات ما طلبتهاش', 'صلاحيات مش محتاجها', 'بيانات وهمية', 'مفاتيح في الكود', 'إجبار التسجيل قبل أي حاجة'] },
  outlineKey: 'screenOutline', outlineDesc: 'One line per screen, in the order a user meets them.', outlineWhat: 'one line per screen in user order',
  outputDescription: c('A build prompt for an AI builder, the screens in order, what you still need, and a checklist.', 'برومبت بناء لأداة بناء، والشاشات بالترتيب، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior mobile engineer, and a prompt engineer for AI builders.',
  understanding: [
    'subject is the one reason the app gets opened; features is the scope; users and platform set the target and the conventions to follow.',
    'sections.goal states the one job, the audience, the platform, and the smallest version worth shipping.',
  ],
  intelligence: [
    'Lay out the screens in the order a user meets them, each with its purpose, its components, its empty and error states, and what happens offline or on a slow connection. Keep the main job reachable in two taps from opening.',
    'sections.approach tells the AI to let people use the app before asking them to sign up, to request a permission only at the moment it is needed with a reason, and to follow the platform\'s own navigation patterns.',
  ],
  controlExtra: ['Never add features beyond the list. Never request a permission the features do not need. Never hard-code keys or tokens.'],
  deliveryExtra: ['sections.output must name the framework, the screen files, navigation, state handling, the offline behaviour, and large-text and screen-reader support.'],
  examples: [{
    good: 'Screen 1 Products (browse without login), Screen 2 Cart, Screen 3 Phone login only at checkout, Screen 4 Order tracking with a LATE state. Offline: show the last loaded products with a banner.',
    bad: 'Force signup on the first screen, ask for location, contacts and camera on launch, and add a social feed, AI chat and games.',
    why: 'The bad one blocks the app behind signup, over-asks for permissions, and adds features nobody requested.',
  }],
});

export const uiUx = makeBuildMission({
  id: 'ui-ux', title: c('UI/UX spec', 'مواصفات واجهة وتجربة'), topics: ['ui-ux', 'ui-ux-specification'],
  intake: { question: c('Tell me the screen or flow you want designed, and what the user is trying to do.', 'قولّي الشاشة أو المسار اللي عايز تصممه، والمستخدم عايز يعمل إيه.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('Design the checkout flow', 'صمّم مسار الدفع'), c('My signup is confusing — fix it', 'التسجيل عندي مربك، ظبّطه'), c('Design the main screen of my app', 'صمّم الشاشة الرئيسية لتطبيقي'), c('A spec for the booking flow', 'مواصفات مسار الحجز')] },
  slots: [
    product(c('The screen or flow', 'الشاشة أو المسار'), c('Which screen or flow, and what is the user trying to finish?', 'أنهي شاشة أو مسار، والمستخدم عايز يخلّص إيه؟'), c('Checkout: pay for a cart in as few steps as possible.', 'الدفع: يخلّص دفع السلة بأقل خطوات.'), { en: ['checkout', 'signup', 'booking', 'dashboard', 'search', 'onboarding', 'finish in one step'], ar: ['دفع', 'تسجيل', 'حجز', 'داشبورد', 'بحث', 'تعريف أول مرة', 'يخلص في خطوة'] }),
    users(c('First-time customers on a phone.', 'عملاء أول مرة على الموبايل.'), { en: ['first-time users', 'returning users', 'staff', 'on mobile', 'in a hurry', 'not tech savvy'], ar: ['أول مرة', 'عملاء راجعين', 'موظفين', 'على الموبايل', 'مستعجلين', 'مش فاهمين تقنية'] }),
    { id: 'problem', kind: 'longtext', layer: 'understanding', importance: 'important', maxLength: 700,
      label: c('What goes wrong now', 'إيه اللي غلط دلوقتي'), question: c('What goes wrong today, or where do people get stuck?', 'إيه اللي بيحصل غلط دلوقتي، أو الناس بتقف فين؟'),
      why: c('A spec without the current problem is decoration.', 'المواصفات من غير المشكلة الحالية تبقى زينة.'),
      example: c('People fill the form then leave at the shipping step.', 'الناس بتملا الفورم وتسيب في خطوة الشحن.'),
      vocabulary: { en: ['too many steps', 'unclear buttons', 'people leave at', 'they call us instead', 'errors are confusing', 'nothing is wrong — it is new'], ar: ['خطوات كتير', 'زراير مش واضحة', 'بيسيبوا عند', 'بيتصلوا بينا', 'رسايل الخطأ مربكة', 'مفيش مشكلة — جديدة'] } },
    { id: 'states', kind: 'multi', layer: 'intelligence', importance: 'nice',
      label: c('Cases to design for', 'حالات لازم تتصمم'), question: c('Which awkward cases must be designed too?', 'أنهي حالات محرجة لازم تتصمم كمان؟'),
      why: c('Products break in the states nobody designed.', 'المنتجات بتبوظ في الحالات اللي محدش صممها.'),
      example: c('Empty, error, and slow connection.', 'فاضي، وخطأ، وإنترنت ضعيف.'),
      options: [
        { value: 'empty', label: c('Nothing here yet', 'مفيش حاجة لسه'), keywords: ['empty', 'فاضي'] },
        { value: 'loading', label: c('Loading / slow', 'بيحمّل / بطيء'), keywords: ['loading', 'slow', 'تحميل', 'بطيء'] },
        { value: 'error', label: c('Something failed', 'حاجة فشلت'), keywords: ['error', 'failed', 'خطأ'] },
        { value: 'offline', label: c('No internet', 'مفيش إنترنت'), keywords: ['offline', 'بدون انترنت'] },
        { value: 'permission', label: c('Not allowed', 'مش مسموح'), keywords: ['permission', 'forbidden', 'صلاحية'] },
        { value: 'long', label: c('Very long content or names', 'محتوى أو أسماء طويلة'), keywords: ['long text', 'overflow', 'نص طويل'] },
      ],
      defaults: [{ value: ['empty', 'loading', 'error'], reason: c('Empty, loading and error are where most products feel broken.', 'الفاضي والتحميل والخطأ هي أكتر حاجات بتبوّظ الإحساس.') }] },
  ],
  nameLabel: c('Product name', 'اسم المنتج'), nameWhat: 'the product name',
  avoidVocab: { en: ['vague words like clean and modern', 'designing only the happy path', 'tiny tap targets', 'colour as the only signal', 'placeholder text instead of labels'], ar: ['كلام غامض زي نضيف وعصري', 'تصميم المسار المثالي بس', 'أزرار صغيرة', 'اللون كدليل وحيد', 'نص داخل الخانة بدل عنوان'] },
  outlineKey: 'specOutline', outlineDesc: 'One line per step or state: what the user sees and what they can do.', outlineWhat: 'one line per step and state of the flow',
  outputDescription: c('A spec prompt for a design or build AI, the flow step by step, what you still need, and a checklist.', 'برومبت مواصفات لأداة تصميم أو بناء، والمسار خطوة خطوة، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior product designer who writes specs engineers can build from, and a prompt engineer for AI tools.',
  understanding: [
    'subject is the flow and the user\'s goal; problem is what must get fixed; states lists the cases that must be designed, not just the happy path.',
    'sections.goal states the flow, the user\'s goal, and what currently goes wrong.',
  ],
  intelligence: [
    'Write the flow step by step. For each step: what the user sees, the one primary action, the secondary actions, the fields with their labels and validation, what happens on success, and what happens on each listed state. Cut any step that does not move the user towards the goal.',
    'sections.approach tells the AI to reduce the number of decisions per screen, to ask for information only when it is needed, to write error messages that say how to fix the problem, and to keep the primary action visible without scrolling.',
  ],
  controlExtra: ['Never specify a flow that hides a cost, pre-ticks a consent, or makes leaving hard. Labels stay outside the field, not as placeholder text only.'],
  deliveryExtra: ['sections.output must give, per step, the components, the copy for labels, buttons and errors, tap-target sizes, focus order, and the contrast requirement.'],
  examples: [{
    good: 'Step 2 Shipping: show the delivery cost before asking for the address (that is where people leave). One primary button "Continue". Error: "We do not deliver to this area yet — try another address or pick up from the shop."',
    bad: 'Make a clean modern beautiful checkout with a nice gradient, and add the shipping cost at the last step so the price looks lower.',
    why: 'The bad one is a vague brief and hides the cost until the end — the exact thing that was losing the customers.',
  }],
});

export const aiChatbot = makeBuildMission({
  id: 'ai-chatbot', title: c('AI chatbot', 'شات بوت AI'), topics: ['ai-chatbot', 'ai-agent'],
  intake: { question: c('Tell me what the bot should handle and where it will live.', 'قولّي البوت يتعامل مع إيه، وهيبقى فين.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A bot to answer my customers on WhatsApp', 'بوت يجاوب عملائي على واتساب'), c('A bot on my website that answers from my documents', 'بوت على موقعي يجاوب من ملفاتي'), c('A bot to take bookings', 'بوت ياخد حجوزات'), c('A bot to qualify leads', 'بوت يفرز العملاء المحتملين')] },
  slots: [
    product(c('What the bot handles', 'البوت بيتعامل مع إيه'), c('What should it handle, and what should it never try to answer?', 'يتعامل مع إيه، وإيه اللي عمره ما يحاول يجاوبه؟'), c('Answer delivery and price questions; never discuss refunds.', 'يجاوب أسئلة التوصيل والأسعار؛ ومينفعش يتكلم في الاسترجاع.'), { en: ['answer questions', 'take bookings', 'qualify leads', 'track orders', 'never refunds', 'never medical advice'], ar: ['يجاوب أسئلة', 'ياخد حجوزات', 'يفرز عملاء', 'يتابع أوردرات', 'مش الاسترجاع', 'مش نصايح طبية'] }),
    { id: 'knowledge', kind: 'longtext', layer: 'intelligence', importance: 'critical', maxLength: 1000,
      label: c('What it answers from', 'بيجاوب من إيه'), question: c('Where do the answers come from? (your prices, policies, documents, a website)', 'الردود جاية منين؟ (أسعارك، سياساتك، ملفاتك، موقع)'),
      why: c('A bot with no source of truth will invent answers.', 'البوت اللي ملوش مصدر معلومات هيألّف ردود.'),
      example: c('Our price list, delivery policy, and the FAQ page.', 'قايمة الأسعار، وسياسة التوصيل، وصفحة الأسئلة الشائعة.'),
      vocabulary: { en: ['price list', 'policy document', 'FAQ page', 'product catalogue', 'our website', 'a spreadsheet'], ar: ['قايمة أسعار', 'مستند سياسات', 'صفحة أسئلة شائعة', 'كتالوج منتجات', 'موقعنا', 'شيت'] } },
    users(c('Customers on WhatsApp, writing in Egyptian Arabic.', 'عملاء على واتساب بيكتبوا مصري.'), { en: ['customers', 'staff', 'on WhatsApp', 'on the website', 'in Arabic', 'in English', 'mixed languages'], ar: ['عملاء', 'موظفين', 'على واتساب', 'على الموقع', 'بالعربي', 'بالإنجليزي', 'لغتين مخلوطة'] }),
    { id: 'escalation', kind: 'text', layer: 'control', importance: 'important', maxLength: 400,
      label: c('When to hand over', 'إمتى يسلّم لإنسان'), question: c('When must it stop and pass the chat to a person?', 'إمتى لازم يوقف ويسلّم المحادثة لشخص؟'),
      why: c('A bot that never hands over will promise what you cannot deliver.', 'البوت اللي ما بيسلّمش هيوعد بحاجة مش هتقدر تنفذها.'),
      example: c('Complaints, refunds, discounts, or after two failed answers.', 'الشكاوى، والاسترجاع، والخصومات، أو بعد فشله مرتين.'),
      vocabulary: { en: ['complaints', 'refunds', 'discounts', 'angry customer', 'after two failed tries', 'anything legal'], ar: ['شكاوى', 'استرجاع', 'خصومات', 'عميل غضبان', 'بعد محاولتين فاشلتين', 'أي حاجة قانونية'] },
      noneLabel: c('Use the safe default', 'استخدم الافتراضي الآمن'),
      defaults: [{ value: 'none', reason: c('By default it hands over on complaints, refunds, discounts and after two failed answers.', 'افتراضياً بيسلّم في الشكاوى والاسترجاع والخصومات وبعد محاولتين فاشلتين.') }] },
  ],
  nameLabel: c('Bot / business name', 'اسم البوت أو البيزنس'), nameWhat: 'the bot or business name',
  avoidVocab: { en: ['answering outside the sources', 'pretending to be human', 'medical or legal advice', 'storing customer data it does not need', 'endless menus'], ar: ['الرد من غير المصادر', 'يدّعي إنه إنسان', 'نصايح طبية أو قانونية', 'تخزين بيانات مش محتاجها', 'قوايم لا نهائية'] },
  outlineKey: 'specOutline', outlineDesc: 'One line per conversation case: what the user says — what the bot does.', outlineWhat: 'one line per conversation case',
  outputDescription: c('A build prompt plus the bot\'s own instructions, the conversation cases, what you still need, and a checklist.', 'برومبت بناء مع تعليمات البوت نفسه، وحالات المحادثة، واللي لسه ناقص، وقائمة فحص.'),
  role: 'Senior conversational AI engineer, and a prompt engineer for AI builders.',
  understanding: [
    'subject sets the scope and the forbidden topics; knowledge is the only source of truth; escalation is the stop line; users sets the language and the channel.',
    'sections.goal states what the bot handles, where it lives, and what it must never answer.',
  ],
  intelligence: [
    'Give two things: the build spec (channel, how the sources are loaded and searched, the handover mechanism, what gets logged) and the bot\'s own system instruction (role, the facts it may state, voice, the three or four cases it will meet most, what to say when it does not know, and the handover rule).',
    'sections.approach tells the AI to answer only from the retrieved sources and to say plainly when the answer is not there, to keep replies to two or three lines on chat channels, and to confirm back any booking detail before saving it.',
  ],
  controlExtra: [
    'The bot must never answer from outside the provided sources, never invent prices, stock or dates, never claim to be human, and must hand over per escalation.',
    'It must not store or repeat a customer\'s personal data beyond what the task needs.',
  ],
  deliveryExtra: ['sections.output must include the bot\'s system instruction as a ready block, the handover trigger wording, and a short test set of 8–10 real questions to try before launch.'],
  examples: [{
    good: 'System instruction: "Answer only from the price list and delivery policy below. If the answer is not there, say so and offer to pass the message to a colleague. Never discuss refunds — hand over instead. Two short lines per reply." Plus 10 test questions.',
    bad: 'Build a friendly AI assistant that knows everything about the business and can answer any customer question, including refunds and medical questions, and sounds exactly like a real human agent.',
    why: 'The bad one has no source of truth, no handover, and asks the bot to pose as a human.',
  }],
});

export const databaseDesign = makeBuildMission({
  id: 'database-design', title: c('Database design', 'تصميم قاعدة بيانات'), topics: ['database-design'],
  intake: { question: c('Tell me what the system stores and what questions it must answer.', 'قولّي النظام بيخزّن إيه، ولازم يجاوب أنهي أسئلة.'), why: c('One message is enough. I only ask what is missing.', 'رسالة واحدة كفاية، وأسأل بس على الناقص.'),
    starters: [c('A database for my orders system', 'قاعدة بيانات لنظام الأوردرات'), c('Design the tables for a booking app', 'صمّم جداول تطبيق حجز'), c('My tables are a mess — redesign them', 'جداولي مبعزقة، أعِد تصميمها'), c('A schema for a multi-branch shop', 'سكيما لمحل بفروع')] },
  slots: [
    product(c('What the system does', 'النظام بيعمل إيه'), c('What does the system do, and what does it store?', 'النظام بيعمل إيه، وبيخزّن إيه؟'), c('Takes orders for a shop with three branches and tracks stock per branch.', 'بياخد أوردرات لمحل بتلات فروع، وبيتابع المخزون لكل فرع.'), { en: ['orders', 'bookings', 'users', 'products', 'stock', 'multi-branch', 'subscriptions', 'invoices'], ar: ['أوردرات', 'حجوزات', 'مستخدمين', 'منتجات', 'مخزون', 'فروع', 'اشتراكات', 'فواتير'] }),
    { id: 'questions', kind: 'longtext', layer: 'intelligence', importance: 'critical', maxLength: 800,
      label: c('Questions it must answer', 'أسئلة لازم يجاوبها'), question: c('What must you be able to query? (reports, lookups, totals)', 'لازم تعرف تسأل إيه؟ (تقارير، استعلامات، إجماليات)'),
      why: c('The schema is designed from the questions it must answer.', 'السكيما بتتصمم من الأسئلة اللي لازم تجاوبها.'),
      example: c('Revenue per branch per month, stock left per product, repeat customers.', 'إيرادات كل فرع في الشهر، والمخزون المتبقي لكل منتج، والعملاء المتكررين.'),
      vocabulary: { en: ['revenue per month', 'stock left', 'top products', 'repeat customers', 'who owes what', 'per branch'], ar: ['إيرادات الشهر', 'المخزون المتبقي', 'أكتر المنتجات', 'عملاء متكررين', 'مين عليه إيه', 'لكل فرع'] } },
    { id: 'db', kind: 'single', layer: 'delivery', importance: 'nice',
      label: c('Database', 'قاعدة البيانات'), question: c('Which database?', 'أنهي قاعدة بيانات؟'),
      why: c('The types and the syntax differ.', 'الأنواع والصياغة بتختلف.'), example: c('PostgreSQL.', 'PostgreSQL.'),
      options: [
        { value: 'postgres', label: c('PostgreSQL / Supabase', 'PostgreSQL / Supabase'), keywords: ['postgres', 'supabase', 'بوستجرس'] },
        { value: 'mysql', label: c('MySQL / MariaDB', 'MySQL / MariaDB'), keywords: ['mysql', 'mariadb', 'ماي سيكوال'] },
        { value: 'sqlite', label: c('SQLite', 'SQLite'), keywords: ['sqlite'] },
        { value: 'firestore', label: c('Firestore / document store', 'Firestore / مستندات'), keywords: ['firestore', 'mongo', 'nosql'] },
      ],
      defaults: [{ value: 'postgres', reason: c('PostgreSQL is the safest default and it is what Supabase runs.', 'PostgreSQL أأمن افتراضي، وهي اللي Supabase شغالة بيها.') }] },
    { id: 'scale', kind: 'single', layer: 'intelligence', importance: 'nice',
      label: c('Size', 'الحجم'), question: c('Roughly how many records a month?', 'تقريباً كام سجل في الشهر؟'),
      why: c('Size decides indexes and whether to split tables.', 'الحجم بيحدد الفهارس وتقسيم الجداول.'), example: c('A few thousand.', 'بضع آلاف.'),
      options: [
        { value: 'small', label: c('Under 1,000', 'أقل من ١٠٠٠'), keywords: ['small', 'قليل'] },
        { value: 'medium', label: c('1,000–100,000', '١٠٠٠–١٠٠ ألف'), keywords: ['medium', 'متوسط'] },
        { value: 'large', label: c('More than 100,000', 'أكتر من ١٠٠ ألف'), keywords: ['large', 'كبير'] },
      ],
      defaults: [{ value: 'medium', reason: c('Medium size is where most business systems sit.', 'الحجم المتوسط هو مكان أغلب أنظمة الشغل.') }] },
  ],
  nameLabel: c('System / business name', 'اسم النظام أو البيزنس'), nameWhat: 'the system or business name',
  avoidVocab: { en: ['storing money as a float', 'one giant table', 'repeating the same data in several tables', 'deleting rows permanently', 'no timestamps', 'storing secrets in plain text'], ar: ['تخزين الفلوس كـfloat', 'جدول واحد ضخم', 'تكرار نفس الداتا في جداول', 'حذف نهائي للسجلات', 'مفيش تواريخ', 'تخزين أسرار كنص'] },
  outlineKey: 'specOutline', outlineDesc: 'One line per table: name — its columns — what it is for.', outlineWhat: 'one line per table',
  outputDescription: c('A prompt that produces the schema, the tables, the queries for your questions, and a checklist.', 'برومبت يطلّع السكيما، والجداول، والاستعلامات لأسئلتك، وقائمة فحص.'),
  role: 'Senior database engineer, and a prompt engineer for chat AIs.',
  understanding: [
    'subject is what the system does; questions is what the schema must be able to answer; db and scale set the types, indexes and syntax.',
    'sections.goal states the system, the data it keeps, and the questions the schema must answer.',
  ],
  intelligence: [
    'Give the tables with columns, types, nullability, keys and relations; then the indexes justified by the listed questions; then one query per question; then the constraints that keep the data honest (unique keys, checks, foreign keys with the right delete behaviour).',
    'sections.approach tells the AI to normalise first and denormalise only with a stated reason, to store money in a decimal or integer minor unit, to use timestamps with time zone, to keep soft-delete and audit columns, and to put a surrogate key on every table.',
  ],
  controlExtra: ['Never invent business rules. Where a rule is unclear, state the assumption as [to confirm]. Never put secrets, tokens or card numbers in a table.'],
  deliveryExtra: ['sections.output must give runnable DDL for the chosen database, the index statements, one query per question, and a short migration note for an existing system.'],
  examples: [{
    good: 'orders(id, branch_id FK, customer_id FK, total_minor INTEGER, status, created_at TIMESTAMPTZ, deleted_at). Index on (branch_id, created_at) for revenue per branch per month. Query per question listed below.',
    bad: 'One table with 60 columns including price as a float, customer name repeated on every row, and a card number column. Delete old rows monthly to keep it fast.',
    why: 'The bad one loses money to float rounding, stores a card number, and destroys history.',
  }],
});

export const debugging = makeBuildMission({
  id: 'debugging', title: c('Debug an error', 'ظبّط مشكلة في الكود'), topics: ['debugging'],
  questionBudget: 2,
  intake: { question: c('Tell me what breaks, what you expected, and the error if you have it.', 'قولّي إيه اللي بايظ، وكنت متوقع إيه، والخطأ لو عندك.'), why: c('I build the prompt so the AI debugs properly instead of guessing a rewrite.', 'هبني البرومبت بشكل يخلي الـ AI يحلّل صح بدل ما يخمّن ويعيد كتابة كل حاجة.'),
    starters: [c('My code gives an error I do not understand', 'الكود بيطلّع خطأ مش فاهمه'), c('It works locally but not live', 'شغال عندي ومش شغال لايف'), c('The page is blank', 'الصفحة بتطلع فاضية'), c('It was working yesterday', 'كان شغال إمبارح')] },
  slots: [
    product(c('What breaks', 'إيه اللي بايظ'), c('What were you doing, what happened, and what did you expect instead?', 'كنت بتعمل إيه، وحصل إيه، وكنت متوقع إيه؟'), c('Saving a form returns 500; I expected the record to save.', 'حفظ الفورم بيرجّع 500؛ كنت متوقع السجل يتحفظ.'), { en: ['error on save', 'blank page', 'crash on open', 'wrong result', 'slow', 'works locally only', 'started yesterday'], ar: ['خطأ عند الحفظ', 'صفحة فاضية', 'بيقفل عند الفتح', 'نتيجة غلط', 'بطيء', 'شغال محلي بس', 'بدأ إمبارح'] }),
    facts('evidence', c('The error and the setup', 'الخطأ والبيئة'), c('Paste the exact error text, and say the language, framework and where it runs.', 'الصق نص الخطأ بالظبط، وقول اللغة والفريم ورك وبيشتغل فين.'), c('"TypeError: cannot read property id of undefined", React 18, Vite, in the browser.', '"TypeError: cannot read property id of undefined"، React 18، Vite، في البراوزر.')),
    { id: 'changed', kind: 'text', layer: 'understanding', importance: 'nice', maxLength: 400,
      label: c('What changed', 'إيه اللي اتغيّر'), question: c('What changed just before it broke?', 'إيه اللي اتغيّر قبل ما يبوظ بشوية؟'),
      why: c('What changed last is usually the cause.', 'آخر حاجة اتغيّرت هي السبب غالباً.'),
      example: c('I updated a package and added a new field.', 'حدّثت مكتبة وضفت حقل جديد.'),
      vocabulary: { en: ['updated a package', 'changed the database', 'deployed', 'added a field', 'nothing changed'], ar: ['حدّثت مكتبة', 'غيّرت الداتابيز', 'نزّلت نسخة', 'ضفت حقل', 'مفيش حاجة اتغيّرت'] },
      noneLabel: c('Nothing that I know of', 'مش عارف حاجة'),
      defaults: [{ value: 'none', reason: c('Then the prompt asks the AI to find the change from the error itself.', 'يبقى البرومبت هيخلي الـ AI يستنتج التغيير من الخطأ نفسه.') }] },
  ],
  nameLabel: c('Project name', 'اسم المشروع'), nameWhat: 'the project name',
  avoidVocab: { en: ['rewriting the whole file', 'changing the stack', 'guessing without reading the error', 'silencing the error', 'installing random packages'], ar: ['إعادة كتابة الملف كله', 'تغيير التقنيات', 'تخمين من غير قراءة الخطأ', 'إخفاء الخطأ', 'تنزيل مكتبات عشوائية'] },
  outlineKey: 'specOutline', outlineDesc: 'One line per step of the diagnosis, in order.', outlineWhat: 'one line per diagnosis step',
  outputDescription: c('A debugging prompt that diagnoses before it changes anything, the steps, what to paste, and a checklist.', 'برومبت تشخيص قبل أي تعديل، والخطوات، وإيه اللي تلزقه، وقائمة فحص.'),
  role: 'Senior engineer who debugs other people\'s code daily, and a prompt engineer for chat AIs.',
  understanding: [
    'subject is the symptom and the expectation; evidence carries the exact error and the stack; changed is the first suspect.',
    'sections.goal states what breaks, what was expected, the environment, and the exact error text.',
  ],
  intelligence: [
    'The prompt must force a diagnosis before a fix: read the error and name what it literally says, list the two or three most likely causes ranked, say what single piece of code or output would confirm each, and only then propose the smallest change that fixes the confirmed cause.',
    'sections.approach tells the AI to ask for the specific file or log it needs rather than guessing, to change one thing at a time, and to explain why the fix works so the user can spot the pattern next time.',
  ],
  controlExtra: ['Never rewrite files that are not involved, never change the stack or add a dependency to avoid the bug, and never hide the error with a try/catch that swallows it.'],
  deliveryExtra: [
    'prompt must end with a clearly marked paste block: a line of >>> then "PASTE THE ERROR, THE FILE AND HOW IT RUNS BELOW" then a line of <<<.',
    'sections.output must require: the diagnosis, the ranked causes, the confirming check, the minimal fix as a diff, and how to verify it is fixed.',
  ],
  examples: [{
    good: 'Step 1: the error says a property was read on undefined — name the exact line. Step 2: rank causes (the fetch returned nothing / the new field is missing on old rows / a race on first render) and say what confirms each. Step 3: smallest fix, as a diff.',
    bad: 'The code is probably broken, so rewrite the whole component in a different framework and wrap everything in try/catch so the error goes away.',
    why: 'The bad one never reads the error, changes the stack, and hides the failure instead of fixing it.',
  }],
});

export const techBlueprints = [websiteBuild, webApp, mobileApp, uiUx, aiChatbot, databaseDesign, debugging];
