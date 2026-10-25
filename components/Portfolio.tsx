import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import {
  products,
  marketingClients,
  type Product,
  type ProductId,
} from "../data/site";

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { lang } = useLanguage();
  return (
    <Link
      className={`product-card product-card--${product.id}`}
      to={`/projects/${product.id}`}
    >
      <div className="product-card__image">
        <img src={product.image} alt={product.title} loading="lazy" />
        <span
          className={`status-pill ${product.status === "available" ? "status-pill--live" : ""}`}
        >
          {product.status === "available"
            ? lang === "ar"
              ? "متاح الآن"
              : "Available now"
            : lang === "ar"
              ? "تحت الإنشاء"
              : "In development"}
        </span>
        {product.concept && (
          <small>{lang === "ar" ? "تصور مبدئي" : "Concept artwork"}</small>
        )}
      </div>
      <div className="product-card__body">
        <p className="site-eyebrow">{product.subtitle[lang]}</p>
        <h3 dir="ltr">{product.title}</h3>
        <p>{product.description[lang]}</p>
        <span className="text-link">
          {lang === "ar" ? "اكتشف المشروع" : "Explore project"}{" "}
          <ArrowUpRight size={17} />
        </span>
      </div>
    </Link>
  );
};
export function ProductGrid({ ids }: { ids?: ProductId[] }) {
  return (
    <div className="product-grid">
      {products
        .filter((p) => !ids || ids.includes(p.id))
        .map((p) => (
          <ProductCard product={p} key={p.id} />
        ))}
    </div>
  );
}
export function ClientGrid() {
  const { lang } = useLanguage();
  return (
    <div className="client-grid">
      {marketingClients.map((c) => (
        <article className="client-card" key={c.id}>
          <span className="site-eyebrow">{c.sector[lang]}</span>
          <h3>{c.name[lang]}</h3>
          <p>{c.work[lang]}</p>
        </article>
      ))}
    </div>
  );
}
