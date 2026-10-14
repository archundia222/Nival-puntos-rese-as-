'use client';

import { useEffect, useRef } from 'react';

const cards = [
  { id: 'cafeterias', type: 'Cafeterías', image: 'industry-cafe.webp', alt: 'Interior cálido de una cafetería local' },
  { id: 'restaurantes', type: 'Restaurantes', image: 'industry-restaurant.webp', alt: 'Mesa servida en un restaurante local' },
  { id: 'taquerias', type: 'Taquerías', image: 'industry-taqueria.webp', alt: 'Preparación de tacos en una taquería' },
  { id: 'barberias', type: 'Barberías', image: 'industry-barber.webp', alt: 'Barbero atendiendo a un cliente' },
  { id: 'esteticas', type: 'Estéticas', image: 'industry-salon.webp', alt: 'Espacio de atención de una estética' },
  { id: 'consultorios', type: 'Consultorios', image: 'industry-clinic.webp', alt: 'Interior de un consultorio' },
  { id: 'heladerias', type: 'Heladerías', image: 'industry-ice-cream.webp', alt: 'Vitrina de una heladería local' },
];

export default function IndustryCarousel() {
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = viewport.current;
    const track = node?.querySelector<HTMLElement>('.nvCarouselTrack');
    if (!node || !track) return;

    let animation: Animation | null = null;
    const start = () => {
      const distance = track.scrollWidth / 2;
      if (distance <= 0) return;

      animation?.cancel();
      const speed = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 12 : 24;
      animation = track.animate(
        [
          { transform: 'translate3d(0, 0, 0)' },
          { transform: `translate3d(-${distance}px, 0, 0)` },
        ],
        { duration: (distance / speed) * 1000, easing: 'linear', iterations: Infinity },
      );
    };

    start();
    const observer = new ResizeObserver(start);
    observer.observe(node);

    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, []);

  return (
    <>
      <p className="nvIllustrationLabel">EJEMPLOS ILUSTRATIVOS</p>
      <div className="nvCarouselViewport" ref={viewport} role="region" aria-label="Fotos de negocios de distintas industrias">
        <div className="nvCarouselTrack">
          {[...cards, ...cards].map((card, index) => <article className="nvIndustryPhotoCard" id={index < cards.length ? card.id : undefined} key={`${card.id}-${index}`} aria-hidden={index >= cards.length}>
            <img src={`/assets/img/${card.image}`} alt={index < cards.length ? card.alt : ''} loading="lazy" draggable={false} />
            <div className="nvIndustryPhotoCaption"><small>GIRO LOCAL</small><h3>{card.type}</h3><span>Un programa hecho para volver <b aria-hidden="true">↗</b></span></div>
          </article>)}
        </div>
      </div>
      <p className="nvCarouselHint">Los ejemplos avanzan automáticamente</p>
    </>
  );
}
