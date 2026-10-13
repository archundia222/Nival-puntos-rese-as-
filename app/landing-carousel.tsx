'use client';

import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const cards = [
  { type: 'Cafetería', reward: 'Café de la casa', filled: 5 },
  { type: 'Barbería', reward: 'Servicio de cortesía', filled: 4 },
  { type: 'Taquería', reward: 'Orden de la casa', filled: 6 },
  { type: 'Estética', reward: 'Tratamiento elegido', filled: 3 },
  { type: 'Consultorio', reward: 'Beneficio para tu próxima visita', filled: 4 },
  { type: 'Heladería', reward: 'Helado sencillo', filled: 5 },
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
    let frame = 0;
    let previous = 0;
    const tick = (now: number) => {
      if (!previous) previous = now;
      const elapsed = Math.min(40, now - previous);
      previous = now;
      if (!paused.current && !dragging.current) {
        const half = node.scrollWidth / 2;
        if (half > 0) {
          node.scrollLeft += elapsed * 0.018;
          if (node.scrollLeft >= half) node.scrollLeft -= half;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
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

  const setPaused = (value: boolean) => { paused.current = value; };

  return (
    <>
      <p className="nvIllustrationLabel">EJEMPLOS ILUSTRATIVOS</p>
      <div className="nvCarouselViewport" ref={viewport} role="region" aria-label="Ejemplos de tarjetas de puntos para distintos negocios" onPointerEnter={() => setPaused(true)} onPointerLeave={endDrag} onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)} onTouchEnd={endDrag}>
        <div className="nvCarouselTrack">
          {[...cards, ...cards].map((card, index) => <article className="nvLoyaltyCard tone-classic" key={`${card.type}-${index}`} aria-hidden={index >= cards.length}>
            <div className="nvCardBrand"><span>N</span><small>PROGRAMA DE PUNTOS</small></div>
            <div className="nvCardHeading"><b>Tu negocio</b><small>{card.type}</small></div>
            <div className="nvStampGrid" aria-label={`${card.filled} de 8 visitas registradas`}>{Array.from({ length: 8 }, (_, dot) => <i className={dot < card.filled ? 'is-filled' : ''} key={dot}>{dot < card.filled ? '✓' : ''}</i>)}</div>
            <div className="nvCardProgress"><span>{card.filled} de 8 visitas</span><i><b style={{width:`${card.filled / 8 * 100}%`}} /></i></div>
            <div className="nvCardFoot"><small>Premio</small><b>{card.reward}</b></div>
          </article>)}
        </div>
      </div>
      <p className="nvCarouselHint">Desliza para explorar más ejemplos</p>
    </>
  );
}
