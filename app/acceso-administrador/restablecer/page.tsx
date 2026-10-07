import Link from 'next/link';
import ResetAdminForm from './form';

export const dynamic = 'force-dynamic';
export const metadata = {robots: {index: false, follow: false}, referrer: 'no-referrer'};

export default async function ResetAdminPage({searchParams}:{searchParams:Promise<{token?:string}>}) {
  const {token = ''} = await searchParams;
  return <main className="adminAccessShell"><section className="adminAccessCard">
    <h1>Recupera tu acceso privado</h1>
    {token && token.length <= 2048 ? <ResetAdminForm token={token} /> : <p>El enlace no es válido. Solicita uno nuevo desde el acceso privado.</p>}
    <Link href="/acceso-administrador">Volver al acceso privado</Link>
  </section></main>;
}
