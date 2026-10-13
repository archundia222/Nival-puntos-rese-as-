import {redirect} from 'next/navigation';
import {createClient} from '../../../../lib/backend/server';
import {backendConfigured} from '../../../../lib/backend/config';
import {readAll} from '../../../../lib/supabase/read-all';
import {businessPlan} from '../../../../lib/business-plan';
import {recentPeriod,isInPeriod,periodLabel} from '../../../../lib/periods';

export const dynamic='force-dynamic';

export default async function ReviewsPage(){
 if(!backendConfigured())redirect('/acceso');
 const client=await createClient();const{data:claims,error:authError}=await client.auth.getClaims();
 if(authError||!claims?.claims.sub)redirect('/acceso');
 const{data:business,error:businessError}=await client.from('npr_businesses').select('id,name,plan').eq('owner_id',claims.claims.sub).maybeSingle();
 if(businessError)return <main className="dashboard"><h1>Reseñas</h1><p role="alert">No se pudo consultar tu negocio.</p></main>;
 if(!business)return <main className="dashboard"><h1>Reseñas</h1><p>Registra tu negocio desde Inicio para continuar.</p><a href="/panel">Ir a Inicio</a></main>;
 const plan=businessPlan(business.plan);if(plan==='puntos')redirect('/panel');
 const[reviews,diagnostics]=await Promise.all([
  readAll((start,end)=>client.from('npr_reviews').select('rating,review_date,answered_at').eq('business_id',business.id).order('review_date',{ascending:false}).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_diagnostics').select('checked_on,rating,review_count,findings,recommendations').eq('business_id',business.id).order('checked_on',{ascending:false}).order('id').range(start,end)),
 ]);
 if(reviews.error||diagnostics.error)return <main className="dashboard"><h1>Reseñas</h1><section className="panelState panelError"><p role="alert">No se pudieron cargar tus datos de reseñas. Inténtalo nuevamente.</p><a href="/panel/resenas">Volver a cargar</a></section></main>;
 const period=recentPeriod();
 const current=(reviews.data||[]).filter(review=>isInPeriod(review.review_date,period));
 const positive=current.filter(review=>review.rating>=4).length;
 const neutral=current.filter(review=>review.rating===3).length;
 const negative=current.filter(review=>review.rating<=2).length;
 const answered=current.filter(review=>!!review.answered_at).length;
 const pending=current.length-answered;
 const used=(reviews.data||[]).filter(review=>review.answered_at&&isInPeriod(review.answered_at,period)).length;
 const quota=plan==='plus'?100:30;
 const diagnosis=(diagnostics.data||[])[0];
 const total=positive+neutral+negative;
 return <main className="dashboard reviewsDashboard">
  <header className="dashHead"><div><small>NIVAL · RESEÑAS</small><h1>Reseñas de Google</h1><p>{business.name} · {periodLabel(period)}</p></div></header>
  <section className="reviewLead"><div><span>CALIFICACIÓN DE GOOGLE</span><strong>{diagnosis?`${Number(diagnosis.rating).toFixed(1)}<small> / 5</small>`:'—'}</strong><p>{diagnosis?`${diagnosis.review_count} reseñas en Google · dato del ${diagnosis.checked_on}`:'Nival aún no ha registrado el resumen de tu ficha.'}</p></div><div className="reviewQuota"><span>RESPUESTAS USADAS</span><strong>{used}<small> / {quota}</small></strong><p>en los últimos 30 días</p></div></section>
  <section className="stats reviewMetrics"><article><span>Reseñas contestadas</span><b>{answered}</b><small>recibidas en el periodo</small></article><article><span>Pendientes</span><b>{pending}</b><small>recibidas en el periodo</small></article><article><span>Reseñas capturadas</span><b>{current.length}</b><small>en el periodo</small></article></section>
  <section className="reviewChart"><header><div><span className="eyebrow">LO QUE COMENTAN</span><h2>Comentarios del periodo</h2></div><p>{total} reseñas</p></header>{!total?<p className="empty">Aún no hay reseñas registradas en este periodo.</p>:<><div className="reviewBars" role="img" aria-label={`${positive} comentarios buenos, ${neutral} neutrales y ${negative} malos`}><div className="reviewBarRow"><span>Buenas · 4 y 5 estrellas</span><div><i style={{width:`${positive/total*100}%`}}/></div><b>{positive}</b></div><div className="reviewBarRow"><span>Neutrales · 3 estrellas</span><div><i className="neutralBar" style={{width:`${neutral/total*100}%`}}/></div><b>{neutral}</b></div><div className="reviewBarRow"><span>Malas · 1 y 2 estrellas</span><div><i className="negativeBar" style={{width:`${negative/total*100}%`}}/></div><b>{negative}</b></div></div></>}</section>
  <section className="reviewDiagnosis"><span className="eyebrow">FICHA DE GOOGLE</span><h2>Áreas de mejora y consejos</h2>{diagnosis?<><p className="diagnosisDate">Último resumen registrado: {diagnosis.checked_on}</p><div className="diagnosisColumns"><article><h3>Áreas de mejora</h3><p className="preserveLines">{diagnosis.findings}</p></article><article><h3>Consejos</h3><p className="preserveLines">{diagnosis.recommendations}</p></article></div></>:<p className="empty">Nival aún no ha registrado áreas de mejora para tu ficha.</p>}</section>
  {plan==='plus'&&<section className="panelState comparisonSoon"><span className="comingSoon">Próximamente</span><h2>Comparación con negocios de tu zona</h2><p>El resumen de negocios parecidos estará disponible en una fase posterior.</p></section>}
  <p className="notice">Las reseñas y respuestas se capturan manualmente después de revisar Google. La calificación y el número total provienen del último resumen de tu ficha.</p>
 </main>;
}
