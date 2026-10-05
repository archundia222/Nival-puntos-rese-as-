import {type EmailOtpType} from '@supabase/supabase-js';
import {NextResponse,type NextRequest} from 'next/server';
import {createClient} from '../../../lib/supabase/server';
import {supabaseConfigured} from '../../../lib/supabase/config';
export async function GET(request:NextRequest){const token_hash=request.nextUrl.searchParams.get('token_hash');const type=request.nextUrl.searchParams.get('type');if(supabaseConfigured()&&token_hash&&type==='signup'){const client=await createClient();const{error}=await client.auth.verifyOtp({token_hash,type:type as EmailOtpType});if(!error)return NextResponse.redirect(new URL('/panel',request.url));}return NextResponse.redirect(new URL('/acceso',request.url));}
