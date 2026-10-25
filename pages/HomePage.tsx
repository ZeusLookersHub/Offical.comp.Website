import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Eye, Target } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { homeCopy, homeFilms, homeArtworks } from "../data/homepage";
import { HomeArtworkFrame, HomeFilmFrame } from "../components/HomeMedia";

export default function HomePage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <div className="home-marketing" dir={ar ? "rtl" : "ltr"} lang={lang}>
      <section className="home-story home-layout" aria-labelledby="home-title">
        <div className="home-opening">
          <div className="home-opening__copy">
            <h1 id="home-title">
              {ar ? (
                <>
                  نفس العالم.
                  <br />
                  <em>رؤية مختلفة.</em>
                </>
              ) : (
                <>
                  Same world.
                  <br />
                  <em>A different perspective.</em>
                </>
              )}
            </h1>
            <p>{homeCopy.introduction[lang]}</p>
          </div>
          <button
            className="home-scroll"
            type="button"
            onClick={() =>
              document.getElementById("home-story-film")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
                block: "start",
              })
            }
          >
            {ar ? "اكتشف حكايتنا" : "Discover our story"}
            <span aria-hidden="true">↓</span>
          </button>
        </div>
        <div id="home-story-film">
          <HomeFilmFrame film={homeFilms.brand} kind="brand" />
        </div>
        <div className="home-purpose" aria-labelledby="home-purpose-title">
          <h2 id="home-purpose-title">
            {ar
              ? "رؤيتنا تقود ما نبنيه"
              : "Our perspective guides what we build"}
          </h2>
          <div className="home-purpose__columns">
            <article>
              <h3>
                <Eye size={24} aria-hidden="true" />
                {ar ? "رؤيتنا" : "Our vision"}
              </h3>
              <p>{homeCopy.vision[lang]}</p>
            </article>
            <article>
              <h3>
                <Target size={24} aria-hidden="true" />
                {ar ? "رسالتنا" : "Our mission"}
              </h3>
              <p>{homeCopy.mission[lang]}</p>
            </article>
          </div>
        </div>
      </section>
      <section
        className="home-work home-layout"
        aria-labelledby="home-work-title"
      >
        <header className="home-work__heading">
          <h2 id="home-work-title">{homeCopy.workTitle[lang]}</h2>
          <p>{homeCopy.workIntro[lang]}</p>
          <ul
            className="home-thinking"
            aria-label={ar ? "طريقة تفكيرنا" : "How we think"}
          >
            {(ar
              ? ["نلاحظ", "نفهم", "نبني", "نطوّر"]
              : ["Observe", "Understand", "Build", "Develop"]
            ).map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </header>
        <HomeFilmFrame film={homeFilms.lookersAI} kind="lookers-ai" />
        <div className="home-artworks">
          {homeArtworks.map((artwork) => (
            <HomeArtworkFrame artwork={artwork} key={artwork.id} />
          ))}
        </div>
      </section>
      <section
        className="home-collaboration home-layout"
        aria-labelledby="home-collaboration-title"
      >
        <div>
          <h2 id="home-collaboration-title">
            {homeCopy.collaborationTitle[lang]}
          </h2>
          <p>{homeCopy.collaboration[lang]}</p>
          <div className="button-row">
            <Link className="site-button" to="/start-your-project">
              {ar ? "ابدأ مشروعك" : "Start your project"}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link className="site-button site-button--outline" to="/contact">
              {ar ? "خلّينا نتكلم" : "Let’s talk"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
