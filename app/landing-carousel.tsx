'use client';

import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const cards = [
  { name: 'CAFÉ LUCERO', type: 'Cafetería', tone: 'coffee', filled: 3 },
  { name: 'BARBERÍA NORTE', type: 'Barbería', tone: 'barber', filled: 5 },
  { name: 'TACOS LA ESQUINA', type: 'Taquería', tone: 'taco', filled: 4 },
  { name: 'CASA LILA', type: 'Estética', tone: 'beauty', filled: 2 },
  { name: 'SONRISA CLARA', type: 'Consultorio dental', tone: 'dental', filled: 6 },
  { name: 'NUBE DE NIEVE', type: 'Heladería', tone: 'icecream', filled: 3 },
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
          {[...cards, ...cards].map((card, index) => <article className={`nvLoyaltyCard tone-${card.tone}`} key={`${card.tone}-${index}`} aria-hidden={index >= cards.length}>
            <span className="nvCardName">{card.name}</span><small>Tarjeta de puntos · {card.type}</small>
            <div className="nvStampGrid" aria-hidden="true">{Array.from({ length: 8 }, (_, dot) => <i className={dot < card.filled ? 'is-filled' : ''} key={dot}>{dot < card.filled ? '✦' : ''}</i>)}</div>
            <span className="nvCardFoot">Tu próxima visita cuenta <b>→</b></span>
          </article>)}
        </div>
      </div>
      <p className="nvCarouselHint">Desliza para explorar más ejemplos</p>
    </>
  );
}
