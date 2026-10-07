import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getAuth} from '../backend/auth';
import {query,authScope,foundationEnabled,type Actor,type Role} from './db';
import {sha256,roleHome} from './security.mjs';
import {canEnterAdministration} from '../security/admin-policy.mjs';
import {validAdminProof} from '../security/admin-proof.mjs';
export const adminCookie='nival_admin_access';
export const staffCookie='nival_staff';
export const routeCookie='nival_route';
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge:8*3600};
export function secret(){const value=process.env.SESSION_SECRET||'';if(value.length<32)throw Error('SESSION_SECRET no configurado.');return value;}
export async function emailActor():Promise<Actor|null>{
 const {data,error}=await getAuth().getSession();if(error||!data?.user||!data?.session?.id)return null;
 const user=data.user;
 const [profile]=await query(authScope(user.id),'select id,role,full_name from nival_pr.profiles where id=$1',[user.id]);
 if(!profile||!['superadmin','owner'].includes(profile.role))return null;
 if(profile.role==='superadmin'&&!canEnterAdministration(user,profile))return null;
 if(profile.role==='superadmin'&&!validAdminProof((await cookies()).get(adminCookie)?.value,user.id,data.session.id,secret()))return null;
 return {id:profile.id,role:profile.role,name:profile.full_name};
}
export async function currentActor():Promise<Actor|null>{
 if(!foundationEnabled())return null;
 const token=(await cookies()).get(staffCookie)?.value;
 if(token&&/^[A-Za-z0-9_-]{43}$/.test(token)){
  const [session]=await query(authScope(),'select * from nival_pr_private.staff_session($1)',[sha256(token)]);
  if(session)return {id:session.user_id,role:'staff',name:session.full_name,businessId:session.business_id};
 }
 return emailActor();
}
export async function requireRole(...allowed:Role[]){
 const actor=await currentActor();if(!actor)redirect(allowed.includes('superadmin')?'/acceso-administrador':'/acceso');if(!allowed.includes(actor.role))redirect(roleHome(actor.role));return actor;
}
export async function requireAdminRole(){
 return requireRole('superadmin');
}
export async function requireBusiness(actor:Actor,id:string){
 if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('Negocio inválido.');
 if(actor.role==='staff'&&actor.businessId!==id)throw Error('Negocio no autorizado.');
 if(actor.role!=='superadmin'){
  const [member]=await query(authScope(actor.id),'select role from nival_pr.memberships where user_id=$1 and business_id=$2 and active',[actor.id,id]);
  if(!member||member.role!==actor.role)throw Error('Negocio no autorizado.');
 }
 return actor;
}
