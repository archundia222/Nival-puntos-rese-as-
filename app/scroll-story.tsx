'use client';

import { useEffect, useRef, useState } from 'react';

const scenes = [
  { title: 'Tus clientes te buscan en Google Maps.', text: 'Antes de conocer tu negocio, muchas personas buscan opciones cerca de ellas.', kind: 'search' },
  { title: 'Eligen según las estrellas y los comentarios.', text: 'Una ficha clara y reseñas auténticas ayudan a decidir dónde ir.', kind: 'reviews' },
  { title: 'La confianza los acerca a tu negocio.', text: 'La persona llega porque encontró información que le dio confianza.', kind: 'visit' },
  { title: 'Después de una buena visita, puedes pedir una reseña.', text: 'La invitación es amable y libre: cada cliente decide si quiere compartir su experiencia.', kind: 'ask' },
  { title: 'Una reseña honesta puede ayudar a otras personas.', text: 'Los comentarios reales dan contexto a quienes todavía están buscando.', kind: 'growth' },
  { title: 'Los puntos se ganan por visitar y comprar.', text: 'El personal registra una visita válida. Los puntos no dependen de dejar una reseña.', kind: 'points' },
  { title: 'Tres días después… vuelve.', text: 'En cada visita válida, el equipo registra un punto y el progreso se acerca a una meta.', kind: 'progress' },
  { title: 'Llega el momento de canjear su premio.', text: 'El premio corresponde al avance en puntos, sin relación con reseñas ni calificaciones.', kind: 'reward' },
  { title: 'Una buena experiencia se comparte.', text: 'El cliente vuelve, disfruta y puede recomendar el negocio a más personas.', kind: 'recommend' },
  { title: 'Nival ayuda a que te encuentren y a que vuelvan.', text: 'Ver el progreso hacia una meta puede animar a continuar; una experiencia recíproca ayuda a construir una relación. No prometemos resultados numéricos.', kind: 'cycle' },
];

function SceneArt({ kind }: { kind: string }) {
  return (
    <div className={`nxStoryArt nxStoryArt--${kind}`} aria-hidden="true">
      <div className="nxStoryMap">
        <span className="nxStoryRoad nxStoryRoad--one" />
        <span className="nxStoryRoad nxStoryRoad--two" />
        <i className="nxStoryPin nxStoryPin--one" />
        <i className="nxStoryPin nxStoryPin--two" />
        <div className="nxStoryPlace"><b>N</b><span><small>NEGOCIO LOCAL</small><strong>Café Nival</strong><em>★★★★☆</em></span></div>
      </div>
      <div className="nxStoryPerson"><i/><b/><span/></div>
      <div className="nxStoryPhone"><div className="nxStoryPhoneTop"/><small>NIVAL PUNTOS</small><strong>3 de 4</strong><div className="nxStoryStampDots"><i/><i/><i/><i/></div><span>Premio por tus visitas</span></div>
      <div className="nxStoryReview"><b>★★★★★</b><span>Una gran experiencia</span><small>Opinión de una persona</small></div>
      <div className="nxStoryReward"><i>✓</i><span><small>PREMIO CANJEADO</small><b>Un café de la casa</b></span></div>
      <div className="nxStoryTime">3 días después…</div>
      <div className="nxStoryCycle"><i/><i/><i/><b>+</b></div>
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
