import {entitlements} from '../../lib/foundation/entitlements.mjs';
import {AccountState} from '../../lib/owner/account-state';
import {DashboardShell} from '../../lib/owner/shell';
import {logout} from '../../lib/foundation/actions';
import {RegistrationFields} from "../../lib/foundation/registration-fields";
import {OwnerView} from '../../lib/owner/view';
import {notFound} from 'next/navigation';
import {foundationEnabled,query} from '../../lib/foundation/db';
import {requireRole,requireBusiness} from '../../lib/foundation/session';
import {registerBusiness} from '../../lib/foundation/actions';
import {ActionForm} from '../../lib/foundation/forms';
import {Field} from '../../lib/foundation/fields';
import {ownerData} from '../../lib/owner/data';
import {periodRange} from '../../lib/owner/domain.mjs';
import Legacy from './legacy-page';
export const dynamic='force-dynamic';
export default async function Panel({searchParams}:{searchParams:Promise<{business?:string;kind?:string;period?:string}>}){
 if(!foundationEnabled())return <Legacy/>;
 const actor=await requireRole('owner'),params=await searchParams;
 const businesses=await query(actor,'select b.*,p.name plan_name,p.features from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id order by b.name');
 const b=params.business?businesses.find(x=>x.id===params.business):businesses[0];
 if(params.business&&!b)notFound();
 if(!b)return <main className="dashboard"><h1>Tu primer negocio</h1><p>Registra el negocio para empezar a recibir visitas.</p><ActionForm action={registerBusiness} label="Registrar mi negocio" preserveOnError><RegistrationFields/></ActionForm></main>;
 await requireBusiness(actor,b.id);
 if(!entitlements(b).active)return <DashboardShell name={b.name} owner={actor.name} status="Servicio inactivo" demo={false} logout={<form action={logout}><button>Cerrar sesión</button></form>}><AccountState b={b}/><section className="ownerCard"><h2>Servicio inactivo</h2><p>Los puntos, canjes, clientes y reportes están guardados. Renueva para consultar tus datos y volver a operar.</p></section></DashboardShell>;
 const range=periodRange(params.kind,params.period),data=await ownerData(actor,b.id,range);
 return <OwnerView actor={actor} b={b} businesses={businesses} range={range} data={data}/>;
}
