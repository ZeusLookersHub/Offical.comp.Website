import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { contact, greeting, whatsappUrl } from "../data/site";
import { socialLinks, type SocialLink } from "../data/homepage";
import { SocialIcon, WhatsAppIcon } from "./BrandIcons";

export default function Footer({
  reserveLogo = false,
  socials = socialLinks,
}: {
  reserveLogo?: boolean;
  socials?: SocialLink[];
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-grid">
          <div>
            <Link className="footer-brand" to="/" aria-label="LookersHub">
              {reserveLogo ? (
                <span
                  className="site-logo-slot"
                  data-logo-slot="footer"
                  aria-hidden="true"
                />
              ) : (
                <>
                  Lookers<span>Hub</span>
                </>
              )}
            </Link>
            {!reserveLogo && (
              <p>
                {ar
                  ? "رؤية مختلفة. تنفيذ له معنى."
                  : "A different vision. Thoughtful execution."}
              </p>
            )}
          </div>
          <div className="footer-contact">
            <a className="footer-contact-row" href={`mailto:${contact.email}`}>
              <Mail size={18} aria-hidden="true" />
              <span dir="ltr">{contact.email}</span>
            </a>
            <a
              className="footer-contact-row"
              href={whatsappUrl(greeting[lang])}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ar ? "تواصل على واتساب" : "Chat on WhatsApp"}
            >
              <WhatsAppIcon size={19} />
              <span dir="ltr">+20 111 851 3761</span>
            </a>
            <a className="footer-contact-row" href={`tel:${contact.phone}`}>
              <Phone size={17} aria-hidden="true" />
              <span>{ar ? "اتصل بنا" : "Call us"}</span>
            </a>
          </div>
          <div>
            <div
              className="social-links"
              aria-label={ar ? "السوشيال ميديا" : "Social media"}
            >
              {socials.map((link) =>
                link.url ? (
                  <a
                    key={link.platform}
                    className="social-link"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.title}
                    title={link.title}
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                ) : (
                  <span
                    key={link.platform}
                    className="social-link"
                    aria-disabled="true"
                    aria-label={`${link.title} — ${ar ? "قريبًا" : "coming soon"}`}
                    title={`${link.title} — ${ar ? "قريبًا" : "coming soon"}`}
                  >
                    <SocialIcon platform={link.platform} />
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
        {!reserveLogo && (
          <nav
            className="footer-page-links"
            aria-label={ar ? "روابط الفوتر" : "Footer navigation"}
          >
            {[
              { to: "/services", en: "Services", ar: "الخدمات" },
              { to: "/projects", en: "Our work", ar: "أعمالنا" },
              { to: "/about", en: "About", ar: "من نحن" },
              { to: "/contact", en: "Contact", ar: "تواصل معنا" },
            ].map((link) => (
              <Link key={link.to} to={link.to}>
                {link[lang]}
              </Link>
            ))}
          </nav>
        )}
        <p className="footer-copyright">
          © {new Date().getFullYear()} LookersHub.{" "}
          {ar ? "جميع الحقوق محفوظة." : "All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
