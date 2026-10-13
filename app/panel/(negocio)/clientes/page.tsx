import {redirect} from 'next/navigation';
import {createClient} from '../../../../lib/backend/server';
import {backendConfigured} from '../../../../lib/backend/config';
import {readAll} from '../../../../lib/supabase/read-all';
import {customerCardsConfigured} from '../../../../lib/supabase/customer-card';
import {customerGroups,weeklyAdvice} from '../../../../lib/customer-segments';
import {recentPeriod} from '../../../../lib/periods';
import {CustomerForm} from '../../forms';
import {CustomerList} from '../../customer-list';

export const dynamic='force-dynamic';

export default async function ClientsPage(){
 if(!backendConfigured())redirect('/acceso');
 const client=await createClient();
 const{data:claims,error:authError}=await client.auth.getClaims();
 if(authError||!claims?.claims.sub)redirect('/acceso');
 const{data:business,error}=await client.from('npr_businesses').select('id,name,reward_goal,risk_days,plan').eq('owner_id',claims.claims.sub).maybeSingle();
 if(error)return <main className="dashboard"><h1>Clientes</h1><p role="alert">No se pudo consultar tu negocio.</p></main>;
 if(!business)return <main className="dashboard"><h1>Clientes</h1><p>Registra tu negocio desde Inicio para continuar.</p><a href="/panel">Ir a Inicio</a></main>;
 const[{data:customers,error:customerError},{data:movements,error:movementError}]=await Promise.all([
  readAll((start,end)=>client.from('npr_customers').select('id,name,phone,created_at').eq('business_id',business.id).order('created_at',{ascending:false}).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_movements').select('customer_id,kind,points,happened_at').eq('business_id',business.id).order('happened_at',{ascending:false}).order('id').range(start,end)),
 ]);
 if(customerError||movementError)return <main className="dashboard"><h1>Clientes</h1><section className="panelState panelError"><p role="alert">No se pudieron cargar los clientes. Inténtalo nuevamente.</p><a href="/panel/clientes">Volver a cargar</a></section></main>;
 if((customers?.length||0)>=1000||(movements?.length||0)>=10000)return <main className="dashboard"><h1>Clientes</h1><p role="alert">El historial supera el límite de esta primera versión. Se necesita paginación antes de mostrar todos los clientes.</p></main>;
 const period=recentPeriod();
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const groups=customerGroups(customers||[],movements||[],period,today,business.risk_days);
 const summaries=new Map<string,{balance:number;visits:number;lastVisit:string|null}>();
 for(const movement of movements||[]){const summary=summaries.get(movement.customer_id)||{balance:0,visits:0,lastVisit:null};summary.balance+=movement.points;if(movement.kind==='visit'){summary.visits++;if(!summary.lastVisit||movement.happened_at>summary.lastVisit)summary.lastVisit=movement.happened_at;}summaries.set(movement.customer_id,summary);}
 const cardsResult=customerCardsConfigured()?await readAll((start,end)=>client.from('npr_customers').select('id,card_token,card_enabled').eq('business_id',business.id).order('id').range(start,end)):{data:null,error:null};
 const cardMap=new Map((cardsResult.data||[]).map(card=>[card.id,card]));
 const customerSummaries=(customers||[]).map(customer=>{const summary=summaries.get(customer.id)||{balance:0,visits:0,lastVisit:null};const card=cardMap.get(customer.id);return {id:customer.id,name:customer.name,phone:customer.phone,...summary,atRisk:groups.atRisk.has(customer.id),cardToken:card?.card_token,cardEnabled:card?.card_enabled,lastVisit:summary.lastVisit?new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeZone:'America/Mexico_City'}).format(new Date(summary.lastVisit)):null};});
 return <main className="dashboard clientsDashboard"><header className="dashHead"><div><small>NIVAL · CLIENTES</small><h1>Clientes</h1><p>Grupos según su actividad en los últimos 30 días.</p></div></header>
  <section className="clientAdvice"><span>Consejo para esta semana</span><p>{weeklyAdvice(groups)}</p></section>
  <section className="reviewBox clientCreate"><h2>Registrar cliente</h2><CustomerForm/></section>
  <CustomerList customers={customerSummaries} goal={business.reward_goal} advice={undefined} groups={{atRisk:[...groups.atRisk],neverVisited:[...groups.neverVisited],new:[...groups.new],frequent:[...groups.frequent]}}/>
  {cardsResult.error&&<p role="status">El control de tarjetas no está disponible ahora. Puedes seguir buscando clientes y registrando visitas.</p>}
  <p className="notice">Las categorías siguen este orden: en riesgo, sin visita, nuevos y frecuentes.</p>
 </main>;
}
