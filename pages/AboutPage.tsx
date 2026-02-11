import React, { useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import { Eye, Shield, Target, Compass, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
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

  const content = {
    en: {
      tag: "Our Story",
      headline: <>Beyond <span className="text-gold">Conventional</span> Vision.</>,
      description: "LookersHub is a digital solutions and marketing company focused on building scalable products and growth-driven strategies. We combine brand marketing, digital marketing, custom software development, and business analytics to help companies design, build, and grow with clarity.",
      mission: "Our work connects technology, data, and strategy to deliver practical solutions that create measurable impact and long-term value.",
      philosophyTitle: "The Looker Philosophy",
      philosophyText: "Being a Looker means observing deeply, understanding patterns, and turning insight into action. We don't just see the product; we see the ecosystem it lives in.",
      values: [
        { icon: <Eye />, title: "Observation", text: "We track details that others miss to find hidden opportunities." },
        { icon: <Target />, title: "Precision", text: "Every pixel and line of code is engineered for specific impact." },
        { icon: <Shield />, title: "Trust", text: "We operate as an extension of your team, with absolute transparency." }
      ]
    },
    ar: {
      tag: "قصتنا",
      headline: <>أبعد من <span className="text-gold">الرؤية</span> التقليدية.</>,
      description: "لوكرز هب هي شركة حلول رقمية وتسويق تركز على بناء منتجات قابلة للتوسع واستراتيجيات نمو ذكية. نحن نجمع بين تسويق العلامة التجارية، التسويق الرقمي، تطوير البرمجيات المخصصة، وتحليلات الأعمال لمساعدة الشركات على التصميم والبناء والنمو بوضوح.",
      mission: "عملنا يربط بين التكنولوجيا والبيانات والاستراتيجية لتقديم حلول عملية تخلق تأثيراً قابلاً للقياس وقيمة طويلة المدى.",
      philosophyTitle: "فلسفة لوكر",
      philosophyText: "كونك «لوكر» لا يعني أنك تشاهد فقط، بل أنك تلاحظ، تفهم، وتربط النقاط. نحن لا نرى المنتج فحسب؛ بل نرى النظام البيئي الذي يعيش فيه.",
      values: [
        { icon: <Eye />, title: "الملاحظة", text: "نحن نتتبع التفاصيل التي يغفل عنها الآخرون للعثور على الفرص المخفية." },
        { icon: <Target />, title: "الدقة", text: "كل بكسل وسطر من البرمجيات تم هندسته لتأثير محدد." },
        { icon: <Shield />, title: "الثقة", text: "نحن نعمل كجزء من فريقك، بشفافية مطلقة." }
      ]
    }
  };

  const active = content[lang];

  return (
    <div className="bg-navy min-h-screen text-white pt-40 pb-20 selection:bg-gold selection:text-black">
      
      {/* 1) HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 mb-32 reveal">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-gold text-[10px] font-black uppercase tracking-[0.3em] mb-10">
          <Sparkles size={14} fill="currentColor" />
          <span>{active.tag}</span>
        </div>
        <h1 className="text-7xl md:text-[10rem] font-black mb-12 tracking-tighter leading-[0.85]">
          {active.headline}
        </h1>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <p className="text-2xl md:text-4xl text-white font-medium leading-tight tracking-tight">
            {active.description}
          </p>
          <p className="text-xl md:text-2xl text-mutedGray leading-relaxed italic">
            {active.mission}
          </p>
        </div>
      </section>

      {/* 2) IMAGE BREAK */}
      <section className="px-6 mb-40 reveal">
        <div className="max-w-7xl mx-auto h-[40vh] md:h-[60vh] rounded-[3.5rem] overflow-hidden border border-white/5 relative group">
          <img 
            src="input_file_1.png" 
            alt="LookersHub Workspace" 
            className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-navy/20"></div>
        </div>
      </section>

      {/* 3) PHILOSOPHY & VALUES */}
      <section className="max-w-7xl mx-auto px-6 mb-40">
        <div className="text-center mb-24 reveal">
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">{active.philosophyTitle}</h2>
          <p className="text-xl md:text-2xl text-mutedGray max-w-3xl mx-auto">{active.philosophyText}</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {active.values.map((val, idx) => (
            <div key={idx} className="p-12 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:border-gold/20 transition-all group reveal" style={{ transitionDelay: `${idx * 150}ms` }}>
              <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center text-gold mb-8 group-hover:scale-110 transition-transform">
                {val.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{val.title}</h3>
              <p className="text-mutedGray font-medium leading-relaxed">{val.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4) CTA */}
      <section className="max-w-7xl mx-auto px-6 text-center py-20 reveal">
        <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">
          {lang === 'en' ? "Ready to see what's next?" : "هل أنت مستعد لرؤية ما هو قادم؟"}
        </h2>
        <Link 
          to="/services"
          className="group inline-flex items-center gap-4 px-12 py-6 bg-gold text-black rounded-3xl font-black text-xl uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-gold/20"
        >
          {lang === 'en' ? "Explore Services" : "استكشف خدماتنا"}
          <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform rtl:rotate-180" />
        </Link>
      </section>

    </div>
  );
};

export default AboutPage;