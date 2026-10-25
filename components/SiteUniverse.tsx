import React, { useEffect, useRef } from "react";

/** Decorative, code-rendered background. Owned by the public site only. */
export default function SiteUniverse() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0,
      height = 0,
      frame = 0,
      last = 0,
      phase = 0;
    const stars = Array.from({ length: 150 }, (_, i) => ({
      x: ((i * 73.79) % 997) / 997,
      y: ((i * 131.63) % 991) / 991,
      r: 0.4 + (i % 4) * 0.26,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        ctx.fillStyle = "rgba(212,226,244,.5)";
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      const cx = width * 0.57,
        cy = Math.min(height * 0.43, 410),
        scale = Math.min(width * 0.45, 460);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.38);
      for (let i = 0; i < 65; i++) {
        const depth = (i / 65 + phase) % 1;
        const radius = 28 + depth * scale;
        ctx.strokeStyle = `rgba(${i % 3 === 0 ? "97,191,207" : "200,171,100"},${(1 - depth) * 0.2})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.ellipse(
          Math.sin(depth * 5) * depth * 30,
          Math.cos(depth * 4) * depth * 15,
          radius,
          radius * (0.32 + depth * 0.38),
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      const voidGlow = ctx.createRadialGradient(0, 0, 5, 0, 0, 70);
      voidGlow.addColorStop(0, "#03060d");
      voidGlow.addColorStop(0.38, "rgba(3,6,13,.95)");
      voidGlow.addColorStop(0.65, "rgba(193,155,70,.10)");
      voidGlow.addColorStop(1, "transparent");
      ctx.fillStyle = voidGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const tick = (now: number) => {
      if (now - last > 40) {
        phase = (phase + 0.00022) % 1;
        draw();
        last = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      draw();
      if (!motion.matches && !document.hidden)
        frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sync();
    };
    resize();
    window.addEventListener("resize", resize);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return (
    <div className="site-universe" aria-hidden="true">
      <canvas ref={ref} />
      <div className="site-universe__shade" />
    </div>
  );
}
