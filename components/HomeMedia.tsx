import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Film as FilmIcon } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import type { Film, HomeArtwork } from "../data/homepage";

export function HomeFilmFrame({
  film,
  kind,
}: {
  film: Film;
  kind: "brand" | "lookers-ai";
}) {
  const { lang } = useLanguage();
  return (
    <figure className={`home-film home-film--${kind}`} data-media-slot={kind}>
      {film.src ? (
        <video
          controls
          playsInline
          preload="none"
          poster={film.poster ?? undefined}
          aria-label={film.title[lang]}
          src={film.src}
        />
      ) : (
        <div
          className="home-film__placeholder"
          role="img"
          aria-label={film.title[lang]}
          style={
            film.poster
              ? { backgroundImage: `url("${film.poster}")` }
              : undefined
          }
        >
          <FilmIcon size={34} aria-hidden="true" />
          <span>{lang === "ar" ? "الفيلم قريبًا" : "Film coming soon"}</span>
        </div>
      )}
      <figcaption>{film.title[lang]}</figcaption>
    </figure>
  );
}
export const HomeArtworkFrame: React.FC<{ artwork: HomeArtwork }> = ({
  artwork,
}) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () =>
      setAnimated(visible && !preference.matches && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (animated) element.play().catch(() => {});
    else element.pause();
  }, [animated]);
  const media = artwork.animation;
  return (
    <Link
      ref={ref}
      className={`home-artwork home-artwork--${artwork.id}`}
      to={`/projects/${artwork.id}`}
      aria-label={artwork.title}
      data-artwork-slot={artwork.id}
    >
      {media?.kind === "video" ? (
        <video
          ref={video}
          loop
          muted
          playsInline
          preload="none"
          poster={artwork.poster}
          src={animated ? media.src : undefined}
          aria-hidden="true"
        />
      ) : (
        <img
          src={media?.kind === "gif" && animated ? media.src : artwork.poster}
          alt=""
          loading="lazy"
        />
      )}
      <span>{artwork.title}</span>
    </Link>
  );
};
