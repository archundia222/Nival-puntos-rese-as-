const steps = [
  { number:'01', kicker:'EMPEZAMOS CONTIGO', title:'Tu negocio merece clientes que regresen.', text:'Nos cuentas qué vendes y cómo atiendes. Te ayudamos a elegir un programa de lealtad que sea sencillo para ti y atractivo para tus clientes.', tags:['Sin complicaciones','Configuración acompañada'], art:'start' },
  { number:'02', kicker:'UN GESTO SENCILLO', title:'Un QR. Una razón para volver.', text:'Tus clientes consultan sus puntos desde su celular. El QR digital está incluido; la tarjeta NFC física es opcional y se cotiza aparte.', tags:['Sin descargar una app','QR incluido'], art:'qr' },
  { number:'03', kicker:'CADA VISITA CUENTA', title:'Haz visible el valor de regresar.', text:'Tu equipo registra visitas válidas con compra. Cada cliente ve cuánto le falta para alcanzar un premio que tú decides.', tags:['Puntos por compra','Premios personalizados'], art:'points' },
  { number:'04', kicker:'TODO EN ORDEN', title:'Conoce mejor a tus clientes.', text:'Consulta visitas, puntos, canjes e historial en un mismo panel. Puedes asignar accesos a tu equipo para registrar las visitas.', tags:['Panel del negocio','Historial y canjes'], art:'panel' },
  { number:'05', kicker:'CONFIANZA QUE SE COMPARTE', title:'Que una buena experiencia hable por ti.', text:'Invita a dejar reseñas auténticas y voluntarias en Google. Con los planes de reseñas, Nival te acompaña en su seguimiento y preparación de respuestas.', tags:['Reseñas sin incentivos','Acompañamiento humano'], art:'reviews' },
  { number:'06', kicker:'EL SIGUIENTE PASO', title:'Construye relaciones, no solo ventas.', text:'Puntos para fomentar nuevas visitas y reseñas honestas para ayudar a que te descubran. Tú conservas el control de tu negocio.', tags:['Elige tu plan','Conoce la demo'], art:'finish' }
];
const icons:Record<string,string>={start:'✦',qr:'▦',points:'★',panel:'▥',reviews:'☆',finish:'↗'};
export default function ScrollStory(){
 return <section id="como" className="nivalJourney" aria-labelledby="journey-title">
  <div className="nivalJourneyIntro"><span className="nivalJourneyOverline">ASÍ FUNCIONA NIVAL</span><h2 id="journey-title">Convierte una buena visita <em>en ganas de volver.</em></h2><p>Un recorrido sencillo para cuidar a quienes ya te eligen y dar confianza a quienes todavía no te conocen.</p></div>
  <div className="nivalJourneySteps">{steps.map((step,i)=><article className="nivalJourneyStep" key={step.number}>
    <div className="nivalJourneyMarker"><span>{step.number}</span></div>
    <div className="nivalJourneyCard"><span className="nivalJourneyKicker">{step.kicker}</span><h3>{step.title}</h3><p>{step.text}</p><div className="nivalJourneyTags">{step.tags.map(tag=><span key={tag}>✓ {tag}</span>)}</div></div>
    <div className={`nivalJourneyVisual nivalJourneyVisual--${step.art}`} aria-hidden="true"><span className="nivalJourneyVisualHalo"/><div className="nivalJourneyIllustration"><span className="nivalJourneyIllustrationIcon">{icons[step.art]}</span><span className="nivalJourneyIllustrationBrand">NIVAL</span><strong>{['Tu negocio, primero','Escanea y descubre','Cada visita suma','Todo en un lugar','Tu opinión importa','Sigamos creciendo'][i]}</strong><small>{['Un plan a tu medida','Tu tarjeta digital','3 de 4 visitas','Clientes · Visitas · Premios','Reseñas auténticas','Más motivos para volver'][i]}</small></div></div>
  </article>)}</div>
  <div className="nivalJourneyEnd"><span>¿TE GUSTARÍA VERLO EN ACCIÓN?</span><h3>Descubre cómo se vería en tu negocio.</h3><div><a href="/demo">Explorar la demo <span aria-hidden="true">→</span></a><a href="#precio">Comparar planes</a></div></div>
 </section>
}