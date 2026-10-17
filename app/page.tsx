import type { ReactNode } from "react";
import LandingIcon from "./landing-icon";
import LandingMotion from "./landing-motion";
import LandingMobileNav from "./landing-mobile-nav";
import "./landing-reference.css";

const quoteUrl = (plan?: string) =>
  "https://wa.me/525539044788?text=" +
  encodeURIComponent(
    `Hola, quiero cotizar ${plan ? `Nival ${plan}` : "Nival Puntos + Reseñas"} para mi negocio.`,
  );
const whatsapp = quoteUrl();

const plans = [
  {
    name: "Puntos",
    price: "$299",
    detail: "Para empezar a premiar cada visita.",
    limit: "10 respuestas a reseñas / periodo",
    branches: "1 sucursal",
    cards: "3 tarjetas NFC + QR para reseñas",
    featured: false,
  },
  {
    name: "Esencial",
    price: "$399",
    detail: "Lealtad y reputación en un mismo lugar.",
    limit: "30 respuestas a reseñas / periodo",
    branches: "Hasta 5 sucursales",
    cards: "6 tarjetas NFC + QR para reseñas",
    featured: true,
  },
  {
    name: "Plus",
    price: "$549",
    detail: "Más alcance para negocios en crecimiento.",
    limit: "100 respuestas a reseñas / periodo",
    branches: "Hasta 10 sucursales",
    cards: "12 tarjetas NFC + QR para reseñas",
    featured: false,
  },
];

