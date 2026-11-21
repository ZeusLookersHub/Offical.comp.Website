/**
 * Draws a schematic preview for every visual example the chat can show.
 *
 * The chat shows the person what a style choice looks like before they pick it. Until a real
 * render exists, this writes an original diagram per choice — composition, palette, weight —
 * so the choice is visible instead of described. Each file is an SVG at the same path as the
 * final asset with a .svg extension; the chat tries the .webp first, so dropping a real render
 * next to it upgrades the example with no code change.
 *
 * Run: npm run build:example-assets
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { blueprints } from '../core/mission-engine/registry.ts';
import { listResources, type ResourceNeed } from '../core/mission-engine/resources.ts';

type Frame = { w: number; h: number };
type Palette = { bg: string; ink: string; accent: string; soft: string; line: string };

/** Deterministic, so a choice keeps the same look across builds. */
const hash = (text: string): number => {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Math.abs(h);
};

const LIGHT: Palette = { bg: '#f4f1ec', ink: '#1b1b1d', accent: '#c2410c', soft: '#dedad2', line: '#bdb8ae' };
const DARK: Palette = { bg: '#121317', ink: '#f3f1ee', accent: '#c9a227', soft: '#24262c', line: '#3a3d45' };
const COOL: Palette = { bg: '#eef2f7', ink: '#16233a', accent: '#1d4ed8', soft: '#dbe3ee', line: '#b7c2d2' };
const WARM: Palette = { bg: '#f7ede1', ink: '#3b2a1d', accent: '#b5713f', soft: '#eadcc9', line: '#cdb79c' };
const FRESH: Palette = { bg: '#eef5ee', ink: '#1d3326', accent: '#2f855a', soft: '#dcebdd', line: '#b6cdbb' };

const ACCENTS = ['#c2410c', '#1d4ed8', '#2f855a', '#7c3aed', '#be123c', '#0e7490'];

const paletteFor = (need: ResourceNeed): Palette => {
  const key = `${need.option} ${need.description}`.toLowerCase();
  const base = /dark|luxury|premium dark|cinematic|night|noir/.test(key) ? DARK
    : /natural|eco|kraft|botanical|watercolour|organic/.test(key) ? FRESH
    : /retro|vintage|warm|craft|acoustic/.test(key) ? WARM
    : /corporate|swiss|technical|isometric|clean|studio|white/.test(key) ? COOL
    : LIGHT;
  return { ...base, accent: /dark|luxury/.test(key) ? base.accent : ACCENTS[hash(need.option) % ACCENTS.length] };
};

const frameFor = (need: ResourceNeed): Frame =>
  need.media === 'layout' ? { w: 640, h: 360 }
  : need.media === 'video' ? { w: 640, h: 360 }
  : /story|9:16|vertical/.test(need.description.toLowerCase()) ? { w: 360, h: 640 }
  : { w: 512, h: 640 };

/* ── composition pieces ─────────────────────────────────────────────── */

const bar = (x: number, y: number, w: number, h: number, fill: string, r = 3, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;

const lines = (x: number, y: number, w: number, count: number, gap: number, p: Palette, shrink = 0.72) =>
  Array.from({ length: count }, (_, i) => bar(x, y + i * gap, i === count - 1 ? w * shrink : w, 6, p.line, 3, 'opacity="0.75"')).join('');

const photoBlock = (x: number, y: number, w: number, h: number, p: Palette) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${p.soft}"/>`
  + `<circle cx="${x + w * 0.3}" cy="${y + h * 0.34}" r="${Math.min(w, h) * 0.12}" fill="${p.line}" opacity="0.9"/>`
  + `<path d="M${x} ${y + h} L${x + w * 0.38} ${y + h * 0.52} L${x + w * 0.62} ${y + h * 0.78} L${x + w * 0.82} ${y + h * 0.6} L${x + w} ${y + h} Z" fill="${p.line}" opacity="0.75"/>`;

const productSilhouette = (cx: number, cy: number, w: number, h: number, p: Palette, gloss = false) =>
  `<path d="M${cx - w / 2} ${cy + h / 2} L${cx - w / 2} ${cy - h / 2 + w * 0.34} Q${cx - w / 2} ${cy - h / 2} ${cx - w * 0.16} ${cy - h / 2 - h * 0.1} L${cx + w * 0.16} ${cy - h / 2 - h * 0.1} Q${cx + w / 2} ${cy - h / 2} ${cx + w / 2} ${cy - h / 2 + w * 0.34} L${cx + w / 2} ${cy + h / 2} Z" fill="${p.ink}" opacity="0.88"/>`
  + (gloss ? `<path d="M${cx - w * 0.3} ${cy + h * 0.36} L${cx - w * 0.3} ${cy - h * 0.3} Q${cx - w * 0.26} ${cy - h * 0.42} ${cx - w * 0.12} ${cy - h * 0.44}" stroke="${p.bg}" stroke-width="5" fill="none" opacity="0.5" stroke-linecap="round"/>` : '')
  + `<ellipse cx="${cx}" cy="${cy + h / 2 + 10}" rx="${w * 0.62}" ry="8" fill="${p.ink}" opacity="0.18"/>`;

const filmstrip = (f: Frame, p: Palette, count = 3) => {
  const pad = 24, gap = 12;
  const w = (f.w - pad * 2 - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, i) => {
    const x = pad + i * (w + gap);
    return photoBlock(x, f.h * 0.28, w, f.h * 0.44, p)
      + bar(x, f.h * 0.78, w * (0.5 + (hash(String(i)) % 40) / 100), 6, p.accent, 3, 'opacity="0.8"');
  }).join('');
};

