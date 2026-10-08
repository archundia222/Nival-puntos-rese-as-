import {cookies,headers} from 'next/headers';
import {createHmac} from 'node:crypto';
import {getAuth} from '../../../../lib/backend/auth';
import {query,authScope} from '../../../../lib/foundation/db';
import {secret} from '../../../../lib/foundation/session';
import {verifyTurnstileCookie} from '../../../../lib/security/turnstile-cookie.mjs';
import {assertSameOrigin} from '../../../../lib/points/security';
import {trustedClientIp} from '../../../../lib/security/client-ip';
import {administratorEmail} from '../../../../lib/security/admin-policy.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request,context:any){return getAuth().handler().GET(request,context);}
function validEmail(value:unknown){const s=String(value||'').trim().toLowerCase();return s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:'';}
async function loginAllowed(request:Request){
 const h=await headers();const ip=trustedClientIp(h);
 let email='';try{email=validEmail((await request.clone().json())?.email);}catch{}
 const hash=(v:string)=>createHmac('sha256',secret()).update(v).digest('hex');
 const keys=[hash('auth-ip:'+ip),...(email?[hash('auth-email:'+email)]:[])];
 for(const key of keys){const [row]=await query(authScope(),'select nival_pr_private.claim_pin_attempt($1) accepted',[key]);if(!row?.accepted)return false;}
 return true;
}
export async function POST(request:Request,context:any){
 const path=new URL(request.url).pathname;
 if(path.endsWith('/sign-in/email')||path.endsWith('/sign-up/email')){try{await assertSameOrigin();}catch{return Response.json({message:'Solicitud no autorizada.'},{status:403});}}
 if(path.endsWith('/sign-in/email')){
  let email='';try{email=validEmail((await request.clone().json())?.email);}catch{}
  if(email===administratorEmail)return Response.json({message:'Usa Administración privada para este acceso.'},{status:403});
  if(!await loginAllowed(request))return Response.json({message:'Demasiados intentos. Espera 15 minutos.'},{status:429});
 }
 if(path.endsWith('/sign-up/email')){
  let email='';try{email=validEmail((await request.clone().json())?.email);}catch{}
  if(email===administratorEmail)return Response.json({message:'Configura este acceso desde Administración privada.'},{status:403});
  if(!await loginAllowed(request))return Response.json({message:'Demasiados registros. Espera 15 minutos.'},{status:429});
  const jar=await cookies();if(!verifyTurnstileCookie(jar.get('nival_turnstile')?.value,secret()))return Response.json({message:'Verificación anti-bot requerida.'},{status:403});
 }
 const response=await getAuth().handler().POST(request,context);
 if(path.endsWith('/sign-up/email'))response.headers.append('Set-Cookie','nival_turnstile=; Max-Age=0; Path=/api/auth; HttpOnly; Secure; SameSite=Strict');
 return response;
}
