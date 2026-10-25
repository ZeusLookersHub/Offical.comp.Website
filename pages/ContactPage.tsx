import React from "react";
import Contact from "../components/Contact";
import { useLanguage } from "../LanguageContext";
export default function ContactPage() {
  const { lang } = useLanguage();
  return (
    <div className="site-page site-container">
      <header className="page-heading">
        <p className="site-eyebrow">LOOKERSHUB / CONTACT</p>
        <h1>{lang === "ar" ? "خلينا نبدأ." : "Let’s talk."}</h1>
      </header>
      <Contact />
    </div>
  );
}
