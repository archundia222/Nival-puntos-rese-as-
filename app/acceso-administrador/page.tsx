import Link from 'next/link';
import AdminAccessForm from './form';
import {redirect} from 'next/navigation';
import {emailActor} from '../../lib/foundation/session';
export const dynamic='force-dynamic';
export default async function AdminAccessPage({searchParams}:{searchParams:Promise<{error?:string}>}){
 const params=await searchParams;
 const actor=await emailActor();
 if(actor?.role==='superadmin')redirect('/admin');
 return <main className="adminAccessShell"><div className="adminAccessIntro"><Link href="/">NIVAL TECH</Link><p>ADMINISTRACIÓN PRIVADA</p><h1>Todo Nival,<br/>en tus manos.</h1><p>Negocios, activaciones y tareas diarias en tu centro de operación.</p><Link href="/">Volver al inicio</Link></div><AdminAccessForm initialError={params.error||''}/></main>;
}