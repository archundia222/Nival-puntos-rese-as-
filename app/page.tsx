import type { ReactNode } from 'react';
import LandingIcon from './landing-icon';
import LandingMotion from './landing-motion';
import IndustryCarousel from './landing-carousel';
import LandingMobileNav from './landing-mobile-nav';
import './landing-reference.css';

const quoteUrl = (plan?: string) => `https://wa.me/525539044788?text=${encodeURIComponent(`Hola, quiero conocer ${plan ? `el plan Nival ${plan}` : 'Nival Puntos + Reseñas'} para mi negocio.`)}`;
const plans = [
  { name: 'Puntos', price: '$299', featured: false, tagline: 'Haz que cada visita cuente.', features: ['Programa de puntos por visita', 'Registro y búsqueda de clientes', 'Control de premios y canjes', 'Resumen mensual de actividad'] },
  { name: 'Esencial', price: '$399', featured: true, tagline: 'Puntos y apoyo para responder reseñas.', features: ['Todo lo del plan Puntos', 'Hasta 30 respuestas a reseñas al mes, preparadas por Nival', 'Seguimiento de reseñas en Google'] },
  { name: 'Plus', price: '$549', featured: false, tagline: 'Más acompañamiento para tu reputación.', features: ['Todo lo del plan Esencial', 'Hasta 100 respuestas a reseñas al mes, preparadas por Nival', 'Seguimiento mensual de resultados'] },
];

function NivalMark() {
  return <a className="nvBrand" href="#inicio" aria-label="Nival, inicio"><span className="nvBrandMark" aria-hidden="true">N</span><span>NIVAL</span></a>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="nvEyebrow"><i aria-hidden="true" />{children}</span>;
}

