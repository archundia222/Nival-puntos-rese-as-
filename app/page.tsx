import { foundationEnabled, systemQuery } from '../lib/foundation/db';
import LandingMenu from './landing-menu';
import ScrollStory from './scroll-story';
import WhatsAppFab from './whatsapp-fab';
import './landing-v5.css';

const defaults = { whatsapp: '5539044788' };
export const revalidate = 0;

const Arrow = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>;
const Check = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
const Phone = () => <div className="nxPhone"><div className="nxPhoneTop"><span>9:41</span><i/></div><div className="nxPhoneBrand"><b>N</b><span><small>CAFÉ</small>Café Nival</span></div><div className="nxPhoneCard"><small>TUS PUNTOS</small><strong>6</strong><p>Te faltan 2 visitas para tu café gratis.</p></div><div className="nxDots">{[1,2,3,4,5,6,7,8].map(n=><i key={n} className={n>6?'off':''}>{n<=6?'✓':''}</i>)}</div><div className="nxReward"><span><small>PREMIO</small><b>Café de la casa</b></span><em>8 pts</em></div><div className="nxBrowser">nival.mx/cafe-nival</div></div>;
const NfcCard = () => <div className="nxNfcCard"><div><small>NIVAL</small><strong>Card</strong></div><span className="nxNfcWaves"><i/><i/><i/></span><p>ACERCA TU CELULAR</p></div>;

