import {NextResponse} from 'next/server';
export async function POST() {
  return NextResponse.redirect('https://nival-puntos-resenas.vercel.app/acceso-administrador',303);
}