export default function Home() {
  const whatsapp = quoteUrl();
  return <main className="nivalLanding" id="inicio">
    <LandingMotion />
    <header className="nvNav">
      <div className="nvNavInner">
        <NivalMark />
        <nav className="nvDesktopNav" aria-label="Navegación principal"><a href="#como-funciona">Cómo funciona</a><a href="#resenas">Reseñas</a><a href="#industrias">Negocios</a><a href="#planes">Planes</a></nav>
        <div className="nvNavActions"><a className="nvLogin" href="/acceso">Entrar</a><a className="nvNavCta" href={whatsapp} target="_blank" rel="noreferrer">Cotizar <LandingIcon name="arrow" /></a></div>
        <LandingMobileNav />
      </div>
    </header>

    <section className="nvHero nvContainer">
      <div className="nvHeroCopy">
        <Eyebrow>PUNTOS + RESEÑAS PARA TU NEGOCIO</Eyebrow>
        <h1>Que vuelvan.<br /><em>Que te elijan.</em></h1>
        <p className="nvHeroLead">Premia las visitas frecuentes y ayuda a tus clientes a compartir su experiencia en Google.</p>
        <div className="nvHeroActions"><a className="nvButton nvButtonPrimary" href="#planes">Ver planes <LandingIcon name="arrow" /></a><a className="nvButton nvButtonOutline" href={whatsapp} target="_blank" rel="noreferrer">Hablar por WhatsApp</a></div>
        <small className="nvSmallPrint">Sin app para tus clientes. Las reseñas se gestionan de forma manual.</small>
      </div>
      <div className="nvHeroVisual" aria-label="Una barista en una cafetería local">
        <div className="nvBaristaFrame"><img src="/assets/img/barista.webp" alt="Barista atendiendo en una cafetería de barrio" fetchPriority="high" /></div><div className="nvHeroTint" aria-hidden="true" />
        <div className="nvHeroChip nvChipPoint"><span>+1</span><b>Visita registrada</b><small>Un punto más cerca</small></div>
        <div className="nvHeroChip nvChipGoogle"><span className="nvGoogleG">G</span><span><b>Tu opinión cuenta</b><small>Reseñas honestas</small></span></div>
      </div>
    </section>

    <section className="nvWhySection nvContainer" aria-label="Puntos y reseñas">
      <article><span>01 / LEALTAD</span><h2>Una razón para volver.</h2><p>Registra visitas, muestra el avance y reconoce a tus clientes frecuentes.</p><div className="nvIdeaBoard"><img className="nvWhyImage" src="/assets/img/counter-points.webp" alt="Ejemplo de un display de puntos en el mostrador" loading="lazy" /><span className="nvIdeaNote nvIdeaNoteA">Visita</span><span className="nvIdeaNote nvIdeaNoteB">+1 punto</span><span className="nvIdeaNote nvIdeaNoteC">Premio</span></div></article>
      <article><span>02 / REPUTACIÓN</span><h2>Haz fácil dejar una reseña.</h2><p>Comparte un enlace directo a Google y organiza el seguimiento de opiniones.</p><div className="nvIdeaBoard nvIdeaBoardReviews"><img className="nvWhyImage" src="/assets/img/counter-reviews.webp" alt="Display para invitar a compartir reseñas en Google" loading="lazy" /><span className="nvIdeaNote nvIdeaNoteA">Enlace directo</span><span className="nvIdeaNote nvIdeaNoteB">Google</span><span className="nvIdeaNote nvIdeaNoteC">Opinión libre</span></div></article>
    </section>

    <section className="nvHowSection nvContainer" id="como-funciona">
      <div className="nvSectionHeading"><div><Eyebrow>ASÍ DE FÁCIL</Eyebrow><h2>Empieza en tres pasos.</h2></div><p>Claro para ti. Sencillo para tus clientes.</p></div>
      <div className="nvHowGrid">
        <article className="nvHowCard"><span className="nvHowNumber">01 · CONFIGURA</span><div className="nvHowImage nvDashboardArt"><img src="/assets/img/nival-panel-tarjetas.webp" alt="Ejemplo de la configuración de tarjetas y premios en el panel" loading="lazy" /></div><h3>Prepara tu programa.</h3><p>Elige el premio y cuántas visitas se necesitan.</p></article>
        <article className="nvHowCard"><span className="nvHowNumber">02 · COMPARTE</span><div className="nvHowImage"><img src="/assets/img/step-02.webp" alt="Ejemplo de tarjeta digital con puntos" loading="lazy" /></div><h3>Comparte tu enlace.</h3><p>Tus clientes abren su tarjeta desde el celular.</p></article>
        <article className="nvHowCard"><span className="nvHowNumber">03 · RECONOCE</span><div className="nvHowImage"><img src="/assets/img/step-03.webp" alt="Ejemplo de progreso hacia un premio" loading="lazy" /></div><h3>Registra y recompensa.</h3><p>Suma visitas y canjea premios desde el panel.</p></article>
      </div>
    </section>

    <section className="nvReviewsSection" id="resenas"><div className="nvContainer nvReviewsGrid">
      <div className="nvGoogleVisual"><img src="/assets/img/google-phone.webp" alt="Ejemplo ilustrativo de una ficha de Google en un celular" loading="lazy" /><div className="nvNfcPhoto"><img src="/assets/img/reviews-nfc-card.webp" alt="Ejemplo de tarjeta para invitar a dejar una reseña" loading="lazy" /></div><span className="nvVisualLabel">EJEMPLOS ILUSTRATIVOS</span></div>
      <div className="nvReviewsCopy"><Eyebrow>RESEÑAS DE GOOGLE</Eyebrow><h2>Opiniones abiertas.<br /><em>Seguimiento claro.</em></h2><p>Facilita que tus clientes lleguen a tu ficha y organiza la atención a sus reseñas.</p><ul className="nvCheckList"><li><LandingIcon name="check" />Enlace directo a tu ficha de Google.</li><li><LandingIcon name="check" />Seguimiento de reseñas y respuestas en el panel.</li><li><LandingIcon name="check" />Sin incentivos ni filtros por satisfacción.</li></ul><div className="nvHonestBadge"><LandingIcon name="shield" /><b>Opiniones honestas.<br />Sin filtros.</b></div><small className="nvSmallPrint">La captura y respuesta de reseñas se realiza manualmente.</small></div>
    </div></section>

    <section className="nvOwnerSection nvContainer" id="panel">
      <div className="nvOwnerCopy"><Eyebrow>EL PANEL DEL NEGOCIO</Eyebrow><h2>Todo lo importante,<br /><em>a la vista.</em></h2><p>Consulta clientes, visitas, premios y actividad desde un solo lugar.</p><div className="nvSegmentList"><div><i className="nvDot nvDotNew" /><b>Clientes</b><small>Registro y búsqueda</small></div><div><i className="nvDot nvDotRegular" /><b>Visitas</b><small>Actividad del programa</small></div><div><i className="nvDot nvDotRisk" /><b>Premios</b><small>Canjes registrados</small></div></div></div>
      <div className="nvDashboard" role="img" aria-label="Vista ilustrativa del panel de Nival"><div className="nvDashboardTop"><span className="nvDashboardBrand"><i>N</i> Mi negocio</span><span className="nvExampleTag">VISTA ILUSTRATIVA</span></div><div className="nvDashboardMetrics"><article><small>Clientes</small><b>186</b></article><article><small>Visitas del mes</small><b>342</b></article><article><small>Premios canjeados</small><b>24</b></article><article><small>Reseñas capturadas</small><b>18</b></article></div><div className="nvDashboardChart"><div className="nvChartHeading"><b>Visitas registradas</b><span>Ejemplo de actividad</span></div><div className="nvChartBars" aria-hidden="true"><i style={{height:'34%'}} /><i style={{height:'53%'}} /><i style={{height:'43%'}} /><i style={{height:'72%'}} /><i style={{height:'58%'}} /><i style={{height:'88%'}} /><i style={{height:'67%'}} /></div><div className="nvChartDays"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div></div><small className="nvSmallPrint">Datos de ejemplo</small></div>
    </section>

    <section className="nvIndustriesSection nvContainer" id="industrias"><div className="nvSectionHeading"><div><Eyebrow>HECHO PARA EL DÍA A DÍA</Eyebrow><h2>Tu negocio, tu manera.</h2></div><p>Un flujo sencillo para negocios locales.</p></div><IndustryCarousel /></section>

    <section className="nvPlansSection" id="planes"><div className="nvContainer"><div className="nvPlansIntro"><Eyebrow>PLANES · CADA 30 DÍAS</Eyebrow><h2>Elige cómo<br /><em>quieres crecer.</em></h2><p>Precios en pesos mexicanos. Escríbenos para comenzar.</p></div><div className="nvPlanGrid">{plans.map(plan=><article className={`nvPlanCard${plan.featured?' is-featured':''}`} key={plan.name}>{plan.featured&&<span className="nvPlanFlag">MÁS ELEGIDO</span>}<span className="nvPlanName">NIVAL {plan.name.toUpperCase()}</span><h3 className="nvPlanPrice">{plan.price}<small> MXN <i>/ 30 días</i></small></h3><p className="nvPlanDesc">{plan.tagline}</p><a href={quoteUrl(plan.name)} target="_blank" rel="noreferrer" className={`nvButton ${plan.featured?'nvButtonPrimary':'nvButtonOutline'}`}>Elegir {plan.name}<LandingIcon name="arrow" /></a><div className="nvPlanDetails">{plan.features.map(item=><span key={item}><LandingIcon name="check" />{item}</span>)}</div></article>)}</div><p className="nvPlanNote">Las respuestas a reseñas se preparan manualmente. La publicación en Google se confirma con el negocio.</p></div></section>

    <section className="nvFaqSection nvContainer" id="preguntas"><div className="nvFaqIntro"><Eyebrow>PREGUNTAS RÁPIDAS</Eyebrow><h2>Todo claro,<br /><em>desde el inicio.</em></h2></div><div className="nvFaqList"><details><summary>¿Mis clientes necesitan descargar una app?</summary><p>No. Abren su tarjeta desde un enlace en el celular.</p></details><details><summary>¿Abrir una tarjeta suma una visita?</summary><p>No. El negocio registra la visita desde su panel.</p></details><details><summary>¿Puedo elegir el premio?</summary><p>Sí. Configura la recompensa y la cantidad de visitas necesaria.</p></details><details><summary>¿Nival responde reseñas automáticamente?</summary><p>No. El seguimiento y la preparación de respuestas se hacen manualmente, según el plan.</p></details><details><summary>¿Se premia a quien deja una reseña?</summary><p>No. Las opiniones son libres y no dependen de una recompensa ni de la calificación.</p></details></div></section>

    <section className="nvFinalCta" id="contacto"><div className="nvContainer nvFinalInner"><div className="nvFinalCtaCopy"><Eyebrow>PARA NEGOCIOS LOCALES</Eyebrow><h2>Haz que la próxima visita <em>cuente.</em></h2><p>Cuéntanos de tu negocio y te ayudamos a elegir un plan.</p></div><div className="nvFinalCtaAction"><span className="nvCtaMark" aria-hidden="true">N</span><small>NIVAL · MÉXICO</small><strong>Hablemos de tu negocio.</strong><p>Atención personal para elegir el plan.</p><a className="nvButton nvButtonLime" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a></div></div></section>

    <footer className="nvFooter"><div className="nvContainer"><div className="nvFooterTop"><div><NivalMark /><span>Puntos y reseñas para negocios locales.</span></div><nav aria-label="Enlaces del pie"><a href="#como-funciona">Cómo funciona</a><a href="#resenas">Reseñas</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a></nav></div><div className="nvFooterBottom"><small>© 2026 Nival Tech · México</small><nav aria-label="Accesos"><a href="/acceso">Entrar al panel</a></nav></div></div></footer>
  </main>;
}
