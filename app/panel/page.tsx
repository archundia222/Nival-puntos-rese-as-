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
 const businesses=await query(actor,'select b.*,p.name plan_name from nival_pr.businesses b left join nival_pr.plans p on p.id=b.plan_id order by b.name');
 const b=params.business?businesses.find(x=>x.id===params.business):businesses[0];
 if(params.business&&!b)notFound();
 if(!b)return <main className="dashboard"><h1>Tu primer negocio</h1><p>Registra el negocio para empezar a recibir visitas.</p><ActionForm action={registerBusiness}><Field name="name" label="Nombre"/><Field name="slug" label="Enlace"/><Field name="giro" label="Giro" required={false}/></ActionForm></main>;
 await requireBusiness(actor,b.id);
 const range=periodRange(params.kind,params.period),data=await ownerData(actor,b.id,range);
 return <OwnerView actor={actor} b={b} businesses={businesses} range={range} data={data}/>;
}
