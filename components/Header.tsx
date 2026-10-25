import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../LanguageContext";
import SignatureLogo from "./SignatureLogo";
import "./Header.css";

export default function Header({
  scrolled,
  reserveLogo = false,
}: {
  scrolled: boolean;
  reserveLogo?: boolean;
}) {
  const { lang, setLang } = useLanguage();
  const location = useLocation(),
    navigate = useNavigate();
  const navItems = [
    { en: "Services", ar: "الخدمات", path: "/services" },
    { en: "Projects", ar: "المشاريع", path: "/projects" },
    { en: "About", ar: "حولنا", path: "/about" },
    { en: "Contact", ar: "اتصل بنا", path: "/contact" },
    {
      en: "Start Your Project",
      ar: "ابدأ مشروعك",
      path: "/start-your-project",
    },
  ];
  const start = () =>
    location.pathname === "/lookers-ai"
      ? window.dispatchEvent(new Event("lookers-ai:start-new"))
      : navigate("/lookers-ai", { state: { startNewProject: true } });
  return (
    <header
      className={`site-header ${scrolled ? "is-scrolled" : ""}`}
      dir="ltr"
    >
      <div className="site-header-row">
        <Link to="/" className="site-logo-link" aria-label="LookersHub">
          <>
            {reserveLogo ? (
              <span
                className="site-logo-slot"
                data-logo-slot="header"
                aria-hidden="true"
              />
            ) : (
              <SignatureLogo />
            )}
          </>
        </Link>
        <nav
          className="site-nav"
          aria-label={lang === "ar" ? "صفحات الموقع" : "Website navigation"}
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          {navItems
            .filter(
              (item) => !reserveLogo || item.path !== "/start-your-project",
            )
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={
                  location.pathname === item.path ? "page" : undefined
                }
              >
                {item[lang]}
              </Link>
            ))}
        </nav>
        <div className="site-actions">
          <div className="site-language" role="group" aria-label="Language">
            {(["ar", "en"] as const).map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={lang === item}
                onClick={() => setLang(item)}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" className="site-ai-button" onClick={start}>
            Lookers AI
          </button>
        </div>
      </div>
    </header>
  );
}
