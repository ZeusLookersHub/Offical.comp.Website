import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { WhatsAppIcon } from "./BrandIcons";
import { useLanguage } from "../LanguageContext";
import { greeting, whatsappUrl } from "../data/site";
export default function WhatsAppButton() {
  const { lang } = useLanguage();
  const isAI = useLocation().pathname === "/lookers-ai";
  const buttonRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const button = buttonRef.current;
    if (!button || !isAI) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const composer = document.querySelector(".lai-chat__composer");
      const bounds = composer?.getBoundingClientRect();
      const anchor = button.getBoundingClientRect();
      const height = window.innerHeight;
      const overlapsColumn = bounds && bounds.left < anchor.right && bounds.right > anchor.left;
      const offset = overlapsColumn && bounds.top >= anchor.height + 24 && bounds.top < height
        ? height - bounds.top + 12
        : 0;
      button.style.setProperty("--whatsapp-composer-offset", `${offset}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      button.style.removeProperty("--whatsapp-composer-offset");
    };
  }, [isAI]);
  return (
    <a
      ref={buttonRef}
      className={`whatsapp-float ${isAI ? "whatsapp-float--ai" : ""}`}
      href={whatsappUrl(greeting[lang])}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        lang === "ar"
          ? "تواصل مع LookersHub على واتساب"
          : "Chat with LookersHub on WhatsApp"
      }
    >
      <WhatsAppIcon size={27} />
      <span>{lang === "ar" ? "كلّمنا" : "Let’s talk"}</span>
    </a>
  );
}
