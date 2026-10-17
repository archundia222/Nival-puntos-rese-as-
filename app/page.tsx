import Image from "next/image";
import LandingIcon from "./landing-icon";
import LandingMobileNav from "./landing-mobile-nav";
import LandingIndustryCarousel from "./landing-industry-carousel";
import LandingMotion from "./landing-motion";
import { OwnerView } from "../lib/owner/view";
import { rollingPeriodRange } from "../lib/owner/domain.mjs";
import { demoRollingPeriod } from "../lib/owner/demo-period.mjs";
import demoFixture from "../lib/owner/demo-fixtures.json";
import "./landing-reference.css";

const whatsapp = (plan?: string) =>
  `https://wa.me/525539044788?text=${encodeURIComponent(`Hola, quiero conocer Nival${plan ? ` ${plan}` : ""} para mi negocio.`)}`;

const plans = [
  { name: "Puntos", price: "$299", reviews: "10", branches: "1", nfc: "3", fit: "Para empezar a reconocer a quienes vuelven." },
  { name: "Esencial", price: "$399", reviews: "30", branches: "5", nfc: "6", fit: "Para atender más reseñas y varios puntos de venta.", featured: true },
  { name: "Plus", price: "$549", reviews: "100", branches: "10", nfc: "12", fit: "Para ampliar la gestión y comparar tu zona." },
];

