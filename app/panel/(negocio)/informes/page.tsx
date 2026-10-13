import {redirect} from 'next/navigation';
import {createClient} from '../../../../lib/backend/server';
import {backendConfigured} from '../../../../lib/backend/config';
import {readAll} from '../../../../lib/supabase/read-all';
import {businessPlan} from '../../../../lib/business-plan';
import {periodCountFrom,periodLabel,previousPeriods,recentPeriod} from '../../../../lib/periods';

export const dynamic='force-dynamic';

export default async function ReportsPage(){
 if(!backendConfigured())redirect('/acceso');
 const client=await createClient();const{data:claims,error:authError}=await client.auth.getClaims();
 if(authError||!claims?.claims.sub)redirect('/acceso');
 const{data:business,error}=await client.from('npr_businesses').select('id,name,plan').eq('owner_id',claims.claims.sub).maybeSingle();
 if(error)return <main className="dashboard"><h1>Informes</h1><p role="alert">No se pudo consultar tu negocio.</p></main>;
 if(!business)return <main className="dashboard"><h1>Informes</h1><p>Registra tu negocio desde Inicio para continuar.</p><a href="/panel">Ir a Inicio</a></main>;
 const plan=businessPlan(business.plan);
 const[customers,movements,reviews]=await Promise.all([
  readAll((start,end)=>client.from('npr_customers').select('created_at').eq('business_id',business.id).order('created_at').range(start,end)),
  readAll((start,end)=>client.from('npr_movements').select('happened_at').eq('business_id',business.id).order('happened_at').range(start,end)),
  plan==='puntos'?Promise.resolve({data:[],error:null}):readAll((start,end)=>client.from('npr_reviews').select('review_date').eq('business_id',business.id).order('review_date').range(start,end)),
 ]);
 if(customers.error||movements.error||reviews.error)return <main className="dashboard"><h1>Informes</h1><section className="panelState panelError"><p role="alert">No se pudo cargar el historial. Inténtalo nuevamente.</p><a href="/panel/informes">Volver a cargar</a></section></main>;
 const dates=[...(customers.data||[]).map(item=>item.created_at),...(movements.data||[]).map(item=>item.happened_at),...(reviews.data||[]).map(item=>item.review_date)].filter(Boolean);
 const earliest=dates.sort()[0];
 const periodCount=earliest?periodCountFrom(earliest):1;
 const periods=[recentPeriod(),...previousPeriods(periodCount-1)];
 return <main className="dashboard reportsDashboard"><header className="dashHead"><div><small>NIVAL · INFORMES</small><h1>Informes</h1><p>Resumen calculado de cada periodo de 30 días. Puedes imprimirlo o guardarlo como PDF.</p></div></header>
  {!dates.length&&<p className="empty">Aún no hay actividad registrada. El periodo actual aparece para que puedas consultar el resumen cuando existan datos.</p>}
  <div className="reportPeriodList">{periods.map((period,index)=><a key={period.start} href={`/panel/reporte?desde=${period.start}&hasta=${period.end}`} className="reportPeriodCard"><span>{index===0?'Periodo actual':`Periodo ${index}`}</span><strong>{periodLabel(period)}</strong><span className="reportOpen">Abrir informe <b aria-hidden="true">→</b></span></a>)}</div>
  <p className="notice">Los informes se calculan con los registros guardados. No se almacenan archivos PDF.</p>
 </main>;
}
