import LandingIcon from './landing-icon';
import LandingInteractions from './landing-interactions';
import LandingMotion from './landing-motion';
import './landing-reference.css';

const whatsapp = 'https://wa.me/525539044988?text=' + encodeURIComponent('Hola, quiero cotizar Nival Puntos + Reseñas para mi negocio.');

const plans = [
  { name: 'Puntos', price: '$299', description: 'Una forma sencilla de reconocer cada visita.', reviews: '—', comparison: '—' },
  { name: 'Esencial', price: '$399', description: 'Puntos y apoyo para responder reseñas.', reviews: 'Hasta 30 respuestas por periodo de 30 días', comparison: '—', featured: true },
  { name: 'Plus', price: '$549', description: 'Más respuestas y contexto sobre tu zona.', reviews: 'Hasta 100 respuestas por periodo de 30 días', comparison: 'Calificación y reseñas de negocios similares de tu zona' },
];

function NivalMark() {
  return <a className="nvBrand" href="/" aria-label="Nival, inicio"><span className="nvBrandMark">N</span><span>NIVAL</span></a>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="nvEyebrow"><i aria-hidden="true" />{children}</span>;
}

export default function Home() {
  return (
    <main className="nivalLanding">
      <LandingMotion />
      <header className="nvNav">
        <NivalMark />
        <nav aria-label="Navegación principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#reseñas">Reseñas</a>
          <a href="#planes">Planes</a>
          <a href="#preguntas">Preguntas</a>
        </nav>
        <a className="nvNavCta" href={whatsapp} target="_blank" rel="noreferrer">Hablemos <LandingIcon name="arrow" /></a>
        <LandingInteractions mode="menu" wa={whatsapp} />
      </header>

      <section className="nvHero">
        <div className="nvHeroCopy">
          <Eyebrow>LEALTAD Y RESEÑAS PARA NEGOCIOS LOCALES</Eyebrow>
          <h1>Cada visita<br /><em>cuenta.</em></h1>
          <p className="nvHeroLead">Tarjetas digitales de puntos y herramientas para cuidar tu reputación en Google. Una experiencia cercana para tus clientes, fácil de llevar para tu equipo.</p>
          <div className="nvHeroActions">
            <a className="nvButton nvButtonPrimary" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a>
            <a className="nvButton nvButtonQuiet" href="#como-funciona">Explorar Nival <LandingIcon name="arrow" /></a>
          </div>
          <div className="nvQuickFacts"><span>Sin descargar una app</span><i /><span>QR + NFC en mostrador</span><i /><span>Planes mensuales</span></div>
        </div>
        <div className="nvHeroVisual">
          <img className="nvCafePhoto" src="/assets/img/barista.webp" alt="Barista preparando una bebida en una cafetería" fetchPriority="high" />
          <div className="nvPhotoVeil" />
          <div className="nvHeroNote"><span className="nvNoteSpark">✦</span><span><small>UNA VISITA MÁS</small><b>Un paso más cerca de tu premio.</b></span></div>
          <div className="nvHeroCard">
            <div className="nvProductMark"><span>N</span><small>CAFÉ NIVAL <i>· EJEMPLO</i></small><LandingIcon name="qr" /></div>
            <div className="nvProductTitle"><small>TARJETA DE PUNTOS</small><strong>Hola, Lucía.</strong><span>Tu próxima visita cuenta.</span></div>
            <div className="nvProductProgress" aria-label="Cuatro de ocho visitas"><div className="nvStampRow">{Array.from({ length: 8 }, (_, index) => <i className={index < 4 ? 'isStamped' : ''} key={index}>✦</i>)}</div><div><b>4 <small>/ 8 visitas</small></b><span>Te faltan 4 para tu premio</span></div></div>
            <div className="nvProductReward"><span><LandingIcon name="gift" /></span><small>PRÓXIMO PREMIO</small><b>Café de la casa</b><LandingIcon name="arrow" /></div>
            <small className="nvDemoLabel">VISTA ILUSTRATIVA</small>
          </div>
        </div>
      </section>

      <section className="nvPromiseRow" aria-label="Lo esencial de Nival">
        <span>Una experiencia digital<br /><b>que se siente personal.</b></span>
        <div><b>01</b><span>El cliente se registra<br />desde su celular</span></div>
        <div><b>02</b><span>Tu equipo registra<br />cada visita</span></div>
        <div><b>03</b><span>El avance y el premio<br />siempre están a la vista</span></div>
      </section>

      <section className="nvStorySection" id="como-funciona">
        <div className="nvStoryIntro">
          <Eyebrow>UNA TARJETA DIGITAL, SIN COMPLICACIONES</Eyebrow>
          <h2>Un pequeño gesto.<br /><em>Una razón para regresar.</em></h2>
          <p>Nival convierte las visitas en un programa de puntos que tus clientes entienden al instante. Se registran con un QR y consultan su tarjeta personal desde el celular, sin instalar otra aplicación.</p>
          <a className="nvTextLink" href={whatsapp} target="_blank" rel="noreferrer">Conoce cómo empezar <LandingIcon name="arrow" /></a>
        </div>
        <div className="nvStoryVisual">
          <img src="/assets/img/hero-phone.webp" alt="Tarjeta digital de puntos de Nival vista en un teléfono" loading="lazy" />
          <div className="nvStoryCaption"><span>SU PROGRESO, SIEMPRE CERCA</span><p>Visitas, puntos y premio en una tarjeta personal.</p></div>
        </div>
      </section>

      <section className="nvStepsSection">
        <div className="nvSectionHeading">
          <div><Eyebrow>ASÍ SE VIVE EN EL DÍA A DÍA</Eyebrow><h2>De la primera visita<br />a la siguiente.</h2></div>
          <p>Un recorrido directo para el cliente y sencillo de registrar en mostrador.</p>
        </div>
        <div className="nvStepGrid">
          <article className="nvStepCard">
            <span className="nvStepNumber">01 <i>·</i> REGISTRO</span>
            <img src="/assets/img/hero-phone.webp" alt="Registro de cliente para una tarjeta digital de puntos" loading="lazy" />
            <h3>Se une en segundos.</h3><p>Escanea el QR del mostrador, comparte sus datos y abre su tarjeta digital desde el celular.</p>
          </article>
          <article className="nvStepCard">
            <span className="nvStepNumber">02 <i>·</i> VISITA</span>
            <img src="/assets/img/step-02.webp" alt="El equipo registra la visita del cliente" loading="lazy" />
            <h3>Tu equipo registra la visita.</h3><p>Al terminar la compra, escanea el QR de la tarjeta o captura el código del cliente para sumar el punto.</p>
          </article>
          <article className="nvStepCard">
            <span className="nvStepNumber">03 <i>·</i> RECOMPENSA</span>
            <img src="/assets/img/step-03.webp" alt="El cliente ve el avance de sus puntos y el premio" loading="lazy" />
            <h3>El avance se vuelve visible.</h3><p>El cliente ve sus puntos y cuánto le falta. Tú eliges el premio que hace sentido para tu negocio.</p>
          </article>
        </div>
        <p className="nvFootnote">El punto se suma cuando el equipo registra la visita; abrir la tarjeta no agrega puntos.</p>
      </section>

      <section className="nvReviewSection" id="reseñas">
        <div className="nvReviewVisual">
          <img src="/assets/img/google-phone.webp" alt="Vista de una reseña de Google en el teléfono" loading="lazy" />
          <div className="nvReviewFloat"><span className="nvGoogleG">G</span><span><small>UNA OPINIÓN HONESTA</small><b>La experiencia habla por sí misma.</b></span></div>
        </div>
        <div className="nvReviewCopy">
          <Eyebrow>RESEÑAS DE GOOGLE</Eyebrow>
          <h2>Haz espacio para<br /><em>lo que tus clientes cuentan.</em></h2>
          <p>Invítalos a compartir una opinión honesta sobre su experiencia. Nival te ayuda a organizar y responder reseñas de forma manual y cuidadosa.</p>
          <ul>
            <li><span><LandingIcon name="check" /></span>Tarjetas NFC + QR que llevan a tu ficha de Google.</li>
            <li><span><LandingIcon name="check" /></span>Hasta 10 tarjetas para reseñas incluidas en cada plan.</li>
            <li><span><LandingIcon name="check" /></span>Respuestas preparadas manualmente por Nival.</li>
            <li><span><LandingIcon name="check" /></span>Opiniones abiertas, sin premios ni filtros por satisfacción.</li>
          </ul>
          <a className="nvTextLink" href="#planes">Revisa qué incluye cada plan <LandingIcon name="arrow" /></a>
          <small className="nvSmallPrint">El plazo de respuesta es de hasta 3 días hábiles y puede variar según el volumen de reseñas y el plan.</small>
        </div>
      </section>

      <section className="nvBusinessSection">
        <div className="nvBusinessCopy">
          <Eyebrow>UNA MIRADA MÁS CLARA A TUS CLIENTES</Eyebrow>
          <h2>Reconoce a quien<br /><em>elige volver.</em></h2>
          <p>Además de la tarjeta de puntos, Nival te ayuda a ordenar la relación con tus clientes por su actividad. Así puedes entender mejor quién acaba de llegar y quién lleva tiempo contigo.</p>
          <div className="nvSegmentList">
            <div><span className="nvSegmentDot nvDotNew" /><b>Nuevos</b><small>Quienes acaban de conocer tu negocio</small></div>
            <div><span className="nvSegmentDot nvDotRepeat" /><b>Frecuentes</b><small>Quienes regresan con regularidad</small></div>
            <div><span className="nvSegmentDot nvDotRisk" /><b>En riesgo</b><small>Clientes que podrían necesitar un motivo para volver</small></div>
            <div><span className="nvSegmentDot nvDotQuiet" /><b>Sin visita reciente</b><small>Quienes aún no regresan</small></div>
          </div>
        </div>
        <div className="nvBusinessPhoto">
          <img src="/assets/img/cafe-front.webp" alt="Mesas al aire libre frente a una cafetería" loading="lazy" />
          <span className="nvImageCaption">EL VÍNCULO SE CONSTRUYE VISITA A VISITA</span>
          <div className="nvVisitNote"><span><LandingIcon name="people" /></span><b>Tu negocio, más cerca de sus clientes.</b><small>Ejemplo ilustrativo · Café Nival</small></div>
        </div>
      </section>

      <section className="nvPlansSection" id="planes">
        <div className="nvPlansIntro"><Eyebrow>PLANES MENSUALES · PRECIOS EN MXN</Eyebrow><h2>Empieza con lo que<br /><em>necesita tu negocio.</em></h2><p>Todos los planes incluyen el programa de puntos, hasta 10 tarjetas NFC + QR para reseñas y un resumen del periodo en PDF.</p></div>
        <div className="nvPlanGrid">{plans.map((plan) => <article className={`nvPlanCard${plan.featured ? ' is-featured' : ''}`} key={plan.name}>
          {plan.featured && <span className="nvPlanFlag">PUNTOS + RESEÑAS</span>}
          <span className="nvPlanName">NIVAL {plan.name.toUpperCase()}</span>
          <strong className="nvPlanPrice">{plan.price}<small> MXN <i>/ mes</i></small></strong>
          <p className="nvPlanDesc">{plan.description}</p>
          <a href={whatsapp} target="_blank" rel="noreferrer" className={plan.featured ? 'nvButton nvButtonPrimary' : 'nvButton nvButtonOutline'}>Cotizar este plan <LandingIcon name="arrow" /></a>
          <div className="nvPlanDetails"><span><LandingIcon name="check" />Programa de puntos</span><span><LandingIcon name="check" />Hasta 10 tarjetas NFC + QR</span><span><LandingIcon name="check" />Resumen mensual en PDF</span>
            {plan.reviews !== '—' && <span><LandingIcon name="check" />{plan.reviews}</span>}
            {plan.comparison !== '—' && <span><LandingIcon name="check" />{plan.comparison}</span>}
          </div>
        </article>)}</div>
        <div className="nvCompareWrap"><table className="nvCompare"><thead><tr><th>Incluye</th><th>Puntos<br /><small>$299</small></th><th>Esencial<br /><small>$399</small></th><th>Plus<br /><small>$549</small></th></tr></thead><tbody>
          <tr><th>Programa de puntos</th><td><LandingIcon name="check" /></td><td><LandingIcon name="check" /></td><td><LandingIcon name="check" /></td></tr>
          <tr><th>Respuestas a reseñas por periodo de 30 días</th><td>—</td><td>Hasta 30</td><td>Hasta 100</td></tr>
          <tr><th>Comparación con negocios similares de tu zona</th><td>—</td><td>—</td><td>Calificación y reseñas</td></tr>
          <tr><th>Tarjetas NFC + QR para reseñas</th><td colSpan={3}>Hasta 10 incluidas</td></tr>
          <tr><th>Resumen del periodo en PDF</th><td colSpan={3}>Incluido al cierre de cada periodo de 30 días</td></tr>
        </tbody></table></div>
        <p className="nvPlanNote">Las respuestas las prepara Nival de forma manual. No se publican automáticamente.</p>
      </section>

      <section className="nvFaqSection" id="preguntas">
        <div className="nvFaqIntro"><Eyebrow>ANTES DE EMPEZAR</Eyebrow><h2>Todo claro,<br /><em>desde el primer día.</em></h2><p>Respuestas rápidas para saber si Nival encaja con tu negocio.</p></div>
        <div className="nvFaqList">
          <details><summary>¿Mis clientes necesitan descargar una aplicación?</summary><p>No. Pueden registrarse con el QR y abrir su tarjeta digital desde su celular o desde su enlace personal.</p></details>
          <details><summary>¿Abrir la tarjeta suma un punto?</summary><p>No. El punto solo se agrega cuando el equipo escanea el QR del cliente o captura su código.</p></details>
          <details><summary>¿Puedo elegir el premio del programa?</summary><p>Sí. Tú decides qué recompensa ofrecer y cuántas visitas se necesitan para llegar a ella.</p></details>
          <details><summary>¿Qué incluye cada plan?</summary><p>Los tres incluyen el programa de puntos, hasta 10 tarjetas NFC + QR para reseñas y un resumen del periodo en PDF. Esencial añade hasta 30 respuestas a reseñas por periodo de 30 días; Plus, hasta 100 y una comparación con negocios similares de tu zona.</p></details>
          <details><summary>¿Nival publica las respuestas a las reseñas?</summary><p>No automáticamente. Nival las prepara manualmente. El plazo es de hasta 3 días hábiles, según el volumen de reseñas y el plan.</p></details>
          <details><summary>¿Se dan premios por escribir reseñas?</summary><p>No. La invitación a opinar es abierta y no depende de la satisfacción. No se ofrecen puntos, descuentos ni premios por dejar una reseña.</p></details>
        </div>
      </section>

      <section className="nvFinalCta">
        <div className="nvFinalCtaCopy"><Eyebrow>EMPIEZA CON UNA CONVERSACIÓN</Eyebrow><h2>La próxima visita<br />puede ser <em>el comienzo.</em></h2><p>Cuéntanos de tu cafetería o restaurante. Te ayudamos a elegir el plan que encaja contigo.</p></div>
        <div className="nvFinalCtaAction"><span className="nvCtaMark">N</span><small>NIVAL · MÉXICO</small><strong>Hablemos de tu negocio.</strong><p>Atención personal para cotizar y resolver tus dudas.</p><a className="nvButton nvButtonLime" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a></div>
      </section>

      <footer className="nvFooter">
        <div className="nvFooterTop"><NivalMark /><span>Lealtad y reputación para negocios locales.</span><a href={whatsapp} target="_blank" rel="noreferrer">Hablemos <LandingIcon name="arrow" /></a></div>
        <div className="nvFooterBottom"><small>© 2026 Nival Tech · México</small><nav aria-label="Enlaces del pie"><a href="/terminos">Términos</a><a href="/privacidad">Aviso de privacidad</a><a href="/acceso">Acceso a negocios</a><a href="/staff/acceso">Acceso de personal</a><a href="/acceso-administrador">Acceso de administradores</a></nav></div>
      </footer>
    </main>
  );
}