const demoNow = new Date("2026-10-05T12:00:00Z");
const demoRange = rollingPeriodRange(30, demoNow);
const demoSource = demoRollingPeriod(demoFixture.month, demoRange);
const demoBusiness = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Café Demo", slug: "cafe-demo", status: "activo", price_mxn: 549, plan_name: "Plus", pay_card_url: "/demo/panel#nival-pay", pay_card_label: "Café Demo" };
const demoBranches = [{ id: "demo-branch-1", business_id: demoBusiness.id, name: "Condesa", active: true, is_primary: true }, { id: "demo-branch-2", business_id: demoBusiness.id, name: "Roma Norte", active: true }, { id: "demo-branch-3", business_id: demoBusiness.id, name: "Mixcoac", active: true }];
const demoOwnerData = { ...demoSource, repliesUsed: 94, activeRewards: 3, zoneComparison: { rating: 4.8, reviews: 1486, average_rating: 4.5, average_reviews: 1320, difference: 0.3, sample: true }, branches: demoBranches, selectedBranch: demoBranches[0] };

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
            <span className="nvEyebrow">LEALTAD DIGITAL PARA NEGOCIOS</span>
            <h1 id="hero-title">Puntos, reseñas y regalos.<br />Desde tu mostrador.</h1>
            <p>Tu cliente suma puntos, abre tu ficha de Google con NFC o QR y puede llevarse una tarjeta de regalo digital. Tú lo manejas desde un solo lugar.</p>
            <div className="nvHeroActions"><a className="nvButton nvButtonPrimary" href={whatsapp()} target="_blank" rel="noreferrer">Cotizar por WhatsApp <LandingIcon name="arrow" /></a><a className="nvButton nvButtonOutline" href="/demo/panel">Ver el panel en acción</a></div>
            <div className="nvHeroProof"><span>Sin app para tus clientes</span><i /> <span>Desde $299 MXN / 30 días</span></div>
          </div>
          <div className="nvHeroImageWrap" aria-label="Cafetería con una tarjeta NFC sobre el mostrador" data-reveal>
            <Photo src="/assets/img/landing/6105.webp" alt="Mostrador de cafetería con luz de mañana y soporte para teléfono" priority />
            <div className="nvHeroCard"><span>CAFÉ DEMO · EJEMPLO</span><b>Cada visita cuenta</b><div className="nvCardProgress"><i /><i /><i /><i /><i /><i /></div><small>4 de 6 visitas</small></div>
          </div>
        </div>
      </section>

      <section className="nvValueSection" id="producto" aria-labelledby="product-title">
        <div className="nvContainer">
          <div className="nvSectionHeading" data-reveal><div><span className="nvEyebrow">PUNTOS · GOOGLE · REGALO DIGITAL</span><h2 id="product-title">Que te recuerden.<br /><em>Que te recomienden.</em></h2></div><p>Un sistema sencillo para premiar visitas, abrir reseñas y compartir tu negocio.</p></div>
          <div className="nvProductGrid">
            <article className="nvProductCard nvProductPoints" data-reveal><div className="nvProductImage"><Photo src="/assets/img/landing/puntos.webp" alt="Cliente acerca su teléfono al mostrador y suma puntos en su tarjeta digital" /><span className="nvProductBadge">+1 punto · ejemplo</span></div><div className="nvProductBody"><span className="nvValueKicker">LEALTAD DIGITAL</span><h3>Que cada visita acerque el premio.</h3><p>Elige la meta y la recompensa. Tu equipo suma visitas; cada cliente ve cuánto le falta en su celular.</p><a href="/demo/tarjeta">Ver tarjeta de cliente <LandingIcon name="arrow" /></a></div></article>
            <article className="nvProductCard nvProductReviews" data-reveal><div className="nvProductImage"><Photo src="/assets/img/landing/resenas.webp" alt="Cliente acerca su teléfono a una tarjeta NFC para dejar una reseña" /><span className="nvProductBadge">NFC + QR</span></div><div className="nvProductBody"><span className="nvValueKicker">RESEÑAS DE GOOGLE</span><h3>De tu mostrador a Google.</h3><p>Acerca el teléfono o escanea el QR y abre tu ficha para dejar una reseña, sin buscar el enlace.</p><a href="/demo/panel#google">Ver seguimiento en Inicio <LandingIcon name="arrow" /></a></div></article>
            <article className="nvProductCard nvProductGift" data-reveal><div className="nvProductImage"><Photo src="/assets/img/landing/6111.webp" alt="Una persona comparte café y pan dulce en una cafetería" /><div className="nvGiftPreview"><small>NIVAL PAY · EJEMPLO</small><b>Un regalo<br/>para disfrutar</b><span>Tarjeta digital</span></div></div><div className="nvProductBody"><span className="nvValueKicker">TARJETA DE REGALO</span><h3>Comparte algo que invita a volver.</h3><p>Ofrece una tarjeta de regalo digital de tu negocio para que tus clientes la compartan.</p><a href={whatsapp('tarjeta de regalo Nival Pay')} target="_blank" rel="noreferrer">Conocer Nival Pay <LandingIcon name="arrow" /></a></div></article>
          </div>
          <aside className="nvGoogleStory" data-reveal aria-label="Herramientas para cuidar tu presencia en Google">
            <div className="nvGoogleStoryCopy"><span className="nvValueKicker">TU FICHA DE GOOGLE</span><h3>Cuida tu reputación y gana presencia local.</h3><p>Revisa calificación, reseñas y respuestas. Nival prepara un resumen con áreas de mejora y lo que tus clientes ya valoran; en Plus comparas negocios cercanos. Las respuestas se gestionan manualmente y con tu permiso.</p></div>
            <div className="nvGoogleStorySample"><span>EJEMPLO · RESUMEN DEL MES</span><div><b>4.8 <i>★</i></b><small>calificación</small></div><div><b>18</b><small>reseñas nuevas</small></div><div><b>12 / 100</b><small>respuestas incluidas en Plus</small></div><p><strong>Seguir haciendo:</strong> atención amable <i>·</i> <strong>Revisar:</strong> tiempo de espera</p></div>
          </aside>
          <aside className="nvJourney" aria-label="Cómo se usa Nival en el negocio" data-reveal>
            <div className="nvJourneyHead"><span className="nvWhyLabel">ASÍ SE USA EN TU NEGOCIO</span><b>Empieza en el mostrador.</b></div>
            <div className="nvJourneySteps">
              <div className="nvJourneyStep"><i>01</i><b>Eliges qué ofrecer</b><span>Premio, sucursales y enlace de Google.</span></div>
              <div className="nvJourneyStep"><i>02</i><b>Tu cliente acerca o escanea</b><span>Entra a sus puntos o a tu ficha.</span></div>
              <div className="nvJourneyStep"><i>03</i><b>Revisas qué sigue</b><span>Visitas, clientes y reseñas en Inicio.</span></div>
            </div>
          </aside>
        </div>
      </section>

      <section className="nvPanelSection" id="panel" aria-labelledby="panel-title">
        <div className="nvContainer"><div className="nvDashboardIntro" data-reveal><span className="nvEyebrow">PANEL REAL · DEMO INTERACTIVA</span><h2 id="panel-title">Esto es lo que ves en Inicio.</h2><p>Gráficas de visitas, clientes por grupo y seguimiento de Google en el mismo panel. La demo abre un negocio de ejemplo con plan Plus.</p><a className="nvTextLink" href="/demo/panel">Abrir demo completa <LandingIcon name="arrow" /></a></div>
          <div className="nvLivePanel" data-reveal><div className="nvLivePanelBar"><span><i /> CAFÉ DEMO · DATOS DE EJEMPLO</span><a href="/demo/panel">Abrir pantalla completa <LandingIcon name="arrow" /></a></div><div className="nvLivePanelBody"><OwnerView actor={{id:"11111111-1111-4111-8111-111111111111",name:"Dueño de Café Demo"}} b={demoBusiness} businesses={[demoBusiness]} range={demoRange} data={demoOwnerData} demo embedded /></div></div>
          <small className="nvDashboardFoot">La demo es interactiva; las cifras y el negocio son de ejemplo.</small>
        </div>
      </section>

      <LandingIndustryCarousel />

      <section className="nvPlansSection" id="planes" aria-labelledby="plans-title">
        <div className="nvContainer"><div className="nvPlansIntro" data-reveal><div><span className="nvEyebrow">PLANES NIVAL · 30 DÍAS</span><h2 id="plans-title">Elige cómo quieres crecer.</h2></div><p>Compara el alcance y elige el plan para tu negocio.</p></div>
          <div className="nvPlanGrid">{plans.map((plan) => <article className={`nvPlanCard${plan.featured ? " is-featured" : ""}`} key={plan.name} data-reveal>{plan.featured && <span className="nvPlanFlag">RECOMENDADO</span>}<div className="nvPlanTop"><span className="nvPlanName">NIVAL {plan.name.toUpperCase()}</span><p className="nvPlanFit">{plan.fit}</p></div><div className="nvPlanPrice"><strong>{plan.price}</strong><span>MXN <i>por 30 días</i></span></div><p className="nvPlanCardLead">Incluye estas herramientas:</p><ul className="nvPlanPerks"><li><b>{plan.nfc}</b><span>tarjetas NFC + QR que abren tu ficha de Google</span></li><li><b>{plan.reviews}</b><span>respuestas a reseñas de Google por periodo</span></li><li><b>{plan.branches}</b><span>{plan.branches === "1" ? "sucursal" : "sucursales"} para organizar tu operación</span></li></ul>{plan.name === "Plus" && <p className="nvPlanPlusLine"><LandingIcon name="check" />Comparación con negocios similares de tu zona</p>}<a className="nvButton" href={whatsapp(plan.name)} target="_blank" rel="noreferrer">Elegir {plan.name}<LandingIcon name="arrow" /></a></article>)}</div>
          <aside className="nvPlanIncludes" data-reveal><div><span>EN TODOS LOS PLANES</span><b>Lo que puedes hacer con Nival</b></div><ul><li><LandingIcon name="check"/>Dar puntos por visitas y canjear premios</li><li><LandingIcon name="check"/>Consultar visitas y grupos de clientes</li><li><LandingIcon name="check"/>Revisar calificación, reseñas y respuestas de Google en Inicio</li><li><LandingIcon name="check"/>Compartir una tarjeta digital de regalo con Nival Pay</li><li><LandingIcon name="check"/>Descargar el resumen mensual en PDF</li></ul></aside>
          <small className="nvPlanFoot">Nival gestiona las respuestas de forma manual y con tu permiso. Las cuotas se renuevan cada 30 días. Precios en MXN.</small>
        </div>
      </section>

      <section className="nvFaqSection" id="preguntas" aria-labelledby="faq-title"><div className="nvContainer nvFaqGrid"><div><span className="nvEyebrow">PREGUNTAS FRECUENTES</span><h2 id="faq-title">Lo esencial, sin vueltas.</h2><a className="nvTextLink" href={whatsapp()} target="_blank" rel="noreferrer">Platica con Nival <LandingIcon name="arrow" /></a></div><div className="nvFaqList"><details><summary>¿Mis clientes tienen que descargar una app?</summary><p>No. Abren su tarjeta digital desde el navegador del celular.</p></details><details><summary>¿Cómo se suman los puntos?</summary><p>Tu equipo confirma la visita desde el panel y registra el punto. Tú defines qué premio se entrega y al llegar a qué meta.</p></details><details><summary>¿Nival publica reseñas automáticamente?</summary><p>No. Nival responde reseñas manualmente con el permiso de tu negocio, dentro del límite de tu plan. Tus clientes abren la ficha desde la tarjeta NFC o el QR.</p></details><details><summary>¿Qué cambia entre los planes?</summary><p>Las respuestas a reseñas por periodo, sucursales y tarjetas NFC + QR. Plus también incluye comparación con negocios similares de la zona.</p></details><details><summary>¿Cómo funciona la tarjeta de regalo?</summary><p>Se configura con Nival Pay y puedes compartir el enlace o QR con tus clientes.</p></details></div></div></section>

      <footer className="nvFooter"><div className="nvFooterTexture" aria-hidden="true"><Photo src="/assets/img/landing/6114.webp" alt="" /></div><div className="nvContainer"><div className="nvFooterCta"><div><span className="nvEyebrow">PUNTOS · RESEÑAS · REGALO DIGITAL</span><h2>La próxima visita<br/>puede empezar hoy.</h2></div><a className="nvButton nvButtonPrimary" href={whatsapp()} target="_blank" rel="noreferrer">Cuéntame de tu negocio <LandingIcon name="arrow" /></a></div><div className="nvFooterBottom"><Brand /><nav aria-label="Enlaces del pie"><a href="#giros">Negocios</a><a href="#producto">Productos</a><a href="#panel">Tu panel</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></nav><a href="https://wa.me/525539044788" target="_blank" rel="noreferrer">WhatsApp</a></div><p className="nvLegalNote">Privacidad y términos pendientes de revisión legal · Imágenes ilustrativas.</p></div></footer>
      <LandingMotion />
    </main>
  );
}
