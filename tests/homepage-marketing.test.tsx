import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { LanguageContext } from "../LanguageContext";
import HomePage from "../pages/HomePage";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import Header from "../components/Header";
import { homeCopy, type SocialLink } from "../data/homepage";
import { HomeFilmFrame } from "../components/HomeMedia";

function render(
  element: React.ReactNode,
  lang: "ar" | "en" = "ar",
  route = "/",
) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[route]}>
      <LanguageContext.Provider value={{ lang, setLang: () => {} }}>
        {element}
      </LanguageContext.Provider>
    </MemoryRouter>,
  );
}
test("marketing home preserves full Arabic vision and mission without duplicated service or client directories", () => {
  const html = render(<HomePage />);
  assert.ok(html.includes(homeCopy.vision.ar));
  assert.ok(html.includes(homeCopy.mission.ar));
  assert.ok(html.includes('dir="rtl"'));
  assert.equal((html.match(/data-artwork-slot=/g) || []).length, 4);
  assert.ok(!html.includes("home-service-grid"));
  assert.ok(!html.includes("client-grid"));
  assert.ok(!html.includes("status-pill"));
  assert.ok(!html.includes('href="#home-story-film"'));
  assert.equal((html.match(/data-media-slot=/g) || []).length, 2);
  assert.ok(!html.includes("<video")); // unprovided films must not produce broken playback controls
});
test("actual supplied film renders real controls, never autoplay", () => {
  const html = render(
    <HomeFilmFrame
      kind="brand"
      film={{
        title: { ar: "حكاية", en: "Story" },
        src: "/assets/test-brand.mp4",
        poster: null,
      }}
    />,
  );
  assert.ok(html.includes("<video"));
  assert.ok(html.includes('controls=""'));
  assert.ok(!html.includes("autoPlay"));
  assert.ok(!html.includes("autoplay"));
});
test("footer exposes real contact destinations and no fake social destinations", () => {
  const html = render(<Footer reserveLogo />);
  assert.ok(html.includes("mailto:Info@lookershub.com"));
  assert.ok(html.includes("tel:+201118513761"));
  assert.ok(html.includes("https://wa.me/201118513761?text="));
  assert.ok(html.includes('data-logo-slot="footer"'));
  assert.equal((html.match(/aria-disabled="true"/g) || []).length, 4);
  assert.ok(!html.includes('href="#"'));
  const social: SocialLink = {
    platform: "instagram",
    title: "Instagram",
    url: "https://www.instagram.com/example_verified_for_test/",
  };
  const configured = render(<Footer socials={[social]} />);
  assert.ok(configured.includes(`href="${social.url}"`));
  assert.ok(configured.includes('rel="noopener noreferrer"'));
});
test("WhatsApp remains available on AI with the composer-safe placement class", () => {
  const html = render(<WhatsAppButton />, "ar", "/lookers-ai");
  assert.ok(html.includes("whatsapp-float--ai"));
  assert.ok(html.includes("https://wa.me/201118513761?text="));
  assert.ok(html.includes('target="_blank"'));
});
test("approved header keeps a logo slot and working website routes", () => {
  const html = render(<Header scrolled={false} reserveLogo />);
  assert.ok(html.includes('data-logo-slot="header"'));
  assert.ok(!html.includes("signature-logo"));
  for (const route of ["/services", "/projects", "/about", "/contact"])
    assert.ok(html.includes(`href="${route}"`));
  assert.ok(html.includes("Lookers AI"));
});
test("English marketing page retains the same complete scope", () => {
  const html = render(<HomePage />, "en");
  assert.ok(html.includes('dir="ltr"'));
  assert.ok(html.includes(homeCopy.vision.en));
  assert.ok(html.includes("Our mission"));
  assert.equal((html.match(/data-artwork-slot=/g) || []).length, 4);
});
