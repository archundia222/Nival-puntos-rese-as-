import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {supabaseConfig,supabaseConfigured} from './lib/supabase/config';
export async function proxy(request:NextRequest){
 let response=NextResponse.next({request});
 if(request.nextUrl.pathname.startsWith('/tarjeta/')){response.headers.set('Cache-Control','private, no-store, max-age=0');response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Robots-Tag','noindex, nofollow');return response;}
 if(!supabaseConfigured())return response;
 const {url,key}=supabaseConfig();
 const client=createServerClient(url,key,{cookies:{getAll(){return request.cookies.getAll();},setAll(items){items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
 const {data,error}=await client.auth.getClaims();
 response.headers.set('Cache-Control','private, no-store');
 if(request.nextUrl.pathname.startsWith('/panel')&&(error||!data?.claims)){
 const target=new URL('/acceso',request.url);const redirect=NextResponse.redirect(target);response.cookies.getAll().forEach(c=>redirect.cookies.set(c));redirect.headers.set('Cache-Control','private, no-store');return redirect;
 }
 return response;
}
export const config={matcher:['/tarjeta/:path*','/panel/:path*','/acceso','/auth/:path*']};
