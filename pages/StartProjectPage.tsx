import React from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import ProjectRequestForm from "../components/ProjectRequestForm";
export default function StartProjectPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [params] = useSearchParams();
  const demo = params.get("product") === "hera";
  const location = useLocation();
  return (
    <div className="site-page site-container">
      <div className="contact-layout">
        <header className="page-heading page-heading--start">
          <p className="site-eyebrow">
            {demo ? "HERA SYSTEM ERP" : "LOOKERSHUB / LET’S BUILD"}
          </p>
          <h1>
            {demo
              ? ar
                ? "شوف HERA بنفسك."
                : "Meet HERA in action."
              : ar
                ? "خلّي فكرتك مشروع."
                : "Let’s build your next chapter."}
          </h1>
          <p>
            {demo
              ? ar
                ? "احكيلنا عن نشاط شركتك واحتياجاتك، واطلب عرضًا توضيحيًا للنظام."
                : "Tell us about your business and needs, and request a guided system demonstration."
              : ar
                ? "ابدأ بوصف بسيط. هنناقش معاك النطاق والخطوات المناسبة."
                : "Start with a simple brief. We’ll discuss the scope and the right next steps with you."}
          </p>
          <ol className="process-list">
            {(ar
              ? [
                  "احكيلنا عن احتياجك",
                  "نناقش النطاق المناسب",
                  "نرتّب الخطوة التالية",
                ]
              : [
                  "Tell us what you need",
                  "Discuss the right scope",
                  "Plan the next step",
                ]
            ).map((s, i) => (
              <li key={s}>
                <span>0{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </header>
        <ProjectRequestForm key={location.search} />
      </div>
    </div>
  );
}
