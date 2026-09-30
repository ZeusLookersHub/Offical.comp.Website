import React from 'react';
import { ArrowUpRight, Compass, Layers3, Megaphone, Smartphone } from 'lucide-react';
import type { ServiceId } from '../../data/services';

type Props = {
  service: {
    id: ServiceId;
    title: { en: string; ar: string };
    description: { en: string; ar: string };
    image: string | null;
    imageAlt: { en: string; ar: string };
    icon: string;
  };
  lang: 'en' | 'ar';
  active: boolean;
  onSelect: () => void;
};

const iconFor = (name: string) => {
  const props = { size: 22, strokeWidth: 1.7 };
  if (name === 'app') return <Smartphone {...props} />;
  if (name === 'strategy') return <Compass {...props} />;
  if (name === 'operations') return <Layers3 {...props} />;
  return <Megaphone {...props} />;
};

const ServiceCard: React.FC<Props> = ({ service, lang, active, onSelect }) => {
  const english = lang === 'en';
  return (
    <button
      type="button"
      className={\`service-card \${active ? 'is-active' : ''}\`}
      onClick={onSelect}
      aria-pressed={active}
      aria-controls="service-detail"
    >
      <span className="service-card__visual" aria-hidden="true">
        {service.image ? (
          <img
            src={service.image}
            alt=""
            onError={(event) => { event.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="service-card__fallback"><span>{iconFor(service.icon)}</span></span>
        )}
        <span className="service-card__shade" />
        <span className="service-card__icon">{iconFor(service.icon)}</span>
      </span>
      <span className="service-card__body">
        <span className="service-card__title">{english ? service.title.en : service.title.ar}</span>
        <span className="service-card__description">{english ? service.description.en : service.description.ar}</span>
        <span className="service-card__action">
          {english ? 'Explore service' : 'استكشف الخدمة'}
          <ArrowUpRight size={16} className="service-card__arrow" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
};

export default ServiceCard;
