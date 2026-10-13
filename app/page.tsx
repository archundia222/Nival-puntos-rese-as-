import type { ReactNode } from 'react';
import LandingIcon from './landing-icon';
import LandingMotion from './landing-motion';
import IndustryCarousel from './landing-carousel';
import LandingMobileNav from './landing-mobile-nav';
import './landing-reference.css';

const quoteUrl = (plan?: string) => 'https://wa.me/525539044988?text=' + encodeURIComponent(`Hola, quiero cotizar ${plan ? `Nival ${plan}` : 'Nival Puntos + Reseñas'} para mi negocio.`);
const whatsapp = quoteUrl();

const plans = [
  { name: 'Puntos', price: '$299', tagline: 'Para empezar a premiar cada visita.', responses: '', comparison: '', featured: false },
  { name: 'Esencial', price: '$399', tagline: 'Puntos y apoyo para responder reseñas.', responses: 'Hasta 30 respuestas a reseñas cada 30 días, preparadas por Nival.', comparison: '', featured: true },
  { name: 'Plus', price: '$549', tagline: 'Más respuestas y contexto sobre tu zona.', responses: 'Hasta 100 respuestas a reseñas cada 30 días, preparadas por Nival.', comparison: 'Comparación de calificación y reseñas con negocios similares de tu zona.', featured: false },
];

const industries = [
  ['cafeterias', 'Cafeterías'], ['restaurantes', 'Restaurantes'], ['taquerias', 'Taquerías'],
  ['barberias', 'Barberías'], ['esteticas', 'Estéticas'], ['consultorios', 'Consultorios dentales'],
  ['heladerias', 'Heladerías'], ['industrias', 'Gimnasios y estudios'],
] as const;



function NivalMark() {
  return <a className="nvBrand" href="#inicio" aria-label="Nival, inicio"><span className="nvBrandMark" aria-hidden="true">N</span><span>NIVAL</span></a>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="nvEyebrow"><i aria-hidden="true" />{children}</span>;
}

function ArrowLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a className={`nvArrowLink ${className}`} href={href}>{children}<LandingIcon name="arrow" /></a>;
}

function ProductLinks() {
  return <div className="nvDropdownPanel">
    <a href="#puntos"><b>Tarjeta de puntos</b><small>Una tarjeta digital con tu marca y tu premio.</small></a>
    <a href="#como-funciona"><b>Registro con QR</b><small>Tus clientes se unen desde su celular.</small></a>
    <a href="#mostrador"><b>Tarjetas NFC + QR</b><small>Invita a tus clientes desde el mostrador.</small></a>
    <a href="#panel"><b>Panel del dueño</b><small>Consulta visitas, premios y actividad.</small></a>
    <a href="#resenas"><b>Reseñas de Google</b><small>Invita a opinar y recibe apoyo para responder.</small></a>
  </div>;
}

function IndustryLinks() {
  return <div className="nvDropdownPanel nvIndustryDropdown">
    {industries.map(([id, label]) => <a href={`#${id}`} key={id}><b>{label}</b><small>Un programa de puntos para tu negocio.</small></a>)}
  </div>;
}

