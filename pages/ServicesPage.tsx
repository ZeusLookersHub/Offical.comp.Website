import React, { useEffect, useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { services, type MarketingTabId, type ServiceId } from '../data/services';
import ServiceCard from '../components/services/ServiceCard';
import ServiceDetailView from '../components/services/ServiceDetailView';
import './ServicesPage.css';

const ServicesPage: React.FC = () => {
  const { lang } = useLanguage();
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null);
  const [activeTab, setActiveTab] = useState<MarketingTabId>('branding');
  const english = lang === 'en';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const selectService = (id: ServiceId) => {
    setSelectedService(id);
    setActiveTab('branding');
    window.requestAnimationFrame(() => {
      document.getElementById('service-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="services-page">
      <div className="services-page__inner">
        <header className="services-heading">
          <p className="services-heading__eyebrow">{english ? 'What we do' : 'ما نقدّمه'}</p>
          <h1>{english ? 'Services' : 'خدماتنا'}</h1>
          <p>{english ? 'Digital solutions shaped around your next stage of growth.' : 'حلول رقمية متكاملة تدعم خطوتك القادمة نحو النمو.'}</p>
        </header>

        <div className="service-card-grid" aria-label={english ? 'Our services' : 'خدماتنا'}>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              lang={lang}
              active={selectedService === service.id}
              onSelect={() => selectService(service.id)}
            />
          ))}
        </div>

        {selectedService && (
          <ServiceDetailView
            key={selectedService}
            serviceId={selectedService}
            lang={lang}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onBack={() => setSelectedService(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ServicesPage;
