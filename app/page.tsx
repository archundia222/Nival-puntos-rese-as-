import './landing-reference.css';

const plans = [
  {
    name: 'Puntos', price: 299, featured: false,
    features: [
      'Tarjeta NFC', 'Clientes ilimitados', 'Hasta 10 promociones simultáneas',
      'Hasta 10 sucursales', 'Soporte prioritario',
      'Estadísticas avanzadas de puntos: visitas, lealtad y crecimiento de ingresos',
    ], report: 'PDF al día 30 con el impacto del programa de puntos.',
  },
  {
    name: 'Esencial', price: 399, featured: true,
    features: [
      'Todo lo incluido en Puntos', 'Hasta 30 respuestas a reseñas por periodo de 30 días',
      'Estadísticas de reseñas: impacto, resumen y estado de tu ficha de Google',
    ], report: 'PDF al día 30 con el impacto de puntos y reseñas.',
  },
  {
    name: 'Plus', price: 549, featured: false,
    features: [
      'Todo lo incluido en Esencial', 'Hasta 100 respuestas a reseñas por periodo de 30 días',
      'Comparación con negocios similares de tu zona',
    ], report: 'PDF al día 30 con puntos, reseñas y comparación con tu zona.',
  },
];

function Check() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

export default function Home() {
  return <main className="nivalOffer">
    <header className="offerNav">
      <a className="offerBrand" href="/" aria-label="Nival inicio"><b>N</b><span>NIVAL<small>PUNTOS + RESEÑAS</small></span></a>
      <nav aria-label="Navegación principal"><a href="#planes">Planes</a><a href="#incluido">Complementos</a><a href="#informes">Informes</a></nav>
      <a className="offerLogin" href="/acceso">Iniciar sesión</a>
      <a className="offerButton" href="/acceso?modo=registro">Crear cuenta</a>
    </header>

    <section className="offerIntro" id="planes">
      <span className="offerEyebrow">NIVAL · PARA NEGOCIOS LOCALES</span>
      <h1>Un programa para que tus clientes vuelvan.</h1>
      <p>Elige el plan que corresponde a lo que quieres medir y mejorar. Cada periodo dura 30 días.</p>
    </section>

    <section className="offerPlans" aria-label="Planes y precios">
      {plans.map(plan => <article className={`offerPlan${plan.featured ? ' isFeatured' : ''}`} key={plan.name}>
        {plan.featured && <span className="offerPopular">Puntos y reseñas</span>}
        <h2>{plan.name}</h2>
        <p className="offerPrice"><strong>${plan.price}</strong><span>MXN <small>/ cada 30 días</small></span></p>
        <ul>{plan.features.map(feature => <li key={feature}><Check/>{feature}</li>)}</ul>
        <p className="offerPdf"><b>Informe de cierre</b>{plan.report}</p>
        <a className="offerChoose" href={`/acceso?modo=registro&plan=${plan.price}`}>Elegir {plan.name}</a>
      </article>)}
    </section>

    <section className="offerIncluded" id="incluido">
      <div><span className="offerEyebrow">INCLUIDOS EN CUALQUIER PLAN</span><h2>Complementos para facilitar cada visita.</h2></div>
      <div className="offerIncludedGrid">
        <article><span className="offerIncludedMark">N</span><div><h3>Nival Pay</h3><p>Página para recibir pagos y tarjeta NFC.</p></div><b>Incluido</b></article>
        <article><span className="offerIncludedMark">N</span><div><h3>Nival Reseñas</h3><p>Hasta 10 tarjetas NFC con QR para reseñas.</p></div><b>Incluido</b></article>
      </div>
    </section>

    <section className="offerReports" id="informes">
      <div><span className="offerEyebrow">AL FINAL DE CADA PERIODO</span><h2>Un resumen PDF con el impacto de tu plan.</h2><p>Al día 30, el informe aparece en tu panel de negocio y en el panel de administración de Nival.</p></div>
      <a href="/acceso?modo=registro">Empezar con Nival</a>
    </section>

    <footer className="offerFooter"><a className="offerBrand" href="/"><b>N</b><span>NIVAL<small>NIVAL TECH</small></span></a><nav aria-label="Enlaces legales"><a href="/terminos">Términos</a><a href="/privacidad">Aviso de privacidad</a><a href="/staff/acceso">Acceso de personal</a><a href="/acceso-administrador">Acceso de administradores</a></nav><small>© 2026 Nival Tech · México</small></footer>
  </main>;
}
