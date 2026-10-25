import React from "react";
import { useLanguage } from "../LanguageContext";
import { ProductGrid, ClientGrid } from "../components/Portfolio";
export default function ProjectsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <div className="site-page site-container">
      <header className="page-heading">
        <p className="site-eyebrow">
          LOOKERSHUB / {ar ? "أعمالنا" : "OUR WORK"}
        </p>
        <h1>{ar ? "أفكار تتحول إلى واقع." : "Ideas becoming real."}</h1>
        <p>
          {ar
            ? "منتجاتنا، وما نعمل على بنائه، وشركات قدمنا لها خدمات التسويق."
            : "Our products, what we are building, and companies we have supported with marketing services."}
        </p>
      </header>
      <ProductGrid />
      <section className="site-section">
        <div className="section-heading">
          <p className="site-eyebrow">
            {ar ? "التسويق والنمو" : "MARKETING & GROWTH"}
          </p>
          <h2>
            {ar ? "شركات اشتغلنا معاها" : "Companies we have worked with"}
          </h2>
        </div>
        <ClientGrid />
      </section>
    </div>
  );
}
