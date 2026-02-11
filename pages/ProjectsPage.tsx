import React, { useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

const ProjectsPage: React.FC = () => {
  const { lang } = useLanguage();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const projects = [
    {
      id: "pick",
      title: "Pick.",
      subtitle: { en: "Operational Intelligence Platform", ar: "منصة ذكاء العمليات" },
      description: { 
        en: "Our flagship product designed to unify digital observability and performance monitoring into a single, cohesive experience.",
        ar: "منتجنا الرائد المصمم لتوحيد المراقبة الرقمية وتتبع الأداء في تجربة واحدة متماسكة."
      },
      image: "input_file_2.png",
      tag: "Proprietary Product"
    },
    {
      id: "aero",
      title: "Aero Runner",
      subtitle: { en: "High-Speed Mobile Experience", ar: "تجربة موبايل عالية السرعة" },
      description: { 
        en: "An in-house high-performance mobile game demonstrating our expertise in real-time engine optimization and immersive UX.",
        ar: "لعبة موبايل داخلية عالية الأداء توضح خبرتنا في تحسين المحركات في الوقت الفعلي وتجربة المستخدم الغامرة."
      },
      image: "input_file_0.png",
      tag: "In-House Studio"
    }
  ];

  return (
    <div className="bg-navy min-h-screen text-white pt-40 pb-20 selection:bg-gold selection:text-black">
      
      <section className="max-w-7xl mx-auto px-6 mb-32 reveal">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-gold text-[10px] font-black uppercase tracking-[0.3em] mb-10">
          <Sparkles size={14} fill="currentColor" />
          <span>{lang === 'en' ? 'Portfolio' : 'المعرض'}</span>
        </div>
        <h1 className="text-7xl md:text-[10rem] font-black mb-12 tracking-tighter leading-[0.85]">
          {lang === 'en' ? <>The <span className="text-gold">Portfolio.</span></> : <>معرض <span className="text-gold">المشاريع.</span></>}
        </h1>
        <p className="text-2xl md:text-3xl text-mutedGray tracking-tight max-w-2xl font-medium">
          {lang === 'en' 
            ? "A showcase of products engineered to outperform. Detailed case studies coming soon." 
            : "معرض للمنتجات التي تم هندستها لتتفوق. دراسات الحالة التفصيلية ستتوفر قريباً."}
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 space-y-32">
        {projects.map((proj, idx) => (
          <div key={proj.id} className={`flex flex-col lg:flex-row items-center gap-16 reveal ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
            <div className="lg:w-1/2">
              <span className="text-gold font-black text-[10px] uppercase tracking-[0.5em] mb-4 block">
                {proj.tag}
              </span>
              <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter">
                {proj.title}
              </h2>
              <h3 className="text-xl md:text-2xl text-white font-bold mb-8 uppercase tracking-widest opacity-60">
                {lang === 'en' ? proj.subtitle.en : proj.subtitle.ar}
              </h3>
              <p className="text-xl md:text-2xl text-mutedGray leading-relaxed mb-12">
                {lang === 'en' ? proj.description.en : proj.description.ar}
              </p>
              <button className="group flex items-center gap-4 text-white font-black uppercase tracking-[0.3em] text-sm border-b border-gold pb-2 transition-all hover:text-gold">
                {lang === 'en' ? "Full Case Study" : "دراسة الحالة الكاملة"}
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform rtl:rotate-180" />
              </button>
            </div>
            <div className="lg:w-1/2 relative group">
              <div className="absolute inset-0 bg-gold/5 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative aspect-[16/10] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-3xl bg-black">
                <img 
                  src={proj.image} 
                  alt={proj.title} 
                  className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-60 py-40 bg-white/[0.02] border-t border-white/5 reveal">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">
            {lang === 'en' ? "Partner with LookersHub" : "شارك لوكرز هب"}
          </h2>
          <p className="text-xl md:text-2xl text-mutedGray max-w-2xl mx-auto mb-16">
            {lang === 'en' 
              ? "We work with visionaries, startups, and enterprises to build the next generation of digital products." 
              : "نحن نعمل مع المبتكرين والشركات الناشئة والمؤسسات لبناء الجيل القادم من المنتجات الرقمية."}
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-8">
            <div className="p-8 rounded-3xl bg-navy border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <ExternalLink size={20} />
              </div>
              <span className="font-bold tracking-tight">Active Operations</span>
            </div>
            <div className="p-8 rounded-3xl bg-navy border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <ExternalLink size={20} />
              </div>
              <span className="font-bold tracking-tight">Enterprise Scale</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ProjectsPage;