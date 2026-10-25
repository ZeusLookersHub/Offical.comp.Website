import React from "react";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { greeting, whatsappUrl } from "../data/site";
export default function WhatsAppButton() {
  const { lang } = useLanguage();
  return (
    <a
      className="whatsapp-float"
      href={whatsappUrl(greeting[lang])}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        lang === "ar"
          ? "تواصل مع LookersHub على واتساب"
          : "Chat with LookersHub on WhatsApp"
      }
    >
      <MessageCircle size={24} />
      <span>{lang === "ar" ? "كلّمنا" : "Let’s talk"}</span>
    </a>
  );
}