/* ── the templates ──────────────────────────────────────────────────── */

type Template = (f: Frame, p: Palette, need: ResourceNeed) => string;

const templates: { match: RegExp; draw: Template }[] = [
  // Type-led: one huge headline owns the frame.
  { match: /bold-type|swiss|typograph|bold-modern|bold-colour|bold/, draw: (f, p) =>
    bar(f.w * 0.1, f.h * 0.22, f.w * 0.8, f.h * 0.1, p.ink)
    + bar(f.w * 0.1, f.h * 0.35, f.w * 0.62, f.h * 0.1, p.ink)
    + bar(f.w * 0.1, f.h * 0.48, f.w * 0.3, f.h * 0.1, p.accent)
    + lines(f.w * 0.1, f.h * 0.68, f.w * 0.5, 2, 14, p)
    + bar(f.w * 0.1, f.h * 0.86, f.w * 0.22, 10, p.line, 5) },

  // A photograph carries it, with a readable band over the image.
  { match: /photo-led|photo-hero|photo|lifestyle-bg|hero/, draw: (f, p) =>
    photoBlock(0, 0, f.w, f.h, p)
    + bar(0, f.h * 0.62, f.w, f.h * 0.38, p.bg, 0, 'opacity="0.88"')
    + bar(f.w * 0.08, f.h * 0.7, f.w * 0.7, f.h * 0.07, p.ink)
    + lines(f.w * 0.08, f.h * 0.82, f.w * 0.55, 2, 13, p) },

  // Air. One small element, nothing else.
  { match: /minimal|clean|natural-clean/, draw: (f, p) =>
    `<circle cx="${f.w / 2}" cy="${f.h * 0.42}" r="${Math.min(f.w, f.h) * 0.11}" fill="none" stroke="${p.ink}" stroke-width="3"/>`
    + bar(f.w * 0.36, f.h * 0.62, f.w * 0.28, 7, p.ink, 4)
    + bar(f.w * 0.43, f.h * 0.69, f.w * 0.14, 5, p.line, 3) },

  // Gradient and glass.
  { match: /gradient|modern/, draw: (f, p, n) =>
    `<defs><linearGradient id="g${hash(n.option)}" x1="0" y1="0" x2="1" y2="1">`
    + `<stop offset="0" stop-color="${p.accent}"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>`
    + bar(0, 0, f.w, f.h, `url(#g${hash(n.option)})`, 0)
    + `<circle cx="${f.w * 0.72}" cy="${f.h * 0.28}" r="${f.w * 0.26}" fill="#ffffff" opacity="0.18"/>`
    + bar(f.w * 0.12, f.h * 0.52, f.w * 0.62, f.h * 0.2, '#ffffff', 16, 'opacity="0.22"')
    + bar(f.w * 0.17, f.h * 0.58, f.w * 0.42, 9, '#ffffff', 5, 'opacity="0.9"')
    + bar(f.w * 0.17, f.h * 0.64, f.w * 0.26, 7, '#ffffff', 4, 'opacity="0.6"') },

  // Cut paper, tape, overlap.
  { match: /collage|cutout/, draw: (f, p) =>
    bar(f.w * 0.08, f.h * 0.12, f.w * 0.46, f.h * 0.34, p.soft, 2, `transform="rotate(-6 ${f.w * 0.3} ${f.h * 0.3})"`)
    + photoBlock(f.w * 0.34, f.h * 0.3, f.w * 0.5, f.h * 0.34, p)
    + bar(f.w * 0.14, f.h * 0.56, f.w * 0.4, f.h * 0.2, p.accent, 2, `opacity="0.9" transform="rotate(4 ${f.w * 0.34} ${f.h * 0.66})"`)
    + bar(f.w * 0.46, f.h * 0.1, f.w * 0.12, 16, p.line, 1, `opacity="0.8" transform="rotate(-24 ${f.w * 0.52} ${f.h * 0.12})"`) },

  // Warm, grainy, arched.
  { match: /retro|vintage/, draw: (f, p) =>
    `<path d="M${f.w * 0.18} ${f.h * 0.66} L${f.w * 0.18} ${f.h * 0.36} A${f.w * 0.32} ${f.w * 0.32} 0 0 1 ${f.w * 0.82} ${f.h * 0.36} L${f.w * 0.82} ${f.h * 0.66} Z" fill="${p.accent}" opacity="0.85"/>`
    + bar(f.w * 0.26, f.h * 0.72, f.w * 0.48, f.h * 0.06, p.ink)
    + bar(f.w * 0.36, f.h * 0.81, f.w * 0.28, 6, p.ink, 3, 'opacity="0.6"')
    + Array.from({ length: 70 }, (_, i) => `<circle cx="${hash('x' + i) % f.w}" cy="${hash('y' + i) % f.h}" r="1.1" fill="${p.ink}" opacity="0.1"/>`).join('') },

  // Flat vector / line art / illustration.
  { match: /flat-vector|line-art|illustrated|illustration/, draw: (f, p, n) => {
    const outline = /line-art/.test(n.option);
    const shape = (x: number, y: number, r: number, fill: string) => outline
      ? `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${p.ink}" stroke-width="3"/>`
      : `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
    return shape(f.w * 0.38, f.h * 0.42, f.w * 0.17, p.accent)
      + (outline
        ? `<rect x="${f.w * 0.52}" y="${f.h * 0.3}" width="${f.w * 0.3}" height="${f.h * 0.26}" fill="none" stroke="${p.ink}" stroke-width="3" rx="6"/>`
        : bar(f.w * 0.52, f.h * 0.3, f.w * 0.3, f.h * 0.26, p.ink, 6, 'opacity="0.85"'))
      + `<path d="M${f.w * 0.16} ${f.h * 0.68} Q${f.w * 0.5} ${f.h * 0.56} ${f.w * 0.84} ${f.h * 0.68}" stroke="${p.ink}" stroke-width="3" fill="none"/>`
      + bar(f.w * 0.3, f.h * 0.78, f.w * 0.4, 6, p.line, 3);
  } },

  // Soft 3D / clay.
  { match: /3d-render|3d|clay/, draw: (f, p) =>
    `<defs><radialGradient id="s" cx="0.35" cy="0.3"><stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>`
    + `<circle cx="${f.w * 0.42}" cy="${f.h * 0.44}" r="${f.w * 0.2}" fill="${p.accent}"/>`
    + `<circle cx="${f.w * 0.42}" cy="${f.h * 0.44}" r="${f.w * 0.2}" fill="url(#s)"/>`
    + `<rect x="${f.w * 0.58}" y="${f.h * 0.46}" width="${f.w * 0.22}" height="${f.w * 0.22}" rx="${f.w * 0.06}" fill="${p.ink}" opacity="0.8"/>`
    + `<ellipse cx="${f.w * 0.5}" cy="${f.h * 0.74}" rx="${f.w * 0.3}" ry="10" fill="${p.ink}" opacity="0.14"/>` },

  // Watercolour washes.
  { match: /watercolour|watercolor|painted/, draw: (f, p) =>
    `<circle cx="${f.w * 0.4}" cy="${f.h * 0.4}" r="${f.w * 0.26}" fill="${p.accent}" opacity="0.4"/>`
    + `<circle cx="${f.w * 0.58}" cy="${f.h * 0.52}" r="${f.w * 0.22}" fill="${p.ink}" opacity="0.22"/>`
    + `<circle cx="${f.w * 0.5}" cy="${f.h * 0.3}" r="${f.w * 0.16}" fill="${p.line}" opacity="0.35"/>`
    + bar(f.w * 0.3, f.h * 0.78, f.w * 0.4, 6, p.ink, 3, 'opacity="0.5"') },

  // Isometric.
  { match: /isometric/, draw: (f, p) => {
    const iso = (cx: number, cy: number, s: number, fill: string) =>
      `<path d="M${cx} ${cy - s * 0.5} L${cx + s} ${cy} L${cx} ${cy + s * 0.5} L${cx - s} ${cy} Z" fill="${fill}"/>`
      + `<path d="M${cx - s} ${cy} L${cx} ${cy + s * 0.5} L${cx} ${cy + s * 1.1} L${cx - s} ${cy + s * 0.6} Z" fill="${fill}" opacity="0.7"/>`
      + `<path d="M${cx + s} ${cy} L${cx} ${cy + s * 0.5} L${cx} ${cy + s * 1.1} L${cx + s} ${cy + s * 0.6} Z" fill="${fill}" opacity="0.5"/>`;
    return iso(f.w * 0.42, f.h * 0.38, f.w * 0.16, p.accent) + iso(f.w * 0.64, f.h * 0.52, f.w * 0.12, p.ink);
  } },

  // Product on a seamless studio background.
  { match: /white-studio|studio|glossy|matte|product/, draw: (f, p, n) =>
    bar(0, 0, f.w, f.h, '#ffffff', 0)
    + bar(0, f.h * 0.72, f.w, f.h * 0.28, '#f1f1f1', 0)
    + productSilhouette(f.w / 2, f.h * 0.5, f.w * 0.26, f.h * 0.4, { ...p, ink: '#2a2a2e', bg: '#ffffff' }, /gloss/.test(n.option)) },

  // Dark luxury.
  { match: /luxury-dark|dark-premium|premium/, draw: (f, p) =>
    bar(0, 0, f.w, f.h, '#101114', 0)
    + productSilhouette(f.w / 2, f.h * 0.48, f.w * 0.24, f.h * 0.38, { ...DARK, ink: '#1e2026' })
    + `<path d="M${f.w * 0.2} ${f.h * 0.8} L${f.w * 0.8} ${f.h * 0.8}" stroke="${DARK.accent}" stroke-width="2"/>`
    + bar(f.w * 0.36, f.h * 0.86, f.w * 0.28, 6, DARK.accent, 3, 'opacity="0.8"') },

  // Logo marks.
  { match: /wordmark|lettermark|geometric|emblem|mascot/, draw: (f, p, n) => {
    const cx = f.w / 2, cy = f.h * 0.44, r = Math.min(f.w, f.h) * 0.16;
    const mark = /wordmark/.test(n.option) ? bar(cx - f.w * 0.3, cy - 14, f.w * 0.6, 28, p.ink, 4)
      : /lettermark/.test(n.option) ? `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="6" fill="none" stroke="${p.ink}" stroke-width="6"/><path d="M${cx - r * 0.4} ${cy + r * 0.5} L${cx} ${cy - r * 0.5} L${cx + r * 0.4} ${cy + r * 0.5}" stroke="${p.ink}" stroke-width="6" fill="none"/>`
      : /geometric/.test(n.option) ? `<circle cx="${cx - r * 0.5}" cy="${cy}" r="${r}" fill="none" stroke="${p.ink}" stroke-width="6"/><circle cx="${cx + r * 0.5}" cy="${cy}" r="${r}" fill="none" stroke="${p.accent}" stroke-width="6"/>`
      : /emblem/.test(n.option) ? `<circle cx="${cx}" cy="${cy}" r="${r * 1.3}" fill="none" stroke="${p.ink}" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${r * 1.05}" fill="none" stroke="${p.ink}" stroke-width="2"/>` + bar(cx - r * 0.6, cy - 5, r * 1.2, 10, p.ink, 2)
      : `<circle cx="${cx}" cy="${cy - r * 0.2}" r="${r}" fill="${p.accent}"/><circle cx="${cx - r * 0.35}" cy="${cy - r * 0.35}" r="4" fill="${p.bg}"/><circle cx="${cx + r * 0.35}" cy="${cy - r * 0.35}" r="4" fill="${p.bg}"/><path d="M${cx - r * 0.4} ${cy + r * 0.2} Q${cx} ${cy + r * 0.55} ${cx + r * 0.4} ${cy + r * 0.2}" stroke="${p.bg}" stroke-width="4" fill="none"/>`;
    return mark + bar(cx - f.w * 0.16, f.h * 0.72, f.w * 0.32, 6, p.line, 3);
  } },

  // Packaging silhouettes.
  { match: /packaging|pack|bag|box|pouch|eco|kraft/, draw: (f, p) =>
    `<path d="M${f.w * 0.3} ${f.h * 0.78} L${f.w * 0.3} ${f.h * 0.3} L${f.w * 0.36} ${f.h * 0.24} L${f.w * 0.64} ${f.h * 0.24} L${f.w * 0.7} ${f.h * 0.3} L${f.w * 0.7} ${f.h * 0.78} Z" fill="${p.soft}" stroke="${p.line}" stroke-width="2"/>`
    + bar(f.w * 0.36, f.h * 0.4, f.w * 0.28, 10, p.ink, 3)
    + bar(f.w * 0.36, f.h * 0.46, f.w * 0.18, 6, p.accent, 3)
    + `<ellipse cx="${f.w * 0.5}" cy="${f.h * 0.8}" rx="${f.w * 0.22}" ry="7" fill="${p.ink}" opacity="0.15"/>` },

  // Slide layouts.
  { match: /corporate|deck|slide/, draw: (f, p) =>
    bar(f.w * 0.07, f.h * 0.14, f.w * 0.5, f.h * 0.09, p.ink)
    + bar(f.w * 0.07, f.h * 0.28, f.w * 0.3, 6, p.line, 3)
    + Array.from({ length: 4 }, (_, i) => bar(f.w * (0.07 + i * 0.12), f.h * (0.74 - (i % 3) * 0.1 - 0.08), f.w * 0.08, f.h * (0.14 + (i % 3) * 0.1), p.accent, 3, `opacity="${0.5 + i * 0.12}"`)).join('')
    + bar(f.w * 0.62, f.h * 0.4, f.w * 0.3, 6, p.line, 3)
    + bar(f.w * 0.62, f.h * 0.48, f.w * 0.24, 6, p.line, 3)
    + bar(f.w * 0.62, f.h * 0.56, f.w * 0.27, 6, p.line, 3) },

  // Colour grading / edits: before-after split.
  { match: /colour-graded|color|grade|cinematic/, draw: (f, p) =>
    photoBlock(0, 0, f.w / 2 - 2, f.h, { ...p, soft: '#d9d9d9', line: '#b9b9b9' })
    + photoBlock(f.w / 2 + 2, 0, f.w / 2 - 2, f.h, { ...p, soft: '#17323f', line: p.accent })
    + bar(f.w / 2 - 1, 0, 2, f.h, '#ffffff', 0) },
];

