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
            <a href="#giros">Negocios</a><a href="#producto">Productos</a><a href="#panel">Tu panel</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a>
          </nav>
          <div className="nvNavActions"><a className="nvLogin" href="/acceso">Entrar</a><a className="nvNavCta" href={whatsapp()} target="_blank" rel="noreferrer">Cotizar <LandingIcon name="arrow" /></a></div>
          <LandingMobileNav />
        </div>
      </header>

      <section className="nvHero" aria-labelledby="hero-title">
        <div className="nvContainer nvHeroGrid">
          <div className="nvHeroCopy">
            <span className="nvEyebrow">PUNTOS Y RESEÑAS PARA TU NEGOCIO</span>
            <h1 id="hero-title"><span>Que vuelvan.</span><br /><em>Que te elijan.</em></h1>
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

      <section className="nvIndustrySection" id="giros" aria-labelledby="industry-title">
        <div className="nvContainer"><div className="nvIndustryHeading"><div><span className="nvEyebrow">PARA NEGOCIOS QUE VIVEN DE SUS CLIENTES</span><h2 id="industry-title">Tu mostrador, tu manera.</h2></div><p>Una experiencia sencilla para el tipo de negocio que ya tienes.</p></div>
          <div className="nvIndustryRail" aria-label="Ejemplos de giros donde usar Nival">
            {[['industry-cafe.webp','Cafeterías'],['industry-taqueria.webp','Taquerías'],['landing/6107.webp','Panaderías'],['industry-restaurant.webp','Restaurantes'],['industry-barber.webp','Barberías'],['industry-salon.webp','Salones']].map(([src,label],i)=><article className={`nvIndustryTile nvIndustryTile${i+1}`} key={label}><div><Photo src={`/assets/img/${src}`} alt={`${label}: ejemplo ilustrativo de negocio`} /></div><b>{label}</b></article>)}
          </div><small className="nvIndustryNote">Imágenes ilustrativas · desplaza para explorar</small>
        </div>
      </section>

      <section className="nvValueSection" id="producto" aria-labelledby="product-title">
        <div className="nvContainer">
          <div className="nvSectionHeading"><div><span className="nvEyebrow">TRES FORMAS DE CUIDAR LA RELACIÓN</span><h2 id="product-title">Que cada visita<br /><em>deje algo bueno.</em></h2></div><p>Elige el producto que le hace sentido a tu negocio. Puedes conocer cada uno desde el panel.</p></div>
          <div className="nvProductGrid">
            <article className="nvProductCard nvProductPoints"><div className="nvProductImage"><Photo src="/assets/img/landing/puntos.webp" alt="Cliente registra sus puntos con el teléfono en una cafetería" /></div><div className="nvProductBody"><span className="nvValueKicker">PUNTOS · PARA QUE REGRESEN</span><h3>Premia la próxima visita.</h3><p>Tu cliente registra su visita, sigue su avance y sabe qué premio puede obtener. Tú defines la meta y el premio.</p><a href="/demo">Ver tarjeta de puntos <LandingIcon name="arrow" /></a></div></article>
            <article className="nvProductCard nvProductReviews"><div className="nvProductImage"><Photo src="/assets/img/landing/resenas.webp" alt="Cliente acerca el teléfono a una tarjeta NFC para abrir la opción de reseña" /></div><div className="nvProductBody"><span className="nvValueKicker">RESEÑAS · PARA ESCUCHAR Y MEJORAR</span><h3>Haz fácil dejar su opinión.</h3><p>Las tarjetas NFC y QR llevan a tus clientes a compartir su experiencia. Revisa y responde reseñas desde tu inicio, según tu plan.</p><a href="/demo">Ver reseñas en el panel <LandingIcon name="arrow" /></a></div></article>
            <article className="nvProductCard nvProductGift"><div className="nvProductImage"><Photo src="/assets/img/landing/6111.webp" alt="Una persona entrega café y pan dulce en una cafetería" /><div className="nvGiftPreview"><small>NIVAL PAY · EJEMPLO</small><b>Un regalo<br/>para disfrutar</b><span>Tarjeta digital · NFC + QR</span></div></div><div className="nvProductBody"><span className="nvValueKicker">TARJETA DE REGALO · UN DETALLE PARA COMPARTIR</span><h3>Regala una visita.</h3><p>Nival Pay permite ofrecer una tarjeta de regalo digital para compartir con alguien. Se configura con Nival para que puedas compartirla con tus clientes.</p><a href={whatsapp('tarjeta de regalo Nival Pay')} target="_blank" rel="noreferrer">Preguntar por Nival Pay <LandingIcon name="arrow" /></a></div></article>
          </div>
          <div className="nvWhyRow"><div><span>¿Por qué puntos?</span><b>Porque una recompensa concreta da una razón para volver.</b></div><div><span>¿Por qué reseñas?</span><b>Porque escuchar a tus clientes ayuda a cuidar la experiencia.</b></div></div>
        </div>
      </section>

      <section className="nvPanelSection" id="panel" aria-labelledby="panel-title">
        <div className="nvContainer"><div className="nvDashboardIntro"><span className="nvEyebrow">EL CENTRO DE TU NEGOCIO EN NIVAL</span><h2 id="panel-title">Todo empieza en <em>Inicio.</em></h2><p>La actividad, tus clientes y Google en el mismo Dashboard. Así se organiza el panel que usarás.</p><a className="nvTextLink" href="/demo">Recorrer la demo <LandingIcon name="arrow" /></a></div>
          <div className="nvDashboardMock" aria-label="Vista ilustrativa del Dashboard de Nival">
            <div className="nvDashSidebar"><div className="nvDashBrand"><i>N</i><b>nival</b></div><small>CAFÉ DEMO</small><span className="is-selected">⌂　Inicio</span><span>▧　Tarjetas</span><span>♙　Clientes</span><span>▤　Operación</span><span>⚙　Cuenta</span></div>
            <div className="nvDashMain"><div className="nvDashTop"><div><small>CAFÉ DEMO · DATOS DE EJEMPLO</small><h3>Inicio</h3></div><button type="button" aria-label="Sucursal seleccionada">⌖　Centro</button></div>
              <div className="nvDashTitle"><div><small>ACTIVIDAD · ÚLTIMOS 30 DÍAS</small><h4>Resumen del periodo</h4></div><div className="nvDashPeriods"><span>7 días</span><b>30 días</b><span>90 días</span></div></div>
              <div className="nvDashRevenue"><small>INGRESOS DE CLIENTES RECURRENTES</small><strong>$428,600</strong><p>Tickets de clientes que ya habían visitado.</p><span>94 recurrentes　　+8% vs. periodo anterior</span></div>
              <div className="nvDashAnalytics"><article className="nvDashCard nvDashMix"><small>VISITAS DEL PERIODO</small><h4>Nuevos y recurrentes</h4><div className="nvDonut"><div><b>128</b><small>clientes</small></div></div><ul><li><i/>Recurrentes <b>94</b></li><li><i/>Nuevos <b>34</b></li></ul></article>
                <article className="nvDashCard nvDashActivity"><small>ACTIVIDAD</small><h4>Visitas registradas</h4><div className="nvChartLegend"><i/> Visitas <span>Últimos 30 días</span></div><svg viewBox="0 0 500 170" role="img" aria-label="Gráfica ilustrativa de visitas durante el periodo"><path className="nvChartGrid" d="M0 30H500M0 75H500M0 120H500M0 165H500"/><path className="nvChartArea" d="M5 135 C55 118 70 125 105 94 S165 115 200 79 S260 99 300 63 S355 95 390 48 S445 66 495 20 V165H5Z"/><path className="nvChartLine" d="M5 135 C55 118 70 125 105 94 S165 115 200 79 S260 99 300 63 S355 95 390 48 S445 66 495 20"/></svg><div className="nvChartLabels"><span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span></div></article></div>
              <article className="nvDashGoogle"><div className="nvGoogleIcon">G</div><div><small>GOOGLE Y RESEÑAS</small><h4>Tu reputación, a la vista.</h4><p><strong>4.8 ★</strong> calificación de ejemplo <i>·</i> 18 reseñas nuevas</p></div><div className="nvGoogleQuota"><b>12 / 30</b><small>respuestas usadas<br/>este periodo</small><div><i/></div></div></article>
            </div>
          </div><small className="nvDashboardFoot">Diseño basado en el Dashboard actual. Métricas ilustrativas; tus datos dependen de la actividad de tu negocio y de tu plan.</small>
        </div>
      </section>

      <section className="nvPlansSection" id="planes" aria-labelledby="plans-title">
        <div className="nvContainer"><div className="nvPlansIntro"><div><span className="nvEyebrow">ELIGE SEGÚN TU NEGOCIO</span><h2 id="plans-title">Precios sin sorpresas.</h2></div><p>Todos los planes duran 30 días e incluyen puntos, reseñas y resumen en PDF.</p></div>
          <div className="nvPlanGrid">{plans.map((plan) => <article className={`nvPlanCard${plan.featured ? " is-featured" : ""}`} key={plan.name}>{plan.featured && <span className="nvPlanFlag">RECOMENDADO</span>}<span className="nvPlanName">NIVAL {plan.name.toUpperCase()}</span><h3>{plan.price}<small> MXN <i>/ 30 días</i></small></h3><ul><li><LandingIcon name="check" />{plan.nfc} tarjetas NFC + QR para reseñas</li><li><LandingIcon name="check" />{plan.reviews} respuestas a reseñas</li><li><LandingIcon name="check" />{plan.branches} {plan.branches === "1" ? "sucursal" : "sucursales"}</li><li><LandingIcon name="check" />Tarjeta digital de puntos</li>{plan.name === "Plus" && <li><LandingIcon name="check" />Comparación con negocios cercanos</li>}</ul><a className="nvButton" href={whatsapp(plan.name)} target="_blank" rel="noreferrer">Elegir {plan.name}<LandingIcon name="arrow" /></a></article>)}</div>
          <div className="nvAddon"><span className="nvAddonIcon"><LandingIcon name="gift" /></span><p><b>Tarjeta de regalo Nival Pay</b><br />Una opción adicional a tu plan. <a href={whatsapp('Nival Pay')} target="_blank" rel="noreferrer">Conocer disponibilidad <LandingIcon name="arrow" /></a></p></div>
          <small className="nvPlanFoot">Precios en MXN. Las cantidades de reseñas se renuevan cada periodo. Imágenes y cifras de ejemplo son ilustrativas.</small>
        </div>
      </section>

      <section className="nvFaqSection" id="preguntas" aria-labelledby="faq-title"><div className="nvContainer nvFaqGrid"><div><span className="nvEyebrow">PREGUNTAS FRECUENTES</span><h2 id="faq-title">¿Te queda alguna duda?</h2><a className="nvTextLink" href={whatsapp()} target="_blank" rel="noreferrer">Escríbenos por WhatsApp <LandingIcon name="arrow" /></a></div><div className="nvFaqList"><details><summary>¿Mis clientes tienen que descargar una app?</summary><p>No. Abren su tarjeta digital desde el navegador del celular.</p></details><details><summary>¿Cómo se suman los puntos?</summary><p>Tu equipo confirma la visita desde el panel y registra el punto.</p></details><details><summary>¿Qué cambia entre los planes?</summary><p>La cantidad de respuestas a reseñas, sucursales y tarjetas NFC incluidas.</p></details><details><summary>¿Incluye tarjeta de regalo y Nival Pay?</summary><p>Están disponibles como complementos. Escríbenos para conocer las opciones.</p></details></div></div></section>

      <footer className="nvFooter"><div className="nvFooterTexture" aria-hidden="true"><Photo src="/assets/img/landing/6114.webp" alt="" /></div><div className="nvContainer"><div className="nvFooterCta"><div><span className="nvEyebrow">NIVAL · PUNTOS Y RESEÑAS</span><h2>Haz que quieran volver.</h2></div><a className="nvButton nvButtonPrimary" href={whatsapp()} target="_blank" rel="noreferrer">Platiquemos <LandingIcon name="arrow" /></a></div><div className="nvFooterBottom"><Brand /><nav aria-label="Enlaces del pie"><a href="#giros">Negocios</a><a href="#producto">Productos</a><a href="#panel">Tu panel</a><a href="#planes">Planes</a><a href="#preguntas">Preguntas</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></nav><a href="https://wa.me/525539044788" target="_blank" rel="noreferrer">WhatsApp</a></div><p className="nvLegalNote">Privacidad y términos pendientes de revisión legal · Imágenes ilustrativas.</p></div></footer>
    </main>
  );
}
