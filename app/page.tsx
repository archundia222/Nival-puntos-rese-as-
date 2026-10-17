import Image from "next/image";
import LandingIcon from "./landing-icon";
import LandingMobileNav from "./landing-mobile-nav";
import LandingIndustryCarousel from "./landing-industry-carousel";
import LandingMotion from "./landing-motion";
import "./landing-reference.css";

const whatsapp = (plan?: string) =>
  `https://wa.me/525539044788?text=${encodeURIComponent(`Hola, quiero conocer Nival${plan ? ` ${plan}` : ""} para mi negocio.`)}`;

const plans = [
  { name: "Puntos", price: "$299", reviews: "10", branches: "1", nfc: "3", fit: "Para empezar a reconocer a quienes vuelven." },
  { name: "Esencial", price: "$399", reviews: "30", branches: "5", nfc: "6", fit: "Para atender más reseñas y varios puntos de venta.", featured: true },
  { name: "Plus", price: "$549", reviews: "100", branches: "10", nfc: "12", fit: "Para ampliar la gestión y comparar tu zona." },
];

function Photo({ src, alt, className = "", priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 760px) 100vw, 50vw" className={`nvPhoto ${className}`} />;
}

function Brand() {
  return <a className="nvBrand" href="#inicio" aria-label="Nival, inicio"><span className="nvBrandMark">N</span><b>NIVAL</b></a>;
}

