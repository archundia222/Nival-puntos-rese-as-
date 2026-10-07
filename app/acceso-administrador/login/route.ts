import {NextResponse} from 'next/server';
import {getAuth} from '../../../lib/backend/auth';
import {limitAdminAccess, authorizeOwnAdministrator} from '../../../lib/security/admin-access';
export async function POST(request: Request) {
 const back=new URL('/acceso-administrador',request.url);
 try{
  const form=await request.formData();
  const email=String(form.get('email')||'').trim().toLowerCase();
  const password=String(form.get('password')||'');
  if(!email||!password||password.length>128){back.searchParams.set('error','Escribe tu correo y contraseña.');return NextResponse.redirect(back,303);}
  await limitAdminAccess(email);
  console.log('founder login checkpoint: limiter passed');
  const {error}=await getAuth().signIn.email({email,password});
  console.log('founder login checkpoint: auth returned', Boolean(error));
  if(error){back.searchParams.set('error','Correo o contraseña incorrectos.');return NextResponse.redirect(back,303);}
  if(!await authorizeOwnAdministrator()){await getAuth().signOut();back.searchParams.set('error','La cuenta inició sesión, pero no tiene autorización de fundador.');return NextResponse.redirect(back,303);}
  return NextResponse.redirect(new URL('/admin',request.url),303);
 }catch(error){
  console.error('founder login failed',error instanceof Error?error.message:'unknown');
  back.searchParams.set('error',error instanceof Error&&error.message.includes('15 minutos')?'Espera 15 minutos antes de intentar de nuevo.':'No se pudo completar el acceso.');
  return NextResponse.redirect(back,303);
 }
}