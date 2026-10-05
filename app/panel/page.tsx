import {ReviewLinkForm} from './review-link-form';
import {mexicoDate} from '../../lib/monthly-report';
import {CustomerList} from './customer-list';
import {readAll} from '../../lib/supabase/read-all';
import {redirect} from 'next/navigation';
import {createClient} from '../../lib/supabase/server';
import {supabaseConfigured} from '../../lib/supabase/config';
import {BusinessForm,CustomerForm,RewardForm} from './forms';
import {logout} from './actions';
export const dynamic='force-dynamic';
export default async function Panel(){
 if(!supabaseConfigured())redirect('/acceso');
 const client=await createClient();const{data:claims,error:authError}=await client.auth.getClaims();if(authError||!claims?.claims.sub)redirect('/acceso');
 const{data:business,error}=await client.from('npr_businesses').select('id,name,reward_goal,reward_name,risk_days').eq('owner_id',claims.claims.sub).maybeSingle();
 if(error)return <main className="dashboard"><h1>Tu panel</h1><p role="alert">No se pudo consultar tu negocio. La base independiente puede estar pendiente de configuración.</p><a href="/acceso">Volver al acceso</a></main>;
 if(!business)return <main className="dashboard"><h1>Registra tu negocio</h1><section className="reviewBox"><BusinessForm/></section><form action={logout}><button>Cerrar sesión</button></form></main>;
 const[{data:customers,error:ce},{data:movements,error:me},{data:reviews,error:re}]=await Promise.all([readAll((start,end)=>client.from('npr_customers').select('id,name,phone,created_at').eq('business_id',business.id).order('created_at',{ascending:false}).order('id').range(start,end)),readAll((start,end)=>client.from('npr_movements').select('customer_id,kind,points,happened_at').eq('business_id',business.id).order('happened_at',{ascending:false}).order('id').range(start,end)),readAll((start,end)=>client.from('npr_reviews').select('rating,review_date,answered_at').eq('business_id',business.id).order('review_date',{ascending:false}).order('id').range(start,end))]);
 if(ce||me||re)return <main className="dashboard"><h1>{business.name}</h1><p role="alert">No se pudieron cargar los datos. Inténtalo nuevamente.</p></main>;
 if((customers?.length||0)>=1000||(movements?.length||0)>=10000||(reviews?.length||0)>=10000)return <main className="dashboard"><h1>{business.name}</h1><p>El historial supera el límite de esta primera versión. Se necesita paginación antes de mostrar totales completos.</p></main>;
 const summaries=new Map<string,{balance:number;visits:number;lastVisit:string|null}>();
 for(const movement of movements||[]){const summary=summaries.get(movement.customer_id)||{balance:0,visits:0,lastVisit:null};summary.balance+=movement.points;if(movement.kind==='visit'){summary.visits++;if(!summary.lastVisit||movement.happened_at>summary.lastVisit)summary.lastVisit=movement.happened_at;}summaries.set(movement.customer_id,summary);}
 const {data:reviewLink,error:linkError}=await client.from('npr_review_links').select('id,display_name,google_url,active').eq('business_id',business.id).maybeSingle();
 const now=Date.now();const customerSummaries=(customers||[]).map(customer=>{const summary=summaries.get(customer.id)||{balance:0,visits:0,lastVisit:null};return {id:customer.id,name:customer.name,phone:customer.phone,...summary,atRisk:now-Date.parse(summary.lastVisit||customer.created_at)>business.risk_days*86400000,lastVisit:summary.lastVisit?new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeZone:'America/Mexico_City'}).format(new Date(summary.lastVisit)):null};});
 const month=mexicoDate().slice(0,7);const recent=(reviews||[]).filter(r=>r.review_date.startsWith(month));const monthlyVisits=(movements||[]).filter(m=>m.kind==='visit'&&mexicoDate(new Date(m.happened_at)).startsWith(month));
 return <main className="dashboard"><header className="dashHead"><div><small>NIVAL · TU CUENTA</small><h1>{business.name}</h1><p>Datos de tu negocio, guardados en la base compartida.</p></div><form action={logout}><button>Cerrar sesión</button></form></header><section className="stats"><article><span>Clientes registrados</span><b>{customers?.length||0}</b></article><article><span>Visitas · {month}</span><b>{monthlyVisits.length}</b></article><article><span>Reseñas · {month}</span><b>{recent.length}</b></article></section><section className="reviewBox"><h2>Resumen de reseñas</h2><a href="/panel/reporte">Consultar resumen mensual</a><p>{recent.filter(r=>r.rating>=4).length} positivas · {recent.filter(r=>r.rating===3).length} neutrales · {recent.filter(r=>r.rating<=2).length} negativas. {recent.filter(r=>r.answered_at).length} respuestas confirmadas.</p><p>Nival carga estos datos después de revisar y responder manualmente en Google.</p></section><ReviewLinkForm name={business.name} link={reviewLink} error={!!linkError}/><section className="reviewBox"><h2>Registrar cliente</h2><CustomerForm/></section><CustomerList customers={customerSummaries} goal={business.reward_goal}/><section className="reviewBox"><h2>Programa de recompensas</h2><RewardForm goal={business.reward_goal} reward={business.reward_name} risk={business.risk_days}/></section></main>;
}
