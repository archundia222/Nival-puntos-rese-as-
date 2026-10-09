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
    <section id="como" className="nxStory" ref={sectionRef} aria-label="Cómo funciona Nival">
      <div className="nxStoryPin">
        <div className="nxStoryProgress" role="progressbar" aria-label="Progreso de la historia" aria-valuemin={1} aria-valuemax={scenes.length} aria-valuenow={active + 1}>
          <span style={{ transform: `scaleX(${(active + 1) / scenes.length})` }} />
        </div>
        <p className="nxStoryCounter" aria-live="polite">ESCENA {String(active + 1).padStart(2, '0')} / {scenes.length}</p>
        <div className="nxStoryLayout">
          <div className="nxStoryCopy">
            <span className="nxStoryEyebrow">DE LA BÚSQUEDA A LA SIGUIENTE VISITA</span>
            <div className="nxStoryScenes">
              {scenes.map((scene, index) => (
                <article className={`nxStoryScene ${index === active ? 'is-active' : ''}`} key={scene.kind} aria-hidden={index !== active}>
                  <h2>{scene.title}</h2>
                  <p>{scene.text}</p>
                </article>
              ))}
            </div>
            <span className="nxStoryHint">Sigue bajando para continuar <b aria-hidden="true">↓</b></span>
          </div>
          <SceneArt kind={scenes[active].kind} />
        </div>
        <div className="nxStoryDots" aria-hidden="true">{scenes.map((scene, index) => <i className={index <= active ? 'is-active' : ''} key={scene.kind}/>)}</div>
      </div>
      <div className="nxStoryStatic" aria-label="La historia de Nival">
        {scenes.map((scene, index) => <article key={scene.kind}><span>0{index + 1}</span><h2>{scene.title}</h2><p>{scene.text}</p><SceneArt kind={scene.kind}/></article>)}
      </div>
    </section>
  );
}
