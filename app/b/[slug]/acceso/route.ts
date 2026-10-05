import {NextResponse} from 'next/server';
import {query,authScope,foundationEnabled} from '../../../../lib/foundation/db';
import {cookieOptions} from '../../../../lib/foundation/session';
import {sha256} from '../../../../lib/foundation/security.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const url=new URL(request.url),token=url.searchParams.get('token')||'';
 if(!foundationEnabled()||!/^[A-Za-z0-9_-]{43}$/.test(token))return NextResponse.redirect(new URL('/b/'+slug,request.url));
 const [row]=await query(authScope(),'select nival_pr_private.public_business($1) as data',[slug]);
 if(!row?.data)return new NextResponse('Negocio no encontrado',{status:404});
 const [valid]=await query(authScope(),'select nival_pr_private.customer_token_valid($1,$2) as valid',[row.data.id,sha256(token)]);
 const response=NextResponse.redirect(new URL('/b/'+slug,request.url));
 if(valid?.valid)response.cookies.set('nival_customer_'+row.data.id,token,{...cookieOptions,maxAge:365*86400});
 response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');return response;
}
