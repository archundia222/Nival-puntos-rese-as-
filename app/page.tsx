import Image from "next/image";
import LandingIcon from "./landing-icon";
import LandingMobileNav from "./landing-mobile-nav";
import "./landing-reference.css";

const whatsapp = (plan?: string) =>
  `https://wa.me/525539044788?text=${encodeURIComponent(`Hola, quiero conocer Nival${plan ? ` ${plan}` : ""} para mi negocio.`)}`;

const plans = [
  { name: "Puntos", price: "$299", reviews: "10", branches: "1", nfc: "3" },
  { name: "Esencial", price: "$399", reviews: "30", branches: "5", nfc: "6", featured: true },
  { name: "Plus", price: "$549", reviews: "100", branches: "10", nfc: "12" },
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
            <a href="#producto">Qué incluye</a><a href="#panel">Tu panel</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a>
          </nav>
          <div className="nvNavActions"><a className="nvLogin" href="/acceso">Entrar</a><a className="nvNavCta" href={whatsapp()} target="_blank" rel="noreferrer">Cotizar <LandingIcon name="arrow" /></a></div>
          <LandingMobileNav />
        </div>
      </header>

      <section className="nvHero" aria-labelledby="hero-title">
        <div className="nvContainer nvHeroGrid">
          <div className="nvHeroCopy">
            <span className="nvEyebrow">PUNTOS Y RESEÑAS PARA TU NEGOCIO</span>
            <h1 id="hero-title">Que vuelvan.<br /><em>Que te elijan.</em></h1>
            <p>Premia las visitas y atiende tus reseñas desde un solo lugar.</p>
            <div className="nvHeroActions"><a className="nvButton nvButtonPrimary" href={whatsapp()} target="_blank" rel="noreferrer">Quiero conocer Nival <LandingIcon name="arrow" /></a><a className="nvButton nvButtonOutline" href="/demo">Ver demo</a></div>
            <div className="nvHeroProof"><span>Sin app para tus clientes</span><i /> <span>QR + NFC</span><i /> <span>Desde $299 MXN</span></div>
          </div>
          <div className="nvHeroImageWrap" aria-label="Cafetería con una tarjeta NFC sobre el mostrador">
            <Photo src="/assets/img/landing/6105.webp" alt="Mostrador de cafetería con luz de mañana y soporte para teléfono" priority />
            <div className="nvHeroCard"><span>CAFÉ DEMO · EJEMPLO</span><b>Tu próxima visita</b><div className="nvCardProgress"><i /><i /><i /><i /><i /><i /></div><small>4 de 6 visitas</small></div>
            <div className="nvFloat nvFloatPoints"><b>+1 punto</b><small>Visita registrada</small></div>
          </div>
        </div>
      </section>

      <section className="nvValueSection" id="producto" aria-labelledby="product-title">
        <div className="nvContainer">
          <div className="nvSectionHeading"><span className="nvEyebrow">LO ESENCIAL, EN UN SOLO PANEL</span><h2 id="product-title">Tres herramientas.<br /><em>Un lugar para verlas.</em></h2></div>
          <div className="nvValueGrid">
            <article className="nvValueCard nvValuePoints"><div className="nvValueImage"><Photo src="/assets/img/landing/6106.webp" alt="Taquero prepara órdenes al mostrador" /></div><span className="nvValueIcon"><LandingIcon name="trophy" /></span><h3>Puntos</h3><p>Tu cliente avanza a su recompensa visita a visita.</p></article>
            <article className="nvValueCard nvValueReviews"><div className="nvValueImage"><Photo src="/assets/img/landing/6109.webp" alt="Cliente acerca su teléfono a una tarjeta NFC sobre la mesa" /></div><span className="nvValueIcon"><LandingIcon name="star" /></span><h3>Reseñas</h3><p>Facilita que compartan su opinión y responde según tu plan.</p></article>
            <article className="nvValueCard nvValueDashboard"><div className="nvMiniDashboard"><div className="nvMiniTop"><span>CAFÉ DEMO · EJEMPLO</span><span>Últimos 30 días⌄</span></div><div className="nvMiniStats"><div><small>Visitas</small><b>1,284</b></div><div><small>Frecuentes</small><b>142</b></div><div><small>Reseñas</small><b>7</b></div></div><svg viewBox="0 0 420 98" role="img" aria-label="Gráfica ilustrativa de visitas"><path className="nvMiniFill" d="M0 75 C35 60 48 71 80 49 S126 62 156 42 S205 54 236 28 S286 54 315 35 S364 44 392 16 S410 21 420 10 V98 H0Z"/><path className="nvMiniLine" d="M0 75 C35 60 48 71 80 49 S126 62 156 42 S205 54 236 28 S286 54 315 35 S364 44 392 16 S410 21 420 10"/></svg></div><span className="nvValueIcon"><LandingIcon name="chart" /></span><h3>Tu panel</h3><p>Entiende cómo van las visitas y quiénes están regresando.</p></article>
          </div>
        </div>
      </section>

      <section className="nvPanelSection" id="panel" aria-labelledby="panel-title">
        <div className="nvContainer nvPanelGrid">
          <div className="nvPanelCopy"><span className="nvEyebrow">EL RESUMEN DE TU NEGOCIO</span><h2 id="panel-title">Entras y sabes <em>qué sigue.</em></h2><p>Visitas, reseñas y clientes en una vista clara.</p><div className="nvClientGroups"><div><span className="nvGroupDot nvNew"/><b>Nuevos</b><small>Primera visita</small><strong>38</strong></div><div><span className="nvGroupDot nvFrequent"/><b>Frecuentes</b><small>Ya regresaron</small><strong>142</strong></div><div><span className="nvGroupDot nvRisk"/><b>En riesgo</b><small>Sin visita reciente</small><strong>24</strong></div></div><small className="nvExampleNote">Datos de ejemplo. El periodo para identificar clientes en riesgo se configura en el panel.</small><a className="nvTextLink" href="/demo">Explorar el panel <LandingIcon name="arrow" /></a></div>
          <div className="nvPanelVisual"><Photo src="/assets/img/landing/6113.webp" alt="Dueño de cafetería revisa su negocio desde una laptop" /><div className="nvPanelOverlay"><b>Visitas registradas</b><span>Últimos 30 días · ejemplo</span><svg viewBox="0 0 460 110" role="img" aria-label="Tendencia ilustrativa de visitas"><path className="nvMiniFill" d="M0 82 C42 69 62 72 91 54 S146 69 173 47 S221 55 257 32 S308 51 339 28 S393 40 421 16 S444 22 460 9 V110 H0Z"/><path className="nvMiniLine" d="M0 82 C42 69 62 72 91 54 S146 69 173 47 S221 55 257 32 S308 51 339 28 S393 40 421 16 S444 22 460 9"/></svg><div className="nvPanelPeople"><span><i className="nvNew"/>Nuevos <b>38</b></span><span><i className="nvFrequent"/>Frecuentes <b>142</b></span><span><i className="nvRisk"/>En riesgo <b>24</b></span></div></div></div>
        </div>
      </section>

      <section className="nvPlansSection" id="planes" aria-labelledby="plans-title">
        <div className="nvContainer"><div className="nvPlansIntro"><div><span className="nvEyebrow">ELIGE SEGÚN TU NEGOCIO</span><h2 id="plans-title">Precios sin sorpresas.</h2></div><p>Todos los planes duran 30 días e incluyen puntos, reseñas y resumen en PDF.</p></div>
          <div className="nvPlanGrid">{plans.map((plan) => <article className={`nvPlanCard${plan.featured ? " is-featured" : ""}`} key={plan.name}>{plan.featured && <span className="nvPlanFlag">RECOMENDADO</span>}<span className="nvPlanName">NIVAL {plan.name.toUpperCase()}</span><h3>{plan.price}<small> MXN <i>/ 30 días</i></small></h3><ul><li><LandingIcon name="check" />{plan.nfc} tarjetas NFC + QR para reseñas</li><li><LandingIcon name="check" />{plan.reviews} respuestas a reseñas</li><li><LandingIcon name="check" />{plan.branches} {plan.branches === "1" ? "sucursal" : "sucursales"}</li><li><LandingIcon name="check" />Tarjeta digital de puntos</li>{plan.name === "Plus" && <li><LandingIcon name="check" />Comparación con negocios cercanos</li>}</ul><a className="nvButton" href={whatsapp(plan.name)} target="_blank" rel="noreferrer">Elegir {plan.name}<LandingIcon name="arrow" /></a></article>)}</div>
          <div className="nvAddon"><div className="nvAddonPhotos"><div><Photo src="/assets/img/landing/6111.webp" alt="Una persona entrega café y pan dulce" /></div><div><Photo src="/assets/img/landing/6107.webp" alt="Panadera sirve una pieza de pan dulce" /></div><div><Photo src="/assets/img/landing/6112.webp" alt="Mesa con taza de café y pan dulce" /></div></div><p><b>¿Quieres tarjeta de regalo o Nival Pay?</b><br />Se ofrecen como complementos. <a href={whatsapp()} target="_blank" rel="noreferrer">Pregúntanos <LandingIcon name="arrow" /></a></p></div>
          <small className="nvPlanFoot">Precios en MXN. Las cantidades de reseñas se renuevan cada periodo. Imágenes y cifras de ejemplo son ilustrativas.</small>
        </div>
      </section>

      <section className="nvFaqSection" id="preguntas" aria-labelledby="faq-title"><div className="nvContainer nvFaqGrid"><div><span className="nvEyebrow">PREGUNTAS FRECUENTES</span><h2 id="faq-title">¿Te queda alguna duda?</h2><a className="nvTextLink" href={whatsapp()} target="_blank" rel="noreferrer">Escríbenos por WhatsApp <LandingIcon name="arrow" /></a></div><div className="nvFaqList"><details><summary>¿Mis clientes tienen que descargar una app?</summary><p>No. Abren su tarjeta digital desde el navegador del celular.</p></details><details><summary>¿Cómo se suman los puntos?</summary><p>Tu equipo confirma la visita desde el panel y registra el punto.</p></details><details><summary>¿Qué cambia entre los planes?</summary><p>La cantidad de respuestas a reseñas, sucursales y tarjetas NFC incluidas.</p></details><details><summary>¿Incluye tarjeta de regalo y Nival Pay?</summary><p>Están disponibles como complementos. Escríbenos para conocer las opciones.</p></details></div></div></section>

      <footer className="nvFooter"><div className="nvFooterTexture" aria-hidden="true"><Photo src="/assets/img/landing/6114.webp" alt="" /></div><div className="nvContainer"><div className="nvFooterCta"><div><span className="nvEyebrow">NIVAL · PUNTOS Y RESEÑAS</span><h2>Haz que quieran volver.</h2></div><a className="nvButton nvButtonPrimary" href={whatsapp()} target="_blank" rel="noreferrer">Platiquemos <LandingIcon name="arrow" /></a></div><div className="nvFooterBottom"><Brand /><nav aria-label="Enlaces del pie"><a href="#producto">Qué incluye</a><a href="#panel">Tu panel</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></nav><a href="https://wa.me/525539044788" target="_blank" rel="noreferrer">WhatsApp</a></div><p className="nvLegalNote">Privacidad y términos pendientes de revisión legal · Imágenes ilustrativas.</p></div></footer>
    </main>
  );
}
