import React, { useEffect, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Send, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

const StartProjectPage: React.FC = () => {
  const { lang } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const content = {
    en: {
      headline: <>Let's <span className="text-gold">Build.</span></>,
      subtext: "Turn your idea into a high-performance product. Fill out the brief below and our team will analyze your project's potential.",
      labels: {
        name: "Full Name",
        email: "Work Email",
        service: "Primary Need",
        budget: "Estimated Budget",
        details: "Project Brief",
        button: "Submit Brief"
      },
      services: ["App & Game Dev", "Product Operations", "Marketing & Growth", "Strategy & UX Thinking"],
      budgets: ["$10k - $50k", "$50k - $150k", "$150k+", "Undetermined"],
      success: "Your brief has been observed. We will be in touch within 24 hours."
    },
    ar: {
      headline: <>لنقم <span className="text-gold">بالبناء.</span></>,
      subtext: "حوّل فكرتك إلى منتج عالي الأداء. املأ النموذج أدناه وسيقوم فريقنا بتحليل إمكانيات مشروعك.",
      labels: {
        name: "الاسم الكامل",
        email: "البريد الإلكتروني للعمل",
        service: "الحاجة الأساسية",
        budget: "الميزانية التقديرية",
        details: "نبذة عن المشروع",
        button: "إرسال النموذج"
      },
      services: ["تطوير التطبيقات والألعاب", "عمليات المنتج", "التسويق والنمو", "الاستراتيجية وتفكير UX"],
      budgets: ["10$ آلاف - 50$ ألف", "50$ ألف - 150$ ألف", "+150$ ألف", "غير محدد"],
      success: "تم استلام طلبك. سنتواصل معك خلال 24 ساعة."
    }
  };

  const active = content[lang];

  if (submitted) {
    return (
      <div className="bg-navy min-h-screen flex items-center justify-center px-6">
        <div className="text-center reveal active">
          <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center text-gold mx-auto mb-10">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-5xl font-black mb-6 tracking-tighter uppercase">{lang === 'en' ? 'Observed.' : 'تم الاستلام.'}</h2>
          <p className="text-2xl text-mutedGray mb-12 max-w-md mx-auto">{active.success}</p>
          <button 
            onClick={() => window.location.href = '/'} 
            className="text-gold font-black uppercase tracking-[0.3em] flex items-center gap-3 mx-auto group"
          >
            {lang === 'en' ? 'Return Home' : 'العودة للرئيسية'}
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform rtl:rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy min-h-screen text-white pt-40 pb-32 selection:bg-gold selection:text-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-20">
          
          <div className="lg:col-span-5 reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5 text-gold text-[10px] font-black uppercase tracking-[0.3em] mb-10">
              <Sparkles size={14} fill="currentColor" />
              <span>Initiate</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-black mb-10 tracking-tighter leading-[0.85]">
              {active.headline}
            </h1>
            <p className="text-2xl md:text-3xl text-mutedGray font-medium leading-tight tracking-tight mb-12">
              {active.subtext}
            </p>
            
            <div className="space-y-8 opacity-40 hidden lg:block">
              <div className="flex items-center gap-6">
                <div className="w-1 h-1 bg-gold rounded-full"></div>
                <span className="text-xs font-black uppercase tracking-widest">Observe the opportunity</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-1 h-1 bg-gold rounded-full"></div>
                <span className="text-xs font-black uppercase tracking-widest">Analyze the ecosystem</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-1 h-1 bg-gold rounded-full"></div>
                <span className="text-xs font-black uppercase tracking-widest">Execute with precision</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 reveal" style={{ transitionDelay: '200ms' }}>
            <form onSubmit={handleSubmit} className="p-12 md:p-16 rounded-[4rem] bg-white/[0.02] border border-white/5 shadow-3xl space-y-10">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-mutedGray ml-1 block">{active.labels.name}</label>
                  <input required type="text" className="w-full bg-navy border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-gold transition-all text-lg font-bold" />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-mutedGray ml-1 block">{active.labels.email}</label>
                  <input required type="email" className="w-full bg-navy border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-gold transition-all text-lg font-bold" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-mutedGray ml-1 block">{active.labels.service}</label>
                  <select className="w-full bg-navy border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-gold transition-all text-lg font-bold appearance-none">
                    {active.services.map(s => <option key={s} className="bg-navy">{s}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-mutedGray ml-1 block">{active.labels.budget}</label>
                  <select className="w-full bg-navy border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:border-gold transition-all text-lg font-bold appearance-none">
                    {active.budgets.map(b => <option key={b} className="bg-navy">{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-mutedGray ml-1 block">{active.labels.details}</label>
                <textarea required rows={5} className="w-full bg-navy border border-white/10 rounded-3xl px-6 py-5 focus:outline-none focus:border-gold transition-all text-lg font-bold resize-none" />
              </div>

              <button 
                type="submit"
                className="w-full py-7 rounded-[2.5rem] bg-gold text-black font-black text-xl md:text-2xl uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-gold/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
              >
                {active.labels.button}
                <Send size={24} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StartProjectPage;