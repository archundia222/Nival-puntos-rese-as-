'use client';

import { useEffect, useRef, useState } from 'react';

const scenes = [
  { title: 'Te buscan. Que te elijan.', text: 'Tu ficha, tus fotos y tus reseñas pueden convertir una búsqueda en una visita.', kind: 'search' },
  { title: 'Una compra. Un punto más.', text: 'La visita se registra y la tarjeta digital muestra el progreso.', kind: 'points' },
  { title: 'Un premio más cerca. Un motivo para volver.', text: 'El cliente ve su meta y puede canjear su recompensa.', kind: 'reward' },
  { title: 'Una buena experiencia habla por ti.', text: 'Invita a dejar una reseña auténtica, libre y sin recompensas.', kind: 'ask' },
];

function SceneArt({ kind }: { kind: string }) {
  return (
    <div className={`nxStoryArt nxStoryArt--${kind}`} aria-hidden="true">
      <div className="nxStoryMap">
        <span className="nxStoryRoad nxStoryRoad--one" />
        <span className="nxStoryRoad nxStoryRoad--two" />
        <i className="nxStoryMapPin nxStoryMapPin--one" />
        <i className="nxStoryMapPin nxStoryMapPin--two" />
        <div className="nxStoryPlace"><b>N</b><span><small>NEGOCIO LOCAL</small><strong>Café Nival</strong><em>★★★★☆</em></span></div>
      </div>
      <div className="nxStoryPerson"><i/><b/><span/></div>
      <div className="nxStoryPhone"><div className="nxStoryPhoneTop"/><small>NIVAL PUNTOS</small><strong>3 de 4</strong><div className="nxStoryStampDots"><i/><i/><i/><i/></div><span>Premio por tus visitas</span></div>
      <div className="nxStoryReview"><b>★★★★★</b><span>Una gran experiencia</span><small>Opinión de una persona</small></div>
      <div className="nxStoryReward"><i>✓</i><span><small>PREMIO CANJEADO</small><b>Un café de la casa</b></span></div>
      <div className="nxStoryTime">UNA VISITA MÁS</div>
      <div className="nxStoryFinal"><span className="nxStoryFinalBrand">NIVAL</span><strong>Que te encuentren.<br/>Que vuelvan.</strong><small>Más confianza. Más motivos para regresar.</small><span className="nxStoryFinalArrow">↗</span></div>
    </div>
  );
}

export default function ScrollStory() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const distance = Math.max(1, section.offsetHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / distance));
        const next = Math.min(scenes.length - 1, Math.floor(progress * scenes.length));
        setActive(current => current === next ? current : next);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section id="como" className="nxStory nxStory--four" ref={sectionRef} aria-label="Cómo funciona Nival">
      <div className="nxFourInner">
        <div className="nxFourHeading"><div><span>CÓMO FUNCIONA</span><h2>En 4 pasos,<br/>más clientes<br/>para tu negocio.</h2></div><div className="nxFourControls"><button type="button" aria-label="Escena anterior" onClick={()=>setActive(v=>Math.max(0,v-1))}>←</button><button type="button" aria-label="Escena siguiente" onClick={()=>setActive(v=>Math.min(3,v+1))}>→</button></div></div>
        <div className="nxFourGrid">{scenes.map((scene,i)=><article key={scene.kind} className={i===active?'is-active':''} onMouseEnter={()=>setActive(i)}>
          <span className="nxFourNumber">0{i+1}.</span><h3>{['Te encuentran en Google.','Acumulan puntos.','Regresan por sus premios.','Comparten su experiencia.'][i]}</h3>
          <p>{['Mejora tu ficha y facilita que nuevos clientes te descubran.','Cada visita con compra suma un punto en su tarjeta digital.','Ver el avance puede motivar a completar una meta.','Invita a compartir una opinión libre y auténtica.'][i]}</p>
          <div className="nxFourArt"><SceneArt kind={scene.kind}/></div>
        </article>)}</div>
        <p className="nxFourFootnote">Ejemplos ilustrativos. Los puntos nunca se condicionan a reseñas.</p>
      </div>
    </section>
  );
}