export default function Home() {
  return (
    <main className="nivalLanding" id="inicio">
      <LandingMotion />
      <header className="nvNav">
        <div className="nvNavInner">
          <NivalMark />
          <nav className="nvDesktopNav" aria-label="Navegación principal">
            <details className="nvDropdown"><summary>Producto <span aria-hidden="true">⌄</span></summary><ProductLinks /></details>
            <details className="nvDropdown"><summary>Industrias <span aria-hidden="true">⌄</span></summary><IndustryLinks /></details>
            <a href="#como-funciona">Cómo funciona</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a>
          </nav>
          <div className="nvNavActions"><a className="nvLogin" href="/acceso">Iniciar sesión</a><a className="nvNavCta" href={whatsapp} target="_blank" rel="noreferrer">Hablemos <LandingIcon name="arrow" /></a></div>
          <LandingMobileNav />
        </div>
      </header>

      <section className="nvHero nvContainer" id="puntos">
        <div className="nvHeroCopy">
          <Eyebrow>TARJETA DE PUNTOS + RESEÑAS DE GOOGLE</Eyebrow>
          <h1>Que vuelvan.<br /><em>Que te elijan.</em></h1>
          <p className="nvHeroLead">Tarjeta digital de puntos y herramientas para responder tus reseñas de Google. Tus clientes se registran con un QR, sin instalar ninguna app.</p>
          <div className="nvHeroActions">
            <a className="nvButton nvButtonPrimary" href="/demo">Ver demo <LandingIcon name="arrow" /></a>
            <a className="nvButton nvButtonOutline" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp</a>
          </div>
        </div>
        <div className="nvHeroVisual" aria-label="Ejemplo visual de Nival en un negocio local">
          <div className="nvBaristaFrame"><img src="/assets/img/barista.webp" alt="Barista usando una tablet en una cafetería" fetchPriority="high" /></div>
          <div className="nvHeroTint" />
          <div className="nvHeroPhone" role="img" aria-label="Ejemplo ilustrativo de la tarjeta de puntos de Café Nival en un teléfono">
            <div className="nvPhoneFrame"><div className="nvPhoneScreen">
              <div className="nvPhoneStatus"><span>9:41</span><i aria-hidden="true" /></div>
              <div className="nvPhoneBrand"><span>N</span><small>CAFÉ<br /><b>Café Nival</b></small><i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0" /></svg></i></div>
              <div className="nvPhoneCard"><small>HOLA, LUCÍA</small><b>Una visita más<br />y tienes tu premio.</b><div className="nvPhoneStamps" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i className={i < 5 ? 'is-filled' : ''} key={i}>{i < 5 ? '✦' : ''}</i>)}</div><span>5 de 8 visitas</span><div className="nvPhoneProgress"><i /></div><div className="nvPhoneReward"><b>Tu premio</b><span>Café de la casa</span></div></div>
              <div className="nvPhoneBottom"><span>Tarjeta de puntos</span><b>Ejemplo ilustrativo</b></div>
            </div></div>
          </div>
          <div className="nvHeroChip nvChipPoint"><span>✦</span><b>+1 punto</b><small>Visita registrada</small></div>
          <div className="nvHeroChip nvChipGoogle"><b className="nvGoogleG">G</b><span><b>4.8 ★ en Google</b><small>Ficha de ejemplo</small></span></div>
        </div>
      </section>

      <section className="nvWhySection nvContainer" aria-label="Por qué puntos y reseñas">
        <article><span>01 / LEALTAD</span><h2>¿Por qué un sistema<br />de puntos?</h2><p>Cada visita puede dar una razón clara para regresar. Tus clientes ven cuánto les falta para su premio y tu equipo suma visitas en el mostrador.</p><div className="nvIdeaBoard nvIdeaBoardPoints"><span className="nvIdeaNote nvIdeaNoteA" aria-hidden="true">Visita</span><span className="nvIdeaNote nvIdeaNoteB" aria-hidden="true">+1 punto</span><span className="nvIdeaNote nvIdeaNoteC" aria-hidden="true">Premio</span><img className="nvWhyImage" src="/assets/img/counter-points.webp" alt="Display Nival de puntos sobre la barra de una cafetería, junto a un celular" loading="lazy" /></div></article>
        <article><span>02 / REPUTACIÓN</span><h2>¿Por qué sumar<br />reseñas?</h2><p>Una buena experiencia también ayuda a que alguien nuevo te encuentre. Facilita el acceso a tu ficha de Google y responde con cuidado.</p><div className="nvIdeaBoard nvIdeaBoardReviews"><span className="nvIdeaNote nvIdeaNoteA" aria-hidden="true">QR + NFC</span><span className="nvIdeaNote nvIdeaNoteB" aria-hidden="true">Google</span><span className="nvIdeaNote nvIdeaNoteC" aria-hidden="true">Opinión libre</span><img className="nvWhyImage" src="/assets/img/counter-reviews.webp" alt="Display Nival de reseñas de Google sobre la barra de una cafetería, junto a un celular" loading="lazy" /></div></article>
      </section>
      <section className="nvHowSection nvContainer" id="como-funciona">
        <div className="nvSectionHeading"><div><Eyebrow>TRES PASOS, SIN COMPLICACIONES</Eyebrow><h2>Diseña. Comparte.<br /><em>Crece.</em></h2></div><p>Una tarjeta que acompaña a tus clientes desde la primera visita.</p></div>
        <div className="nvHowGrid">
          <article className="nvHowCard"><span className="nvHowNumber">01 <i>·</i> DISEÑA</span><div className="nvHowImage nvDashboardArtPlaceholder" role="img" aria-label="Espacio reservado para una imagen del panel del dueño" /><h3>Diseña tu tarjeta.</h3><p>Armamos tu tarjeta con tu logo, tus colores y tu premio.</p></article>
          <article className="nvHowCard"><span className="nvHowNumber">02 <i>·</i> COMPARTE</span><div className="nvHowImage"><img src="/assets/img/step-02.webp" alt="Vista ilustrativa de una visita registrada en la tarjeta digital" loading="lazy" /></div><h3>Comparte el QR.</h3><p>Tus clientes escanean el QR de tu mostrador y abren su tarjeta en el celular.</p></article>
          <article className="nvHowCard"><span className="nvHowNumber">03 <i>·</i> CRECE</span><div className="nvHowImage"><img src="/assets/img/step-03.webp" alt="Vista ilustrativa del avance de puntos y premio de un cliente" loading="lazy" /></div><h3>Reconoce a quien vuelve.</h3><p>Suma visitas, premia a quien regresa y mira cuántas reseñas llegan.</p></article>
        </div>
      </section>

      <section className="nvReviewsSection" id="resenas">
        <div className="nvContainer nvReviewsGrid">
          <div className="nvGoogleVisual"><img src="/assets/img/google-phone.webp" alt="Ficha ilustrativa de Google para Café Nival, con calificación de ejemplo" loading="lazy" /><div className="nvNfcPhoto"><img src="/assets/img/reviews-nfc-card.webp" alt="Tarjeta física Nival con QR para reseñas de Google y tecnología NFC" loading="lazy" /></div><span className="nvVisualLabel">FICHA DE GOOGLE · EJEMPLO ILUSTRATIVO</span></div>
          <div className="nvReviewsCopy">
            <Eyebrow>RESEÑAS DE GOOGLE</Eyebrow><h2>Haz espacio para<br /><em>lo que tus clientes cuentan.</em></h2>
            <p>Invítalos a compartir una opinión honesta. Nival te ayuda a organizar y responder reseñas de forma manual y cuidadosa.</p>
            <ul className="nvCheckList"><li><LandingIcon name="check" />Tarjetas NFC + QR que llevan a tu ficha de Google.</li><li><LandingIcon name="check" />Hasta 10 tarjetas incluidas en cada plan.</li><li><LandingIcon name="check" />Respuestas preparadas manualmente por Nival.</li><li><LandingIcon name="check" />Opiniones abiertas, sin premios ni filtros por satisfacción.</li></ul>
            <div className="nvHonestBadge"><LandingIcon name="shield" /><b>Opiniones honestas.<br />Sin filtros.</b></div>
            <ArrowLink href="#planes">Revisa qué incluye cada plan</ArrowLink>
            <small className="nvSmallPrint">El plazo de respuesta es de hasta 3 días hábiles y puede variar según el volumen de reseñas y el plan.</small>
          </div>
        </div>
      </section>

      <section className="nvOwnerSection nvContainer" id="panel">
        <div className="nvOwnerCopy"><Eyebrow>EL PANEL DEL DUEÑO</Eyebrow><h2>Reconoce a quien<br /><em>elige volver.</em></h2><p>Consulta clientes, visitas, premios y actividad desde un solo lugar.</p><div className="nvSegmentList"><div><i className="nvDot nvDotNew" /><b>Nuevos</b><small>Primeras visitas</small></div><div><i className="nvDot nvDotRegular" /><b>Frecuentes</b><small>Visitas que se repiten</small></div><div><i className="nvDot nvDotRisk" /><b>En riesgo</b><small>Sin visita reciente</small></div><div><i className="nvDot nvDotQuiet" /><b>Sin visita reciente</b><small>Clientes por volver</small></div></div></div>
        <div className="nvDashboard" role="img" aria-label="Vista de muestra del panel de Café Nival con datos ficticios: 186 clientes, 342 visitas, 24 premios y 18 reseñas respondidas">
          <div className="nvDashboardTop"><span className="nvDashboardBrand"><i>N</i> Café Nival</span><span className="nvExampleTag">VISTA DE MUESTRA · DATOS FICTICIOS</span></div>
          <div className="nvDashboardMetrics"><article><small>Clientes registrados</small><b>186</b></article><article><small>Visitas en 30 días</small><b>342</b></article><article><small>Premios canjeados</small><b>24</b></article><article><small>Reseñas respondidas</small><b>18</b></article></div>
          <div className="nvDashboardChart"><div className="nvChartHeading"><b>Visitas registradas</b><span>Últimos 7 días</span></div><div className="nvChartBars" aria-label="Ejemplo de visitas por día"><i style={{height:'34%'}} /><i style={{height:'53%'}} /><i style={{height:'43%'}} /><i style={{height:'72%'}} /><i style={{height:'58%'}} /><i style={{height:'88%'}} /><i style={{height:'67%'}} /></div><div className="nvChartDays"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div></div>
          <div className="nvDashboardBody"><div className="nvDashboardSegments"><h3>Clientes por segmento</h3><p><i className="nvDot nvDotNew" />Nuevos <b>42</b></p><p><i className="nvDot nvDotRegular" />Frecuentes <b>86</b></p><p><i className="nvDot nvDotRisk" />En riesgo <b>38</b></p><p><i className="nvDot nvDotQuiet" />Sin visita reciente <b>20</b></p></div><div className="nvDashboardTable"><h3>Actividad reciente <small>Datos ficticios</small></h3><div><b>Cliente</b><b>Visitas</b><b>Última visita</b></div><div><span>Ana G.</span><span>8</span><span>12 oct</span></div><div><span>Luis R.</span><span>6</span><span>11 oct</span></div><div><span>María P.</span><span>4</span><span>10 oct</span></div><div><span>Diego C.</span><span>3</span><span>9 oct</span></div></div></div>
        </div>
      </section>

      <section className="nvCounterSection" id="mostrador"><div className="nvContainer nvCounterGrid"><div className="nvCounterVisual"><img className="nvCounterPhoto" src="/assets/img/nival-counter-display.webp" alt="Display físico de Nival con QR para reseñas de Google y lectura NFC" loading="lazy" /></div><div className="nvCounterCopy"><Eyebrow>EN TU MOSTRADOR</Eyebrow><h2>Todo listo para<br /><em>tu mostrador.</em></h2><ul className="nvCheckList"><li><LandingIcon name="check" />Acércala o escanéala.</li><li><LandingIcon name="check" />Sin apps para tus clientes.</li><li><LandingIcon name="check" />Hasta 10 tarjetas incluidas en cada plan.</li></ul></div></div></section>

      <section className="nvIndustriesSection nvContainer" id="industrias">
        <div className="nvSectionHeading"><div><Eyebrow>EJEMPLOS DE GIROS LOCALES</Eyebrow><h2>Para cualquier negocio.</h2></div><p>Una tarjeta flexible para el ritmo de cada negocio.</p></div>
        <IndustryCarousel />
      </section>

      <section className="nvPlansSection" id="planes"><div className="nvContainer">
        <div className="nvPlansIntro"><Eyebrow>PLANES MENSUALES · PRECIOS EN MXN</Eyebrow><h2>Empieza con lo que<br /><em>necesita tu negocio.</em></h2><p>Los tres planes incluyen puntos, hasta 10 tarjetas NFC + QR para reseñas y un resumen mensual en PDF.</p></div>
        <div className="nvPlanGrid">{plans.map(plan => <article className={`nvPlanCard${plan.featured ? ' is-featured' : ''}`} key={plan.name}>{plan.featured && <span className="nvPlanFlag">PUNTOS + RESEÑAS</span>}<span className="nvPlanName">NIVAL {plan.name.toUpperCase()}</span><h3 className="nvPlanPrice">{plan.price}<small> MXN <i>/ mes</i></small></h3><p className="nvPlanDesc">{plan.tagline}</p><a href={quoteUrl(plan.name)} target="_blank" rel="noreferrer" className={`nvButton ${plan.featured ? 'nvButtonPrimary' : 'nvButtonOutline'}`}>Cotizar Nival {plan.name}<LandingIcon name="arrow" /></a><div className="nvPlanDetails"><span><LandingIcon name="check" />Programa de puntos con tu marca</span><span><LandingIcon name="check" />Registro con QR</span><span><LandingIcon name="check" />Hasta 10 tarjetas NFC + QR</span><span><LandingIcon name="check" />Resumen mensual en PDF</span>{plan.responses && <span><LandingIcon name="check" />{plan.responses}</span>}{plan.comparison && <span><LandingIcon name="check" />{plan.comparison}</span>}</div></article>)}</div>
        <p className="nvPlanNote">Las respuestas las prepara Nival de forma manual. No se publican automáticamente.</p>
      </div></section>

      <section className="nvFaqSection nvContainer" id="preguntas"><div className="nvFaqIntro"><Eyebrow>ANTES DE EMPEZAR</Eyebrow><h2>Todo claro,<br /><em>desde el primer día.</em></h2><p>Respuestas rápidas para saber si Nival encaja con tu negocio.</p></div><div className="nvFaqList">
        <details><summary>¿Mis clientes necesitan descargar una aplicación?</summary><p>No. Pueden registrarse con el QR y abrir su tarjeta digital desde su celular.</p></details>
        <details><summary>¿Puedo guardar mi tarjeta en Google Wallet o Apple Wallet?</summary><p>Google Wallet está disponible cuando la integración está activa para el negocio. Apple Wallet no está disponible actualmente. La tarjeta también se consulta desde su enlace personal.</p></details>
        <details><summary>¿Abrir la tarjeta suma un punto?</summary><p>No. El punto solo se agrega cuando el equipo escanea el QR del cliente o captura su código.</p></details>
        <details><summary>¿Puedo elegir el premio del programa?</summary><p>Sí. Tú decides qué recompensa ofrecer y cuántas visitas se necesitan para llegar a ella.</p></details>
        <details><summary>¿Cuánto tarda en estar lista mi tarjeta?</summary><p>El plazo depende de la información y los materiales de tu negocio. Al cotizar, te confirmamos los pasos y el tiempo estimado.</p></details>
        <details><summary>¿Qué incluye cada plan?</summary><p>Los tres incluyen el programa de puntos, registro con QR, hasta 10 tarjetas NFC + QR para reseñas y un resumen mensual en PDF. Esencial añade hasta 30 respuestas a reseñas cada 30 días; Plus, hasta 100 y una comparación de calificación y reseñas con negocios similares de tu zona.</p></details>
        <details><summary>¿Nival publica las respuestas a las reseñas?</summary><p>No automáticamente. Nival las prepara manualmente. El plazo es de hasta 3 días hábiles, según el volumen de reseñas y el plan.</p></details>
        <details><summary>¿Se dan premios por escribir reseñas?</summary><p>No. La invitación a opinar es abierta y no depende de la satisfacción. No se ofrecen puntos, descuentos ni premios por dejar una reseña.</p></details>
      </div></section>

      <section className="nvFinalCta"><div className="nvContainer nvFinalInner"><div className="nvFinalCtaCopy"><Eyebrow>LEALTAD Y REPUTACIÓN PARA NEGOCIOS LOCALES</Eyebrow><h2>La próxima visita<br />puede ser <em>el comienzo.</em></h2><p>Cuéntanos de tu negocio. Te ayudamos a elegir el plan que encaja contigo.</p></div><div className="nvFinalCtaAction"><span className="nvCtaMark" aria-hidden="true">N</span><small>NIVAL · MÉXICO</small><strong>Hablemos de tu negocio.</strong><p>Atención personal para cotizar y resolver tus dudas.</p><a className="nvButton nvButtonLime" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a></div></div></section>

      <footer className="nvFooter"><div className="nvContainer"><div className="nvFooterTop"><div><NivalMark /><span>Lealtad y reputación para negocios locales.</span></div><nav aria-label="Enlaces del pie"><a href="#como-funciona">Cómo funciona</a><a href="#resenas">Reseñas</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a><a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a></nav></div><div className="nvFooterBottom"><small>© 2026 Nival Tech · México</small><nav aria-label="Información y accesos"><a href="/privacidad">Política de privacidad</a><a href="/terminos">Términos de uso</a><a href="/acceso">Iniciar sesión</a><a href="/staff/acceso">Acceso de personal</a><a href="/acceso-administrador">Acceso de administradores</a></nav></div><small className="nvDraftNote">Las páginas de privacidad y términos están en borrador para revisión legal.</small></div></footer>
      <a className="nvMobileStickyCta" href={whatsapp} target="_blank" rel="noreferrer" aria-label="Cotizar por WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a8.7 8.7 0 0 0-7.5 13.1L3.4 21l5-1.3A8.8 8.8 0 1 0 12 3Z" /><path d="M8.7 8.1c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4 0 .7.5.8 1.2 1.5 2.1 2 .2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.7-.1l1.6.8c.2.1.4.3.4.5 0 .3-.2 1.2-.8 1.6-.5.4-1.1.6-1.8.4-1.1-.3-2.4-.9-3.8-2.1-1.1-1-1.9-2.2-2.2-3.3-.3-.9.1-1.8.6-2.5Z" /></svg>
      </a>
    </main>
  );
}
