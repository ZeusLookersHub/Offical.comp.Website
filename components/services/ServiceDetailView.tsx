import React from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays,
  ChartNoAxesCombined, CircleDollarSign, FileText, Layers3, Megaphone,
  MessageCircle, Palette, PenTool, RefreshCw, Search, ShieldCheck,
  Sparkles, Target, UsersRound, WandSparkles
} from 'lucide-react';
import type { MarketingTabId, ServiceId } from '../../data/services';
import { marketingDetails, marketingServiceIntro, marketingTabs, portfolioProjects, services } from '../../data/services';

type Lang = 'en' | 'ar';
type Props = { serviceId: ServiceId; lang: Lang; activeTab: MarketingTabId; onTabChange: (tab: MarketingTabId) => void; onBack: () => void };

const benefitIcons = [Target, Palette, PenTool, BookOpen, FileText, Sparkles, CalendarDays, MessageCircle, UsersRound, ChartNoAxesCombined, Search, CircleDollarSign, RefreshCw, ShieldCheck, WandSparkles, Layers3];
const IconForTab: Record<MarketingTabId, React.ElementType> = {
  branding: Palette, digital: ChartNoAxesCombined, media: Target, work: Layers3
};

const ServiceDetailView: React.FC<Props> = ({ serviceId, lang, activeTab, onTabChange, onBack }) => {
  const english = lang === 'en';
  const service = services.find((item) => item.id === serviceId)!;
  const tabs = serviceId === 'marketing' ? marketingTabs : [];
  const detail = activeTab !== 'work' ? marketingDetails[activeTab] : null;
  const ActiveIcon = IconForTab[activeTab];

  return (
    <section className="service-detail" id="service-detail" aria-live="polite" aria-labelledby="service-detail-title">
      <button className="service-back" type="button" onClick={onBack}>
        {english ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        <span>{english ? 'All services' : 'كل الخدمات'}</span>
      </button>
      <div className="service-detail__hero">
        <div className="service-detail__copy">
          <p className="service-detail__eyebrow">{english ? 'LOOKERSHUB / SERVICES' : 'لوكرز هب / الخدمات'}</p>
          <h2 id="service-detail-title">{english ? service.title.en : service.title.ar}</h2>
          <p>{english ? service.description.en : service.description.ar}</p>
          {serviceId === 'marketing' && (
            <p className="service-detail__intro">{english ? marketingServiceIntro.en : marketingServiceIntro.ar}</p>
          )}
        </div>
        <div className={`service-detail__image service-detail__image--${serviceId}`} aria-hidden="true">
          {service.image && <img src={service.image} alt="" />}
          <span className="service-detail__image-mark"><Megaphone size={26} /></span>
        </div>
      </div>

      {serviceId === 'marketing' ? (
        <>
          <div className="marketing-tabs" role="tablist" aria-label={english ? 'Marketing services' : 'خدمات التسويق'}>
            {tabs.map((tab) => {
              const Icon = IconForTab[tab.id];
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`marketing-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls="marketing-tab-panel"
                  className={`marketing-tab ${selected ? 'is-active' : ''}`}
                  onClick={() => onTabChange(tab.id)}
                >
                  <Icon size={19} aria-hidden="true" />
                  <span>{english ? tab.title.en : tab.title.ar}</span>
                </button>
              );
            })}
          </div>

          <div key={activeTab} className="marketing-panel" id="marketing-tab-panel" role="tabpanel" aria-labelledby={`marketing-tab-${activeTab}`}>
            {activeTab === 'work' ? (
              <>
                <div className="marketing-panel__heading">
                  <div>
                    <p className="service-detail__eyebrow">{english ? 'SELECTED WORK' : 'من أعمالنا'}</p>
                    <h3>{english ? 'Built by LookersHub' : 'مشاريع من تنفيذ LookersHub'}</h3>
                    <p>{english ? 'A selection from our own portfolio. These are in-house products, not client case studies.' : 'نماذج من محفظتنا الخاصة. هذه منتجات نفذها فريقنا وليست دراسات حالة لعملاء.'}</p>
                  </div>
                </div>
                <div className="work-grid">
                  {portfolioProjects.map((project) => (
                    <article className="work-card" key={project.id}>
                      <div className="work-card__image">
                        <img src={project.image} alt="" loading="lazy" />
                        <span>{english ? project.tag.en : project.tag.ar}</span>
                      </div>
                      <div className="work-card__copy">
                        <p>{english ? project.subtitle.en : project.subtitle.ar}</p>
                        <h4>{project.title}</h4>
                        <p>{english ? project.description.en : project.description.ar}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : detail ? (
              <>
                <div className="marketing-panel__heading">
                  <div>
                    <p className="service-detail__eyebrow">{english ? detail.intro.en : detail.intro.ar}</p>
                    <h3>{english ? detail.heading.en : detail.heading.ar}</h3>
                    <p>{english ? detail.description.en : detail.description.ar}</p>
                  </div>
                  <span className="marketing-panel__mark"><ActiveIcon size={27} /></span>
                </div>
                <div className="deliverable-grid">
                  {detail.deliverables.map((item, index) => {
                    const Icon = benefitIcons[index % benefitIcons.length];
                    return (
                      <div className="deliverable" key={item.en}>
                        <span className="deliverable__number">{String(index + 1).padStart(2, '0')}</span>
                        <Icon size={19} aria-hidden="true" />
                        <span>{english ? item.en : item.ar}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : (
        <div key={serviceId} className="service-coming-soon">
          <span className="marketing-panel__mark"><IconForTab.work size={25} /></span>
          <div>
            <p className="service-detail__eyebrow">{english ? 'OUR APPROACH' : 'منهج عملنا'}</p>
            <h3>{english ? 'A clear path from your goals to launch.' : 'منهج واضح يحوّل أهدافك إلى خطوات قابلة للتنفيذ.'}</h3>
            <p>{english ? 'We shape the work to fit your product, team, and stage—then move from direction to delivery together.' : 'نصمم مسار العمل بما يناسب منتجك وفريقك ومرحلتك، ثم ننتقل معًا من تحديد الاتجاه إلى التنفيذ.'}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServiceDetailView;
