'use client';

import { useEffect, useRef, type PointerEvent } from 'react';
import LandingIcon from './landing-icon';

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
  const animationRef = useRef<Animation | null>(null);
  const drag = useRef<{ x: number; time: number } | null>(null);
  const speed = useRef(100);

  useEffect(() => {
    const node = viewport.current;
    const track = node?.querySelector<HTMLElement>('.nvCarouselTrack');
    if (!node || !track) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = () => {
      const distance = track.scrollWidth / 2;
      if (distance <= 0) return;

      animationRef.current?.cancel();
      if (reducedMotion.matches) return;
      speed.current = 100;
      animationRef.current = track.animate(
        [
          { transform: 'translate3d(0, 0, 0)' },
          { transform: `translate3d(-${distance}px, 0, 0)` },
        ],
        { duration: (distance / speed.current) * 1000, easing: 'linear', iterations: Infinity },
      );
    };

    start();
    const observer = new ResizeObserver(start);
    observer.observe(node);
    const onMotionPreferenceChange = () => reducedMotion.matches ? animationRef.current?.cancel() : start();
    reducedMotion.addEventListener('change', onMotionPreferenceChange);

    return () => {
      observer.disconnect();
      reducedMotion.removeEventListener('change', onMotionPreferenceChange);
      animationRef.current?.cancel();
    };
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const animation = animationRef.current;
    if (!animation) return;
    drag.current = { x: event.clientX, time: Number(animation.currentTime) || 0 };
    animation.pause();
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    const animation = animationRef.current;
    if (!start || !animation) return;
    animation.currentTime = Math.max(0, start.time - ((event.clientX - start.x) / speed.current) * 1000);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    animationRef.current?.play();
  };

  const move = (direction: -1 | 1) => {
    const animation = animationRef.current;
    const element = viewport.current;
    if (!animation || !element) return;
    const card = element.querySelector<HTMLElement>('.nvIndustryPhotoCard');
    const step = (card?.getBoundingClientRect().width || element.clientWidth) + 18;
    const cycle = (element.querySelector<HTMLElement>('.nvCarouselTrack')?.scrollWidth || 0) / 2;
    if (!cycle) return;
    const current = Number(animation.currentTime) || 0;
    const duration = Number(animation.effect?.getTiming().duration) || 1;
    const next = (current + direction * (step / 100) * 1000 + duration) % duration;
    animation.currentTime = next;
  };

  return (
    <>
      <p className="nvIllustrationLabel">EJEMPLOS ILUSTRATIVOS</p>
      <div className="nvCarouselControls"><span>Desliza para explorar</span><div><button type="button" aria-label="Ver giros anteriores" onClick={() => move(-1)}><LandingIcon name="arrow-left" /></button><button type="button" aria-label="Ver más giros" onClick={() => move(1)}><LandingIcon name="arrow" /></button></div></div>
      <div className="nvCarouselViewport" ref={viewport} role="region" aria-label="Fotos de negocios de distintas industrias" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onMouseEnter={() => animationRef.current?.pause()} onMouseLeave={() => animationRef.current?.play()} onFocus={() => animationRef.current?.pause()} onBlur={() => animationRef.current?.play()}>
        <div className="nvCarouselTrack">
          {[...cards, ...cards].map((card, index) => <article className="nvIndustryPhotoCard" id={index < cards.length ? card.id : undefined} key={`${card.id}-${index}`} aria-hidden={index >= cards.length}>
            <img src={`/assets/img/${card.image}`} alt={index < cards.length ? card.alt : ''} loading="lazy" draggable={false} />
            <div className="nvIndustryPhotoCaption"><small>GIRO LOCAL</small><h3>{card.type}</h3><span>Un programa hecho para volver</span></div>
          </article>)}
        </div>
      </div>
      <p className="nvCarouselHint">Imágenes de referencia</p>
    </>
  );
}
