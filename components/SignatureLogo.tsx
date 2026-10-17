import React, { useEffect, useRef } from 'react';
import signature from '../assets/lookershub-signature.webp';

/** Animate only the wordmark; keep the supplied architectural mark and tagline still. */
export default function SignatureLogo() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    const context = surface.getContext('2d');
    if (!context) return;
    const image = new Image();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const width = 728, height = 260, split = 225;
    let frame = 0, start = 0, last = 0, visible = true, disposed = false;
    let particles: {x:number;y:number;color:string;alpha:number;curve:number}[] = [];
    const paint = (progress: number) => {
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, image.naturalWidth * split / width, image.naturalHeight, 0, 0, split, height);
      context.drawImage(image, split * image.naturalWidth / width, image.naturalHeight * .66, image.naturalWidth * (1 - split / width), image.naturalHeight * .34, split, height * .66, width - split, height * .34);
      if (progress < .001) {
        context.drawImage(image, split * image.naturalWidth / width, 0, image.naturalWidth * (1 - split / width), image.naturalHeight * .66, split, 0, width - split, height * .66);
        surface.dataset.motion = 'assembled'; return;
      }
      const eased = progress * progress * (3 - 2 * progress);
      for (const p of particles) {
        const x = p.x + (185 - p.x) * eased;
        const y = p.y + (166 - p.y) * eased + Math.sin(eased * Math.PI) * p.curve;
        context.globalAlpha = (1 - eased) * p.alpha;
        context.fillStyle = p.color;
        context.fillRect(x, y, 3 * (1 - .65 * eased), 3 * (1 - .65 * eased));
      }
      context.globalAlpha = 1;
      surface.dataset.motion = progress > .98 ? 'inside' : 'pixels';
    };
    const animate = (now: number) => {
      if (disposed || !visible || document.hidden) { frame = 0; return; }
      if (!start) start = now;
      if (now - last > 32) {
        last = now;
        const t = (now - start) % 9000;
        const progress = t < 3500 || t >= 7200 ? 0 : t < 5000 ? (t - 3500) / 1500 : t < 5500 ? 1 : 1 - (t - 5500) / 1700;
        paint(progress);
      }
      frame = requestAnimationFrame(animate);
    };
    const resume = () => { if (image.complete && image.naturalWidth && !frame && !reduced.matches && visible && !document.hidden && !disposed) frame = requestAnimationFrame(animate); };
    const preference = () => { cancelAnimationFrame(frame); frame = 0; start = 0; if (image.naturalWidth) paint(0); resume(); };
    image.onload = () => {
      if (disposed) return;
      const sample = document.createElement('canvas'); sample.width = width; sample.height = height;
      const c = sample.getContext('2d', { willReadFrequently: true }); if (!c) return;
      c.drawImage(image, 0, 0, width, height);
      const data = c.getImageData(0, 0, width, height).data;
      particles = [];
      for (let y = 95; y < 177; y += 3) for (let x = split; x < width; x += 3) {
        const k = (y * width + x) * 4, r = data[k], g = data[k + 1], b = data[k + 2], value = Math.max(r, g, b);
        if (value > 45) particles.push({ x, y, color: `rgb(${r},${g},${b})`, alpha: Math.min(1, value / 140), curve: ((x * 13 + y * 11) % 100 - 50) * .65 });
      }
      paint(0); surface.dataset.ready = 'true'; resume();
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); });
    observer.observe(surface); document.addEventListener('visibilitychange', resume); reduced.addEventListener('change', preference);
    image.src = signature;
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); image.onload = null; document.removeEventListener('visibilitychange', resume); reduced.removeEventListener('change', preference); };
  }, []);
  return <span className="signature-logo"><img src={signature} alt="LookersHub — A Different Perspective" /><canvas ref={canvas} width={728} height={260} aria-hidden="true" /></span>;
}
