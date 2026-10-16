import DemoNotice from './components/demo-notice';

const whatsapp='https://wa.me/525539044788?text=Hola%2C%20quiero%20conocer%20Nival%20Puntos%20%2B%20Rese%C3%B1as';

const metrics=[['Clientes','0'],['Visitas','0'],['Premios','0'],['Reseñas','0']];

export default function Home(){
 return <main className="marketingSite">
  <DemoNotice/>
  <nav className="siteNav"><a className="siteLogo" href="/" aria-label="Nival, inicio">NIVAL<span> PUNTOS + RESEÑAS</span></a><div><a href="#como-funciona">Cómo funciona</a><a className="navLogin" href="/acceso">Entrar</a></div></nav>

  <section className="hero marketingHero">
   <div className="heroCopy"><div className="pill"><span className="statusDot"/> Lealtad y reputación, en un solo lugar</div>
    <h1>Haz que cada visita <em>cuente.</em></h1>
    <p>Premia a tus clientes frecuentes y facilita que compartan su experiencia en Google.</p>
    <div className="heroActions"><a className="primary" href={whatsapp}>Conocer Nival <span aria-hidden="true">↗</span></a><a className="secondary" href="/acceso">Entrar a mi negocio</a></div>
    <small className="honestNote">Puntos y actividad en tu panel. Las reseñas de Google se gestionan manualmente.</small>
   </div>
   <div className="dashboardPreview" aria-label="Vista de ejemplo del panel de Nival">
    <div className="previewTop"><div><span className="previewLabel">PANEL DEL NEGOCIO</span><strong>Tu mes, de un vistazo</strong></div><span className="previewMark">N</span></div>
    <div className="previewMetrics">{metrics.map(([label,value])=><article key={label}><span>{label}</span><b>{value}</b></article>)}</div>
    <div className="previewBottom"><div><span className="progressMark">↗</span><p><strong>El progreso es claro.</strong><br/>Visitas, premios y reseñas en una sola vista.</p></div><span className="previewPeriod">EJEMPLO</span></div>
   </div>
  </section>

  <section className="valueSection"><div className="sectionIntro"><span className="eyebrow">UNA OPERACIÓN MÁS SIMPLE</span><h2>Lo importante, <em>sin ruido.</em></h2></div><div className="valueGrid">
   <article><span className="valueNumber">01</span><h3>Reconoce a quien vuelve</h3><p>Registra clientes, suma visitas y lleva el avance hacia su premio.</p></article>
   <article><span className="valueNumber">02</span><h3>Haz fácil dejar una reseña</h3><p>Comparte un enlace directo a la ficha de Google de tu negocio.</p></article>
   <article><span className="valueNumber">03</span><h3>Entiende el movimiento</h3><p>Consulta clientes, visitas, canjes y reseñas por mes.</p></article>
  </div></section>

  <section id="como-funciona" className="howSection"><div className="howIntro"><span className="eyebrow">ASÍ EMPIEZAS</span><h2>Listo para usar en el mostrador.</h2></div><ol className="howSteps"><li><b>1</b><div><strong>Configura tu negocio</strong><p>Define tu premio y comparte tu enlace de reseñas.</p></div></li><li><b>2</b><div><strong>Registra visitas</strong><p>Busca al cliente y suma su visita con un toque.</p></div></li><li><b>3</b><div><strong>Revisa resultados</strong><p>Consulta la actividad de tu negocio en el panel mensual.</p></div></li></ol></section>

  <section className="closingCta"><div><span className="eyebrow">NIVAL PUNTOS + RESEÑAS</span><h2>Más clientes que regresan. Una operación que se entiende.</h2></div><a className="primary" href={whatsapp}>Hablar con Nival <span aria-hidden="true">↗</span></a></section>
  <footer className="siteFooter"><a className="siteLogo" href="/">NIVAL<span> PUNTOS + RESEÑAS</span></a><span>Nival Tech · Lealtad para negocios</span><a href="/acceso">Acceso al panel</a></footer>
 </main>;
}
