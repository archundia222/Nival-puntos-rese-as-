import {NextResponse,type NextRequest} from 'next/server';
import {getAuth} from './lib/backend/auth';
import {backendConfigured} from './lib/backend/config';
export async function proxy(request:NextRequest){
 let response=NextResponse.next({request});
 if(request.nextUrl.pathname.startsWith('/panel')&&backendConfigured())response=await getAuth().middleware({loginUrl:'/acceso'})(request);
 response.headers.set('Cache-Control','private, no-store, max-age=0');response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Robots-Tag','noindex, nofollow');return response;
}
export const config={matcher:['/panel/:path*','/tarjeta/:path*','/restablecer','/acceso','/api/auth/:path*','/auth/:path*']};
