import {NextResponse,type NextRequest} from 'next/server';
import {getAuth} from './lib/backend/auth';
import {backendConfigured} from './lib/backend/config';
import {foundationEnabled} from './lib/foundation/db';
import {hintRole,roleHome} from './lib/foundation/security.mjs';
export async function proxy(request:NextRequest){
 const path=request.nextUrl.pathname;let response=NextResponse.next({request});
 const foundation=foundationEnabled();const protectedEmail=path.startsWith('/panel')||path.startsWith('/admin')||path==='/entrar';
 const protectedStaff=path.startsWith('/staff')&&path!=='/staff/acceso';
 if(foundation&&(protectedEmail||protectedStaff)){
  // Solo orienta la navegación. Páginas y acciones vuelven a consultar permisos reales.
  const hint=hintRole(request.cookies.get('nival_route')?.value,process.env.SESSION_SECRET);
  const wrongRole=hint&&((path.startsWith('/admin')&&hint!=='superadmin')||(path.startsWith('/panel')&&hint!=='owner')||(protectedStaff&&hint!=='staff'));
  if(wrongRole)response=NextResponse.redirect(new URL(roleHome(hint),request.url));
  else if(protectedStaff){if(!request.cookies.get('nival_staff'))response=NextResponse.redirect(new URL('/staff/acceso',request.url));}
  else if(backendConfigured())response=await getAuth().middleware({loginUrl:'/acceso'})(request);
  else response=NextResponse.redirect(new URL('/acceso',request.url));
 }else if(path.startsWith('/panel')&&backendConfigured())response=await getAuth().middleware({loginUrl:'/acceso'})(request);
 response.headers.set('Cache-Control','private, no-store, max-age=0');response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Robots-Tag','noindex, nofollow');response.headers.set('X-Content-Type-Options','nosniff');return response;
}
export const config={matcher:['/admin/:path*','/panel/:path*','/staff/:path*','/b/:path*','/entrar','/tarjeta/:path*','/restablecer','/acceso','/api/auth/:path*','/auth/:path*']};
