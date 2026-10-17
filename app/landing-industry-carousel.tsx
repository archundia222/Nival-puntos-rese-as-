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
  const [motionAllowed, setMotionAllowed] = useState(false);

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
      const firstCard = element.querySelector<HTMLElement>(".nvIndustryTile");
      if (!firstCard) return;
      const step = firstCard.getBoundingClientRect().width + 16;
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 8;
      element.scrollTo({ left: atEnd ? 0 : element.scrollLeft + step, behavior: "smooth" });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [motionAllowed, paused]);

  return (
    <section className="nvIndustrySection" id="giros" aria-labelledby="industry-title">
      <div className="nvContainer">
        <div className="nvIndustryHeading">
          <div>
            <span className="nvEyebrow">IDEAS PARA DISTINTOS MOSTRADORES</span>
            <h2 id="industry-title">De la cafetería a la barbería.</h2>
          </div>
          <div className="nvIndustryControls">
            <small>Imágenes ilustrativas</small>
            <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
              {paused ? "Reanudar" : "Pausar"} carrusel
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
