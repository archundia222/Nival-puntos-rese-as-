import {redirect} from 'next/navigation';
import {createClient} from '../../../../lib/backend/server';
import {backendConfigured} from '../../../../lib/backend/config';
import {readAll} from '../../../../lib/supabase/read-all';
import {customerCardsConfigured} from '../../../../lib/supabase/customer-card';
import {isInPeriod,periodLabel,recentPeriod} from '../../../../lib/periods';
import {CardWorkspace} from '../../card-workspace';

export const dynamic='force-dynamic';

export default async function CardsPage(){
 if(!backendConfigured())redirect('/acceso');
 const client=await createClient();const{data:claims,error:authError}=await client.auth.getClaims();
 if(authError||!claims?.claims.sub)redirect('/acceso');
 const{data:business,error}=await client.from('npr_businesses').select('id,name,reward_goal,reward_name').eq('owner_id',claims.claims.sub).maybeSingle();
 if(error)return <main className="dashboard"><h1>Tarjetas</h1><p role="alert">No se pudo consultar tu negocio.</p></main>;
 if(!business)return <main className="dashboard"><h1>Tarjetas</h1><p>Registra tu negocio desde Inicio para continuar.</p><a href="/panel">Ir a Inicio</a></main>;
 const[{data:customers,error:customerError},{data:movements,error:movementError},{data:cards,error:cardsError},{data:reviewLink,error:reviewLinkError}]=await Promise.all([
  readAll((start,end)=>client.from('npr_customers').select('id,name,phone').eq('business_id',business.id).order('created_at',{ascending:false}).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_movements').select('customer_id,kind,points,happened_at').eq('business_id',business.id).order('happened_at',{ascending:false}).order('id').range(start,end)),
  customerCardsConfigured()?readAll((start,end)=>client.from('npr_customers').select('id,card_token,card_enabled').eq('business_id',business.id).order('id').range(start,end)):Promise.resolve({data:null,error:null}),
  client.from('npr_review_links').select('id,display_name,google_url,active').eq('business_id',business.id).maybeSingle(),
 ]);
 if(customerError||movementError)return <main className="dashboard"><h1>Tarjetas</h1><section className="panelState panelError"><p role="alert">No se pudieron cargar las tarjetas. Inténtalo de nuevo.</p><a href="/panel/tarjetas">Volver a cargar</a></section></main>;
 if((customers?.length||0)>=1000||(movements?.length||0)>=10000)return <main className="dashboard"><h1>Tarjetas</h1><p role="alert">El historial supera el límite de esta primera versión. Se necesita paginación antes de mostrar todos los registros.</p></main>;
 const period=recentPeriod();const current=(movements||[]).filter(m=>isInPeriod(m.happened_at,period));
 const visits=current.filter(m=>m.kind==='visit').length;const redemptions=current.filter(m=>m.kind==='redeem').length;
 const balances=new Map<string,{balance:number;visits:number;lastVisit:string|null}>();
 for(const movement of movements||[]){const item=balances.get(movement.customer_id)||{balance:0,visits:0,lastVisit:null};item.balance+=movement.points;if(movement.kind==='visit'){item.visits++;if(!item.lastVisit||movement.happened_at>item.lastVisit)item.lastVisit=movement.happened_at;}balances.set(movement.customer_id,item);}
 const cardMap=new Map((cards||[]).map(card=>[card.id,card]));
 const records=(customers||[]).map(customer=>{const info=balances.get(customer.id)||{balance:0,visits:0,lastVisit:null};const card=cardMap.get(customer.id);return {id:customer.id,name:customer.name,phone:customer.phone,balance:info.balance,visits:info.visits,lastVisit:info.lastVisit?new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeZone:'America/Mexico_City'}).format(new Date(info.lastVisit)):null,cardToken:card?.card_token,cardEnabled:card?.card_enabled};});
 const enabledCount=records.filter(item=>item.cardEnabled).length;
 return <main className="dashboard cardsDashboard"><header className="dashHead"><div><small>NIVAL · TARJETAS</small><h1>Tarjetas</h1><p>Programa de puntos · {periodLabel(period)}</p></div></header><CardWorkspace businessName={business.name} goal={business.reward_goal} reward={business.reward_name} customers={records} enabledCount={enabledCount} visits={visits} redemptions={redemptions} reviewLink={reviewLink||null} reviewLinkError={!!reviewLinkError} cardControlsAvailable={customerCardsConfigured()&&!cardsError}/></main>;
}
