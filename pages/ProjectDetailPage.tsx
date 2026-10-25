import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, MessageCircle } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { products, whatsappUrl } from "../data/site";
export default function ProjectDetailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const product = products.find((p) => p.id === id);
  if (!product)
    return (
      <div className="site-page site-container">
        <h1>{ar ? "المشروع غير موجود" : "Project not found"}</h1>
        <Link className="site-button" to="/projects">
          {ar ? "كل المشروعات" : "All projects"}
        </Link>
      </div>
    );
  const hera = product.id === "hera";
  return (
    <div className="site-page site-container">
      <Link className="back-link" to="/projects">
        {ar ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}{" "}
        {ar ? "كل المشروعات" : "All projects"}
      </Link>
      <article className="project-detail glass-panel">
        <div className="project-detail__visual">
          <img src={product.image} alt={product.title} />
          {product.concept && (
            <small>
              {ar
                ? "صورة تشويقية مؤقتة — ليست لقطة من المنتج"
                : "Temporary concept artwork — not a product screenshot"}
            </small>
          )}
        </div>
        <div className="project-detail__copy">
          <p className="site-eyebrow">
            {product.status === "available"
              ? ar
                ? "متاح الآن"
                : "Available now"
              : ar
                ? "تحت الإنشاء"
                : "In development"}
          </p>
          <h1 dir="ltr">{product.title}</h1>
          <p className="lead">{product.description[lang]}</p>
          <ul className="detail-list">
            {product.details.map((d) => (
              <li key={d.en}>
                <Check size={18} />
                {d[lang]}
              </li>
            ))}
          </ul>
          {hera ? (
            <>
              <Link
                className="site-button"
                to="/start-your-project?product=hera"
              >
                {ar ? "اطلب ديمو HERA" : "Request a HERA demo"}{" "}
                <ArrowUpRightIcon />
              </Link>
              <a
                className="text-link"
                href={whatsappUrl(
                  ar
                    ? "أهلاً LookersHub، حابب أعرف تفاصيل HERA SYSTEM ERP وأطلب ديمو لشركتي."
                    : "Hello LookersHub, I would like to learn about HERA SYSTEM ERP and request a demo for my company.",
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} />
                {ar ? "اسألنا على واتساب" : "Ask us on WhatsApp"}
              </a>
            </>
          ) : (
            <Link className="site-button site-button--outline" to="/contact">
              {ar ? "تواصل لمعرفة المزيد" : "Talk to us about this project"}
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <span aria-hidden="true">↗</span>;
}
