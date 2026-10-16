import {redirect} from 'next/navigation';
import {createClient} from '../../lib/backend/server';
import {backendConfigured} from '../../lib/backend/config';
import {readAll} from '../../lib/supabase/read-all';
import {CustomerForm} from '../panel/forms';
import {CustomerList} from '../panel/customer-list';
import {logoutPersonal} from '../panel/actions';
export const dynamic='force-dynamic';
export default async function PersonalPanel(){
 if(!backendConfigured())redirect('/personal/acceso');
 const client=await createClient();const{data:claims,error:authError}=await client.auth.getClaims();
 if(authError||!claims?.claims.sub)redirect('/personal/acceso');
 const membership=await client.from('npr_business_members').select('business_id').eq('user_id',claims.claims.sub).eq('active',true).maybeSingle();
 if(membership.error)return <main className="dashboard"><h1>Acceso de personal</h1><p role="alert">No se pudo comprobar tu asignación. Inténtalo nuevamente.</p></main>;
 if(!membership.data)return <main className="dashboard"><header className="dashHead"><div><small>NIVAL · PERSONAL DE TIENDA</small><h1>Aún no tienes acceso asignado</h1><p>Pide a la persona responsable de tu negocio que active el correo de tu cuenta.</p></div><form action={logoutPersonal}><button className="quietButton">Cerrar sesión</button></form></header><a href="/personal/acceso">Volver al acceso</a></main>;
 const{data:business,error}=await client.from('npr_businesses').select('id,name,reward_goal,reward_name').eq('id',membership.data.business_id).single();
 if(error||!business)return <main className="dashboard"><h1>Negocio no disponible</h1><p>Contacta a la persona responsable de tu tienda.</p></main>;
 const[{data:customers,error:ce},{data:movements,error:me}]=await Promise.all([
  readAll((start,end)=>client.from('npr_customers').select('id,name,phone,created_at').eq('business_id',business.id).order('created_at',{ascending:false}).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_movements').select('customer_id,kind,points,happened_at').eq('business_id',business.id).order('happened_at',{ascending:false}).order('id').range(start,end))
 ]);
 if(ce||me)return <main className="dashboard"><h1>{business.name}</h1><p role="alert">No se pudo cargar la operación. Inténtalo nuevamente.</p></main>;
 const summaries=new Map<string,{balance:number;visits:number;lastVisit:string|null}>();
 for(const movement of movements||[]){const summary=summaries.get(movement.customer_id)||{balance:0,visits:0,lastVisit:null};summary.balance+=movement.points;if(movement.kind==='visit'){summary.visits++;if(!summary.lastVisit||movement.happened_at>summary.lastVisit)summary.lastVisit=movement.happened_at;}summaries.set(movement.customer_id,summary);}
 const customerSummaries=(customers||[]).map(customer=>{const summary=summaries.get(customer.id)||{balance:0,visits:0,lastVisit:null};return {id:customer.id,name:customer.name,phone:customer.phone,...summary,atRisk:false,lastVisit:summary.lastVisit?new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeZone:'America/Mexico_City'}).format(new Date(summary.lastVisit)):null};});
 return <main className="dashboard"><header className="dashHead"><div><small>NIVAL · PERSONAL DE TIENDA</small><h1>{business.name}</h1><p>Clientes, visitas y premios</p></div><form action={logoutPersonal}><button className="quietButton">Cerrar sesión</button></form></header><section className="contentCard"><div className="sectionHeading"><div><span className="eyebrow">FIDELIZACIÓN</span><h2>Clientes y visitas</h2></div></div><p className="cardIntro">Premio: {business.reward_name} · {business.reward_goal} puntos</p><CustomerForm/><CustomerList customers={customerSummaries} goal={business.reward_goal} showCards={false}/></section></main>;
}
