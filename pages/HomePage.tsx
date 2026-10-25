import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { services } from "../data/services";
import { ProductGrid, ClientGrid } from "../components/Portfolio";
export default function HomePage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <div className="home-page">
      <section className="home-hero site-container">
        <p className="site-eyebrow">LOOKERSHUB · WE SEE DIFFERENTLY</p>
        <h1>
          {ar ? (
            <>
              رؤية مختلفة.
              <br />
              <em>وإمكانيات أبعد.</em>
            </>
          ) : (
            <>
              A different vision.
              <br />
              <em>A wider universe.</em>
            </>
          )}
        </h1>
        <p>
          {ar
            ? "نحوّل الأفكار إلى منتجات رقمية، ونطوّر الأنظمة والتجارب والتسويق الذي يساعدها على النمو."
            : "We turn ideas into digital products, and shape the systems, experiences and marketing that help them grow."}
        </p>
        <div className="button-row">
          <Link className="site-button" to="/start-your-project">
            {ar ? "ابدأ مشروعك" : "Start your project"}
            <ArrowUpRight size={18} />
          </Link>
          <Link className="site-button site-button--outline" to="/projects">
            {ar ? "اكتشف أعمالنا" : "Explore our work"}
          </Link>
        </div>
        <span className="hero-footnote">
          {ar
            ? "منتجات رقمية · أنظمة أعمال · تسويق ونمو"
            : "DIGITAL PRODUCTS · BUSINESS SYSTEMS · MARKETING & GROWTH"}
        </span>
      </section>
      <section className="site-section site-container">
        <div className="section-heading">
          <p className="site-eyebrow">
            {ar ? "من الفكرة إلى التنفيذ" : "FROM IDEA TO EXECUTION"}
          </p>
          <h2>
            {ar ? "مسارات مختلفة. رؤية واحدة." : "Different paths. One vision."}
          </h2>
          <p>
            {ar
              ? "نبدأ باحتياجك، ونحدد معاك الخدمة والمسار المناسبين."
              : "We start with your needs and shape the right service and path forward."}
          </p>
        </div>
        <div className="home-service-grid">
          {services.map((s, i) => (
            <Link
              className="home-service glass-panel"
              key={s.id}
              to={`/services?service=${s.id}`}
            >
              <span className="site-eyebrow">0{i + 1}</span>
              <h3>{s.title[lang]}</h3>
              <p>{s.description[lang]}</p>
              <span className="text-link">
                {ar ? "اكتشف الخدمة" : "Explore service"}
                <ArrowUpRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="site-section site-container">
        <div className="section-heading section-heading--row">
          <div>
            <p className="site-eyebrow">
              {ar ? "منتجات لوكرز" : "THE LOOKERS COLLECTION"}
            </p>
            <h2>{ar ? "اللي بنبنيه." : "What we’re building."}</h2>
          </div>
          <Link className="text-link" to="/projects">
            {ar ? "كل المشروعات" : "All projects"}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <ProductGrid />
      </section>
      <section className="site-section site-container">
        <div className="ai-callout glass-panel">
          <Sparkles className="text-gold" size={30} />
          <p className="site-eyebrow">LOOKERS AI</p>
          <h2>
            {ar
              ? "فكرتك واضحة. والـ Prompt جاهز."
              : "Your idea. A clearer prompt."}
          </h2>
          <p>
            {ar
              ? "محادثة مركزة تساعدك تحوّل فكرتك إلى Prompt جاهز للاستخدام مع أدوات الذكاء الاصطناعي."
              : "A focused conversation that helps turn your idea into a prompt ready for your AI tools."}
          </p>
          <Link className="site-button site-button--outline" to="/lookers-ai">
            {ar ? "جرّب Lookers AI" : "Explore Lookers AI"}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="site-section site-container">
        <div className="section-heading">
          <p className="site-eyebrow">
            {ar ? "أعمال التسويق" : "MARKETING WORK"}
          </p>
          <h2>
            {ar ? "شركات اشتغلنا معاها" : "Companies we have worked with"}
          </h2>
        </div>
        <ClientGrid />
      </section>
      <section className="site-section site-container home-closing">
        <p className="site-eyebrow">
          {ar ? "الخطوة اللي جاية" : "YOUR NEXT STEP"}
        </p>
        <h2>
          {ar ? "عندك فكرة؟ نبدأ من هنا." : "Something in mind? Start here."}
        </h2>
        <div className="button-row">
          <Link className="site-button" to="/start-your-project">
            {ar ? "ابدأ مشروعك" : "Start your project"}
            <ArrowUpRight size={18} />
          </Link>
          <Link className="text-link" to="/contact">
            {ar ? "تواصل معانا" : "Get in touch"}
          </Link>
        </div>
      </section>
    </div>
  );
}
