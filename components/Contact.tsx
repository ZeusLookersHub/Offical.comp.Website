import React from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { contact, greeting, whatsappUrl } from "../data/site";
import ProjectRequestForm from "./ProjectRequestForm";
export default function Contact() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <section className="contact-layout">
      <div>
        <p className="site-eyebrow">{ar ? "خلينا نتكلم" : "LET’S CONNECT"}</p>
        <h2>
          {ar ? "فكرتك تبدأ بمحادثة." : "Good work starts with a conversation."}
        </h2>
        <p className="lead">
          {ar
            ? "احكيلنا محتاج إيه، ونحدد معاك الخطوة المناسبة."
            : "Tell us what you need, and we’ll work out the next step together."}
        </p>
        <div className="contact-links">
          <a
            href={whatsappUrl(greeting[lang])}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            <span>
              {ar ? "واتساب مباشر" : "WhatsApp"}
              <strong dir="ltr">+20 111 851 3761</strong>
            </span>
          </a>
          <a href={`mailto:${contact.email}`}>
            <Mail />
            <span>
              {ar ? "البريد الإلكتروني" : "Email"}
              <strong dir="ltr">{contact.email}</strong>
            </span>
          </a>
          <a href={`tel:${contact.phone}`}>
            <Phone />
            <span>
              {ar ? "الهاتف" : "Phone"}
              <strong dir="ltr">+20 111 851 3761</strong>
            </span>
          </a>
        </div>
      </div>
      <ProjectRequestForm compact />
    </section>
  );
}
