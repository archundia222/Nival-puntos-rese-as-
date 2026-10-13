'use server';
import {randomUUID} from 'node:crypto';
import {customerCardsConfigured} from '../../lib/supabase/customer-card';
import {cardTokenValid} from '../../lib/customer-card';
import {googleReviewUrl} from '../../lib/review-link';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {createClient} from '../../lib/backend/server';
import {backendConfigured} from '../../lib/backend/config';
export type ActionResult={error?:string;success?:string};
async function authenticated(){if(!backendConfigured())throw Error('setup');const client=await createClient();const{data,error}=await client.auth.getUser();if(error||!data.user)throw Error('auth');return {client,user:data.user};}
export async function createBusiness(_:ActionResult,form:FormData):Promise<ActionResult>{
 const name=String(form.get('name')||'').trim();if(name.length<1||name.length>150)return {error:'Escribe un nombre de negocio válido.'};
 try{const{client,user}=await authenticated();const{error}=await client.from('npr_businesses').insert({owner_id:user.id,name});if(error)return {error:'No se pudo crear el negocio. Revisa si ya registraste uno.'};}catch{return {error:'Inicia sesión para registrar tu negocio.'};}
 revalidatePath('/panel');return {success:'Negocio creado.'};
}
export async function addCustomer(_:ActionResult,form:FormData):Promise<ActionResult>{
 const name=String(form.get('name')||'').trim();const phone=String(form.get('phone')||'').replace(/\D/g,'');if(!name||name.length>100||(phone&&!/^\d{7,15}$/.test(phone)))return {error:'Revisa el nombre y el teléfono (7 a 15 dígitos).'};
 try{const{client,user}=await authenticated();const{data:business,error:readError}=await client.from('npr_businesses').select('id').eq('owner_id',user.id).single();if(readError||!business)return {error:'Primero registra tu negocio.'};const{error}=await client.from('npr_customers').insert({business_id:business.id,name,phone:phone||null});if(error)return {error:error.code==='23505'?'Ese teléfono ya está registrado.':'No se pudo guardar el cliente.'};revalidatePath('/panel');return {success:'Cliente registrado.'};}catch{return {error:'Inicia sesión para registrar clientes.'};}
}
export async function recordMovement(_:ActionResult,form:FormData):Promise<ActionResult>{
 const id=String(form.get('customerId')||'');const kind=String(form.get('kind')||'');if(!/^[0-9a-f-]{36}$/i.test(id)||!['visit','redeem'].includes(kind))return {error:'Movimiento inválido.'};
 try{const{client,user}=await authenticated();const{data:business,error:be}=await client.from('npr_businesses').select('id,reward_goal').eq('owner_id',user.id).single();if(be||!business)return {error:'Negocio no disponible.'};const{error}=await client.from('npr_movements').insert({business_id:business.id,customer_id:id,kind,points:kind==='visit'?1:-business.reward_goal});if(error)return {error:error.code==='NPR01'?'Este cliente ya alcanzó el límite de visitas de hoy.':'No se pudo registrar. Comprueba el cliente y sus puntos disponibles.'};revalidatePath('/panel');revalidatePath('/panel/clientes');return {success:kind==='visit'?'Visita registrada.':'Premio canjeado.'};}catch{return {error:'Inicia sesión para continuar.'};}
}
export async function updateBusinessSettings(_:ActionResult,form:FormData):Promise<ActionResult>{
 const name=String(form.get('name')||'').trim();const category=String(form.get('category')||'').trim();const neighborhood=String(form.get('neighborhood')||'').trim();
 const risk=Number(form.get('riskDays'));const dailyLimit=Number(form.get('dailyLimit'));const expirationText=String(form.get('expirationDays')||'').trim();const expiration=expirationText?Number(expirationText):null;
 if(!name||name.length>150||category.length>120||neighborhood.length>120)return {error:'Revisa el nombre, la categoría y la colonia.'};
 if(!Number.isInteger(risk)||risk<1||risk>365||!Number.isInteger(dailyLimit)||dailyLimit<1||dailyLimit>3||(expiration!==null&&(!Number.isInteger(expiration)||expiration<1)))return {error:'Revisa los días y el límite diario.'};
 try{const{client,user}=await authenticated();const{data,error}=await client.from('npr_businesses').update({name,category,neighborhood,risk_days:risk,max_visits_per_customer_per_day:dailyLimit,points_expiration_days:expiration}).eq('owner_id',user.id).select('id');if(error||!data?.length)return {error:'No se pudo guardar la configuración.'};revalidatePath('/panel');revalidatePath('/panel/configuracion');revalidatePath('/panel/clientes');return {success:'Configuración guardada.'};}catch{return {error:'Inicia sesión para guardar la configuración.'};}
}
export async function updateCard(_:ActionResult,form:FormData):Promise<ActionResult>{const goal=Number(form.get('goal'));const reward=String(form.get('reward')||'').trim();if(!Number.isInteger(goal)||goal<1||goal>100000||!reward||reward.length>150)return {error:'Revisa la meta de puntos y el premio.'};try{const{client,user}=await authenticated();const{data,error}=await client.from('npr_businesses').update({reward_goal:goal,reward_name:reward}).eq('owner_id',user.id).select('id');if(error||!data?.length)return {error:'No se pudo guardar la tarjeta.'};revalidatePath('/panel');revalidatePath('/panel/tarjetas');return {success:'Tarjeta guardada.'};}catch{return {error:'Inicia sesión para actualizar la tarjeta.'};}}
export async function logout(){const{client}=await authenticated();const{error}=await client.auth.signOut();if(error)throw Error('No se pudo cerrar sesión.');redirect('/acceso');}

