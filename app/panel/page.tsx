import {customerCardsConfigured} from '../../lib/supabase/customer-card';
import {ReviewLinkForm} from './review-link-form';
import {mexicoDate} from '../../lib/monthly-report';
import {CustomerList} from './customer-list';
import {readAll} from '../../lib/supabase/read-all';
import {redirect} from 'next/navigation';
import {createClient} from '../../lib/backend/server';
import {backendConfigured} from '../../lib/backend/config';
import {BusinessForm,CustomerForm,RewardForm} from './forms';
import {logout} from './actions';
import {StaffManager} from './staff-manager';

export const dynamic='force-dynamic';

export default async function Panel(){
 if(!backendConfigured())redirect('/acceso');
 const client=await createClient();
 const{data:claims,error:authError}=await client.auth.getClaims();
 if(authError||!claims?.claims.sub)redirect('/acceso');

 const{data:business,error}=await client.from('npr_businesses')
  .select('id,name,reward_goal,reward_name,risk_days')
  .eq('owner_id',claims.claims.sub).maybeSingle();

 if(error)return <main className="dashboard"><h1>Tu panel</h1><p role="alert">No se pudo consultar tu negocio. Inténtalo nuevamente.</p><a href="/acceso">Volver al acceso</a></main>;
 if(!business){const member=await client.from('npr_business_members').select('business_id').eq('user_id',claims.claims.sub).eq('active',true).maybeSingle();if(member.data)redirect('/personal');return <main className="dashboard setupPage"><header className="dashHead"><div><small>NIVAL · PUNTOS + RESEÑAS</small><h1>Empieza con tu negocio</h1><p>Solo necesitamos su nombre para preparar tu espacio.</p></div><form action={logout}><button className="quietButton">Cerrar sesión</button></form></header><section className="setupCard"><span className="stepLabel">PASO 1 DE 1</span><BusinessForm/></section></main>;}

 const[{data:customers,error:ce},{data:movements,error:me},{data:reviews,error:re}]=await Promise.all([
  readAll((start,end)=>client.from('npr_customers').select('id,name,phone,created_at').eq('business_id',business.id).order('created_at',{ascending:false}).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_movements').select('customer_id,kind,points,happened_at').eq('business_id',business.id).order('happened_at',{ascending:false}).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_reviews').select('rating,review_date,answered_at').eq('business_id',business.id).order('review_date',{ascending:false}).order('id').range(start,end))
 ]);
 if(ce||me||re)return <main className="dashboard"><h1>{business.name}</h1><p role="alert">No se pudieron cargar los datos. Inténtalo nuevamente.</p></main>;
 if((customers?.length||0)>=1000||(movements?.length||0)>=10000||(reviews?.length||0)>=10000)return <main className="dashboard"><h1>{business.name}</h1><p>El historial supera el límite de esta primera versión. Se necesita paginación antes de mostrar totales completos.</p></main>;

 const summaries=new Map<string,{balance:number;visits:number;lastVisit:string|null}>();
 for(const movement of movements||[]){
  const summary=summaries.get(movement.customer_id)||{balance:0,visits:0,lastVisit:null};
  summary.balance+=movement.points;
  if(movement.kind==='visit'){summary.visits++;if(!summary.lastVisit||movement.happened_at>summary.lastVisit)summary.lastVisit=movement.happened_at;}
  summaries.set(movement.customer_id,summary);
 }
 const{data:cards,error:cardsError}=customerCardsConfigured()
  ?await readAll((start,end)=>client.from('npr_customers').select('id,card_token,card_enabled').eq('business_id',business.id).order('id').range(start,end))
  :{data:null,error:null};
 const cardMap=new Map((cards||[]).map(card=>[card.id,card]));
 const{data:reviewLink,error:linkError}=await client.from('npr_review_links').select('id,display_name,google_url,active').eq('business_id',business.id).maybeSingle();
 const staffResult=await (client as any).rpc('npr_list_staff');
 const staff=staffResult.error?[]:staffResult.data||[];
 const now=Date.now();
 const customerSummaries=(customers||[]).map(customer=>{
  const summary=summaries.get(customer.id)||{balance:0,visits:0,lastVisit:null};
  const card=cardMap.get(customer.id);
  return {cardToken:card?.card_token,cardEnabled:card?.card_enabled,id:customer.id,name:customer.name,phone:customer.phone,...summary,
   atRisk:now-Date.parse(summary.lastVisit||customer.created_at)>business.risk_days*86400000,
   lastVisit:summary.lastVisit?new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeZone:'America/Mexico_City'}).format(new Date(summary.lastVisit)):null};
 });
 const month=mexicoDate().slice(0,7);
 const currentReviews=(reviews||[]).filter(review=>review.review_date.startsWith(month));
 const currentMovements=(movements||[]).filter(movement=>mexicoDate(new Date(movement.happened_at)).startsWith(month));
 const monthlyVisits=currentMovements.filter(movement=>movement.kind==='visit').length;
 const redemptions=currentMovements.filter(movement=>movement.kind==='redeem').length;
 const positive=currentReviews.filter(review=>review.rating>=4).length;
 const negative=currentReviews.filter(review=>review.rating<=2).length;
 const answered=currentReviews.filter(review=>review.answered_at).length;
 const atRisk=customerSummaries.filter(customer=>customer.atRisk).length;
 const monthLabel=new Intl.DateTimeFormat('es-MX',{month:'long'}).format(new Date(`${month}-01T12:00:00Z`));

 return <main className="dashboard">
  <header className="dashHead">
   <div><a className="brandMark" href="/">NIVAL <span>PUNTOS + RESEÑAS</span></a><h1>{business.name}</h1><p>Impacto de tu programa · {monthLabel}</p></div>
   <form action={logout}><button className="quietButton">Cerrar sesión</button></form>
  </header>

  <section className="overviewSection" aria-labelledby="overview-title">
   <div className="sectionHeading"><div><span className="eyebrow">VISTA GENERAL</span><h2 id="overview-title">Tu negocio, de un vistazo</h2></div><a className="textLink" href="/panel/reporte">Ver reporte mensual <span aria-hidden="true">↗</span></a></div>
   <div className="stats metricGrid">
    <article className="metricCard"><span>Clientes</span><b>{customers?.length||0}</b><small>registrados</small></article>
    <article className="metricCard"><span>Visitas</span><b>{monthlyVisits}</b><small>este mes</small></article>
    <article className="metricCard"><span>Premios canjeados</span><b>{redemptions}</b><small>este mes</small></article>
    <article className="metricCard"><span>Clientes en riesgo</span><b>{atRisk}</b><small>según sus días sin volver</small></article>
    <article className="metricCard"><span>Reseñas recibidas</span><b>{currentReviews.length}</b><small>capturadas este mes</small></article>
    <article className="metricCard"><span>Respuestas confirmadas</span><b>{answered}</b><small>{currentReviews.length-answered} pendientes</small></article>
   </div>
   <div className="insightStrip"><span className="insightIcon" aria-hidden="true">↗</span><p><strong>{positive} reseñas positivas</strong> y {negative} de 1–2 estrellas capturadas este mes.</p><a href="#reviews">Revisar reseñas</a></div>
  </section>

  <nav className="quickNav" aria-label="Secciones del panel"><a href="#customers">Clientes y visitas</a><a href="#reviews">Reseñas de Google</a><a href="#rewards">Programa de puntos</a></nav>

  <section className="workspaceGrid" aria-label="Herramientas del negocio">
   <div className="workspaceMain" id="customers">
    <section className="contentCard">
     <div className="sectionHeading"><div><span className="eyebrow">FIDELIZACIÓN</span><h2>Clientes y visitas</h2></div><span className="countPill">{customers?.length||0} clientes</span></div>
     <CustomerForm/>
     <CustomerList customers={customerSummaries} goal={business.reward_goal}/>
    </section>
   </div>
   <aside className="workspaceAside">
    <section className="contentCard" id="reviews">
     <div className="sectionHeading"><div><span className="eyebrow">REPUTACIÓN</span><h2>Reseñas de Google</h2></div></div>
     <p className="cardIntro">Comparte una página directa para que tus clientes encuentren tu ficha.</p>
     <ReviewLinkForm name={business.name} link={reviewLink} error={!!linkError}/>
     <a className="reportLink" href="/panel/reporte">Resumen de reseñas y resultados <span aria-hidden="true">→</span></a>
    </section>
    <section className="contentCard" id="rewards">
     <div className="sectionHeading"><div><span className="eyebrow">RECOMPENSAS</span><h2>Tu programa</h2></div></div>
     <p className="rewardPreview"><span>PREMIO</span><strong>{business.reward_name}</strong><small>{business.reward_goal} puntos</small></p>
     <RewardForm goal={business.reward_goal} reward={business.reward_name} risk={business.risk_days}/>
    </section>
    <StaffManager staff={staff} error={!!staffResult.error}/>
    {(!customerCardsConfigured()||cardsError)&&<p className="quietNotice">Las tarjetas públicas de puntos están en preparación. Puedes registrar clientes, visitas y canjes desde aquí.</p>}
   </aside>
  </section>
 </main>;
}