export default async function Home() {
  let testimonials:Record<string,any>[]=[];
  let values: { [key: string]: string } = { ...defaults };
  if (foundationEnabled()) {
    try {
      const rows = await systemQuery("select key,value_published from nival_pr.site_content where value_published is not null");
      testimonials=rows.filter(r=>r.key.startsWith('testimonial_')&&r.value_published?.permission===true).map(r=>({...r.value_published,id:r.key}));
      for (const row of rows) if (row.key in values) values[row.key] = String(row.value_published?.text ?? values[row.key]);
    } catch {}
  }
  const phone = values.whatsapp.replace(/\D/g, '') || defaults.whatsapp;
  const whatsappPhone = phone.startsWith('52') ? phone : `52${phone}`;
  const whatsapp = (page: string, plan?: string) => {
    const choice = plan ? ` Me interesa el plan ${plan}.` : '';
    const message = `Hola, vi Nival Puntos + Reseñas en la página ${page}.${choice} Quiero conocer cómo funciona para mi negocio. Nombre del negocio: ____. Giro: ____. Ubicación: ____.`;
    return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
  };
  const wa = whatsapp('principal');
  const plans: { name: string; price: number; tag: string; recommended?: boolean; features: string[] }[] = [
    { name: 'Nival Puntos', price: 299, tag: 'SOLO LEALTAD', features: ['Sistema de puntos por visitas con compra', 'Premios y registro de canjes', 'Panel con clientes e historial', 'QR digital incluido'] },
    { name: 'Esencial', price: 399, tag: 'PUNTOS + RESEÑAS', recommended: true, features: ['Todo lo incluido en Nival Puntos', 'Análisis y seguimiento de reseñas', 'Reportes y seguimiento, sin respuestas incluidas'] },
    { name: 'Plus', price: 499, tag: 'MÁS RESPUESTAS', features: ['Todo lo incluido en Nival Puntos', 'Análisis y seguimiento de reseñas', 'Hasta 100 respuestas manuales por periodo de 30 días'] },
  ];

  return <main className="nx" id="main-content">
    <a className="nxSkipLink" href="#contenido">Saltar al contenido</a>
    <header className="nxHeader">
      <a href="/" className="nxLogo" aria-label="Nival, inicio"><b>N</b><span>NIVAL</span></a>
      <nav aria-label="Navegación principal">
        <a href="#como">Cómo funciona</a><a href="#precio">Precios</a><a href="/demo">Ver demo</a><a href="#contacto">Contacto</a>
        <a className="nxLogin" href="/staff/acceso">Personal</a><a className="nxLogin" href="/acceso-administrador">Administrador</a><a className="nxNavCta" href="/acceso?modo=registro">Acceso a negocios</a>
      </nav>
      <LandingMenu/>
    </header>

    <section className="nxHero" aria-labelledby="hero-title">
      <div className="nxGlow nxGlowA"/><div className="nxGlow nxGlowB"/>
      <div className="nxHeroCopy">
        <span className="nxEyebrow">NIVAL PARA NEGOCIOS LOCALES</span>
        <h1 id="hero-title">Que te encuentren.<br/><em>Que vuelvan.</em></h1>
        <p>Puntos digitales y acompañamiento de reseñas para negocios locales.</p>
        <div className="nxActions"><a className="primary" href="/acceso?modo=registro">Crear cuenta <Arrow/></a><a href="/demo">Ver demo</a></div>
        <div className="nxQuick"><span><Check/> Sin app</span><span><Check/> QR incluido</span><span><Check/> Panel incluido</span></div>
      </div>
      <div className="nxHeroVisual" aria-label="Vista ilustrativa de una tarjeta de puntos digital">
        <div className="nxVisualHalo"/><div className="nxHeroCard"><NfcCard/></div><div className="nxHeroPhone"><Phone/></div>
        <div className="nxFloat nxFloatPoint"><i>+1</i><span><small>VISITA REGISTRADA</small><b>Ahora tienes 6 puntos</b></span></div>
        <div className="nxFloat nxFloatReview"><span className="stars">★★★★★</span><b>Reseña recibida</b><small>Ejemplo ilustrativo</small></div>
        <div className="nxFloat nxFloatReward"><small>SIGUIENTE PREMIO</small><b>2 visitas</b><span>para tu café gratis</span></div>
      </div>
    </section>

    <div id="contenido"><ScrollStory/></div>

    <section className="nxStoryCta" aria-label="Siguiente paso">
      <p>Conoce el recorrido completo y decide si Nival encaja con tu negocio.</p>
      <div><a href="/demo">Ver demo</a><a href="/acceso?modo=registro">Crear cuenta de negocio</a><a href={whatsapp('cierre de la historia')} target="_blank" rel="noreferrer">Hablar por WhatsApp</a></div>
    </section>

    <section id="precio" className="nxPricing nxSection" aria-labelledby="pricing-title">
      <div className="nxSectionHead compact"><span>PLANES NIVAL</span><h2 id="pricing-title">Encuentra el plan para tu negocio.</h2><p>Planes mensuales; cada activación cubre 30 días. Todos incluyen QR digital. La tarjeta NFC física se cotiza por separado.</p></div>
      <div className="nxPriceGrid">{plans.map(plan=><article className={`nxPlanCard ${plan.recommended?'is-recommended':''}`} key={plan.name}>
        <span>{plan.tag}</span>{plan.recommended&&<b className="nxRecommendedBadge">RECOMENDADO</b>}
        <h3>${plan.price} <small>MXN / mes</small></h3><h4>{plan.name}</h4>
        <ul>{plan.features.map(item=><li key={item}><Check/><b>{item}</b></li>)}</ul>
        <a href={whatsapp('planes', plan.name)} target="_blank" rel="noreferrer">Preguntar por este plan <Arrow/></a>
      </article>)}</div>
      <p className="nxPlanFineprint">Los puntos se obtienen por una visita válida con compra, registrada por el personal del negocio. Las respuestas no utilizadas no se acumulan. Las condiciones específicas de contratación se confirman con Nival.</p>
    </section>

    <section className="nxIntegrity nxSection" aria-labelledby="integrity-title">
      <div><span>UNA EXPERIENCIA QUE CONECTA</span><h2 id="integrity-title">Haz que cada visita cuente.</h2><p>Reconoce a tus clientes frecuentes con puntos por sus compras y mantén una comunicación cercana con quienes conocen tu negocio. Dos formas de construir relaciones duraderas, desde un solo lugar.</p></div>
      <div className="nxIntegrityFlow"><article><span>01</span><b>Premia su preferencia</b><small>Tu cliente acumula puntos por visitas válidas con compra y descubre sus próximos premios.</small></article><i aria-hidden="true">+</i><article><span>02</span><b>Escucha su experiencia</b><small>Invita a compartir opiniones auténticas y voluntarias, sin condicionar puntos ni premios.</small></article></div>
    </section>

    <section className="nxService nxSection" aria-labelledby="service-title">
      <div className="nxSectionHead compact"><span>EL SERVICIO HOY</span><h2 id="service-title">Herramientas digitales y atención cercana.</h2><p>Nival reúne tus herramientas de lealtad y te acompaña con el seguimiento de reseñas.</p></div>
      <div className="nxServiceGrid">
        <article><b>La plataforma organiza</b><p>Clientes, puntos, visitas, premios, canjes, roles e historial dentro del panel del negocio.</p></article>
        <article><b>Nival te acompaña</b><p>Nival te ayuda a revisar las reseñas, identificar oportunidades y preparar respuestas con atención personalizada.</p></article>
        
      </div>
      <div className="nxActivation"><h3>Pago y activación</h3><p>Registra tu negocio y contacta a Nival para activar tu plan. Una vez confirmado el pago, Nival te proporciona un código único de activación. Al ingresarlo, comienza un periodo de 30 días. Al vencer, el historial se conserva y las herramientas activas se pausan hasta renovar.</p></div>
    </section>

    {testimonials.length>0&&<section className="nxSection"><div className="nxSectionHead"><h2>Negocios que usan Nival</h2></div><div className="nxPriceGrid">{testimonials.map(t=><article className="nxPlanCard" key={t.id}><img src={t.photo} alt={'Local de '+t.businessName} width="320" height="220" style={{objectFit:'cover',maxWidth:'100%',borderRadius:12}}/><h3>{t.businessName}</h3><blockquote>{t.quote}</blockquote><p>{t.author}</p></article>)}</div></section>}
    <section id="contacto" className="nxContact nxFinal" aria-labelledby="contact-title">
      <div><span>¿LO VEMOS PARA TU NEGOCIO?</span><h2 id="contact-title">Hablemos de lo que necesitas.</h2></div>
      <div><p>Cuéntanos el giro y la ubicación de tu negocio. Te orientamos sobre el plan y el proceso de activación.</p><a href={whatsapp('contacto')} target="_blank" rel="noreferrer">Hablar con Nival por WhatsApp <Arrow/></a><small>Atención de Nival Tech · México</small></div>
    </section>

    <footer className="nxFooter"><a href="/" className="nxLogo"><b>N</b><span>NIVAL</span></a><p>Para negocios locales en México.</p><nav aria-label="Enlaces del pie"><a href="/terminos">Términos</a><a href="/privacidad">Aviso de privacidad</a><a className="nxAdminLink" href="/acceso-administrador">Acceso de administradores</a></nav><small>© 2026 Nival Tech · México</small></footer>
    <WhatsAppFab href={whatsapp('botón flotante')}/>
  </main>;
}