export async function saveReviewLink(_:ActionResult,form:FormData):Promise<ActionResult>{
 const displayName=String(form.get('displayName')||'').trim();
 const googleUrl=googleReviewUrl(String(form.get('googleUrl')||''));
 if(!displayName||displayName.length>150||!googleUrl)return {error:'Revisa el nombre y pega el enlace de «Pedir reseñas» de Google.'};
 try{
  const {client,user}=await authenticated();
  const {data:business,error:be}=await client.from('npr_businesses').select('id').eq('owner_id',user.id).single();
  if(be||!business)return {error:'Primero registra tu negocio.'};
  const {data:existing,error:readError}=await client.from('npr_review_links').select('id').eq('business_id',business.id).maybeSingle();
  if(readError)return {error:'La configuración de enlaces todavía está pendiente.'};
  const values={display_name:displayName,google_url:googleUrl,active:form.get('active')==='on'};
  const result=existing?await client.from('npr_review_links').update(values).eq('id',existing.id).select('id').single():await client.from('npr_review_links').insert({...values,business_id:business.id}).select('id').single();
  if(result.error||!result.data)return {error:'No se pudo guardar el enlace. Inténtalo nuevamente.'};
  revalidatePath('/panel');revalidatePath('/panel/tarjetas');revalidatePath(`/opinar/${result.data.id}`);
  return {success:values.active?'Enlace guardado. Ya puedes compartirlo.':'Página desactivada.'};
 }catch{return {error:'Inicia sesión para configurar el enlace.'};}
}

export async function manageCustomerCard(_:ActionResult,form:FormData):Promise<ActionResult>{
 const id=String(form.get('customerId')||'');const operation=String(form.get('operation')||'');
 if(!cardTokenValid(id)||!['enable','disable','rotate'].includes(operation))return {error:'Tarjeta inválida.'};
 if(!customerCardsConfigured())return {error:'La consulta de tarjetas todavía está pendiente de activación.'};
 try{
  const {client,user}=await authenticated();
  const {data:business,error:be}=await client.from('npr_businesses').select('id').eq('owner_id',user.id).single();
  if(be||!business)return {error:'Negocio no disponible.'};
  const values=operation==='rotate'?{card_token:randomUUID(),card_enabled:true}:{card_enabled:operation==='enable'};
  const {data,error}=await client.from('npr_customers').update(values).eq('id',id).eq('business_id',business.id).select('id').single();
  if(error||!data)return {error:'No se pudo actualizar la tarjeta. Revisa la configuración.'};
  revalidatePath('/panel');revalidatePath('/panel/clientes');revalidatePath('/panel/tarjetas');return {success:operation==='disable'?'Tarjeta desactivada.':operation==='rotate'?'Nuevo enlace creado. El anterior ya no funciona.':'Tarjeta activada.'};
 }catch{return {error:'Inicia sesión para administrar las tarjetas.'};}
}
