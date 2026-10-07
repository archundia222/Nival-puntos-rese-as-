import {NextResponse} from 'next/server';
import {getAuth} from '../../../lib/backend/auth';
import {limitAdminAccess, authorizeOwnAdministrator} from '../../../lib/security/admin-access';
export async function POST(request: Request) {
 const back='https://nival-puntos-resenas.vercel.app/acceso-administrador';
 try{
  const form=await request.formData();
  const email=String(form.get('email')||'').trim().toLowerCase();
  const password=String(form.get('password')||'');
  if(!email||!password||password.length>128){return NextResponse.redirect(back+'?error='+encodeURIComponent('Escribe tu correo y contraseña.'),303);}
  await limitAdminAccess(email);
  console.log('founder login checkpoint: limiter passed');
  const {error}=await getAuth().signIn.email({email,password});
  console.log('founder login checkpoint: auth returned', Boolean(error), error ? {message:error.message,status:'status' in error?error.status:undefined,code:'code' in error?error.code:undefined} : null);
  if(error){return NextResponse.redirect(back+'?error='+encodeURIComponent('Correo o contraseña incorrectos.'),303);}
  if(!await authorizeOwnAdministrator()){await getAuth().signOut();return NextResponse.redirect(back+'?error='+encodeURIComponent('La cuenta inició sesión, pero no tiene autorización de fundador.'),303);}
  return NextResponse.redirect('https://nival-puntos-resenas.vercel.app/admin',303);
 }catch(error){
  console.error('founder login failed',error instanceof Error?error.message:'unknown');
  const message=error instanceof Error&&error.message.includes('15 minutos')?'Espera 15 minutos antes de intentar de nuevo.':'No se pudo completar el acceso.';
  return NextResponse.redirect(back+'?error='+encodeURIComponent(message),303);
 }
}