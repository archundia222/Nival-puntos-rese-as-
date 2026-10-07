import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {authorizeOwnAdministrator} from '../../../lib/security/admin-access';
import {getAuth} from '../../../lib/backend/auth';
import {adminCookie,routeCookie,staffCookie} from '../../../lib/foundation/session';

async function clearPrivilegedState(){
  const jar=await cookies();
  jar.delete(adminCookie);
  jar.delete(routeCookie);
  jar.delete(staffCookie);
}

export async function GET() {
  const login='https://nival-puntos-resenas.vercel.app/acceso-administrador';
  try {
    if (!await authorizeOwnAdministrator()) {
      await clearPrivilegedState();
      await getAuth().signOut();
      return NextResponse.redirect(login+'?error='+encodeURIComponent('No se pudo validar la sesión privada. Vuelve a iniciar sesión.'),303);
    }
    return NextResponse.redirect('https://nival-puntos-resenas.vercel.app/admin',303);
  } catch (error) {
    console.error('founder session completion failed',error instanceof Error?error.message:'unknown');
    try { await clearPrivilegedState(); await getAuth().signOut(); } catch {}
    return NextResponse.redirect(login+'?error='+encodeURIComponent('No se pudo completar la sesión privada.'),303);
  }
}
