import {foundationEnabled,systemQuery} from '../lib/foundation/db';

const defaults={price:'$399 MXN/mes',whatsapp:'5539044788'};
export const revalidate=0;
export default async function Home(){
 let values:{[key:string]:string}={...defaults};
 if(foundationEnabled()){try{const rows=await systemQuery("select key,value_published from nival_pr.site_content where value_published is not null");for(const row of rows)if(row.key in values)values[row.key]=String(row.value_published?.text??values[row.key]);}catch{}}
 const phone=values.whatsapp.replace(/\D/g,'')||defaults.whatsapp;
 const wa=`https://wa.me/52${phone}?text=${encodeURIComponent('Hola, quiero cotizar Nival Puntos + Reseñas para mi negocio.')}`;
 return <main className="publicSite">
  <nav className="publicNav"><a className="brand" href="/"><b>NIVAL</b><span>Puntos + Reseñas</span></a><a className="navAccess" href="/acceso">Acceso a mi negocio</a></nav>

  <section className="publicHero">
   <div className="heroCopy"><div className="eyebrow">Lealtad + reputación para negocios locales</div><h1>Haz que tus clientes regresen.</h1><p>Premia visitas, fortalece reseñas y entiende mejor a tus clientes.</p><div className="heroActions"><a className="publicCta" href={wa} target="_blank" rel="noreferrer">Cotizar por WhatsApp</a><a href="#como-funciona">Ver cómo funciona ↓</a></div></div>
   <div className="phoneStage" aria-label="Ejemplo ilustrativo de tarjeta digital Nival"><div className="phoneMock"><div className="phoneTop"><span>CAFÉ DEMO</span><i>●</i></div><small>TU TARJETA DIGITAL</small><strong>6</strong><span>puntos</span><div className="mockProgress"><i/></div><b>Te faltan 2 para tu premio</b><div className="mockReward">Próximo premio · Ejemplo</div></div><div className="floatCard">✓ Visita registrada<br/><small>Tu cliente sigue acumulando</small></div></div>
  </section>

  <section id="como-funciona" className="publicSection"><div className="sectionIntro"><span>01 · PUNTOS</span><h2>Volver se siente bien.</h2><p>Una experiencia sencilla para clientes y personal.</p></div><div className="flow"><article><b>01</b><h3>QR o NFC</h3><p>El cliente abre su tarjeta.</p></article><i>→</i><article><b>02</b><h3>Registra visita</h3><p>Tu personal confirma la visita.</p></article><i>→</i><article><b>03</b><h3>Suma puntos</h3><p>El progreso queda guardado.</p></article><i>→</i><article><b>04</b><h3>Recibe premio</h3><p>Canjea al llegar a la meta.</p></article></div></section>

  <section className="publicSection reviewStory"><div><span>02 · RESEÑAS</span><h2>Una buena experiencia termina en Google.</h2><p>Nival te ayuda a dar seguimiento a reseñas y mantener tu reputación al día.</p><p className="finePrint">Las reseñas son independientes de los puntos y premios.</p></div><div className="reviewMock" aria-label="Ejemplo ilustrativo de seguimiento de reseñas"><small>EJEMPLO ILUSTRATIVO</small><div className="stars">★★★★★</div><h3>“Excelente atención.”</h3><p>Respuesta pendiente</p><button type="button" disabled>Preparar respuesta</button></div></section>

  <section className="publicSection panelStory"><div className="panelPreview"><header><b>Resumen del negocio</b><span>Este mes</span></header><div className="previewStats"><article><small>Clientes</small><strong>—</strong></article><article><small>Visitas</small><strong>—</strong></article><article><small>Reseñas</small><strong>—</strong></article></div><div className="previewChart"><i/><i/><i/><i/><i/><i/></div><small>Vista ilustrativa · tus datos aparecen al operar</small></div><div><span>03 · TU PANEL</span><h2>Todo claro, en un lugar.</h2><p>Consulta clientes, visitas, premios y seguimiento de reputación desde la web.</p></div></section>

  <section className="publicSection priceStory"><div><span>04 · PRECIO</span><h2>Empieza sin complicarte.</h2><p>Un servicio mensual para operar lealtad y reputación.</p></div><div className="priceCard"><small>NIVAL COMPLETO</small><strong>{values.price}</strong><p>Puntos + reseñas + panel del negocio.</p><a className="publicCta light" href={wa} target="_blank" rel="noreferrer">Cotizar por WhatsApp</a></div></section>

  <section className="publicSection faqStory"><div><span>05 · PREGUNTAS</span><h2>Lo esencial, sin vueltas.</h2></div><div className="faqList"><details open><summary>¿Para qué negocios sirve?</summary><p>Para negocios con clientes recurrentes: cafeterías, restaurantes, barberías, estéticas y más.</p></details><details><summary>¿El cliente descarga una app?</summary><p>No. Abre su tarjeta desde QR o NFC directamente en la web.</p></details><details><summary>¿Debo regalar puntos por reseñar?</summary><p>No. Las reseñas funcionan separadas de puntos y recompensas.</p></details><details><summary>¿Cómo empiezo?</summary><p>Escríbenos por WhatsApp y configuramos el servicio contigo.</p></details></div></section>

  <footer className="publicFooter"><div><b>NIVAL</b><p>Clientes que regresan. Experiencias que recomiendan.</p></div><div><a href="/acceso">Acceso a mi negocio</a><a href="/staff/acceso">Acceso del personal</a><a href="/terminos">Términos</a><a href="/privacidad">Aviso de privacidad</a></div><a className="publicCta" href={wa} target="_blank" rel="noreferrer">Cotizar por WhatsApp</a></footer>
 </main>
}