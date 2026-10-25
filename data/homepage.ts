import type { Bilingual } from "./services";
import type { ProductId } from "./site";

/** Full approved copy. Do not replace these statements with the short mockup copy. */
export const homeCopy = {
  hero: {
    ar: "نفس العالم. رؤية مختلفة.",
    en: "Same world. A different perspective.",
  },
  introduction: {
    ar: "نجمع الرؤى المختلفة، ونحوّل الأفكار إلى واقع.",
    en: "We bring different perspectives together and turn ideas into reality.",
  },
  vision: {
    ar: "أن نبني عالمًا تجد فيه الرؤى المختلفة فرصتها لتتحول إلى أفكار ومنتجات تصنع أثرًا حقيقيًا.",
    en: "To build a world where different perspectives have the opportunity to become ideas and products that make a real impact.",
  },
  mission: {
    ar: "نجمع أصحاب الرؤى المختلفة، نفهم احتياجات السوق ومشكلاته، ونحوّل أفكارنا وأفكار شركائنا إلى منتجات وحلول قابلة للاستخدام والتطوير.",
    en: "We bring together people with different perspectives, understand market needs and problems, and turn our ideas and our partners’ ideas into products and solutions people can use and develop.",
  },
  workTitle: {
    ar: "من الرؤية إلى الواقع.",
    en: "From perspective to reality.",
  },
  workIntro: {
    ar: "بدأنا بأفكارنا. وبنينا لها مكانًا في الواقع.",
    en: "We started with our own ideas. And built their place in the world.",
  },
  collaborationTitle: {
    ar: "رؤيتنا تمتد لفكرتك.",
    en: "Our perspective meets your idea.",
  },
  collaboration: {
    ar: "بنفس التفكير اللي بنبني بيه أفكارنا، نشتغل معاك على فكرتك.",
    en: "The same thinking we use to build our ideas, we bring to yours.",
  },
} satisfies Record<string, Bilingual>;

export type Film = {
  title: Bilingual;
  src: string | null;
  poster: string | null;
};
/** Claude adds the approved media URLs here. No placeholder video is advertised as playable. */
export const homeFilms: { brand: Film; lookersAI: Film } = {
  brand: {
    title: { ar: "حكاية الـ Lookers", en: "The Lookers story" },
    src: null,
    poster: null,
  },
  lookersAI: {
    title: { ar: "Lookers AI", en: "Lookers AI" },
    src: null,
    poster: null,
  },
};
export type HomeArtwork = {
  id: ProductId;
  title: string;
  poster: string;
  animation: { kind: "gif" | "video"; src: string } | null;
};
export const homeArtworks: HomeArtwork[] = [
  {
    id: "kosmos",
    title: "Kosmos",
    poster: "/assets/portfolio/kosmos-concept.webp",
    animation: null,
  },
  {
    id: "pick",
    title: "Pick",
    poster: "/assets/portfolio/pick.gif",
    animation: null,
  },
  {
    id: "aero",
    title: "Aero Runner",
    poster: "/assets/portfolio/aero-concept.webp",
    animation: null,
  },
  {
    id: "hera",
    title: "HERA SYSTEM ERP",
    poster: "/assets/portfolio/hera.png",
    animation: null,
  },
];
export type SocialPlatform = "youtube" | "linkedin" | "x" | "instagram";
export type SocialLink = {
  platform: SocialPlatform;
  title: string;
  url: string | null;
};
/** Populate only with owner-supplied account URLs. Never invent handles or link to a platform home page. */
export const socialLinks: SocialLink[] = [
  { platform: "youtube", title: "YouTube", url: null },
  { platform: "linkedin", title: "LinkedIn", url: null },
  { platform: "x", title: "X", url: null },
  { platform: "instagram", title: "Instagram", url: null },
];
