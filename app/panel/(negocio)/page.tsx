import {readAll} from '../../../lib/supabase/read-all';
import {redirect} from 'next/navigation';
import {createClient} from '../../../lib/backend/server';
import {backendConfigured} from '../../../lib/backend/config';
import {BusinessForm} from '../forms';
import {logout} from '../actions';
import {businessPlan} from '../../../lib/business-plan';
import {customerGroups,weeklyAdvice} from '../../../lib/customer-segments';
import {isInPeriod,periodLabel,recentPeriod} from '../../../lib/periods';

export const dynamic='force-dynamic';

export default async function Panel(){
 if(!backendConfigured())redirect('/acceso');
 const client=await createClient();
 const{data:claims,error:authError}=await client.auth.getClaims();
 if(authError||!claims?.claims.sub)redirect('/acceso');
 const{data:business,error}=await client.from('npr_businesses').select('id,name,risk_days,plan').eq('owner_id',claims.claims.sub).maybeSingle();
 if(error)return <main className="dashboard"><h1>Tu panel</h1><p role="alert">No se pudo consultar tu negocio. Inténtalo de nuevo.</p></main>;
 if(!business)return <main className="dashboard"><h1>Registra tu negocio</h1><section className="reviewBox"><BusinessForm/></section><form action={logout}><button>Cerrar sesión</button></form></main>;
 const[{data:customers,error:ce},{data:movements,error:me},{data:reviews,error:re},{data:diagnostics,error:de}]=await Promise.all([
  readAll((start,end)=>client.from('npr_customers').select('id,name,phone,created_at').eq('business_id',business.id).order('created_at',{ascending:false}).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_movements').select('customer_id,kind,points,happened_at').eq('business_id',business.id).order('happened_at',{ascending:false}).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_reviews').select('rating,review_date,answered_at').eq('business_id',business.id).order('review_date',{ascending:false}).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_diagnostics').select('checked_on,rating,review_count').eq('business_id',business.id).order('checked_on',{ascending:false}).order('id').range(start,end)),
 ]);
 if(ce||me||re||de)return <main className="dashboard"><h1>Inicio</h1><section className="panelState panelError"><p role="alert">No se pudieron cargar los datos. Inténtalo nuevamente.</p><a href="/panel">Volver a cargar</a></section></main>;
 if((customers?.length||0)>=1000||(movements?.length||0)>=10000||(reviews?.length||0)>=10000)return <main className="dashboard"><h1>{business.name}</h1><p role="alert">El historial supera el límite de esta primera versión. Se necesita paginación antes de mostrar totales completos.</p></main>;
 const period=recentPeriod();
 const periodMovements=(movements||[]).filter(m=>isInPeriod(m.happened_at,period));
 const visits=periodMovements.filter(m=>m.kind==='visit').length;
 const redemptions=periodMovements.filter(m=>m.kind==='redeem').length;
 const newCustomers=(customers||[]).filter(c=>isInPeriod(c.created_at,period)).length;
 const plan=businessPlan(business.plan);
 const now=new Date();
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const groups=customerGroups(customers||[],movements||[],period,today,business.risk_days);
 const recentReviews=(reviews||[]).filter(r=>isInPeriod(r.review_date,period));
 const answered=recentReviews.filter(r=>r.answered_at).length;
 const latestDiagnosis=(diagnostics||[])[0];
 return <main className="dashboard homeDashboard">
  <header className="dashHead"><div><small>NIVAL · INICIO</small><h1>{business.name}</h1><p>Resumen · {periodLabel(period)}</p></div><form action={logout}><button>Cerrar sesión</button></form></header>
  <section className="homeLead"><div><span className="eyebrow">TUS VISITAS</span><p className="leadNumber">{visits}</p><p>visitas en los últimos 30 días</p></div><a href="/panel/clientes">Ver clientes</a></section>
  <section className="stats homeMetrics"><article><span>Clientes nuevos</span><b>{newCustomers}</b><small>en el periodo</small></article><article><span>Premios canjeados</span><b>{redemptions}</b><small>en el periodo</small></article>{plan!=='puntos'&&<article><span>Reseñas contestadas</span><b>{answered}</b><small>de {recentReviews.length} reseñas del periodo</small></article>}</section>
  {plan!=='puntos'&&<section className="homeGoogle"><div><span>Calificación de Google</span><strong>{latestDiagnosis?`${Number(latestDiagnosis.rating).toFixed(1)} / 5`:'—'}</strong></div><p>{latestDiagnosis?`${latestDiagnosis.review_count} reseñas registradas en Google · revisión del ${latestDiagnosis.checked_on}`:'Nival aún no ha registrado una revisión de tu ficha.'}</p><a href="/panel/resenas">Ver reseñas</a></section>}
  <section className="homeSegments"><header><div><span className="eyebrow">ESTADO DE TUS CLIENTES</span><h2>Conoce quién necesita atención</h2></div></header><div className="segmentGrid"><article><span>En riesgo</span><b>{groups.atRisk.size}</b></article><article><span>Sin visita</span><b>{groups.neverVisited.size}</b></article><article><span>Nuevos</span><b>{groups.new.size}</b></article><article><span>Frecuentes</span><b>{groups.frequent.size}</b></article></div><p className="weeklyAdvice"><span>Consejo de la semana</span>{weeklyAdvice(groups)}</p></section>
  {visits+newCustomers+redemptions===0&&<p className="empty">Todavía no hay actividad en este periodo. Registra un cliente y una visita para ver aquí su avance.</p>}
  <section className="homeClientLink"><div><span>CLIENTES</span><h2>Conoce y atiende a tus clientes</h2><p>Busca por nombre o teléfono, suma visitas y registra canjes.</p></div><a href="/panel/clientes">Abrir Clientes</a></section>
 </main>;
}
