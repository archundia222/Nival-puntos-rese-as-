import type { ReactNode } from 'react';
import LandingIcon from './landing-icon';
import LandingInteractions from './landing-interactions';
import LandingMotion from './landing-motion';
import './landing-reference.css';

const whatsapp = 'https://wa.me/525539044988?text=' + encodeURIComponent('Hola, quiero cotizar Nival Puntos + Reseñas para mi negocio.');

const plans = [
  { name: 'Puntos', price: '$299', description: 'Un programa sencillo para reconocer cada visita.', reviews: '—', comparison: '—', featured: false },
  { name: 'Esencial', price: '$399', description: 'Puntos y acompañamiento para tus reseñas.', reviews: '30 respuestas por periodo de 30 días', comparison: '—', featured: true },
  { name: 'Plus', price: '$549', description: 'Más respuestas y una mirada a tu zona.', reviews: '100 respuestas por periodo de 30 días', comparison: 'Calificación y reseñas de negocios similares de tu zona', featured: false },
];

const steps = [
  { number: '01', title: 'Tu cliente se registra', copy: 'Acerca su celular al QR o a la tarjeta del mostrador. Su tarjeta digital empieza en cero puntos.', icon: 'qr' },
  { number: '02', title: 'Tu equipo escanea', copy: 'Después de la visita, el personal escanea el QR del cliente para sumar el punto.', icon: 'search' },
  { number: '03', title: 'El avance se celebra', copy: 'Tu cliente ve el punto nuevo, su progreso y cuánto le falta para el premio.', icon: 'gift' },
];

function PhoneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`phoneFrame ${className}`} aria-label="Vista ilustrativa de Nival en un celular"><div className="phoneIsland" />{children}</div>;
}

