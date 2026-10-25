import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ArrowUpRight } from "lucide-react";
import {
  type MarketingTabId,
  type ServiceId,
  marketingDetails,
  marketingTabs,
  services,
} from "../../data/services";
import { products, serviceWorkflow } from "../../data/site";
import { ProductGrid, ClientGrid } from "../Portfolio";
type Props = {
  serviceId: ServiceId;
  lang: "en" | "ar";
  activeTab: MarketingTabId;
  onTabChange: (tab: MarketingTabId) => void;
  onBack: () => void;
};
const ServiceDetailView: React.FC<Props> = ({
  serviceId,
  lang,
  activeTab,
  onTabChange,
  onBack,
}) => {
  const ar = lang === "ar";
  const service = services.find((s) => s.id === serviceId)!;
  const workflow = serviceWorkflow[serviceId];
  const detail = activeTab !== "work" ? marketingDetails[activeTab] : null;
  const related = products.filter((p) => p.service === serviceId);
  return (
    <section
      className="service-detail"
      id="service-detail"
      aria-labelledby="service-detail-title"
    >
      <button className="service-back" type="button" onClick={onBack}>
        {ar ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}{" "}
        {ar ? "كل الخدمات" : "All services"}
      </button>
      <div className="service-detail__hero">
        <div className="service-detail__copy">
          <p className="site-eyebrow">LOOKERSHUB / SERVICES</p>
          <h2 id="service-detail-title">{service.title[lang]}</h2>
          <p>{service.description[lang]}</p>
          <Link
            className="site-button site-button--outline"
            to={`/start-your-project?service=${serviceId}`}
          >
            {ar ? "اطلب الخدمة" : "Discuss this service"}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        {service.image && (
          <div className="service-detail__image">
            <img src={service.image} alt="" />
          </div>
        )}
      </div>
      <div className="service-workflow">
        <h3>{ar ? "خطوة بخطوة" : "Step by step"}</h3>
        <ol className="workflow-grid">
          {workflow.steps.map((s, i) => (
            <li key={s.en}>
              <span>0{i + 1}</span>
              <p>{s[lang]}</p>
            </li>
          ))}
        </ol>
        <h3>
          {ar
            ? "المخرجات حسب نطاق مشروعك"
            : "Deliverables shaped to your scope"}
        </h3>
        <ul className="detail-list">
          {workflow.outputs.map((o) => (
            <li key={o.en}>
              <Check size={17} />
              {o[lang]}
            </li>
          ))}
        </ul>
      </div>
      {serviceId === "marketing" && (
        <>
          <div
            className="marketing-tabs"
            role="tablist"
            aria-label={ar ? "خدمات التسويق" : "Marketing services"}
          >
            {marketingTabs.map((t, i) => (
              <button
                type="button"
                key={t.id}
                className={`marketing-tab ${activeTab === t.id ? "is-active" : ""}`}
                role="tab"
                id={`marketing-tab-${t.id}`}
                aria-selected={activeTab === t.id}
                aria-controls="marketing-tab-panel"
                tabIndex={activeTab === t.id ? 0 : -1}
                onClick={() => onTabChange(t.id)}
                onKeyDown={(e) => {
                  const dir = ar ? -1 : 1;
                  const delta =
                    e.key === "ArrowRight"
                      ? dir
                      : e.key === "ArrowLeft"
                        ? -dir
                        : 0;
                  if (delta || e.key === "Home" || e.key === "End") {
                    e.preventDefault();
                    const index =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? 3
                          : (i + delta + 4) % 4;
                    onTabChange(marketingTabs[index].id);
                    document
                      .getElementById(
                        `marketing-tab-${marketingTabs[index].id}`,
                      )
                      ?.focus();
                  }
                }}
              >
                {t.title[lang]}
              </button>
            ))}
          </div>
          <div
            className="marketing-panel"
            role="tabpanel"
            id="marketing-tab-panel"
            aria-labelledby={`marketing-tab-${activeTab}`}
            tabIndex={0}
          >
            {activeTab === "work" ? (
              <>
                <div className="section-heading">
                  <h3>
                    {ar
                      ? "شركات اشتغلنا معاها"
                      : "Companies we have worked with"}
                  </h3>
                  <p>
                    {ar
                      ? "شركات قدمنا لها خدمات في التسويق."
                      : "Companies we have supported with marketing services."}
                  </p>
                </div>
                <ClientGrid />
              </>
            ) : detail ? (
              <>
                <div className="marketing-panel__heading">
                  <div>
                    <p className="site-eyebrow">{detail.intro[lang]}</p>
                    <h3>{detail.heading[lang]}</h3>
                    <p>{detail.description[lang]}</p>
                  </div>
                </div>
                <ul className="detail-list">
                  {detail.deliverables.map((d) => (
                    <li key={d.en}>
                      <Check size={17} />
                      {d[lang]}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </>
      )}
      {related.length > 0 && (
        <div className="related-products">
          <div className="section-heading">
            <h3>
              {ar ? "من منتجاتنا في المجال ده" : "Our products in this field"}
            </h3>
          </div>
          <ProductGrid ids={related.map((p) => p.id)} />
        </div>
      )}
    </section>
  );
};

export default ServiceDetailView;
