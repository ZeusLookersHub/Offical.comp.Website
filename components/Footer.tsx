import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import { contact, greeting, whatsappUrl } from "../data/site";
export default function Footer() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-grid">
          <div>
            <Link className="footer-brand" to="/">
              Lookers<span>Hub</span>
            </Link>
            <p>
              {ar
                ? "رؤية مختلفة. تنفيذ له معنى."
                : "A different vision. Thoughtful execution."}
            </p>
          </div>
          <nav aria-label={ar ? "روابط الفوتر" : "Footer navigation"}>
            {[
              { to: "/services", en: "Services", ar: "الخدمات" },
              { to: "/projects", en: "Our work", ar: "أعمالنا" },
              { to: "/about", en: "About", ar: "من نحن" },
              { to: "/contact", en: "Contact", ar: "تواصل معنا" },
            ].map((l) => (
              <Link key={l.to} to={l.to}>
                {l[lang]}
              </Link>
            ))}
          </nav>
          <div className="footer-contact">
            <a href={`mailto:${contact.email}`} dir="ltr">
              {contact.email}
            </a>
            <a
              href={whatsappUrl(greeting[lang])}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ar ? "تواصل على واتساب" : "Chat on WhatsApp"}
            </a>
          </div>
        </div>
        <p className="footer-copyright">
          © {new Date().getFullYear()} LookersHub.{" "}
          {ar ? "جميع الحقوق محفوظة." : "All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
