import {redirect} from 'next/navigation';
import {createClient} from '../../../../lib/backend/server';
import {backendConfigured} from '../../../../lib/backend/config';
import {readAll} from '../../../../lib/supabase/read-all';
import {validMonth,rangeReport,mexicoDate} from '../../../../lib/monthly-report';
import {businessPlan} from '../../../../lib/business-plan';
import {DatePeriod,calendarDaysBetween,isInPeriod,periodLabel,recentPeriod} from '../../../../lib/periods';
import {PrintButton} from './print-button';

export const dynamic='force-dynamic';
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;

export default async function Report({searchParams}:{searchParams:Promise<{mes?:string;desde?:string;hasta?:string}>}){
 if(!backendConfigured())redirect('/acceso');
 const client=await createClient();const{data:claims,error:authError}=await client.auth.getClaims();
 if(authError||!claims?.claims.sub)redirect('/acceso');
 const{data:business,error:businessError}=await client.from('npr_businesses').select('id,name,plan').eq('owner_id',claims.claims.sub).maybeSingle();
 if(businessError)return <main className="dashboard"><h1>Informe</h1><p role="alert">No se pudo consultar tu negocio.</p><a href="/panel/informes">Volver a Informes</a></main>;
 if(!business)redirect('/panel');
 const plan=businessPlan(business.plan);const params=await searchParams;const today=mexicoDate();
 let period:DatePeriod;let currentMonth:string|undefined;
 if(params.mes){
  const month=params.mes;currentMonth=today.slice(0,7);
  if(!validMonth(month)||month>currentMonth)return <main className="dashboard"><h1>Informe</h1><p role="alert">Elige un mes válido, hasta el mes actual.</p><a href="/panel/informes">Volver a Informes</a></main>;
  const [year,monthNumber]=month.split('-').map(Number);const last=new Date(Date.UTC(year,monthNumber,0)).toISOString().slice(0,10);
  period={start:`${month}-01`,end:last};
 } else if(params.desde||params.hasta){
  if(!params.desde||!params.hasta||!validDate(params.desde)||!validDate(params.hasta)||params.hasta>today||calendarDaysBetween(params.desde,params.hasta)!==29)return <main className="dashboard"><h1>Informe</h1><p role="alert">Este periodo no es válido. Vuelve a elegirlo desde Informes.</p><a href="/panel/informes">Volver a Informes</a></main>;
  period={start:params.desde,end:params.hasta};
 } else period=recentPeriod();
 const[customers,movements,reviews,diagnostics]=await Promise.all([
  readAll((start,end)=>client.from('npr_customers').select('id,created_at').eq('business_id',business.id).order('id').range(start,end)),
  readAll((start,end)=>client.from('npr_movements').select('customer_id,kind,points,happened_at').eq('business_id',business.id).order('id').range(start,end)),
  plan==='puntos'?Promise.resolve({data:[],error:null}):readAll((start,end)=>client.from('npr_reviews').select('rating,review_date,answered_at').eq('business_id',business.id).order('id').range(start,end)),
  plan==='puntos'?Promise.resolve({data:[],error:null}):readAll((start,end)=>client.from('npr_diagnostics').select('checked_on,rating,review_count,findings,recommendations').eq('business_id',business.id).order('checked_on',{ascending:false}).order('id').range(start,end)),
 ]);
 if(customers.error||movements.error||reviews.error||diagnostics.error)return <main className="dashboard"><h1>Informe</h1><section className="panelState panelError"><p role="alert">No se pudo cargar el historial completo. Inténtalo nuevamente.</p><a href="/panel/informes">Volver a Informes</a></section></main>;
 const report=rangeReport(customers.data||[],movements.data||[],reviews.data||[],period.start,period.end);
 const responseCount=(reviews.data||[]).filter(review=>review.answered_at&&isInPeriod(review.answered_at,period)).length;
 const diagnosis=(diagnostics.data||[]).find(item=>isInPeriod(item.checked_on,period));
 const quota=plan==='plus'?100:30;
 const label=currentMonth?new Intl.DateTimeFormat('es-MX',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${currentMonth}-01T12:00:00Z`)):periodLabel(period);
 const pointsStats=[['Clientes nuevos',report.newCustomers],['Visitas registradas',report.visits],['Clientes que regresaron',report.returning],['Premios canjeados',report.redemptions]] as const;
 return <main className="dashboard monthlyReport periodReport"><header className="dashHead"><div><small>NIVAL · INFORME</small><h1>{business.name}</h1><p>{label} · {currentMonth?'vista mensual anterior':`Periodo ${periodLabel(period)}`}</p></div><a className="noPrint" href="/panel/informes">Volver a Informes</a></header>
  <div className="reportControls noPrint"><PrintButton/></div>
  <section className="stats">{pointsStats.map(([name,value])=><article key={name}><span>{name}</span><b>{value}</b></article>)}</section>
  {plan!=='puntos'&&<>
   <section className="reviewBox"><h2>Reseñas</h2><div className="stats reportReviewStats">{[['Nuevas',report.reviews],['Contestadas',report.answered],['Pendientes',report.pending],['Respuestas usadas',`${responseCount}/${quota}`],['Calificación promedio',report.average===null?'—':`${report.average.toFixed(1)} / 5`]].map(([name,value])=><article key={name}><span>{name}</span><b>{value}</b></article>)}</div><p>{report.positive} comentarios buenos · {report.negative} malos.</p></section>
   <section className="reviewBox"><h2>Resumen de reseñas</h2>{diagnosis?<><p>Revisión del {diagnosis.checked_on}: calificación {diagnosis.rating} / 5 · {diagnosis.review_count} reseñas totales en Google.</p><h3>Áreas de mejora</h3><p className="preserveLines">{diagnosis.findings}</p><h3>Consejos</h3><p className="preserveLines">{diagnosis.recommendations}</p></>:<p>No hay resumen manual de la ficha registrado en este periodo.</p>}</section>
   <section className="reviewBox"><h2>Recomendaciones</h2><ul>{report.recommendations.map(text=><li key={text}>{text}</li>)}</ul></section>
  </>}
  {plan==='plus'&&<section className="panelState comparisonSoon"><span className="comingSoon">Próximamente</span><h2>Comparación de tu zona</h2><p>La comparación aparecerá después de completar su fase de construcción.</p></section>}
  <p className="notice">Calculado con los registros disponibles. Las visitas se agrupan con el horario de Ciudad de México. El informe se genera al abrirlo y no se almacena como archivo.</p>
 </main>;
}