const fallback: Template = (f, p) =>
  bar(f.w * 0.1, f.h * 0.18, f.w * 0.55, f.h * 0.08, p.ink)
  + photoBlock(f.w * 0.1, f.h * 0.34, f.w * 0.8, f.h * 0.34, p)
  + lines(f.w * 0.1, f.h * 0.76, f.w * 0.6, 2, 14, p);

function draw(need: ResourceNeed): string {
  const f = frameFor(need);
  const p = paletteFor(need);
  const key = `${need.option} ${need.slot} ${need.blueprint} ${need.description}`.toLowerCase();
  const body = need.media === 'video'
    ? filmstrip(f, p)
    : (templates.find(t => t.match.test(key))?.draw ?? fallback)(f, p, need);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.w} ${f.h}" width="${f.w}" height="${f.h}" role="img" aria-label="${need.option} example">`
    + `<rect width="${f.w}" height="${f.h}" fill="${p.bg}"/>`
    + body
    + `</svg>\n`;
}

const needs = listResources(blueprints);
const seen = new Set<string>();
let written = 0;
for (const need of needs) {
  if (!need.asset || seen.has(need.asset)) continue;
  seen.add(need.asset);
  const path = join('public', need.asset.replace(/\.(webp|png|jpg|mp4)$/i, '.svg').replace(/^\//, ''));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, draw(need));
  written++;
}
console.log(`wrote ${written} example previews for ${needs.length} choices`);
