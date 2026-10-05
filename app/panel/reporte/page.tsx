import {redirect} from 'next/navigation';
import {createClient} from '../../../lib/supabase/server';
import {supabaseConfigured} from '../../../lib/supabase/config';
import {readAll} from '../../../lib/supabase/read-all';
import {mexicoDate,monthlyReport,validMonth} from '../../../lib/monthly-report';
import {PrintButton} from './print-button';
export const dynamic='force-dynamic';
export default async function Report({searchParams}:{searchParams:Promise<{mes?:string}>}){
 if(!supabaseConfigured())redirect('/acceso');
 const client=await createClient();const{data,error}=await client.auth.getClaims();if(error||!data?.claims.sub)redirect('/acceso');
 const{data:business,error:businessError}=await client.from('npr_businesses').select('id,name').eq('owner_id',data.claims.sub).maybeSingle();
 if(businessError)return <main className="dashboard"><h1>Resumen mensual</h1><p role="alert">No se pudo consultar tu negocio.</p><a href="/panel">Volver al panel</a></main>;
 if(!business)redirect('/panel');
 const today=mexicoDate();const currentMonth=today.slice(0,7);const{mes}=await searchParams;const month=mes??currentMonth;
 if(!validMonth(month)||month>currentMonth)return <main className="dashboard"><h1>Resumen mensual</h1><p role="alert">Elige un mes válido, hasta el mes actual.</p><a href="/panel/reporte">Volver al resumen</a></main>;
 const[customers,movements,reviews]=await Promise.all([
 readAll((start,end)=>client.from('npr_customers').select('id,created_at').eq('business_id',business.id).order('id').range(start,end)),
 readAll((start,end)=>client.from('npr_movements').select('customer_id,kind,points,happened_at').eq('business_id',business.id).order('id').range(start,end)),
 readAll((start,end)=>client.from('npr_reviews').select('rating,review_date,answered_at').eq('business_id',business.id).order('id').range(start,end))]);
 if(customers.error||movements.error||reviews.error)return <main className="dashboard"><h1>Resumen mensual</h1><p role="alert">No se pudo cargar el historial completo. Inténtalo nuevamente.</p><a href="/panel">Volver al panel</a></main>;
 const report=monthlyReport(customers.data||[],movements.data||[],reviews.data||[],month);
 const label=new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`));
 return <main className="dashboard monthlyReport"><header className="dashHead"><div><small>NIVAL · RESUMEN MENSUAL</small><h1>{business.name}</h1><p>{label} · Generado el {today}</p></div><a className="noPrint" href="/panel">Volver al panel</a></header><form className="reportControls noPrint" method="get"><label>Mes del resumen<input required type="month" name="mes" defaultValue={month} max={currentMonth}/></label><button>Consultar mes</button><PrintButton/></form>{month===currentMonth&&<p className="demoNotice">Mes en curso: los resultados pueden cambiar conforme se registren visitas y reseñas.</p>}<section className="stats">{[['Clientes nuevos',report.newCustomers],['Visitas registradas',report.visits],['Clientes que regresaron',report.returning],['Premios canjeados',report.redemptions],['Reseñas nuevas',report.reviews],['Respuestas confirmadas',report.answered]].map(([name,value])=><article key={name}><span>{name}</span><b>{value}</b></article>)}</section><section className="reviewBox"><h2>Experiencias en Google</h2><p>{report.positive} positivas · {report.neutral} neutrales · {report.negative} negativas.</p><p>{report.pending} respuestas pendientes. Promedio de las reseñas capturadas del mes: {report.average===null?'Sin reseñas':`${report.average.toFixed(1)} / 5`}.</p><p>Este promedio corresponde a las reseñas registradas aquí; la calificación general de la ficha de Google requiere un diagnóstico por separado. Las respuestas se confirman después de publicarse manualmente en Google.</p></section><section className="reviewBox"><h2>Recomendaciones para el siguiente mes</h2><ul>{report.recommendations.map(r=><li key={r}>{r}</li>)}</ul></section><p className="notice">Calculado a partir del historial disponible. Las visitas se agrupan con el horario de Ciudad de México. Clientes que regresaron: clientes con una visita durante el mes posterior a otra visita registrada. Las respuestas pendientes reflejan el estado actual de las reseñas de ese mes.</p></main>;
}
