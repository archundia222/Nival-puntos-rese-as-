import {requireRole,requireBusiness} from '../../../lib/foundation/session';
import {query} from '../../../lib/foundation/db';
import {requireTool} from '../../../lib/foundation/require-tool';
import {DashboardShell} from '../../../lib/owner/shell';
import {Scanner} from '../../../lib/points/scanner';
import {logout} from '../../../lib/foundation/actions';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Operate({searchParams}:{searchParams:Promise<{business?:string;view?:string}>}){
 const actor=await requireRole('owner'),params=await searchParams;
 const rows=await query(actor,'select id,name from nival_pr.businesses order by name');
 const b=params.business?rows.find(b=>b.id===params.business):rows[0];
 if(!b)notFound();await requireBusiness(actor,b.id);
 const active=await requireTool(actor,b.id).then(()=>true).catch(()=>false);
 const mode=params.view==='canjear'?'redeem':'visit';
 return <DashboardShell name={b.name} owner={actor.name} status={active?'Activo':'Servicio inactivo'} demo={false} initialSection="operar" homeUrl={'/panel?business='+b.id} logout={<form action={logout}><button>Cerrar sesión</button></form>}><main className="dashboard programWorkspace">{active?<><p>Tú también puedes atender a tus clientes. Cada movimiento se guarda con tu nombre.</p><nav className="programTabs" aria-label="Operaciones de tarjeta"><a aria-current={mode==='visit'?'page':undefined} href={'?business='+b.id}>Sumar puntos</a><a aria-current={mode==='redeem'?'page':undefined} href={'?business='+b.id+'&view=canjear'}>Canjear premio</a><a href={'/panel/puntos?business='+b.id+'&view=canjes'}>Revisar canjes</a></nav><Scanner key={mode} businessId={b.id} mode={mode}/></>:<section className="reviewBox"><h2>Renueva para volver a operar</h2><p>Los puntos y premios se conservan.</p><a href={'/panel?business='+b.id}>Ver mi servicio y activar</a></section>}</main></DashboardShell>;
}
