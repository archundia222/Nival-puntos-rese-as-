import {foundationEnabled,systemQuery} from '../lib/foundation/db';

const defaults={
 hero_title:'Haz que tus clientes regresen y además te recomienden.',
 hero_description:'Nival Puntos + Reseñas ayuda a negocios locales a premiar visitas frecuentes y conseguir más reseñas de Google con un proceso simple.',
 price:'$399 MXN/mes',
 whatsapp:'5539044788',
 testimonials:'',
 faq:'',
};
export const revalidate=0;
export default async function Home(){
 let values:{[key:string]:string}={...defaults};
 if(foundationEnabled()){
  try{
   const rows=await systemQuery("select key,value_published from nival_pr.site_content where value_published is not null");
   for(const row of rows)if(row.key in values)values[row.key]=String(row.value_published?.text??values[row.key]);
  }catch{}
 }
 const phone=values.whatsapp.replace(/\D/g,'')||defaults.whatsapp;
 const wa=`https://wa.me/52${phone}?text=${encodeURIComponent('Hola, quiero cotizar o activar Nival Puntos + Reseñas para mi negocio.')}`;
 return <main><nav><b>NIVAL</b><span>Puntos + Reseñas</span><a className="primary" href="/acceso">Acceso a mi negocio</a></nav>
 <section className="hero"><div className="pill">Programa de lealtad + reputación</div><h1>{values.hero_title}</h1><p>{values.hero_description}</p><div className="actions"><a className="primary" href={wa}>Cotizar o activar por WhatsApp</a><strong className="landingPrice">{values.price}</strong></div></section>
 <section><h2>Dos objetivos. Un solo sistema.</h2><div className="grid"><article><strong>01 · PUNTOS</strong><h3>Premia a quien vuelve</h3><p>Registra visitas o compras y suma puntos. Define premios claros para incentivar la siguiente visita.</p></article><article><strong>02 · RESEÑAS</strong><h3>Convierte una buena experiencia en una reseña</h3><p>Facilita el acceso a la ficha de Google y da seguimiento a respuestas y resultados mensuales.</p></article></div></section>
 <section className="steps"><h2>Cómo funciona</h2><div className="grid three"><article><b>1</b><h3>Registra tu negocio</h3><p>Crea tu cuenta y deja los datos esenciales de tu negocio.</p></article><article><b>2</b><h3>Activa el servicio</h3><p>Te cotizamos por WhatsApp. Tras registrar el pago o usar un código válido, el panel queda activo.</p></article><article><b>3</b><h3>Opera desde la web</h3><p>Gestiona puntos y consulta el seguimiento de reputación desde un solo lugar.</p></article></div></section>
 {values.testimonials&&<section><h2>Testimonios</h2><div className="reviewBox preserveLines">{values.testimonials}</div></section>}
 {values.faq&&<section><h2>Preguntas frecuentes</h2><div className="reviewBox preserveLines">{values.faq}</div></section>}
 <section className="cta"><h2>Empieza simple. Automatiza cuando tenga sentido.</h2><p>La operación de cobro sigue siendo manual; la arquitectura ya permite conectar pagos automáticos después sin rehacer el acceso.</p><a className="primary" href={wa}>Cotizar o activar por WhatsApp</a></section><footer>Nival Tech · Puntos + Reseñas</footer></main>
}