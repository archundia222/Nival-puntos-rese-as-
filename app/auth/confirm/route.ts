import {NextResponse,type NextRequest} from 'next/server';
import {createClient} from '../../../lib/supabase/server';
import {supabaseConfigured} from '../../../lib/supabase/config';
import {confirmEmail} from '../../../lib/auth-confirm';
export async function GET(request:NextRequest){
 let destination=request.nextUrl.searchParams.get('type')==='recovery'||request.nextUrl.searchParams.get('flow')==='recovery'?'/acceso?recuperacion=error':'/acceso?confirmacion=error';
 if(supabaseConfigured())try{const client=await createClient();destination=await confirmEmail(client.auth,request.nextUrl.searchParams);}catch{/* Generic recovery state. */}
 const response=NextResponse.redirect(new URL(destination,request.url));
 response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');return response;
}
