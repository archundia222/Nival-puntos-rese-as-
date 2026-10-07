import Link from 'next/link';
import ResetAdminForm from './form';
export default async function ResetAdminPage({searchParams}:{searchParams:Promise<{token?:string}>}){const {token=''}=await searchParams;return <main className="adminAccessShell"><section className="adminAccessCard"><h1>Recupera tu acceso privado</h1><ResetAdminForm token={token}/><Link href="/acceso-administrador">Volver a mi administración</Link></section></main>;}