export default function Home() {
  return (
    <main className="nivalLanding" id="inicio">
      <header className="nvNav">
        <div className="nvNavInner">
          <Brand />
          <nav className="nvDesktopNav" aria-label="Navegación principal">
            <a href="#giros">Negocios</a><a href="#producto">Productos</a><a href="#panel">Tu panel</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a>
          </nav>
          <div className="nvNavActions"><a className="nvLogin" href="/acceso">Entrar</a><a className="nvNavCta" href={whatsapp()} target="_blank" rel="noreferrer">Cotizar <LandingIcon name="arrow" /></a></div>
          <LandingMobileNav />
        </div>
      </header>

      <section className="nvHero" aria-labelledby="hero-title">
        <div className="nvContainer nvHeroGrid">
          <div className="nvHeroCopy" data-reveal>
            <span className="nvEyebrow">NIVAL · LEALTAD PARA NEGOCIOS LOCALES</span>
            <h1 id="hero-title"><span>La visita termina.</span><br /><em>La relación sigue.</em></h1>
            <p>Puntos para premiar regresos, NFC y QR para abrir reseñas de Google, y tarjetas de regalo digitales. En un solo espacio.</p>
            <div className="nvHeroActions"><a className="nvButton nvButtonPrimary" href={whatsapp()} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a><a className="nvButton nvButtonOutline" href="/demo">Explorar demo</a></div>
            <div className="nvHeroProof"><span>Sin app para tus clientes</span><i /> <span>Desde $299 MXN / 30 días</span></div>
          </div>
          <div className="nvHeroImageWrap" aria-label="Cafetería con una tarjeta NFC sobre el mostrador" data-reveal>
            <Photo src="/assets/img/landing/6105.webp" alt="Mostrador de cafetería con luz de mañana y soporte para teléfono" priority />
            <div className="nvHeroCard"><span>CAFÉ DEMO · EJEMPLO</span><b>Cada visita cuenta</b><div className="nvCardProgress"><i /><i /><i /><i /><i /><i /></div><small>4 de 6 visitas</small></div>
            <div className="nvFloat nvFloatPoints"><b>+1 punto</b><small>En su tarjeta digital</small></div>
          </div>
        </div>
      </section>

      <section className="nvValueSection" id="producto" aria-labelledby="product-title">
        <div className="nvContainer">
          <div className="nvSectionHeading" data-reveal><div><span className="nvEyebrow">PUNTOS · RESEÑAS · REGALO DIGITAL</span><h2 id="product-title">Premia el regreso.<br /><em>Haz fácil opinar.</em></h2></div><p>Y deja que tus clientes también puedan regalar una visita.</p></div>
          <div className="nvProductGrid">
            <article className="nvProductCard nvProductPoints" data-reveal><div className="nvProductImage"><Photo src="/assets/img/landing/puntos.webp" alt="Cliente acerca su teléfono al mostrador y suma puntos en su tarjeta digital" /><span className="nvProductBadge">+1 punto · ejemplo</span></div><div className="nvProductBody"><span className="nvValueKicker">PUNTOS</span><h3>Un premio a la vista.</h3><p>Define la meta y el premio. Tu equipo registra la visita; tu cliente ve su avance en el celular.</p><a href="/demo">Así se ve la tarjeta <LandingIcon name="arrow" /></a></div></article>
            <article className="nvProductCard nvProductReviews" data-reveal><div className="nvProductImage"><Photo src="/assets/img/landing/resenas.webp" alt="Cliente acerca su teléfono a una tarjeta NFC para dejar una reseña" /><span className="nvProductBadge">NFC + QR</span></div><div className="nvProductBody"><span className="nvValueKicker">RESEÑAS DE GOOGLE</span><h3>De una buena visita a tu ficha.</h3><p>Tu cliente abre el enlace con NFC o QR. Nival responde reseñas según tu plan y permiso.</p><a href="/demo">Ver Inicio y reseñas <LandingIcon name="arrow" /></a></div></article>
            <article className="nvProductCard nvProductGift" data-reveal><div className="nvProductImage"><Photo src="/assets/img/landing/6111.webp" alt="Una persona comparte café y pan dulce en una cafetería" /><div className="nvGiftPreview"><small>NIVAL PAY · EJEMPLO</small><b>Un regalo<br/>para disfrutar</b><span>Tarjeta digital</span></div></div><div className="nvProductBody"><span className="nvValueKicker">TARJETA DE REGALO DIGITAL</span><h3>Que también te regalen.</h3><p>Comparte una tarjeta digital de Nival Pay por enlace o QR para que otra persona visite tu negocio.</p><a href={whatsapp('tarjeta de regalo Nival Pay')} target="_blank" rel="noreferrer">Conocer Nival Pay <LandingIcon name="arrow" /></a></div></article>
          </div>
          <aside className="nvJourney" aria-label="Cómo se usa Nival en el negocio" data-reveal>
            <div className="nvJourneyHead"><span className="nvWhyLabel">ASÍ SE USA EN EL DÍA A DÍA</span><b>Del mostrador al siguiente paso.</b></div>
            <div className="nvJourneySteps">
              <div className="nvJourneyStep"><i>01</i><b>Lo configuras</b><span>Premio, sucursal y ficha de Google.</span></div>
              <div className="nvJourneyStep"><i>02</i><b>Tu cliente participa</b><span>Acerca su celular, escanea o abre su tarjeta.</span></div>
              <div className="nvJourneyStep"><i>03</i><b>Tú das seguimiento</b><span>Revisa actividad y próximos pasos en Inicio.</span></div>
            </div>
          </aside>
        </div>
      </section>

      <section className="nvPanelSection" id="panel" aria-labelledby="panel-title">
        <div className="nvContainer"><div className="nvDashboardIntro" data-reveal><span className="nvEyebrow">TU NEGOCIO, DE UN VISTAZO</span><h2 id="panel-title">Mira qué pasa.<br /><em>Decide qué sigue.</em></h2><p>Consulta visitas, grupos de clientes y Google desde Inicio. Plus agrega la comparación con negocios de tu zona.</p><a className="nvTextLink" href="/demo">Explorar el panel <LandingIcon name="arrow" /></a></div>
          <div className="nvDashboardMock" aria-label="Vista ilustrativa del Dashboard de Nival">
            <div className="nvDashSidebar"><div className="nvDashBrand"><i>N</i><b>nival</b></div><small>CAFÉ DEMO</small><span className="is-selected">⌂　Inicio</span><span>▧　Tarjetas</span><span>♙　Clientes</span><span>▤　Operación</span><span>⚙　Cuenta</span></div>
            <div className="nvDashMain"><div className="nvDashTop"><div><small>CAFÉ DEMO · DATOS DE EJEMPLO · PLAN PLUS</small><h3>Inicio</h3></div><button type="button" aria-label="Sucursal seleccionada">⌖　Centro</button></div>
              <div className="nvDashTitle"><div><small>ACTIVIDAD · ÚLTIMOS 30 DÍAS</small><h4>Resumen del periodo</h4></div><div className="nvDashPeriods"><span>7 días</span><b>30 días</b><span>90 días</span></div></div>
              <div className="nvDashRevenue"><small>INGRESOS DE CLIENTES RECURRENTES</small><strong>$428,600</strong><p>Tickets de clientes que ya habían visitado.</p><span>94 recurrentes　　+8% vs. periodo anterior</span></div>
              <div className="nvDashAnalytics"><article className="nvDashCard nvDashMix"><small>VISITAS DEL PERIODO</small><h4>Nuevos y recurrentes</h4><div className="nvDonut"><div><b>360</b><small>clientes</small></div></div><ul><li><i/>Recurrentes <b>282</b></li><li><i/>Nuevos <b>78</b></li></ul></article>
                <article className="nvDashCard nvDashActivity"><small>ACTIVIDAD</small><h4>Visitas registradas</h4><div className="nvChartLegend"><i/> Visitas <span>Últimos 30 días</span></div><svg viewBox="0 0 500 170" role="img" aria-label="Gráfica ilustrativa de visitas durante el periodo"><path className="nvChartGrid" d="M0 30H500M0 75H500M0 120H500M0 165H500"/><path className="nvChartArea" d="M5 135 C55 118 70 125 105 94 S165 115 200 79 S260 99 300 63 S355 95 390 48 S445 66 495 20 V165H5Z"/><path className="nvChartLine" d="M5 135 C55 118 70 125 105 94 S165 115 200 79 S260 99 300 63 S355 95 390 48 S445 66 495 20"/></svg><div className="nvChartLabels"><span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span></div></article>
                <article className="nvDashCard nvDashGroups"><small>CLIENTES</small><h4>Tus grupos</h4><div><i className="nvNew"/><span>Nuevos</span><b>78</b></div><div><i className="nvFrequent"/><span>Frecuentes</span><b>282</b></div><div><i className="nvRisk"/><span>En riesgo</span><b>24</b></div></article></div>
              <article className="nvDashGoogle"><div className="nvGoogleIcon">G</div><div><small>GOOGLE Y RESEÑAS</small><h4>Tu reputación, a la vista.</h4><p><strong>4.8 ★</strong> ejemplo <i>·</i> 18 nuevas</p></div><div className="nvGoogleQuota"><b>12 / 100</b><small>respuestas usadas<br/>este periodo</small><div><i/></div></div></article>
              <div className="nvDashBenchmark"><span>COMPARATIVO LOCAL · EJEMPLO</span><b>4.8 <i>Tu negocio</i></b><div><span/><span/></div><small>Promedio de la zona <strong>4.5</strong></small></div>
            </div>
          </div><small className="nvDashboardFoot">Vista y métricas de ejemplo · incluye herramientas según el plan.</small>
        </div>
      </section>

      <LandingIndustryCarousel />

      <section className="nvPlansSection" id="planes" aria-labelledby="plans-title">
        <div className="nvContainer"><div className="nvPlansIntro" data-reveal><div><span className="nvEyebrow">TRES FORMAS DE EMPEZAR</span><h2 id="plans-title">Elige lo que tu negocio necesita.</h2></div><p>Todos duran 30 días. Puntos, atención de reseñas y un resumen mensual para entender cómo va.</p></div>
          <div className="nvPlanGrid">{plans.map((plan) => <article className={`nvPlanCard${plan.featured ? " is-featured" : ""}`} key={plan.name} data-reveal>{plan.featured && <span className="nvPlanFlag">RECOMENDADO</span>}<span className="nvPlanName">NIVAL {plan.name.toUpperCase()}</span><p className="nvPlanFit">{plan.fit}</p><h3>{plan.price}<small> MXN <i>/ 30 días</i></small></h3><div className="nvPlanMetrics"><div><b>{plan.nfc}</b><span>tarjetas NFC + QR<br/>para reseñas</span></div><div><b>{plan.reviews}</b><span>respuestas Google<br/>por periodo</span></div><div><b>{plan.branches}</b><span>{plan.branches === "1" ? "sucursal" : "sucursales"}</span></div></div><p className="nvPlanServiceLine">Nival gestiona las respuestas de forma manual y con tu permiso.</p><p className="nvPlanShared"><b>En todos:</b> tarjeta digital de puntos, tarjeta de regalo Nival Pay y resumen PDF mensual.</p>{plan.name === "Plus" && <p className="nvPlanPlusLine"><LandingIcon name="check" />Comparación con negocios similares de tu zona</p>}<a className="nvButton" href={whatsapp(plan.name)} target="_blank" rel="noreferrer">Elegir {plan.name}<LandingIcon name="arrow" /></a></article>)}</div>
          <small className="nvPlanFoot">Precios en MXN. Las cuotas de respuesta se renuevan cada 30 días. Imágenes y cifras de ejemplo son ilustrativas.</small>
        </div>
      </section>

      <section className="nvFaqSection" id="preguntas" aria-labelledby="faq-title"><div className="nvContainer nvFaqGrid"><div><span className="nvEyebrow">PREGUNTAS FRECUENTES</span><h2 id="faq-title">Antes de empezar.</h2><a className="nvTextLink" href={whatsapp()} target="_blank" rel="noreferrer">Platica con Nival <LandingIcon name="arrow" /></a></div><div className="nvFaqList"><details><summary>¿Mis clientes tienen que descargar una app?</summary><p>No. Abren su tarjeta digital desde el navegador del celular.</p></details><details><summary>¿Cómo se suman los puntos?</summary><p>Tu equipo confirma la visita desde el panel y registra el punto. Tú defines qué premio se entrega y al llegar a qué meta.</p></details><details><summary>¿Nival publica reseñas automáticamente?</summary><p>No. Nival responde reseñas manualmente con el permiso de tu negocio, dentro del límite de tu plan. Tus clientes abren la ficha desde la tarjeta NFC o el QR.</p></details><details><summary>¿Qué cambia entre los planes?</summary><p>Las respuestas a reseñas por periodo, sucursales y tarjetas NFC + QR. Plus también incluye comparación con negocios similares de la zona.</p></details><details><summary>¿Cómo funciona la tarjeta de regalo?</summary><p>Se configura con Nival Pay y puedes compartir el enlace o QR con tus clientes.</p></details></div></div></section>

      <footer className="nvFooter"><div className="nvFooterTexture" aria-hidden="true"><Photo src="/assets/img/landing/6114.webp" alt="" /></div><div className="nvContainer"><div className="nvFooterCta"><div><span className="nvEyebrow">PUNTOS · RESEÑAS · REGALO DIGITAL</span><h2>La próxima visita<br/>puede empezar hoy.</h2></div><a className="nvButton nvButtonPrimary" href={whatsapp()} target="_blank" rel="noreferrer">Cuéntame de tu negocio <LandingIcon name="arrow" /></a></div><div className="nvFooterBottom"><Brand /><nav aria-label="Enlaces del pie"><a href="#giros">Negocios</a><a href="#producto">Productos</a><a href="#panel">Tu panel</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></nav><a href="https://wa.me/525539044788" target="_blank" rel="noreferrer">WhatsApp</a></div><p className="nvLegalNote">Privacidad y términos pendientes de revisión legal · Imágenes ilustrativas.</p></div></footer>
      <LandingMotion />
    </main>
  );
}
