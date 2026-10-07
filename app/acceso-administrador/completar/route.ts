import {NextResponse} from 'next/server';
import {authorizeOwnAdministrator} from '../../../lib/security/admin-access';
import {getAuth} from '../../../lib/backend/auth';

export async function GET() {
  const login='https://nival-puntos-resenas.vercel.app/acceso-administrador';
  try {
    if (!await authorizeOwnAdministrator()) {
      await getAuth().signOut();
      return NextResponse.redirect(login+'?error='+encodeURIComponent('No se pudo validar la sesión privada. Vuelve a iniciar sesión.'),303);
    }
    return NextResponse.redirect('https://nival-puntos-resenas.vercel.app/admin',303);
  } catch (error) {
    console.error('founder session completion failed',error instanceof Error?error.message:'unknown');
    try { await getAuth().signOut(); } catch {}
    return NextResponse.redirect(login+'?error='+encodeURIComponent('No se pudo completar la sesión privada.'),303);
  }
}
