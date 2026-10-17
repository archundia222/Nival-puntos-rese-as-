"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const industries = [
  ["industry-cafe.webp", "Cafeterías"],
  ["industry-taqueria.webp", "Taquerías"],
  ["landing/6107.webp", "Panaderías"],
  ["industry-restaurant.webp", "Restaurantes"],
  ["industry-barber.webp", "Barberías"],
  ["industry-salon.webp", "Salones"],
];

export default function LandingIndustryCarousel() {
  const rail = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setMotionAllowed(!preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const element = rail.current;
    if (!element || paused || !motionAllowed) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      const card = element.querySelector<HTMLElement>(".nvIndustryTile");
      if (!card) return;
      const step = card.getBoundingClientRect().width + 16;
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 8;
      element.scrollTo({ left: atEnd ? 0 : element.scrollLeft + step, behavior: "smooth" });
    }, 3800);
    return () => window.clearInterval(timer);
  }, [motionAllowed, paused]);

  const move = (direction: -1 | 1) => {
    const element = rail.current;
    const card = element?.querySelector<HTMLElement>(".nvIndustryTile");
    if (!element || !card) return;
    const step = card.getBoundingClientRect().width + 16;
    const max = element.scrollWidth - element.clientWidth;
    const next = direction > 0
      ? (element.scrollLeft + step >= max - 8 ? 0 : element.scrollLeft + step)
      : (element.scrollLeft <= 8 ? max : element.scrollLeft - step);
    element.scrollTo({ left: next, behavior: motionAllowed ? "smooth" : "auto" });
  };

  return (
    <section className="nvIndustrySection" id="giros" aria-labelledby="industry-title">
      <div className="nvContainer">
        <div className="nvIndustryHeading">
          <div>
            <span className="nvEyebrow">IDEAS PARA DISTINTOS MOSTRADORES</span>
            <h2 id="industry-title">De la cafetería a la barbería.</h2>
          </div>
          <div className="nvIndustryControls">
            <small>{motionAllowed ? "Imágenes ilustrativas" : "Explora con las flechas"}</small>
            <button type="button" aria-label="Negocio anterior" onClick={() => move(-1)}>←</button>
            <button type="button" aria-label="Siguiente negocio" onClick={() => move(1)}>→</button>
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused || !motionAllowed}
              disabled={!motionAllowed}
            >
              {!motionAllowed ? "Movimiento reducido" : paused ? "Reanudar" : "Pausar"}
            </button>
          </div>
        </div>
        <div
          className="nvIndustryRail"
          ref={rail}
          aria-label="Ejemplos de giros donde usar Nival"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
          }}
        >
          {industries.map(([src, label], index) => (
            <article className={`nvIndustryTile nvIndustryTile${index + 1}`} key={label}>
              <div>
                <Image src={`/assets/img/${src}`} alt={`${label}: ejemplo ilustrativo de negocio`} fill sizes="(max-width: 760px) 72vw, 28vw" />
              </div>
              <b>{label}</b>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
