import React, { useEffect, useRef, useState } from "react";
import { createMotion } from "./motion";
import { worlds, asset, type World } from "./worlds";
import WormholeEye from "./WormholeEye";
import "./recovered.css";
import "./WormholeHero.css";

const bands =
  "repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 3%,transparent 3% 12%,rgba(0,0,0,.14) 12% 16%,transparent 16% 28%)";
const rockGlows = [
  "rgba(255,197,110,.75)",
  "rgba(127,227,210,.7)",
  "rgba(255,143,184,.7)",
  "rgba(159,179,255,.7)",
];
function Globe({
  world,
  size,
  index = 0,
}: {
  world: World;
  size: number;
  index?: number;
}) {
  return (
    <span
      className="lh-globe"
      style={
        {
          "--s": `${size}px`,
          "--rs": world.ring,
          "--base": `url(${asset(world.id + "-sphere.webp")}) center/100% 100% no-repeat`,
          "--bands": bands,
          "--glow": world.glow,
          "--spin": `${22 + index * 3}s`,
        } as React.CSSProperties
      }
    >
      <img
        className="pl-ring pl-ring--back"
        src={asset(world.id + "-ring-back.webp")}
        alt=""
      />
      <span className="lh-atmo" />
      <span className="lh-surface" />
      <img
        className="pl-ring pl-ring--front"
        src={asset(world.id + "-ring-front.webp")}
        alt=""
      />
    </span>
  );
}
function Reveal({ text }: { text: string }) {
  return (
    <>
      {text.split(/\s+/).map((word, i) => (
        <React.Fragment key={i}>
          <span
            className={"lh-word" + (/[\[\]]/.test(word) ? " lh-shimmer" : "")}
            style={{ "--i": i } as React.CSSProperties}
          >
            {word.replace(/[\[\]]/g, "")}
          </span>{" "}
        </React.Fragment>
      ))}
    </>
  );
}
export default function WormholeHero({
  lang,
  onSelect,
}: {
  lang: "ar" | "en";
  onSelect: (world: string, task: string) => void;
}) {
  const root = useRef<HTMLElement>(null),
    homeStage = useRef<HTMLDivElement>(null),
    stepStage = useRef<HTMLDivElement>(null);
  const motion = useRef<ReturnType<typeof createMotion>>(null),
    back = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState<World | null>(null),
    [leaving, setLeaving] = useState(false),
    [notice, setNotice] = useState("");
  const [reduced, setReduced] = useState(
    () =>
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [bounds, setBounds] = useState({ width: 1240, height: 500 });
  const ar = lang === "ar",
    small = bounds.width < 640;
  const big = small
    ? Math.max(60, Math.min(bounds.width * 0.17, 76))
    : Math.round(Math.min(118, Math.max(84, bounds.height * 0.17)));
  const focusSize = small
    ? 78
    : Math.round(Math.min(124, Math.max(96, bounds.height * 0.19)));
  const rockSize = small
    ? Math.max(50, Math.min(bounds.width * 0.14, 60))
    : Math.min(88, Math.max(70, bounds.width * 0.06));
  const t = (en: string, arabic: string) => (ar ? arabic : en);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const kit = createMotion(element);
    motion.current = kit;
    kit.init({
      rockSprites: Array.from({ length: 8 }, (_, i) => ({
        src: asset(`asteroid-${i}.webp`),
        pal: Math.floor(i / 2),
      })),
    });
    const observer = new ResizeObserver(() => {
      const r = homeStage.current?.getBoundingClientRect();
      if (r)
        setBounds((old) =>
          old.width === r.width && old.height === r.height
            ? old
            : { width: r.width, height: r.height },
        );
    });
    if (homeStage.current) observer.observe(homeStage.current);
    return () => {
      observer.disconnect();
      kit.destroy();
      motion.current = null;
    };
  }, [reduced]);
  useEffect(() => {
    const kit = motion.current,
      home = homeStage.current,
      steps = stepStage.current;
    if (!kit || !home || !steps) return;
    const items = Array.from(
      home.querySelectorAll(".lh-planet") as NodeListOf<HTMLElement>,
    ).map((el) => ({
      el,
      ring: el.classList.contains("lh-planet--slot") ? "inner" : "outer",
      size: el.classList.contains("lh-planet--slot")
        ? Math.round(big * 0.4)
        : big,
    }));
    const orbit = kit.orbit(
      home,
      items,
      small
        ? { outer: [0.36, 0.37], inner: [0.58, 0.5], maxRy: 300 }
        : {
            outer: [0.42, 0.33],
            maxRx: 540,
            maxRy: Math.max(180, bounds.height * 0.33),
            inner: [0.5, 0.52],
          },
    );
    orbit.pause(!!active);
    const missionItems = Array.from(
      steps.querySelectorAll(".lh-planet") as NodeListOf<HTMLElement>,
    ).map((el) => ({ el, ring: "outer", size: rockSize }));
    const rect = steps.getBoundingClientRect();
    // The source anchors each globe by its diameter; reserve the labels below it
    // when the available viewport is shorter, particularly for Arabic missions.
    const maxHeight = Math.max(
      0,
      ...missionItems.map((item) => item.el.offsetHeight),
    );
    const maxWidth = Math.max(
      0,
      ...missionItems.map((item) => item.el.offsetWidth),
    );
    const maxRy = Math.max(
      0,
      Math.min(
        small ? 250 : Math.max(190, bounds.height * 0.37),
        rect.height / 2 - (maxHeight - rockSize / 2) * 1.04 - 14,
      ),
    );
    const maxRx = Math.max(
      0,
      Math.min(540, rect.width / 2 - maxWidth * 0.52 - 14),
    );
    const mission = active
      ? kit.orbit(steps, missionItems, {
          outer: small ? [0.36, 0.4] : [0.44, 0.4],
          maxRy,
          maxRx,
          speed: 0.0012,
        })
      : null;
    return () => {
      orbit.destroy();
      mission?.destroy();
    };
  }, [active, bounds, big, rockSize, small, reduced, lang]);
  useEffect(() => {
    if (active) back.current?.focus({ preventScroll: true });
  }, [active]);
  useEffect(() => {
    if (!leaving || !active) return;
    const timer = setTimeout(
      () => onSelect(active.en.toUpperCase(), leavingTask.current),
      reduced ? 0 : 700,
    );
    return () => clearTimeout(timer);
  }, [leaving, active, reduced, onSelect]);
  const leavingTask = useRef("");
  const close = () => {
    motion.current?.warp(-1);
    setActive(null);
  };
  return (
    <section
      ref={root}
      className={`wormhole-hero ${leaving ? "is-entering-chat" : ""}`}
      dir={ar ? "rtl" : "ltr"}
      lang={lang}
      aria-label={t("Choose your universe and mission", "اختار عالمك ومهمتك")}
      onKeyDown={(e) => {
        if (e.key === "Escape" && active) close();
      }}
    >
      <section
        className={`view lh-view ${active ? "is-away" : ""}`}
        aria-hidden={!!active}
        inert={!!active}
      >
        <div className="intro">
          <p className="eyebrow">LOOKERS AI</p>
          <h1 className="title">
            <Reveal
              text={t(
                "One idea. [Every] [step] [opens] [the] [next.]",
                "فكرة واحدة. [وكل] [خطوة] [تفتح] [اللي] [بعدها.]",
              )}
            />
          </h1>
          <p className="sub">
            {t(
              "Explore your universe. Turn ideas into real results.",
              "استكشف عالمك، وحوّل أفكارك لنتائج حقيقية.",
            )}
          </p>
        </div>
        <div className="stage" ref={homeStage}>
          <button
            type="button"
            className="lh-core"
            aria-label="Lookers AI"
            onClick={(e) => motion.current?.burst(e.currentTarget, 60)}
          >
            <span className="lh-corona" />
            <span className="lh-sun" />
            <WormholeEye stage={homeStage} reduced={reduced} />
            <span className="core-name">LOOKERS AI</span>
          </button>
          {worlds.map((w, i) => (
            <button
              key={w.id}
              type="button"
              className="lh-planet lh-pop"
              aria-label={ar ? w.ar : w.en.toUpperCase()}
              style={{ "--i": i } as React.CSSProperties}
              onClick={(e) => {
                motion.current?.burst(e.currentTarget);
                motion.current?.warp(1);
                setActive(w);
              }}
            >
              <Globe world={w} size={big} index={i} />
              <span className="pl-text">
                <span className="pl-num">{w.num}</span>
                <span className="pl-name">{w[lang]}</span>
                <span className="pl-sub">{ar ? w.subAr : w.subEn}</span>
                <span className="pl-line" />
                <span className="lh-hint">{t("Enter →", "ادخل ←")}</span>
              </span>
            </button>
          ))}
          {[0, 1, 2].map((i) => (
            <button
              type="button"
              key={i}
              className="lh-planet lh-planet--slot lh-pop"
              aria-label={t("Coming soon", "قريبًا")}
              style={{ "--i": i + 5 } as React.CSSProperties}
              onClick={() =>
                setNotice(
                  t(
                    "This orbit is saved for a new world",
                    "المدار ده محجوز لعالم جديد",
                  ),
                )
              }
            >
              <span
                className="lh-globe"
                style={
                  { "--s": `${Math.round(big * 0.4)}px` } as React.CSSProperties
                }
              />
              <span className="pl-text">
                <span className="pl-name">{t("Coming soon", "قريبًا")}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section
        className={`view lh-view ${active ? "" : "is-behind"}`}
        aria-hidden={!active}
        inert={!active}
      >
        <button
          type="button"
          ref={back}
          className="pill back lh-lift"
          onClick={close}
        >
          {t("← All universes", "→ كل المجالات")}
        </button>
        <div className="intro">
          <p className="eyebrow">
            {active ? `${active.num} · ${active[lang]}` : ""}
          </p>
          <h2 className="title">
            <Reveal
              text={t("What do you want to [create?]", "عايز [تعمل] [إيه؟]")}
            />
          </h2>
        </div>
        <div className="stage" ref={stepStage}>
          {active && (
            <>
              <div
                className="focus"
                style={{ "--fs": `${focusSize}px` } as React.CSSProperties}
              >
                <Globe world={active} size={focusSize} />
                <span className="pl-text">
                  <span className="pl-num">{active.num}</span>
                  <span className="pl-name">{active[lang]}</span>
                  <span className="pl-sub">
                    {ar ? active.subAr : active.subEn}
                  </span>
                </span>
              </div>
              {active.tasks.map((task, i) => (
                <button
                  type="button"
                  key={task[0]}
                  disabled={leaving}
                  className="lh-planet lh-planet--rock lh-pop"
                  style={{ "--i": i } as React.CSSProperties}
                  onClick={(e) => {
                    motion.current?.burst(e.currentTarget);
                    motion.current?.warp(1);
                    leavingTask.current = task[0];
                    setLeaving(true);
                  }}
                  aria-label={ar ? task[1] : task[0]}
                >
                  <span
                    className="lh-globe"
                    style={
                      {
                        "--s": `${rockSize}px`,
                        "--glow": rockGlows[i],
                      } as React.CSSProperties
                    }
                  >
                    <img
                      className="pl-rock"
                      src={asset(`rock-${i}.webp`)}
                      alt=""
                    />
                  </span>
                  <span className="pl-text">
                    <span className="pl-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="pl-name">{ar ? task[1] : task[0]}</span>
                    <span className="ms-desc">{ar ? task[3] : task[2]}</span>
                    <span className="pl-line" />
                    <span className="lh-hint">{t("Enter →", "ادخل ←")}</span>
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </section>
      <span className="wormhole-notice" role="status">
        {notice}
      </span>
    </section>
  );
}
