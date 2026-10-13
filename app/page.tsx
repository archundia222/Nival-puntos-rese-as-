import LandingIcon from './landing-icon';
import './landing-reference.css';

const plans = [
  {name:'Nival Puntos',price: 299,features:[
    'Tarjeta NFC para el mostrador y tarjeta digital para tus clientes',
    'Clientes ilimitados',
    'Hasta 10 promociones simultáneas y hasta 10 sucursales',
    'Soporte prioritario',
    'Estadísticas avanzadas de puntos: impacto, lealtad e ingresos del programa, con ticket promedio, nombre y teléfono del cliente',
  ]},
  {name:'Nival Esencial',price: 399,popular:true,features:[
    'Todo lo que incluye Nival Puntos',
    'Hasta 30 respuestas a reseñas de Google por periodo activo de 30 días',
    'Estadísticas de reseñas: impacto, resumen de reseñas y estado de la ficha de Google',
  ]},
  {name:'Nival Plus',price: 549,features:[
    'Todo lo que incluye Nival Esencial',
    'Hasta 100 respuestas a reseñas de Google por periodo activo de 30 días',
    'Comparación con negocios similares de tu zona: calificación y número de reseñas',
  ]},
];
const Check=()=> <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="m4 10 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;

export default function Home(){
 return <main className="refLanding nivalOffer">
  <header className="refNav"><a className="refBrand" href="/" aria-label="Nival inicio"><b>N</b><span>NIVAL</span></a><nav aria-label="Navegación principal"><a href="#precios">Planes</a><a href="#incluidos">Complementos incluidos</a><a href="#informe">Resumen del periodo</a></nav><a className="refRegister" href="/acceso?modo=registro">Crear cuenta <LandingIcon name="arrow"/></a></header>
  <section className="refPricing" id="precios"><div className="refPricingHead"><div><span className="refEyebrow">PLANES NIVAL · PERIODOS ACTIVOS DE 30 DÍAS</span><h1>Elige el plan<br/>para tu negocio.</h1><p>Precios mensuales. Cada periodo dura 30 días; las respuestas no usadas no se acumulan al siguiente periodo.</p></div></div><div className="refPlans">{plans.map(plan=><article className={plan.popular?'refPlan popular':'refPlan'} key={plan.name}>{plan.popular&&<div className="refPopular">Más popular</div>}<h3>{plan.name}</h3><p className="refPrice">${plan.price}<small> MXN / mes</small></p><ul>{plan.features.map(f=><li key={f}><Check/>{f}</li>)}</ul><a href="/acceso?modo=registro" className={plan.popular?'refPrimary':'refOutline'}>Crear cuenta <LandingIcon name="arrow"/></a></article>)}</div></section>
  <section className="refBenefits" id="incluidos"><span className="refEyebrow">INCLUIDOS GRATIS CON CUALQUIER PLAN</span><h2>Nival Pay y Nival Reseñas</h2><div className="refBenefitGrid"><article><strong>Nival Pay</strong><p>Página de pago del negocio y tarjeta NFC.</p></article><article><strong>Nival Reseñas</strong><p>Hasta 10 tarjetas NFC con QR que llevan a tus clientes a la ficha de Google.</p></article></div></section>
  <section className="refSummary" id="informe"><div><span className="refEyebrow">CIERRE DEL PERIODO</span><h2>Un resumen PDF del impacto.</h2><p>Al día 30 se genera un PDF con los datos clave del programa contratado.</p></div><div className="refSummaryPlans"><article><b>Nival Puntos</b><span>Impacto del programa de puntos.</span></article><article><b>Nival Esencial</b><span>Impacto de puntos y reseñas.</span></article><article><b>Nival Plus</b><span>Impacto de puntos, reseñas y comparación con la zona.</span></article></div></section>
  <footer className="refFooter"><a className="refBrand" href="/" aria-label="Nival inicio"><b>N</b><span>NIVAL</span></a><p>Para negocios locales en México.</p><nav aria-label="Enlaces del pie"><a href="/terminos">Términos</a><a href="/privacidad">Aviso de privacidad</a><a href="/acceso">Acceso a negocios</a><a href="/staff/acceso">Acceso de personal</a><a href="/acceso-administrador">Acceso de administradores</a></nav><small>© 2026 Nival Tech · México</small></footer>
 </main>
}
