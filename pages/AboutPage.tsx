import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
export default function AboutPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const values = ar
    ? [
        ["نلاحظ", "نبدأ بفهم الفكرة والتفاصيل واحتياج الناس."],
        ["نخطط", "نحوّل الفهم إلى نطاق واضح وأولويات قابلة للتنفيذ."],
        ["نبني", "نطوّر المنتج أو النظام أو التجربة المناسبة."],
        ["نطوّر", "نراجع اللي اتعمل ونحدد الخطوة التالية."],
      ]
    : [
        ["Observe", "Understand the idea, the details, and what people need."],
        [
          "Plan",
          "Turn understanding into a clear scope and practical priorities.",
        ],
        ["Build", "Create the right product, system or experience."],
        ["Improve", "Review the work and shape what comes next."],
      ];
  return (
    <div className="site-page site-container">
      <header className="page-heading">
        <p className="site-eyebrow">ABOUT LOOKERSHUB</p>
        <h1>{ar ? "نرى ما وراء الفكرة." : "We see beyond the idea."}</h1>
        <p>
          {ar
            ? "نحن لوكرز؛ نلاحظ التفاصيل، ونربط الأفكار، ونحوّل الرؤية إلى خطوات ومنتجات وتجارب رقمية."
            : "We are the Lookers. We notice details, connect ideas, and turn a different perspective into digital products and experiences."}
        </p>
      </header>
      <section className="glass-panel about-story">
        <h2>{ar ? "من الفكرة للنمو" : "From idea to growth"}</h2>
        <p className="lead">
          {ar
            ? "يجمع شغلنا بين تطوير التطبيقات والألعاب، والاستراتيجية، وأنظمة الأعمال، والتسويق. بنشتغل على منتجاتنا الخاصة، وبنساعد الشركات تختار وتنفّذ الحل المناسب لمرحلتها."
            : "Our work brings together apps and games, strategy, business systems and marketing. We develop our own products and help companies find and execute the right approach for their next stage."}
        </p>
        <Link className="text-link" to="/services">
          {ar ? "استكشف خدماتنا" : "Explore our services"} ↗
        </Link>
      </section>
      <section className="site-section">
        <div className="section-heading">
          <h2>{ar ? "طريقة شغلنا" : "How we work"}</h2>
        </div>
        <div className="home-service-grid">
          {values.map(([title, desc], i) => (
            <article className="home-service glass-panel" key={title}>
              <span className="site-eyebrow">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="home-closing">
        <Link className="site-button" to="/start-your-project">
          {ar ? "خلينا نبني فكرتك" : "Let’s build your idea"} ↗
        </Link>
      </div>
    </div>
  );
}