function Brand() {
  return (
    <a className="nvBrand" href="#inicio" aria-label="Nival, inicio">
      <span className="nvBrandMark" aria-hidden="true">N</span>
      <span>NIVAL</span>
    </a>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="nvEyebrow">{children}</span>;
}

function ImagePlaceholder({
  number,
  description,
  className = "",
}: {
  number: number;
  description: string;
  className?: string;
}) {
  return (
    <div className={`nvImagePlaceholder ${className}`} role="img" aria-label={`Espacio para imagen ${number}: ${description}`}>
      <span className="nvImageNumber">IMAGEN {number}</span>
      <span className="nvImageDescription">{description}</span>
      <span className="nvImageNote">Ilustrativa · pendiente de recibir</span>
    </div>
  );
}

function Arrow({ children, href, className = "" }: { children: ReactNode; href: string; className?: string }) {
  return <a className={className} href={href}>{children}<LandingIcon name="arrow" /></a>;
}

function ReviewDots() {
  return <span aria-label="4 de 6 visitas"><i /><i /><i /><i /><i className="is-empty" /><i className="is-empty" /></span>;
}

export default function Home() {
  return (
    <main className="nivalLanding" id="inicio">
      <LandingMotion />
      <header className="nvNav">
        <div className="nvNavInner">
          <Brand />
          <nav className="nvDesktopNav" aria-label="Navegación principal">
            <a href="#producto">Producto</a><a href="#panel">Tu panel</a><a href="#resenas">Reseñas</a><a href="#planes">Planes</a>
          </nav>
          <div className="nvNavActions">
            <a className="nvLogin" href="/acceso">Entrar</a>
            <a className="nvNavCta" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a>
          </div>
          <LandingMobileNav />
        </div>
      </header>

      <section className="nvHero" aria-labelledby="hero-title">
        <div className="nvContainer nvHeroGrid">
          <div className="nvHeroCopy">
            <Eyebrow>LEALTAD Y RESEÑAS PARA NEGOCIOS LOCALES</Eyebrow>
            <h1 id="hero-title">Haz que tu negocio sea <em>el que eligen.</em></h1>
            <p className="nvHeroLead">Premia a quienes regresan, facilita nuevas reseñas y entiende mejor lo que pasa en tu negocio. Todo desde un solo panel.</p>
            <div className="nvHeroActions">
              <a className="nvButton nvButtonPrimary" href={whatsapp} target="_blank" rel="noreferrer">Cotizar mi plan <LandingIcon name="arrow" /></a>
              <a className="nvButton nvButtonOutline" href="/demo">Explorar demo</a>
            </div>
            <div className="nvHeroProof"><span><LandingIcon name="phone" /> Sin app para tus clientes</span><span><LandingIcon name="qr" /> QR y NFC</span><span>Desde $299 MXN / 30 días</span></div>
          </div>
          <div className="nvHeroStage" aria-label="Vista ilustrativa del panel Nival">
            <ImagePlaceholder number={1} description="Mano con celular acercándose a un soporte NFC en un mostrador (4:5)" className="nvHeroImage" />
            <div className="nvProductWindow">
              <div className="nvWindowTop"><span className="nvWindowDots"><i /><i /><i /></span><b>Café Demo</b><small>DATOS DE EJEMPLO</small></div>
              <div className="nvWindowBody">
                <aside className="nvWindowRail"><span className="is-active">⌂</span><span>▦</span><span>☆</span><span>◉</span></aside>
                <div className="nvWindowContent">
                  <div className="nvWindowGreeting"><div><small>INICIO · ÚLTIMOS 30 DÍAS</small><b>Tu negocio, de un vistazo</b></div><span>Condesa⌄</span></div>
                  <div className="nvWindowMetrics"><article><small>Visitas</small><b>1,284</b><i>+12% · ejemplo</i></article><article><small>Clientes que volvieron</small><b>326</b><i>+8% · ejemplo</i></article><article><small>Reseñas por responder</small><b>7</b><i>Ejemplo</i></article></div>
                  <div className="nvWindowChart"><div className="nvChartTitle"><span>Visitas registradas</span><small>30 días</small></div><svg viewBox="0 0 520 148" role="img" aria-label="Gráfica ilustrativa de visitas"><path className="nvChartFill" d="M0 119 C45 96 54 103 91 82 S143 104 182 72 S235 84 272 56 S331 73 368 41 S418 68 455 32 S495 44 520 14 V148 H0Z"/><path className="nvChartLine" d="M0 119 C45 96 54 103 91 82 S143 104 182 72 S235 84 272 56 S331 73 368 41 S418 68 455 32 S495 44 520 14"/><circle cx="455" cy="32" r="5" /></svg><div className="nvChartAxis"><span>1 jun</span><span>10 jun</span><span>20 jun</span><span>30 jun</span></div></div>
                  <div className="nvWindowBottom"><div><i className="nvLegendDot"/><span>Frecuentes</span><b>142</b></div><div><i className="nvLegendDot nvLegendLime"/><span>Nuevos</span><b>38</b></div><div className="nvWindowHint">Muestra · no son datos reales</div></div>
                </div>
              </div>
            </div>
            <div className="nvFloat nvFloatPoints"><b>+1 punto</b><small>Visita registrada</small></div>
            <div className="nvFloat nvFloatReview"><b>Nueva reseña</b><small>Lista para revisar</small></div>
          </div>
        </div>
      </section>

      <section className="nvIndustriesSection" id="giros" aria-labelledby="industries-title">
        <div className="nvContainer"><div className="nvSectionHeading nvIndustryHeading"><div><Eyebrow>PARA NEGOCIOS CON CLIENTES QUE REGRESAN</Eyebrow><h2 id="industries-title">De tu mostrador a su <em>próxima visita.</em></h2></div><span className="nvExampleTag">Ejemplos de diseño</span></div><div className="nvIndustryGrid"><article className="nvIndustryTile nvIndustryCafe"><ImagePlaceholder number={2} description="Interior de cafetería con luz de mañana (16:9)"/><div><small>CAFETERÍA</small><b>Junta visitas para un café de cortesía.</b></div></article><article className="nvIndustryTile nvIndustryTaco"><ImagePlaceholder number={3} description="Taquería"/><div><small>TAQUERÍA</small><b>Premia a quien ya conoce su orden favorita.</b></div></article><article className="nvIndustryTile nvIndustryBakery"><ImagePlaceholder number={4} description="Pan dulce"/><div><small>PANADERÍA</small><b>Un antojo que da ganas de volver.</b></div></article><article className="nvIndustryTile nvIndustryRestaurant"><ImagePlaceholder number={5} description="Mesa de restaurante"/><div><small>RESTAURANTE</small><b>Reconoce a tus clientes frecuentes.</b></div></article></div></div>
      </section>

      <section className="nvProductSection" id="producto" aria-labelledby="product-title">
        <div className="nvContainer">
          <div className="nvSectionHeading nvProductHeading"><div><Eyebrow>UNA HERRAMIENTA, CLARA PARA TODOS</Eyebrow><h2 id="product-title">De la primera visita a la <em>siguiente.</em></h2></div><p>Tu cliente participa fácil. Tu equipo sabe qué hacer. Tú puedes ver cómo va.</p></div>
          <div className="nvProductBoard">
            <article className="nvProductLead">
              <div className="nvProductIcon"><LandingIcon name="trophy" /></div><span>01 · LEALTAD</span><h3>Una tarjeta digital que invita a volver.</h3><p>Registra visitas y puntos, muestra el avance y deja claro cuál es la recompensa.</p>
              <div className="nvLoyaltyCard"><small>NIVAL · PUNTOS</small><b>Café Demo</b><span>Un café de cortesía</span><ReviewDots /><i>4 de 6 visitas · ejemplo</i></div>
              <Arrow href="/demo" className="nvArrowLink">Ver cómo funciona</Arrow>
            </article>
            <div className="nvProductStack">
              <article className="nvFeatureRow"><span className="nvProductIcon"><LandingIcon name="qr" /></span><div><small>02 · EN EL MOSTRADOR</small><h3>Tu equipo registra la visita.</h3><p>El cliente muestra su tarjeta; el empleado confirma la compra y suma el punto.</p></div><b className="nvFeatureNumber">+1</b></article>
              <article className="nvFeatureRow"><span className="nvProductIcon"><LandingIcon name="star" /></span><div><small>03 · RESEÑAS</small><h3>Haz más fácil compartir su opinión.</h3><p>Tarjetas NFC y QR llevan a tu ficha. Revisa y responde desde el panel, según tu plan.</p></div><b className="nvFeatureNumber">★</b></article>
              <div className="nvIllustrationPair"><ImagePlaceholder number={6} description="Celular acercándose al soporte NFC"/><ImagePlaceholder number={7} description="Manos de empleado registrando una visita"/></div>
            </div>
          </div>
          <div className="nvProductFoot"><span><LandingIcon name="gift"/> Tarjeta de regalo digital disponible como complemento.</span><a href={whatsapp} target="_blank" rel="noreferrer">Pregunta por Nival Pay <LandingIcon name="arrow"/></a></div>
        </div>
      </section>

      <section className="nvHowSection" id="como-funciona" aria-labelledby="how-title"><div className="nvContainer"><div className="nvSectionHeading nvHowHeading"><div><Eyebrow>ASÍ SE USA EN EL DÍA A DÍA</Eyebrow><h2 id="how-title">Tres pasos. Un <em>flujo sencillo.</em></h2></div><p>Tu equipo atiende el mostrador. Nival lleva el registro.</p></div><div className="nvHowRail"><article><span>01</span><div><b>Escanean.</b><p>Tu cliente abre su tarjeta digital con un QR, sin instalar una app.</p></div><div className="nvStepCard"><LandingIcon name="qr"/><span>Tarjeta de puntos</span><b>Abierta en su celular</b></div></article><article><span>02</span><div><b>Suman.</b><p>El personal confirma la visita desde el panel del negocio.</p></div><div className="nvStepCard nvStepCardGreen"><LandingIcon name="trophy"/><span>Visita registrada</span><b>+1 punto</b></div></article><article><span>03</span><div><b>Canjean.</b><p>Al llegar a la meta, tu equipo registra la recompensa entregada.</p></div><div className="nvStepCard nvStepCardLime"><LandingIcon name="gift"/><span>Meta completada</span><b>Premio listo</b></div></article></div><div className="nvHowNote"><ImagePlaceholder number={8} description="Mano entregando café con concha y ticket"/><p><b>Tú eliges la recompensa.</b><br/>Configuras cuántas visitas se necesitan y qué premio recibe el cliente.</p><Arrow href="/demo">Ver la experiencia</Arrow></div></div></section>

      <section className="nvOwnerSection" id="panel" aria-labelledby="owner-title">
        <div className="nvContainer nvOwnerGrid">
          <div className="nvOwnerCopy"><Eyebrow>EL CENTRO DE TU OPERACIÓN</Eyebrow><h2 id="owner-title">Tu panel te dice <em>qué sigue.</em></h2><p>Revisa puntos, visitas, reseñas y grupos de clientes desde el mismo inicio. Cambia de sucursal cuando lo necesites.</p>
            <div className="nvSegmentList"><div><i className="nvDot nvDotNew"/><span><b>Nuevos</b><small>Primera visita · ejemplo</small></span><strong>38</strong></div><div><i className="nvDot nvDotRegular"/><span><b>Frecuentes</b><small>Regresaron varias veces · ejemplo</small></span><strong>142</strong></div><div><i className="nvDot nvDotRisk"/><span><b>En riesgo</b><small>Según la actividad configurada · ejemplo</small></span><strong>24</strong></div></div>
            <div className="nvOwnerTip"><span>UNA SUGERENCIA · EJEMPLO</span><b>Invita a quienes llevan tiempo sin volver a conocer la recompensa de este mes.</b><a href="/demo">Explorar la demo <LandingIcon name="arrow"/></a></div>
          </div>
          <div className="nvOwnerVisual"><ImagePlaceholder number={10} description="Dueño de espaldas con laptop" className="nvOwnerImage"/><div className="nvDashPreview"><header><div><small>PANEL · CAFÉ DEMO</small><b>Actividad</b></div><span>Condesa⌄</span></header><div className="nvDashTotals"><article><small>Visitas</small><b>1,284</b><span>Este periodo</span></article><article><small>Clientes nuevos</small><b>38</b><span>Este periodo</span></article><article><small>Puntos canjeados</small><b>96</b><span>Este periodo</span></article></div><div className="nvDashChart"><div><b>Visitas</b><span>ÚLTIMOS 30 DÍAS</span></div><svg viewBox="0 0 600 185" role="img" aria-label="Tendencia ilustrativa de visitas"><path className="nvDashFill" d="M0 149 C44 132 47 124 92 134 S146 86 193 108 S247 96 292 73 S346 102 389 77 S438 82 484 37 S545 72 600 20 V185 H0Z"/><path className="nvDashLine" d="M0 149 C44 132 47 124 92 134 S146 86 193 108 S247 96 292 73 S346 102 389 77 S438 82 484 37 S545 72 600 20"/><circle cx="484" cy="37" r="5"/></svg><footer><span>1 jun</span><span>10 jun</span><span>20 jun</span><span>30 jun</span></footer></div><div className="nvDashClients"><div><b>Clientes</b><small>GRUPOS PARA DAR SEGUIMIENTO</small></div><span><i className="nvDot nvDotNew"/>Nuevos <b>38</b></span><span><i className="nvDot nvDotRegular"/>Frecuentes <b>142</b></span><span><i className="nvDot nvDotRisk"/>En riesgo <b>24</b></span><small className="nvSampleLabel">Datos de ejemplo · vista ilustrativa</small></div></div><div className="nvPdfBadge"><LandingIcon name="chart"/><span><b>Resumen del periodo</b><small>Descargable en PDF</small></span></div></div>
        </div>
      </section>

      <section className="nvReviewsSection" id="resenas" aria-labelledby="reviews-title">
        <div className="nvContainer nvReviewsGrid"><div className="nvReviewVisual"><ImagePlaceholder number={9} description="Mesa con taza, concha y celular"/><div className="nvReviewInbox"><header><div><small>GOOGLE · EJEMPLO</small><b>Reseñas por atender</b></div><span>7 pendientes</span></header><article><div><b>★★★★★</b><small>Hace 2 h · ejemplo</small></div><p>“Buen café y atención muy amable.”</p><span className="nvReplyStatus">Respondida</span><blockquote>“Gracias por visitarnos. Nos da gusto que hayas disfrutado tu café.”</blockquote></article><article><div><b>★★★★☆</b><small>Ayer · ejemplo</small></div><p>“El pan está recién hecho.”</p><span className="nvReplyStatus is-pending">Pendiente</span></article><article><div><b>★★★★★</b><small>Ayer · ejemplo</small></div><p>“Regresaría por el desayuno.”</p><span className="nvReplyStatus is-pending">Pendiente</span></article><footer>Opiniones y respuestas de muestra</footer></div></div>
          <div className="nvReviewsCopy"><Eyebrow>RESEÑAS, EN EL MISMO PANEL</Eyebrow><h2 id="reviews-title">Escucha. Responde. <em>Mejora.</em></h2><p>Conecta tus reseñas de Google y lleva el seguimiento desde Nival. La cantidad de respuestas disponibles depende del plan.</p><div className="nvReviewPlanNote"><LandingIcon name="check"/><span><b>De 10 a 100 respuestas por periodo de 30 días.</b><small>El plan Plus también incluye comparación con negocios de la zona.</small></span></div><p className="nvSampleFootnote">Los mensajes mostrados son ejemplos. El plazo de respuesta del servicio está pendiente de confirmar.</p><Arrow href="#planes" className="nvArrowLink">Ver planes y límites</Arrow></div></div>
      </section>

      <section className="nvPlansSection" id="planes" aria-labelledby="plans-title">
        <div className="nvContainer"><div className="nvPlansIntro"><div><Eyebrow>PRECIOS CLAROS · PERIODOS DE 30 DÍAS</Eyebrow><h2 id="plans-title">Elige el tamaño que <em>te queda.</em></h2></div><p>Los tres planes incluyen puntos, reseñas de Google y resumen del periodo en PDF.</p></div>
          <div className="nvPlanGrid">{plans.map((plan)=><article className={`nvPlanCard${plan.featured?" is-featured":""}`} key={plan.name}>{plan.featured&&<span className="nvPlanFlag">RECOMENDADO</span>}<span className="nvPlanName">NIVAL {plan.name.toUpperCase()}</span><h3 className="nvPlanPrice">{plan.price}<small> MXN <i>/ 30 días</i></small></h3><p>{plan.detail}</p><div className="nvPlanDivider"/><ul><li><LandingIcon name="check"/>Programa de puntos y tarjeta digital</li><li><LandingIcon name="check"/>{plan.cards}</li><li><LandingIcon name="check"/>{plan.limit}</li><li><LandingIcon name="check"/>{plan.branches}</li><li><LandingIcon name="check"/>Resumen del periodo en PDF</li>{plan.name==="Plus"&&<li><LandingIcon name="check"/>Comparación con negocios cercanos</li>}</ul><a href={quoteUrl(plan.name)} target="_blank" rel="noreferrer" className={`nvButton ${plan.featured?"nvButtonPrimary":"nvButtonOutline"}`}>Cotizar {plan.name}<LandingIcon name="arrow"/></a></article>)}</div>
          <div className="nvPlanFoot"><span><LandingIcon name="gift"/><b>¿Buscas tarjetas de regalo o Nival Pay?</b> Se cotizan por separado como complemento.</span><a href={whatsapp} target="_blank" rel="noreferrer">Pedir información <LandingIcon name="arrow"/></a></div><p className="nvPlanCycle">Precios en MXN. Las respuestas no utilizadas no se acumulan entre periodos. Imágenes y cifras de las vistas del producto son ilustrativas.</p>
        </div>
      </section>

      <section className="nvFaqSection" id="preguntas" aria-labelledby="faq-title"><div className="nvContainer nvFaqGrid"><div className="nvFaqIntro"><Eyebrow>PARA EMPEZAR CON CLARIDAD</Eyebrow><h2 id="faq-title">Preguntas <em>directas.</em></h2><p>Si algo no está aquí, lo revisamos contigo.</p><a className="nvTextLink" href={whatsapp} target="_blank" rel="noreferrer">Preguntar por WhatsApp <LandingIcon name="arrow"/></a></div><div className="nvFaqList"><details><summary>¿Mis clientes tienen que descargar una app?</summary><p>No. La tarjeta de puntos se abre desde el navegador del celular.</p></details><details><summary>¿Cómo se suman los puntos?</summary><p>Tu equipo confirma la visita en el panel y registra el punto.</p></details><details><summary>¿Qué cambia entre los planes?</summary><p>El número de respuestas a reseñas por periodo, las sucursales y la cantidad de tarjetas NFC disponibles.</p></details><details><summary>¿Las tarjetas NFC y QR son para puntos?</summary><p>Las tarjetas NFC y QR incluidas llevan a tu ficha de reseñas de Google. Tu tarjeta de puntos es digital y se muestra dentro de Nival.</p></details><details><summary>¿Incluye tarjeta de regalo o Nival Pay?</summary><p>Son complementos con cotización aparte. Escríbenos para conocer opciones.</p></details><details><summary>¿Cuánto tardan en responder mis reseñas?</summary><p>El plazo de respuesta está pendiente de confirmar y se definirá antes de activar el servicio.</p></details></div></div></section>

      <footer className="nvFooter" id="contacto"><ImagePlaceholder number={11} description="Patrón verde repetible para fondos y cierre" className="nvFooterPattern"/><div className="nvContainer"><div className="nvFooterCta"><div><Eyebrow>DA EL SIGUIENTE PASO</Eyebrow><h2>Haz que quieran <em>volver.</em></h2><p>Cuéntanos de tu negocio y te ayudamos a elegir el plan.</p></div><a className="nvButton nvButtonLime" href={whatsapp} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow"/></a></div><div className="nvFooterTop"><div className="nvFooterBrand"><Brand/><span>Puntos y reseñas para negocios locales.</span></div><nav aria-label="Enlaces del pie"><a href="#producto">Producto</a><a href="#panel">Tu panel</a><a href="#resenas">Reseñas</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a><a href="#contacto">Contacto</a></nav><div className="nvFooterContact"><b>Contacto</b><a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp <LandingIcon name="arrow"/></a><small>Correo de contacto por confirmar.</small></div></div><div className="nvFooterBottom"><small>© 2026 Nival Tech · México</small><nav aria-label="Información legal"><a href="/privacidad">Privacidad · pendiente de revisión legal</a><a href="/terminos">Términos · pendiente de revisión legal</a></nav><small>Imágenes ilustrativas.</small></div></div></footer>
    </main>
  );
}