function NivalMark() {
  return <a className="nvBrand" href="/" aria-label="Nival, inicio"><span className="nvBrandMark">N</span><span>NIVAL</span></a>;
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
        <a className="nvNavCta" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a>
        <LandingInteractions mode="menu" wa={whatsapp} />
      </header>

      <section className="nvHero">
        <div className="nvHeroCopy">
          <span className="nvEyebrow"><i /> HERRAMIENTAS PARA NEGOCIOS LOCALES</span>
          <h1>Que te <span>encuentren.</span><br />Que vuelvan.</h1>
          <p>Más reseñas auténticas en Google y un programa de puntos fácil de usar para que cada visita tenga un motivo para repetirse.</p>
          <div className="nvHeroActions">
            <a className="nvButton nvButtonPrimary" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a>
            <a className="nvButton nvButtonQuiet" href="#como-funciona">Conoce cómo funciona <LandingIcon name="arrow" /></a>
          </div>
          <div className="nvQuickFacts" aria-label="Características de Nival">
            <span><LandingIcon name="phone" />Sin app</span>
            <span><LandingIcon name="qr" />QR incluido</span>
            <span><LandingIcon name="card" />Tarjetas digitales</span>
          </div>
        </div>
        <div className="nvHeroVisual">
          <img className="nvCafePhoto" src="/assets/img/cafe-front.webp" alt="Cafetería Nival con terraza y mesas al aire libre" fetchPriority="high" />
          <div className="nvPhotoVeil" />
          <div className="nvHeroTag"><span className="nvTagIcon"><LandingIcon name="pin" /></span><span><small>NEGOCIO LOCAL</small><strong>Un buen lugar para volver</strong></span></div>
          <PhoneFrame className="nvHeroPhone">
            <div className="nvMiniHeader"><span className="nvMiniLogo">N</span><span><small>CAFÉ NIVAL · EJEMPLO</small><b>Tu tarjeta</b></span><LandingIcon name="qr" /></div>
            <div className="nvMiniCard"><small>PROGRAMA DE PUNTOS</small><strong>Lucía</strong><span>4 <i>puntos</i></span><div className="nvStampRow"><b>✓</b><b>✓</b><b>✓</b><b>✓</b><i /><i /></div><small>4 puntos para tu premio</small></div>
            <div className="nvRewardLine"><span className="nvRewardGlyph"><LandingIcon name="gift" /></span><span><small>PRÓXIMO PREMIO</small><b>Café de la casa</b></span><LandingIcon name="arrow" /></div>
            <div className="nvDemoLabel">EJEMPLO ILUSTRATIVO</div>
          </PhoneFrame>
          <div className="nvFloatNote"><span className="nvFloatCheck"><LandingIcon name="check" /></span><span><strong>Un punto más</strong><small>4 de 8 visitas</small></span></div>
          <div className="nvCounterStand" aria-label="Soporte de mostrador con código QR y NFC"><span className="nvStandTop"><b>N</b><small>CAFÉ NIVAL</small></span><span className="nvFakeQr"><i /><i /><i /><b /></span><small>ACERCA O ESCANEA</small><strong>Tu próxima visita<br />tiene premio.</strong><span className="nvNfcWave"><LandingIcon name="phone" /></span></div>
          <div className="nvCoffeeCup" aria-hidden="true"><span /><i /></div>
        </div>
      </section>

      <section className="nvProofRow" aria-label="Qué incluye Nival">
        <span className="nvProofLead">Una experiencia sencilla</span>
        <span><LandingIcon name="phone" />Sin app para tus clientes</span>
        <span><LandingIcon name="qr" />QR y NFC en mostrador</span>
        <span><LandingIcon name="card" />Tarjeta digital personal</span>
      </section>

      <section className="nvSection nvStepsSection" id="como-funciona">
        <div className="nvSectionHeading">
          <div><span className="nvEyebrow">PUNTOS QUE SE ENTIENDEN DE UN VISTAZO</span><h2>Del mostrador<br />a una razón para volver.</h2></div>
          <p>El cliente avanza. El personal registra la visita. Tú eliges el premio.</p>
        </div>
        <div className="nvFlow">
          <div className="nvFlowPhoto"><img src="/assets/img/barista.webp" alt="Personal atiende a una persona en una cafetería" loading="lazy" /><span className="nvImageCaption">EN EL MOSTRADOR · EJEMPLO ILUSTRATIVO</span><div className="nvFlowQr"><b>N</b><span className="nvFakeQr"><i /><i /><i /><b /></span><small>ACERCA O ESCANEA</small></div></div>
          <div className="nvStepList">{steps.map((step, index) => <article className="nvFlowStep" key={step.number}>
            <span className="nvStepNumber">{step.number}</span><span className="nvStepIcon"><LandingIcon name={step.icon} /></span><div><h3>{step.title}</h3><p>{step.copy}</p></div>
            {index === 0 && <PhoneFrame className="nvFlowPhone nvRegisterPhone"><div className="nvPhoneTopline">NIVAL <span>✕</span></div><div className="nvPhoneContent"><small>CAFÉ NIVAL</small><h4>Únete al programa</h4><label>Tu nombre</label><div className="nvInputMock">Lucía Rivera</div><label>Tu teléfono</label><div className="nvInputMock">55 0000 0000</div><span className="nvPhoneButton">Crear mi tarjeta</span><small className="nvDisclaimer">EJEMPLO · INICIAS CON 0 PUNTOS</small></div></PhoneFrame>}
            {index === 1 && <PhoneFrame className="nvFlowPhone nvScanPhone"><div className="nvScanTop"><span>9:41</span><b>Escanear cliente</b><LandingIcon name="qr" /></div><div className="nvScanTarget"><span /><span /><span /><span /><i className="nvScanLine" /></div><small className="nvScanHelp">Centra el QR de la tarjeta</small><div className="nvScanBottom"><span>Buscar por código</span><b>AB 42 19</b><small>EJEMPLO DE ESCANEO</small></div></PhoneFrame>}
            {index === 2 && <PhoneFrame className="nvFlowPhone nvPointPhone"><div className="nvPointHeader"><span className="nvMiniLogo">N</span><small>CAFÉ NIVAL · EJEMPLO</small></div><div className="nvPointBadge"><LandingIcon name="check" /></div><span className="nvPointKicker">¡VAS MUY BIEN!</span><strong className="nvPointTitle">Sumaste<br />un punto</strong><span className="nvPointCount">5 <small>de 8 puntos</small></span><div className="nvPointTrack"><i /></div><span className="nvPointRemain">Te faltan 3 para tu premio</span><small className="nvDisclaimer">AVISO ILUSTRATIVO</small></PhoneFrame>}
          </article>)}</div>
        </div>
        <p className="nvFootnote">El punto se suma cuando el personal registra la visita; abrir la tarjeta no suma puntos.</p>
      </section>

      <section className="nvReviews" id="reseñas">
        <div className="nvReviewsCopy"><span className="nvEyebrow">RESEÑAS DE GOOGLE</span><h2>Una buena experiencia merece ser escuchada.</h2><p>Invita a tus clientes a compartir una opinión honesta. Nival te acompaña a organizar y responder reseñas de forma manual.</p><ul><li><span><LandingIcon name="check" /></span>Una tarjeta NFC + QR va directo a tu ficha de Google.</li><li><span><LandingIcon name="check" /></span>Hasta 10 tarjetas de reseñas incluidas en cada plan.</li><li><span><LandingIcon name="check" /></span>Sin puntos, premios ni filtros por satisfacción.</li></ul><a href="#planes" className="nvTextLink">Conoce qué incluye cada plan <LandingIcon name="arrow" /></a></div>
        <div className="nvReviewVisual"><div className="nvGoogleCard"><div className="nvGoogleHead"><span className="nvGoogleG">G</span><span><small>FICHA DE GOOGLE</small><b>Café Nival <em>· EJEMPLO</em></b></span><span className="nvDots">···</span></div><div className="nvReviewStars" aria-label="Cinco estrellas de ejemplo">★★★★★</div><small className="nvReviewMeta">OPINIÓN ILUSTRATIVA</small><h3>“Un café delicioso y un espacio muy agradable.”</h3><p>Un ejemplo de reseña. Las opiniones reales las escriben tus clientes, sin incentivos.</p><div className="nvReviewBy"><span>LR</span><small>Lucía R. · Ejemplo</small></div></div><div className="nvReviewCard"><span className="nvReviewCardIcon"><LandingIcon name="qr" /></span><span><small>RESPUESTA A RESEÑAS</small><b>Con acompañamiento de Nival</b><em>Plazo de hasta 3 días hábiles*</em></span></div><small className="nvSmallPrint">*El tiempo puede variar según el volumen de reseñas y el plan.</small></div>
      </section>

      <section className="nvReturnSection">
        <div className="nvReturnImage"><img src="/assets/img/cafe-front.webp" alt="Terraza de cafetería Nival al atardecer" loading="lazy" /><span className="nvImageCaption">UNA VISITA A LA VEZ</span><div className="nvVisitNote"><span><LandingIcon name="people" /></span><b>Reconoce a quien regresa.</b><small>Ejemplo de programa · Café Nival</small></div></div>
        <div className="nvReturnCopy"><span className="nvEyebrow">CLIENTES QUE VUELVEN</span><h2>Que el siguiente café también sea contigo.</h2><p>Un programa claro ayuda a tus clientes a ver su avance y a tu equipo a reconocer cada visita.</p><div className="nvSegmentCard"><div className="nvSegmentHead"><span><small>VISTA DEL NEGOCIO</small><b>Clientes por segmento</b></span><span className="nvSampleBadge">EJEMPLO ILUSTRATIVO</span></div><div className="nvSegmentRow"><span className="nvSegmentDot nvDotNew" /><b>Nuevos</b><span>Conoce a quienes acaban de llegar</span><LandingIcon name="arrow" /></div><div className="nvSegmentRow"><span className="nvSegmentDot nvDotRepeat" /><b>Frecuentes</b><span>Agradece su preferencia</span><LandingIcon name="arrow" /></div><div className="nvSegmentRow"><span className="nvSegmentDot nvDotRisk" /><b>En riesgo</b><span>Piensa en un motivo para volver</span><LandingIcon name="arrow" /></div><div className="nvSegmentRow"><span className="nvSegmentDot nvDotQuiet" /><b>Sin visita</b><span>Revisa quién aún no ha regresado</span><LandingIcon name="arrow" /></div></div></div>
      </section>

      <section className="nvPlansSection" id="planes">
        <div className="nvPlansIntro"><span className="nvEyebrow">PLANES MENSUALES</span><h2>Elige lo que tu negocio necesita.</h2><p>Precios en MXN. Cada plan incluye puntos y hasta 10 tarjetas de reseñas NFC + QR.</p></div>
        <div className="nvPlanGrid">{plans.map(plan => <article className={`nvPlanCard${plan.featured ? ' is-featured' : ''}`} key={plan.name}>
          {plan.featured && <span className="nvPlanFlag">PUNTOS + RESEÑAS</span>}
          <span className="nvPlanName">NIVAL {plan.name.toUpperCase()}</span><strong className="nvPlanPrice">{plan.price}<small> MXN <i>/ mes</i></small></strong><p className="nvPlanDesc">{plan.description}</p>
          <a href={whatsapp} target="_blank" rel="noreferrer" className={plan.featured ? 'nvButton nvButtonPrimary' : 'nvButton nvButtonOutline'}>Cotizar este plan <LandingIcon name="arrow" /></a>
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

      <section className="nvFaqSection" id="preguntas"><div className="nvFaqIntro"><span className="nvEyebrow">PREGUNTAS FRECUENTES</span><h2>Claro desde el primer día.</h2><p>Lo esencial para decidir si Nival es para tu negocio.</p></div><div className="nvFaqList">
        <details><summary>¿Mis clientes necesitan descargar una aplicación?</summary><p>No. Pueden registrarse y volver a abrir su tarjeta digital desde el QR o su enlace personal.</p></details>
        <details><summary>¿Abrir la tarjeta suma un punto?</summary><p>No. El punto solo se suma cuando el personal escanea el QR del cliente o captura su código.</p></details>
        <details><summary>¿Qué incluye cada plan?</summary><p>Puntos incluye el programa de puntos. Esencial añade hasta 30 respuestas a reseñas por periodo de 30 días. Plus añade hasta 100 respuestas y comparación con negocios parecidos de tu zona. Todos incluyen hasta 10 tarjetas NFC + QR de reseñas y un resumen en PDF al cierre del periodo.</p></details>
        <details><summary>¿Cómo se gestionan las reseñas?</summary><p>Tu negocio da acceso de administrador a su ficha de Google. Nival prepara las respuestas manualmente y te las comparte en un plazo de hasta 3 días hábiles, según el volumen de reseñas y el plan.</p></details>
        <details><summary>¿Se ofrecen premios a cambio de reseñas?</summary><p>No. La invitación a opinar es abierta y no depende de la satisfacción. No damos puntos, descuentos ni premios por dejar reseñas.</p></details>
      </div></section>

      <section className="nvFinalCta"><div className="nvFinalCtaCopy"><span className="nvEyebrow">EMPIEZA CON UNA CONVERSACIÓN</span><h2>Que te encuentren.<br /><span>Que vuelvan.</span></h2><p>Cuéntanos de tu cafetería o restaurante. Te ayudamos a elegir el plan que encaja contigo.</p></div><div className="nvFinalCtaAction"><span className="nvCtaMark"><LandingIcon name="arrow" /></span><strong>Hablemos de tu negocio.</strong><p>Te respondemos personalmente para cotizar y resolver tus dudas.</p><a className="nvButton nvButtonLime" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a><small>Atención de Nival · México</small></div></section>

      <footer className="nvFooter"><div className="nvFooterTop"><NivalMark /><span>Para cafeterías y restaurantes locales.</span><a href={whatsapp} target="_blank" rel="noreferrer">Hablemos <LandingIcon name="arrow" /></a></div><div className="nvFooterBottom"><small>© 2026 Nival Tech · México</small><nav aria-label="Enlaces del pie"><a href="/terminos">Términos</a><a href="/privacidad">Aviso de privacidad</a><a href="/acceso">Acceso a negocios</a><a href="/staff/acceso">Acceso de personal</a><a href="/acceso-administrador">Acceso de administradores</a></nav></div></footer>
    </main>
  );
}
