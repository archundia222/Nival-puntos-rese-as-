'use client';

import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

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
  const paused = useRef(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  useEffect(() => {
    const node = viewport.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const advance = () => {
      if (paused.current || dragging.current) return;
      const first = node.querySelector<HTMLElement>('.nvIndustryPhotoCard');
      const second = first?.nextElementSibling as HTMLElement | null;
      const step = first && second
        ? second.offsetLeft - first.offsetLeft
        : first?.getBoundingClientRect().width ?? 0;
      const half = node.scrollWidth / 2;
      if (step <= 0 || half <= step) return;

      let current = node.scrollLeft;
      if (current >= half) {
        node.scrollLeft = current - half;
        current = node.scrollLeft;
      }

      const next = current + step;
      if (next >= half - 1) {
        // The duplicated first card is visually identical to the initial position.
        node.scrollLeft = 0;
      } else {
        node.scrollTo({ left: next, behavior: 'smooth' });
      }
    };

    const timer = window.setInterval(advance, 4200);
    return () => window.clearInterval(timer);
  }, []);

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') { paused.current = true; return; }
    const node = viewport.current;
    if (!node) return;
    dragging.current = true;
    paused.current = true;
    startX.current = event.clientX;
    startScroll.current = node.scrollLeft;
    node.setPointerCapture(event.pointerId);
  }

  function drag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current || !viewport.current) return;
    viewport.current.scrollLeft = startScroll.current - (event.clientX - startX.current);
  }

  function endDrag() { dragging.current = false; paused.current = false; }

  return (
    <>
      <p className="nvIllustrationLabel">EJEMPLOS ILUSTRATIVOS</p>
      <div className="nvCarouselViewport" ref={viewport} role="region" aria-label="Fotos de negocios de distintas industrias" onPointerEnter={() => { paused.current = true; }} onPointerLeave={endDrag} onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag} onTouchEnd={endDrag} onFocusCapture={() => { paused.current = true; }} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) paused.current = false; }}>
        <div className="nvCarouselTrack">
          {[...cards, ...cards].map((card, index) => <article className="nvIndustryPhotoCard" id={index < cards.length ? card.id : undefined} key={`${card.id}-${index}`} aria-hidden={index >= cards.length}>
            <img src={`/assets/img/${card.image}`} alt={index < cards.length ? card.alt : ''} loading="lazy" draggable={false} />
            <div className="nvIndustryPhotoCaption"><small>GIRO LOCAL</small><h3>{card.type}</h3><span>Un programa hecho para volver <b aria-hidden="true">↗</b></span></div>
          </article>)}
        </div>
      </div>
      <p className="nvCarouselHint">Desliza para explorar más ejemplos</p>
    </>
  );
}
