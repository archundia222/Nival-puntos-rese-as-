import {redirect} from 'next/navigation';
import {backendConfigured} from '../../lib/backend/config';
import {currentActor} from '../../lib/foundation/session';
import AdminAccessForm from './form';

export const dynamic='force-dynamic';

export default async function AdminAccess(){
 if(!backendConfigured())redirect('/demo/admin');
 const actor=await currentActor();
 if(actor?.role==='superadmin')redirect('/admin');
 if(actor)return <main className="dashboard authShell"><header className="dashHead authHead"><div><small>NIVAL · ADMINISTRACIÓN</small><h1>Acceso de administrador</h1><p>La sesión actual pertenece a un negocio y no tiene permisos de administrador.</p></div><div className="actions"><a href="/panel">Volver a mi panel</a><a href="/">Inicio</a></div></header><section className="reviewBox"><h2>Cuenta de negocio activa</h2><p>Para entrar como administrador, cierra la sesión del negocio y usa una cuenta con rol superadmin.</p></section></main>;
 return <main className="dashboard authShell"><header className="dashHead authHead"><div><small>NIVAL · ADMINISTRACIÓN</small><h1>Panel de administrador</h1><p>Acceso separado del registro y panel de los negocios.</p></div><div className="actions"><a href="/">Inicio</a></div></header><AdminAccessForm/></main>;
}