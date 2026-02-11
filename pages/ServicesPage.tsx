import React from 'react';

const services = [
  {
    title: 'App & Game Development',
    description:
      'We design and develop high-performance mobile applications and games, from idea to launch.',
    image: 'https://images.unsplash.com/photo-1769109002985-c0ff65466052?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    title: 'Strategy & Planning',
    description:
      'We help you define product vision, technical strategy, and execution roadmap.',
    image: '/services/service-strategy.png',
  },
  {
    title: 'Operations & Systems',
    description:
      'We build scalable systems, internal tools, and workflows to support growth.',
    image: '/services/service-operations.png',
  },
  {
    title: 'Marketing & Growth',
    description:
      'We craft digital marketing strategies focused on growth, performance, and conversion.',
    image: 'https://drive.google.com/file/d/11G5A8mhGw_tupSfiJLI6wqwA72_OXaLu/view?usp=drive_link',
  },
];

const ServicesPage: React.FC = () => {
  return (
    <section
      style={{
        padding: '80px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: '42px',
          marginBottom: '48px',
          textAlign: 'center',
        }}
      >
        Our Services
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '32px',
        }}
      >
        {services.map((service) => (
          <div
            key={service.title}
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#0b0b0b',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <img
              src={service.image}
              alt={service.title}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                display: 'block',
              }}
            />

            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '12px' }}>{service.title}</h3>
              <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServicesPage;
