import {foundationEnabled,systemQuery} from '../lib/foundation/db';

const defaults={price:'$399 MXN/mes',whatsapp:'5539044788'};
export const revalidate=0;
export default async function Home(){
 let values:{[key:string]:string}={...defaults};
 if(foundationEnabled()){try{const rows=await systemQuery("select key,value_published from nival_pr.site_content where value_published is not null");for(const row of rows)if(row.key in values)values[row.key]=String(row.value_published?.text??values[row.key]);}catch{}}
 const phone=values.whatsapp.replace(/\D/g,'')||defaults.whatsapp;
 const wa=`https://wa.me/52${phone}?text=${encodeURIComponent('Hola, quiero conocer Nival Puntos + Reseñas para mi negocio.')}`;
 return <main className="publicSite uxLanding">
  <nav className="publicNav"><a className="brand" href="/"><b>NIVAL</b><span>Puntos + Reseñas</span></a><div className="navChoices"><a href="/demo">Ver demo</a><a className="navAccess" href="/acceso">Entrar</a></div></nav>

  <section className="publicHero uxHero">
   <div className="heroCopy"><div className="eyebrow">Lealtad que sí se usa</div><h1>Haz que vuelvan.</h1><p>Convierte cada visita en una razón para regresar. Sin app. Sin complicaciones.</p><div className="heroActions"><a className="publicCta" href="/registro">Registrar mi negocio</a><a className="demoCta" href="/demo"><span className="playDot">▶</span> Ver demo</a></div><small className="heroHint">Puntos + seguimiento de reseñas · {values.price}</small></div>
   <div className="phoneStage" aria-label="Vista de ejemplo de la tarjeta digital"><div className="ambientOrb"/><div className="phoneMock"><div className="phoneTop"><span>CAFÉ DEMO</span><i>●</i></div><small>TU TARJETA</small><strong>6</strong><span>puntos</span><div className="mockProgress"><i/></div><b>2 puntos para tu premio</b><div className="mockReward">☕ Tu próxima recompensa</div></div><div className="floatCard"><span className="pulseCheck">✓</span> Visita registrada</div></div>
  </section>

  <section id="como-funciona" className="publicSection uxHow"><div className="sectionIntro"><span>ASÍ DE SIMPLE</span><h2>Un toque. Un punto. Una razón para volver.</h2></div><div className="uxSteps"><article><b>01</b><h3>Abre</h3><p>QR o NFC.</p></article><article><b>02</b><h3>Acumula</h3><p>Tu equipo registra la visita.</p></article><article><b>03</b><h3>Regresa</h3><p>El cliente ve su próximo premio.</p></article></div></section>

  <section className="publicSection uxValue"><div><span>TODO EN UNO</span><h2>Clientes que regresan.<br/>Reputación que crece.</h2></div><div className="valueCards"><article><div className="valueIcon">↻</div><h3>Puntos</h3><p>Una tarjeta digital que vive en el celular de tu cliente.</p></article><article><div className="valueIcon">★</div><h3>Reseñas</h3><p>Seguimiento claro para cuidar lo que dicen de tu negocio.</p></article></div></section>

  <section className="demoBand"><div><small>PRUÉBALO ANTES DE DECIDIR</small><h2>No te lo imagines.<br/>Úsalo.</h2><p>Entra a una demostración y recorre Nival como negocio.</p><a className="publicCta light" href="/demo"><span>▶</span> Abrir demo</a></div><div className="miniDashboard"><header><span>Hoy</span><b>Tu negocio</b></header><div><article><strong>24</strong><small>visitas</small></article><article><strong>8</strong><small>por volver</small></article></div><p><i/> Actividad en tiempo real</p></div></section>

  <section className="finalChoice"><small>¿LISTO PARA EMPEZAR?</small><h2>Tu próximo cliente puede convertirse en cliente frecuente.</h2><div className="heroActions centered"><a className="publicCta" href="/registro">Registrar mi negocio</a><a className="textLink" href={wa} target="_blank" rel="noreferrer">Tengo una pregunta →</a></div></section>

  <footer className="publicFooter compactFooter"><div><b>NIVAL</b><p>Haz que vuelvan.</p></div><div><a href="/acceso">Entrar</a><a href="/staff/acceso">Personal</a><a href="/terminos">Términos</a><a href="/privacidad">Privacidad</a></div></footer>
 </main>
}