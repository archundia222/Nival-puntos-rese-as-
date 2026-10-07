import Link from 'next/link';
import AdminAccessForm from './form';
export const dynamic='force-dynamic';
export default function AdminAccessPage(){return <main className="adminAccessShell"><div className="adminAccessIntro"><Link href="/">NIVAL TECH</Link><p>ADMINISTRACIÓN PRIVADA</p><h1>Todo Nival,<br/>en tus manos.</h1><p>Negocios, activaciones y tareas diarias en tu centro de operación.</p><Link href="/">Volver al inicio</Link></div><AdminAccessForm/></main>;}
