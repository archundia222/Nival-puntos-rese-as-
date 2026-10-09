"use client";

import { useRef } from 'react';
import LandingIcon from './landing-icon';

type Step = string[];

export default function LandingSteps({ steps }: { steps: Step[] }) {
  const rail = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const element = rail.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>('.nvStep');
    const distance = card ? card.getBoundingClientRect().width + 12 : element.clientWidth;
    element.scrollBy({ left: direction * distance, behavior: 'smooth' });
  }

  return (
    <section className="nvSection nvHow" id="como">
      <div className="nvHowHead">
        <div className="nvSectionIntro">
          <span className="nvEyebrow">ASÍ FUNCIONA</span>
          <h2>Una experiencia sencilla para volver.</h2>
          <p>Desde el primer escaneo hasta el siguiente premio, cada paso tiene un lugar claro.</p>
        </div>
        <div className="nvStepControls" aria-label="Navegar por los pasos">
          <button type="button" aria-label="Ver pasos anteriores" onClick={() => move(-1)}>
            <LandingIcon name="arrow-left" />
          </button>
          <button type="button" aria-label="Ver pasos siguientes" onClick={() => move(1)}>
            <LandingIcon name="arrow" />
          </button>
        </div>
      </div>
      <div className="nvSteps" ref={rail} aria-label="Cuatro pasos para usar Nival">
        {steps.map(([n, icon, title, body, image, alt]) => (
          <article className="nvStep" key={n}>
            <span className="nvStepTop">{n}<LandingIcon name={icon} /></span>
            <h3>{title}</h3>
            <p>{body}</p>
            <img className="nvStepImage" src={image} alt={alt} loading="lazy" />
          </article>
        ))}
      </div>
    </section>
  );
}
